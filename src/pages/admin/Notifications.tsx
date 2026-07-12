import { useEffect, useState } from 'react';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../../api/admin';
import { EmptyState, ErrorMessage } from '../../components/layout/AsyncState';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import type { Notification } from '../../types';

export function Notifications() {
  const [items, setItems] = useState<Notification[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    getNotifications({ page: 1, pageSize: 50 })
      .then((res) => setItems(res.items))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load notifications'));
  }

  useEffect(load, []);

  async function handleRead(id: number) {
    await markNotificationRead(id);
    load();
  }

  async function handleReadAll() {
    await markAllNotificationsRead();
    load();
  }

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <Button variant="outline" onClick={handleReadAll}>
          Mark all read
        </Button>
      </div>

      {error && <ErrorMessage message={error} />}
      {items === null && !error && (
        <div className="space-y-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      )}
      {items !== null && items.length === 0 && <EmptyState message="No notifications." />}

      {items !== null && items.length > 0 && (
        <div className="flex flex-col gap-2">
          {items.map((n) => (
            <div
              key={n.id}
              className="flex items-center justify-between rounded-lg border p-4"
              onClick={() => !n.is_read && handleRead(n.id)}
            >
              <div>
                <p className={n.is_read ? 'text-muted-foreground' : 'font-medium'}>{n.message}</p>
                <p className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</p>
              </div>
              {!n.is_read && <Badge variant="warning">New</Badge>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
