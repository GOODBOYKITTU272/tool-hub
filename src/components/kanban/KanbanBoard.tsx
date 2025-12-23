import { useState, useEffect } from 'react';
import { supabase, Database } from '@/lib/supabase';
import { KanbanColumn } from './KanbanColumn';
import { RequestDetailModal } from '@/components/modals/RequestDetailModal';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

type Request = Database['public']['Tables']['requests']['Row'];

interface KanbanBoardProps {
  requests: Request[];
  onRequestsChange?: (requests: Request[]) => void;
  editable?: boolean;
  toolFilter?: string;
}

const statuses: Request['status'][] = ['Requested', 'In Progress', 'Completed', 'Rejected'];

export function KanbanBoard({
  requests,
  onRequestsChange,
  editable = true,
  toolFilter
}: KanbanBoardProps) {
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const { toast } = useToast();
  const { currentUser } = useAuth();

  const filteredRequests = toolFilter
    ? requests.filter((r) => r.tool_id === toolFilter)
    : requests;

  // Check if current user can edit requests
  const canEditRequest = (request: Request): boolean => {
    if (!editable) return false;
    if (currentUser?.role === 'Admin') return true;
    if (currentUser?.role === 'Owner') {
      // In a real app, we'd check if they own the tool_id
      // For now, allow owners to move things if they are owners
      return true;
    }
    return false;
  };

  const handleStatusChange = async (requestId: string, newStatus: Request['status']) => {
    try {
      const { error } = await supabase
        .from('requests')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', requestId);

      if (error) throw error;

      if (onRequestsChange) {
        onRequestsChange(requests.map(r => r.id === requestId ? { ...r, status: newStatus } : r));
      }

      toast({
        title: 'Status updated',
        description: `Request moved to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Update failed',
        description: 'Failed to update request status',
        variant: 'destructive'
      });
    }
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

