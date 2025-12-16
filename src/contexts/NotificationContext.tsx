import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockNotifications, type Notification } from '@/lib/mockData';

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
    const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);

    const unreadCount = notifications.filter((n) => !n.read).length;

    const addNotification = (notification: Notification) => {
        setNotifications([notification, ...notifications]);
    };

    const markAsRead = (notificationId: string) => {
        setNotifications(
            notifications.map((n) =>
                n.id === notificationId ? { ...n, read: true } : n
            )
        );
    };

    const markAllAsRead = () => {
        setNotifications(notifications.map((n) => ({ ...n, read: true })));
    };

    const clearNotification = (notificationId: string) => {
        setNotifications(notifications.filter((n) => n.id !== notificationId));
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
