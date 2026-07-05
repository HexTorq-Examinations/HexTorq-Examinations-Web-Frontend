'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Shield, User, GraduationCap, ChevronRight, Eye, EyeOff } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().min(1, 'Please enter your email or Student ID'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const demoAccounts = [
  { role: 'Super Admin', email: 'superadmin@example.com', icon: Shield, color: 'text-purple-600', bg: 'bg-purple-50 hover:bg-purple-100 border-purple-200', badge: 'bg-purple-100 text-purple-700' },
  { role: 'Admin', email: 'admin@example.com', icon: User, color: 'text-blue-600', bg: 'bg-blue-50 hover:bg-blue-100 border-blue-200', badge: 'bg-blue-100 text-blue-700' },
  { role: 'Student', email: 'student@example.com', icon: GraduationCap, color: 'text-emerald-600', bg: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200', badge: 'bg-emerald-100 text-emerald-700' },
];

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setErrorMsg('');
    try {
      await login(data);
      const user = useAuthStore.getState().user;
      toast.success(`Welcome back, ${user?.name}!`);
      if (user?.role === 'SUPER_ADMIN') router.push('/super-admin/dashboard');
      else if (user?.role === 'ADMIN') router.push('/admin/dashboard');
      else router.push('/student/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid credentials. Please try again.');
    }
  };

  const fillCredentials = (email: string) => {
    setValue('email', email);
    setValue('password', 'password123');
  };

  return (
    <div className="w-full space-y-4">
      {/* Main Login Card */}
      <Card className="w-full shadow-xl border-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md">
        <CardHeader className="space-y-2 text-center pb-4">
          <div className="mx-auto w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 mb-2">
            <span className="text-white font-bold text-xl">EA</span>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Enterprise Assessment
          </CardTitle>
          <CardDescription className="text-slate-500">
            Sign in to access your portal
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {errorMsg && (
              <div className="p-3 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-900/50">
                {errorMsg}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email address / Student ID</Label>
              <Input
                id="email"
                type="text"
                placeholder="name@example.com or ENR-001"
                {...register('email')}
                className={`h-11 ${errors.email ? 'border-red-500' : ''}`}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button type="button" className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  {...register('password')}
                  className={`h-11 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <Button type="submit" className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">Sign In <ChevronRight className="h-4 w-4" /></span>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Demo Accounts Panel */}
      <Card className="w-full shadow-sm border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md">
        <CardContent className="pt-4 pb-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 text-center mb-3">
            Demo Accounts — click to auto-fill
          </p>
          {demoAccounts.map((account) => (
            <button
              key={account.role}
              type="button"
              onClick={() => fillCredentials(account.email)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${account.bg} dark:bg-slate-800/50 dark:border-slate-700 dark:hover:bg-slate-800`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${account.badge}`}>
                <account.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${account.color}`}>{account.role}</p>
                <p className="text-xs text-slate-500 truncate">{account.email}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
            </button>
          ))}
          <p className="text-xs text-center text-slate-400 pt-1">
            Password: <span className="font-mono font-semibold text-slate-600 dark:text-slate-400">password123</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
