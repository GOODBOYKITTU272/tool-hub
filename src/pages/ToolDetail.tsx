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
import { Label } from '@/components/ui/label';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { BusinessClarityTab } from '@/components/tools/BusinessClarityTab';
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
  BookOpen,
  Sparkles,
  Wand2,
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
  const [showDemoPasswords, setShowDemoPasswords] = useState<Record<number, boolean>>({});
  const [enhancingWalkthrough, setEnhancingWalkthrough] = useState(false);
  const [aiInstructions, setAiInstructions] = useState('');
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

  const handleAIGenerateWalkthrough = async () => {
    if (!tool) return;

    try {
      setEnhancingWalkthrough(true);
      const { data, error } = await supabase.functions.invoke('generate-walkthrough', {
        body: {
          toolName: tool.name,
          description: tool.description,
          ownerTeam: tool.owner_team,
          techStack: (tool as any).tech_stack,
          language: (tool as any).language,
          instructions: aiInstructions
        }
      });

      if (error) throw error;

      setEditValues({ ...editValues, code_walkthrough: data.walkthrough });
      toast({
        title: 'Draft Generated',
        description: 'AI has created a technical draft. Please review and refine.',
      });
    } catch (error) {
      console.error('AI error:', error);
      toast({
        title: 'AI Unavailable',
        description: 'Could not generate draft. Please try writing manually.',
        variant: 'destructive'
      });
    } finally {
      setEnhancingWalkthrough(false);
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
          <TabsTrigger value="demo-login">Demo Login</TabsTrigger>
          <TabsTrigger value="business">Business Clarity</TabsTrigger>
          <TabsTrigger value="walkthrough">Code Walkthrough</TabsTrigger>
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


        <TabsContent value="demo-login" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Demo Logins (Roles & KT)</CardTitle>
              {(isAdmin || isOwner) && !isObserver && (
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingSection('demo-login-add');
                    setEditValues({ role_name: '', username: '', password: '', description: '' });
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Role
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Edit/Add Form */}
                {editingSection?.startsWith('demo-login') && (
                  <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Role Name</label>
                        <Input
                          value={editValues.role_name || ''}
                          onChange={(e) => setEditValues({ ...editValues, role_name: e.target.value })}
                          placeholder="e.g. Admin, Viewer, Editor"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Username / Email</label>
                        <Input
                          value={editValues.username || ''}
                          onChange={(e) => setEditValues({ ...editValues, username: e.target.value })}
                          placeholder="demo@example.com"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Password</label>
                        <Input
                          value={editValues.password || ''}
                          onChange={(e) => setEditValues({ ...editValues, password: e.target.value })}
                          placeholder="password123"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Description (KT Support)</label>
                        <Input
                          value={editValues.description || ''}
                          onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                          placeholder="What can this role do?"
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={async () => {
                          const currentLogins = (tool as any).demo_logins || [];
                          let newLogins;

                          if (editingSection === 'demo-login-edit') {
                            newLogins = [...currentLogins];
                            newLogins[editValues.index] = {
                              role_name: editValues.role_name,
                              username: editValues.username,
                              password: editValues.password,
                              description: editValues.description
                            };
                          } else {
                            newLogins = [...currentLogins, {
                              role_name: editValues.role_name,
                              username: editValues.username,
                              password: editValues.password,
                              description: editValues.description
                            }];
                          }

                          const { data, error } = await supabase
                            .from('tools')
                            .update({ demo_logins: newLogins })
                            .eq('id', tool!.id)
                            .select()
                            .single();

                          if (error) {
                            toast({ title: 'Error', description: 'Failed to update logins', variant: 'destructive' });
                          } else {
                            setTool(data as Tool);
                            setEditingSection(null);
                            toast({ title: 'Success', description: 'Demo logins updated' });
                          }
                        }}
                      >
                        {editingSection === 'demo-login-edit' ? 'Update' : 'Add'}
                      </Button>
                      <Button variant="outline" onClick={() => setEditingSection(null)}>Cancel</Button>
                    </div>
                  </div>
                )}

                {/* Logins List */}
                {((tool as any).demo_logins && (tool as any).demo_logins.length > 0) ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(tool as any).demo_logins.map((login: any, index: number) => (
                      <Card key={index} className="border-muted bg-card/50">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="px-2 py-0 text-xs font-semibold uppercase tracking-wider">
                              {login.role_name || 'Generic Role'}
                            </Badge>
                          </div>
                          {(isAdmin || isOwner) && !isObserver && (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-primary"
                                onClick={() => {
                                  setEditingSection('demo-login-edit');
                                  setEditValues({ ...login, index });
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={async () => {
                                  if (confirm(`Remove the ${login.role_name} role?`)) {
                                    const newLogins = (tool as any).demo_logins.filter((_: any, i: number) => i !== index);
                                    const { data, error } = await supabase
                                      .from('tools')
                                      .update({ demo_logins: newLogins })
                                      .eq('id', tool!.id)
                                      .select()
                                      .single();

                                    if (error) {
                                      toast({ title: 'Error', description: 'Failed to remove role', variant: 'destructive' });
                                    } else {
                                      setTool(data as Tool);
                                      toast({ title: 'Success', description: 'Role removed' });
                                    }
                                  }
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </CardHeader>
                        <CardContent className="space-y-4 pt-2">
                          {login.description && (
                            <p className="text-sm text-muted-foreground italic bg-muted/30 p-2 rounded border-l-2 border-primary/50">
                              "{login.description}"
                            </p>
                          )}
                          <div className="grid gap-3">
                            <div>
                              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Username / Email</p>
                              <div className="flex items-center justify-between bg-muted/40 p-2 rounded group">
                                <code className="text-sm font-medium">{login.username || '---'}</code>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => copyToClipboard(login.username, 'Username')}
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Password</p>
                              <div className="flex items-center justify-between bg-muted/40 p-2 rounded group">
                                <code className="text-sm font-medium">
                                  {showDemoPasswords[index] ? login.password : '••••••••'}
                                </code>
                                <div className="flex gap-1 items-center">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setShowDemoPasswords(prev => ({ ...prev, [index]: !prev[index] }))}
                                  >
                                    {showDemoPasswords[index] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => copyToClipboard(login.password, 'Password')}
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  !editingSection && (
                    <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/20 rounded-xl border border-dashed">
                      <Lock className="w-10 h-10 text-muted-foreground/40 mb-3" />
                      <p className="text-base font-semibold text-muted-foreground">No Demo Logins Configured</p>
                      <p className="text-xs text-muted-foreground/60 max-w-xs mt-1">
                        Add roles like Admin, Editor, or Viewer to help others test this tool.
                      </p>
                    </div>
                  )
                )}

                {/* Fallback for old single fields if they exist but no demo_logins array yet */}
                {!((tool as any).demo_logins?.length > 0) && ((tool as any).demo_url || (tool as any).demo_username) && (
                  <div className="mt-4 p-4 border rounded-lg bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300">💡 Migration Tip</p>
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                      You have legacy demo details. Click "Add Role" above to migrate them to the new multiple-role format.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>


        {/* Business Clarity Tab */}
        <TabsContent value="business" className="mt-6">
          <BusinessClarityTab tool={tool} />
        </TabsContent>

        <TabsContent value="walkthrough" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <CardTitle>Code Walkthrough & KT Guide</CardTitle>
              </div>
              <div className="flex gap-2">
                {(isAdmin || isOwner) && !isObserver && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingSection(editingSection === 'walkthrough' ? null : 'walkthrough');
                      setEditValues({ code_walkthrough: (tool as any).code_walkthrough || '' });
                    }}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    {editingSection === 'walkthrough' ? 'Close Editor' : 'Edit Guide'}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {editingSection === 'walkthrough' ? (
                <div className="space-y-4">
                  <div className="bg-primary/5 p-3 rounded-lg border border-primary/10 text-xs text-primary/80 mb-2">
                    <strong>💡 KT Tip:</strong> Great walkthroughs include: 1. Code file structure 2. Key logic/algorithms 3. API secret details 4. Any "gotchas" or tricky parts of the code.
                  </div>

                  <div className="flex gap-2 items-end bg-muted/30 p-3 rounded-lg border">
                    <div className="flex-1 space-y-1">
                      <Label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">AI Custom Instructions (Optional)</Label>
                      <Input
                        value={aiInstructions}
                        onChange={(e) => setAiInstructions(e.target.value)}
                        placeholder="e.g. Focus on security layer, explain the React state management..."
                        className="h-8 text-xs font-sans"
                      />
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-8"
                      onClick={handleAIGenerateWalkthrough}
                      disabled={enhancingWalkthrough}
                    >
                      {enhancingWalkthrough ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <Sparkles className="w-3 h-3 mr-2" />}
                      Generate Draft
                    </Button>
                  </div>

                  <Textarea
                    value={editValues.code_walkthrough || ''}
                    onChange={(e) => setEditValues({ code_walkthrough: e.target.value })}
                    placeholder="Enter technical guide, file structure, logic flow, etc..."
                    rows={15}
                    className="font-mono text-sm resize-none"
                  />
                  <div className="flex gap-2">
                    <Button onClick={() => handleSectionEdit('Code Walkthrough')}>Save Guide</Button>
                    <Button variant="outline" onClick={() => setEditingSection(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                (tool as any).code_walkthrough ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <div className="whitespace-pre-wrap font-sans text-base leading-relaxed">
                      {(tool as any).code_walkthrough}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center bg-muted/10 rounded-xl border-2 border-dashed border-muted">
                    <BookOpen className="w-12 h-12 text-muted-foreground/30 mb-4" />
                    <p className="text-lg font-medium text-muted-foreground">No technical guide found</p>
                    <p className="text-sm text-muted-foreground/60 max-w-sm mt-2">
                      Tools without walkthroughs are harder to maintain. Owners should add technical KT guides to help other developers understand the product.
                    </p>
                    {(isAdmin || isOwner) && !isObserver && (
                      <Button
                        variant="secondary"
                        className="mt-6"
                        onClick={() => {
                          setEditingSection('walkthrough');
                          setEditValues({ code_walkthrough: '' });
                        }}
                      >
                        Create Walkthrough
                      </Button>
                    )}
                  </div>
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

