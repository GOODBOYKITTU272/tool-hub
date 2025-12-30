import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import {
    User,
    Lock,
    ShieldCheck,
    QrCode,
    CheckCircle2,
    Loader2,
    AlertCircle,
    AlertTriangle
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useLocation } from 'react-router-dom';

export default function Profile() {
    const { currentUser, updatePassword } = useAuth();
    const { toast } = useToast();
    const location = useLocation();
    const mfaRequired = location.state?.mfaRequired; // Check if redirected
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

    // MFA States
    const [mfaEnabled, setMfaEnabled] = useState(false);
    const [isCheckingMfa, setIsCheckingMfa] = useState(true);
    const [enrollmentData, setEnrollmentData] = useState<{ qr_code: string; secret: string; id: string } | null>(null);
    const [verificationCode, setVerificationCode] = useState('');
    const [isEnrolling, setIsEnrolling] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);

    useEffect(() => {
        checkMfaStatus();
    }, []);

    const checkMfaStatus = async () => {
        setIsCheckingMfa(true);
        try {
            const { data, error } = await supabase.auth.mfa.listFactors();
            if (error) throw error;

            const totpFactor = data.all.find(f => f.factor_type === 'totp' && f.status === 'verified');
            setMfaEnabled(!!totpFactor);
        } catch (err) {
            console.error('Error checking MFA status:', err);
        } finally {
            setIsCheckingMfa(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast({
                title: 'Passwords do not match',
                variant: 'destructive',
            });
            return;
        }

        setIsUpdatingPassword(true);
        const result = await updatePassword(newPassword);
        setIsUpdatingPassword(false);

        if (result.success) {
            toast({ title: 'Password updated successfully' });
            setNewPassword('');
            setConfirmPassword('');
        } else {
            toast({
                title: 'Error updating password',
                description: result.error,
                variant: 'destructive',
            });
        }
    };

    const startMfaEnrollment = async () => {
        setIsEnrolling(true);
        try {
            const { data, error } = await supabase.auth.mfa.enroll({
                factorType: 'totp',
                issuer: 'ApplyWizz ToolHub',
                friendlyName: currentUser?.email || 'User'
            });

            if (error) throw error;
            setEnrollmentData({
                qr_code: data.totp.qr_code,
                secret: data.totp.secret,
                id: data.id
            });
        } catch (err: any) {
            toast({
                title: 'Enrollment failed',
                description: err.message,
                variant: 'destructive',
            });
        } finally {
            setIsEnrolling(false);
        }
    };

    const verifyAndEnableMfa = async () => {
        if (!enrollmentData) return;
        setIsVerifying(true);
        try {
            const { error } = await supabase.auth.mfa.challengeAndVerify({
                factorId: enrollmentData.id,
                code: verificationCode
            });

            if (error) throw error;

            toast({
                title: 'MFA Enabled!',
                description: 'Your account is now protected with 2FA.',
            });
            setMfaEnabled(true);
            setEnrollmentData(null);
            setVerificationCode('');
        } catch (err: any) {
            toast({
                title: 'Verification failed',
                description: err.message,
                variant: 'destructive',
            });
        } finally {
            setIsVerifying(false);
        }
    };

    const disableMfa = async () => {
        if (!confirm('Are you sure you want to disable Multi-Factor Authentication? Your account will be less secure.')) return;

        try {
            const { data: factors } = await supabase.auth.mfa.listFactors();
            const totpFactor = factors?.all.find(f => f.factor_type === 'totp');

            if (totpFactor) {
                const { error } = await supabase.auth.mfa.unenroll({
                    factorId: totpFactor.id
                });
                if (error) throw error;

                toast({ title: 'MFA Disabled' });
                setMfaEnabled(false);
            }
        } catch (err: any) {
            toast({
                title: 'Error disabling MFA',
                description: err.message,
                variant: 'destructive',
            });
        }
    };

    if (!currentUser) return null;

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold font-display">{currentUser.name}</h1>
                    <p className="text-muted-foreground">{currentUser.email} • {currentUser.role}</p>
                </div>
            </div>

            {/* Mandatory MFA Alert */}
            {mfaRequired && !mfaEnabled && !isCheckingMfa && (
                <Alert variant="destructive" className="border-2 border-destructive/50 bg-destructive/10 animate-pulse">
                    <AlertTriangle className="h-5 w-5" />
                    <AlertTitle className="text-lg font-bold">Action Required: Enable Two-Factor Authentication</AlertTitle>
                    <AlertDescription>
                        Your organization requires mandatory MFA. You must set up an authenticator app before accessing the dashboard.
                    </AlertDescription>
                </Alert>
            )}

            <div className="max-w-2xl mx-auto">
                {/* MFA Settings */}
                <div className="space-y-8">
                    <Card className={mfaEnabled ? 'border-primary/50 bg-primary/5' : ''}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-primary" />
                                Two-Step Verification
                            </CardTitle>
                            <CardDescription>
                                Secure your account with Microsoft Authenticator
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {isCheckingMfa ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : mfaEnabled ? (
                                <div className="space-y-4 text-center py-4">
                                    <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                        <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-green-600 dark:text-green-400">MFA is Active</p>
                                        <p className="text-sm text-muted-foreground">Your account is secured with TOTP authentication.</p>
                                    </div>
                                    <Button variant="outline" onClick={disableMfa} className="w-full text-destructive hover:text-destructive">
                                        Disable MFA
                                    </Button>
                                </div>
                            ) : enrollmentData ? (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                                    <div className="space-y-2 text-center">
                                        <p className="text-sm font-medium">1. Scan this QR code</p>
                                        <div className="p-4 bg-white rounded-xl inline-block border mx-auto">
                                            <img src={enrollmentData.qr_code} alt="MFA QR Code" className="w-48 h-48" />
                                        </div>
                                        <p className="text-xs text-muted-foreground">Using Microsoft Authenticator or any TOTP app</p>
                                    </div>

                                    <div className="space-y-4">
                                        <p className="text-sm font-medium">2. Enter verification code</p>
                                        <Input
                                            placeholder="000 000"
                                            className="text-center text-xl tracking-widest font-mono"
                                            maxLength={6}
                                            value={verificationCode}
                                            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                                        />
                                        <Button
                                            onClick={verifyAndEnableMfa}
                                            className="w-full"
                                            disabled={isVerifying || verificationCode.length < 6}
                                        >
                                            {isVerifying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Verify & Enable'}
                                        </Button>
                                        <Button variant="ghost" className="w-full text-xs" onClick={() => setEnrollmentData(null)}>
                                            Cancel Setup
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <Alert variant="default" className="bg-primary/5 border-primary/20">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertTitle>Add extra security</AlertTitle>
                                        <AlertDescription className="text-xs">
                                            Once enabled, you will need to provide a security code from your phone each time you sign in.
                                        </AlertDescription>
                                    </Alert>
                                    <Button onClick={startMfaEnrollment} className="w-full gap-2" disabled={isEnrolling}>
                                        {isEnrolling ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                                        Setup Authenticator
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
