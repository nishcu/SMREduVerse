
# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Cashfree Payment Gateway

This project now ships with a native Cashfree PG integration that powers Knowledge Coin bundles and subscription upgrades under `/billing`.

### Configuration

1. Copy `env.local.template` to `.env.local`.
2. Fill in the Firebase Admin credentials.
3. Add the Cashfree configuration:
   - `CASHFREE_APP_ID`
   - `CASHFREE_SECRET_KEY`
   - `CASHFREE_ENV` (`sandbox` or `production`)
   - `NEXT_PUBLIC_CASHFREE_MODE` (must mirror `CASHFREE_ENV`)
   - Optionally set `NEXT_PUBLIC_APP_URL`/`APP_BASE_URL` so the return URL inside Cashfree points to the correct deployment.
4. Restart `next dev` after updating environment variables so the SDK picks up the new values.

### How it works

- Client components (`SubscriptionPlanCard`, `CoinBundleCard`) request a secure checkout session via new server actions in `src/app/(app)/billing/actions.ts`.
- The server validates the Firebase ID token, looks up the plan/bundle, creates a record in Firestore (`cashfree-orders`) and calls Cashfree's `/orders` API.
- The client loads Cashfree's Drop-in SDK through `useCashfree`, opens the hosted checkout, and then invokes `confirmCashfreePaymentAction`.
- On confirmation the server re-fetches the order status from Cashfree. Successful bundle purchases credit Knowledge Coins, while subscriptions mark the user's profile as active for the selected plan.

### Verifying locally

1. Sign in with any account.
2. Visit `/billing`.
3. Click a plan or bundle button. In sandbox mode you can use Cashfree's test cards (e.g. `4000 0000 0000 1091`, any future expiry, CVV `123`, OTP `123456`).
4. Wait for the success toast and confirm the wallet balance/subscription fields update in Firestore.

All Cashfree activity is persisted to the `cashfree-orders` collection for traceability and manual reconciliation if needed.
