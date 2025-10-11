
'use client';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, Unlock, Bot, Trophy, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
    const { user } = useAuth();
    const [isLocked, setIsLocked] = useState(true);
    const [secretCode, setSecretCode] = useState('');
    const { toast } = useToast();

    // In a real app, this would be saved and fetched from the user's settings.
    const PARENT_CODE = '1234'; 

    const handleUnlock = () => {
        if (secretCode === PARENT_CODE) {
            setIsLocked(false);
            toast({ title: 'Controls Unlocked', description: 'You can now manage the settings.' });
        } else {
            toast({ variant: 'destructive', title: 'Incorrect Code', description: 'The secret code is incorrect. Please try again.' });
        }
        setSecretCode('');
    };

    const handleLock = () => {
        setIsLocked(true);
    }
    
    if (!user) {
        return <p>Loading...</p>;
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="font-headline text-3xl font-semibold md:text-4xl">Settings</h1>
                <p className="text-muted-foreground">Manage your account and platform settings.</p>
            </div>
            
            <motion.div 
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ staggerChildren: 0.1 }}
            >
                <motion.div whileHover={{ y: -2, scale: 1.01 }} className="lg:col-span-1">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Parental Controls</CardTitle>
                            <CardDescription>
                                {isLocked 
                                    ? "Enter the 4-digit secret code to manage your child's activities."
                                    : "Controls are unlocked. Lock them again when you're done."
                                }
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Lock className={cn("h-5 w-5 text-muted-foreground transition-transform", !isLocked && 'rotate-12')} />
                                <Input 
                                    id="secret-code" 
                                    type="password" 
                                    maxLength={4} 
                                    placeholder="••••" 
                                    className="font-mono tracking-[0.5em] text-center"
                                    value={secretCode}
                                    onChange={(e) => setSecretCode(e.target.value)}
                                    disabled={!isLocked}
                                />
                            </div>
                        </CardContent>
                        <CardFooter>
                            {isLocked ? (
                                <Button className="w-full" onClick={handleUnlock} disabled={secretCode.length < 4}>
                                    <Unlock className="mr-2 h-4 w-4" />
                                    Unlock Controls
                                </Button>
                            ) : (
                                <Button className="w-full" onClick={handleLock} variant="destructive">
                                    <Lock className="mr-2 h-4 w-4" />
                                    Lock Controls
                                </Button>
                            )}
                        </CardFooter>
                    </Card>
                </motion.div>
                
                <motion.div whileHover={{ y: -2, scale: 1.01 }} className="lg:col-span-2">
                    <Card className={cn("transition-opacity", isLocked && "opacity-60 pointer-events-none")}>
                        <CardHeader>
                        <CardTitle>Restriction Settings</CardTitle>
                        <CardDescription>
                            Enable or disable specific features for this account.
                        </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                        <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="spending-switch" className="flex flex-col space-y-1">
                            <span>Disable Coin Spending</span>
                            <span className="font-normal leading-snug text-muted-foreground">
                                Prevent use of Knowledge Coins on all purchases.
                            </span>
                            </Label>
                            <Switch id="spending-switch" disabled={isLocked}/>
                        </div>
                        <Separator />
                         <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="ai-task-switch" className="flex items-center gap-3">
                                <Bot className="h-5 w-5 text-muted-foreground"/>
                                <div className="flex flex-col space-y-1">
                                    <span>Restrict AI Task Generation</span>
                                    <span className="font-normal leading-snug text-muted-foreground">
                                        Disable spending coins in the Brain Lab.
                                    </span>
                                </div>
                            </Label>
                            <Switch id="ai-task-switch" disabled={isLocked}/>
                        </div>
                         <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="contest-switch" className="flex items-center gap-3">
                                <Trophy className="h-5 w-5 text-muted-foreground"/>
                                <div className="flex flex-col space-y-1">
                                    <span>Disable Contest Entry</span>
                                    <span className="font-normal leading-snug text-muted-foreground">
                                        Prevent joining contests with entry fees.
                                    </span>
                                </div>
                            </Label>
                            <Switch id="contest-switch" disabled={isLocked}/>
                        </div>
                        <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="marketplace-switch" className="flex items-center gap-3">
                                <ShoppingBag className="h-5 w-5 text-muted-foreground"/>
                                <div className="flex flex-col space-y-1">
                                    <span>Disable Marketplace Purchases</span>
                                    <span className="font-normal leading-snug text-muted-foreground">
                                        Prevent purchases from partner shops.
                                    </span>
                                </div>
                            </Label>
                            <Switch id="marketplace-switch" disabled={isLocked}/>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="chat-switch" className="flex flex-col space-y-1">
                            <span>Restrict Chat</span>
                            <span className="font-normal leading-snug text-muted-foreground">
                                Limit chat interactions to followers only.
                            </span>
                            </Label>
                            <Switch id="chat-switch" disabled={isLocked}/>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="talent-hub-switch" className="flex flex-col space-y-1">
                            <span>Restrict Talent Hub Content</span>
                            <span className="font-normal leading-snug text-muted-foreground">
                                Hide content that may not be suitable for all ages.
                            </span>
                            </Label>
                            <Switch id="talent-hub-switch" defaultChecked disabled={isLocked}/>
                        </div>
                        </CardContent>
                         <CardFooter>
                            <Button disabled={isLocked}>Save Changes</Button>
                        </CardFooter>
                    </Card>
                </motion.div>

            </motion.div>
        </div>
    )
}
