'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { PasswordStrength } from '@/components/common/PasswordStrength';

function SetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token || !email) {
      toast.error('Invalid password reset link.');
    }
  }, [token, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !email) return;
    
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long.');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/admins/set-password', {
        email,
        token,
        newPassword: password
      });
      
      toast.success('Password set successfully! You can now log in.');
      router.push('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to set password. Link may be expired.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="p-4 bg-red-100 rounded-full dark:bg-red-900/30">
          <KeyRound className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Invalid Link</h2>
        <p className="text-slate-500 dark:text-slate-400">
          This password setup link is invalid or missing required parameters.
        </p>
        <Button onClick={() => router.push('/login')} variant="outline" className="mt-4">
          Go to Login
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-2">
      <div className="mb-2 p-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Setting password for account:</p>
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 break-all">{email}</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">New Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          required
        />
        <PasswordStrength password={password} className="mt-2" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={isLoading}
          required
        />
      </div>
      <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Set Password & Activate
      </Button>
    </form>
  );
}

export default function SetPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 mb-4">
            <KeyRound className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Welcome to HexTorq Examinations</h1>
          <p className="text-slate-500 dark:text-slate-400">Activate your admin account by setting a secure password.</p>
        </div>
        
        <Card className="border-slate-200 dark:border-slate-800 shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle>Set Password</CardTitle>
            <CardDescription>Enter a strong password for your new account.</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /></div>}>
              <SetPasswordForm />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
