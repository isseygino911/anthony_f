import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getRevenue } from "../../api/admin";
import { ErrorMessage } from "../../components/layout/AsyncState";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Skeleton } from "../../components/ui/skeleton";
import { formatCurrency } from "../../lib/utils";
import type { RevenuePoint } from "../../types";

export function Dashboard() {
  const [granularity, setGranularity] = useState<"daily" | "monthly">("daily");
  const [series, setSeries] = useState<RevenuePoint[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSeries(null);
    getRevenue({ granularity })
      .then((res) => setSeries(res.series))
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : "Failed to load revenue data",
        ),
      );
  }, [granularity]);

  const totalRevenue = series?.reduce((sum, p) => sum + p.revenue, 0) ?? 0;
  const totalOrders = series?.reduce((sum, p) => sum + p.orderCount, 0) ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between ">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <Select
          value={granularity}
          onValueChange={(v) => setGranularity(v as "daily" | "monthly")}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && <ErrorMessage message={error} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Total revenue</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold text-brand">
            {formatCurrency(totalRevenue)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total orders</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">
            {totalOrders}
          </CardContent>
        </Card>
      </div>

      {series === null && !error && <Skeleton className="h-72 w-full" />}

      {series !== null && (
        <Card>
          <CardHeader>
            <CardTitle>Revenue over time</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value ?? 0))}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--brand-primary)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {series !== null && (
        <Card>
          <CardHeader>
            <CardTitle>Order count over time</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" fontSize={12} />
                <YAxis fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="orderCount" fill="var(--brand-secondary)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
