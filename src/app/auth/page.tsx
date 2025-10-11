'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Logo } from '@/components/logo';
import { GraduationCap, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function LoginForm() {
  const { user, loginWithGoogle, loginWithEmail } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
    } catch (e: any) {
      setError(e.message);
      setIsGoogleLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEmailLoading(true);
    setError(null);
    try {
      await loginWithEmail(email, password);
    } catch (e: any) {
      handleAuthError(e);
      setIsEmailLoading(false);
    }
  };

  const handleAuthError = (e: any) => {
    switch (e.code) {
      case 'auth/user-not-found':
        setError('No account found with this email address.');
        break;
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        setError('Incorrect email or password. Please try again.');
        break;
      default:
        setError('An unexpected error occurred. Please try again.');
        break;
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleEmailLogin} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={isEmailLoading || isGoogleLoading}>
          {isEmailLoading ? <Loader2 className="animate-spin" /> : 'Sign In'}
        </Button>
      </form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center"><Separator /></div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>
      <Button variant="outline" onClick={handleGoogleLogin} className="w-full" disabled={isEmailLoading || isGoogleLoading}>
        {isGoogleLoading ? <Loader2 className="animate-spin" /> : 'Sign In with Google'}
      </Button>
    </div>
  );
}

function SignupForm() {
  const { user, signupWithEmail } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSigningUp, setIsSigningUp] = useState(false);

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSigningUp(true);
    setError(null);
    try {
      await signupWithEmail(name, email, password);
    } catch (e: any) {
      switch (e.code) {
        case 'auth/email-already-in-use':
          setError('This email address is already in use.');
          break;
        case 'auth/weak-password':
          setError('The password must be at least 6 characters long.');
          break;
        default:
          setError('An unexpected error occurred. Please try again.');
          break;
      }
      setIsSigningUp(false);
    }
  };

  return (
    <form onSubmit={handleSignup} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signup-name">Full Name</Label>
        <Input id="signup-name" type="text" placeholder="John Doe" required value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <Input id="signup-email" type="email" placeholder="m@example.com" required value={email} onChange={e => setEmail(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <Input id="signup-password" type="password" placeholder="••••••" required value={password} onChange={e => setPassword(e.target.value)} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={isSigningUp}>
        {isSigningUp ? <Loader2 className="animate-spin" /> : 'Create Account'}
      </Button>
    </form>
  );
}

export default function AuthPage() {
  const { loading } = useAuth();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-secondary via-background to-background opacity-50"></div>
      <Card className="relative z-10 w-full max-w-sm shadow-2xl">
        <CardHeader className="text-center">
          <Link href="/" className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 transition-transform hover:scale-110">
            <GraduationCap className="h-8 w-8 text-primary" />
          </Link>
          <CardTitle className="font-headline text-3xl">Welcome</CardTitle>
          <CardDescription>The All-in-One Education Platform.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="animate-spin text-primary h-12 w-12" />
            </div>
          ) : (
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              <TabsContent value="signin" className="pt-4">
                <LoginForm />
              </TabsContent>
              <TabsContent value="signup" className="pt-4">
                <SignupForm />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
      <div className="absolute bottom-4 z-10">
        <Logo />
      </div>
    </div>
  );
}
