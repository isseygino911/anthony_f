import { Bell } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../../api/admin';
import type { Notification } from '../../types';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

export function NotificationBell() {
  const [items, setItems] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  function load() {
    getNotifications({ unreadOnly: false, page: 1, pageSize: 10 })
      .then((res) => {
        setItems(res.items);
        setUnreadCount(res.unreadCount);
      })
      .catch(() => {
        setItems([]);
        setUnreadCount(0);
      });
  }

  useEffect(() => {
    load();
  }, []);

  async function handleRead(id: number) {
    await markNotificationRead(id);
    load();
  }

  async function handleReadAll() {
    await markAllNotificationsRead();
    load();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <button className="text-xs font-normal text-brand hover:underline" onClick={handleReadAll}>
              Mark all read
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 && (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">No notifications</div>
        )}
        {items.map((n) => (
          <DropdownMenuItem
            key={n.id}
            className={n.is_read ? 'opacity-60' : 'font-medium'}
            onSelect={() => !n.is_read && handleRead(n.id)}
          >
            <div className="flex flex-col gap-0.5">
              <span>{n.message}</span>
              <span className="text-xs font-normal text-muted-foreground">
                {new Date(n.created_at).toLocaleString()}
              </span>
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/admin/notifications">View all</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
