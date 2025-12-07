import { Cashfree } from 'cashfree-pg';

let isCashfreeInitialized = false;

function initializeCashfree() {
    if (isCashfreeInitialized) return;

    const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
    const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
    const CASHFREE_ENVIRONMENT = process.env.CASHFREE_ENVIRONMENT || 'sandbox';

    const isCashfreeConfigured = CASHFREE_APP_ID && CASHFREE_SECRET_KEY;

    if (isCashfreeConfigured) {
        // Initialize Cashfree
        Cashfree.XClientId = CASHFREE_APP_ID;
        Cashfree.XClientSecret = CASHFREE_SECRET_KEY;
        Cashfree.XEnvironment = CASHFREE_ENVIRONMENT === 'production'
            ? Cashfree.Environment.PRODUCTION
            : Cashfree.Environment.SANDBOX;
        isCashfreeInitialized = true;
    } else {
        throw new Error('Cashfree credentials not configured');
    }
}

export interface CreateOrderRequest {
    orderId: string;
    orderAmount: number;
    orderCurrency: string;
    customerDetails: {
        customerId: string;
        customerEmail: string;
        customerPhone: string;
        customerName?: string;
    };
    orderMeta?: {
        returnUrl?: string;
        notifyUrl?: string;
        paymentMethods?: string;
    };
}

export interface PaymentOrder {
    orderId: string;
    orderAmount: number;
    orderCurrency: string;
    customerDetails: {
        customerId: string;
        customerEmail: string;
        customerPhone: string;
        customerName?: string;
    };
    orderStatus: string;
    orderToken?: string;
    paymentSessionId?: string;
    createdAt: Date;
}

export class CashfreeService {
    /**
     * Create a payment order
     */
    static async createOrder(request: CreateOrderRequest): Promise<PaymentOrder> {
        initializeCashfree();

        try {
            const createOrderRequest = {
                order_id: request.orderId,
                order_amount: request.orderAmount,
                order_currency: request.orderCurrency,
                customer_details: {
                    customer_id: request.customerDetails.customerId,
                    customer_email: request.customerDetails.customerEmail,
                    customer_phone: request.customerDetails.customerPhone,
                    customer_name: request.customerDetails.customerName,
                },
                order_meta: {
                    return_url: request.orderMeta?.returnUrl,
                    notify_url: request.orderMeta?.notifyUrl,
                    payment_methods: request.orderMeta?.paymentMethods,
                },
            };

            const response = await Cashfree.PGCreateOrder("2023-08-01", createOrderRequest);

            if (response.status !== "SUCCESS") {
                throw new Error(`Cashfree order creation failed: ${response.message}`);
            }

            return {
                orderId: response.data.order_id,
                orderAmount: response.data.order_amount,
                orderCurrency: response.data.order_currency,
                customerDetails: {
                    customerId: response.data.customer_details.customer_id,
                    customerEmail: response.data.customer_details.customer_email,
                    customerPhone: response.data.customer_details.customer_phone,
                    customerName: response.data.customer_details.customer_name,
                },
                orderStatus: response.data.order_status,
                orderToken: response.data.order_token,
                paymentSessionId: response.data.payment_session_id,
                createdAt: new Date(),
            };
        } catch (error) {
            console.error('Error creating Cashfree order:', error);
            throw new Error('Failed to create payment order');
        }
    }

    /**
     * Get order status
     */
    static async getOrderStatus(orderId: string) {
        initializeCashfree();

        try {
            const response = await Cashfree.PGFetchOrder("2023-08-01", orderId);

            if (response.status !== "SUCCESS") {
                throw new Error(`Failed to fetch order status: ${response.message}`);
            }

            return response.data;
        } catch (error) {
            console.error('Error fetching order status:', error);
            throw new Error('Failed to fetch payment status');
        }
    }

    /**
     * Verify payment signature (for webhook verification)
     */
    static verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
        try {
            const crypto = require('crypto');
            const expectedSignature = crypto
                .createHmac('sha256', secret)
                .update(payload)
                .digest('hex');

            return signature === expectedSignature;
        } catch (error) {
            console.error('Error verifying webhook signature:', error);
            return false;
        }
    }

    /**
     * Generate unique order ID
     */
    static generateOrderId(prefix: string = 'ORDER'): string {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `${prefix}_${timestamp}_${random}`;
    }
}

export default CashfreeService;
