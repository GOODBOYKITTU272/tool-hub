import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export function useRealtimeSubscription(
    table: string,
    callback: (payload: RealtimePostgresChangesPayload<any>) => void,
    event: 'INSERT' | 'UPDATE' | 'DELETE' | '*' = '*',
    filter?: string
): void {
    const callbackRef = useRef(callback);

    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        console.log(`Subscribing to ${table} table (event: ${event})`);

        const channel = supabase
            .channel(`${table}-${event}-channel`)
            .on(
                'postgres_changes' as any,
                {
                    event: event,
                    schema: 'public',
                    table: table,
                    filter: filter
                },
                (payload: RealtimePostgresChangesPayload<any>) => {
                    console.log(`Real-time update on ${table}:`, payload.eventType);
                    callbackRef.current(payload);
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
    }, [table, event, filter]);
}

export function useMultipleRealtimeSubscriptions(
    subscriptions: Array<{
        table: string;
        callback: (payload: RealtimePostgresChangesPayload<any>) => void;
        event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
        filter?: string;
    }>
): void {
    const subsRef = useRef(subscriptions);

    useEffect(() => {
        subsRef.current = subscriptions;
    }, [subscriptions]);

    useEffect(() => {
        const subs = subsRef.current;
        console.log(`Subscribing to ${subs.length} tables`);

        const channels = subs.map(({ table, callback, event = '*', filter }) => {
            const channel = supabase
                .channel(`${table}-${event}-multi-channel`)
                .on(
                    'postgres_changes' as any,
                    {
                        event: event,
                        schema: 'public',
                        table: table,
                        filter: filter
                    },
                    (payload: RealtimePostgresChangesPayload<any>) => {
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
            console.log(`Unsubscribing from ${subs.length} tables`);
            channels.forEach((channel) => channel.unsubscribe());
        };
    }, []);
}

export function useNotificationSubscription(
    userId: string,
    callback: (payload: RealtimePostgresChangesPayload<any>) => void
): void {
    const callbackRef = useRef(callback);

    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        if (!userId) return;

        console.log(`Subscribing to notifications for user: ${userId}`);

        const channel = supabase
            .channel(`notifications-${userId}-channel`)
            .on(
                'postgres_changes' as any,
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`
                },
                (payload: RealtimePostgresChangesPayload<any>) => {
                    console.log(`New notification for user ${userId}:`, payload.new);
                    callbackRef.current(payload);
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
    }, [userId]);
}
