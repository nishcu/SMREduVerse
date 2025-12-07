import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { getAdminAuth } from '@/lib/firebase-admin';
import { verifyCashfreeOrder } from '@/lib/payments/cashfree';

const BodySchema = z.object({
  orderId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const decoded = await authenticate(request);
    const payload = await request.json();
    const parsed = BodySchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid verification payload.' },
        { status: 400 }
      );
    }

    const verification = await verifyCashfreeOrder(parsed.data.orderId, decoded.uid);
    return NextResponse.json({ success: true, status: verification.status, data: verification });
  } catch (error: any) {
    if (error?.message === 'UNAUTHENTICATED') {
      return NextResponse.json(
        { success: false, error: 'Authentication required.' },
        { status: 401 }
      );
    }

    console.error('Cashfree verify error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Unable to verify payment.' },
      { status: 500 }
    );
  }
}

async function authenticate(request: NextRequest) {
  const token = extractToken(request);
  if (!token) {
    throw new Error('UNAUTHENTICATED');
  }
  const auth = getAdminAuth();
  return auth.verifyIdToken(token);
}

function extractToken(request: NextRequest) {
  const header = request.headers.get('authorization');
  if (header?.startsWith('Bearer ')) {
    return header.slice(7);
  }
  return cookies().get('idToken')?.value || null;
}
