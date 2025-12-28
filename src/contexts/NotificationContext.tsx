import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, Database } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

type Notification = Database['public']['Tables']['notifications']['Row'];

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    addNotification: (notification: Notification) => void;
    markAsRead: (notificationId: string) => void;
    markAllAsRead: () => void;
    clearNotification: (notificationId: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const { currentUser } = useAuth();
    const { toast } = useToast();

    useEffect(() => {
        if (currentUser) {
            fetchNotifications();

            // Subscribe to new notifications
            const subscription = supabase
                .channel(`notifications:${currentUser.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'notifications',
                        filter: `user_id=eq.${currentUser.id}`,
                    },
                    (payload) => {
                        if (payload.eventType === 'INSERT') {
                            setNotifications((prev) => [payload.new as Notification, ...prev]);
                            toast({
                                title: (payload.new as Notification).title,
                                description: (payload.new as Notification).message,
                            });
                        } else if (payload.eventType === 'UPDATE') {
                            setNotifications((prev) =>
                                prev.map((n) => (n.id === payload.new.id ? (payload.new as Notification) : n))
                            );
                        } else if (payload.eventType === 'DELETE') {
                            setNotifications((prev) => prev.filter((n) => n.id !== payload.old.id));
                        }
                    }
                )
                .subscribe();

            return () => {
                subscription.unsubscribe();
            };
        } else {
            setNotifications([]);
        }
    }, [currentUser]);

    const fetchNotifications = async () => {
        if (!currentUser) return;

        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: false });

            if (error && error.code !== '42P01') throw error;
            setNotifications(data || []);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const unreadCount = notifications.filter((n) => !n.read).length;

    const addNotification = async (notification: any) => {
        // Usually notifications are added by triggers or backend, 
        // but if manual addition is needed:
        if (!currentUser) return;

        try {
            const { data, error } = await supabase
                .from('notifications')
                .insert([{ ...notification, user_id: currentUser.id }])
                .select()
                .single();

            if (error) throw error;
            // State will be updated via real-time subscription
        } catch (error) {
            console.error('Error adding notification:', error);
        }
    };

    const markAsRead = async (notificationId: string) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('id', notificationId);

            if (error) throw error;

            // Remove from local state (deleted, not just marked as read)
            setNotifications(notifications.filter(n => n.id !== notificationId));
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const markAllAsRead = async () => {
        if (!currentUser) return;

        try {
            const { error } = await supabase
                .from('notifications')
                .update({ read: true })
                .eq('user_id', currentUser.id)
                .eq('read', false);

            if (error) throw error;
            setNotifications(notifications.map(n => ({ ...n, read: true })));
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    const clearNotification = async (notificationId: string) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('id', notificationId);

            if (error) throw error;
            setNotifications(notifications.filter(n => n.id !== notificationId));
        } catch (error) {
            console.error('Error clearing notification:', error);
        }
    };

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                addNotification,
                markAsRead,
                markAllAsRead,
                clearNotification,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}

