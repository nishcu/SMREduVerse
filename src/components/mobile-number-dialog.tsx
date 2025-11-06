'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Phone } from 'lucide-react';
import { updateUserProfileAction } from '@/app/(app)/profile/[uid]/actions';

interface MobileNumberDialogProps {
  isOpen: boolean;
  userId: string;
  onComplete: () => void;
}

export function MobileNumberDialog({ isOpen, userId, onComplete }: MobileNumberDialogProps) {
  const [mobileNumber, setMobileNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { firebaseUser } = useAuth();

  const validateMobileNumber = (number: string): boolean => {
    // Remove all non-digit characters
    const cleaned = number.replace(/\D/g, '');
    // Check if it's a valid mobile number (10-15 digits)
    return cleaned.length >= 10 && cleaned.length <= 15;
  };

  const formatMobileNumber = (number: string): string => {
    // Remove all non-digit characters
    const cleaned = number.replace(/\D/g, '');
    // Format as needed (you can customize this based on your region)
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    if (cleaned.length <= 10) return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    return cleaned;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firebaseUser) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be signed in to update your profile.',
      });
      return;
    }
    
    if (!validateMobileNumber(mobileNumber)) {
      toast({
        variant: 'destructive',
        title: 'Invalid Mobile Number',
        description: 'Please enter a valid mobile number (10-15 digits).',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const idToken = await firebaseUser.getIdToken();
      const cleanedNumber = mobileNumber.replace(/\D/g, '');
      
      // Fetch current user profile to preserve existing data
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      const userRef = doc(db, `users/${userId}/profile/${userId}`);
      const userSnap = await getDoc(userRef);
      const currentProfile = userSnap.exists() ? userSnap.data() : {};
      
      const formData = new FormData();
      formData.append('idToken', idToken);
      formData.append('mobileNumber', cleanedNumber);
      // Include all existing profile fields to preserve them
      formData.append('name', currentProfile.name || firebaseUser.displayName || '');
      formData.append('username', currentProfile.username || firebaseUser.email?.split('@')[0] || '');
      formData.append('bio', currentProfile.bio || '');
      formData.append('avatarUrl', currentProfile.avatarUrl || firebaseUser.photoURL || '');
      formData.append('grade', currentProfile.grade || '');
      formData.append('school', currentProfile.school || '');
      formData.append('syllabus', currentProfile.syllabus || '');
      formData.append('medium', currentProfile.medium || '');
      
      const result = await updateUserProfileAction(null, formData);
      
      if (result.success) {
        toast({
          title: 'Mobile Number Added',
          description: 'Your mobile number has been saved successfully.',
        });
        onComplete();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Failed to save mobile number. Please try again.',
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to save mobile number. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-4">
            <Phone className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle>Add Your Mobile Number</DialogTitle>
          <DialogDescription>
            Add your mobile number to receive important updates and notifications. 
            This helps us keep your account secure.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mobile-number">Mobile Number</Label>
            <Input
              id="mobile-number"
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={mobileNumber}
              onChange={(e) => {
                const formatted = formatMobileNumber(e.target.value);
                setMobileNumber(formatted);
              }}
              maxLength={18}
              required
            />
            <p className="text-xs text-muted-foreground">
              Enter your mobile number with country code (e.g., +1 5551234567)
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleSkip}
              className="flex-1"
              disabled={isSubmitting}
            >
              Skip for Now
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting || !mobileNumber.trim()}>
              {isSubmitting ? 'Saving...' : 'Save & Continue'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

