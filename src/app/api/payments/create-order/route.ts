import { NextRequest, NextResponse } from 'next/server';
import { Cashfree, CFEnvironment } from 'cashfree-pg';

export async function POST(request: NextRequest) {
    try {
        const { itemType, itemId, amount } = await request.json();

        if (!itemType || !itemId || !amount) {
            return NextResponse.json(
                { error: 'Missing required fields: itemType, itemId, amount' },
                { status: 400 }
            );
        }

        // Initialize Cashfree
        console.log('Initializing Cashfree with environment:', process.env.CASHFREE_ENVIRONMENT);
        console.log('Client ID:', process.env.CASHFREE_CLIENT_ID ? `${process.env.CASHFREE_CLIENT_ID.substring(0, 10)}...` : 'Missing');
        console.log('Client Secret:', process.env.CASHFREE_CLIENT_SECRET ? `${process.env.CASHFREE_CLIENT_SECRET.substring(0, 10)}...` : 'Missing');

        const cashfree = new Cashfree(
            process.env.CASHFREE_ENVIRONMENT === 'production'
                ? CFEnvironment.PRODUCTION
                : CFEnvironment.SANDBOX,
            process.env.CASHFREE_CLIENT_ID,
            process.env.CASHFREE_CLIENT_SECRET
        );
        console.log('Cashfree initialized successfully');

        // Generate unique order ID
        const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Create order request
        const orderRequest = {
            order_id: orderId,
            order_amount: parseFloat(amount.toString()),
            order_currency: 'INR',
            customer_details: {
                customer_id: `user_${itemId}`,
                customer_email: 'user@example.com', // This should be dynamic
                customer_phone: '9999999999', // This should be dynamic
            },
            order_meta: {
                return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout-dynamic/success?order_id={order_id}`,
                notify_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payments/webhook`,
            },
            order_tags: {
                item_type: itemType,
                item_id: itemId,
            },
        };

        // Create order using Cashfree SDK
        console.log('Creating order with request:', orderRequest);
        let response;
        try {
            response = await cashfree.PGCreateOrder('2023-08-01', orderRequest);
            console.log('Cashfree response:', response);
        } catch (error: any) {
            console.error('Cashfree API error:', error);
            console.error('Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                config: {
                    url: error.config?.url,
                    method: error.config?.method,
                    headers: error.config?.headers
                }
            });
            return NextResponse.json(
                {
                    error: 'Failed to create payment order',
                    details: error.message,
                    cashfree_status: error.response?.status
                },
                { status: 500 }
            );
        }

        if (!response || !response.data) {
            console.error('Cashfree order creation failed:', response);
            return NextResponse.json(
                { error: 'Failed to create payment order' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            order_id: response.data.order_id,
            payment_session_id: response.data.payment_session_id,
            order_amount: response.data.order_amount,
            order_currency: response.data.order_currency,
        });

    } catch (error) {
        console.error('Error creating payment order:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
