import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  listMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../../api/customerNotifications';
import { ErrorMessage } from '../../../components/layout/AsyncState';
import { Button } from '../../../components/ui/button';
import { Skeleton } from '../../../components/ui/skeleton';
import { cn } from '../../../lib/utils';
import type { CustomerNotification } from '../../../types';

export function Notifications() {
  const [items, setItems] = useState<CustomerNotification[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    listMyNotifications({ pageSize: 50 })
      .then((res) => setItems(res.items))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load notifications'));
  }

  useEffect(load, []);

  async function handleMarkRead(id: number) {
    // Optimistic: the row only changes styling, so a failed request is
    // corrected by the reload below rather than needing a rollback path.
    setItems((prev) => prev?.map((n) => (n.id === id ? { ...n, isRead: true } : n)) ?? prev);
    try {
      await markNotificationRead(id);
    } finally {
      load();
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsRead();
    } finally {
      load();
    }
  }

  const unread = items?.filter((n) => !n.isRead).length ?? 0;

  return (
    <div className="container flex flex-col gap-8 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl tracking-tight">Notifications</h1>
        {unread > 0 && (
          <Button variant="outline" onClick={handleMarkAllRead}>
            Mark all as read
          </Button>
        )}
      </div>

      {error && <ErrorMessage message={error} />}
      {items === null && !error && <Skeleton className="h-40 w-full" />}

      {items?.length === 0 && (
        <p className="text-sm text-muted-foreground">You have no notifications yet.</p>
      )}

      <div className="flex flex-col gap-3">
        {items?.map((notification) => (
          <div
            key={notification.id}
            className={cn(
              'flex flex-col gap-2 rounded-md border p-5',
              notification.isRead ? 'border-border/70 bg-card' : 'border-brand/50 bg-brand/5',
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <p className="text-sm text-foreground">{notification.message}</p>
              {!notification.isRead && (
                <button
                  type="button"
                  onClick={() => handleMarkRead(notification.id)}
                  className="shrink-0 text-xs uppercase tracking-wide text-muted-foreground hover:text-foreground"
                >
                  Mark read
                </button>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{new Date(notification.createdAt).toLocaleString()}</span>
              {notification.orderId && (
                <Link to="/account/orders" className="underline hover:text-foreground">
                  View order #{notification.orderId}
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
