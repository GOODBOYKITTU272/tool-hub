import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Wrench, Loader2, Eye, EyeOff, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter your email and password');
      return;
    }

    setIsLoading(true);

    try {
      // Authenticate with Supabase (no MFA)
      const result = await login(email, password);

      if (result.success) {
        toast({
          title: 'Welcome back!',
          description: 'You have successfully logged in.',
        });

        // Check if password reset is needed
        if (result.needsPasswordReset) {
          navigate('/password-reset');
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(result.error || 'Invalid email or password');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!mfaCode || mfaCode.length < 6) {
      setError('Please enter a valid 6-digit security code');
      return;
    }

    console.log('🔐 [Login] Starting MFA verification...');
    setIsLoading(true);
    try {
      const result = await verifyMfa(mfaCode);
      console.log('🔍 [Login] MFA Result:', result);

      if (result.success) {
        console.log('✅ [Login] MFA verified successfully, navigating to dashboard...');
        toast({
          title: 'Welcome back!',
          description: 'MFA Verification successful.',
        });
        navigate('/dashboard');
        console.log('🚀 [Login] Navigation triggered');
      } else {
        console.error('❌ [Login] MFA verification failed:', result.error);
        setError(result.error || 'Invalid security code');
      }
    } catch (err) {
      console.error('❌ [Login] MFA exception:', err);
      setError('MFA verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md animate-scale-in">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 w-12 h-12 bg-[#d946ef] rounded-[14px] flex items-center justify-center shadow-lg shadow-magenta-500/20">
            <Wrench className="w-7 h-7 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 mb-1">Welcome Back</CardTitle>
          <CardDescription className="space-y-1">
            <div className="text-[15px] text-slate-600">Sign in to access your tool management dashboard</div>
            <div className="text-xs font-bold text-[#d131b7] mt-3 bg-[#fce7f3] px-3 py-1.5 rounded-full inline-flex items-center gap-1.5">
              <span>🔒</span> ApplyWizz Team Only • @applywizz.com emails required
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'credentials' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="yourname@applywizz.com"
                  pattern=".*@applywizz\.com$"
                  title="Please use your @applywizz.com email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    autoComplete="current-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-sm text-destructive animate-fade-in">{error}</p>
              )}

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleMfaSubmit} className="space-y-5">
              <div className="mx-auto mb-6 w-14 h-14 bg-[#fdf2f8] rounded-2xl flex items-center justify-center border border-pink-100">
                <Lock className="w-7 h-7 text-[#d946ef]" />
              </div>
              <div className="text-center space-y-1 mb-8">
                <h3 className="font-bold text-xl text-slate-900">Verification Required</h3>
                <p className="text-[14px] text-slate-500 leading-relaxed px-4">
                  Open your <strong className="text-slate-900">Microsoft Authenticator</strong> app and enter the 6-digit security code.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mfaCode">Security Code</Label>
                <Input
                  id="mfaCode"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  className="text-center text-2xl tracking-[0.5em] font-mono"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                  disabled={isLoading}
                  autoFocus
                />
              </div>

              {error && (
                <p className="text-sm text-destructive animate-fade-in text-center">{error}</p>
              )}

              <Button
                type="submit"
                className="w-full bg-[#f472b6] hover:bg-[#ec4899] text-white font-bold h-12 transition-all shadow-md active:scale-[0.98]"
                size="lg"
                disabled={isLoading || mfaCode.length < 6}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify Code'
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setStep('credentials');
                  setMfaCode('');
                  setError('');
                }}
                disabled={isLoading}
              >
                Back to Login
              </Button>
            </form>
          )}

          <div className="mt-4 text-center">
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              disabled={isLoading || !email}
              onClick={async () => {
                if (!email) {
                  toast({
                    title: 'Email Required',
                    description: 'Please enter your email address first.',
                    variant: 'destructive',
                  });
                  return;
                }

                setIsLoading(true);
                try {
                  const { supabase } = await import('@/lib/supabase');
                  const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/password-reset`,
                  });

                  if (error) {
                    toast({
                      title: 'Error',
                      description: error.message,
                      variant: 'destructive',
                    });
                  } else {
                    toast({
                      title: 'Check Your Email',
                      description: 'We sent you a password reset link. Please check your inbox.',
                    });
                  }
                } catch (err) {
                  toast({
                    title: 'Error',
                    description: 'Failed to send reset email. Please try again.',
                    variant: 'destructive',
                  });
                } finally {
                  setIsLoading(false);
                }
              }}
            >
              Forgot password?
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
