import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, BarChart3, TrendingUp, DollarSign, Cpu, RefreshCcw, Filter } from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    Cell
} from 'recharts';
import { format, subDays } from 'date-fns';

interface UsageStats {
    total_calls: number;
    total_tokens: number;
    total_cost: number;
    input_tokens: number;
    output_tokens: number;
}

interface FeatureUsage {
    feature: string;
    calls: number;
    tokens: number;
    cost: number;
}

interface DailyUsage {
    date: string;
    cost: number;
    calls: number;
}

interface UsageLog {
    id: string;
    created_at: string;
    feature: string;
    model: string;
    total_tokens: number;
    estimated_cost: number;
    user_id: string | null;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function ChatGPTUsage() {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<UsageStats>({
        total_calls: 0,
        total_tokens: 0,
        total_cost: 0,
        input_tokens: 0,
        output_tokens: 0
    });
    const [featureData, setFeatureData] = useState<FeatureUsage[]>([]);
    const [dailyData, setDailyData] = useState<DailyUsage[]>([]);
    const [logs, setLogs] = useState<UsageLog[]>([]);
    const [timeRange, setTimeRange] = useState(30);

    const isAdmin = currentUser?.role === 'Admin';

    useEffect(() => {
        if (isAdmin) {
            fetchUsageData();
        }
    }, [isAdmin, timeRange]);

    const fetchUsageData = async () => {
        try {
            setLoading(true);
            const startDate = subDays(new Date(), timeRange).toISOString();

            // Fetch summary stats
            const { data: summaryData, error: summaryError } = await (supabase as any)
                .from('openai_usage')
                .select('total_tokens, input_tokens, output_tokens, estimated_cost')
                .gte('created_at', startDate);

            if (summaryError) throw summaryError;

            const totalCalls = summaryData?.length || 0;
            const totalTokens = summaryData?.reduce((acc, curr) => acc + ((curr as any).total_tokens || 0), 0) || 0;
            const totalInput = summaryData?.reduce((acc, curr) => acc + ((curr as any).input_tokens || 0), 0) || 0;
            const totalOutput = summaryData?.reduce((acc, curr) => acc + ((curr as any).output_tokens || 0), 0) || 0;
            const totalCost = summaryData?.reduce((acc, curr) => acc + (Number((curr as any).estimated_cost) || 0), 0) || 0;

            setStats({
                total_calls: totalCalls,
                total_tokens: totalTokens,
                total_cost: totalCost,
                input_tokens: totalInput,
                output_tokens: totalOutput
            });

            // Fetch usage by feature
            const { data: featureRaw, error: featureError } = await (supabase as any)
                .from('openai_usage')
                .select('feature, total_tokens, estimated_cost')
                .gte('created_at', startDate);

            if (featureError) throw featureError;

            const featureMap = new Map<string, FeatureUsage>();
            featureRaw?.forEach(curr => {
                const feature = (curr as any).feature || 'unknown';
                const existing = featureMap.get(feature) || { feature, calls: 0, tokens: 0, cost: 0 };
                featureMap.set(feature, {
                    feature,
                    calls: existing.calls + 1,
                    tokens: existing.tokens + ((curr as any).total_tokens || 0),
                    cost: existing.cost + (Number((curr as any).estimated_cost) || 0)
                });
            });
            setFeatureData(Array.from(featureMap.values()).sort((a, b) => b.cost - a.cost));

            // Fetch daily usage for trend chart
            const { data: dailyRaw, error: dailyError } = await (supabase as any)
                .from('openai_usage')
                .select('created_at, estimated_cost')
                .gte('created_at', startDate);

            if (dailyError) throw dailyError;

            const dailyMap = new Map<string, DailyUsage>();

            for (let i = 0; i <= timeRange; i++) {
                const d = format(subDays(new Date(), i), 'MMM dd');
                dailyMap.set(d, { date: d, cost: 0, calls: 0 });
            }

            dailyRaw?.forEach(curr => {
                const date = format(new Date((curr as any).created_at), 'MMM dd');
                if (dailyMap.has(date)) {
                    const existing = dailyMap.get(date)!;
                    dailyMap.set(date, {
                        ...existing,
                        cost: existing.cost + (Number((curr as any).estimated_cost) || 0),
                        calls: existing.calls + 1
                    });
                }
            });
            setDailyData(Array.from(dailyMap.values()).reverse());

            // Fetch recent detailed logs
            const { data: logsData, error: logsError } = await (supabase as any)
                .from('openai_usage')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);

            if (logsError) throw logsError;
            setLogs(logsData as any[]);

        } catch (error) {
            console.error('Error fetching usage data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isAdmin) {
        return (
            <div className="p-8 text-center">
                <h1 className="text-2xl font-bold text-destructive">Unauthorized</h1>
                <p className="text-muted-foreground mt-2">Only administrators can access the ChatGPT Usage dashboard.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <BarChart3 className="w-8 h-8 text-primary" />
                        ChatGPT Usage Dashboard
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Monitor OpenAI API consumption, token usage, and costs across all features.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => fetchUsageData()} disabled={loading}>
                        <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <div className="flex bg-muted rounded-lg p-1">
                        {[7, 30, 90].map((days) => (
                            <Button
                                key={days}
                                variant={timeRange === days ? 'secondary' : 'ghost'}
                                size="sm"
                                className="h-8 text-xs"
                                onClick={() => setTimeRange(days)}
                            >
                                {days}d
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            {loading && stats.total_calls === 0 ? (
                <div className="flex flex-col items-center justify-center p-20 space-y-4">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                    <p className="text-muted-foreground">Gathering usage intelligence...</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="border-l-4 border-l-blue-500">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <RefreshCcw className="w-4 h-4" />
                                    Total API Calls
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.total_calls.toLocaleString()}</div>
                                <div className="text-xs text-muted-foreground mt-1">Last {timeRange} days</div>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-green-500">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <DollarSign className="w-4 h-4" />
                                    Estimated Cost
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">${stats.total_cost.toFixed(4)}</div>
                                <div className="text-xs text-muted-foreground mt-1 text-green-600/80 font-medium">
                                    Avg: ${(stats.total_cost / (stats.total_calls || 1)).toFixed(4)} / call
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-amber-500">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Cpu className="w-4 h-4" />
                                    Total Tokens
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.total_tokens.toLocaleString()}</div>
                                <div className="text-xs text-muted-foreground mt-1 flex justify-between">
                                    <span>In: {stats.input_tokens.toLocaleString()}</span>
                                    <span>Out: {stats.output_tokens.toLocaleString()}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-purple-500">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4" />
                                    Active Model
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">GPT-3.5 Turbo</div>
                                <div className="text-xs text-muted-foreground mt-1">Optimized for speed & cost</div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-green-500" />
                                    Cost Trend (Daily)
                                </CardTitle>
                                <CardDescription>Estimated OpenAI costs over the selected period</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[300px] mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={dailyData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                        <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} minTickGap={30} />
                                        <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val.toFixed(2)}`} />
                                        <Tooltip
                                            formatter={(val: number) => [`$${val.toFixed(4)}`, 'Cost']}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        />
                                        <Line type="monotone" dataKey="cost" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <Filter className="w-5 h-5 text-blue-500" />
                                    Usage by Feature
                                </CardTitle>
                                <CardDescription>Breakdown of AI consumption by application feature</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[300px] mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={featureData} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="feature" type="category" fontSize={12} tickLine={false} axisLine={false} width={120} />
                                        <Tooltip
                                            formatter={(val: number, name: string) => [
                                                name === 'cost' ? `$${val.toFixed(4)}` : val.toLocaleString(),
                                                name.charAt(0).toUpperCase() + name.slice(1)
                                            ]}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        />
                                        <Bar dataKey="cost" radius={[0, 4, 4, 0]} barSize={30}>
                                            {featureData.map((_entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-lg font-bold">Recent API Logs</CardTitle>
                                <CardDescription>The last 10 OpenAI API transactions</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-muted-foreground bg-muted/30">
                                            <th className="text-left py-3 px-4 font-medium">Timestamp</th>
                                            <th className="text-left py-3 px-4 font-medium">Feature</th>
                                            <th className="text-left py-3 px-4 font-medium">Model</th>
                                            <th className="text-right py-3 px-4 font-medium">Tokens</th>
                                            <th className="text-right py-3 px-4 font-medium">Cost</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {logs.length > 0 ? (
                                            logs.map((log) => (
                                                <tr key={log.id} className="border-b hover:bg-muted/20 transition-colors">
                                                    <td className="py-3 px-4 text-muted-foreground">
                                                        {format(new Date(log.created_at), 'MMM dd, HH:mm:ss')}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <Badge variant="outline" className="capitalize">{log.feature.replace('-', ' ')}</Badge>
                                                    </td>
                                                    <td className="py-3 px-4 text-xs font-mono">{log.model}</td>
                                                    <td className="py-3 px-4 text-right tabular-nums">{log.total_tokens.toLocaleString()}</td>
                                                    <td className="py-3 px-4 text-right tabular-nums text-green-600 font-medium">
                                                        ${Number(log.estimated_cost).toFixed(5)}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="py-8 text-center text-muted-foreground">No recent usage logs found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
