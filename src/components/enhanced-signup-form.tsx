'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Check, X, Eye, EyeOff } from 'lucide-react';
import { MobileNumberDialog } from './mobile-number-dialog';
import Link from 'next/link';

export function EnhancedSignupForm() {
  const { user, signupWithEmail } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [showMobileDialog, setShowMobileDialog] = useState(false);
  const [newUserId, setNewUserId] = useState<string | null>(null);
  
  // Legal agreement checkboxes
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedRefunds, setAcceptedRefunds] = useState(false);
  const [acceptedShipping, setAcceptedShipping] = useState(false);

  // Password validation
  const [passwordChecks, setPasswordChecks] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  // Email validation
  const [emailError, setEmailError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      // Check if user just signed up (new user without mobile number)
      if (!user.mobileNumber) {
        setNewUserId(user.id);
        setShowMobileDialog(true);
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, router]);

  // Validate email format
  const validateEmail = (emailValue: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailValue) {
      setEmailError(null);
      return false;
    }
    if (!emailRegex.test(emailValue)) {
      setEmailError('Please enter a valid email address.');
      return false;
    }
    setEmailError(null);
    return true;
  };

  // Validate password strength
  useEffect(() => {
    setPasswordChecks({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    });
  }, [password]);

  const isPasswordValid = Object.values(passwordChecks).every(check => check);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate email
    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    // Validate password
    if (!isPasswordValid) {
      setError('Please ensure your password meets all requirements.');
      return;
    }

    // Check if passwords match
    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }

    // Check if all legal agreements are accepted
    if (!acceptedTerms || !acceptedPrivacy || !acceptedRefunds || !acceptedShipping) {
      setError('Please accept all terms and policies to continue.');
      return;
    }

    setIsSigningUp(true);
    try {
      await signupWithEmail(name, email, password);
      // The useEffect will handle showing the mobile dialog when user is created
    } catch (e: any) {
      switch (e.code) {
        case 'auth/email-already-in-use':
          setError('This email address is already in use. Please sign in instead.');
          break;
        case 'auth/weak-password':
          setError('The password is too weak. Please use a stronger password.');
          break;
        case 'auth/invalid-email':
          setError('Please enter a valid email address.');
          break;
        default:
          setError(e.message || 'An unexpected error occurred. Please try again.');
          break;
      }
      setIsSigningUp(false);
    }
  };

  const handleMobileDialogComplete = () => {
    setShowMobileDialog(false);
    router.push('/dashboard');
  };

  return (
    <>
      <form onSubmit={handleSignup} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="signup-name">Full Name</Label>
          <Input
            id="signup-name"
            type="text"
            placeholder="John Doe"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            minLength={2}
            maxLength={100}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="signup-email">Email</Label>
          <Input
            id="signup-email"
            type="email"
            placeholder="john.doe@example.com"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              validateEmail(e.target.value);
            }}
            className={emailError ? 'border-destructive' : ''}
          />
          {emailError && (
            <p className="text-xs text-destructive">{emailError}</p>
          )}
          {email && !emailError && (
            <p className="text-xs text-green-600 flex items-center gap-1">
              <Check className="h-3 w-3" />
              Valid email format
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="signup-password">Password</Label>
          <div className="relative">
            <Input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a strong password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          
          {/* Password Requirements */}
          <div className="space-y-1 text-xs">
            <div className={`flex items-center gap-2 ${passwordChecks.length ? 'text-green-600' : 'text-muted-foreground'}`}>
              {passwordChecks.length ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
              <span>At least 8 characters</span>
            </div>
            <div className={`flex items-center gap-2 ${passwordChecks.uppercase ? 'text-green-600' : 'text-muted-foreground'}`}>
              {passwordChecks.uppercase ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
              <span>One uppercase letter</span>
            </div>
            <div className={`flex items-center gap-2 ${passwordChecks.lowercase ? 'text-green-600' : 'text-muted-foreground'}`}>
              {passwordChecks.lowercase ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
              <span>One lowercase letter</span>
            </div>
            <div className={`flex items-center gap-2 ${passwordChecks.number ? 'text-green-600' : 'text-muted-foreground'}`}>
              {passwordChecks.number ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
              <span>One number</span>
            </div>
            <div className={`flex items-center gap-2 ${passwordChecks.special ? 'text-green-600' : 'text-muted-foreground'}`}>
              {passwordChecks.special ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
              <span>One special character</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm Password</Label>
          <div className="relative">
            <Input
              id="confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm your password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={confirmPassword && !passwordsMatch ? 'border-destructive' : ''}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {confirmPassword && (
            <p className={`text-xs flex items-center gap-1 ${passwordsMatch ? 'text-green-600' : 'text-destructive'}`}>
              {passwordsMatch ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
              {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
            </p>
          )}
        </div>

        {/* Legal Agreement Checkboxes */}
        <div className="space-y-3 pt-2">
          <div className="flex items-start space-x-2">
            <Checkbox
              id="terms"
              checked={acceptedTerms}
              onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
              className="mt-1"
            />
            <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
              I accept the{' '}
              <Link href="/legal/terms" target="_blank" className="text-primary underline hover:text-primary/80">
                Terms & Conditions
              </Link>
            </Label>
          </div>
          
          <div className="flex items-start space-x-2">
            <Checkbox
              id="privacy"
              checked={acceptedPrivacy}
              onCheckedChange={(checked) => setAcceptedPrivacy(checked === true)}
              className="mt-1"
            />
            <Label htmlFor="privacy" className="text-sm leading-relaxed cursor-pointer">
              I accept the{' '}
              <Link href="/legal/privacy" target="_blank" className="text-primary underline hover:text-primary/80">
                Privacy Policy
              </Link>
            </Label>
          </div>
          
          <div className="flex items-start space-x-2">
            <Checkbox
              id="refunds"
              checked={acceptedRefunds}
              onCheckedChange={(checked) => setAcceptedRefunds(checked === true)}
              className="mt-1"
            />
            <Label htmlFor="refunds" className="text-sm leading-relaxed cursor-pointer">
              I accept the{' '}
              <Link href="/legal/refunds" target="_blank" className="text-primary underline hover:text-primary/80">
                Refunds & Cancellations Policy
              </Link>
            </Label>
          </div>
          
          <div className="flex items-start space-x-2">
            <Checkbox
              id="shipping"
              checked={acceptedShipping}
              onCheckedChange={(checked) => setAcceptedShipping(checked === true)}
              className="mt-1"
            />
            <Label htmlFor="shipping" className="text-sm leading-relaxed cursor-pointer">
              I accept the{' '}
              <Link href="/legal/shipping" target="_blank" className="text-primary underline hover:text-primary/80">
                Shipping Policy
              </Link>
            </Label>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={
            isSigningUp || 
            !isPasswordValid || 
            !passwordsMatch || 
            !name.trim() || 
            !email.trim() || 
            !!emailError ||
            !acceptedTerms ||
            !acceptedPrivacy ||
            !acceptedRefunds ||
            !acceptedShipping
          }
        >
          {isSigningUp ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Account...
            </>
          ) : (
            'Create Account'
          )}
        </Button>
      </form>

      {showMobileDialog && newUserId && (
        <MobileNumberDialog
          isOpen={showMobileDialog}
          userId={newUserId}
          onComplete={handleMobileDialogComplete}
        />
      )}
    </>
  );
}

