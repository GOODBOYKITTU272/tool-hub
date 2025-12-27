import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Users, Wrench, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { DailyLog } from './DailyLogForm';

interface DailyLogViewProps {
    log: DailyLog;
}

interface ToolInfo {
    name: string;
    owner_name: string;
}

export function DailyLogView({ log }: DailyLogViewProps) {
    const [toolInfo, setToolInfo] = useState<ToolInfo | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchToolInfo = async () => {
            if (!log.tool_id) {
                setLoading(false);
                return;
            }

            try {
                // Fetch tool and owner information
                const { data: toolData, error: toolError } = await supabase
                    .from('tools')
                    .select('name, owner_id')
                    .eq('id', log.tool_id)
                    .single();

                if (toolError) throw toolError;

                if (toolData) {
                    // Fetch owner name
                    const { data: ownerData, error: ownerError } = await supabase
                        .from('users')
                        .select('name')
                        .eq('id', toolData.owner_id)
                        .single();

                    if (ownerError) throw ownerError;

                    setToolInfo({
                        name: toolData.name,
                        owner_name: ownerData?.name || 'Unknown',
                    });
                }
            } catch (error) {
                console.error('Error fetching tool info:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchToolInfo();
    }, [log.tool_id]);

    const logDate = new Date(log.date);
    const formattedDate = logDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });

    const isRecent = () => {
        const daysDiff = Math.floor((Date.now() - logDate.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff <= 7;
    };

    const isCollaboration = log.work_type === 'others_tool';

    return (
        <Card className={isRecent() ? 'border-primary/50' : ''}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            {formattedDate}
                        </CardTitle>
                        <CardDescription>
                            Submitted on {new Date(log.created_at).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                            {log.updated_at !== log.created_at && ' (edited)'}
                        </CardDescription>
                    </div>
                    <div className="flex gap-2">
                        {isRecent() && (
                            <Badge variant="outline" className="text-primary">Recent</Badge>
                        )}
                        {isCollaboration && (
                            <Badge variant="secondary" className="gap-1">
                                <Users className="w-3 h-3" />
                                Collaboration
                            </Badge>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Project/Tool Worked On */}
                <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <Wrench className="w-4 h-4" />
                        Project Worked On
                    </h4>
                    <div className="text-sm bg-muted/50 p-3 rounded-md">
                        {loading ? (
                            <span className="text-muted-foreground">Loading tool info...</span>
                        ) : toolInfo ? (
                            <div>
                                <div className="font-medium">{toolInfo.name}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    {isCollaboration ? (
                                        <>👥 Collaborated on {toolInfo.owner_name}'s tool</>
                                    ) : (
                                        <>🔧 Own tool</>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <span className="text-muted-foreground">Tool information not available</span>
                        )}
                    </div>
                </div>

                <Separator />

                {/* Tasks Completed */}
                <div>
                    <h4 className="font-semibold text-sm mb-2">Tasks Completed</h4>
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 p-3 rounded-md">
                        {log.tasks_completed}
                    </div>
                </div>

                {/* Collaboration Notes (only show if exists) */}
                {log.collaboration_notes && (
                    <>
                        <Separator />
                        <div>
                            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                Collaboration Details
                            </h4>
                            <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-3 rounded-md">
                                {log.collaboration_notes}
                            </div>
                        </div>
                    </>
                )}

                {/* Blockers */}
                {log.blockers && (
                    <>
                        <Separator />
                        <div>
                            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-amber-500" />
                                Blockers
                            </h4>
                            <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3 rounded-md">
                                {log.blockers}
                            </div>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
