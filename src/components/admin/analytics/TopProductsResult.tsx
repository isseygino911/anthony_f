import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { formatCurrency } from '../../../lib/utils';
import type { AdminAnalyticsData } from '../../../types';

export function TopProductsResult({ data }: { data: AdminAnalyticsData }) {
  const items = data.items ?? [];
  const metric = data.metric ?? 'units';
  const dataKey = metric === 'revenue' ? 'revenue' : 'unitsSold';

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Top products by {metric}
          {data.from && data.to ? ` — ${data.from} to ${data.to}` : ''}
        </CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={items}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" fontSize={12} interval={0} angle={-15} textAnchor="end" height={50} />
            <YAxis fontSize={12} />
            <Tooltip formatter={(value) => (metric === 'revenue' ? formatCurrency(Number(value ?? 0)) : value)} />
            <Bar dataKey={dataKey} fill="var(--brand-secondary)" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
