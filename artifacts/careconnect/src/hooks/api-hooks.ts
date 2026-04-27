import { useMutation, useQuery } from "@tanstack/react-query";
import { apiUrl } from "@/lib/api";

// ── Fetch wrapper ──────────────────────────────────────────────────────────
async function customFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(apiUrl(url), {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

// ── Query key helpers ──────────────────────────────────────────────────────
export const getHealthCheckQueryKey = () => ["/api/healthz"];
export const getListCategoriesQueryKey = () => ["/api/categories"];
export const getListCaregiversQueryKey = (params?: any) => ["/api/caregivers", params];
export const getGetCaregiverQueryKey = (id: number) => [`/api/caregivers/${id}`];
export const getListCareRequestsQueryKey = (params?: any) => ["/api/care-requests", params];
export const getGetCareRequestQueryKey = (id: number) => [`/api/care-requests/${id}`];
export const getListBookingsQueryKey = (params?: any) => ["/api/bookings", params];
export const getListReviewsQueryKey = (params?: any) => ["/api/reviews", params];
export const getGetStatsOverviewQueryKey = () => ["/api/stats/overview"];
export const getGetFeaturedCaregiversQueryKey = () => ["/api/stats/featured-caregivers"];
export const getGetRecentCareRequestsQueryKey = () => ["/api/stats/recent-requests"];
export const getGetProviderEarningsQueryKey = (params?: any) => ["/api/stats/provider-earnings", params];
export const getAdminListCaregiversQueryKey = () => ["/api/admin/caregivers"];
export const getListConversationsQueryKey = (params?: any) => ["/api/conversations", params];
export const getListMessagesQueryKey = (id: number) => [`/api/conversations/${id}/messages`];

// ── Health ─────────────────────────────────────────────────────────────────
export function useHealthCheck() {
  return useQuery({
    queryKey: getHealthCheckQueryKey(),
    queryFn: () => customFetch("/api/healthz"),
  });
}

// ── Categories ─────────────────────────────────────────────────────────────
export function useListCategories() {
  return useQuery({
    queryKey: getListCategoriesQueryKey(),
    queryFn: () => customFetch("/api/categories"),
  });
}

// ── Caregivers ─────────────────────────────────────────────────────────────
export function useListCaregivers(params?: any) {
  return useQuery({
    queryKey: getListCaregiversQueryKey(params),
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) searchParams.set(key, String(value));
        });
      }
      const query = searchParams.toString();
      return customFetch(`/api/caregivers${query ? `?${query}` : ""}`);
    },
  });
}

export function useGetCaregiver(id: number, options?: { query?: { enabled?: boolean; queryKey?: any[] } }) {
  return useQuery({
    queryKey: getGetCaregiverQueryKey(id),
    queryFn: () => customFetch(`/api/caregivers/${id}`),
    enabled: !!id && options?.query?.enabled !== false,
  });
}

export function useCreateCaregiver() {
  return useMutation({
    mutationFn: (payload: { data: any }) =>
      customFetch("/api/caregivers", {
        method: "POST",
        body: JSON.stringify(payload.data),
      }),
  });
}

// ── Care Requests ──────────────────────────────────────────────────────────
export function useListCareRequests(params?: any) {
  return useQuery({
    queryKey: getListCareRequestsQueryKey(params),
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) searchParams.set(key, String(value));
        });
      }
      const query = searchParams.toString();
      return customFetch(`/api/care-requests${query ? `?${query}` : ""}`);
    },
  });
}

export function useGetCareRequest(id: number, options?: { query?: { enabled?: boolean; queryKey?: any[] } }) {
  return useQuery({
    queryKey: getGetCareRequestQueryKey(id),
    queryFn: () => customFetch(`/api/care-requests/${id}`),
    enabled: !!id && options?.query?.enabled !== false,
  });
}

export function useCreateCareRequest() {
  return useMutation({
    mutationFn: (payload: { data: any }) =>
      customFetch("/api/care-requests", {
        method: "POST",
        body: JSON.stringify(payload.data),
      }),
  });
}

// ── Bookings ───────────────────────────────────────────────────────────────
export function useListBookings(params?: any, options?: { query?: { queryKey?: any[] } }) {
  return useQuery({
    queryKey: getListBookingsQueryKey(params),
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) searchParams.set(key, String(value));
        });
      }
      const query = searchParams.toString();
      return customFetch(`/api/bookings${query ? `?${query}` : ""}`);
    },
  });
}

export function useCreateBooking() {
  return useMutation({
    mutationFn: (payload: { data: any }) =>
      customFetch("/api/bookings", {
        method: "POST",
        body: JSON.stringify(payload.data),
      }),
  });
}

export function useUpdateBookingStatus() {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      customFetch(`/api/bookings/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  });
}

// ── Reviews ────────────────────────────────────────────────────────────────
export function useListReviews(params?: { caregiverId?: number; status?: string }, options?: { query?: { queryKey?: any[] } }) {
  return useQuery({
    queryKey: getListReviewsQueryKey(params),
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (params?.caregiverId) searchParams.set("caregiverId", params.caregiverId.toString());
      if (params?.status) searchParams.set("status", params.status);
      const query = searchParams.toString();
      return customFetch(`/api/reviews${query ? `?${query}` : ""}`);
    },
  });
}

export function useCreateReview() {
  return useMutation({
    mutationFn: (payload: { data: any }) =>
      customFetch("/api/reviews", {
        method: "POST",
        body: JSON.stringify(payload.data),
      }),
  });
}

export function useUpdateReviewStatus() {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      customFetch(`/api/reviews/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  });
}

// ── Stats ──────────────────────────────────────────────────────────────────
export function useGetStatsOverview(options?: { query?: { queryKey?: any[] } }) {
  return useQuery({
    queryKey: getGetStatsOverviewQueryKey(),
    queryFn: () => customFetch("/api/stats/overview"),
  });
}

export function useGetFeaturedCaregivers() {
  return useQuery({
    queryKey: getGetFeaturedCaregiversQueryKey(),
    queryFn: () => customFetch("/api/stats/featured-caregivers"),
  });
}

export function useGetRecentCareRequests() {
  return useQuery({
    queryKey: getGetRecentCareRequestsQueryKey(),
    queryFn: () => customFetch("/api/stats/recent-requests"),
  });
}

export function useGetProviderEarnings(params: { clerkId?: string }, options?: { query?: { queryKey?: any[] } }) {
  return useQuery({
    queryKey: getGetProviderEarningsQueryKey(params),
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (params?.clerkId) searchParams.set("clerkId", params.clerkId);
      const query = searchParams.toString();
      return customFetch(`/api/stats/provider-earnings${query ? `?${query}` : ""}`);
    },
    enabled: !!params?.clerkId,
  });
}

// ── Admin ──────────────────────────────────────────────────────────────────
export function useAdminListCaregivers(options?: { query?: { queryKey?: any[] } }) {
  return useQuery({
    queryKey: getAdminListCaregiversQueryKey(),
    queryFn: () => customFetch("/api/admin/caregivers"),
  });
}

export function useAdminApproveCaregiver() {
  return useMutation({
    mutationFn: ({ id }: { id: number }) =>
      customFetch(`/api/admin/caregivers/${id}/approve`, { method: "PATCH" }),
  });
}

export function useAdminRejectCaregiver() {
  return useMutation({
    mutationFn: ({ id }: { id: number }) =>
      customFetch(`/api/admin/caregivers/${id}/reject`, { method: "PATCH" }),
  });
}

// ── Conversations ──────────────────────────────────────────────────────────
export function useListConversations(params: { clerkId?: string }, options?: { query?: { queryKey?: any[] } }) {
  return useQuery({
    queryKey: getListConversationsQueryKey(params),
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (params?.clerkId) searchParams.set("clerkId", params.clerkId);
      const query = searchParams.toString();
      return customFetch(`/api/conversations${query ? `?${query}` : ""}`);
    },
    enabled: !!params?.clerkId,
  });
}

export function useCreateConversation() {
  return useMutation({
    mutationFn: (payload: { data: any }) =>
      customFetch("/api/conversations", {
        method: "POST",
        body: JSON.stringify(payload.data),
      }),
  });
}

// ── Messages ───────────────────────────────────────────────────────────────
export function useListMessages(id: number, options?: { query?: { enabled?: boolean; queryKey?: any[] } }) {
  return useQuery({
    queryKey: getListMessagesQueryKey(id),
    queryFn: () => customFetch(`/api/conversations/${id}/messages`),
    enabled: !!id && options?.query?.enabled !== false,
  });
}

export function useSendMessage() {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      customFetch(`/api/conversations/${id}/messages`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}
