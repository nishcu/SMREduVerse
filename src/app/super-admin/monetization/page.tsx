
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getSubscriptionPlansAction, getCoinBundlesAction } from './actions';
import { PlansClient } from './plans-client';
import { BundlesClient } from './bundles-client';

export default async function MonetizationPage() {
    const [plans, bundles] = await Promise.all([
        getSubscriptionPlansAction(),
        getCoinBundlesAction(),
    ]);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="font-headline text-3xl font-semibold md:text-4xl">
                    Monetization
                </h1>
                <p className="text-muted-foreground">
                    Manage subscription plans and coin bundles for your platform.
                </p>
            </div>
            
            <Tabs defaultValue="subscriptions">
                <TabsList>
                    <TabsTrigger value="subscriptions">Subscription Plans</TabsTrigger>
                    <TabsTrigger value="bundles">Coin Bundles</TabsTrigger>
                </TabsList>
                <TabsContent value="subscriptions">
                    <Card>
                        <CardHeader>
                            <CardTitle>Subscription Plans</CardTitle>
                            <CardDescription>Create and manage the subscription tiers for your users.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <PlansClient initialPlans={plans} />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="bundles">
                    <Card>
                        <CardHeader>
                            <CardTitle>Coin Bundles</CardTitle>
                            <CardDescription>Create and manage coin packages that users can purchase.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <BundlesClient initialBundles={bundles} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
