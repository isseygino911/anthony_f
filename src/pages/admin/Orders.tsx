import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminOrders } from "../../api/admin";
import { EmptyState, ErrorMessage } from "../../components/layout/AsyncState";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Skeleton } from "../../components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { formatCurrency } from "../../lib/utils";
import type { OrderStatus, OrderSummary } from "../../types";

const STATUS_OPTIONS: (OrderStatus | "all")[] = [
  "all",
  "pending_payment",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

const STATUS_VARIANT: Record<
  string,
  "default" | "success" | "warning" | "destructive" | "secondary"
> = {
  pending_payment: "warning",
  processing: "default",
  shipped: "default",
  delivered: "success",
  cancelled: "destructive",
  refunded: "secondary",
};

export function Orders() {
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setOrders(null);
    getAdminOrders({
      status: status === "all" ? undefined : (status as OrderStatus),
      search: search || undefined,
      page: 1,
      pageSize: 50,
    })
      .then((res) => setOrders(res.items))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load orders"),
      );
  }, [status, search]);

  return (
    <div className="flex flex-col gap-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold">Orders</h1>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Search orders..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="sm:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {s === "all" ? "All statuses" : s.replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && <ErrorMessage message={error} />}
      {orders === null && !error && (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}
      {orders !== null && orders.length === 0 && (
        <EmptyState message="No orders found." />
      )}
      {orders !== null && orders.length > 0 && (
        <>
          {/* Desktop/tablet: full data table (unchanged). */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">#{order.id}</TableCell>
                    <TableCell>
                      {new Date(order.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[order.status] ?? "default"}>
                        {order.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(order.total)}</TableCell>
                    <TableCell>
                      <Link
                        to={`/admin/orders/${order.id}`}
                        className="text-sm text-brand hover:underline"
                      >
                        View
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile: card list — same data/filters as the table above. */}
          <div className="flex flex-col gap-3 md:hidden">
            {orders.map((order) => (
              <div key={order.id} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">#{order.id}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge
                    variant={STATUS_VARIANT[order.status] ?? "default"}
                    className="shrink-0"
                  >
                    {order.status.replace("_", " ")}
                  </Badge>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="font-medium">{formatCurrency(order.total)}</span>
                  <Button variant="ghost" size="sm" asChild className="shrink-0">
                    <Link to={`/admin/orders/${order.id}`}>View</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
