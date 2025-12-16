import { useState } from 'react';
import { Request } from '@/lib/mockData';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Wrench, User, Calendar, Clock } from 'lucide-react';

interface RequestDetailModalProps {
  request: Request | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusUpdate?: (requestId: string, newStatus: Request['status'], comment: string) => void;
}

const statusVariants: Record<Request['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
  Requested: 'outline',
  'In Progress': 'secondary',
  Completed: 'default',
  Rejected: 'destructive',
};

export function RequestDetailModal({
  request,
  open,
  onOpenChange,
  onStatusUpdate,
}: RequestDetailModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<Request['status'] | ''>('');
  const [comment, setComment] = useState('');
  const { currentUser } = useAuth();
  const { toast } = useToast();

  if (!request) return null;

  const canUpdateStatus = currentUser?.role === 'Admin' || currentUser?.role === 'Owner';

  const handleStatusUpdate = () => {
    if (!selectedStatus) {
      toast({
        title: 'Please select a status',
        variant: 'destructive',
      });
      return;
    }

    if (onStatusUpdate) {
      onStatusUpdate(request.id, selectedStatus, comment);
    }

    toast({
      title: 'Status updated',
      description: `Request moved to ${selectedStatus}`,
    });

    setSelectedStatus('');
    setComment('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">{request.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="gap-1">
              <Wrench className="w-3 h-3" />
              {request.toolName}
            </Badge>
            <Badge variant={statusVariants[request.status]}>
              {request.status}
            </Badge>
          </div>

          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              Description
            </h4>
            <p className="text-sm">{request.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="w-4 h-4" />
              <span>Created by:</span>
              <span className="text-foreground font-medium">
                {request.creatorName}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Created:</span>
              <span className="text-foreground font-medium">
                {format(new Date(request.createdAt), 'MMM d, yyyy')}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground col-span-2">
              <Clock className="w-4 h-4" />
              <span>Last updated:</span>
              <span className="text-foreground font-medium">
                {format(new Date(request.updatedAt), 'MMM d, yyyy h:mm a')}
              </span>
            </div>
          </div>

          {/* Status Update Section - Only for Admin/Owner */}
          {canUpdateStatus && (
            <div className="space-y-4 pt-4 border-t">
              <h4 className="text-sm font-medium">Update Status</h4>

              <div className="space-y-2">
                <Label htmlFor="status">New Status</Label>
                <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as Request['status'])}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Requested">Requested</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="comment">Comment (Optional)</Label>
                <Textarea
                  id="comment"
                  placeholder="Add a note about this status change..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>

        {canUpdateStatus && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleStatusUpdate} disabled={!selectedStatus}>
              Update Status
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
