'use client';
import type { LessonContent } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AspectRatio } from '@radix-ui/react-aspect-ratio';

export function LessonPlayer({ lesson }: { lesson: LessonContent }) {
    return (
        <div className="space-y-6 p-2">
            <div>
                <p className="text-sm font-semibold text-primary">{lesson.courseTitle}</p>
                <h2 className="font-headline text-2xl font-bold">{lesson.lessonTitle}</h2>
            </div>
            
            <AspectRatio ratio={16 / 9} className="bg-muted rounded-lg overflow-hidden">
                {lesson.contentUrl ? (
                    <iframe 
                        src={lesson.contentUrl} 
                        title={lesson.lessonTitle}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                    ></iframe>
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-secondary">
                        <p className="text-muted-foreground">Video player will appear here.</p>
                    </div>
                )}
            </AspectRatio>

            <Card>
                <CardHeader>
                    <CardTitle>Lesson Notes</CardTitle>
                    <CardDescription>A summary or transcript of the lesson content.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{lesson.notes}</p>
                </CardContent>
            </Card>
        </div>
    )
}
