import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface AvailableSlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  duration: number;
}

export interface Booking {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  date: string;
  time: string;
  status: string;
  notes: string | null;
  createdAt: string;
}

export function usePublicSlots(slug: string | undefined) {
  return useQuery<AvailableSlot[]>({
    queryKey: ['public-slots', slug],
    queryFn: () => api.get(`/bookings/slots/${slug}`),
    enabled: !!slug,
  });
}

export function useAvailableTimes(slug: string | undefined, date: string | null) {
  return useQuery<string[]>({
    queryKey: ['available-times', slug, date],
    queryFn: () => api.get(`/bookings/available/${slug}?date=${date}`),
    enabled: !!slug && !!date,
  });
}

export function useCreateBooking() {
  return useMutation({
    mutationFn: ({ slug, data }: { slug: string; data: { name: string; email: string; phone?: string; date: string; time: string; notes?: string } }) =>
      api.post(`/bookings/${slug}`, data),
  });
}

export function useMyBookings() {
  return useQuery<Booking[]>({
    queryKey: ['my-bookings'],
    queryFn: () => api.get('/bookings/me/list'),
  });
}

export function useMySlots() {
  return useQuery<AvailableSlot[]>({
    queryKey: ['my-slots'],
    queryFn: () => api.get('/bookings/me/slots'),
  });
}

export function useSaveSlots() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (slots: Array<{ dayOfWeek: number; startTime: string; endTime: string; duration: number }>) =>
      api.put('/bookings/me/slots', { slots }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-slots'] }),
  });
}

export function useUpdateBookingStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.put(`/bookings/me/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-bookings'] }),
  });
}
