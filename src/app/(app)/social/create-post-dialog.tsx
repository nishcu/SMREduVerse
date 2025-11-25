'use client';

import { useEffect, useActionState, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { createPostAction } from './actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, X, Image as ImageIcon, Video } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { storage } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

const MAX_UPLOAD_SIZE_MB = 100;

const subjects = [
    "Mathematics", "Science", "English", "History", "Geography", "Biology", 
    "Chemistry", "Physics", "Computer Science", "Art", "Music", "Mythology", 
    "Entertainment", "General Knowledge", "Current Affairs", 
    "Environmental Science", "Civics", "Economics", "Cooking", 
    "Games & Challenges", "Other"
];

const initialState: { success: boolean; error?: string | null; errors?: any } = {
  success: false,
};

export function CreatePostDialog({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}) {
  const { user, getInitials, firebaseUser } = useAuth();
  const [state, formAction, isPending] = useActionState(createPostAction, initialState);
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewObjectUrlRef = useRef<string | null>(null);

  const form = useForm({
    defaultValues: {
      content: '',
      imageUrl: '',
      postType: 'text',
      subject: 'General Knowledge',
    },
  });

  useEffect(() => {
    if (state.success) {
      toast({
        title: 'Post Created!',
        description: 'Your post has been successfully shared.',
      });
      onOpenChange(false);
      form.reset();
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
        previewObjectUrlRef.current = null;
      }
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
        previewObjectUrlRef.current = null;
      }
      setPreviewUrl(null);
      setSelectedFile(null);
      setUploadedUrl('');
      setUploadProgress(0);
    } else if (state.error) {
      toast({
        variant: 'destructive',
        title: 'Error Creating Post',
        description: state.error,
      });
    }
  }, [state, toast, onOpenChange, form]);

  useEffect(() => {
    return () => {
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
        previewObjectUrlRef.current = null;
      }
    };
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const validVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    
    if (!validImageTypes.includes(file.type) && !validVideoTypes.includes(file.type)) {
      toast({
        variant: 'destructive',
        title: 'Invalid File Type',
        description: 'Please select an image (JPEG, PNG, GIF, WebP) or video (MP4, WebM, OGG, MOV) file.',
      });
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > MAX_UPLOAD_SIZE_MB * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File Too Large',
        description: `Please select a file smaller than ${MAX_UPLOAD_SIZE_MB}MB.`,
      });
      return;
    }

    setSelectedFile(file);
    setUploadedUrl('');
    form.setValue('imageUrl', '');
    
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = null;
    }
    const objectUrl = URL.createObjectURL(file);
    previewObjectUrlRef.current = objectUrl;
    setPreviewUrl(objectUrl);

    // Auto-set post type based on file type
    if (validImageTypes.includes(file.type)) {
      form.setValue('postType', 'image');
    } else if (validVideoTypes.includes(file.type)) {
      form.setValue('postType', 'video');
    }

    startFileUpload(file);
  };

  const startFileUpload = (file: File) => {
    if (!firebaseUser) {
      toast({
        variant: 'destructive',
        title: 'Not signed in',
        description: 'You must be logged in to upload media.',
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadedUrl('');

    const fileExtension = file.name.split('.').pop();
    const fileName = `posts/${firebaseUser.uid}/${Date.now()}.${fileExtension}`;
    const storageRef = ref(storage, fileName);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        console.error('Upload error:', error);
        toast({
          variant: 'destructive',
          title: 'Upload Failed',
          description: 'Failed to upload file. Please try again.',
        });
        setUploading(false);
        setUploadProgress(0);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setUploadedUrl(downloadURL);
          form.setValue('imageUrl', downloadURL);
          setUploading(false);
          setUploadProgress(100);
        } catch (error) {
          console.error('Error getting download URL:', error);
          toast({
            variant: 'destructive',
            title: 'Upload Failed',
            description: 'Could not finalize upload. Please try again.',
          });
          setUploading(false);
          setUploadProgress(0);
        }
      }
    );
  };

  const handleRemoveFile = () => {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = null;
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadedUrl('');
    form.setValue('imageUrl', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!user) return null;


  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!isPending) onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Post</DialogTitle>
          <DialogDescription>
            Share your thoughts, ask questions, or post updates.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form
                action={async (formData: FormData) => {
                    if (!firebaseUser) return;

                    if (uploading) {
                        toast({
                            title: 'Upload in progress',
                            description: 'Please wait for the upload to finish before posting.',
                        });
                        return;
                    }

                    let fileUrl = form.getValues('imageUrl') || uploadedUrl;
                    if (selectedFile && !fileUrl) {
                        toast({
                            variant: 'destructive',
                            title: 'Upload required',
                            description: 'Please wait until the media upload completes before posting.',
                        });
                        return;
                    }

                    const idToken = await firebaseUser.getIdToken();
                    formData.set('idToken', idToken);
                    formData.set('imageUrl', fileUrl || '');
                    await formAction(formData);
                }}
                className="space-y-4"
            >
                <div className="flex items-start gap-4">
                    <Avatar>
                        <AvatarImage src={user.avatarUrl} />
                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <div className="w-full space-y-2">
                        <FormField
                            control={form.control}
                            name="content"
                            render={({ field }) => (
                                <FormItem>
                                <FormControl>
                                    <Textarea
                                        placeholder={`What's on your mind, ${user.name.split(' ')[0]}?`}
                                        className="w-full border-none focus-visible:ring-0 text-base resize-none"
                                        rows={4}
                                        {...field}
                                        />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Image or Video (Optional)</FormLabel>
                        <FormControl>
                            <div className="space-y-2">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*,video/*"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    id="file-upload"
                                    disabled={uploading}
                                />
                                {!previewUrl && !uploading && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full"
                                    >
                                        <Upload className="mr-2 h-4 w-4" />
                                        Choose Image or Video
                                    </Button>
                                )}
                                {uploading && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span className="text-sm">Uploading... {Math.round(uploadProgress)}%</span>
                                        </div>
                                        <div className="w-full bg-secondary rounded-full h-2">
                                            <div
                                                className="bg-primary h-2 rounded-full transition-all"
                                                style={{ width: `${uploadProgress}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                                {previewUrl && !uploading && (
                                    <div className="relative">
                                        {selectedFile?.type.startsWith('image/') ? (
                                            <img
                                                src={previewUrl}
                                                alt="Preview"
                                                className="w-full h-48 object-cover rounded-lg border"
                                            />
                                        ) : (
                                            <video
                                                src={previewUrl}
                                                controls
                                                className="w-full h-48 object-cover rounded-lg border"
                                            />
                                        )}
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            className="absolute top-2 right-2"
                                            onClick={handleRemoveFile}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                                <Input
                                    {...field}
                                    value={field.value || ''}
                                    placeholder="Or enter image/video URL"
                                    className="mt-2"
                                    onChange={(e) => {
                                        field.onChange(e);
                                        if (e.target.value) {
                                            if (previewObjectUrlRef.current) {
                                                URL.revokeObjectURL(previewObjectUrlRef.current);
                                                previewObjectUrlRef.current = null;
                                            }
                                            setPreviewUrl(e.target.value);
                                            setSelectedFile(null);
                                            setUploadedUrl(e.target.value);
                                        } else {
                                            if (previewObjectUrlRef.current) {
                                                URL.revokeObjectURL(previewObjectUrlRef.current);
                                                previewObjectUrlRef.current = null;
                                            }
                                            setPreviewUrl(null);
                                            setUploadedUrl('');
                                        }
                                    }}
                                />
                            </div>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="postType"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Post Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} name={field.name}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select post type" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="text">Text</SelectItem>
                                    <SelectItem value="image">Image</SelectItem>
                                    <SelectItem value="video">Video</SelectItem>
                                    <SelectItem value="question">Question</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Subject</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} name={field.name}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select subject" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {subjects.map(subject => (
                                        <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
                    <Button type="submit" disabled={isPending || uploading || !firebaseUser}>
                        {isPending ? (
                            <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Posting...
                            </>
                        ) : (
                            'Post'
                        )}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
