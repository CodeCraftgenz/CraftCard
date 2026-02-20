import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface SocialLink {
  id?: string;
  platform: string;
  label: string;
  url: string;
  order: number;
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
  socialLinks: SocialLink[];
}

export function useProfile() {
  return useQuery<Profile>({
    queryKey: ['profile'],
    queryFn: () => api.get('/me/profile'),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Profile> & { socialLinks?: SocialLink[] }) =>
      api.put('/me/profile', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

export function useUploadPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.post('/me/photo-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
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
      return api.post('/me/resume-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
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
