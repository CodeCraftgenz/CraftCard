import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Achievement {
  type: string;
  label: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt: string | null;
}

export function useAchievements() {
  return useQuery<Achievement[]>({
    queryKey: ['achievements'],
    queryFn: () => api.get('/analytics/achievements'),
  });
}

export function useCheckAchievements() {
  const qc = useQueryClient();
  return useMutation<{ newAchievements: string[] }>({
    mutationFn: () => api.post('/analytics/achievements/check'),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['achievements'] }); },
  });
}
