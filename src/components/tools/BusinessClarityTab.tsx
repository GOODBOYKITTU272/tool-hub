import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
    Target,
    Users,
    AlertTriangle,
    TrendingUp,
    Pencil,
    Save,
    X,
    Loader2,
    FileText
} from 'lucide-react';
import type { Database } from '@/lib/supabase';

type BusinessClarity = Database['public']['Tables']['tool_business_clarity']['Row'];
type Tool = Database['public']['Tables']['tools']['Row'];

interface BusinessClarityTabProps {
    tool: Tool;
}

export function BusinessClarityTab({ tool }: BusinessClarityTabProps) {
    const [clarity, setClarity] = useState<BusinessClarity | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const { currentUser } = useAuth();
    const { toast } = useToast();

    const canEdit = currentUser && (currentUser.role === 'Admin' || tool.owner_id === currentUser.id);

    useEffect(() => {
        fetchBusinessClarity();
    }, [tool.id]);

    const fetchBusinessClarity = async () => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('tool_business_clarity')
                .select('*')
                .eq('tool_id', tool.id)
                .maybeSingle();

            if (error && error.code !== 'PGRST116') throw error;
            setClarity(data);
        } catch (error: any) {
            console.error('Error fetching business clarity:', error);
            toast({
                title: 'Error',
                description: 'Failed to load business clarity information',
                variant: 'destructive'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!clarity || !currentUser) return;

        try {
            setIsSaving(true);
            const { error } = await supabase
                .from('tool_business_clarity')
                .upsert({
                    ...clarity,
                    tool_id: tool.id,
                    updated_by: currentUser.id,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;

            toast({
                title: 'Success',
                description: 'Business clarity saved successfully'
            });
            setIsEditing(false);
            fetchBusinessClarity();
        } catch (error: any) {
            console.error('Error saving business clarity:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to save business clarity',
                variant: 'destructive'
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        fetchBusinessClarity();
    };

    const updateField = (field: keyof BusinessClarity, value: string) => {
        setClarity(prev => prev ? { ...prev, [field]: value } : null);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with Edit Button */}
            {canEdit && (
                <div className="flex justify-end gap-2">
                    {isEditing ? (
                        <>
                            <Button
                                onClick={handleCancel}
                                variant="outline"
                                disabled={isSaving}
                            >
                                <X className="w-4 h-4 mr-2" />
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4 mr-2" />
                                )}
                                Save Changes
                            </Button>
                        </>
                    ) : (
                        <Button onClick={() => setIsEditing(true)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                        </Button>
                    )}
                </div>
            )}

            {/* Product & Business Clarity Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-primary" />
                        Product & Business Clarity
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <ClarityField
                        label="Why are we building this product?"
                        value={clarity?.why_building || ''}
                        isEditing={isEditing}
                        onChange={(value) => updateField('why_building', value)}
                        placeholder="Describe the core motivation and strategic reason for building this tool..."
                    />
                    <ClarityField
                        label="What problem does it solve and for whom?"
                        value={clarity?.problem_statement || ''}
                        isEditing={isEditing}
                        onChange={(value) => updateField('problem_statement', value)}
                        placeholder="Explain the specific problem, pain points, and target users..."
                    />
                    <ClarityField
                        label="How will the company use this product?"
                        value={clarity?.company_usage || ''}
                        isEditing={isEditing}
                        onChange={(value) => updateField('company_usage', value)}
                        placeholder="Describe how different teams or departments will utilize this tool..."
                    />
                    <ClarityField
                        label="What is the revenue or value model?"
                        value={clarity?.revenue_model || ''}
                        isEditing={isEditing}
                        onChange={(value) => updateField('revenue_model', value)}
                        placeholder="Outline how this creates value: cost savings, revenue generation, efficiency gains..."
                        icon={<TrendingUp className="w-4 h-4 text-green-500" />}
                    />
                </CardContent>
            </Card>

            {/* User & Workflow Understanding Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        User & Workflow Understanding
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <ClarityField
                        label="Who is the primary user?"
                        value={clarity?.primary_user || ''}
                        isEditing={isEditing}
                        onChange={(value) => updateField('primary_user', value)}
                        placeholder="Define the primary user role, department, or persona..."
                    />
                    <ClarityField
                        label="User Persona Details"
                        value={clarity?.user_persona || ''}
                        isEditing={isEditing}
                        onChange={(value) => updateField('user_persona', value)}
                        placeholder="Describe user characteristics, skills level, goals, and context..."
                    />
                    <ClarityField
                        label="What is the end-to-end workflow?"
                        value={clarity?.end_to_end_workflow || ''}
                        isEditing={isEditing}
                        onChange={(value) => updateField('end_to_end_workflow', value)}
                        placeholder="Map out the complete user journey from start to finish..."
                        icon={<FileText className="w-4 h-4 text-blue-500" />}
                    />
                    <ClarityField
                        label="What challenges and risks can we identify?"
                        value={clarity?.challenges_risks || ''}
                        isEditing={isEditing}
                        onChange={(value) => updateField('challenges_risks', value)}
                        placeholder="List potential challenges, risks, and mitigation strategies..."
                        icon={<AlertTriangle className="w-4 h-4 text-amber-500" />}
                    />
                    <ClarityField
                        label="How do we measure success?"
                        value={clarity?.success_metrics || ''}
                        isEditing={isEditing}
                        onChange={(value) => updateField('success_metrics', value)}
                        placeholder="Define KPIs, metrics, and success criteria..."
                    />
                </CardContent>
            </Card>
        </div>
    );
}

// Reusable field component
interface ClarityFieldProps {
    label: string;
    value: string;
    isEditing: boolean;
    onChange?: (value: string) => void;
    placeholder?: string;
    icon?: React.ReactNode;
}

function ClarityField({ label, value, isEditing, onChange, placeholder, icon }: ClarityFieldProps) {
    return (
        <div className="space-y-2">
            <Label className="flex items-center gap-2 text-base font-semibold">
                {icon}
                {label}
            </Label>
            {isEditing ? (
                <Textarea
                    value={value}
                    onChange={(e) => onChange?.(e.target.value)}
                    placeholder={placeholder}
                    className="min-h-[120px] resize-y"
                />
            ) : (
                <div className={`p-4 rounded-lg border bg-muted/50 ${!value && 'text-muted-foreground italic'}`}>
                    {value || 'Not specified yet'}
                </div>
            )}
        </div>
    );
}
