'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { MobileNumberDialog } from './mobile-number-dialog';

export function MobileNumberPrompt() {
  const { user } = useAuth();
  const [showDialog, setShowDialog] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // Only check once when user is loaded
    if (user && !hasChecked) {
      setHasChecked(true);
      // Check if user doesn't have a mobile number
      if (!user.mobileNumber) {
        // Show dialog after a short delay to avoid showing immediately on page load
        const timer = setTimeout(() => {
          setShowDialog(true);
        }, 2000); // 2 second delay
        return () => clearTimeout(timer);
      }
    }
  }, [user, hasChecked]);

  const handleComplete = () => {
    setShowDialog(false);
  };

  if (!user || !showDialog) return null;

  return (
    <MobileNumberDialog
      isOpen={showDialog}
      userId={user.id}
      onComplete={handleComplete}
    />
  );
}

