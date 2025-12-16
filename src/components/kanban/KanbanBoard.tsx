import { useState } from 'react';
import { Request, mockRequests as initialRequests, getToolById } from '@/lib/mockData';
import { KanbanColumn } from './KanbanColumn';
import { RequestDetailModal } from '@/components/modals/RequestDetailModal';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface KanbanBoardProps {
  requests?: Request[];
  editable?: boolean;
  toolFilter?: string;
}

const statuses: Request['status'][] = ['Requested', 'In Progress', 'Completed', 'Rejected'];

export function KanbanBoard({ requests: propRequests, editable = true, toolFilter }: KanbanBoardProps) {
  const [requests, setRequests] = useState<Request[]>(propRequests || initialRequests);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const { toast } = useToast();
  const { currentUser } = useAuth();

  const filteredRequests = toolFilter
    ? requests.filter((r) => r.toolId === toolFilter)
    : requests;

  // Check if current user can edit requests
  // Admin can edit all, Owner can edit only their tool's requests
  const canEditRequest = (request: Request): boolean => {
    if (!editable) return false;
    if (currentUser?.role === 'Admin') return true;
    if (currentUser?.role === 'Owner') {
      const tool = getToolById(request.toolId);
      return tool?.ownerId === currentUser?.id;
    }
    return false;
  };

  const handleStatusChange = (requestId: string, newStatus: Request['status']) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? { ...r, status: newStatus, updatedAt: new Date().toISOString() }
          : r
      )
    );
    toast({
      title: 'Status updated',
      description: `Request moved to ${newStatus}`,
    });
  };

  const handleDragStart = (e: React.DragEvent, requestId: string) => {
    const request = requests.find(r => r.id === requestId);
    if (!request || !canEditRequest(request)) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('requestId', requestId);
  };

  const handleDrop = (e: React.DragEvent, status: Request['status']) => {
    e.preventDefault();
    const requestId = e.dataTransfer.getData('requestId');
    if (requestId) {
      const request = requests.find(r => r.id === requestId);
      if (request && canEditRequest(request)) {
        handleStatusChange(requestId, status);
      } else {
        toast({
          title: 'Permission denied',
          description: 'Only the tool owner or admin can move this request',
          variant: 'destructive',
        });
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!editable) return;
    e.preventDefault();
  };

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {statuses.map((status) => (
          <div
            key={status}
            onDrop={(e) => handleDrop(e, status)}
            onDragOver={handleDragOver}
            className="flex-shrink-0"
          >
            <KanbanColumn
              title={status}
              status={status}
              requests={filteredRequests.filter((r) => r.status === status)}
              draggable={editable}
              onRequestClick={setSelectedRequest}
            />
          </div>
        ))}
      </div>

      <RequestDetailModal
        request={selectedRequest}
        open={!!selectedRequest}
        onOpenChange={(open) => !open && setSelectedRequest(null)}
        onStatusUpdate={handleStatusChange}
      />
    </>
  );
}
