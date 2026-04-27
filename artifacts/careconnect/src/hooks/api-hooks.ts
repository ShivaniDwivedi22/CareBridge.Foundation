import { useMutation, useQuery } from "@tanstack/react-query";
import type {
  MutationFunction,
  QueryFunction,
  QueryKey,
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
  UseQueryResult,
} from "@tanstack/react-query";

// ✅ Use your existing apiUrl helper
import { apiUrl } from "@/lib/api";

// ✅ Simple fetch wrapper
async function customFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(apiUrl(url), {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

// ✅ Copy all the hooks you actually use
export function useListCategories() {
  return useQuery({
    queryKey: ['/api/categories'],
    queryFn: () => customFetch('/api/categories'),
  });
}

export function useListCaregivers(params?: { minRating?: number }) {
  return useQuery({
    queryKey: ['/api/caregivers', params],
    queryFn: () => {
      const url = params ? `/api/caregivers?minRating=${params.minRating}` : '/api/caregivers';
      return customFetch(url);
    },
  });
}

export function useListCareRequests(params?: { status?: string }) {
  return useQuery({
    queryKey: ['/api/care-requests', params],
    queryFn: () => {
      const url = params ? `/api/care-requests?status=${params.status}` : '/api/care-requests';
      return customFetch(url);
    },
  });
}

export function useGetCaregiver(id: number, options?: { query?: { enabled?: boolean; queryKey?: any[] } }) {
  return useQuery({
    queryKey: [`/api/caregivers/${id}`],
    queryFn: () => customFetch(`/api/caregivers/${id}`),
    enabled: !!id && (options?.query?.enabled !== false),
  });
}

export function useCreateCaregiver() {
  return useMutation({
    mutationFn: (data: { data: any }) => customFetch('/api/caregivers', {
      method: 'POST',
      body: JSON.stringify(data.data),
    }),
  });
}

export function useCreateCareRequest() {
  return useMutation({
    mutationFn: (data: { data: any }) => customFetch('/api/care-requests', {
      method: 'POST',
      body: JSON.stringify(data.data),
    }),
  });
}

export function useCreateBooking() {
  return useMutation({
    mutationFn: (data: { data: any }) => customFetch('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(data.data),
    }),
  });
}

export function useListBookings(params?: any, options?: { query?: { queryKey?: any[] } }) {
  return useQuery({
    queryKey: ['/api/bookings', params],
    queryFn: () => customFetch('/api/bookings'),
  });
}

export function useUpdateBookingStatus() {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => customFetch(`/api/bookings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  });
}

export function useGetStatsOverview(options?: { query?: { queryKey?: any[] } }) {
  return useQuery({
    queryKey: ['/api/stats/overview'],
    queryFn: () => customFetch('/api/stats/overview'),
  });
}

export function useListReviews(params?: { caregiverId?: number; status?: string }, options?: { query?: { queryKey?: any[] } }) {
  return useQuery({
    queryKey: ['/api/reviews', params],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (params?.caregiverId) searchParams.set('caregiverId', params.caregiverId.toString());
      if (params?.status) searchParams.set('status', params.status);
      const query = searchParams.toString();
      return customFetch(`/api/reviews${query ? `?${query}` : ''}`);
    },
  });
}

export function useCreateReview() {
  return useMutation({
    mutationFn: (data: { data: any }) => customFetch('/api/reviews', {
      method: 'POST',
      body: JSON.stringify(data.data),
    }),
  });
}

export function useUpdateReviewStatus() {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => customFetch(`/api/reviews/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  });
}

export function useAdminListCaregivers(options?: { query?: { queryKey?: any[] } }) {
  return useQuery({
    queryKey: ['/api/admin/caregivers'],
    queryFn: () => customFetch('/api/admin/caregivers'),
  });
}

export function useAdminApproveCaregiver() {
  return useMutation({
    mutationFn: ({ id }: { id: number }) => customFetch(`/api/admin/caregivers/${id}/approve`, {
      method: 'PATCH',
    }),
  });
}

export function useAdminRejectCaregiver() {
  return useMutation({
    mutationFn: ({ id }: { id: number }) => customFetch(`/api/admin/caregivers/${id}/reject`, {
      method: 'PATCH',
    }),
  });
}

export function useGetCareRequest(id: number, options?: { query?: { enabled?: boolean; queryKey?: any[] } }) {
  return useQuery({
    queryKey: [`/api/care-requests/${id}`],
    queryFn: () => customFetch(`/api/care-requests/${id}`),
    enabled: !!id && (options?.query?.enabled !== false),
  });
}
export const getGetCareRequestQueryKey = (id: number) => [`/api/care-requests/${id}`];

// ✅ Query key helpers for cache invalidation
export const getListBookingsQueryKey = () => ['/api/bookings'];
export const getGetStatsOverviewQueryKey = () => ['/api/stats/overview'];
export const getListReviewsQueryKey = (params?: any) => ['/api/reviews', params];
export const getAdminListCaregiversQueryKey = () => ['/api/admin/caregivers'];
export const getGetCaregiverQueryKey = (id: number) => [`/api/caregivers/${id}`];
export const getListCareRequestsQueryKey = (params?: any) => ['/api/care-requests', params];
export const getListCaregiversQueryKey = (params?: any) => ['/api/caregivers', params];
export const getListConversationsQueryKey = (params?: any) => ['/api/conversations', params];
export const getListMessagesQueryKey = (id: number) => [`/api/conversations/${id}/messages`];

