import { useParams, Link } from 'react-router-dom';
import { supabase, Database } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ChangeRequestDialog } from '@/components/modals/ChangeRequestDialog';
import { EditToolDialog } from '@/components/tools/EditToolDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import {
  ArrowLeft,
  Edit,
  Trash2,
  ExternalLink,
  Copy,
  Eye,
  EyeOff,
  Lock,
  Loader2,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';

type Tool = Database['public']['Tables']['tools']['Row'];
type Request = Database['public']['Tables']['requests']['Row'];

export default function ToolDetail() {
  const { id } = useParams<{ id: string }>();
  const [tool, setTool] = useState<Tool | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [visibleEnvVars, setVisibleEnvVars] = useState<Set<string>>(new Set());
  const [changeRequestDialogOpen, setChangeRequestDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { toast } = useToast();
  const { currentUser } = useAuth();

  const isAdmin = currentUser?.role === 'Admin';
  const isOwner = currentUser?.role === 'Owner';
  const isObserver = currentUser?.role === 'Observer';

  useEffect(() => {
    if (id) {
      fetchToolData();
    }
  }, [id]);

  const fetchToolData = async () => {
    try {
      setLoading(true);

      // Fetch tool
      const { data: toolData, error: toolError } = await supabase
        .from('tools')
        .select('*')
        .eq('id', id)
        .single();

      if (toolError) throw toolError;
      setTool(toolData);

      // Fetch requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('requests')
        .select('*')
        .eq('tool_id', id)
        .order('created_at', { ascending: false });

      if (requestsError && requestsError.code !== '42P01') throw requestsError;
      setRequests(requestsData || []);

    } catch (error) {
      console.error('Error fetching tool data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load tool details',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useRealtimeSubscription('requests', (payload) => {
    if (payload.new && (payload.new as Request).tool_id !== id) return;

    if (payload.eventType === 'INSERT') {
      setRequests(prev => [payload.new as Request, ...prev]);
    } else if (payload.eventType === 'UPDATE') {
      setRequests(prev => prev.map(r => r.id === payload.new.id ? payload.new as Request : r));
    } else if (payload.eventType === 'DELETE') {
      setRequests(prev => prev.filter(r => r.id !== payload.old.id));
    }
  });

  const toggleEnvVar = (id: string) => {
    setVisibleEnvVars((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: `${label} copied to clipboard`,
    });
  };

  const handleToolUpdated = (updatedTool: Tool) => {
    setTool(updatedTool);
    toast({
      title: 'Success',
      description: 'Tool updated successfully',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!tool) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Tool not found</h1>
        <Button asChild>
          <Link to="/tools">Back to Tools</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/tools">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold">{tool.name}</h1>
              {tool.url && (
                <a
                  href={tool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <ExternalLink className="w-5 h-5" />
                </a>
              )}
            </div>
            <p className="text-muted-foreground">{tool.owner_team || 'Internal Service'}</p>
          </div>
        </div>
        {isObserver ? (
          <Button onClick={() => setChangeRequestDialogOpen(true)}>
            Request Change
          </Button>
        ) : (isAdmin || isOwner) ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Tool
            </Button>
            {isAdmin && (
              <Button
                variant="destructive"
                onClick={async () => {
                  if (confirm(`Are you sure you want to delete "${tool.name}"? This action cannot be undone.`)) {
                    try {
                      const { error } = await supabase
                        .from('tools')
                        .delete()
                        .eq('id', tool.id);

                      if (error) throw error;

                      toast({
                        title: 'Success',
                        description: 'Tool deleted successfully',
                      });

                      window.location.href = '/tools';
                    } catch (error) {
                      console.error('Error deleting tool:', error);
                      toast({
                        title: 'Error',
                        description: 'Failed to delete tool',
                        variant: 'destructive'
                      });
                    }
                  }
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        ) : null}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="architecture">Architecture</TabsTrigger>
          <TabsTrigger value="language-tech">Language & Tech</TabsTrigger>
          <TabsTrigger value="hosting">Hosting</TabsTrigger>
          {!isObserver && (
            <TabsTrigger value="env-variables">Env Variables</TabsTrigger>
          )}
          <TabsTrigger value="demo-login">Demo Login</TabsTrigger>
          <TabsTrigger value="requests">
            Requests
            <Badge variant="secondary" className="ml-2">
              {requests.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Overview</CardTitle>
              {isAdmin && (
                <Button variant="ghost" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Tool Name</p>
                  <p className="font-medium">{tool.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Team</p>
                  <p className="font-medium">{tool.owner_team || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">URL</p>
                  {tool.url ? (
                    <a
                      href={tool.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline"
                    >
                      {tool.url}
                    </a>
                  ) : (
                    <p className="text-muted-foreground">—</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {format(new Date(tool.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Description</p>
                <p>{tool.description}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="architecture" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Architecture</CardTitle>
              {isAdmin && (
                <Button variant="ghost" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">No architecture documentation yet.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="language-tech" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Language & Tech</CardTitle>
              {isAdmin && (
                <Button variant="ghost" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Language</p>
                  <p className="font-medium text-lg">{tool.type || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="font-medium text-lg">{tool.category || '—'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hosting" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Hosting</CardTitle>
              {isAdmin && (
                <Button variant="ghost" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">No hosting information yet.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="env-variables" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Environment Variables</CardTitle>
              {isAdmin && (
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Variable
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {isObserver ? (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-2">
                  <Lock className="w-12 h-12 text-muted-foreground mb-2" />
                  <p className="text-lg font-medium">Environment Variables Hidden</p>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Environment variables are only visible to Owners and Admins for security purposes.
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground">No environment variables configured.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="demo-login" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Demo Login</CardTitle>
              {isAdmin && (
                <Button variant="ghost" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">No demo login configured.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Requests</CardTitle>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                New Request
              </Button>
            </CardHeader>
            <CardContent>
              <KanbanBoard
                requests={requests}
                onRequestsChange={setRequests}
                editable={isAdmin || isOwner}
                toolFilter={tool.id}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Change Request Dialog */}
      <ChangeRequestDialog
        open={changeRequestDialogOpen}
        onOpenChange={setChangeRequestDialogOpen}
        toolId={tool.id}
        toolName={tool.name}
        onRequestSubmitted={() => fetchToolData()}
      />

      {/* Edit Tool Dialog */}
      {tool && (
        <EditToolDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          tool={tool}
          onToolUpdated={handleToolUpdated}
        />
      )}
    </div>
  );
}

function Plus(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

