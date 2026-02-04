import { NextResponse } from 'next/server';
import { Cashfree, CFEnvironment } from 'cashfree-pg';

export async function GET() {
    try {
        console.log('Testing Cashfree connection...');
        console.log('Environment:', process.env.CASHFREE_ENVIRONMENT);
        console.log('Client ID present:', !!process.env.CASHFREE_CLIENT_ID);
        console.log('Client Secret present:', !!process.env.CASHFREE_CLIENT_SECRET);

        const cashfree = new Cashfree(
            process.env.CASHFREE_ENVIRONMENT === 'production'
                ? CFEnvironment.PRODUCTION
                : CFEnvironment.SANDBOX,
            process.env.CASHFREE_CLIENT_ID,
            process.env.CASHFREE_CLIENT_SECRET
        );

        // Try a simple API call to test authentication
        console.log('🧪 Testing Cashfree API call...');

        try {
            // This will fail but will tell us if auth works
            await cashfree.PGCreateOrder('2023-08-01', {
                order_id: 'test_' + Date.now(),
                order_amount: 1,
                order_currency: 'INR',
                customer_details: {
                    customer_id: 'test_customer',
                    customer_email: 'test@example.com',
                    customer_phone: '9999999999'
                }
            });

            return NextResponse.json({
                status: 'success',
                message: 'Cashfree authentication successful'
            });

        } catch (apiError: any) {
            console.log('🚨 API Error details:', {
                status: apiError.response?.status,
                statusText: apiError.response?.statusText,
                message: apiError.message,
                data: apiError.response?.data,
                url: apiError.config?.url,
                method: apiError.config?.method
            });

            if (apiError.response?.status === 401) {
                return NextResponse.json({
                    status: 'auth_failed',
                    message: 'Cashfree authentication failed - invalid credentials or environment mismatch',
                    error: apiError.message,
                    details: apiError.response?.data,
                    suggestion: 'Check if production credentials are being used with sandbox environment or vice versa'
                }, { status: 401 });
            }

            if (apiError.response?.status === 403) {
                return NextResponse.json({
                    status: 'forbidden',
                    message: 'Cashfree access forbidden - check account permissions',
                    error: apiError.message,
                    details: apiError.response?.data,
                    suggestion: 'Contact Cashfree support - your account may not have production access'
                }, { status: 403 });
            }

            return NextResponse.json({
                status: 'api_error',
                message: 'Cashfree API error',
                error: apiError.message,
                details: apiError.response?.data
            }, { status: 500 });
        }

    } catch (error: any) {
        console.error('Test setup error:', error);
        return NextResponse.json({
            status: 'setup_error',
            message: 'Failed to initialize Cashfree client',
            error: error.message
        }, { status: 500 });
    }
}
