import { RevenueTrendResult } from './RevenueTrendResult';
import { SalesProjectionResult } from './SalesProjectionResult';
import { TopProductsResult } from './TopProductsResult';
import type { AdminAnalyticsResult } from '../../../types';

export function AnalyticsResult({ result }: { result: AdminAnalyticsResult }) {
  if (!result.data) return null;

  switch (result.intent) {
    case 'revenue_trend':
      return <RevenueTrendResult data={result.data} />;
    case 'top_products':
      return <TopProductsResult data={result.data} />;
    case 'sales_projection':
      return <SalesProjectionResult data={result.data} />;
    default:
      return null;
  }
}
