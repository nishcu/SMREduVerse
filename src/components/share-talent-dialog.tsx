'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ShareTalentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareTalentDialog({ isOpen, onOpenChange }: ShareTalentDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    // In a real app, this would handle file upload and form submission to a server action.
    await new Promise((resolve) => setTimeout(resolve, 1500));
    toast({
        title: "Talent Shared!",
        description: "Your content has been submitted for review."
    });
    setIsSubmitting(false);
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Your Talent</DialogTitle>
          <DialogDescription>
            Upload a video or image to showcase your skills to the community.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" placeholder="e.g., 'My Latest Piano Performance'" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select required defaultValue="Music">
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Music">Music</SelectItem>
                <SelectItem value="Art">Art</SelectItem>
                <SelectItem value="Performance">Performance</SelectItem>
                <SelectItem value="Mini Skits">Mini Skits</SelectItem>
                <SelectItem value="Puppet Show">Puppet Show</SelectItem>
                <SelectItem value="Story Telling">Story Telling</SelectItem>
                <SelectItem value="Magic">Magic</SelectItem>
                <SelectItem value="Comedy">Comedy</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="media">Upload Media</Label>
            <Input id="media" type="file" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" placeholder="Tell us a little about your talent." />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Share Now'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
