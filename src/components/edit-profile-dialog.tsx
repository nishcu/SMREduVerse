'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { useEffect, useState, useActionState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import type { User, EducationHistory } from '@/lib/types';
import { updateUserProfileAction } from '@/app/(app)/profile/[uid]/actions';
import { v4 as uuidv4 } from 'uuid';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Camera, Trash2, PlusCircle } from 'lucide-react';
import { Badge } from './ui/badge';
import { X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { getInitials } from '@/lib/utils';
import { CameraCaptureDialog } from './camera-capture-dialog';
import { Separator } from './ui/separator';

const EducationHistorySchema = z.object({
    id: z.string(),
    name: z.string().min(1, 'Institution name is required.'),
    level: z.string().min(1, 'Level/Degree is required.'),
    startYear: z.string().min(4, 'Invalid year.').max(4, 'Invalid year.'),
    endYear: z.string().min(4, 'Invalid year.').max(4, 'Invalid year,'),
});

const ProfileFormSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty.'),
  username: z.string().min(3, 'Username must be at least 3 characters.'),
  bio: z.string().max(160, 'Bio must be 160 characters or less.').optional(),
  avatarUrl: z.string().url('Please enter a valid image URL.').optional(),
  grade: z.string().optional(),
  school: z.string().optional(),
  educationHistory: z.array(EducationHistorySchema).optional(),
  syllabus: z.string().optional(),
  medium: z.string().optional(),
  interests: z.array(z.string()).optional(),
  sports: z.array(z.string()).optional(),
});

type ProfileFormValues = z.infer<typeof ProfileFormSchema>;

interface EditProfileDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
}

export function EditProfileDialog({ isOpen, onOpenChange, user }: EditProfileDialogProps) {
  const [state, formAction, isPending] = useActionState(updateUserProfileAction, {success: false, error: null});
  const { firebaseUser } = useAuth();
  const { toast } = useToast();
  const [isCameraOpen, setCameraOpen] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  
  const form = useForm<ProfileFormValues>({
    defaultValues: {
      name: user.name || '',
      username: user.username || '',
      bio: user.bio || '',
      avatarUrl: user.avatarUrl || '',
      grade: user.grade || '',
      school: (user as any).school || '',
      educationHistory: user.educationHistory?.map(item => ({...item, id: item.id || uuidv4() })) || [],
      syllabus: user.syllabus || '',
      medium: user.medium || '',
      interests: user.interests || [],
      sports: user.sports || [],
    }
  });

  // Reset form and state when dialog opens or user changes
  useEffect(() => {
    if (isOpen) {
      setHasSubmitted(false);
      form.reset({
        name: user.name || '',
        username: user.username || '',
        bio: user.bio || '',
        avatarUrl: user.avatarUrl || '',
        grade: user.grade || '',
        school: (user as any).school || '',
        educationHistory: user.educationHistory?.map(item => ({...item, id: item.id || uuidv4() })) || [],
        syllabus: user.syllabus || '',
        medium: user.medium || '',
        interests: user.interests || [],
        sports: user.sports || [],
      });
    }
  }, [isOpen, user, form]);

  const { fields: educationFields, append: appendEducation, remove: removeEducation } = useFieldArray({ control: form.control, name: 'educationHistory' });
  const { fields: interestFields, append: appendInterest, remove: removeInterest } = useFieldArray({ control: form.control, name: 'interests' as any });
  const { fields: sportFields, append: appendSport, remove: removeSport } = useFieldArray({ control: form.control, name: 'sports' as any });
  
  useEffect(() => {
    // Only handle state changes after form submission
    if (!hasSubmitted) return;
    
    if (state?.success === true) {
      toast({ title: 'Success', description: 'Your profile has been updated.' });
      onOpenChange(false);
      setHasSubmitted(false);
    } else if (state?.error && state.error !== null && state.error !== 'Invalid form data.') {
      toast({ variant: 'destructive', title: 'Error', description: state.error });
      setHasSubmitted(false);
    }
  }, [state, onOpenChange, toast, hasSubmitted]);

  const handlePhotoCaptured = (dataUrl: string) => {
    form.setValue('avatarUrl', dataUrl, { shouldValidate: true });
    setCameraOpen(false);
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
           <form
            onSubmit={async (e) => {
                e.preventDefault();
                if (!firebaseUser) return;
                
                setHasSubmitted(true);
                const formData = new FormData(e.currentTarget);
                const idToken = await firebaseUser.getIdToken();
                formData.set('idToken', idToken);
                formData.set('name', form.getValues('name'));
                formData.set('username', form.getValues('username'));
                formData.set('bio', form.getValues('bio') || '');
                formData.set('avatarUrl', form.getValues('avatarUrl') || '');
                formData.set('grade', form.getValues('grade') || '');
                formData.set('school', form.getValues('school') || '');
                formData.set('syllabus', form.getValues('syllabus') || '');
                formData.set('medium', form.getValues('medium') || '');
                
                formData.delete('interests');
                form.getValues('interests')?.forEach(interest => formData.append('interests[]', interest));
                formData.delete('sports');
                form.getValues('sports')?.forEach(sport => formData.append('sports[]', sport));
                formData.delete('educationHistory');
                form.getValues('educationHistory')?.forEach(edu => formData.append('educationHistory', JSON.stringify(edu)));
                
                await formAction(formData);
            }}
            className="space-y-6 max-h-[70vh] overflow-y-auto pr-4"
          >
             <FormField
                control={form.control}
                name="avatarUrl"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Profile Picture</FormLabel>
                        <div className="flex items-center gap-4">
                            <Avatar className="h-20 w-20">
                                <AvatarImage src={field.value} alt={user.name} />
                                <AvatarFallback className="text-2xl">{getInitials(user.name)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-grow space-y-2">
                                <FormControl>
                                <Input placeholder="https://example.com/your-image.png" {...field} value={field.value || ''} />
                                </FormControl>
                                <Button type="button" variant="outline" onClick={() => setCameraOpen(true)}>
                                    <Camera className="mr-2 h-4 w-4" />
                                    Take Photo
                                </Button>
                            </div>
                        </div>
                        <FormMessage />
                    </FormItem>
                )}
             />
             <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
             <FormField control={form.control} name="username" render={({ field }) => (<FormItem><FormLabel>Username</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
             <FormField control={form.control} name="bio" render={({ field }) => (<FormItem><FormLabel>Bio</FormLabel><FormControl><Textarea placeholder="Tell us about yourself..." {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />

             <Separator />

            <div>
                <FormLabel>Education History</FormLabel>
                <div className="space-y-4 mt-2">
                    {educationFields.map((field, index) => (
                        <div key={field.id} className="flex items-end gap-2 rounded-md border p-4">
                            <input type="hidden" {...form.register(`educationHistory.${index}.id`)} />
                            <div className="grid flex-grow grid-cols-2 gap-4">
                                <FormField control={form.control} name={`educationHistory.${index}.name`} render={({ field }) => (<FormItem><FormLabel>Institution</FormLabel><FormControl><Input placeholder="Knowledge High School" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name={`educationHistory.${index}.level`} render={({ field }) => (<FormItem><FormLabel>Level/Degree</FormLabel><FormControl><Input placeholder="High School" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name={`educationHistory.${index}.startYear`} render={({ field }) => (<FormItem><FormLabel>Start Year</FormLabel><FormControl><Input placeholder="2018" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name={`educationHistory.${index}.endYear`} render={({ field }) => (<FormItem><FormLabel>End Year</FormLabel><FormControl><Input placeholder="2022" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            </div>
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeEducation(index)}><Trash2 className="text-destructive"/></Button>
                        </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => appendEducation({ id: uuidv4(), name: '', level: '', startYear: '', endYear: '' })}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Education
                    </Button>
                </div>
            </div>

            <Separator />
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="grade" render={({ field }) => (<FormItem><FormLabel>Current Grade/Class</FormLabel><FormControl><Input placeholder="e.g., 10th Class" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="syllabus" render={({ field }) => (<FormItem><FormLabel>Syllabus</FormLabel><FormControl><Input placeholder="e.g., State, CBSE" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="medium" render={({ field }) => (<FormItem><FormLabel>Medium</FormLabel><FormControl><Input placeholder="e.g., English, Hindi" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="school" render={({ field }) => (<FormItem><FormLabel>School/College/University</FormLabel><FormControl><Input placeholder="e.g., Knowledge University" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
             </div>
             
             <div>
                <FormLabel>Interests</FormLabel>
                <div className="flex flex-wrap gap-2 mt-2">
                    {(interestFields as {id: string, value: string}[]).map((field, index) => (
                        <Badge key={field.id} variant="secondary" className="flex items-center gap-1">
                           {field.value}
                           <button type="button" onClick={() => removeInterest(index)}><X className="h-3 w-3"/></button>
                        </Badge>
                    ))}
                </div>
                <div className="flex gap-2 mt-2">
                    <Input id="interest-input" placeholder="Add an interest" onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            const value = e.currentTarget.value;
                            if (value) {
                                appendInterest(value as any);
                                e.currentTarget.value = '';
                            }
                        }
                    }} />
                    <Button type="button" variant="outline" onClick={() => {
                        const input = document.getElementById('interest-input') as HTMLInputElement;
                        if(input.value) { appendInterest(input.value as any); input.value = ''; }
                    }}>Add</Button>
                </div>
             </div>

             <div>
                <FormLabel>Sports</FormLabel>
                <div className="flex flex-wrap gap-2 mt-2">
                    {(sportFields as {id: string, value: string}[]).map((field, index) => (
                        <Badge key={field.id} variant="secondary" className="flex items-center gap-1">
                           {field.value}
                           <button type="button" onClick={() => removeSport(index)}><X className="h-3 w-3"/></button>
                        </Badge>
                    ))}
                </div>
                <div className="flex gap-2 mt-2">
                    <Input id="sport-input" placeholder="Add a sport" onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            const value = e.currentTarget.value;
                            if (value) {
                                appendSport(value as any);
                                e.currentTarget.value = '';
                            }
                        }
                    }} />
                    <Button type="button" variant="outline" onClick={() => {
                        const input = document.getElementById('sport-input') as HTMLInputElement;
                        if(input.value) { appendSport(input.value as any); input.value = ''; }
                    }}>Add</Button>
                </div>
             </div>
            
            <DialogFooter className="sticky bottom-0 bg-background py-4 -mx-6 px-6 border-t">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
    <CameraCaptureDialog
        isOpen={isCameraOpen}
        onOpenChange={setCameraOpen}
        onPhotoCaptured={handlePhotoCaptured}
    />
    </>
  );
}
