'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import type { Partner } from '@/lib/types';

export function PartnerCard({ partner }: { partner: Partner }) {
  return (
    <Link href={`/partners/${partner.id}`} className="group">
      <Card className="h-full transition-all group-hover:shadow-lg group-hover:-translate-y-1">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 shrink-0">
              <Image src={partner.logoUrl} alt={`${partner.name} logo`} fill className="rounded-lg object-contain" />
            </div>
            <div>
              <CardTitle className="font-headline text-xl">{partner.name}</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription>{partner.tagline}</CardDescription>
        </CardContent>
      </Card>
    </Link>
  );
}
