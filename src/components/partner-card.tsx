'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import Link from 'next/link';
import type { Partner } from '@/lib/types';
import { CheckCircle2, School, GraduationCap, Building2, Award, MapPin, Users, BookOpen } from 'lucide-react';

const getInstitutionIcon = (type?: string) => {
  switch (type) {
    case 'school':
      return <School className="h-4 w-4" />;
    case 'college':
      return <GraduationCap className="h-4 w-4" />;
    case 'university':
      return <Building2 className="h-4 w-4" />;
    case 'academy':
      return <Award className="h-4 w-4" />;
    default:
      return null;
  }
};

const getInstitutionTypeLabel = (type?: string) => {
  switch (type) {
    case 'school':
      return 'School';
    case 'college':
      return 'College';
    case 'university':
      return 'University';
    case 'academy':
      return 'Academy';
    default:
      return 'Institution';
  }
};

export function PartnerCard({ partner }: { partner: Partner }) {
  return (
    <Link href={`/partners/${partner.id}`} className="group">
      <Card className="h-full transition-all group-hover:shadow-lg group-hover:-translate-y-1 flex flex-col">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="relative h-16 w-16 shrink-0">
              <Image 
                src={partner.logoUrl} 
                alt={`${partner.name} logo`} 
                fill 
                className="rounded-lg object-contain border" 
              />
              {partner.verified && (
                <div className="absolute -top-1 -right-1 bg-primary rounded-full p-0.5">
                  <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <CardTitle className="font-headline text-lg line-clamp-2">{partner.name}</CardTitle>
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                {partner.institutionType && (
                  <Badge variant="outline" className="text-xs">
                    {getInstitutionIcon(partner.institutionType)}
                    <span className="ml-1">{getInstitutionTypeLabel(partner.institutionType)}</span>
                  </Badge>
                )}
                {partner.verified && (
                  <Badge variant="default" className="text-xs">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
              {partner.tagline && (
                <CardDescription className="line-clamp-2 text-sm">{partner.tagline}</CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <CardDescription className="line-clamp-2 mb-4 flex-1">{partner.description}</CardDescription>
          <div className="space-y-2 pt-2 border-t">
            {partner.location && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{partner.location.city}, {partner.location.state}</span>
              </div>
            )}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {partner.stats?.studentsTaught > 0 && (
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>{partner.stats.studentsTaught.toLocaleString()}</span>
                </div>
              )}
              {partner.stats?.coursesOffered > 0 && (
                <div className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  <span>{partner.stats.coursesOffered}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
