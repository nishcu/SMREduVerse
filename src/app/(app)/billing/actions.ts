
'use server';

import type { SubscriptionPlan, CoinBundle } from '@/lib/types';

// In a real application, this data would be fetched from a database
// or a payment provider like Stripe.

const mockPlans: SubscriptionPlan[] = [
    {
        id: 'pro_monthly',
        name: 'Pro Monthly',
        price: '₹49',
        pricePeriod: '/ month',
        features: [
            'Unlimited AI Task Generation',
            'Priority Access to New Features',
            'Exclusive "Pro" Profile Badge',
            '500 Bonus Knowledge Coins monthly',
        ],
    },
    {
        id: 'pro_yearly',
        name: 'Pro Yearly',
        price: '₹299',
        pricePeriod: '/ year',
        isPopular: true,
        features: [
            'All features from Pro Monthly',
            'Ad-free Experience',
            '15% discount on coin purchases',
            'Early access to new games',
        ],
    }
];

const mockBundles: CoinBundle[] = [
    { id: 'bundle_1', coins: 499, price: '₹99' },
    { id: 'bundle_2', coins: 999, price: '₹199', isPopular: true },
    { id: 'bundle_3', coins: 2500, price: '₹499' },
    { id: 'bundle_4', coins: 5500, price: '₹999' },
];

export async function getSubscriptionPlansAction(): Promise<SubscriptionPlan[]> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockPlans;
}

export async function getCoinBundlesAction(): Promise<CoinBundle[]> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockBundles;
}
