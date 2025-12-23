import { Database } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Wrench, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

type Request = Database['public']['Tables']['requests']['Row'];

interface RequestCardProps {
  request: Request;
  draggable?: boolean;
  onClick?: () => void;
}

export function RequestCard({ request, draggable = true, onClick }: RequestCardProps) {
  return (
    <Card
      className={cn(
        'kanban-card group',
        draggable && 'cursor-grab active:cursor-grabbing'
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-2">
          {draggable && (
            <GripVertical className="w-4 h-4 mt-1 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs font-normal">
                <Wrench className="w-3 h-3 mr-1" />
                Tool ID: {request.tool_id.slice(0, 8)}...
              </Badge>
            </div>
            <h4 className="font-semibold text-sm mb-1 line-clamp-2">
              {request.title}
            </h4>
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
              {request.description}
            </p>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>User ID: {request.created_by.slice(0, 8)}...</span>
              <span>
                {formatDistanceToNow(new Date(request.created_at), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

