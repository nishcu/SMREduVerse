
# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Cashfree Payment Gateway

Realtime payments for subscriptions, knowledge coin bundles, and partner products rely on Cashfree PG. Configure the following environment variables before running the app:

- `CASHFREE_APP_ID` – Cashfree PG App ID
- `CASHFREE_SECRET_KEY` – Cashfree PG Secret Key
- `CASHFREE_ENV` – `sandbox` or `production`
- `CASHFREE_RETURN_URL` – Base URL (e.g. `https://your-app.com`) used to build the Cashfree return URL
- `NEXT_PUBLIC_CASHFREE_ENV` – mirrors `CASHFREE_ENV` on the client for the Cashfree JS SDK

After setting these variables, restart the dev server so the new configuration is picked up.
