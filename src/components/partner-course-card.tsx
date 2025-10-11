'use client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { PartnerCourse } from '@/lib/types';

export function PartnerCourseCard({ course }: { course: PartnerCourse }) {
  return (
    <Link href={`/courses/${course.id}`} className="group">
      <Card className="overflow-hidden transition-shadow hover:shadow-md">
        <CardHeader className="p-0">
          <div className="relative h-32 w-full">
            <Image src={course.imageUrl} alt={course.title} fill className="object-cover" />
          </div>
        </CardHeader>
        <CardContent className="p-3">
          <Badge variant="secondary" className="mb-1">{course.category}</Badge>
          <h3 className="font-semibold truncate group-hover:underline">{course.title}</h3>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            <span>{course.enrolled.toLocaleString()} Students</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
