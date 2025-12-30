import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface DailyLogFormProps {
    selectedDate: Date;
    existingLog?: DailyLog | null;
    onSave: (log: DailyLogInput) => Promise<void>;
}

export interface DailyLog {
    id: string;
    user_id: string;
    date: string;
    tasks_completed: string;
    blockers?: string;
    collaboration_notes?: string;

    // New structured fields
    work_type: 'own_tool' | 'others_tool';
    tool_id?: string;
    tool_owner_id?: string;

    created_at: string;
    updated_at: string;
}

export interface DailyLogInput {
    date: string;
    tasks_completed: string;
    blockers?: string;
    collaboration_notes?: string;

    // New structured fields
    work_type: 'own_tool' | 'others_tool';
    tool_id?: string;
    tool_owner_id?: string;
}

interface Tool {
    id: string;
    name: string;
    owner_id: string;
}

interface TeamMember {
    id: string;
    name: string;
    email: string;
}

export function DailyLogForm({ selectedDate, existingLog, onSave }: DailyLogFormProps) {
    const { toast } = useToast();
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);

    // Data lists
    const [myTools, setMyTools] = useState<Tool[]>([]);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [selectedOwnerTools, setSelectedOwnerTools] = useState<Tool[]>([]);

    const [formData, setFormData] = useState<DailyLogInput>({
        date: selectedDate.toISOString().split('T')[0],
        tasks_completed: '',
        blockers: '',
        collaboration_notes: '',
        work_type: 'own_tool',
        tool_id: undefined,
        tool_owner_id: undefined,
    });

    // AI Enhancement state
    const [enhancingAccomplishments, setEnhancingAccomplishments] = useState(false);
    const [enhancingBlockers, setEnhancingBlockers] = useState(false);

    // Load tools and team members
    useEffect(() => {
        const fetchData = async () => {
            if (!currentUser) return;

            setLoadingData(true);
            try {
                // Fetch user's own tools
                const { data: myToolsData, error: myToolsError } = await supabase
                    .from('tools')
                    .select('id, name, owner_id')
                    .eq('owner_id', currentUser.id)
                    .eq('approval_status', 'approved')
                    .order('name');

                if (myToolsError) throw myToolsError;
                setMyTools(myToolsData || []);

                // Fetch team members (Admin and Owner roles only)
                const { data: teamData, error: teamError } = await supabase
                    .from('users')
                    .select('id, name, email')
                    .neq('id', currentUser.id)
                    .in('role', ['Admin', 'Owner'])
                    .order('name');

                if (teamError) throw teamError;
                setTeamMembers(teamData || []);
            } catch (error: any) {
                console.error('Error fetching data:', error);
                toast({
                    title: 'Error Loading Data',
                    description: 'Failed to load tools and team members.',
                    variant: 'destructive',
                });
            } finally {
                setLoadingData(false);
            }
        };

        fetchData();
    }, [currentUser]);

    // Fetch tools for selected owner
    useEffect(() => {
        const fetchOwnerTools = async () => {
            if (formData.work_type !== 'others_tool' || !formData.tool_owner_id) {
                setSelectedOwnerTools([]);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('tools')
                    .select('id, name, owner_id')
                    .eq('owner_id', formData.tool_owner_id)
                    .eq('approval_status', 'approved')
                    .order('name');

                if (error) throw error;
                setSelectedOwnerTools(data || []);
            } catch (error: any) {
                console.error('Error fetching owner tools:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to load tools for selected owner.',
                    variant: 'destructive',
                });
            }
        };

        fetchOwnerTools();
    }, [formData.work_type, formData.tool_owner_id]);

    // Load existing log or draft
    useEffect(() => {
        const dateStr = selectedDate.toISOString().split('T')[0];

        if (existingLog) {
            // Load existing log from database
            setFormData({
                date: dateStr,
                tasks_completed: existingLog.tasks_completed || '',
                blockers: existingLog.blockers || '',
                collaboration_notes: existingLog.collaboration_notes || '',
                work_type: existingLog.work_type || 'own_tool',
                tool_id: existingLog.tool_id,
                tool_owner_id: existingLog.tool_owner_id,
            });
        } else {
            // Try to load draft from localStorage
            const draftKey = `daily-log-draft-${dateStr}`;
            const draft = localStorage.getItem(draftKey);

            if (draft) {
                try {
                    const parsedDraft = JSON.parse(draft);
                    setFormData(parsedDraft);
                } catch {
                    // Invalid draft, reset
                    resetForm(dateStr);
                }
            } else {
                // Reset form for new date
                resetForm(dateStr);
            }
        }
    }, [selectedDate, existingLog]);

    const resetForm = (dateStr: string) => {
        setFormData({
            date: dateStr,
            tasks_completed: '',
            blockers: '',
            collaboration_notes: '',
            work_type: 'own_tool',
            tool_id: undefined,
            tool_owner_id: undefined,
        });
    };

    // Auto-save draft to localStorage
    useEffect(() => {
        if (!existingLog && formData.tasks_completed.trim()) {
            const draftKey = `daily-log-draft-${formData.date}`;
            localStorage.setItem(draftKey, JSON.stringify(formData));
        }
    }, [formData, existingLog]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.tasks_completed.trim()) {
            toast({
                title: 'Tasks Required',
                description: 'Please enter at least one task you completed today.',
                variant: 'destructive',
            });
            return;
        }

        if (!formData.tool_id) {
            toast({
                title: 'Tool Required',
                description: 'Please select which tool you worked on today.',
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);
        try {
            await onSave(formData);

            // Clear draft after successful save
            const draftKey = `daily-log-draft-${formData.date}`;
            localStorage.removeItem(draftKey);

            toast({
                title: 'Daily Log Saved!',
                description: `Your work log for ${selectedDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                })} has been saved successfully.`,
            });
        } catch (error: any) {
            toast({
                title: 'Error Saving Log',
                description: error.message || 'Failed to save daily log. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    // AI Enhancement function
    const handleEnhance = async (text: string, context: 'accomplishments' | 'blockers') => {
        if (!text.trim()) {
            toast({
                title: 'Nothing to Enhance',
                description: 'Please type some text first before enhancing.',
                variant: 'destructive',
            });
            return;
        }

        const setEnhancing = context === 'accomplishments' ? setEnhancingAccomplishments : setEnhancingBlockers;
        setEnhancing(true);

        try {
            const response = await supabase.functions.invoke('enhance-text', {
                body: { text, context },
            });

            if (response.error) throw response.error;

            const enhancedText = response.data.enhancedText;

            // Update form data with enhanced text
            if (context === 'accomplishments') {
                setFormData({ ...formData, tasks_completed: enhancedText });
            } else {
                setFormData({ ...formData, blockers: enhancedText });
            }

            toast({
                title: '✨ Text Enhanced!',
                description: response.data.usingFallback
                    ? 'Text has been polished (AI unavailable, used basic enhancement)'
                    : 'Your text has been professionally enhanced by AI.',
            });
        } catch (error: any) {
            console.error('Enhancement error:', error);
            toast({
                title: 'Enhancement Failed',
                description: error.message || 'Failed to enhance text. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setEnhancing(false);
        }
    };

    const handleWorkTypeChange = (value: 'own_tool' | 'others_tool') => {
        setFormData({
            ...formData,
            work_type: value,
            tool_id: undefined,
            tool_owner_id: value === 'others_tool' ? undefined : currentUser?.id,
        });
    };

    const handleOwnerChange = (ownerId: string) => {
        setFormData({
            ...formData,
            tool_owner_id: ownerId,
            tool_id: undefined, // Reset tool selection when owner changes
        });
    };

    const isToday = () => {
        const today = new Date();
        return (
            selectedDate.getDate() === today.getDate() &&
            selectedDate.getMonth() === today.getMonth() &&
            selectedDate.getFullYear() === today.getFullYear()
        );
    };

    const isFuture = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selected = new Date(selectedDate);
        selected.setHours(0, 0, 0, 0);
        return selected > today;
    };

    const isWeekend = () => {
        const day = selectedDate.getDay();
        return day === 0 || day === 6; // Sunday = 0, Saturday = 6
    };

    const formattedDate = selectedDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });

    if (isFuture()) {
        return (
            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                    You cannot create logs for future dates. Please select today or a past date.
                </AlertDescription>
            </Alert>
        );
    }

    if (isWeekend()) {
        return (
            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                    Weekend days are not tracked. We work Monday to Friday only.
                </AlertDescription>
            </Alert>
        );
    }

    if (loadingData) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Loading...</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Loading tools and team members...</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            Daily Work Log
                            {isToday() && <Badge variant="default">Today</Badge>}
                            {existingLog && <Badge variant="secondary" className="gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Saved
                            </Badge>}
                        </CardTitle>
                        <CardDescription>{formattedDate}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Projects Worked On Section */}
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                        <h3 className="font-semibold flex items-center gap-2">
                            🔧 Project/Tool Worked On Today
                            <span className="text-destructive">*</span>
                        </h3>

                        {/* Step 1: Work Type */}
                        <div className="space-y-2">
                            <Label htmlFor="work-type">Select work type</Label>
                            <Select
                                value={formData.work_type}
                                onValueChange={handleWorkTypeChange}
                            >
                                <SelectTrigger id="work-type">
                                    <SelectValue placeholder="Select work type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="own_tool">My Own Tool</SelectItem>
                                    <SelectItem value="others_tool">Collaborated</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Step 2a: Own Tool Selection */}
                        {formData.work_type === 'own_tool' && (
                            <div className="space-y-2">
                                <Label htmlFor="own-tool">Select your tool</Label>
                                <Select
                                    value={formData.tool_id}
                                    onValueChange={(value) => setFormData({ ...formData, tool_id: value, tool_owner_id: currentUser?.id })}
                                >
                                    <SelectTrigger id="own-tool">
                                        <SelectValue placeholder="Select your tool" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {myTools.length === 0 ? (
                                            <div className="p-2 text-sm text-muted-foreground">
                                                No tools found. Create a tool first.
                                            </div>
                                        ) : (
                                            myTools.map(tool => (
                                                <SelectItem key={tool.id} value={tool.id}>
                                                    {tool.name}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Step 2b: Someone Else's Tool - Owner Selection */}
                        {formData.work_type === 'others_tool' && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="tool-owner">Whose tool did you help with?</Label>
                                    <Select
                                        value={formData.tool_owner_id}
                                        onValueChange={handleOwnerChange}
                                    >
                                        <SelectTrigger id="tool-owner">
                                            <SelectValue placeholder="Select team member" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {teamMembers.length === 0 ? (
                                                <div className="p-2 text-sm text-muted-foreground">
                                                    No team members found
                                                </div>
                                            ) : (
                                                teamMembers.map(member => (
                                                    <SelectItem key={member.id} value={member.id}>
                                                        {member.name}
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Step 2c: Tool Selection for Selected Owner */}
                                {formData.tool_owner_id && (
                                    <div className="space-y-2">
                                        <Label htmlFor="owner-tool">Which tool?</Label>
                                        <Select
                                            value={formData.tool_id}
                                            onValueChange={(value) => setFormData({ ...formData, tool_id: value })}
                                        >
                                            <SelectTrigger id="owner-tool">
                                                <SelectValue placeholder="Select tool" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {selectedOwnerTools.length === 0 ? (
                                                    <div className="p-2 text-sm text-muted-foreground">
                                                        This person has no tools
                                                    </div>
                                                ) : (
                                                    selectedOwnerTools.map(tool => (
                                                        <SelectItem key={tool.id} value={tool.id}>
                                                            {tool.name}
                                                        </SelectItem>
                                                    ))
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Tasks Completed */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="tasks">
                                What did you accomplish today? <span className="text-destructive">*</span>
                            </Label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleEnhance(formData.tasks_completed, 'accomplishments')}
                                disabled={enhancingAccomplishments || !formData.tasks_completed.trim()}
                                className="gap-2 text-xs"
                            >
                                {enhancingAccomplishments ? (
                                    <>
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                        Enhancing...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-3 h-3" />
                                        Enhance
                                    </>
                                )}
                            </Button>
                        </div>
                        <Textarea
                            id="tasks"
                            value={formData.tasks_completed}
                            onChange={(e) => setFormData({ ...formData, tasks_completed: e.target.value })}
                            placeholder="Example:&#10;- Fixed notification system bug&#10;- Updated database schema for user management&#10;- Reviewed pull requests"
                            rows={6}
                            className="resize-none"
                            required
                        />
                        <p className="text-xs text-muted-foreground">
                            List your completed tasks. Be specific about what you accomplished.
                        </p>
                    </div>

                    {/* Collaboration Notes */}
                    {formData.work_type === 'others_tool' && (
                        <div className="space-y-2">
                            <Label htmlFor="collaboration">Collaboration Details</Label>
                            <Textarea
                                id="collaboration"
                                value={formData.collaboration_notes}
                                onChange={(e) => setFormData({ ...formData, collaboration_notes: e.target.value })}
                                placeholder="Example: Paired with Ramakrishna on database design, helped implement new feature"
                                rows={3}
                                className="resize-none"
                            />
                            <p className="text-xs text-muted-foreground">
                                Describe how you collaborated and what you worked on together.
                            </p>
                        </div>
                    )}

                    {/* Blockers */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="blockers">Blockers or Challenges</Label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleEnhance(formData.blockers || '', 'blockers')}
                                disabled={enhancingBlockers || !formData.blockers?.trim()}
                                className="gap-2 text-xs"
                            >
                                {enhancingBlockers ? (
                                    <>
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                        Enhancing...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-3 h-3" />
                                        Enhance
                                    </>
                                )}
                            </Button>
                        </div>
                        <Textarea
                            id="blockers"
                            value={formData.blockers}
                            onChange={(e) => setFormData({ ...formData, blockers: e.target.value })}
                            placeholder="Example: Waiting for API access, struggling with Supabase RLS policies"
                            rows={3}
                            className="resize-none"
                        />
                        <p className="text-xs text-muted-foreground">
                            Any challenges, blockers, or issues you faced? (Optional)
                        </p>
                    </div>

                    {/* Submit Button */}
                    <div className="flex items-center justify-between pt-4">
                        <p className="text-sm text-muted-foreground">
                            {!existingLog && formData.tasks_completed.trim() && (
                                <span className="text-green-600 dark:text-green-400">
                                    Draft auto-saved
                                </span>
                            )}
                        </p>
                        <Button type="submit" disabled={loading} className="gap-2">
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    {existingLog ? 'Update Log' : 'Save Log'}
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card >
    );
}
