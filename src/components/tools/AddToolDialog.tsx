import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

const toolFormSchema = z.object({
    name: z.string().min(3, 'Tool name must be at least 3 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    ownerEmail: z.string().email('Please select an owner'),
    url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

type ToolFormValues = z.infer<typeof toolFormSchema>;

interface AddToolDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onToolAdded: (tool: any) => void;
}

export function AddToolDialog({ open, onOpenChange, onToolAdded }: AddToolDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const { currentUser } = useAuth();
    const isAdmin = currentUser?.role === 'Admin';

    const form = useForm<ToolFormValues>({
        resolver: zodResolver(toolFormSchema),
        defaultValues: {
            name: '',
            description: '',
            ownerEmail: isAdmin ? '' : (currentUser?.email || ''),
            url: '',
        },
    });

    // Get list of owner users from Supabase
    const [ownerUsers, setOwnerUsers] = useState<any[]>([]);

    // Fetch owner users when dialog opens
    useEffect(() => {
        if (open) {
            const fetchOwners = async () => {
                const { data } = await supabase
                    .from('users')
                    .select('id, email, name, role')
                    .in('role', ['Owner', 'Admin']);

                if (data) {
                    // Admin sees all owners, Owner sees only themselves
                    const filtered = isAdmin ? data : data.filter(u => u.id === currentUser?.id);
                    setOwnerUsers(filtered);
                }
            };
            fetchOwners();
        }
    }, [open, isAdmin, currentUser?.id]);

    const onSubmit = async (values: ToolFormValues) => {
        setIsSubmitting(true);

        try {
            // Find selected owner
            const selectedOwner = ownerUsers.find(u => u.email === values.ownerEmail);

            // Insert tool into Supabase
            const { data, error } = await supabase
                .from('tools')
                .insert({
                    name: values.name,
                    description: values.description,
                    owner_id: selectedOwner?.id || currentUser?.id,
                    owner_team: selectedOwner?.name || currentUser?.name,
                    url: values.url || null,
                    created_by: currentUser?.id,
                    approval_status: isAdmin ? 'approved' : 'pending',
                    category: null,
                    type: null,
                    tags: null,
                })
                .select()
                .single();

            if (error) {
                console.error('Error adding tool:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to add tool. Please try again.',
                    variant: 'destructive',
                });
                setIsSubmitting(false);
                return;
            }

            // If tool is pending, send notifications to all admins
            if (!isAdmin && data) {
                // Fetch all admin users
                const { data: adminUsers } = await supabase
                    .from('users')
                    .select('id')
                    .eq('role', 'Admin');

                if (adminUsers && adminUsers.length > 0) {
                    // Create in-app notifications for all admins
                    const notifications = adminUsers.map(admin => ({
                        user_id: admin.id,
                        type: 'tool_pending_approval',
                        title: 'New Tool Awaiting Approval',
                        message: `${currentUser?.name} has submitted "${values.name}" for approval`,
                        related_id: data.id,
                    }));

                    await supabase.from('notifications').insert(notifications);

                    // Send email notifications to admins via edge function
                    try {
                        const { data: { session } } = await supabase.auth.getSession();
                        await supabase.functions.invoke('notify-tool-submission', {
                            body: {
                                toolId: data.id,
                                toolName: values.name,
                                toolDescription: values.description,
                                ownerName: currentUser?.name,
                                ownerEmail: currentUser?.email,
                            },
                            headers: {
                                Authorization: `Bearer ${session?.access_token}`,
                            },
                        });
                        console.log('Email notifications sent to admins');
                    } catch (emailError) {
                        console.error('Failed to send email notifications:', emailError);
                        // Don't block the flow if email fails
                    }
                }
            }

            // Call the callback to trigger refresh
            onToolAdded(data as any);

            // Show different toast based on approval status
            if (isAdmin) {
                toast({
                    title: 'Tool added successfully!',
                    description: `${values.name} has been added and is now visible to all users.`,
                });
            } else {
                toast({
                    title: 'Tool submitted for approval',
                    description: `${values.name} is pending admin approval. You can view it in "My Tools" tab.`,
                });
            }

            // Reset form and close dialog
            form.reset();
            onOpenChange(false);
        } catch (error) {
            console.error('Exception adding tool:', error);
            toast({
                title: 'Error',
                description: 'An unexpected error occurred.',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add New Tool</DialogTitle>
                    <DialogDescription>
                        Add a new tool to your internal tools catalog. Fill in the details below.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tool Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Analytics Dashboard" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Describe what this tool does..."
                                            className="resize-none"
                                            rows={3}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Owner field - Only show for Admin */}
                        {isAdmin && (
                            <FormField
                                control={form.control}
                                name="ownerEmail"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Owner</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select owner" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {ownerUsers.map((user) => (
                                                    <SelectItem key={user.id} value={user.email}>
                                                        {user.name} ({user.email})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <FormField
                            control={form.control}
                            name="url"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>URL (Optional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="https://tool.example.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Adding...
                                    </>
                                ) : (
                                    'Add Tool'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
