import { supabase } from './supabase';

/**
 * Notification Types
 */
export type NotificationType =
    | 'tool_added'
    | 'tool_approved'
    | 'tool_rejected'
    | 'change_request'
    | 'change_approved'
    | 'change_rejected'
    | 'request_updated'
    | 'request_assigned';

export interface NotificationParams {
    user_id: string;
    type: NotificationType;
    title: string;
    message: string;
    related_id?: string;
    related_type?: string;
}

/**
 * Create a notification
 * 
 * @param params - Notification parameters
 * @returns Promise with success status
 * 
 * @example
 * ```typescript
 * await createNotification({
 *   user_id: ownerId,
 *   type: 'tool_added',
 *   title: 'New Tool Added',
 *   message: `${currentUser.name} added ${toolName}`,
 *   related_id: toolId,
 *   related_type: 'tool'
 * });
 * ```
 */
export async function createNotification(params: NotificationParams): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('notifications')
            .insert({
                user_id: params.user_id,
                type: params.type,
                title: params.title,
                message: params.message,
                related_id: params.related_id || null,
                related_type: params.related_type || null,
                is_read: false,
                created_at: new Date().toISOString()
            });

        if (error) {
            console.error('❌ Notification error:', error);
            return { success: false, error: error.message };
        }

        console.log('✅ Notification created:', params.type, 'for user:', params.user_id);
        return { success: true };
    } catch (error) {
        console.error('❌ Notification exception:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Fetch notifications for a user
 * 
 * @param userId - User ID to fetch notifications for
 * @param limit - Maximum number of notifications to fetch (default: 50)
 * @param unreadOnly - Only fetch unread notifications (default: false)
 * @returns Promise with notifications data
 */
export async function fetchNotifications(
    userId: string,
    limit: number = 50,
    unreadOnly: boolean = false
) {
    try {
        let baseQuery = supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId);

        if (unreadOnly) {
            baseQuery = baseQuery.eq('is_read', false) as typeof baseQuery;
        }

        const { data, error } = await baseQuery
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('❌ Error fetching notifications:', error);
            return { data: null, error: error.message };
        }

        return { data, error: null };
    } catch (error) {
        console.error('❌ Exception fetching notifications:', error);
        return {
            data: null,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Get unread notification count for a user
 * 
 * @param userId - User ID to get count for
 * @returns Promise with count
 */
export async function getUnreadCount(userId: string): Promise<{ count: number; error?: string }> {
    try {
        const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_read', false);

        if (error) {
            console.error('❌ Error getting unread count:', error);
            return { count: 0, error: error.message };
        }

        return { count: count || 0 };
    } catch (error) {
        console.error('❌ Exception getting unread count:', error);
        return {
            count: 0,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Delete a notification (marks as read by deleting it)
 * 
 * @param notificationId - Notification ID to delete
 * @returns Promise with success status
 */
export async function markAsRead(notificationId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', notificationId);

        if (error) {
            console.error('❌ Error deleting notification:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error) {
        console.error('❌ Exception deleting notification:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Mark all notifications as read for a user
 * 
 * @param userId - User ID to mark all notifications as read
 * @returns Promise with success status
 */
export async function markAllAsRead(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', userId)
            .eq('is_read', false);

        if (error) {
            console.error('❌ Error marking all notifications as read:', error);
            return { success: false, error: error.message };
        }

        console.log('✅ All notifications marked as read for user:', userId);
        return { success: true };
    } catch (error) {
        console.error('❌ Exception marking all notifications as read:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Delete a notification
 * 
 * @param notificationId - Notification ID to delete
 * @returns Promise with success status
 */
export async function deleteNotification(notificationId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', notificationId);

        if (error) {
            console.error('❌ Error deleting notification:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error) {
        console.error('❌ Exception deleting notification:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
