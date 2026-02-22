import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface SocialLink {
  id?: string;
  platform: string;
  label: string;
  url: string;
  order: number;
  startsAt?: string | null;
  endsAt?: string | null;
}

export interface Profile {
  id: string;
  displayName: string;
  bio: string | null;
  photoUrl: string | null;
  resumeUrl: string | null;
  resumeType: string | null;
  buttonColor: string;
  slug: string;
  isPublished: boolean;
  viewCount: number;
  cardTheme: string;
  coverPhotoUrl: string | null;
  photoPositionY: number;
  coverPositionY: number;
  availabilityStatus: string | null;
  availabilityMessage: string | null;
  videoUrl: string | null;
  leadCaptureEnabled: boolean;
  bookingEnabled: boolean;
  socialLinks: SocialLink[];
}

export function useProfile(cardId?: string) {
  const params = cardId ? `?cardId=${cardId}` : '';
  return useQuery<Profile>({
    queryKey: ['profile', cardId || 'primary'],
    queryFn: () => api.get(`/me/profile${params}`),
  });
}

export function useUpdateProfile(cardId?: string) {
  const queryClient = useQueryClient();
  const params = cardId ? `?cardId=${cardId}` : '';

  return useMutation({
    mutationFn: (data: Partial<Profile> & { socialLinks?: SocialLink[] }) =>
      api.put(`/me/profile${params}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      queryClient.invalidateQueries({ queryKey: ['cards'] });
    },
  });
}

export function useCards() {
  return useQuery<Array<{ id: string; label: string; slug: string; isPrimary: boolean; displayName: string }>>({
    queryKey: ['cards'],
    queryFn: () => api.get('/me/cards'),
  });
}

export function useCreateCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (label: string) => api.post('/me/cards', { label }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

export function useDeleteCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/me/cards/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

export function useSetPrimaryCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.put(`/me/cards/${id}/primary`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useUploadPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.post('/me/photo-upload', formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useUploadCover() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.post('/me/cover-upload', formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useUploadResume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.post('/me/resume-upload', formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useUploadVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.post('/me/video-upload', formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useCheckSlug(slug: string, enabled: boolean) {
  return useQuery<{ slug: string; available: boolean }>({
    queryKey: ['slug-check', slug],
    queryFn: () => api.get(`/slug/check/${slug}`),
    enabled: enabled && slug.length >= 3,
  });
}
