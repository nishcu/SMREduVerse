
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { getEconomySettingsAction } from './actions';
import { EconomySettingsClient } from './client';

export default async function AdminSettingsPage() {
  const economySettings = await getEconomySettingsAction();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-semibold md:text-4xl">
          Platform Settings
        </h1>
        <p className="text-muted-foreground">
          Manage global settings for the application.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Knowledge Coin Economy</CardTitle>
          <CardDescription>
            Manage how users earn and spend Knowledge Coins across the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EconomySettingsClient initialSettings={economySettings} />
        </CardContent>
      </Card>
    </div>
  );
}
