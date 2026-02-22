import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface DailyView {
  date: string;
  count: number;
}

interface LinkClickStat {
  label: string;
  platform: string;
  totalClicks: number;
}

interface AnalyticsData {
  totalViews: number;
  dailyViews: DailyView[];
  linkClicks: LinkClickStat[];
}

export function useAnalytics(enabled: boolean) {
  return useQuery<AnalyticsData>({
    queryKey: ['analytics'],
    queryFn: () => api.get('/analytics/me'),
    enabled,
    refetchInterval: 60_000, // refresh every minute
  });
}

/** Fire-and-forget click tracking */
export function trackLinkClick(socialLinkId: string) {
  api.post('/analytics/click', { socialLinkId }).catch(() => {});
}
