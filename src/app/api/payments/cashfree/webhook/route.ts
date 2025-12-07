import { NextResponse } from 'next/server';
import { verifyCashfreeWebhook } from '@/lib/cashfree';
import { finalizeCashfreeOrder } from '@/lib/cashfree-order-service';
import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-webhook-signature');

  try {
    const isValid = verifyCashfreeWebhook(signature, rawBody);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 401 });
    }
  } catch (error: any) {
    console.error('Cashfree webhook signature verification failed:', error);
    return NextResponse.json({ error: error?.message || 'Signature verification failed.' }, { status: 500 });
  }

  try {
    const payload = JSON.parse(rawBody);
    const orderId = payload?.data?.order?.order_id;
    const orderStatus = payload?.data?.order?.order_status;

    if (!orderId) {
      return NextResponse.json({ error: 'Invalid webhook payload.' }, { status: 400 });
    }

    if (orderStatus !== 'PAID') {
      await updateOrderStatus(orderId, orderStatus || 'FAILED', payload);
      return NextResponse.json({ success: true });
    }

    await finalizeCashfreeOrder(orderId, payload, 'webhook');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Cashfree webhook handling failed:', error);
    return NextResponse.json({ error: error?.message || 'Webhook processing failed.' }, { status: 500 });
  }
}

async function updateOrderStatus(orderId: string, status: string, payload: any) {
  const db = getAdminDb();
  await db
    .collection('cashfreeOrders')
    .doc(orderId)
    .set(
      {
        status,
        lastWebhookPayload: payload,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
}
