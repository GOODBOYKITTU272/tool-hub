import { Request } from '@/lib/mockData';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Wrench, User, Calendar, Clock } from 'lucide-react';

interface RequestDetailModalProps {
  request: Request | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
}: RequestDetailModalProps) {
  if (!request) return null;

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
        </div>
      </DialogContent>
    </Dialog>
  );
}
