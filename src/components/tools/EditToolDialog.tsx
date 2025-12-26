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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Database } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';

type Tool = Database['public']['Tables']['tools']['Row'];

const toolFormSchema = z.object({
    name: z.string().min(3, 'Tool name must be at least 3 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    owner_team: z.string().min(2, 'Owner team is required'),
    url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

type ToolFormValues = z.infer<typeof toolFormSchema>;

interface EditToolDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tool: Tool;
    onToolUpdated: (tool: Tool) => void;
}

export function EditToolDialog({ open, onOpenChange, tool, onToolUpdated }: EditToolDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const form = useForm<ToolFormValues>({
        resolver: zodResolver(toolFormSchema),
        defaultValues: {
            name: tool.name,
            description: tool.description,
            owner_team: tool.owner_team || '',
            url: tool.url || '',
        },
    });

    const onSubmit = async (values: ToolFormValues) => {
        setIsSubmitting(true);

        try {
            console.log('🔧 [EditTool] Updating tool:', tool.id);

            // Update tool in Supabase
            const { data, error } = await supabase
                .from('tools')
                .update({
                    name: values.name,
                    description: values.description,
                    owner_team: values.owner_team,
                    url: values.url || null,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', tool.id)
                .select()
                .single();

            if (error) {
                console.error('❌ [EditTool] Error:', error);
                toast({
                    title: 'Error',
                    description: error.message || 'Failed to update tool',
                    variant: 'destructive',
                });
                setIsSubmitting(false);
                return;
            }

            console.log('✅ [EditTool] Tool updated successfully');

            // Call the callback with updated data from database
            onToolUpdated(data as Tool);

            toast({
                title: 'Tool updated successfully!',
                description: `${values.name} has been updated.`,
            });

            onOpenChange(false);
        } catch (error: any) {
            console.error('❌ [EditTool] Exception:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to update tool',
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
                    <DialogTitle>Edit Tool</DialogTitle>
                    <DialogDescription>
                        Update the tool details below. Changes will be saved immediately.
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

                        <FormField
                            control={form.control}
                            name="owner_team"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Owner Team</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Engineering Team" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

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
                                        Updating...
                                    </>
                                ) : (
                                    'Save Changes'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
