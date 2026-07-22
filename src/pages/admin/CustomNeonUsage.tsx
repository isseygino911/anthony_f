import { useEffect, useState } from 'react';
import { getAdminCustomNeonUsage } from '../../api/admin';
import { EmptyState, ErrorMessage } from '../../components/layout/AsyncState';
import { Skeleton } from '../../components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import type { CustomNeonUsageRow } from '../../types';

export function CustomNeonUsage() {
  const [rows, setRows] = useState<CustomNeonUsageRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAdminCustomNeonUsage({ pageSize: 100 })
      .then((res) => setRows(res.items))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load usage'));
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Custom Neon Usage</h1>
        <p className="text-sm text-muted-foreground">
          Generation activity per account — 2 AI previews per user per minute are allowed.
        </p>
      </div>

      {error && <ErrorMessage message={error} />}

      {rows === null && !error && (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}

      {rows !== null && rows.length === 0 && <EmptyState message="No one has generated a custom neon design yet." />}

      {rows !== null && rows.length > 0 && (
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Designs generated</TableHead>
                <TableHead>Confirmed into orders</TableHead>
                <TableHead>Last generated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.userId}>
                  <TableCell className="font-medium">
                    {row.userName ?? row.userEmail ?? `User #${row.userId}`}
                    {row.userName && row.userEmail && (
                      <span className="block text-xs font-normal text-muted-foreground">{row.userEmail}</span>
                    )}
                  </TableCell>
                  <TableCell>{row.designCount}</TableCell>
                  <TableCell>{row.confirmedCount}</TableCell>
                  <TableCell>{new Date(row.lastGeneratedAt).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {rows !== null && rows.length > 0 && (
        <div className="flex flex-col gap-3 md:hidden">
          {rows.map((row) => (
            <div key={row.userId} className="rounded-lg border p-3">
              <p className="font-medium">{row.userName ?? row.userEmail ?? `User #${row.userId}`}</p>
              {row.userName && row.userEmail && <p className="text-xs text-muted-foreground">{row.userEmail}</p>}
              <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                <span>{row.designCount} generated</span>
                <span>{row.confirmedCount} confirmed</span>
                <span>Last: {new Date(row.lastGeneratedAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
