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
 */
export function useRealtimeSubscription(
    table: string,
    callback: (payload: RealtimePostgresChangesPayload<any>) => void,
    event: 'INSERT' | 'UPDATE' | 'DELETE' | '*' = '*',
    filter?: string
) {
    // Memoize callback to prevent unnecessary re-subscriptions
    const memoizedCallback = useCallback(callback, [callback]);

    useEffect(() => {
        console.log(`Subscribing to ${table} table (event: ${event})`);

        const channel = supabase
            .channel(`${table}-${event}-channel`)
            .on(
                'postgres_changes',
                {
                    event: event,
                    schema: 'public',
                    table: table,
                    filter: filter
                },
                (payload) => {
                    console.log(`Real-time update on ${table}:`, payload.eventType, payload);
                    memoizedCallback(payload);
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log(`Subscribed to ${table} table`);
                } else if (status === 'CHANNEL_ERROR') {
                    console.error(`Error subscribing to ${table} table`);
                } else if (status === 'TIMED_OUT') {
                    console.error(`Subscription to ${table} table timed out`);
                }
            });

        return () => {
            console.log(`Unsubscribing from ${table} table`);
            channel.unsubscribe();
        };
    }, [table, event, filter, memoizedCallback]);
}

/**
 * Custom hook for subscribing to multiple tables
 *
 * @param subscriptions - Array of subscription configurations
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
        console.log(`Subscribing to ${subscriptions.length} tables`);

        const channels = subscriptions.map(({ table, callback, event = '*', filter }) => {
            const channel = supabase
                .channel(`${table}-${event}-multi-channel`)
                .on(
                    'postgres_changes',
                    {
                        event: event,
                        schema: 'public',
                        table: table,
                        filter: filter
                    },
                    (payload) => {
                        console.log(`Real-time update on ${table}:`, payload.eventType);
                        callback(payload);
                    }
                )
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        console.log(`Subscribed to ${table} table`);
                    }
                });

            return channel;
        });

        return () => {
            console.log(`Unsubscribing from ${subscriptions.length} tables`);
            channels.forEach((channel) => channel.unsubscribe());
        };
    }, [subscriptions]);
}

/**
 * Custom hook for subscribing to user-specific notifications
 *
 * @param userId - User ID to subscribe to notifications for
 * @param callback - Callback function to handle new notifications
 */
export function useNotificationSubscription(
    userId: string,
    callback: (payload: RealtimePostgresChangesPayload<any>) => void
) {
    const memoizedCallback = useCallback(callback, [callback]);

    useEffect(() => {
        if (!userId) return;

        console.log(`Subscribing to notifications for user: ${userId}`);

        const channel = supabase
            .channel(`notifications-${userId}-channel`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`
                },
                (payload) => {
                    console.log(`New notification for user ${userId}:`, payload.new);
                    memoizedCallback(payload);
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log(`Subscribed to notifications for user ${userId}`);
                }
            });

        return () => {
            console.log(`Unsubscribing from notifications for user ${userId}`);
            channel.unsubscribe();
        };
    }, [userId, memoizedCallback]);
}
