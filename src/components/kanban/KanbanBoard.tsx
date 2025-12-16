import { useState } from 'react';
import { Request, mockRequests as initialRequests } from '@/lib/mockData';
import { KanbanColumn } from './KanbanColumn';
import { RequestDetailModal } from '@/components/modals/RequestDetailModal';
import { useToast } from '@/hooks/use-toast';

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

  const filteredRequests = toolFilter
    ? requests.filter((r) => r.toolId === toolFilter)
    : requests;

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
    if (!editable) return;
    e.dataTransfer.setData('requestId', requestId);
  };

  const handleDrop = (e: React.DragEvent, status: Request['status']) => {
    if (!editable) return;
    e.preventDefault();
    const requestId = e.dataTransfer.getData('requestId');
    if (requestId) {
      handleStatusChange(requestId, status);
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
      />
    </>
  );
}
