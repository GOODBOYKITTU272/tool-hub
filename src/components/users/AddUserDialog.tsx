import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Copy, Check, Terminal, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AddUserDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function AddUserDialog({ open, onOpenChange, onSuccess }: AddUserDialogProps) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'Admin' | 'Owner' | 'Observer'>('Observer');
    const [isCopied, setIsCopied] = useState(false);
    const { toast } = useToast();

    const generateSQL = () => {
        return `-- Run this in your Supabase SQL Editor to provision the user:
-- 1. Creates the user in Supabase Auth
-- 2. Your 'handle_new_user' trigger will automatically create the profile

-- NOTE: Since we don't have the user's password here, 
-- this SQL is slightly complex. The easiest way is to use the 
-- Supabase Dashboard > Authentication > Add User.

-- ALTERNATIVE: Copy this email and use the Dashboard.
-- Email: ${email}
-- Role: ${role}
-- Name: ${name}
`;
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(email);
        setIsCopied(true);
        toast({
            title: 'Email Copied',
            description: 'You can now paste this into the Supabase Dashboard.',
        });
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                    <DialogDescription>
                        Due to Supabase security restrictions, users must be invited or created via the Supabase Dashboard.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email Address</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="john@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <Button variant="outline" size="icon" onClick={copyToClipboard} disabled={!email}>
                                    {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="role">Role</Label>
                            <Select value={role} onValueChange={(val: any) => setRole(val)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Admin">Admin (Full Access)</SelectItem>
                                    <SelectItem value="Owner">Owner (Team Access)</SelectItem>
                                    <SelectItem value="Observer">Observer (Read Only)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="bg-slate-950 rounded-lg p-4 space-y-3 border border-slate-800">
                        <div className="flex items-center gap-2 text-slate-400 text-sm">
                            <Terminal className="h-4 w-4" />
                            <span className="font-medium">Recommended Workflow</span>
                        </div>
                        <ol className="text-xs text-slate-300 space-y-2 list-decimal ml-4">
                            <li>Open your <strong>Supabase Dashboard</strong></li>
                            <li>Go to <strong>Authentication &gt; Users</strong></li>
                            <li>Click <strong>Add User &gt; Create New User</strong></li>
                            <li>Paste the email: <code className="text-pink-400 font-bold">{email || '...'}</code></li>
                            <li>Set a temporary password</li>
                            <li>The system will automatically sync their profile!</li>
                        </ol>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-100 rounded-lg text-blue-800 text-xs">
                        <Info className="h-4 w-4 mt-0.5 shrink-0" />
                        <p>
                            Once created in the dashboard, the user's profile will appear in this list automatically thanks to our database triggers.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={() => {
                        onSuccess();
                        onOpenChange(false);
                    }}>
                        I've Added the User
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
