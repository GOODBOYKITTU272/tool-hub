import { useState, useEffect } from 'react';
import { CalendarView } from '@/components/journal/CalendarView';
import { DailyLogForm, DailyLog, DailyLogInput } from '@/components/journal/DailyLogForm';
import { DailyLogView } from '@/components/journal/DailyLogView';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, TrendingUp, Calendar as CalendarIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

export default function DailyJournal() {
    const { currentUser } = useAuth();
    const { toast } = useToast();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [logs, setLogs] = useState<DailyLog[]>([]);
    const [selectedDateLogs, setSelectedDateLogs] = useState<DailyLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Fetch all logs for current user
    useEffect(() => {
        if (!currentUser) return;
        fetchLogs();
    }, [currentUser]);

    // Update selected date logs when date changes
    useEffect(() => {
        const dateStr = selectedDate.toISOString().split('T')[0];
        const logsForDate = logs.filter(l => l.date === dateStr);
        setSelectedDateLogs(logsForDate);
    }, [selectedDate, logs]);

    const fetchLogs = async () => {
        if (!currentUser) return;

        setLoading(true);
        try {
            // Use RPC function to bypass RLS
            const { data, error } = await supabase
                .rpc('get_user_daily_logs', {
                    p_user_id: currentUser.id
                });

            if (error) throw error;
            setLogs(data || []);
        } catch (error: any) {
            console.error('Error fetching logs:', error);
            toast({
                title: 'Error Loading Logs',
                description: error.message || 'Failed to load your daily logs.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveLog = async (logInput: DailyLogInput) => {
        if (!currentUser) return;

        setSaving(true);
        try {
            // Use RPC function to bypass RLS
            const { data, error } = await supabase
                .rpc('insert_daily_log', {
                    p_user_id: currentUser.id,
                    p_date: logInput.date,
                    p_work_type: logInput.work_type || 'own_tool',
                    p_tool_id: logInput.tool_id || null,
                    p_tool_owner_id: logInput.tool_owner_id || null,
                    p_tasks_completed: logInput.tasks_completed,
                    p_blockers: logInput.blockers || '',
                    p_collaboration_notes: logInput.collaboration_notes || ''
                });

            if (error) throw error;

            // Refresh logs
            await fetchLogs();
        } catch (error: any) {
            console.error('Error saving log:', error);
            throw error;
        } finally {
            setSaving(false);
        }
    };

    const getWeekStats = () => {
        const today = new Date();
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);

        const thisWeekLogs = logs.filter(log => {
            const logDate = new Date(log.date);
            return logDate >= weekAgo && logDate <= today;
        });

        return {
            totalLogs: thisWeekLogs.length,
            daysLogged: thisWeekLogs.length,
            collaborations: thisWeekLogs.filter(log => log.work_type === 'others_tool').length,
            blockers: thisWeekLogs.filter(log => log.blockers).length,
        };
    };

    const stats = getWeekStats();
    const loggedDates = logs.map(log => new Date(log.date));

    // Check if user has admin or owner role
    const canAccessJournal = currentUser?.role === 'Admin' || currentUser?.role === 'Owner';

    if (!canAccessJournal) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Alert variant="destructive">
                    <AlertDescription>
                        Daily Journal is only available for Admins and Owners. Please contact your administrator if you need access.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8 space-y-6">
                <Skeleton className="h-12 w-64" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    <BookOpen className="w-8 h-8 text-primary" />
                    Daily Journal
                </h1>
                <p className="text-muted-foreground mt-2">
                    Track your daily work, collaborate with your team, and prepare for standups
                </p>
            </div>

            {/* Weekly Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>This Week</CardDescription>
                        <CardTitle className="text-3xl">{stats.daysLogged}/5</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">Days Logged</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Total Logs</CardDescription>
                        <CardTitle className="text-3xl">{logs.length}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">All Time</p>
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

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column: Calendar */}
                <div>
                    <CalendarView
                        selectedDate={selectedDate}
                        onDateSelect={setSelectedDate}
                        loggedDates={loggedDates}
                    />
                </div>

                {/* Right Column: Form or View */}
                <div>
                    <Tabs defaultValue="form" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="form">
                                <CalendarIcon className="w-4 h-4 mr-2" />
                                New Log
                            </TabsTrigger>
                            <TabsTrigger value="view" disabled={selectedDateLogs.length === 0}>
                                <TrendingUp className="w-4 h-4 mr-2" />
                                View Logs {selectedDateLogs.length > 0 && `(${selectedDateLogs.length})`}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="form" className="mt-4">
                            <DailyLogForm
                                selectedDate={selectedDate}
                                existingLog={null}
                                onSave={handleSaveLog}
                            />
                        </TabsContent>

                        <TabsContent value="view" className="mt-4">
                            {selectedDateLogs.length > 0 ? (
                                <div className="space-y-4">
                                    {selectedDateLogs.map((log, index) => (
                                        <DailyLogView key={log.id} log={log} />
                                    ))}
                                </div>
                            ) : (
                                <Alert>
                                    <AlertDescription>
                                        No logs found for this date. Switch to the Form tab to create one.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* Recent Logs */}
            {logs.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-2xl font-semibold">Recent Logs</h2>
                    <div className="grid grid-cols-1 gap-4">
                        {logs.slice(0, 5).map(log => (
                            <DailyLogView key={log.id} log={log} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
