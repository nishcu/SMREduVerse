
'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createLessonAction } from './actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, BookPlus, XCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RichTextEditor } from '@/components/rich-text-editor';
import { FileUpload } from '@/components/file-upload';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const LessonSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty.').max(100),
  description: z.string().min(1, 'Description cannot be empty.').max(500),
  contentType: z.enum(['video', 'text', 'pdf', 'presentation']),
  contentUrl: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
  content: z.string().optional(), // For rich text content
  uploadedFileUrl: z.string().optional(), // For uploaded files
});

type LessonFormValues = z.infer<typeof LessonSchema>;


export default function CreateLessonPage({ params }: { params: { id: string, chapterId: string } }) {
  const { firebaseUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [uploadedFileUrl, setUploadedFileUrl] = useState('');
  const [richTextContent, setRichTextContent] = useState('');

  const form = useForm<LessonFormValues>({
    resolver: zodResolver(LessonSchema),
    defaultValues: {
      title: '',
      description: '',
      contentType: 'video',
      contentUrl: '',
      content: '',
      uploadedFileUrl: '',
    },
  });
  
  const onSubmit = async (data: LessonFormValues) => {
    if (!firebaseUser) {
        toast({ variant: 'destructive', title: 'Not authenticated' });
        return;
    }

    setIsPending(true);
    setError(null);
    const idToken = await firebaseUser.getIdToken();
    
    // Use uploaded file URL if available, otherwise use content URL
    const finalContentUrl = uploadedFileUrl || data.contentUrl;
    const finalContent = richTextContent || data.content;
    
    const result = await createLessonAction({ 
        ...data,
        contentUrl: finalContentUrl,
        content: finalContent,
        uploadedFileUrl: uploadedFileUrl,
        idToken,
        courseId: params.id,
        chapterId: params.chapterId
    });

    if (result.success) {
      toast({
        title: 'Lesson Created!',
        description: 'Your new lesson has been added to the chapter.',
      });
      router.push(`/courses/${params.id}/chapters/${params.chapterId}/edit`);
    } else {
        setError(result.error || 'An unknown error occurred.');
    }
    setIsPending(false);
  };


  if (authLoading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Create New Lesson</CardTitle>
          <CardDescription>Add a new lesson to this chapter.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
            >
              {error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>Error Creating Lesson</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>Lesson Title</FormLabel>
                  <FormControl><Input placeholder="e.g., Understanding Gravity" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Lesson Description</FormLabel>
                  <FormControl><Textarea placeholder="What is this lesson about?" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              
              <FormField control={form.control} name="contentType" render={({ field }) => (
                <FormItem>
                  <FormLabel>Content Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="presentation">Presentation</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <Tabs defaultValue={form.watch('contentType') === 'text' ? 'rich-text' : form.watch('contentType') === 'video' || form.watch('contentType') === 'pdf' || form.watch('contentType') === 'presentation' ? 'upload' : 'url'} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="url" disabled={form.watch('contentType') === 'text'}>URL</TabsTrigger>
                  <TabsTrigger value="upload" disabled={form.watch('contentType') === 'text'}>Upload File</TabsTrigger>
                  <TabsTrigger value="rich-text" disabled={form.watch('contentType') !== 'text'}>Rich Text</TabsTrigger>
                </TabsList>
                <TabsContent value="url" className="space-y-4">
                  <FormField control={form.control} name="contentUrl" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content URL</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={
                            form.watch('contentType') === 'video' 
                              ? "https://youtube.com/watch?v=... or embed URL" 
                              : form.watch('contentType') === 'pdf' 
                              ? "https://example.com/document.pdf"
                              : "https://example.com/presentation"
                          } 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground">
                        {form.watch('contentType') === 'video' 
                          ? "Enter a YouTube URL, Vimeo URL, or direct video embed URL"
                          : "Enter the direct URL to your content file"}
                      </p>
                    </FormItem>
                  )} />
                </TabsContent>
                <TabsContent value="upload" className="space-y-4">
                  <FileUpload
                    onUploadComplete={(url, fileName, fileType) => {
                      setUploadedFileUrl(url);
                      form.setValue('uploadedFileUrl', url);
                      toast({
                        title: 'File Uploaded',
                        description: `${fileName} has been uploaded successfully.`,
                      });
                    }}
                    acceptedTypes={
                      form.watch('contentType') === 'video' 
                        ? 'video/*' 
                        : form.watch('contentType') === 'pdf'
                        ? 'application/pdf'
                        : '.ppt,.pptx,application/vnd.ms-powerpoint'
                    }
                    maxSize={form.watch('contentType') === 'video' ? 500 : 50}
                    label={`Upload ${form.watch('contentType') === 'video' ? 'Video' : form.watch('contentType') === 'pdf' ? 'PDF' : 'Presentation'}`}
                  />
                </TabsContent>
                <TabsContent value="rich-text" className="space-y-4">
                  <FormItem>
                    <FormLabel>Lesson Content</FormLabel>
                    <RichTextEditor
                      value={richTextContent}
                      onChange={(value) => {
                        setRichTextContent(value);
                        form.setValue('content', value);
                      }}
                      placeholder="Write your lesson content here. Use formatting tools to make it engaging..."
                    />
                    <FormMessage />
                  </FormItem>
                </TabsContent>
              </Tabs>
              
              <Button type="submit" disabled={isPending || !firebaseUser}>
                {isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
                ) : (
                  <><BookPlus className="mr-2 h-4 w-4" /> Add Lesson</>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
