
'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { getEconomySettingsAction } from './actions';
import { EconomySettingsClient } from './client';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { seedQuests } from "@/lib/seed-data";

function PlatformActions() {
    const { toast } = useToast();

    const handleSeedQuests = async () => {
        try {
            const result = await seedQuests();
            if (result.success) {
                toast({
                    title: 'Success!',
                    description: result.message,
                });
            } else {
                 toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: result.message,
                });
            }
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Operation Failed',
                description: error.message,
            });
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Platform Actions</CardTitle>
                <CardDescription>
                    Run one-time actions to set up your platform.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                        <p className="font-semibold">Seed Initial Quests</p>
                        <p className="text-sm text-muted-foreground">Populate the database with the starter quests for the Brain Quest Adventure.</p>
                    </div>
                    <Button onClick={handleSeedQuests}>Seed Quests</Button>
                </div>
            </CardContent>
        </Card>
    )
}

export default function AdminSettingsPage() {

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
          <EconomySettingsClient />
        </CardContent>
      </Card>
      <PlatformActions />
    </div>
  );
}
