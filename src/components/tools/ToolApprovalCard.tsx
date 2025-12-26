import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle, XCircle, Calendar, User, ExternalLink } from 'lucide-react';
import { Database } from '@/lib/supabase';

type Tool = Database['public']['Tables']['tools']['Row'];

interface ToolApprovalCardProps {
    tool: Tool;
    onApprove: (toolId: string) => void;
    onReject: (toolId: string, reason?: string) => void;
    isRejected?: boolean;
}

export function ToolApprovalCard({ tool, onApprove, onReject, isRejected = false }: ToolApprovalCardProps) {
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleApprove = async () => {
        setIsProcessing(true);
        await onApprove(tool.id);
        setIsProcessing(false);
    };

    const handleRejectConfirm = async () => {
        setIsProcessing(true);
        await onReject(tool.id, rejectionReason);
        setRejectDialogOpen(false);
        setRejectionReason('');
        setIsProcessing(false);
    };

    return (
        <>
            <Card className={isRejected ? 'border-destructive/50' : ''}>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2">
                                {tool.name}
                                {isRejected && (
                                    <Badge variant="destructive">Rejected</Badge>
                                )}
                                {!isRejected && (
                                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                                        Pending
                                    </Badge>
                                )}
                            </CardTitle>
                            <CardDescription>{tool.description}</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Owner:</span>
                            <span className="font-medium">{tool.owner_team || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Submitted:</span>
                            <span className="font-medium">
                                {new Date(tool.created_at).toLocaleDateString()}
                            </span>
                        </div>
                    </div>

                    {tool.url && (
                        <div className="flex items-center gap-2 text-sm">
                            <ExternalLink className="w-4 h-4 text-muted-foreground" />
                            <a
                                href={tool.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                            >
                                {tool.url}
                            </a>
                        </div>
                    )}

                    {tool.category && (
                        <div className="flex gap-2">
                            <span className="text-sm text-muted-foreground">Category:</span>
                            <Badge variant="secondary">{tool.category}</Badge>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                    {!isRejected && (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => setRejectDialogOpen(true)}
                                disabled={isProcessing}
                            >
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject
                            </Button>
                            <Button
                                onClick={handleApprove}
                                disabled={isProcessing}
                            >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approve
                            </Button>
                        </>
                    )}
                    {isRejected && (
                        <Button
                            onClick={handleApprove}
                            disabled={isProcessing}
                        >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve Anyway
                        </Button>
                    )}
                </CardFooter>
            </Card>

            {/* Rejection Dialog */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Tool</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to reject "{tool.name}"? You can optionally provide a reason.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Textarea
                            placeholder="Reason for rejection (optional)..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            rows={4}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setRejectDialogOpen(false)}
                            disabled={isProcessing}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleRejectConfirm}
                            disabled={isProcessing}
                        >
                            Reject Tool
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
