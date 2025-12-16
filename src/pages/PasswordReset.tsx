import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Wrench, Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function PasswordReset() {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { toast } = useToast();
    const { updatePassword, currentUser } = useAuth();

    const validatePassword = (password: string): string | null => {
        if (password.length < 8) {
            return 'Password must be at least 8 characters long';
        }
        if (!/[A-Z]/.test(password)) {
            return 'Password must contain at least one uppercase letter';
        }
        if (!/[a-z]/.test(password)) {
            return 'Password must contain at least one lowercase letter';
        }
        if (!/[0-9]/.test(password)) {
            return 'Password must contain at least one number';
        }
        if (!/[^A-Za-z0-9]/.test(password)) {
            return 'Password must contain at least one special character';
        }
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!newPassword || !confirmPassword) {
            setError('Please fill in all fields');
            return;
        }

        // Check if user is trying to use default password
        if (newPassword === 'Applywizz@2026') {
            setError('You cannot use the default password. Please choose a unique password.');
            return;
        }

        const passwordError = validatePassword(newPassword);
        if (passwordError) {
            setError(passwordError);
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsLoading(true);

        try {
            const result = await updatePassword(newPassword);

            if (result.success) {
                toast({
                    title: 'Password Updated!',
                    description: 'Your password has been successfully changed.',
                });
                navigate('/dashboard');
            } else {
                setError(result.error || 'Failed to update password');
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
            console.error('Password reset error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const passwordRequirements = [
        { label: 'At least 8 characters', met: newPassword.length >= 8 },
        { label: 'One uppercase letter', met: /[A-Z]/.test(newPassword) },
        { label: 'One lowercase letter', met: /[a-z]/.test(newPassword) },
        { label: 'One number', met: /[0-9]/.test(newPassword) },
        { label: 'One special character', met: /[^A-Za-z0-9]/.test(newPassword) },
    ];

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-md animate-scale-in">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto mb-4 w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                        <Wrench className="w-7 h-7 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-2xl font-display">Reset Your Password</CardTitle>
                    <CardDescription>
                        {currentUser?.name}, please create a new secure password
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <div className="relative">
                                <Input
                                    id="newPassword"
                                    type={showNewPassword ? 'text' : 'password'}
                                    placeholder="Enter new password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    disabled={isLoading}
                                    autoComplete="new-password"
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    tabIndex={-1}
                                >
                                    {showNewPassword ? (
                                        <EyeOff className="w-4 h-4" />
                                    ) : (
                                        <Eye className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    placeholder="Confirm new password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={isLoading}
                                    autoComplete="new-password"
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    tabIndex={-1}
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="w-4 h-4" />
                                    ) : (
                                        <Eye className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Password Requirements */}
                        {newPassword && (
                            <div className="space-y-2 p-3 bg-muted rounded-lg">
                                <p className="text-sm font-medium">Password Requirements:</p>
                                <ul className="space-y-1">
                                    {passwordRequirements.map((req, index) => (
                                        <li
                                            key={index}
                                            className={`text-xs flex items-center gap-2 ${req.met ? 'text-green-600' : 'text-muted-foreground'
                                                }`}
                                        >
                                            <CheckCircle2 className={`w-3 h-3 ${req.met ? 'opacity-100' : 'opacity-30'}`} />
                                            {req.label}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

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
                                    Updating Password...
                                </>
                            ) : (
                                'Update Password'
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
