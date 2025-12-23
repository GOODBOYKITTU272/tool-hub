import { useState, useEffect } from 'react';
import { supabase, Database } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Shield, ChevronDown, ChevronRight, Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

type AuditLog = Database['public']['Tables']['audit_logs']['Row'];
type UserProfile = Database['public']['Tables']['users']['Row'];

const actionIcons: Record<string, any> = {
  CREATE: Plus,
  UPDATE: Edit,
  DELETE: Trash2,
};

const actionColors: Record<string, string> = {
  CREATE: 'bg-accent text-accent-foreground',
  UPDATE: 'bg-secondary text-secondary-foreground',
  DELETE: 'bg-destructive text-destructive-foreground',
};

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [userFilter, setUserFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const isAdmin = currentUser?.role === 'Admin';

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch logs
      const { data: logsData, error: logsError } = await supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false });

      if (logsError && logsError.code !== '42P01') throw logsError;

      // Fetch users for filtering
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('name');

      if (usersError && usersError.code !== '42P01') throw usersError;

      setLogs(logsData || []);
      setUsers(usersData || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load audit logs',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              You don't have permission to view audit logs.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const entityTypes = [...new Set(logs.map((l) => l.entity_type))];

  const filteredLogs = logs.filter((log) => {
    if (userFilter !== 'all' && log.user_id !== userFilter) return false;
    if (entityFilter !== 'all' && log.entity_type !== entityFilter) return false;
    return true;
  });

  const toggleExpanded = (logId: string) => {
    setExpandedLogs((prev) => {
      const next = new Set(prev);
      if (next.has(logId)) {
        next.delete(logId);
      } else {
        next.add(logId);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Audit Logs</h1>
          <p className="text-muted-foreground mt-1">
            Track all changes made to tools, requests, and users
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {entityTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(userFilter !== 'all' || entityFilter !== 'all') && (
              <Button
                variant="ghost"
                onClick={() => {
                  setUserFilter('all');
                  setEntityFilter('all');
                }}
              >
                Clear filters
              </Button>
            )}
          </div>

          {/* Logs Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]"></TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => {
                    const ActionIcon = actionIcons[log.action] || Plus;
                    const isExpanded = expandedLogs.has(log.id);

                    return (
                      <Collapsible key={log.id} asChild>
                        <>
                          <TableRow className="group">
                            <TableCell>
                              <CollapsibleTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => toggleExpanded(log.id)}
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="w-4 h-4" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4" />
                                  )}
                                </Button>
                              </CollapsibleTrigger>
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {format(new Date(log.timestamp), 'MMM d, yyyy HH:mm')}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-7 w-7">
                                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                    {log.user_name
                                      ? log.user_name.split(' ').map((n) => n[0]).join('')
                                      : '?'
                                    }
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm">{log.user_name || 'System'}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={actionColors[log.action] || 'bg-accent'}>
                                <ActionIcon className="w-3 h-3 mr-1" />
                                {log.action}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm capitalize">
                                {log.entity_type.replace(/_/g, ' ')}
                              </span>
                            </TableCell>
                          </TableRow>
                          <CollapsibleContent asChild>
                            <TableRow className="bg-muted/50">
                              <TableCell colSpan={5} className="p-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm font-medium mb-2">Before</p>
                                    <pre className="text-xs bg-background p-3 rounded-lg overflow-auto max-h-32">
                                      {log.before_state
                                        ? JSON.stringify(log.before_state, null, 2)
                                        : '—'}
                                    </pre>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium mb-2">After</p>
                                    <pre className="text-xs bg-background p-3 rounded-lg overflow-auto max-h-32">
                                      {log.after_state
                                        ? JSON.stringify(log.after_state, null, 2)
                                        : '—'}
                                    </pre>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          </CollapsibleContent>
                        </>
                      </Collapsible>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {filteredLogs.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No audit logs found matching your filters.
            </div>
          )}
        </>
      )}
    </div>
  );
}

