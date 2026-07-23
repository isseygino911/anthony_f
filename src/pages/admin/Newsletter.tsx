import { useEffect, useState } from 'react';
import { getNewsletterSubscribers, type NewsletterSubscriber } from '../../api/admin';
import { EmptyState, ErrorMessage } from '../../components/layout/AsyncState';
import { Skeleton } from '../../components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';

export function Newsletter() {
  const [items, setItems] = useState<NewsletterSubscriber[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getNewsletterSubscribers({ page: 1, pageSize: 200 })
      .then((res) => {
        setItems(res.items);
        setTotal(res.total);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load subscribers'));
  }, []);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Newsletter</h1>
        {items !== null && <span className="text-sm text-muted-foreground">{total} subscriber{total === 1 ? '' : 's'}</span>}
      </div>
      <p className="text-sm text-muted-foreground">
        Everyone who signed up through the storefront footer. There&apos;s no campaign-sending here yet — this is
        just the list.
      </p>

      {error && <ErrorMessage message={error} />}
      {items === null && !error && <Skeleton className="h-64 w-full" />}
      {items !== null && items.length === 0 && <EmptyState message="No subscribers yet." />}

      {items !== null && items.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Subscribed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((s) => (
              <TableRow key={s.id}>
                <TableCell>{s.email}</TableCell>
                <TableCell>{new Date(s.subscribed_at).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
