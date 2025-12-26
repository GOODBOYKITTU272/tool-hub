import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ClipboardList, FileText } from 'lucide-react';

interface QuickAction {
    icon: React.ElementType;
    label: string;
    description: string;
    to?: string;
    onClick?: () => void;
    badge?: number;
}

interface QuickActionsCardProps {
    onAddTool?: () => void;
    requestCount?: number;
}

export function QuickActionsCard({ onAddTool, requestCount = 0 }: QuickActionsCardProps) {
    const actions: QuickAction[] = [
        {
            icon: Plus,
            label: 'Add Tool',
            description: 'Submit a new tool for approval',
            onClick: onAddTool,
        },
        {
            icon: ClipboardList,
            label: 'View Requests',
            description: 'Manage tool requests',
            to: '/requests',
            badge: requestCount,
        },
        {
            icon: FileText,
            label: 'Generate Report',
            description: 'Export tool data (Coming Soon)',
            onClick: () => alert('Report generation coming soon!'),
        },
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {actions.map((action, index) => {
                    const Icon = action.icon;
                    const content = (
                        <Button
                            key={index}
                            variant="outline"
                            className="w-full justify-start h-auto py-3 px-4"
                            onClick={action.onClick}
                            asChild={!!action.to}
                        >
                            {action.to ? (
                                <Link to={action.to}>
                                    <div className="flex items-center gap-3 w-full">
                                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <Icon className="w-5 h-5 text-primary" />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <p className="font-medium">{action.label}</p>
                                            <p className="text-xs text-muted-foreground">{action.description}</p>
                                        </div>
                                        {action.badge !== undefined && action.badge > 0 && (
                                            <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center">
                                                {action.badge}
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            ) : (
                                <div className="flex items-center gap-3 w-full">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <Icon className="w-5 h-5 text-primary" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="font-medium">{action.label}</p>
                                        <p className="text-xs text-muted-foreground">{action.description}</p>
                                    </div>
                                    {action.badge !== undefined && action.badge > 0 && (
                                        <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center">
                                            {action.badge}
                                        </div>
                                    )}
                                </div>
                            )}
                        </Button>
                    );

                    return action.to ? content : <div key={index}>{content}</div>;
                })}
            </CardContent>
        </Card>
    );
}
