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

      <KanbanBoard
        requests={filteredByTool}
        onRequestsChange={setRequests}
      />
    </div>
  );
}

