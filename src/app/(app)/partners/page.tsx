
'use client';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Handshake } from 'lucide-react';
import { PartnerCard } from '@/components/partner-card';
import { getAllPartnersAction } from './actions';
import { useEffect, useState } from 'react';
import { Partner } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { BecomeAPartnerDialog } from '@/components/become-a-partner-dialog';

function PartnerCardSkeleton() {
    return (
        <Card className="h-full">
            <CardHeader className="flex items-center gap-4">
                 <Skeleton className="h-16 w-16 shrink-0" />
                 <div className="flex-1">
                    <Skeleton className="h-6 w-3/4" />
                 </div>
            </CardHeader>
            <CardContent>
                <Skeleton className="h-4 w-full" />
            </CardContent>
        </Card>
    )
}


export default function PartnersPage() {
    const [partners, setPartners] = useState<Partner[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPartnerDialogOpen, setPartnerDialogOpen] = useState(false);

    useEffect(() => {
        const loadPartners = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const result = await getAllPartnersAction();
                if (result.success) {
                    setPartners(result.data || []);
                } else {
                    setError(result.error || 'Failed to load partners.');
                }
            } catch (e: any) {
                setError(e.message);
            } finally {
                setIsLoading(false);
            }
        };
        
        loadPartners();
    }, []);

    return (
        <>
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Handshake className="h-10 w-10 text-primary" />
                        <div>
                            <h1 className="font-headline text-3xl font-semibold md:text-4xl">
                                Our Partners
                            </h1>
                            <p className="text-muted-foreground">
                                Explore collaborations and opportunities from leading organizations.
                            </p>
                        </div>
                    </div>
                    <Button onClick={() => setPartnerDialogOpen(true)}>Become a Partner</Button>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {[...Array(3)].map((_, i) => <PartnerCardSkeleton key={i} />)}
                    </div>
                ) : error ? (
                    <div className="text-center text-destructive py-16">{error}</div>
                ) : partners.length === 0 ? (
                    <div className="text-center text-muted-foreground py-16">
                        <p>No partners have joined yet. Check back soon!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {partners.map((partner) => (
                            <PartnerCard key={partner.id} partner={partner} />
                        ))}
                    </div>
                )}
            </div>
            <BecomeAPartnerDialog isOpen={isPartnerDialogOpen} onOpenChange={setPartnerDialogOpen} />
        </>
    );
}
