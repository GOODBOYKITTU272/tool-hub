import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        // Use a dedicated storage key so old/stale sessions don't interfere after env changes
        storageKey: 'tool-hub-auth'
    }
});

// Database types (will be auto-generated later)
export type Database = {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string;
                    email: string;
                    name: string;
                    role: 'Admin' | 'Owner' | 'Observer';
                    must_change_password: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at' | 'updated_at'>;
                Update: Partial<Database['public']['Tables']['users']['Insert']>;
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
                Insert: Omit<Database['public']['Tables']['tools']['Row'], 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Database['public']['Tables']['tools']['Insert']>;
            };
            // Add other table types as needed
        };
    };
};
