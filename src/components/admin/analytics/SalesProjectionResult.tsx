import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { EmptyState } from '../../layout/AsyncState';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { formatCurrency } from '../../../lib/utils';
import type { AdminAnalyticsData } from '../../../types';

export function SalesProjectionResult({ data }: { data: AdminAnalyticsData }) {
  if (data.insufficientData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sales projection</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState message="Not enough historical data yet to build a reliable projection." />
        </CardContent>
      </Card>
    );
  }

  const history = data.history ?? [];
  const projection = data.projection ?? [];

  // Bridge the two lines at the last historical point so the dashed
  // projection visually continues from where the solid history line ends.
  const chartData = [
    ...history.map((point, i) => ({
      period: point.period,
      revenue: point.revenue,
      projectedRevenue: i === history.length - 1 ? point.revenue : undefined,
    })),
    ...projection.map((point) => ({
      period: point.period,
      revenue: undefined,
      projectedRevenue: point.projectedRevenue,
    })),
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales projection</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
            <Line
              type="monotone"
              dataKey="revenue"
              name="Actual"
              stroke="var(--brand-primary)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="projectedRevenue"
              name="Projected"
              stroke="var(--brand-secondary)"
              strokeWidth={2}
              strokeDasharray="6 6"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
