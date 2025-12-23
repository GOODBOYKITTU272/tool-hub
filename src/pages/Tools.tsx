import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { ToolCard } from '@/components/tools/ToolCard';
import { AddToolDialog } from '@/components/tools/AddToolDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Tool type from Supabase
interface Tool {
  id: string;
  name: string;
  description: string;
  category: string | null;
  type: string | null;
  tags: string[] | null;
  url: string | null;
  owner_id: string | null;
  owner_team: string | null;
  created_by: string;
  approved_by: string | null;
  approval_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

const toolVariants: ('blue' | 'green' | 'white')[] = ['blue', 'green', 'white', 'white', 'blue', 'green'];

export default function Tools() {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const isAdmin = currentUser?.role === 'Admin';
  const isOwner = currentUser?.role === 'Owner';
  const canAddTools = isAdmin || isOwner;

  // Fetch tools from Supabase
  useEffect(() => {
    fetchTools();
  }, []);

  const fetchTools = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tools')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tools:', error);
        toast({
          title: 'Error',
          description: 'Failed to load tools',
          variant: 'destructive',
        });
        return;
      }

      setTools(data || []);
    } catch (error) {
      console.error('Exception fetching tools:', error);
    } finally {
      setLoading(false);
    }
  };

  // Real-time subscription for tools
  useRealtimeSubscription('tools', (payload) => {
    if (payload.eventType === 'INSERT') {
      setTools(prev => [payload.new as Tool, ...prev]);
      toast({
        title: 'New Tool Added',
        description: `${payload.new.name} has been added`,
      });
    } else if (payload.eventType === 'UPDATE') {
      setTools(prev => prev.map(t => t.id === payload.new.id ? payload.new as Tool : t));
    } else if (payload.eventType === 'DELETE') {
      setTools(prev => prev.filter(t => t.id !== payload.old.id));
      toast({
        title: 'Tool Deleted',
        description: 'A tool has been removed',
      });
    }
  });

  // Filter tools by ownership for Owner role
  const myTools = tools.filter(tool => tool.owner_id === currentUser?.id || tool.created_by === currentUser?.id);
  const allTools = tools;

  const filterTools = (toolList: Tool[]) => {
    return toolList.filter(
      (tool) =>
        tool.name.toLowerCase().includes(search.toLowerCase()) ||
        (tool.owner_team && tool.owner_team.toLowerCase().includes(search.toLowerCase())) ||
        tool.description.toLowerCase().includes(search.toLowerCase())
    );
  };

  const handleToolAdded = () => {
    // Tool will be added via real-time subscription
    setDialogOpen(false);
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      console.log('🔄 Manually refreshing tools...');

      const { data, error } = await supabase
        .from('tools')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error refreshing tools:', error);
        toast({
          title: 'Refresh Failed',
          description: 'Could not refresh tools. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      setTools(data || []);
      toast({
        title: 'Refreshed',
        description: `Loaded ${data?.length || 0} tools successfully`,
      });
      console.log('✅ Tools refreshed successfully');
    } catch (error) {
      console.error('Exception refreshing tools:', error);
      toast({
        title: 'Refresh Failed',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Tools</h1>
          <p className="text-muted-foreground mt-1">
            Manage and explore your internal tools
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Refresh Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            title="Refresh tools"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>

          {/* Add Tool Button */}
          {canAddTools && (
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Tool
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search tools..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Tabs for Owner, regular view for others */}
          {isOwner ? (
            <Tabs defaultValue="my-tools" className="w-full">
              <TabsList>
                <TabsTrigger value="my-tools">My Tools ({filterTools(myTools).length})</TabsTrigger>
                <TabsTrigger value="all-tools">All Tools ({filterTools(allTools).length})</TabsTrigger>
              </TabsList>

              <TabsContent value="my-tools" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filterTools(myTools).map((tool, index) => (
                    <ToolCard key={tool.id} tool={tool} variant={toolVariants[index % toolVariants.length]} />
                  ))}
                </div>
                {filterTools(myTools).length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    No tools found
                  </div>
                )}
              </TabsContent>

              <TabsContent value="all-tools" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filterTools(allTools).map((tool, index) => (
                    <ToolCard key={tool.id} tool={tool} variant={toolVariants[index % toolVariants.length]} />
                  ))}
                </div>
                {filterTools(allTools).length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    No tools found
                  </div>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Showing {filterTools(allTools).length} of {allTools.length} tools
              </p>
              {filterTools(allTools).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filterTools(allTools).map((tool, index) => (
                    <ToolCard key={tool.id} tool={tool} variant={toolVariants[index % toolVariants.length]} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No tools found matching your search.</p>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Add Tool Dialog */}
      <AddToolDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onToolAdded={handleToolAdded}
      />
    </div>
  );
}
