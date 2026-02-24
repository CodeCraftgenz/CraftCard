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
  deviceBreakdown?: Record<string, number>;
  referrerBreakdown?: Array<{ source: string; count: number }>;
  conversionFunnel?: { views: number; clicks: number; messages: number; bookings: number };
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

/** Fire-and-forget view event tracking with UTM params */
export function trackViewEvent(profileId: string) {
  const params = new URLSearchParams(window.location.search);
  api.post('/analytics/view', {
    profileId,
    utmSource: params.get('utm_source') || undefined,
    utmMedium: params.get('utm_medium') || undefined,
    utmCampaign: params.get('utm_campaign') || undefined,
  }).catch(() => {});
}
