import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Loader2 } from 'lucide-react';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { useToast } from '@/hooks/use-toast';
import { RequestFilters, FilterState } from '@/components/requests/RequestFilters';
import { BulkActionBar } from '@/components/requests/BulkActionBar';

interface Request {
  id: string;
  tool_id: string;
  title: string;
  description: string;
  status: 'Requested' | 'In Progress' | 'Completed' | 'Rejected';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export default function Requests() {
  const [toolFilter, setToolFilter] = useState<string>('all');
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    dateRange: 'all',
    search: '',
  });
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set());
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const isOwner = currentUser?.role === 'Owner';
  const isAdmin = currentUser?.role === 'Admin';

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code !== '42P01') { // Ignore if table doesn't exist yet
          throw error;
        }
        return;
      }
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: 'Error',
        description: 'Failed to load requests. Please ensure tables are created.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useRealtimeSubscription('requests', (payload) => {
    if (payload.eventType === 'INSERT') {
      setRequests(prev => [payload.new as Request, ...prev]);
    } else if (payload.eventType === 'UPDATE') {
      setRequests(prev => prev.map(r => r.id === payload.new.id ? payload.new as Request : r));
    } else if (payload.eventType === 'DELETE') {
      setRequests(prev => prev.filter(r => r.id !== payload.old.id));
    }
  });

  const allRequests = requests;
  const filteredByTool = toolFilter === 'all'
    ? allRequests
    : allRequests.filter(r => r.tool_id === toolFilter);

  // Apply filters
  const filteredRequests = filteredByTool.filter(r => {
    // Status filter
    if (filters.status !== 'all' && r.status !== filters.status) {
      return false;
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const requestDate = new Date(r.created_at);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - requestDate.getTime()) / (1000 * 60 * 60 * 24));

      switch (filters.dateRange) {
        case 'today':
          if (diffDays > 0) return false;
          break;
        case 'week':
          if (diffDays > 7) return false;
          break;
        case 'month':
          if (diffDays > 30) return false;
          break;
        case '3months':
          if (diffDays > 90) return false;
          break;
      }
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        r.title.toLowerCase().includes(searchLower) ||
        r.description.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  // Bulk action handlers
  const handleBulkMarkInProgress = async () => {
    try {
      const updates = Array.from(selectedRequests).map(id =>
        supabase.from('requests').update({ status: 'In Progress' }).eq('id', id)
      );
      await Promise.all(updates);
      toast({ title: 'Success', description: `${selectedRequests.size} requests marked as In Progress` });
      setSelectedRequests(new Set());
      fetchRequests();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update requests', variant: 'destructive' });
    }
  };

  const handleBulkMarkCompleted = async () => {
    try {
      const updates = Array.from(selectedRequests).map(id =>
        supabase.from('requests').update({ status: 'Completed' }).eq('id', id)
      );
      await Promise.all(updates);
      toast({ title: 'Success', description: `${selectedRequests.size} requests marked as Completed` });
      setSelectedRequests(new Set());
      fetchRequests();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update requests', variant: 'destructive' });
    }
  };

  const handleBulkDelete = async () => {
    try {
      const deletes = Array.from(selectedRequests).map(id =>
        supabase.from('requests').delete().eq('id', id)
      );
      await Promise.all(deletes);
      toast({ title: 'Success', description: `${selectedRequests.size} requests deleted` });
      setSelectedRequests(new Set());
      fetchRequests();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete requests', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Requests</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track tool requests
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={toolFilter} onValueChange={setToolFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by tool" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tools</SelectItem>
              {/* Tool IDs would be added here dynamically from a tools list */}
            </SelectContent>
          </Select>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Request
          </Button>
        </div>
      </div>

      {/* Filters */}
      <RequestFilters
        filters={filters}
        onFiltersChange={setFilters}
        onClearFilters={() => setFilters({ status: 'all', dateRange: 'all', search: '' })}
      />

      {/* Bulk Actions Bar */}
      <BulkActionBar
        selectedCount={selectedRequests.size}
        onMarkInProgress={handleBulkMarkInProgress}
        onMarkCompleted={handleBulkMarkCompleted}
        onDelete={handleBulkDelete}
        onClearSelection={() => setSelectedRequests(new Set())}
      />

      <KanbanBoard
        requests={filteredRequests}
        onRequestsChange={setRequests}
      />
    </div>
  );
}

