import { useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

/**
 * Custom hook for real-time Supabase subscriptions
 * 
 * @param table - Table name to subscribe to
 * @param callback - Callback function to handle changes
 * @param event - Event type to listen for ('INSERT', 'UPDATE', 'DELETE', or '*' for all)
 * @param filter - Optional filter for the subscription
 * 
 * @example
 * ```typescript
 * useRealtimeSubscription('tools', (payload) => {
 *   if (payload.eventType === 'INSERT') {
 *     setTools(prev => [...prev, payload.new]);
 *   } else if (payload.eventType === 'UPDATE') {
 *     setTools(prev => prev.map(t => t.id === payload.new.id ? payload.new : t));
 *   } else if (payload.eventType === 'DELETE') {
 *     setTools(prev => prev.filter(t => t.id !== payload.old.id));
 *   }
 * });
 * ```
 */
export function useRealtimeSubscription(
    table: string,
    callback: (payload: RealtimePostgresChangesPayload<any>) => void,
    event: 'INSERT' | 'UPDATE' | 'DELETE' | '*' = '*',
    filter?: string
) {
    // Memoize callback to prevent unnecessary re-subscriptions
    const memoizedCallback = useCallback(callback, []);

    useEffect(() => {
        console.log(`🔔 Subscribing to ${table} table (event: ${event})`);

        // Create subscription
        const channel = supabase.channel(`${table}-${event}-channel`);

        // Configure subscription
        let subscription = channel.on(
            'postgres_changes',
            {
                event: event,
                schema: 'public',
                table: table,
                filter: filter
            },
            (payload) => {
                console.log(`📡 Real-time update on ${table}:`, payload.eventType, payload);
                memoizedCallback(payload);
            }
        );

        // Subscribe
        subscription.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log(`✅ Subscribed to ${table} table`);
            } else if (status === 'CHANNEL_ERROR') {
                console.error(`❌ Error subscribing to ${table} table`);
            } else if (status === 'TIMED_OUT') {
                console.error(`⏱️ Subscription to ${table} table timed out`);
            }
        });

        // Cleanup on unmount
        return () => {
            console.log(`🔕 Unsubscribing from ${table} table`);
            channel.unsubscribe();
        };
    }, [table, event, filter, memoizedCallback]);
}

/**
 * Custom hook for subscribing to multiple tables
 * 
 * @param subscriptions - Array of subscription configurations
 * 
 * @example
 * ```typescript
 * useMultipleRealtimeSubscriptions([
 *   { table: 'tools', callback: handleToolsChange },
 *   { table: 'requests', callback: handleRequestsChange, event: 'UPDATE' }
 * ]);
 * ```
 */
export function useMultipleRealtimeSubscriptions(
    subscriptions: Array<{
        table: string;
        callback: (payload: RealtimePostgresChangesPayload<any>) => void;
        event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
        filter?: string;
    }>
) {
    useEffect(() => {
        console.log(`🔔 Subscribing to ${subscriptions.length} tables`);

        const channels = subscriptions.map(({ table, callback, event = '*', filter }) => {
            const channel = supabase.channel(`${table}-${event}-multi-channel`);

            channel.on(
                'postgres_changes',
                {
                    event: event,
                    schema: 'public',
                    table: table,
                    filter: filter
                },
                (payload) => {
                    console.log(`📡 Real-time update on ${table}:`, payload.eventType);
                    callback(payload);
                }
            );

            channel.subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log(`✅ Subscribed to ${table} table`);
                }
            });

            return channel;
        });

        // Cleanup on unmount
        return () => {
            console.log(`🔕 Unsubscribing from ${subscriptions.length} tables`);
            channels.forEach(channel => channel.unsubscribe());
        };
    }, [subscriptions]);
}

/**
 * Custom hook for subscribing to user-specific notifications
 * 
 * @param userId - User ID to subscribe to notifications for
 * @param callback - Callback function to handle new notifications
 * 
 * @example
 * ```typescript
 * useNotificationSubscription(currentUser.id, (payload) => {
 *   if (payload.eventType === 'INSERT') {
 *     toast({
 *       title: payload.new.title,
 *       description: payload.new.message
 *     });
 *     setUnreadCount(prev => prev + 1);
 *   }
 * });
 * ```
 */
export function useNotificationSubscription(
    userId: string,
    callback: (payload: RealtimePostgresChangesPayload<any>) => void
) {
    const memoizedCallback = useCallback(callback, []);

    useEffect(() => {
        if (!userId) return;

        console.log(`🔔 Subscribing to notifications for user: ${userId}`);

        const channel = supabase.channel(`notifications-${userId}-channel`);

        channel.on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${userId}`
            },
            (payload) => {
                console.log(`📡 New notification for user ${userId}:`, payload.new);
                memoizedCallback(payload);
            }
        );

        channel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log(`✅ Subscribed to notifications for user ${userId}`);
            }
        });

        return () => {
            console.log(`🔕 Unsubscribing from notifications for user ${userId}`);
            channel.unsubscribe();
        };
    }, [userId, memoizedCallback]);
}
