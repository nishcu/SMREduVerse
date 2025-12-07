# Cashfree Payment Gateway Integration

This document outlines the Cashfree payment gateway integration implemented in GenZeerr.

## Overview

The application now supports real-time payments through Cashfree for:
- Knowledge Coin purchases (Coin Bundles)
- Marketplace product purchases
- Future: Course purchases, subscriptions

## Setup

### 1. Environment Variables

Add the following to your `.env.local` file:

```env
# Cashfree Payment Gateway
CASHFREE_APP_ID=your_app_id_here
CASHFREE_SECRET_KEY=your_secret_key_here
CASHFREE_ENVIRONMENT=sandbox  # Use 'production' for live
CASHFREE_WEBHOOK_SECRET=your_webhook_secret_here
```

### 2. Cashfree Dashboard Configuration

1. **Create Account**: Sign up at [Cashfree](https://www.cashfree.com/)
2. **Get API Keys**:
   - Go to Dashboard → Payment Gateway → API Keys
   - Copy App ID and Secret Key
3. **Configure Webhooks**:
   - Go to Dashboard → Payment Gateway → Webhooks
   - Add webhook URL: `https://yourdomain.com/api/payments/webhook`
   - Select events: `ORDER_STATUS_UPDATE`
   - Copy webhook secret

### 3. Test vs Production

- **Sandbox**: Use for testing with test cards
- **Production**: Use for live payments

## Payment Flow

### 1. Order Creation
```
User clicks "Pay" → Frontend creates order → Cashfree API → Order created with token
```

### 2. Payment Processing
```
User enters payment details → Cashfree processes → Webhook notification → Status update
```

### 3. Post-Payment Actions
```
Payment successful → Coins added to wallet / Product purchased → User notified
```

## API Endpoints

### Create Payment Order
```
POST /api/payments/create-order
Authorization: Bearer <firebase_id_token>
Body: {
  "itemType": "coin_bundle" | "marketplace_item" | "course" | "subscription",
  "itemId": "item_id",
  "amount": 100.00,
  "currency": "INR"
}
```

### Verify Payment
```
POST /api/payments/verify
Authorization: Bearer <firebase_id_token>
Body: {
  "orderId": "GENZEERR_ORDER_123456"
}
```

### Webhook Handler
```
POST /api/payments/webhook
Headers: x-cashfree-signature: <signature>
Body: Cashfree webhook payload
```

## Components

### PaymentButton
Universal payment component that handles order creation and checkout.

```tsx
<PaymentButton
  itemType="coin_bundle"
  itemId="bundle_123"
  amount={100}
  onSuccess={() => console.log('Payment successful')}
  onFailure={() => console.log('Payment failed')}
>
  Pay ₹100
</PaymentButton>
```

### CashfreeCheckout
Handles the actual payment modal and processing.

## Supported Payment Methods

- Credit Cards (Visa, Mastercard, Amex)
- Debit Cards
- UPI
- Net Banking
- Wallets (Paytm, Mobikwik, etc.)
- BNPL (Buy Now Pay Later)

## Testing

### Test Cards (Sandbox)
- **Success**: 4111 1111 1111 1111
- **Failure**: 4000 0000 0000 0002
- **CVV**: Any 3 digits
- **Expiry**: Any future date

### UPI Testing
Use any valid UPI ID with `success@cashfree` for successful payments.

## Database Schema

### Payments Collection
```typescript
{
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  itemType: 'coin_bundle' | 'marketplace_item' | 'course' | 'subscription';
  itemId: string;
  itemDetails?: any;
  transactionId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  cashfreeOrderId?: string;
  cashfreePaymentId?: string;
}
```

### User Purchases Collection (for marketplace)
```typescript
{
  id: string;
  userId: string;
  productId: string;
  productData: any;
  purchaseDate: Timestamp;
  paymentId: string;
  amount: number;
  currency: string;
}
```

## Error Handling

- Network errors: Retry mechanism with exponential backoff
- Payment failures: User-friendly error messages
- Webhook verification: Signature validation
- Duplicate processing: Status checks prevent double processing

## Security

- **API Keys**: Stored securely in environment variables
- **Webhook Verification**: HMAC-SHA256 signature validation
- **User Authentication**: Firebase ID token validation
- **Data Encryption**: All sensitive data encrypted in transit

## Monitoring

- Payment success/failure rates
- Webhook delivery status
- Transaction volumes
- Error logs and alerts

## Troubleshooting

### Common Issues

1. **Payment modal not loading**
   - Check Cashfree SDK script loading
   - Verify environment variables

2. **Webhook not receiving**
   - Check webhook URL accessibility
   - Verify webhook secret configuration

3. **Payment verification failing**
   - Check Firebase authentication
   - Verify order ID format

### Debug Mode

Set `NODE_ENV=development` to enable detailed logging.

## Future Enhancements

- [ ] Subscription payments
- [ ] Course purchase payments
- [ ] Refund processing
- [ ] Payment analytics dashboard
- [ ] Multi-currency support
- [ ] Payment method preferences

## Support

For Cashfree-specific issues:
- [Cashfree Documentation](https://docs.cashfree.com/)
- [Cashfree Support](https://www.cashfree.com/contact)

For integration issues:
- Check application logs
- Verify environment configuration
- Test with sandbox credentials
