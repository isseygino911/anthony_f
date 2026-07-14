import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { formatCurrency } from '../../../lib/utils';
import type { AdminAnalyticsData } from '../../../types';

export function RevenueTrendResult({ data }: { data: AdminAnalyticsData }) {
  const series = data.series ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Revenue trend {data.granularity ? `(${data.granularity})` : ''}
          {data.from && data.to ? ` — ${data.from} to ${data.to}` : ''}
        </CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
            <Line type="monotone" dataKey="revenue" stroke="var(--brand-primary)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
