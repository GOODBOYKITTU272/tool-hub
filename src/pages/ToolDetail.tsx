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
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
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
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<any>({});
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

  const handleSectionEdit = async (section: string) => {
    if (!tool) return;

    try {
      const { data, error } = await supabase
        .from('tools')
        .update(editValues)
        .eq('id', tool.id)
        .select()
        .single();

      if (error) throw error;

      setTool(data as Tool);
      setEditingSection(null);
      toast({
        title: 'Success',
        description: `${section} updated successfully`,
      });
    } catch (error) {
      console.error('Error updating:', error);
      toast({
        title: 'Error',
        description: 'Failed to update',
        variant: 'destructive'
      });
    }
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
            <CardHeader>
              <CardTitle>Overview</CardTitle>
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
              {(isAdmin || isOwner) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingSection('architecture');
                    setEditValues({ architecture: (tool as any).architecture || '' });
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {editingSection === 'architecture' ? (
                <div className="space-y-4">
                  <Textarea
                    value={editValues.architecture || ''}
                    onChange={(e) => setEditValues({ architecture: e.target.value })}
                    placeholder="Describe the system architecture..."
                    rows={6}
                    className="resize-none"
                  />
                  <div className="flex gap-2">
                    <Button onClick={() => handleSectionEdit('Architecture')}>Save</Button>
                    <Button variant="outline" onClick={() => setEditingSection(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                (tool as any).architecture ? (
                  <p className="whitespace-pre-wrap">{(tool as any).architecture}</p>
                ) : (
                  <p className="text-muted-foreground">No architecture documentation yet.</p>
                )
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="language-tech" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Language & Tech</CardTitle>
              {(isAdmin || isOwner) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingSection('language-tech');
                    setEditValues({
                      language: (tool as any).language || tool.type || '',
                      tech_stack: (tool as any).tech_stack || ''
                    });
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {editingSection === 'language-tech' ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Language</label>
                    <Input
                      value={editValues.language || ''}
                      onChange={(e) => setEditValues({ ...editValues, language: e.target.value })}
                      placeholder="e.g., TypeScript"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Tech Stack</label>
                    <Input
                      value={editValues.tech_stack || ''}
                      onChange={(e) => setEditValues({ ...editValues, tech_stack: e.target.value })}
                      placeholder="e.g., React, Node.js"
                      className="mt-1"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => handleSectionEdit('Language & Tech')}>Save</Button>
                    <Button variant="outline" onClick={() => setEditingSection(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Language</p>
                    <p className="font-medium text-lg">{(tool as any).language || tool.type || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tech Stack</p>
                    <p className="font-medium text-lg">{(tool as any).tech_stack || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Category</p>
                    <p className="font-medium text-lg">{tool.category || '—'}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hosting" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Hosting</CardTitle>
              {(isAdmin || isOwner) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingSection('hosting');
                    setEditValues({
                      hosting_provider: (tool as any).hosting_provider || '',
                      hosting_details: (tool as any).hosting_details || ''
                    });
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {editingSection === 'hosting' ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Hosting Provider</label>
                    <Input
                      value={editValues.hosting_provider || ''}
                      onChange={(e) => setEditValues({ ...editValues, hosting_provider: e.target.value })}
                      placeholder="e.g., Vercel, AWS"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Hosting Details</label>
                    <Textarea
                      value={editValues.hosting_details || ''}
                      onChange={(e) => setEditValues({ ...editValues, hosting_details: e.target.value })}
                      placeholder="Additional hosting information..."
                      rows={3}
                      className="mt-1 resize-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => handleSectionEdit('Hosting')}>Save</Button>
                    <Button variant="outline" onClick={() => setEditingSection(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                ((tool as any).hosting_provider || (tool as any).hosting_details) ? (
                  <div className="space-y-4">
                    {(tool as any).hosting_provider && (
                      <div>
                        <p className="text-sm text-muted-foreground">Provider</p>
                        <p className="font-medium">{(tool as any).hosting_provider}</p>
                      </div>
                    )}
                    {(tool as any).hosting_details && (
                      <div>
                        <p className="text-sm text-muted-foreground">Details</p>
                        <p className="whitespace-pre-wrap">{(tool as any).hosting_details}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No hosting information yet.</p>
                )
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="env-variables" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Environment Variables</CardTitle>
              {(isAdmin || isOwner) && !isObserver && (
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingSection('env-add');
                    setEditValues({ env_key: '', env_value: '' });
                  }}
                >
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
                <div className="space-y-4">
                  {editingSection === 'env-add' && (
                    <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Key</label>
                          <Input
                            value={editValues.env_key || ''}
                            onChange={(e) => setEditValues({ ...editValues, env_key: e.target.value })}
                            placeholder="API_KEY"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Value</label>
                          <Input
                            value={editValues.env_value || ''}
                            onChange={(e) => setEditValues({ ...editValues, env_value: e.target.value })}
                            placeholder="your-api-key-here"
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={async () => {
                            if (!editValues.env_key || !editValues.env_value) {
                              toast({
                                title: 'Error',
                                description: 'Both key and value are required',
                                variant: 'destructive'
                              });
                              return;
                            }

                            const currentVars = (tool as any).environment_variables || [];
                            const newVars = [...currentVars, { key: editValues.env_key, value: editValues.env_value }];

                            const { data, error } = await supabase
                              .from('tools')
                              .update({ environment_variables: newVars })
                              .eq('id', tool!.id)
                              .select()
                              .single();

                            if (error) {
                              toast({ title: 'Error', description: 'Failed to add variable', variant: 'destructive' });
                            } else {
                              setTool(data as Tool);
                              setEditingSection(null);
                              toast({ title: 'Success', description: 'Environment variable added' });
                            }
                          }}
                        >
                          Add
                        </Button>
                        <Button variant="outline" onClick={() => setEditingSection(null)}>Cancel</Button>
                      </div>
                    </div>
                  )}

                  {((tool as any).environment_variables && (tool as any).environment_variables.length > 0) ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Key</TableHead>
                          <TableHead>Value</TableHead>
                          {(isAdmin || isOwner) && <TableHead className="w-[100px]">Actions</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(tool as any).environment_variables.map((envVar: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell className="font-mono">{envVar.key}</TableCell>
                            <TableCell className="font-mono">
                              {visibleEnvVars.has(envVar.key) ? envVar.value : '••••••••'}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="ml-2"
                                onClick={() => {
                                  const newVisible = new Set(visibleEnvVars);
                                  if (newVisible.has(envVar.key)) {
                                    newVisible.delete(envVar.key);
                                  } else {
                                    newVisible.add(envVar.key);
                                  }
                                  setVisibleEnvVars(newVisible);
                                }}
                              >
                                {visibleEnvVars.has(envVar.key) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </Button>
                            </TableCell>
                            {(isAdmin || isOwner) && (
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={async () => {
                                    const newVars = (tool as any).environment_variables.filter((_: any, i: number) => i !== index);
                                    const { data, error } = await supabase
                                      .from('tools')
                                      .update({ environment_variables: newVars })
                                      .eq('id', tool!.id)
                                      .select()
                                      .single();

                                    if (error) {
                                      toast({ title: 'Error', description: 'Failed to delete variable', variant: 'destructive' });
                                    } else {
                                      setTool(data as Tool);
                                      toast({ title: 'Success', description: 'Environment variable deleted' });
                                    }
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    !editingSection && <p className="text-muted-foreground">No environment variables configured.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="demo-login" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Demo Login</CardTitle>
              {(isAdmin || isOwner) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingSection('demo-login');
                    setEditValues({
                      demo_url: (tool as any).demo_url || '',
                      demo_username: (tool as any).demo_username || '',
                      demo_password: (tool as any).demo_password || ''
                    });
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {editingSection === 'demo-login' ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Demo URL</label>
                    <Input
                      value={editValues.demo_url || ''}
                      onChange={(e) => setEditValues({ ...editValues, demo_url: e.target.value })}
                      placeholder="https://demo.example.com"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Username</label>
                    <Input
                      value={editValues.demo_username || ''}
                      onChange={(e) => setEditValues({ ...editValues, demo_username: e.target.value })}
                      placeholder="demo@example.com"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Password</label>
                    <Input
                      type="password"
                      value={editValues.demo_password || ''}
                      onChange={(e) => setEditValues({ ...editValues, demo_password: e.target.value })}
                      placeholder="••••••••"
                      className="mt-1"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => handleSectionEdit('Demo Login')}>Save</Button>
                    <Button variant="outline" onClick={() => setEditingSection(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                ((tool as any).demo_url || (tool as any).demo_username || (tool as any).demo_password) ? (
                  <div className="space-y-4">
                    {(tool as any).demo_url && (
                      <div>
                        <p className="text-sm text-muted-foreground">Demo URL</p>
                        <a href={(tool as any).demo_url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                          {(tool as any).demo_url}
                        </a>
                      </div>
                    )}
                    {(tool as any).demo_username && (
                      <div>
                        <p className="text-sm text-muted-foreground">Username</p>
                        <p className="font-medium">{(tool as any).demo_username}</p>
                      </div>
                    )}
                    {(tool as any).demo_password && (
                      <div>
                        <p className="text-sm text-muted-foreground">Password</p>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{showPassword ? (tool as any).demo_password : '••••••••'}</p>
                          <Button variant="ghost" size="sm" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No demo login configured.</p>
                )
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Requests</CardTitle>
              <Button
                size="sm"
                onClick={() => setChangeRequestDialogOpen(true)}
              >
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

