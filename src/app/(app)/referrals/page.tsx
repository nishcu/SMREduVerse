
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Ticket, Copy, Gift } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection } from '@/firebase';
import { collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Coupon } from '@/lib/types';
import { format } from 'date-fns';

export default function ReferralsPage() {
  const { user, loading: userLoading } = useAuth();
  const { toast } = useToast();

  const couponsQuery = useMemo(() => (user ? collection(db, `users/${user.id}/coupons`) : null), [user?.id]);
  const { data: coupons, loading: couponsLoading } = useCollection<Coupon>(couponsQuery);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard!',
      description: 'You can now share it with your friends.',
    });
  };

  const isLoading = userLoading || couponsLoading;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Ticket className="h-10 w-10 text-primary" />
        <div>
          <h1 className="font-headline text-3xl font-semibold md:text-4xl">
            Referrals & Coupons
          </h1>
          <p className="text-muted-foreground">
            Share your code to earn rewards and view your active coupons.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Referral Code</CardTitle>
              <CardDescription>
                Share this code with friends. They get a bonus for signing up, and you get rewarded!
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-10 flex-grow" />
                  <Skeleton className="h-10 w-10" />
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <div className="flex-grow rounded-md border border-dashed border-input bg-secondary/50 px-4 py-2 text-center font-mono text-lg font-semibold text-secondary-foreground">
                    {user?.referralCode}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopy(user?.referralCode || '')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>My Coupons</CardTitle>
              <CardDescription>
                Use these codes to get discounts on courses and other items.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                </div>
              ) : coupons && coupons.length > 0 ? (
                <div className="space-y-4">
                  {coupons.map((coupon) => (
                    <div key={coupon.id} className="flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-3">
                        <Gift className="h-5 w-5 mt-1 text-primary" />
                        <div>
                          <p className="font-semibold">{coupon.description}</p>
                          <p className="text-xs text-muted-foreground">
                            Expires on {format(new Date(coupon.expiryDate), 'PPP')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 justify-end">
                        <span className="rounded-md border border-dashed px-3 py-1 font-mono text-sm">
                          {coupon.code}
                        </span>
                        <Button size="sm" onClick={() => handleCopy(coupon.code)}>
                          Copy
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 py-12 text-center">
                  <Ticket className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-xl font-semibold">No Coupons Yet</h3>
                  <p className="mt-2 text-muted-foreground">
                    Keep participating in contests and events to earn coupons!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
