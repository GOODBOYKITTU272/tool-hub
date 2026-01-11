import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Users as UsersIcon, TrendingUp, AlertCircle, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { DailyLogView } from '@/components/journal/DailyLogView';
import type { DailyLog } from '@/components/journal/DailyLogForm';

interface TeamMember {
    id: string;
    name: string;
}

export default function TeamLogs() {
    const { currentUser } = useAuth();
    const { toast } = useToast();
    const [logs, setLogs] = useState<DailyLog[]>([]);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<string>('all');
    const [dateRange, setDateRange] = useState<'today' | 'week' | 'lastweek' | 'month'>('week');

    // Check if user is admin
    const isAdmin = currentUser?.role === 'Admin';

    useEffect(() => {
        if (!currentUser) return;

        // Early return if not admin - prevents 403 errors on daily_logs table
        if (!isAdmin) {
            setLoading(false);
            return;
        }

        fetchTeamMembers();
        fetchTeamLogs();
    }, [currentUser, isAdmin, selectedUser, dateRange]);

    const fetchTeamMembers = async () => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('id, name')
                .eq('role', 'Owner')
                .order('name');

            if (error) throw error;
            setTeamMembers(data || []);
        } catch (error: any) {
            console.error('Error fetching team members:', error);
            toast({
                title: 'Error',
                description: 'Failed to load team members.',
                variant: 'destructive',
            });
        }
    };

    const fetchTeamLogs = async () => {
        if (!currentUser) return;

        setLoading(true);
        try {
            let query = supabase
                .from('daily_logs')
                .select('*')
                .order('date', { ascending: false });

            // Filter by user if not "all"
            if (selectedUser !== 'all') {
                query = query.eq('user_id', selectedUser);
            }

            // Filter by date range
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (dateRange === 'today') {
                const todayStr = today.toISOString().split('T')[0];
                query = query.eq('date', todayStr);
            } else if (dateRange === 'week') {
                const weekAgo = new Date(today);
                weekAgo.setDate(weekAgo.getDate() - 7);
                query = query.gte('date', weekAgo.toISOString().split('T')[0]);
            } else if (dateRange === 'lastweek') {
                const lastWeekStart = new Date(today);
                lastWeekStart.setDate(lastWeekStart.getDate() - 14);
                const lastWeekEnd = new Date(today);
                lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);
                query = query
                    .gte('date', lastWeekStart.toISOString().split('T')[0])
                    .lte('date', lastWeekEnd.toISOString().split('T')[0]);
            } else if (dateRange === 'month') {
                // First day of current month
                const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                query = query.gte('date', monthStart.toISOString().split('T')[0]);
            }

            const { data, error } = await query;

            if (error) throw error;
            setLogs(data || []);
        } catch (error: any) {
            console.error('Error fetching team logs:', error);
            toast({
                title: 'Error Loading Logs',
                description: error.message || 'Failed to load team logs.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const getStats = () => {
        const today = new Date();
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);

        const thisWeekLogs = logs.filter(log => {
            const logDate = new Date(log.date);
            return logDate >= weekAgo && logDate <= today;
        });

        const uniqueUsers = new Set(thisWeekLogs.map(log => log.user_id)).size;

        return {
            totalLogs: thisWeekLogs.length,
            activeMembers: uniqueUsers,
            collaborations: thisWeekLogs.filter(log => log.work_type === 'others_tool').length,
            blockers: thisWeekLogs.filter(log => log.blockers).length,
        };
    };

    const exportToCSV = () => {
        const headers = ['Date', 'User', 'Work Type', 'Tool', 'Tasks', 'Collaboration Notes', 'Blockers'];
        const csvData = logs.map(log => [
            log.date,
            'User', // We'll need to join with users table for name
            log.work_type,
            log.tool_id || '',
            log.tasks_completed.replace(/\n/g, ' '),
            log.collaboration_notes || '',
            log.blockers || '',
        ]);

        const csvContent = [
            headers.join(','),
            ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `team-logs-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        toast({
            title: 'Export Successful',
            description: 'Team logs exported to CSV.',
        });
    };

    if (!isAdmin) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Alert variant="destructive">
                    <AlertDescription>
                        Only administrators can access team logs. Please contact your administrator if you need access.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    const stats = getStats();

    if (loading && logs.length === 0) {
        return (
            <div className="container mx-auto px-4 py-8 space-y-6">
                <Skeleton className="h-12 w-64" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                </div>
                <Skeleton className="h-96" />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <UsersIcon className="w-8 h-8 text-primary" />
                    Team Daily Logs
                </h1>
                <p className="text-muted-foreground mt-2">
                    View and monitor all team members' daily work logs
                </p>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Filters</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <label className="text-sm font-medium mb-2 block">Team Member</label>
                        <Select value={selectedUser} onValueChange={setSelectedUser}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select user" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Users</SelectItem>
                                {teamMembers.map(member => (
                                    <SelectItem key={member.id} value={member.id}>
                                        {member.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex-1">
                        <label className="text-sm font-medium mb-2 block">Date Range</label>
                        <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select range" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="today">Today</SelectItem>
                                <SelectItem value="lastweek">Last Week</SelectItem>
                                <SelectItem value="week">This Week</SelectItem>
                                <SelectItem value="month">This Month</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-end">
                        <Button onClick={exportToCSV} variant="outline" className="gap-2">
                            <Download className="w-4 h-4" />
                            Export CSV
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Weekly Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Total Logs</CardDescription>
                        <CardTitle className="text-3xl">{stats.totalLogs}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">This Week</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Active Members</CardDescription>
                        <CardTitle className="text-3xl">{stats.activeMembers}/{teamMembers.length}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">This Week</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Collaborations</CardDescription>
                        <CardTitle className="text-3xl">{stats.collaborations}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">This Week</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Blockers</CardDescription>
                        <CardTitle className="text-3xl">{stats.blockers}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">This Week</p>
                    </CardContent>
                </Card>
            </div>

            {/* Team Logs List */}
            <div className="space-y-4">
                <h2 className="text-2xl font-semibold">
                    {dateRange === 'today' && 'Today\'s Logs'}
                    {dateRange === 'week' && 'This Week\'s Logs'}
                    {dateRange === 'lastweek' && 'Last Week\'s Logs'}
                    {dateRange === 'month' && 'This Month\'s Logs'}
                </h2>

                {logs.length === 0 ? (
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            No logs found for the selected filters.
                        </AlertDescription>
                    </Alert>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {logs.map(log => (
                            <DailyLogView key={log.id} log={log} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
