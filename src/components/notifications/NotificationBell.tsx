import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

export function NotificationBell() {
    const { notifications, unreadCount, markAsRead } = useNotifications();
    const { currentUser } = useAuth();

    // Filter notifications for current user
    const userNotifications = notifications
        .filter((n) => n.user_id === currentUser?.id)
        .slice(0, 5); // Show only 5 most recent

    const handleNotificationClick = (notificationId: string) => {
        markAsRead(notificationId);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                        >
                            {unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {userNotifications.length > 0 ? (
                    <>
                        {userNotifications.map((notification) => (
                            <DropdownMenuItem
                                key={notification.id}
                                className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                                onClick={() => handleNotificationClick(notification.id)}
                            >
                                <div className="flex items-start justify-between w-full">
                                    <p className="font-medium text-sm">{notification.title}</p>
                                    {!notification.is_read && (
                                        <div className="h-2 w-2 rounded-full bg-blue-500 mt-1" />
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground">{notification.message}</p>
                                <p className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                </p>
                            </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-center justify-center text-sm text-primary cursor-pointer"
                            onClick={async () => {
                                // Mark all user notifications as read
                                for (const notification of userNotifications) {
                                    if (!notification.is_read) {
                                        await markAsRead(notification.id);
                                    }
                                }
                            }}
                        >
                            Mark all as read
                        </DropdownMenuItem>
                    </>
                ) : (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                        No notifications
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
