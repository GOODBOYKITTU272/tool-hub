import { Database } from '@/lib/supabase';
import { RequestCard } from './RequestCard';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

type Request = Database['public']['Tables']['requests']['Row'];

interface KanbanColumnProps {
  title: string;
  requests: Request[];
  status: Request['status'];
  onRequestClick?: (request: Request) => void;
  draggable?: boolean;
}

const statusColors: Record<Request['status'], string> = {
  Requested: 'bg-yellow-400/20 border-yellow-400',
  'In Progress': 'bg-secondary/20 border-secondary',
  Completed: 'bg-accent/20 border-accent',
  Rejected: 'bg-destructive/20 border-destructive',
};

const headerColors: Record<Request['status'], string> = {
  Requested: 'bg-yellow-400 text-yellow-900',
  'In Progress': 'bg-secondary text-secondary-foreground',
  Completed: 'bg-accent text-accent-foreground',
  Rejected: 'bg-destructive text-destructive-foreground',
};

export function KanbanColumn({
  title,
  requests,
  status,
  onRequestClick,
  draggable = true,
}: KanbanColumnProps) {
  return (
    <div
      className={cn(
        'kanban-column border-2',
        statusColors[status]
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div
          className={cn(
            'px-3 py-1.5 rounded-full text-sm font-semibold',
            headerColors[status]
          )}
        >
          {title}
        </div>
        <span className="text-sm font-medium text-muted-foreground">
          {requests.length}
        </span>
      </div>

      <ScrollArea className="h-[calc(100vh-320px)] pr-2">
        <div className="flex flex-col gap-3">
          {requests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              draggable={draggable}
              onClick={() => onRequestClick?.(request)}
            />
          ))}
          {requests.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No {title.toLowerCase()} requests
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

