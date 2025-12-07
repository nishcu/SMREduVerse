import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { getCashfreeOrder } from '@/lib/cashfree';
import { finalizeCashfreeOrder } from '@/lib/cashfree-order-service';
import type { CashfreeOrderRecord } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  idToken: z.string().min(1, 'idToken is required'),
  orderId: z.string().min(1, 'orderId is required'),
});

export async function POST(request: Request) {
  try {
    const json = await request.json().catch(() => null);
    const validated = bodySchema.safeParse(json);

    if (!validated.success) {
      return NextResponse.json({ error: 'Invalid request payload.' }, { status: 400 });
    }

    const { idToken, orderId } = validated.data;

    const auth = getAdminAuth();
    const db = getAdminDb();

    const decoded = await auth.verifyIdToken(idToken);
    const uid = decoded.uid;

    const orderRef = db.collection('cashfreeOrders').doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    const order = orderSnap.data()! as CashfreeOrderRecord;

    if (order.userId !== uid) {
      return NextResponse.json({ error: 'You are not authorized to confirm this order.' }, { status: 403 });
    }

    if (order.status === 'PAID' && order.benefitsApplied) {
      return NextResponse.json({
        success: true,
        alreadyProcessed: true,
        itemType: order.itemType,
      });
    }

    const cashfreeOrder = await getCashfreeOrder(orderId);

    if (cashfreeOrder.order_status !== 'PAID') {
      return NextResponse.json(
        {
          error: 'Payment is still pending with Cashfree.',
          status: cashfreeOrder.order_status,
        },
        { status: 409 }
      );
    }

    const finalizeResult = await finalizeCashfreeOrder(orderId, cashfreeOrder, 'confirm');

    return NextResponse.json({
      success: true,
      alreadyProcessed: finalizeResult.alreadyProcessed,
      itemType: order.itemType,
      applyResult: finalizeResult.applyResult,
    });
  } catch (error: any) {
    console.error('Cashfree confirmation failed:', error);
    const message = error?.message || 'Unable to confirm payment.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
