import { useParams, Link } from 'react-router-dom';
import {
  getToolById,
  mockToolOverviews,
  mockToolArchitectures,
  mockToolLanguageTech,
  mockToolHosting,
  mockToolEnvVariables,
  mockToolDemoLogins,
  getRequestsByTool,
  currentUser,
} from '@/lib/mockData';
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
} from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export default function ToolDetail() {
  const { id } = useParams<{ id: string }>();
  const tool = getToolById(id || '');
  const [showPassword, setShowPassword] = useState(false);
  const [visibleEnvVars, setVisibleEnvVars] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const isAdmin = currentUser.role === 'Admin';

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

  const overview = mockToolOverviews[tool.id];
  const architecture = mockToolArchitectures[tool.id];
  const languageTech = mockToolLanguageTech[tool.id];
  const hosting = mockToolHosting[tool.id];
  const envVariables = mockToolEnvVariables[tool.id] || [];
  const demoLogin = mockToolDemoLogins[tool.id];
  const requests = getRequestsByTool(tool.id);

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
            <p className="text-muted-foreground">{tool.owner}</p>
          </div>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              Edit Tool
            </Button>
            <Button variant="destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="architecture">Architecture</TabsTrigger>
          <TabsTrigger value="language-tech">Language & Tech</TabsTrigger>
          <TabsTrigger value="hosting">Hosting</TabsTrigger>
          <TabsTrigger value="env-variables">Env Variables</TabsTrigger>
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
                  <p className="text-sm text-muted-foreground">Owner</p>
                  <p className="font-medium">{tool.owner}</p>
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
                    {format(new Date(tool.createdAt), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Description</p>
                <p>{tool.description}</p>
              </div>

              {overview && (
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap">{overview.content}</div>
                </div>
              )}
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
              {architecture ? (
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap">{architecture.markdownContent}</div>
                </div>
              ) : (
                <p className="text-muted-foreground">No architecture documentation yet.</p>
              )}
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
              {languageTech ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Language</p>
                    <p className="font-medium text-lg">{languageTech.language}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Framework</p>
                    <p className="font-medium text-lg">{languageTech.framework}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Version</p>
                    <p className="font-medium text-lg">{languageTech.version}</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No language/tech information yet.</p>
              )}
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
              {hosting ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Provider</p>
                    <p className="font-medium text-lg">{hosting.provider}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Region</p>
                    <p className="font-medium text-lg">{hosting.region}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Deployment URL</p>
                    <a
                      href={hosting.deploymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-lg text-primary hover:underline"
                    >
                      {hosting.deploymentUrl}
                    </a>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No hosting information yet.</p>
              )}
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
              {!isAdmin ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <Lock className="w-5 h-5 mr-2" />
                  Access Denied - Admin only
                </div>
              ) : envVariables.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Key</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {envVariables.map((env) => (
                      <TableRow key={env.id}>
                        <TableCell className="font-mono text-sm">{env.key}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {visibleEnvVars.has(env.id)
                            ? 'decrypted_value_here'
                            : '••••••••••••••••'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleEnvVar(env.id)}
                            >
                              {visibleEnvVars.has(env.id) ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => copyToClipboard(env.key, 'Key')}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
              {demoLogin ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Username</p>
                      <div className="flex items-center gap-2">
                        <p className="font-mono">{demoLogin.username}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            copyToClipboard(demoLogin.username, 'Username')
                          }
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Password</p>
                      <div className="flex items-center gap-2">
                        <p className="font-mono">
                          {showPassword ? 'demo_password_123' : '••••••••••••'}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            copyToClipboard('demo_password_123', 'Password')
                          }
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  {demoLogin.notes && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Notes</p>
                      <p className="text-sm">{demoLogin.notes}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">No demo login configured.</p>
              )}
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
              <KanbanBoard requests={requests} editable={isAdmin} toolFilter={tool.id} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
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
