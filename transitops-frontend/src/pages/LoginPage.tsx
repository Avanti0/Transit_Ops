import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';

interface DemoCredential {
  email: string;
  password: string;
  role: string;
  color: string;
}

const DEMO_CREDENTIALS: DemoCredential[] = [
  {
    email: 'admin@transitops.com',
    password: 'admin123',
    role: 'Fleet Manager',
    color: 'bg-blue-100 text-blue-700',
  },
  {
    email: 'driver@transitops.com',
    password: 'driver123',
    role: 'Driver',
    color: 'bg-green-100 text-green-700',
  },
  {
    email: 'safety@transitops.com',
    password: 'safety123',
    role: 'Safety Officer',
    color: 'bg-amber-100 text-amber-700',
  },
  {
    email: 'finance@transitops.com',
    password: 'finance123',
    role: 'Financial Analyst',
    color: 'bg-purple-100 text-purple-700',
  },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setLocalError('Please enter both email and password.');
      return;
    }
    setLocalError(null);
    setSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setLocalError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const fillCredentials = (cred: DemoCredential) => {
    setEmail(cred.email);
    setPassword(cred.password);
    setLocalError(null);
  };

  const isFormLoading = submitting || isLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center p-4">
      {/* Decorative circles */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 pt-8 pb-6 text-white text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="bg-white/20 rounded-xl p-2.5">
                <Truck className="h-7 w-7 text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tight">TransitOps</span>
            </div>
            <p className="text-blue-100 text-sm font-medium">Smart Transport Operations Platform</p>
          </div>

          {/* Form */}
          <div className="px-8 py-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-1">Welcome back</h2>
            <p className="text-slate-500 text-sm mb-6">Sign in to your account to continue</p>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Error message */}
              {localError && (
                <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                  <span className="text-red-600 text-sm font-medium">{localError}</span>
                </div>
              )}

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-slate-700 font-medium">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@transitops.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setLocalError(null);
                  }}
                  disabled={isFormLoading}
                  className={cn(localError && 'border-red-400 focus-visible:ring-red-400')}
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-slate-700 font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setLocalError(null);
                    }}
                    disabled={isFormLoading}
                    className={cn(
                      'pr-10',
                      localError && 'border-red-400 focus-visible:ring-red-400',
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full h-11 text-base font-semibold"
                disabled={isFormLoading}
              >
                {isFormLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </div>

          {/* Demo credentials */}
          <div className="px-8 pb-7 border-t border-slate-100 pt-5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Demo accounts — click to fill
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_CREDENTIALS.map((cred) => (
                <button
                  key={cred.email}
                  type="button"
                  onClick={() => fillCredentials(cred)}
                  disabled={isFormLoading}
                  className={cn(
                    'flex flex-col items-start rounded-lg px-3 py-2 text-left transition-all hover:scale-[1.02] active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed border border-transparent hover:border-current/10',
                    cred.color,
                  )}
                >
                  <span className="text-xs font-semibold">{cred.role}</span>
                  <span className="text-[11px] opacity-75 truncate w-full">{cred.email}</span>
                  <span className="text-[11px] opacity-60 font-mono mt-0.5">{cred.password}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-white/60 text-xs mt-5">
          TransitOps © {new Date().getFullYear()} — Fleet Management System
        </p>
      </div>
    </div>
  );
}
