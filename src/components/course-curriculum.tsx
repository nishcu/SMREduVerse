

'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PlayCircle, FileText, BookOpen, CheckCircle } from 'lucide-react';
import { type Chapter, type Lesson, type Enrollment } from '@/lib/types';
import { useCollection } from '@/firebase';

const getLessonIcon = (contentType: Lesson['contentType']) => {
    switch (contentType) {
      case 'video': return <PlayCircle className="h-5 w-5" />;
      case 'text': return <FileText className="h-5 w-5" />;
      case 'pdf': return <FileText className="h-5 w-5 text-red-500" />;
      default: return <BookOpen className="h-5 w-5" />;
    }
};

function ChapterItem({ courseId, chapter, enrollment }: { courseId: string; chapter: Chapter; enrollment: Enrollment | null }) {
    const lessonsQuery = useMemo(() => query(collection(db, 'courses', courseId, 'chapters', chapter.id, 'lessons'), orderBy('order')), [courseId, chapter.id]);
    const { data: lessons, loading, error } = useCollection<Lesson>(lessonsQuery);

    if (error) {
        return <p className="text-sm text-destructive p-4">Error loading lessons.</p>;
    }
    
    return (
        <AccordionItem value={`item-${chapter.order}`} key={chapter.id}>
            <AccordionTrigger className="font-semibold text-lg hover:no-underline">
                Chapter {chapter.order}: {chapter.title}
            </AccordionTrigger>
            <AccordionContent>
                <p className="text-muted-foreground mb-4">{chapter.description}</p>
                <div className="space-y-3">
                    {loading ? (
                        <>
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                        </>
                    ) : lessons && lessons.length > 0 ? (
                        lessons.map((lesson) => {
                            const isCompleted = enrollment?.progress?.chapters?.[chapter.id]?.lessons?.[lesson.id]?.completed || false;
                            return (
                                <Card key={lesson.id}>
                                    <CardContent className="flex items-center gap-4 p-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                                            {getLessonIcon(lesson.contentType)}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold">{lesson.title}</p>
                                            <p className="text-sm text-muted-foreground capitalize">{lesson.contentType}</p>
                                        </div>
                                        {isCompleted && <CheckCircle className="h-6 w-6 text-green-500" />}
                                    </CardContent>
                                </Card>
                            )
                        })
                    ) : (
                        <p className="text-sm text-muted-foreground p-4">No lessons in this chapter yet.</p>
                    )}
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}


export function CourseCurriculum({ courseId, enrollment }: { courseId: string; enrollment: Enrollment | null }) {
    const chaptersQuery = useMemo(() => query(collection(db, 'courses', courseId, 'chapters'), orderBy('order')), [courseId]);
    const { data: chapters, loading: loadingChapters, error: errorChapters } = useCollection<Chapter>(chaptersQuery);

    if (loadingChapters) {
        return (
            <div>
                <h2 className="font-headline text-2xl font-semibold mb-4">Course Curriculum</h2>
                <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            </div>
        )
    }

    if (errorChapters) {
        return <p className="text-destructive">Error loading curriculum: {errorChapters.message}</p>;
    }
    
    return (
        <div>
            <h2 className="font-headline text-2xl font-semibold mb-4">Course Curriculum</h2>
            {chapters && chapters.length > 0 ? (
                <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
                    {chapters.map((chapter) => (
                       <ChapterItem key={chapter.id} courseId={courseId} chapter={chapter} enrollment={enrollment} />
                    ))}
                </Accordion>
            ) : (
                 <p className="text-muted-foreground mt-4">No chapters have been added to this course yet.</p>
            )}
        </div>
    );
}
