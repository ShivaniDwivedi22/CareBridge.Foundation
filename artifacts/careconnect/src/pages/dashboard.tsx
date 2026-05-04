//import {useGetStatsOverview, useListBookings, useUpdateBookingStatus, getListBookingsQueryKey, getGetStatsOverviewQueryKey,} from "@/hooks/api-hooks";
import {useGetStatsOverview, useListBookings, useUpdateBookingStatus, getListBookingsQueryKey, getGetStatsOverviewQueryKey,} from "@/hooks/api-hooks";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useUser } from "@clerk/react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { apiUrl } from "@/lib/api";
import {
  CheckCircle2, XCircle, CreditCard, ArrowRight, CalendarDays,
  Star, CircleDot, BarChart3, ChevronRight, Lock, Phone,
  MessageCircle, HeartHandshake, Search, Filter, ChevronDown,
} from "lucide-react";

// ── Journey steps ─────────────────────────────────────────────────────────────
const JOURNEY = ["Request", "Accepted", "Pay", "Contact", "Service", "Review"];

function journeyStep(status: string, isPaid: boolean): number {
  if (status === "pending") return 0;
  if (status === "confirmed" && !isPaid) return 2;
  if (status === "confirmed" && isPaid) return 3;
  if (status === "completed") return 5;
  return 0;
}

function MiniJourney({ status, isPaid }: { status: string; isPaid: boolean }) {
  const current = journeyStep(status, isPaid);
  if (status === "cancelled") return null;
  return (
    <div className="flex items-center gap-0.5 mt-2">
      {JOURNEY.map((label, i) => (
        <div key={i} className="flex items-center gap-0.5">
          <div
            className={`h-1.5 w-6 rounded-full transition-all ${i <= current ? "bg-primary" : "bg-muted-foreground/20"}`}
            title={label}
          />
        </div>
      ))}
      <span className="ml-2 text-xs text-muted-foreground">{JOURNEY[current]}</span>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({
  label, value, icon, colorClass, bgClass, loading,
  prefix = "", suffix = "", onClick, isActive,
}: {
  label: string; value?: number | string; icon: React.ReactNode;
  colorClass: string; bgClass: string; loading: boolean;
  prefix?: string; suffix?: string;
  onClick?: () => void; isActive?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl p-5 border shadow-sm flex flex-col gap-3 transition-all
        ${bgClass}
        ${onClick ? "cursor-pointer hover:shadow-md" : ""}
        ${isActive ? "border-primary ring-2 ring-primary/20 bg-primary/5" : "border-border/40"}
      `}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass} shrink-0`}>
        {icon}
      </div>
      {loading
        ? <Skeleton className="h-8 w-20" />
        : <div className="text-2xl font-bold tracking-tight text-foreground">{prefix}{value ?? 0}{suffix}</div>
      }
      <div className={`text-xs font-medium uppercase tracking-wider ${isActive ? "text-primary" : "text-muted-foreground"}`}>
        {label}{onClick && !isActive ? <span className="normal-case text-muted-foreground/50 ml-1">↗</span> : ""}
      </div>
    </div>
  );
}

// ── Booking detail drawer ─────────────────────────────────────────────────────
// ✅ NEW: clicking a booking row expands full details inline
function BookingDetail({ booking, isPaid, isProviderView, onClose }: {
  booking: any; isPaid: boolean; isProviderView: boolean; onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25 }}
      className="overflow-hidden"
    >
      <div className="mx-1 mb-3 rounded-xl bg-muted/30 border border-border/40 p-4 text-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-base">{booking.careRequest?.title ?? "Care Service"}</span>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg leading-none">×</button>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div><span className="font-medium text-foreground">Caregiver:</span> {booking.caregiver?.name ?? "—"}</div>
          <div><span className="font-medium text-foreground">Rate:</span> ${booking.caregiver?.hourlyRate ?? "?"}/hr</div>
          <div><span className="font-medium text-foreground">Status:</span> {booking.status}</div>
          <div><span className="font-medium text-foreground">Paid:</span> {isPaid ? "Yes ✅" : "No"}</div>
          {booking.startDate && (
            <div className="col-span-2">
              <span className="font-medium text-foreground">Start Date:</span>{" "}
              {new Date(booking.startDate).toLocaleDateString()}
            </div>
          )}
          {booking.message && (
            <div className="col-span-2 italic text-muted-foreground/70">"{booking.message}"</div>
          )}
        </div>
        {isPaid && booking.caregiver?.phone && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs text-green-800">
            <Phone className="w-3.5 h-3.5 text-green-600 shrink-0" />
            Contact unlocked: <strong className="ml-1">{booking.caregiver.phone}</strong>
          </div>
        )}
        {!isPaid && !isProviderView && booking.status === "confirmed" && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
            <Lock className="w-3 h-3 shrink-0" />
            Pay to unlock caregiver contact details
          </div>
        )}
        <MiniJourney status={booking.status} isPaid={isPaid} />
      </div>
    </motion.div>
  );
}

// ── Booking row ───────────────────────────────────────────────────────────────
// ✅ Fixed: clicking anywhere on the row expands full booking details
function BookingRow({
  booking, onAccept, onReject, onComplete, onPay, onCancel,
  isPending, isPaid, isProviderView,
}: {
  booking: any; onAccept: () => void; onReject: () => void;
  onComplete: () => void; onPay: () => void; onCancel: () => void;
  isPending: boolean; isPaid: boolean; isProviderView?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  const statusConfig: Record<string, { label: string; className: string; dot: string }> = {
    pending:   { label: "Awaiting response", className: "bg-amber-50 text-amber-700 border-amber-200",  dot: "bg-amber-400" },
    confirmed: { label: "Confirmed",         className: "bg-green-50 text-green-700 border-green-200",  dot: "bg-green-500" },
    completed: { label: "Completed",         className: "bg-blue-50 text-blue-700 border-blue-200",     dot: "bg-blue-500" },
    cancelled: { label: "Cancelled",         className: "bg-gray-100 text-gray-500 border-gray-200",    dot: "bg-gray-400" },
  };
  const cfg = statusConfig[booking.status] ?? statusConfig.pending;

  return (
    <div className="py-3 px-1">
      {/* ✅ Clickable header row — expands details */}
      <div
        className="flex flex-col sm:flex-row sm:items-start gap-3 cursor-pointer group"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
          {(booking.caregiver?.name ?? "?").charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <span className="font-semibold text-sm truncate">{booking.caregiver?.name ?? "Unknown"}</span>
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.className}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {booking.careRequest?.title ?? "Care Service"} · ${booking.caregiver?.hourlyRate ?? "?"}/hr
          </div>
          <MiniJourney status={booking.status} isPaid={isPaid} />
        </div>
        <div className="flex gap-2 shrink-0 flex-wrap items-center" onClick={e => e.stopPropagation()}>
          {booking.status === "pending" && (
            <>
              <Button size="sm" variant="outline"
                className="text-red-600 hover:bg-red-50 border-red-200 h-8 px-3 text-xs"
                onClick={onReject} disabled={isPending}>
                <XCircle className="w-3 h-3 mr-1" /> Decline
              </Button>
              <Button size="sm" className="h-8 px-3 text-xs bg-green-600 hover:bg-green-700 text-white"
                onClick={onAccept} disabled={isPending}>
                <CheckCircle2 className="w-3 h-3 mr-1" /> Accept
              </Button>
            </>
          )}
          {booking.status === "confirmed" && !isPaid && !isProviderView && (
            <>
              <Button size="sm" className="h-8 px-3 text-xs" onClick={onPay} disabled={isPending}>
                <CreditCard className="w-3 h-3 mr-1" /> Pay Now
              </Button>
              <Button size="sm" variant="ghost"
                className="h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={onCancel} disabled={isPending}>
                <XCircle className="w-3.5 h-3.5" />
              </Button>
            </>
          )}
          {booking.status === "confirmed" && isPaid && (
            <Button size="sm" variant="outline" className="h-8 px-3 text-xs"
              onClick={onComplete} disabled={isPending}>
              <CheckCircle2 className="w-3 h-3 mr-1" /> Mark Done
            </Button>
          )}
          {booking.status === "completed" && (
            <Link href={`/caregivers/${booking.caregiverId}`}>
              <Button size="sm" variant="ghost"
                className="h-8 px-3 text-xs text-amber-600 hover:bg-amber-50">
                <Star className="w-3 h-3 mr-1" /> Review
              </Button>
            </Link>
          )}
          <ChevronDown
            className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </div>
      </div>

      {/* ✅ Expandable detail panel */}
      <AnimatePresence>
        {expanded && (
          <BookingDetail
            booking={booking}
            isPaid={isPaid}
            isProviderView={!!isProviderView}
            onClose={() => setExpanded(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ icon, title, desc, cta }: {
  icon: React.ReactNode; title: string; desc: string; cta?: React.ReactNode;
}) {
  return (
    <div className="py-12 text-center">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3 text-muted-foreground/40">
        {icon}
      </div>
      <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
      <p className="text-xs text-muted-foreground/70 mb-4">{desc}</p>
      {cta}
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const [paidBookingIds, setPaidBookingIds] = useState<Set<number>>(new Set());
  const [dashMode, setDashMode] = useState<"seeker" | "provider">("seeker");
  const [focusStatus, setFocusStatus] = useState<string | null>(null);
  const [providerBookings, setProviderBookings] = useState<any[]>([]);
  const [loadingProvider, setLoadingProvider] = useState(false);

  const { data: stats, isLoading: isLoadingStats } = useGetStatsOverview({
    query: { queryKey: getGetStatsOverviewQueryKey() },
  });
  const { data: allBookings, isLoading: isLoadingBookings } = useListBookings({}, {
    query: { queryKey: getListBookingsQueryKey() },
  });
  const updateBooking = useUpdateBookingStatus();

  useEffect(() => {
    if (!user?.id) return;
    setLoadingProvider(true);
    fetch(apiUrl(`/api/bookings?providerClerkId=${encodeURIComponent(user.id)}`))
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setProviderBookings(data); })
      .catch(() => {})
      .finally(() => setLoadingProvider(false));
  }, [user?.id, allBookings]);

  useEffect(() => {
    const url = user?.id
      ? apiUrl(`/api/payments/history?clerkId=${user.id}`)
      : apiUrl("/api/payments/history");
    fetch(url)
      .then(r => r.json())
      .then((payments: any[]) => {
        if (!Array.isArray(payments)) return;
        const paid = new Set(
          payments.filter(p => p.status === "succeeded").map(p => Number(p.bookingId))
        );
        setPaidBookingIds(paid);
      })
      .catch(() => {});
  }, [user?.id, allBookings]);

  const handleStatusUpdate = (id: number, status: "confirmed" | "cancelled" | "completed") => {
    updateBooking.mutate({ id, data: { status } }, {
      onSuccess: () => {
        toast({ title: "Updated", description: `Booking ${status}.` });
        queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStatsOverviewQueryKey() });
      },
      onError: () => toast({ title: "Failed to update booking", variant: "destructive" }),
    });
  };

  const seekerBookings = allBookings?.filter(b => !user?.id || b.seekerClerkId === user.id) ?? [];
  const bookings = dashMode === "seeker" ? seekerBookings : providerBookings;
  const isLoadingCurrentBookings = dashMode === "seeker" ? isLoadingBookings : loadingProvider;

  const inProgress  = bookings.filter(b => b.status === "confirmed");
  const upcoming    = bookings.filter(b => b.status === "pending");
  const completed   = bookings.filter(b => b.status === "completed");
  const allCompleted = (allBookings ?? []).filter(b => b.status === "completed");
  const totalPaid   = paidBookingIds.size;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
        >
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1 uppercase tracking-widest">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <h1 className="font-serif text-3xl md:text-4xl font-bold">
              {greeting()}, {user?.firstName ?? "there"} 👋
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">Your care activity at a glance.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link href="/caregivers">
              <Button variant="outline" size="sm" className="gap-1.5 rounded-full">
                <Search className="w-3.5 h-3.5" /> Find Care
              </Button>
            </Link>
            <Link href="/messages">
              <Button variant="outline" size="sm" className="gap-1.5 rounded-full">
                <MessageCircle className="w-3.5 h-3.5" /> Messages
              </Button>
            </Link>
            <Link href="/post-request">
              <Button size="sm" className="gap-1.5 rounded-full">
                Post a Request <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* ✅ KPI tiles — clicking filters the list below */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8"
        >
          <StatCard label="Completed" value={allCompleted.length}
            icon={<CheckCircle2 className="w-5 h-5" />}
            colorClass="bg-blue-100 text-blue-600" bgClass="bg-white"
            loading={isLoadingBookings}
            onClick={() => setFocusStatus(focusStatus === "completed" ? null : "completed")}
            isActive={focusStatus === "completed"} />
          <StatCard label="In Progress" value={inProgress.length}
            icon={<CircleDot className="w-5 h-5" />}
            colorClass="bg-green-100 text-green-600" bgClass="bg-white"
            loading={isLoadingBookings}
            onClick={() => setFocusStatus(focusStatus === "confirmed" ? null : "confirmed")}
            isActive={focusStatus === "confirmed"} />
          <StatCard label="Pending" value={upcoming.length}
            icon={<CalendarDays className="w-5 h-5" />}
            colorClass="bg-amber-100 text-amber-600" bgClass="bg-white"
            loading={isLoadingBookings}
            onClick={() => setFocusStatus(focusStatus === "pending" ? null : "pending")}
            isActive={focusStatus === "pending"} />
          {/* ✅ Fixed: removed wrong "$" prefix — shows count not dollar amount */}
          <StatCard label="Payments Made" value={totalPaid}
            icon={<CreditCard className="w-5 h-5" />}
            colorClass="bg-primary/15 text-primary" bgClass="bg-white"
            loading={isLoadingBookings}
            onClick={() => setLocation("/payments/history")} />
        </motion.div>

        {/* Active filter banner */}
        {focusStatus && (
          <div className="flex items-center gap-2 mb-4 -mt-3">
            <span className="inline-flex items-center gap-1.5 bg-primary/5 border border-primary/20 text-primary text-sm font-medium rounded-full px-3.5 py-1.5">
              <Filter className="w-3.5 h-3.5" />
              Showing: {focusStatus === "confirmed" ? "In Progress" : focusStatus === "pending" ? "Pending" : "Completed"}
              <button onClick={() => setFocusStatus(null)}
                className="ml-1 opacity-60 hover:opacity-100 transition-opacity font-bold">
                × Clear
              </button>
            </span>
          </div>
        )}

        {/* Mode toggle */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
          className="flex items-center gap-2 mb-6"
        >
          <div className="flex bg-white border border-border/50 rounded-xl p-1 shadow-sm">
            <button onClick={() => setDashMode("seeker")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                dashMode === "seeker" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}>
              <Search className="w-3.5 h-3.5" /> Seeking Care
            </button>
            <button onClick={() => setDashMode("provider")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                dashMode === "provider" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}>
              <HeartHandshake className="w-3.5 h-3.5" /> Providing Care
            </button>
          </div>
          {dashMode === "provider" && providerBookings.length > 0 && (
            <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full font-medium">
              {providerBookings.filter(b => b.status === "pending").length} new requests
            </span>
          )}
        </motion.div>

        {/* Main grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={dashMode}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="grid lg:grid-cols-3 gap-5"
          >
            {/* In Progress — 2 cols */}
            <div className="lg:col-span-2 space-y-5">
              <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
                focusStatus === "confirmed" ? "border-green-400 ring-2 ring-green-200"
                : focusStatus && focusStatus !== "confirmed" ? "opacity-50"
                : "border-border/40"
              }`}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 bg-muted/5">
                  <div>
                    <h2 className="font-semibold text-sm flex items-center gap-2">
                      <CircleDot className="w-4 h-4 text-green-500" />
                      {dashMode === "seeker" ? "My Active Bookings" : "Requests to Fulfill"}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Click any booking to view full details
                    </p>
                  </div>
                  {inProgress.length > 0 && (
                    <span className="text-xs font-medium bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full">
                      {inProgress.length} active
                    </span>
                  )}
                </div>
                <div className="divide-y divide-border/30 px-4">
                  {isLoadingCurrentBookings ? (
                    <div className="py-5 space-y-3">
                      {[1, 2].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
                    </div>
                  ) : inProgress.length === 0 ? (
                    <EmptyState
                      icon={<CircleDot className="w-6 h-6" />}
                      title="No active bookings"
                      desc={dashMode === "seeker"
                        ? "Once a caregiver accepts your request, it shows up here."
                        : "Accept a request below to see it here."}
                      cta={dashMode === "seeker" ? (
                        <Button asChild size="sm" className="rounded-full">
                          <Link href="/caregivers">Browse Caregivers <ArrowRight className="w-3.5 h-3.5 ml-1" /></Link>
                        </Button>
                      ) : undefined}
                    />
                  ) : (
                    inProgress.map(booking => (
                      <BookingRow
                        key={booking.id} booking={booking}
                        isPending={updateBooking.isPending}
                        isPaid={paidBookingIds.has(booking.id)}
                        isProviderView={dashMode === "provider"}
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

              {/* Completed */}
              {(completed.length > 0 || focusStatus === "completed") && (
                <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
                  focusStatus === "completed" ? "border-blue-400 ring-2 ring-blue-200"
                  : focusStatus && focusStatus !== "completed" ? "opacity-50"
                  : "border-border/40"
                }`}>
                  <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 bg-muted/5">
                    <h2 className="font-semibold text-sm flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500" />
                      Completed — Leave a Review
                    </h2>
                    <span className="text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full">
                      {completed.length} done
                    </span>
                  </div>
                  <div className="divide-y divide-border/30 px-4">
                    {completed.map(booking => (
                      <BookingRow
                        key={booking.id} booking={booking}
                        isPending={updateBooking.isPending}
                        isPaid={paidBookingIds.has(booking.id)}
                        isProviderView={dashMode === "provider"}
                        onAccept={() => {}} onReject={() => {}} onComplete={() => {}} onPay={() => {}} onCancel={() => {}}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right column */}
            <div className="flex flex-col gap-5">
              {/* Pending */}
              <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
                focusStatus === "pending" ? "border-amber-400 ring-2 ring-amber-200"
                : focusStatus && focusStatus !== "pending" ? "opacity-50"
                : "border-border/40"
              }`}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 bg-muted/5">
                  <div>
                    <h2 className="font-semibold text-sm flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-amber-500" />
                      {dashMode === "seeker" ? "Pending Requests" : "New Requests"}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {dashMode === "seeker" ? "Awaiting caregiver response" : "Awaiting your acceptance"}
                    </p>
                  </div>
                  {upcoming.length > 0 && (
                    <span className="text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full">
                      {upcoming.length} new
                    </span>
                  )}
                </div>
                <div className="divide-y divide-border/30 px-4">
                  {isLoadingCurrentBookings ? (
                    <div className="py-4 space-y-3">
                      {[1, 2].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
                    </div>
                  ) : upcoming.length === 0 ? (
                    <EmptyState
                      icon={<CalendarDays className="w-5 h-5" />}
                      title="No pending requests"
                      desc={dashMode === "seeker"
                        ? "Browse and book a caregiver to get started."
                        : "When seekers book you, requests appear here."}
                    />
                  ) : (
                    upcoming.map(booking => (
                      <BookingRow
                        key={booking.id} booking={booking}
                        isPending={updateBooking.isPending}
                        isPaid={paidBookingIds.has(booking.id)}
                        isProviderView={dashMode === "provider"}
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

              {/* Platform snapshot */}
              <div className="bg-white rounded-2xl border border-border/40 shadow-sm p-5">
                <h2 className="font-semibold text-xs text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                  <BarChart3 className="w-3.5 h-3.5" /> Platform Snapshot
                </h2>
                <div className="space-y-3">
                  {[
                    { label: "Care Requests", value: stats?.totalCareRequests, loading: isLoadingStats, href: "/care-requests" },
                    { label: "Open Jobs",     value: stats?.openRequests,      loading: isLoadingStats, href: "/care-requests?status=open" },
                    { label: "Caregivers",    value: stats?.totalCaregivers,   loading: isLoadingStats, href: "/caregivers" },
                    { label: "Bookings",      value: stats?.totalBookings,     loading: isLoadingStats, href: "/bookings" },
                  ].map(item => (
                    <Link key={item.label} href={item.href} className="flex items-center justify-between text-sm group hover:bg-muted/40 rounded-lg px-2 py-1.5 -mx-2 transition-colors">
                      <span className="text-muted-foreground text-xs group-hover:text-primary transition-colors">{item.label}</span>
                      {item.loading ? <Skeleton className="h-4 w-8" /> : (
                        <span className="font-semibold tabular-nums text-sm flex items-center gap-1">
                          {item.value ?? 0}
                          <ChevronRight className="w-3 h-3 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-border/30 space-y-2">
                  <Link href="/payments/history" className="flex items-center gap-1 text-xs text-primary font-medium hover:underline">
                    Payment history <ChevronRight className="w-3 h-3" />
                  </Link>
                  <Link href="/become-caregiver" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline">
                    Register as a caregiver <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
