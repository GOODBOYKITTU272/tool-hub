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
