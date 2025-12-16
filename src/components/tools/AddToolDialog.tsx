import { useState } from 'react';
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
import { Tool, mockUsers } from '@/lib/mockData';
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
    onToolAdded: (tool: Tool) => void;
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

    // Get list of owner users - Admin sees all, Owner sees only themselves
    const ownerUsers = isAdmin
        ? mockUsers.filter(u => u.role === 'Owner' || u.role === 'Admin')
        : mockUsers.filter(u => u.id === currentUser?.id);

    const onSubmit = async (values: ToolFormValues) => {
        setIsSubmitting(true);

        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Find selected owner
        const selectedOwner = mockUsers.find(u => u.email === values.ownerEmail);

        // Create new tool object
        const newTool: Tool = {
            id: `tool-${Date.now()}`,
            name: values.name,
            description: values.description,
            owner: selectedOwner?.name || 'Unknown',
            ownerId: selectedOwner?.id || '',
            url: values.url || undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            requestCount: 0,
        };

        // Call the callback to add the tool
        onToolAdded(newTool);

        toast({
            title: 'Tool added successfully!',
            description: `${values.name} has been added to your tools.`,
        });

        // Reset form and close dialog
        form.reset();
        onOpenChange(false);
        setIsSubmitting(false);
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
