import { useGetStatsOverview, useListBookings, useUpdateBookingStatus, getListBookingsQueryKey, getGetStatsOverviewQueryKey } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useUser } from "@clerk/react";
import { motion } from "framer-motion";
import {
  TrendingUp, CheckCircle2, XCircle, CreditCard,
  Users, ArrowRight, CalendarDays,
  BriefcaseMedical, CircleDot, BarChart3, ChevronRight,
} from "lucide-react";

function StatCard({
  label, value, icon, colorClass, bgClass, loading, prefix = "", suffix = "",
}: {
  label: string; value?: number | string; icon: React.ReactNode;
  colorClass: string; bgClass: string; loading: boolean;
  prefix?: string; suffix?: string;
}) {
  return (
    <div className={`rounded-2xl p-6 border border-border/40 shadow-sm ${bgClass} flex flex-col gap-3`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colorClass} shrink-0`}>
        {icon}
      </div>
      {loading ? (
        <Skeleton className="h-9 w-24" />
      ) : (
        <div className="text-3xl font-bold tracking-tight text-foreground">
          {prefix}{value ?? 0}{suffix}
        </div>
      )}
      <div className="text-sm font-medium text-muted-foreground">{label}</div>
    </div>
  );
}

function BookingRow({
  booking, onAccept, onReject, onComplete, onPay, onCancel, isPending,
}: {
  booking: any; onAccept: () => void; onReject: () => void;
  onComplete: () => void; onPay: () => void; onCancel: () => void; isPending: boolean;
}) {
  const statusConfig: Record<string, { label: string; className: string; dot: string }> = {
    pending:   { label: "Pending",   className: "bg-amber-50 text-amber-700 border-amber-200",   dot: "bg-amber-400" },
    confirmed: { label: "Confirmed", className: "bg-green-50 text-green-700 border-green-200",   dot: "bg-green-500" },
    completed: { label: "Completed", className: "bg-blue-50 text-blue-700 border-blue-200",      dot: "bg-blue-500" },
    cancelled: { label: "Cancelled", className: "bg-gray-100 text-gray-500 border-gray-200",     dot: "bg-gray-400" },
  };
  const cfg = statusConfig[booking.status] ?? statusConfig.pending;
  const amount = Math.round((booking.caregiver?.hourlyRate ?? 25) * 8 * 100);

  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-4 py-5 px-1">
      {/* avatar placeholder */}
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
        {(booking.caregiver?.name ?? "?").charAt(0)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="font-semibold text-base truncate">{booking.caregiver?.name ?? "Unknown"}</span>
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.className}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
        </div>
        <div className="text-sm text-muted-foreground truncate">
          {booking.careRequest?.title ?? "Care Service"}
        </div>
        {booking.message && (
          <div className="text-xs text-muted-foreground/70 mt-1 italic truncate">"{booking.message}"</div>
        )}
      </div>

      {/* actions */}
      {booking.status === "pending" && (
        <div className="flex gap-2 shrink-0">
          <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50 border-red-200 h-8 px-3"
            onClick={onReject} disabled={isPending}>
            <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
          </Button>
          <Button size="sm" className="h-8 px-3 bg-green-600 hover:bg-green-700 text-white"
            onClick={onAccept} disabled={isPending}>
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Accept
          </Button>
        </div>
      )}
      {booking.status === "confirmed" && (
        <div className="flex gap-2 shrink-0 flex-wrap">
          <Button size="sm" variant="outline" className="h-8 px-3 text-primary border-primary/30 hover:bg-primary/5"
            onClick={onPay} disabled={isPending}>
            <CreditCard className="w-3.5 h-3.5 mr-1" /> Pay
          </Button>
          <Button size="sm" variant="outline" className="h-8 px-3" onClick={onComplete} disabled={isPending}>
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Done
          </Button>
          <Button size="sm" variant="ghost" className="h-8 px-3 text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={onCancel} disabled={isPending}>
            <XCircle className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { user } = useUser();

  const { data: stats, isLoading: isLoadingStats } = useGetStatsOverview({
    query: { queryKey: getGetStatsOverviewQueryKey() }
  });

  const { data: bookings, isLoading: isLoadingBookings } = useListBookings({}, {
    query: { queryKey: getListBookingsQueryKey() }
  });

  const updateBooking = useUpdateBookingStatus();

  const handleStatusUpdate = (id: number, status: "confirmed" | "cancelled" | "completed") => {
    updateBooking.mutate({ id, data: { status } }, {
      onSuccess: () => {
        toast({ title: "Updated", description: `Booking ${status}.` });
        queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStatsOverviewQueryKey() });
      },
    });
  };

  const inProgress = bookings?.filter(b => b.status === "confirmed") ?? [];
  const upcoming   = bookings?.filter(b => b.status === "pending")   ?? [];
  const completed  = bookings?.filter(b => b.status === "completed") ?? [];

  const estimatedEarnings = completed.reduce((sum, b) => {
    return sum + Math.round((b.caregiver?.hourlyRate ?? 25) * 8);
  }, 0);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const firstName = user?.firstName ?? "there";

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
        >
          <div>
            <p className="text-sm text-muted-foreground font-medium mb-1">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <h1 className="font-serif text-3xl md:text-4xl font-bold">
              {greeting()}, {firstName} 👋
            </h1>
            <p className="text-muted-foreground mt-1">Here's what's happening on Care Bridge today.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/caregivers">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Users className="w-4 h-4" /> Browse Caregivers
              </Button>
            </Link>
            <Link href="/post-request">
              <Button size="sm" className="gap-1.5">
                Post a Request <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* KPI Tiles */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10"
        >
          <StatCard
            label="Estimated Earnings"
            value={estimatedEarnings}
            prefix="$"
            icon={<TrendingUp className="w-5 h-5" />}
            colorClass="bg-primary/15 text-primary"
            bgClass="bg-white"
            loading={isLoadingBookings}
          />
          <StatCard
            label="In Progress"
            value={inProgress.length}
            icon={<CircleDot className="w-5 h-5" />}
            colorClass="bg-green-100 text-green-600"
            bgClass="bg-white"
            loading={isLoadingBookings}
          />
          <StatCard
            label="Upcoming Requests"
            value={upcoming.length}
            icon={<CalendarDays className="w-5 h-5" />}
            colorClass="bg-amber-100 text-amber-600"
            bgClass="bg-white"
            loading={isLoadingBookings}
          />
          <StatCard
            label="Total Caregivers"
            value={stats?.totalCaregivers}
            icon={<BriefcaseMedical className="w-5 h-5" />}
            colorClass="bg-blue-100 text-blue-600"
            bgClass="bg-white"
            loading={isLoadingStats}
          />
        </motion.div>

        {/* Main panels */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid lg:grid-cols-3 gap-6"
        >
          {/* In Progress — 2 cols */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-border/40 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 bg-muted/10">
              <div>
                <h2 className="font-semibold text-base flex items-center gap-2">
                  <CircleDot className="w-4 h-4 text-green-500" />
                  In Progress
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">Confirmed bookings you're managing</p>
              </div>
              {inProgress.length > 0 && (
                <span className="text-xs font-medium bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full">
                  {inProgress.length} active
                </span>
              )}
            </div>

            <div className="divide-y divide-border/30 px-5">
              {isLoadingBookings ? (
                <div className="py-6 space-y-4">
                  {[1, 2].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
                </div>
              ) : inProgress.length === 0 ? (
                <div className="py-14 text-center">
                  <CheckCircle2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm font-medium">No active bookings</p>
                  <p className="text-muted-foreground/70 text-xs mt-1">Accepted bookings will appear here</p>
                </div>
              ) : (
                inProgress.map(booking => (
                  <BookingRow
                    key={booking.id}
                    booking={booking}
                    isPending={updateBooking.isPending}
                    onAccept={() => handleStatusUpdate(booking.id, "confirmed")}
                    onReject={() => handleStatusUpdate(booking.id, "cancelled")}
                    onComplete={() => handleStatusUpdate(booking.id, "completed")}
                    onPay={() => setLocation(`/checkout?bookingId=${booking.id}&amount=${Math.round((booking.caregiver?.hourlyRate ?? 25) * 8 * 100)}&caregiver=${encodeURIComponent(booking.caregiver?.name ?? "")}&service=${encodeURIComponent(booking.careRequest?.title ?? "Care Service")}`)}
                    onCancel={() => setLocation(`/bookings/cancel?bookingId=${booking.id}&caregiver=${encodeURIComponent(booking.caregiver?.name ?? "")}&hours=72`)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-6">
            {/* Upcoming / Pending */}
            <div className="bg-white rounded-2xl border border-border/40 shadow-sm overflow-hidden flex-1">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 bg-muted/10">
                <div>
                  <h2 className="font-semibold text-base flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-amber-500" />
                    Upcoming
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Pending your response</p>
                </div>
                {upcoming.length > 0 && (
                  <span className="text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full">
                    {upcoming.length} new
                  </span>
                )}
              </div>

              <div className="divide-y divide-border/30 px-4">
                {isLoadingBookings ? (
                  <div className="py-5 space-y-3">
                    {[1, 2].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
                  </div>
                ) : upcoming.length === 0 ? (
                  <div className="py-10 text-center">
                    <CalendarDays className="w-9 h-9 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-muted-foreground text-sm">No upcoming requests</p>
                  </div>
                ) : (
                  upcoming.map(booking => (
                    <div key={booking.id} className="py-4 flex flex-col gap-2.5">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 font-bold text-xs shrink-0">
                          {(booking.caregiver?.name ?? "?").charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{booking.caregiver?.name ?? "Caregiver"}</div>
                          <div className="text-xs text-muted-foreground truncate">{booking.careRequest?.title ?? "Care Request"}</div>
                        </div>
                      </div>
                      <div className="flex gap-2 pl-11">
                        <Button size="sm" variant="outline"
                          className="h-7 text-xs px-2.5 text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => handleStatusUpdate(booking.id, "cancelled")}
                          disabled={updateBooking.isPending}>
                          Decline
                        </Button>
                        <Button size="sm"
                          className="h-7 text-xs px-2.5 bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleStatusUpdate(booking.id, "confirmed")}
                          disabled={updateBooking.isPending}>
                          Accept
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick stats */}
            <div className="bg-white rounded-2xl border border-border/40 shadow-sm p-5">
              <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" /> Platform Snapshot
              </h2>
              <div className="space-y-3">
                {[
                  { label: "Total Care Requests", value: stats?.totalCareRequests, loading: isLoadingStats },
                  { label: "Open Jobs",           value: stats?.openRequests,       loading: isLoadingStats },
                  { label: "Total Bookings",      value: stats?.totalBookings,       loading: isLoadingStats },
                  { label: "Completed",           value: completed.length,           loading: isLoadingBookings },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    {item.loading ? (
                      <Skeleton className="h-4 w-8" />
                    ) : (
                      <span className="font-semibold tabular-nums">{item.value ?? 0}</span>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-border/30">
                <Link href="/payments/history" className="flex items-center gap-1.5 text-xs text-primary font-medium hover:underline">
                  View payment history <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
