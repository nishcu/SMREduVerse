import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import CashfreeService from '@/lib/cashfree';
import type { PaymentOrder } from '@/lib/types';

export async function POST(request: NextRequest) {
    try {
        const { itemType, itemId, amount, currency = 'INR' } = await request.json();

        // Validate required fields
        if (!itemType || !itemId || !amount) {
            return NextResponse.json(
                { error: 'Missing required fields: itemType, itemId, amount' },
                { status: 400 }
            );
        }

        // Get Firebase auth token from request
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await getAdminAuth().verifyIdToken(idToken);
        const userId = decodedToken.uid;

        // Get user details
        const db = getAdminDb();
        const userDoc = await db.collection('users').doc(userId).collection('profile').doc(userId).get();

        if (!userDoc.exists) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        const userData = userDoc.data();
        const userEmail = userData?.email || decodedToken.email;
        const userPhone = userData?.mobileNumber || '9999999999'; // Default fallback
        const userName = userData?.name || 'User';

        // Generate unique order ID
        const orderId = CashfreeService.generateOrderId('GENZEERR');

        // Create payment order with Cashfree
        const cashfreeOrder = await CashfreeService.createOrder({
            orderId,
            orderAmount: parseFloat(amount),
            orderCurrency: currency,
            customerDetails: {
                customerId: userId,
                customerEmail: userEmail,
                customerPhone: userPhone,
                customerName: userName,
            },
            orderMeta: {
                returnUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/checkout/success`,
                notifyUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/payments/webhook`,
            },
        });

        // Store payment order in Firestore
        const paymentOrder: Omit<PaymentOrder, 'id'> = {
            orderId: cashfreeOrder.orderId,
            userId,
            amount: cashfreeOrder.orderAmount,
            currency: cashfreeOrder.orderCurrency,
            status: 'PENDING',
            itemType,
            itemId,
            createdAt: new Date(),
            updatedAt: new Date(),
            cashfreeOrderId: cashfreeOrder.orderId,
        };

        const paymentRef = await db.collection('payments').add(paymentOrder);

        return NextResponse.json({
            success: true,
            data: {
                orderId: cashfreeOrder.orderId,
                orderToken: cashfreeOrder.orderToken,
                paymentSessionId: cashfreeOrder.paymentSessionId,
                paymentId: paymentRef.id,
            },
        });

    } catch (error) {
        console.error('Error creating payment order:', error);
        return NextResponse.json(
            { error: 'Failed to create payment order' },
            { status: 500 }
        );
    }
}
