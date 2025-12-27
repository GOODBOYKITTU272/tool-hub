import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Create Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        // Use a dedicated storage key so old/stale sessions don't interfere after env changes
        storageKey: 'tool-hub-auth'
    }
});

// Database types
export type UserRole = 'Admin' | 'Owner' | 'Observer';

export interface Database {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string;
                    email: string;
                    name: string;
                    role: UserRole;
                    must_change_password: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    email: string;
                    name: string;
                    role: UserRole;
                    must_change_password?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    email?: string;
                    name?: string;
                    role?: UserRole;
                    must_change_password?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: [];
            };
            tools: {
                Row: {
                    id: string;
                    name: string;
                    description: string;
                    category: string | null;
                    type: string | null;
                    tags: string[] | null;
                    url: string | null;
                    owner_id: string | null;
                    owner_team: string | null;
                    created_by: string;
                    approved_by: string | null;
                    approval_status: 'pending' | 'approved' | 'rejected';
                    created_at: string;
                    updated_at: string;
                    environment_variables: Array<{ key: string; value: string }> | null;
                    architecture: string | null;
                    language: string | null;
                    tech_stack: string | null;
                    hosting_provider: string | null;
                    hosting_details: string | null;
                    demo_url: string | null;
                    demo_username: string | null;
                    demo_password: string | null;
                    // NEW FIELDS - Overview Tab
                    status: 'live' | 'in_development' | 'maintenance' | 'deprecated';
                    purpose: string | null;
                    primary_users: string | null;
                    // NEW FIELDS - Architecture Tab
                    system_diagram_url: string | null;
                    database_info: string | null;
                    key_dependencies: string | null;
                    data_flow: string | null;
                    third_party_services: string | null;
                    // NEW FIELDS - Language & Tech Tab
                    frontend_stack: string | null;
                    backend_stack: string | null;
                    package_manager: 'npm' | 'yarn' | 'pnpm' | 'other' | null;
                    node_version: string | null;
                    build_tool: string | null;
                    // NEW FIELDS - Hosting Tab
                    production_url: string | null;
                    staging_url: string | null;
                    deployment_method: string | null;
                    cicd_pipeline: string | null;
                    monitoring_tools: string | null;
                    backup_strategy: string | null;
                    // NEW FIELDS - Demo Login Tab
                    demo_account_type: string | null;
                    demo_data_reset_schedule: string | null;
                    demo_limitations: string | null;
                };
                Insert: {
                    id?: string;
                    name: string;
                    description: string;
                    category?: string | null;
                    type?: string | null;
                    tags?: string[] | null;
                    url?: string | null;
                    owner_id?: string | null;
                    owner_team?: string | null;
                    created_by: string;
                    approved_by?: string | null;
                    approval_status?: 'pending' | 'approved' | 'rejected';
                    created_at?: string;
                    updated_at?: string;
                    environment_variables?: Array<{ key: string; value: string }> | null;
                    architecture?: string | null;
                    language?: string | null;
                    tech_stack?: string | null;
                    hosting_provider?: string | null;
                    hosting_details?: string | null;
                    demo_url?: string | null;
                    demo_username?: string | null;
                    demo_password?: string | null;
                    // NEW FIELDS
                    status?: 'live' | 'in_development' | 'maintenance' | 'deprecated';
                    purpose?: string | null;
                    primary_users?: string | null;
                    system_diagram_url?: string | null;
                    database_info?: string | null;
                    key_dependencies?: string | null;
                    data_flow?: string | null;
                    third_party_services?: string | null;
                    frontend_stack?: string | null;
                    backend_stack?: string | null;
                    package_manager?: 'npm' | 'yarn' | 'pnpm' | 'other' | null;
                    node_version?: string | null;
                    build_tool?: string | null;
                    production_url?: string | null;
                    staging_url?: string | null;
                    deployment_method?: string | null;
                    cicd_pipeline?: string | null;
                    monitoring_tools?: string | null;
                    backup_strategy?: string | null;
                    demo_account_type?: string | null;
                    demo_data_reset_schedule?: string | null;
                    demo_limitations?: string | null;
                };
                Update: {
                    id?: string;
                    name?: string;
                    description?: string;
                    category?: string | null;
                    type?: string | null;
                    tags?: string[] | null;
                    url?: string | null;
                    owner_id?: string | null;
                    owner_team?: string | null;
                    created_by?: string;
                    approved_by?: string | null;
                    approval_status?: 'pending' | 'approved' | 'rejected';
                    created_at?: string;
                    updated_at?: string;
                    environment_variables?: Array<{ key: string; value: string }> | null;
                    architecture?: string | null;
                    language?: string | null;
                    tech_stack?: string | null;
                    hosting_provider?: string | null;
                    hosting_details?: string | null;
                    demo_url?: string | null;
                    demo_username?: string | null;
                    demo_password?: string | null;
                    // NEW FIELDS
                    status?: 'live' | 'in_development' | 'maintenance' | 'deprecated';
                    purpose?: string | null;
                    primary_users?: string | null;
                    system_diagram_url?: string | null;
                    database_info?: string | null;
                    key_dependencies?: string | null;
                    data_flow?: string | null;
                    third_party_services?: string | null;
                    frontend_stack?: string | null;
                    backend_stack?: string | null;
                    package_manager?: 'npm' | 'yarn' | 'pnpm' | 'other' | null;
                    node_version?: string | null;
                    build_tool?: string | null;
                    production_url?: string | null;
                    staging_url?: string | null;
                    deployment_method?: string | null;
                    cicd_pipeline?: string | null;
                    monitoring_tools?: string | null;
                    backup_strategy?: string | null;
                    demo_account_type?: string | null;
                    demo_data_reset_schedule?: string | null;
                    demo_limitations?: string | null;
                };
                Relationships: [];
            };
            requests: {
                Row: {
                    id: string;
                    tool_id: string;
                    title: string;
                    description: string;
                    status: 'Requested' | 'In Progress' | 'Completed' | 'Rejected';
                    created_by: string;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    tool_id: string;
                    title: string;
                    description: string;
                    status: 'Requested' | 'In Progress' | 'Completed' | 'Rejected';
                    created_by: string;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    tool_id?: string;
                    title?: string;
                    description?: string;
                    status?: 'Requested' | 'In Progress' | 'Completed' | 'Rejected';
                    created_by?: string;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: [];
            };
            audit_logs: {
                Row: {
                    id: string;
                    user_id: string | null;
                    user_name: string | null;
                    user_email: string | null;
                    action: string;
                    entity_type: string;
                    entity_id: string | null;
                    before_state: any | null;
                    after_state: any | null;
                    timestamp: string;
                };
                Insert: {
                    id?: string;
                    user_id?: string | null;
                    user_name?: string | null;
                    user_email?: string | null;
                    action: string;
                    entity_type: string;
                    entity_id?: string | null;
                    before_state?: any | null;
                    after_state?: any | null;
                    timestamp?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string | null;
                    user_name?: string | null;
                    user_email?: string | null;
                    action?: string;
                    entity_type?: string;
                    entity_id?: string | null;
                    before_state?: any | null;
                    after_state?: any | null;
                    timestamp?: string;
                };
                Relationships: [];
            };
            notifications: {
                Row: {
                    id: string;
                    user_id: string;
                    type: string;
                    title: string;
                    message: string;
                    related_id: string | null;
                    read: boolean;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    type: string;
                    title: string;
                    message: string;
                    related_id?: string | null;
                    read?: boolean;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    type?: string;
                    title?: string;
                    message?: string;
                    related_id?: string | null;
                    read?: boolean;
                    created_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "notifications_user_id_fkey";
                        columns: ["user_id"];
                        isOneToOne: false;
                        referencedRelation: "users";
                        referencedColumns: ["id"];
                    }
                ];
            };
            daily_logs: {
                Row: {
                    id: string;
                    user_id: string;
                    date: string;
                    tasks_completed: string;
                    blockers: string | null;
                    collaboration_notes: string | null;
                    work_type: 'own_tool' | 'others_tool';
                    tool_id: string | null;
                    tool_owner_id: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    date: string;
                    tasks_completed: string;
                    blockers?: string | null;
                    collaboration_notes?: string | null;
                    work_type: 'own_tool' | 'others_tool';
                    tool_id?: string | null;
                    tool_owner_id?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    date?: string;
                    tasks_completed?: string;
                    blockers?: string | null;
                    collaboration_notes?: string | null;
                    work_type?: 'own_tool' | 'others_tool';
                    tool_id?: string | null;
                    tool_owner_id?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "daily_logs_user_id_fkey";
                        columns: ["user_id"];
                        isOneToOne: false;
                        referencedRelation: "users";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "daily_logs_tool_id_fkey";
                        columns: ["tool_id"];
                        isOneToOne: false;
                        referencedRelation: "tools";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "daily_logs_tool_owner_id_fkey";
                        columns: ["tool_owner_id"];
                        isOneToOne: false;
                        referencedRelation: "users";
                        referencedColumns: ["id"];
                    }
                ];
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            [_ in never]: never;
        };
        Enums: {
            [_ in never]: never;
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
}
