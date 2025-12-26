import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ToolApprovalCard } from '@/components/tools/ToolApprovalCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/lib/supabase';

type Tool = Database['public']['Tables']['tools']['Row'];

export default function PendingTools() {
    const [pendingTools, setPendingTools] = useState<Tool[]>([]);
    const [rejectedTools, setRejectedTools] = useState<Tool[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { currentUser } = useAuth();
    const { toast } = useToast();
    const isAdmin = currentUser?.role === 'Admin';

    useEffect(() => {
        fetchPendingTools();
    }, []);

    const fetchPendingTools = async () => {
        try {
            setLoading(true);

            // Fetch pending tools
            const { data: pending, error: pendingError } = await supabase
                .from('tools')
                .select('*')
                .eq('approval_status', 'pending')
                .order('created_at', { ascending: false });

            if (pendingError) {
                console.error('Error fetching pending tools:', pendingError);
                toast({
                    title: 'Error',
                    description: 'Failed to load pending tools',
                    variant: 'destructive',
                });
                return;
            }

            // Fetch rejected tools
            const { data: rejected, error: rejectedError } = await supabase
                .from('tools')
                .select('*')
                .eq('approval_status', 'rejected')
                .order('created_at', { ascending: false });

            if (rejectedError) {
                console.error('Error fetching rejected tools:', rejectedError);
            }

            setPendingTools(pending || []);
            setRejectedTools(rejected || []);
        } catch (error) {
            console.error('Exception fetching tools:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        try {
            setRefreshing(true);
            await fetchPendingTools();
            toast({
                title: 'Refreshed',
                description: 'Tool list has been refreshed',
            });
        } catch (error) {
            console.error('Exception refreshing:', error);
        } finally {
            setRefreshing(false);
        }
    };

    const handleApprove = async (toolId: string) => {
        try {
            // Get tool details first to send notification
            const { data: tool } = await supabase
                .from('tools')
                .select('name, created_by')
                .eq('id', toolId)
                .single();

            const { error } = await supabase
                .from('tools')
                .update({
                    approval_status: 'approved',
                    approved_by: currentUser?.id,
                })
                .eq('id', toolId);

            if (error) {
                console.error('Error approving tool:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to approve tool',
                    variant: 'destructive',
                });
                return;
            }

            // Send notification to tool owner
            if (tool?.created_by) {
                // Create in-app notification
                await supabase.from('notifications').insert({
                    user_id: tool.created_by,
                    type: 'tool_approved',
                    title: 'Tool Approved!',
                    message: `Your tool "${tool.name}" has been approved by an admin`,
                    related_id: toolId,
                });

                // Send email notification via edge function
                try {
                    // Fetch owner details for email
                    const { data: owner } = await supabase
                        .from('users')
                        .select('email, name')
                        .eq('id', tool.created_by)
                        .single();

                    if (owner) {
                        const { data: { session } } = await supabase.auth.getSession();
                        await supabase.functions.invoke('notify-tool-decision', {
                            body: {
                                toolId: toolId,
                                toolName: tool.name,
                                decision: 'approved',
                                ownerEmail: owner.email,
                                ownerName: owner.name,
                            },
                            headers: {
                                Authorization: `Bearer ${session?.access_token}`,
                            },
                        });
                        console.log('Approval email sent to tool owner');
                    }
                } catch (emailError) {
                    console.error('Failed to send approval email:', emailError);
                    // Don't block the flow if email fails
                }
            }

            toast({
                title: 'Tool Approved',
                description: 'The tool has been approved successfully',
            });

            // Refresh the list
            await fetchPendingTools();
        } catch (error) {
            console.error('Exception approving tool:', error);
        }
    };

    const handleReject = async (toolId: string, reason?: string) => {
        try {
            // Get tool details first to send notification
            const { data: tool } = await supabase
                .from('tools')
                .select('name, created_by')
                .eq('id', toolId)
                .single();

            const { error } = await supabase
                .from('tools')
                .update({
                    approval_status: 'rejected',
                    approved_by: currentUser?.id,
                })
                .eq('id', toolId);

            if (error) {
                console.error('Error rejecting tool:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to reject tool',
                    variant: 'destructive',
                });
                return;
            }

            // Send notification to tool owner
            if (tool?.created_by) {
                const message = reason
                    ? `Your tool "${tool.name}" was rejected. Reason: ${reason}`
                    : `Your tool "${tool.name}" was rejected by an admin`;

                // Create in-app notification
                await supabase.from('notifications').insert({
                    user_id: tool.created_by,
                    type: 'tool_rejected',
                    title: 'Tool Rejected',
                    message: message,
                    related_id: toolId,
                });

                // Send email notification via edge function
                try {
                    // Fetch owner details for email
                    const { data: owner } = await supabase
                        .from('users')
                        .select('email, name')
                        .eq('id', tool.created_by)
                        .single();

                    if (owner) {
                        const { data: { session } } = await supabase.auth.getSession();
                        await supabase.functions.invoke('notify-tool-decision', {
                            body: {
                                toolId: toolId,
                                toolName: tool.name,
                                decision: 'rejected',
                                ownerEmail: owner.email,
                                ownerName: owner.name,
                                rejectionReason: reason || undefined,
                            },
                            headers: {
                                Authorization: `Bearer ${session?.access_token}`,
                            },
                        });
                        console.log('Rejection email sent to tool owner');
                    }
                } catch (emailError) {
                    console.error('Failed to send rejection email:', emailError);
                    // Don't block the flow if email fails
                }
            }

            toast({
                title: 'Tool Rejected',
                description: 'The tool has been rejected',
            });

            // Refresh the list
            await fetchPendingTools();
        } catch (error) {
            console.error('Exception rejecting tool:', error);
        }
    };

    if (!isAdmin) {
        return (
            <div className="space-y-6 animate-fade-in">
                <div className="text-center py-12">
                    <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
                    <p className="text-muted-foreground">Only administrators can access this page.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Pending Tool Approvals</h1>
                    <p className="text-muted-foreground mt-1">
                        Review and approve tools submitted by owners
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleRefresh}
                        disabled={refreshing || loading}
                        title="Refresh tools"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {/* Loading State */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : (
                <Tabs defaultValue="pending" className="w-full">
                    <TabsList>
                        <TabsTrigger value="pending">
                            Pending ({pendingTools.length})
                        </TabsTrigger>
                        <TabsTrigger value="rejected">
                            Rejected ({rejectedTools.length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="pending" className="mt-6">
                        {pendingTools.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4">
                                {pendingTools.map((tool) => (
                                    <ToolApprovalCard
                                        key={tool.id}
                                        tool={tool}
                                        onApprove={handleApprove}
                                        onReject={handleReject}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                No pending tools to review
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="rejected" className="mt-6">
                        {rejectedTools.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4">
                                {rejectedTools.map((tool) => (
                                    <ToolApprovalCard
                                        key={tool.id}
                                        tool={tool}
                                        onApprove={handleApprove}
                                        onReject={handleReject}
                                        isRejected
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                No rejected tools
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
}
