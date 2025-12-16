import { supabase } from './supabase';

/**
 * Audit Log Types
 */
export type AuditAction = 'create' | 'update' | 'delete' | 'approve' | 'reject';
export type AuditEntityType = 'tool' | 'user' | 'request' | 'env_var' | 'change_request';

export interface AuditLogParams {
    user_id: string;
    action: AuditAction;
    entity_type: AuditEntityType;
    entity_id: string;
    details?: Record<string, any>;
}

/**
 * Create an audit log entry
 * 
 * @param params - Audit log parameters
 * @returns Promise with success status
 * 
 * @example
 * ```typescript
 * await createAuditLog({
 *   user_id: currentUser.id,
 *   action: 'create',
 *   entity_type: 'tool',
 *   entity_id: newTool.id,
 *   details: { name: newTool.name, category: newTool.category }
 * });
 * ```
 */
export async function createAuditLog(params: AuditLogParams): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('audit_logs')
            .insert({
                user_id: params.user_id,
                action: params.action,
                entity_type: params.entity_type,
                entity_id: params.entity_id,
                details: params.details || {},
                created_at: new Date().toISOString()
            });

        if (error) {
            console.error('❌ Audit log error:', error);
            return { success: false, error: error.message };
        }

        console.log('✅ Audit log created:', params.action, params.entity_type, params.entity_id);
        return { success: true };
    } catch (error) {
        console.error('❌ Audit log exception:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Fetch audit logs with optional filters
 * 
 * @param filters - Optional filters for action, entity_type, user_id, date range
 * @param limit - Maximum number of logs to fetch (default: 100)
 * @returns Promise with audit logs data
 */
export async function fetchAuditLogs(filters?: {
    action?: AuditAction;
    entity_type?: AuditEntityType;
    user_id?: string;
    start_date?: string;
    end_date?: string;
}, limit: number = 100) {
    try {
        let query = supabase
            .from('audit_logs')
            .select(`
        *,
        user:users(name, email, role)
      `)
            .order('created_at', { ascending: false })
            .limit(limit);

        // Apply filters
        if (filters?.action) {
            query = query.eq('action', filters.action);
        }
        if (filters?.entity_type) {
            query = query.eq('entity_type', filters.entity_type);
        }
        if (filters?.user_id) {
            query = query.eq('user_id', filters.user_id);
        }
        if (filters?.start_date) {
            query = query.gte('created_at', filters.start_date);
        }
        if (filters?.end_date) {
            query = query.lte('created_at', filters.end_date);
        }

        const { data, error } = await query;

        if (error) {
            console.error('❌ Error fetching audit logs:', error);
            return { data: null, error: error.message };
        }

        return { data, error: null };
    } catch (error) {
        console.error('❌ Exception fetching audit logs:', error);
        return {
            data: null,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
