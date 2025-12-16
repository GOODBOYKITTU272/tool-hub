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
import { ChangeRequest } from '@/lib/mockData';

const changeRequestSchema = z.object({
    changeType: z.enum(['copy', 'config', 'behavior', 'access'], {
        required_error: 'Please select a change type',
    }),
    description: z.string().min(20, 'Description must be at least 20 characters'),
    urgency: z.enum(['low', 'medium', 'high'], {
        required_error: 'Please select urgency level',
    }),
    attachmentUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

type ChangeRequestFormValues = z.infer<typeof changeRequestSchema>;

interface ChangeRequestDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    toolId: string;
    toolName: string;
    onRequestSubmitted: (request: ChangeRequest) => void;
}

export function ChangeRequestDialog({
    open,
    onOpenChange,
    toolId,
    toolName,
    onRequestSubmitted,
}: ChangeRequestDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const form = useForm<ChangeRequestFormValues>({
        resolver: zodResolver(changeRequestSchema),
        defaultValues: {
            changeType: undefined,
            description: '',
            urgency: undefined,
            attachmentUrl: '',
        },
    });

    const onSubmit = async (values: ChangeRequestFormValues) => {
        setIsSubmitting(true);

        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Create new change request
        const newRequest: ChangeRequest = {
            id: `cr-${Date.now()}`,
            toolId,
            toolName,
            changeType: values.changeType,
            description: values.description,
            urgency: values.urgency,
            attachmentUrl: values.attachmentUrl || undefined,
            requestedBy: 'current-user-id', // Will be replaced with actual user
            requestedByName: 'Current User',
            status: 'pending',
            createdAt: new Date().toISOString(),
        };

        // Call the callback
        onRequestSubmitted(newRequest);

        toast({
            title: 'Change request submitted!',
            description: 'Your request has been sent to the tool owner for review.',
        });

        // Reset form and close dialog
        form.reset();
        onOpenChange(false);
        setIsSubmitting(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle>Request Change</DialogTitle>
                    <DialogDescription>
                        Submit a change request for <strong>{toolName}</strong>. The tool owner will review and respond.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="bg-muted/50 rounded-lg p-3">
                            <p className="text-sm text-muted-foreground">Tool</p>
                            <p className="font-medium">{toolName}</p>
                        </div>

                        <FormField
                            control={form.control}
                            name="changeType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Change Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select change type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="copy">Copy/Content</SelectItem>
                                            <SelectItem value="config">Configuration</SelectItem>
                                            <SelectItem value="behavior">Behavior/Functionality</SelectItem>
                                            <SelectItem value="access">Access/Permissions</SelectItem>
                                        </SelectContent>
                                    </Select>
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
                                            placeholder="Describe the change you're requesting..."
                                            className="resize-none min-h-[120px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="urgency"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Urgency</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select urgency level" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="low">Low - Can wait</SelectItem>
                                            <SelectItem value="medium">Medium - Important</SelectItem>
                                            <SelectItem value="high">High - Urgent</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="attachmentUrl"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Attachment/Link (Optional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="https://example.com/screenshot.png" {...field} />
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
                                        Submitting...
                                    </>
                                ) : (
                                    'Submit Request'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
