import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wrench, Clock, CheckCircle, TrendingUp, Flame } from 'lucide-react';

interface OwnerMetrics {
    myToolsCount: number;
    myPendingTools: number;
    myApprovedTools: number;
    requestsThisMonth: number;
    mostRequestedTool: { name: string; count: number } | null;
}

interface OwnerMetricsCardProps {
    metrics: OwnerMetrics;
}

export function OwnerMetricsCard({ metrics }: OwnerMetricsCardProps) {
    return (
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-primary" />
                    My Tools Overview
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Grid of metrics */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Total My Tools */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <Wrench className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{metrics.myToolsCount}</p>
                            <p className="text-xs text-muted-foreground">Total Tools</p>
                        </div>
                    </div>

                    {/* Pending Tools */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-yellow-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{metrics.myPendingTools}</p>
                            <p className="text-xs text-muted-foreground">Pending</p>
                        </div>
                    </div>

                    {/* Approved Tools */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{metrics.myApprovedTools}</p>
                            <p className="text-xs text-muted-foreground">Approved</p>
                        </div>
                    </div>

                    {/* Requests This Month */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-purple-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{metrics.requestsThisMonth}</p>
                            <p className="text-xs text-muted-foreground">This Month</p>
                        </div>
                    </div>
                </div>

                {/* Most Requested Tool */}
                {metrics.mostRequestedTool && (
                    <div className="mt-4 p-3 rounded-lg bg-background/50 border border-border/50">
                        <div className="flex items-center gap-2 mb-1">
                            <Flame className="w-4 h-4 text-orange-500" />
                            <p className="text-xs font-medium text-muted-foreground">Most Requested</p>
                        </div>
                        <p className="font-semibold">{metrics.mostRequestedTool.name}</p>
                        <p className="text-xs text-muted-foreground">
                            {metrics.mostRequestedTool.count} request{metrics.mostRequestedTool.count !== 1 ? 's' : ''}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
