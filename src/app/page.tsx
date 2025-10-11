'use client';

import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import Link from 'next/link';
import { SplashScreen } from '@/components/splash-screen';
import { motion } from 'framer-motion';

export default function LandingPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-secondary via-background to-background opacity-50"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 flex flex-col items-center justify-center w-full max-w-md text-center"
      >
        <div className="mb-8">
            <Logo />
        </div>

        <SplashScreen />

        <div className="w-full px-8 mt-10">
          <motion.div whileHover={{ scale: 1.05 }}>
            <Button asChild className="w-full" size="lg">
              <Link href="/auth">Get Started</Link>
            </Button>
          </motion.div>
          <p className="mt-4 text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/auth" className="font-semibold text-primary hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
