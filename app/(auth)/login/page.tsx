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
import { toast } from 'sonner';
import { Eye, EyeOff, Hexagon, ArrowRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const loginSchema = z.object({
  email: z.string().min(1, 'Please enter your email or Student ID'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
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

  return (
    <div className="w-full relative">
      {/* Decorative background elements behind the card */}
      <div className="absolute -top-20 -left-20 w-64 h-64 bg-blue-500/30 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-purple-500/30 rounded-full blur-[100px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full overflow-hidden rounded-[2rem] border border-white/20 dark:border-white/10 bg-white/60 dark:bg-slate-950/60 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.4)]"
      >
        <div className="p-8 md:p-10 space-y-8">
          <div className="text-center space-y-3">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
              className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30 mb-6 relative group"
            >
              <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <Hexagon className="text-white w-8 h-8 fill-white/10" strokeWidth={1.5} />
            </motion.div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
              HexTorq Exams
            </h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Online Examination Platform
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <AnimatePresence>
              {errorMsg && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-3 text-sm font-medium text-red-600 bg-red-500/10 rounded-xl border border-red-500/20 text-center">
                    {errorMsg}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1">Identity</Label>
                <div className="relative group">
                  <Input
                    id="email"
                    type="text"
                    placeholder="Email or Student ID"
                    {...register('email')}
                    className={`h-12 bg-white/50 dark:bg-slate-900/50 border-slate-200/60 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900 transition-all rounded-xl shadow-sm ${errors.email ? 'border-red-500 focus-visible:ring-red-500' : 'focus-visible:ring-blue-500'}`}
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-focus-within:opacity-10 -z-10 blur transition-opacity" />
                </div>
                {errors.email && <p className="text-xs text-red-500 ml-1 mt-1">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1">Security Key</Label>
                <div className="relative group">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...register('password')}
                    className={`h-12 pr-12 bg-white/50 dark:bg-slate-900/50 border-slate-200/60 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900 transition-all rounded-xl shadow-sm tracking-widest placeholder:tracking-normal ${errors.password ? 'border-red-500 focus-visible:ring-red-500' : 'focus-visible:ring-blue-500'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-0 bottom-0 m-auto h-6 w-6 flex items-center justify-center text-slate-400 hover:text-blue-500 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-focus-within:opacity-10 -z-10 blur transition-opacity" />
                </div>
                {errors.password && <p className="text-xs text-red-500 ml-1 mt-1">{errors.password.message}</p>}
              </div>
              <div className="text-right">
                <Link href="/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                  Forgot password?
                </Link>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-slate-900 hover:bg-blue-600 dark:bg-white dark:text-slate-900 dark:hover:bg-blue-500 dark:hover:text-white transition-all duration-300 rounded-xl font-bold shadow-lg shadow-slate-900/20 dark:shadow-white/10 group overflow-hidden relative" 
              disabled={isLoading}
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Authenticating...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Access Portal <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </Button>
          </form>
        </div>
        
        {/* Sleek bottom border accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
      </motion.div>
    </div>
  );
}
