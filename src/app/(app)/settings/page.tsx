'use client';

import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Lock, Unlock, Bot, Trophy, ShoppingBag, MessageSquare, Video, Bell, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { 
  saveParentalControlSettings, 
  getParentalControlSettings, 
  verifyParentalCode,
  checkParentalCodeExists
} from './actions';
import type { ParentalControlSettings } from '@/lib/types';
import { Loader2 } from 'lucide-react';

export default function SettingsPage() {
    const { user, firebaseUser } = useAuth();
    const [isLocked, setIsLocked] = useState(true);
    const [hasCode, setHasCode] = useState<boolean | null>(null); // null = checking, true = has code, false = no code
    const [secretCode, setSecretCode] = useState('');
    const [newParentalCode, setNewParentalCode] = useState('');
    const [confirmCode, setConfirmCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [settings, setSettings] = useState<Partial<ParentalControlSettings>>({
      restrictSpending: false,
      restrictChat: false,
      restrictTalentHub: false,
      restrictAITasks: false,
      restrictContests: false,
      restrictMarketplace: false,
      enableActivityLogs: true,
      notificationInterval: 120, // 2 hours default
    });
    const { toast } = useToast();

    useEffect(() => {
      if (firebaseUser) {
        checkIfCodeExists();
      }
    }, [firebaseUser]);

    useEffect(() => {
      if (firebaseUser && !isLocked) {
        loadSettings();
      }
    }, [firebaseUser, isLocked]);

    const checkIfCodeExists = async () => {
      if (!firebaseUser) return;
      
      try {
        const idToken = await firebaseUser.getIdToken();
        const result = await checkParentalCodeExists(idToken);
        setHasCode(result.hasCode);
      } catch (error) {
        setHasCode(false);
      }
    };

    const loadSettings = async () => {
      if (!firebaseUser) return;
      
      setIsLoading(true);
      try {
        const idToken = await firebaseUser.getIdToken();
        const result = await getParentalControlSettings(idToken);
        if (result.success && result.settings) {
          setSettings(result.settings);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const handleUnlock = async () => {
      if (!firebaseUser) return;
      
      setIsLoading(true);
      try {
        const idToken = await firebaseUser.getIdToken();
        const result = await verifyParentalCode(idToken, secretCode);
        if (result.success) {
          setIsLocked(false);
          toast({ title: 'Controls Unlocked', description: 'You can now manage the settings.' });
          await loadSettings();
        } else {
          toast({ 
            variant: 'destructive', 
            title: 'Incorrect Code', 
            description: result.error || 'The secret code is incorrect. Please try again.' 
          });
        }
      } catch (error: any) {
        toast({ 
          variant: 'destructive', 
          title: 'Error', 
          description: error.message || 'Failed to verify code.' 
        });
      } finally {
        setSecretCode('');
        setIsLoading(false);
      }
    };

    const handleLock = () => {
      setIsLocked(true);
      setNewParentalCode('');
      setConfirmCode('');
    };

    const handleSetInitialCode = async () => {
      if (!firebaseUser) return;
      
      if (!newParentalCode || newParentalCode.length < 4) {
        toast({ 
          variant: 'destructive', 
          title: 'Invalid Code', 
          description: 'Code must be at least 4 characters long.' 
        });
        return;
      }

      if (newParentalCode !== confirmCode) {
        toast({ 
          variant: 'destructive', 
          title: 'Codes Do Not Match', 
          description: 'Please make sure both codes match.' 
        });
        return;
      }

      setIsSaving(true);
      try {
        const idToken = await firebaseUser.getIdToken();
        
        const settingsToSave = {
          ...settings,
          parentalCode: newParentalCode,
        };

        const result = await saveParentalControlSettings(idToken, settingsToSave);
        
        if (result.success) {
          toast({ title: 'Success', description: 'Parental code has been set successfully. You can now unlock controls with this code.' });
          setNewParentalCode('');
          setConfirmCode('');
          setHasCode(true);
          setIsLocked(true); // Lock again after setting code
        } else {
          toast({ 
            variant: 'destructive', 
            title: 'Error', 
            description: result.error || 'Failed to set code.' 
          });
        }
      } catch (error: any) {
        toast({ 
          variant: 'destructive', 
          title: 'Error', 
          description: error.message || 'Failed to set code.' 
        });
      } finally {
        setIsSaving(false);
      }
    };

    const handleSave = async () => {
      if (!firebaseUser) return;
      
      setIsSaving(true);
      try {
        const idToken = await firebaseUser.getIdToken();
        
        const settingsToSave = {
          ...settings,
          parentalCode: newParentalCode && newParentalCode === confirmCode ? newParentalCode : undefined,
        };

        const result = await saveParentalControlSettings(idToken, settingsToSave);
        
        if (result.success) {
          toast({ title: 'Success', description: 'Settings have been saved successfully.' });
          setNewParentalCode('');
          setConfirmCode('');
          if (newParentalCode && newParentalCode === confirmCode) {
            setHasCode(true);
          }
          await loadSettings();
        } else {
          toast({ 
            variant: 'destructive', 
            title: 'Error', 
            description: result.error || 'Failed to save settings.' 
          });
        }
      } catch (error: any) {
        toast({ 
          variant: 'destructive', 
          title: 'Error', 
          description: error.message || 'Failed to save settings.' 
        });
      } finally {
        setIsSaving(false);
      }
    };

    const updateSetting = (key: keyof ParentalControlSettings, value: boolean | number) => {
      setSettings(prev => ({ ...prev, [key]: value }));
    };

    const getIntervalLabel = (minutes: number) => {
      if (minutes < 60) return `${minutes} minutes`;
      if (minutes === 60) return '1 hour';
      const hours = minutes / 60;
      return hours % 1 === 0 ? `${hours} hours` : `${hours.toFixed(1)} hours`;
    };
    
    if (!user) {
        return <p>Loading...</p>;
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="font-headline text-3xl font-semibold md:text-4xl">Parental Controls</h1>
                <p className="text-muted-foreground">Manage parental controls and account restrictions.</p>
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
                                {hasCode === null 
                                    ? "Checking..."
                                    : !hasCode && isLocked
                                    ? "Set up a parental code to manage your child's activities."
                                    : isLocked 
                                    ? "Enter the parental code to manage your child's activities."
                                    : "Controls are unlocked. Lock them again when you're done."
                                }
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {hasCode === null ? (
                                <div className="flex items-center justify-center py-4">
                                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                </div>
                            ) : !hasCode && isLocked ? (
                                // Initial code setup
                                <div className="space-y-4">
                                    <div>
                                        <Label>Set Parental Code</Label>
                                        <Input 
                                            type="password" 
                                            placeholder="New code (4-10 characters)"
                                            value={newParentalCode}
                                            onChange={(e) => setNewParentalCode(e.target.value)}
                                            className="mt-2"
                                        />
                                        <Input 
                                            type="password" 
                                            placeholder="Confirm code"
                                            value={confirmCode}
                                            onChange={(e) => setConfirmCode(e.target.value)}
                                            className="mt-2"
                                        />
                                        {newParentalCode && confirmCode && newParentalCode !== confirmCode && (
                                            <p className="text-sm text-red-500 mt-1">Codes do not match</p>
                                        )}
                                        {newParentalCode && newParentalCode.length < 4 && (
                                            <p className="text-sm text-muted-foreground mt-1">Code must be at least 4 characters</p>
                                        )}
                                    </div>
                                </div>
                            ) : isLocked ? (
                                // Enter existing code
                                <div className="flex items-center gap-2">
                                    <Lock className={cn("h-5 w-5 text-muted-foreground transition-transform")} />
                                    <Input 
                                        id="secret-code" 
                                        type="password" 
                                        maxLength={10} 
                                        placeholder="Enter code" 
                                        className="font-mono tracking-[0.5em] text-center"
                                        value={secretCode}
                                        onChange={(e) => setSecretCode(e.target.value)}
                                        disabled={isLoading}
                                        onKeyDown={(e) => e.key === 'Enter' && secretCode.length >= 4 && handleUnlock()}
                                    />
                                </div>
                            ) : (
                                // Unlocked - can change code
                                <div className="space-y-4">
                                    <div>
                                        <Label>Change Parental Code (Optional)</Label>
                                        <Input 
                                            type="password" 
                                            placeholder="New code (4-10 characters)"
                                            value={newParentalCode}
                                            onChange={(e) => setNewParentalCode(e.target.value)}
                                            className="mt-2"
                                        />
                                        <Input 
                                            type="password" 
                                            placeholder="Confirm code"
                                            value={confirmCode}
                                            onChange={(e) => setConfirmCode(e.target.value)}
                                            className="mt-2"
                                        />
                                        {newParentalCode && confirmCode && newParentalCode !== confirmCode && (
                                            <p className="text-sm text-red-500 mt-1">Codes do not match</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter>
                            {hasCode === null ? (
                                <Button className="w-full" disabled>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Loading...
                                </Button>
                            ) : !hasCode && isLocked ? (
                                <Button 
                                    className="w-full" 
                                    onClick={handleSetInitialCode} 
                                    disabled={!newParentalCode || newParentalCode.length < 4 || newParentalCode !== confirmCode || isSaving}
                                >
                                    {isSaving ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Lock className="mr-2 h-4 w-4" />
                                    )}
                                    Set Parental Code
                                </Button>
                            ) : isLocked ? (
                                <Button 
                                    className="w-full" 
                                    onClick={handleUnlock} 
                                    disabled={secretCode.length < 4 || isLoading}
                                >
                                    {isLoading ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Unlock className="mr-2 h-4 w-4" />
                                    )}
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
                
                <motion.div whileHover={{ y: -2, scale: 1.01 }} className="lg:col-span-2 space-y-6">
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
                                <Switch 
                                    id="spending-switch" 
                                    checked={settings.restrictSpending || false}
                                    onCheckedChange={(checked) => updateSetting('restrictSpending', checked)}
                                    disabled={isLocked}
                                />
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
                                <Switch 
                                    id="ai-task-switch"
                                    checked={settings.restrictAITasks || false}
                                    onCheckedChange={(checked) => updateSetting('restrictAITasks', checked)}
                                    disabled={isLocked}
                                />
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
                                <Switch 
                                    id="contest-switch"
                                    checked={settings.restrictContests || false}
                                    onCheckedChange={(checked) => updateSetting('restrictContests', checked)}
                                    disabled={isLocked}
                                />
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
                                <Switch 
                                    id="marketplace-switch"
                                    checked={settings.restrictMarketplace || false}
                                    onCheckedChange={(checked) => updateSetting('restrictMarketplace', checked)}
                                    disabled={isLocked}
                                />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between space-x-2">
                                <Label htmlFor="chat-switch" className="flex items-center gap-3">
                                    <MessageSquare className="h-5 w-5 text-muted-foreground"/>
                                    <div className="flex flex-col space-y-1">
                                        <span>Restrict Chat</span>
                                        <span className="font-normal leading-snug text-muted-foreground">
                                            Limit chat interactions to followers only.
                                        </span>
                                    </div>
                                </Label>
                                <Switch 
                                    id="chat-switch"
                                    checked={settings.restrictChat || false}
                                    onCheckedChange={(checked) => updateSetting('restrictChat', checked)}
                                    disabled={isLocked}
                                />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between space-x-2">
                                <Label htmlFor="talent-hub-switch" className="flex items-center gap-3">
                                    <Video className="h-5 w-5 text-muted-foreground"/>
                                    <div className="flex flex-col space-y-1">
                                        <span>Restrict Talent Hub Content</span>
                                        <span className="font-normal leading-snug text-muted-foreground">
                                            Hide content that may not be suitable for all ages.
                                        </span>
                                    </div>
                                </Label>
                                <Switch 
                                    id="talent-hub-switch"
                                    checked={settings.restrictTalentHub || false}
                                    onCheckedChange={(checked) => updateSetting('restrictTalentHub', checked)}
                                    disabled={isLocked}
                                />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between space-x-2">
                                <Label htmlFor="activity-logs-switch" className="flex items-center gap-3">
                                    <Activity className="h-5 w-5 text-muted-foreground"/>
                                    <div className="flex flex-col space-y-1">
                                        <span>Enable Activity Logs</span>
                                        <span className="font-normal leading-snug text-muted-foreground">
                                            Track and log all activities for review.
                                        </span>
                                    </div>
                                </Label>
                                <Switch 
                                    id="activity-logs-switch"
                                    checked={settings.enableActivityLogs !== false}
                                    onCheckedChange={(checked) => updateSetting('enableActivityLogs', checked)}
                                    disabled={isLocked}
                                />
                            </div>
                            <Separator />
                            <div className="space-y-2">
                                <Label htmlFor="notification-interval" className="flex items-center gap-3">
                                    <Bell className="h-5 w-5 text-muted-foreground"/>
                                    <div className="flex flex-col space-y-1">
                                        <span>Notification Interval</span>
                                        <span className="font-normal leading-snug text-muted-foreground">
                                            How often to send activity summaries to parents.
                                        </span>
                                    </div>
                                </Label>
                                <Select
                                    value={(settings.notificationInterval || 120).toString()}
                                    onValueChange={(value) => updateSetting('notificationInterval', parseInt(value))}
                                    disabled={isLocked}
                                >
                                    <SelectTrigger id="notification-interval">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="15">15 minutes</SelectItem>
                                        <SelectItem value="30">30 minutes</SelectItem>
                                        <SelectItem value="60">1 hour</SelectItem>
                                        <SelectItem value="120">2 hours (default)</SelectItem>
                                        <SelectItem value="240">4 hours</SelectItem>
                                        <SelectItem value="480">8 hours</SelectItem>
                                        <SelectItem value="720">12 hours</SelectItem>
                                        <SelectItem value="1440">24 hours</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    Current: {getIntervalLabel(settings.notificationInterval || 120)}
                                </p>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button 
                                onClick={handleSave} 
                                disabled={isLocked || isSaving}
                                className="w-full"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save Changes'
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                </motion.div>
            </motion.div>
        </div>
    )
}
