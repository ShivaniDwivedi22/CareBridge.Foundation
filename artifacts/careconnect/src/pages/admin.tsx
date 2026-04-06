import { useState, useEffect } from "react";
import {
  useAdminListCaregivers,
  useAdminApproveCaregiver,
  useAdminRejectCaregiver,
  useListReviews,
  useUpdateReviewStatus,
  getAdminListCaregiversQueryKey,
  getListReviewsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, ShieldCheck, Star, Users, MessageSquare, RefreshCw, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { apiUrl } from "@/lib/api";

function fmt(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

type Cancellation = {
  id: number;
  bookingId: number;
  initiatedBy: string;
  reason: string;
  hoursBeforeService: number | null;
  refundAmountCents: number;
  refundPercentage: number;
  refundStatus: string;
  adminNote: string | null;
  cancelledAt: string;
};

function RefundPanel() {
  const { toast } = useToast();
  const [cancellations, setCancellations] = useState<Cancellation[]>([]);
  const [loading, setLoading] = useState(true);
  const [overrideData, setOverrideData] = useState<Record<number, { pct: string; note: string }>>({});
  const [submitting, setSubmitting] = useState<number | null>(null);

  useEffect(() => {
    fetch(apiUrl("/api/cancellations/history"))
      .then((r) => r.json())
      .then((d) => { setCancellations(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleOverride = async (id: number) => {
    const data = overrideData[id];
    if (!data?.pct || !data?.note) {
      toast({ title: "Fill in refund % and note", variant: "destructive" });
      return;
    }
    setSubmitting(id);
    try {
      const resp = await fetch(apiUrl(`/api/cancellations/${id}/admin-override`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ overrideRefundPct: parseInt(data.pct), adminNote: data.note }),
      });
      const result = await resp.json();
      if (!resp.ok) throw new Error(result.error ?? "Override failed");
      toast({ title: "Refund override applied" });
      setCancellations((prev) => prev.map((c) => c.id === id ? { ...result } : c));
      setOverrideData((prev) => ({ ...prev, [id]: { pct: "", note: "" } }));
    } catch (err: any) {
      toast({ title: "Override failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) {
    return <div className="p-6 space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>;
  }

  if (cancellations.length === 0) {
    return (
      <div className="p-10 text-center text-muted-foreground">
        <RefreshCw className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
        No cancellations yet.
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/40">
      {cancellations.map((c) => (
        <div key={c.id} className="p-6 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold">Booking #{c.bookingId}</span>
                <Badge variant="outline" className={
                  c.refundStatus === "completed" ? "border-green-500 text-green-700 bg-green-50" :
                  c.refundStatus === "pending" ? "border-yellow-500 text-yellow-700 bg-yellow-50" :
                  "border-gray-400 text-gray-600"
                }>
                  {c.refundStatus === "none" ? "No refund" : c.refundStatus}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">By: {c.initiatedBy} · {new Date(c.cancelledAt).toLocaleDateString()}</p>
              <p className="text-sm mt-0.5">Reason: <span className="text-foreground">{c.reason}</span></p>
              <p className="text-sm text-muted-foreground">
                Refund: {fmt(c.refundAmountCents)} ({c.refundPercentage}%)
                {c.hoursBeforeService !== null && ` · ${c.hoursBeforeService}h notice`}
              </p>
              {c.adminNote && (
                <p className="text-xs text-muted-foreground italic mt-1">Admin note: {c.adminNote}</p>
              )}
            </div>
          </div>
          {/* Admin override form */}
          <div className="flex flex-wrap gap-2 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Override refund %</label>
              <Input
                type="number"
                min={0}
                max={100}
                placeholder="0–100"
                className="w-24 h-8 text-sm"
                value={overrideData[c.id]?.pct ?? ""}
                onChange={(e) => setOverrideData((p) => ({ ...p, [c.id]: { ...p[c.id], pct: e.target.value } }))}
              />
            </div>
            <div className="flex flex-col gap-1 flex-1 min-w-40">
              <label className="text-xs text-muted-foreground">Admin note</label>
              <Input
                placeholder="Reason for override..."
                className="h-8 text-sm"
                value={overrideData[c.id]?.note ?? ""}
                onChange={(e) => setOverrideData((p) => ({ ...p, [c.id]: { ...p[c.id], note: e.target.value } }))}
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={() => handleOverride(c.id)}
              disabled={submitting === c.id}
            >
              <DollarSign className="w-3 h-3 mr-1" />
              {submitting === c.id ? "Applying…" : "Apply Override"}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: caregivers, isLoading: isLoadingCaregivers } = useAdminListCaregivers({
    query: { queryKey: getAdminListCaregiversQueryKey() }
  });
  const { data: reviews, isLoading: isLoadingReviews } = useListReviews({}, {
    query: { queryKey: getListReviewsQueryKey() }
  });

  const approveCaregiver = useAdminApproveCaregiver();
  const rejectCaregiver = useAdminRejectCaregiver();
  const updateReviewStatus = useUpdateReviewStatus();

  const handleApprove = (id: number) => {
    approveCaregiver.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Caregiver Approved", description: "The provider is now visible to seekers." });
        queryClient.invalidateQueries({ queryKey: getAdminListCaregiversQueryKey() });
      },
    });
  };

  const handleReject = (id: number) => {
    rejectCaregiver.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Caregiver Deactivated", description: "The profile has been deactivated." });
        queryClient.invalidateQueries({ queryKey: getAdminListCaregiversQueryKey() });
      },
    });
  };

  const handleReviewStatus = (id: number, status: "approved" | "rejected") => {
    updateReviewStatus.mutate({ id, data: { status } }, {
      onSuccess: () => {
        toast({ title: `Review ${status}`, description: `Review has been ${status}.` });
        queryClient.invalidateQueries({ queryKey: getListReviewsQueryKey() });
      },
    });
  };

  const pendingCaregivers = caregivers?.filter(c => !c.isVerified) ?? [];
  const verifiedCaregivers = caregivers?.filter(c => c.isVerified) ?? [];
  const pendingReviews = reviews?.filter(r => r.status === "pending") ?? [];

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="mb-10">
        <h1 className="font-serif text-4xl font-bold mb-2">Admin Panel</h1>
        <p className="text-muted-foreground">Manage caregivers and review moderation.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <Card className="bg-primary/5 border-border/50">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-primary/20 rounded-xl">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="text-3xl font-bold">{caregivers?.length ?? "—"}</div>
              <div className="text-sm text-muted-foreground">Total Caregivers</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 dark:bg-yellow-900/10 border-border/50">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-yellow-200 dark:bg-yellow-800/30 rounded-xl">
              <ShieldCheck className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <div className="text-3xl font-bold">{pendingCaregivers.length}</div>
              <div className="text-sm text-muted-foreground">Pending Approval</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 dark:bg-blue-900/10 border-border/50">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-200 dark:bg-blue-800/30 rounded-xl">
              <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-3xl font-bold">{pendingReviews.length}</div>
              <div className="text-sm text-muted-foreground">Reviews to Moderate</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending">
        <TabsList className="mb-6 flex-wrap gap-1">
          <TabsTrigger value="pending">
            Pending Caregivers
            {pendingCaregivers.length > 0 && (
              <Badge className="ml-2 bg-yellow-500/20 text-yellow-700 border-0 text-xs">
                {pendingCaregivers.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="verified">Verified Caregivers</TabsTrigger>
          <TabsTrigger value="reviews">
            Review Moderation
            {pendingReviews.length > 0 && (
              <Badge className="ml-2 bg-blue-500/20 text-blue-700 border-0 text-xs">
                {pendingReviews.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="refunds">Refunds & Cancellations</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="border-b border-border/40 bg-muted/20">
              <CardTitle>Awaiting Approval</CardTitle>
              <CardDescription>Review and approve caregiver profiles before they appear in search results.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingCaregivers ? (
                <div className="p-6 space-y-4">
                  {[1, 2].map(i => <Skeleton key={i} className="h-24 w-full" />)}
                </div>
              ) : pendingCaregivers.length === 0 ? (
                <div className="p-10 text-center text-muted-foreground">
                  No pending caregivers. All profiles are up to date.
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {pendingCaregivers.map(caregiver => (
                    <div key={caregiver.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 border border-border">
                          <AvatarImage src={caregiver.avatarUrl ?? undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {caregiver.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold text-lg">{caregiver.name}</div>
                          <div className="text-sm text-muted-foreground">{caregiver.location} · ${caregiver.hourlyRate}/hr</div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {caregiver.categories?.slice(0, 3).map(cat => (
                              <Badge key={cat.id} variant="outline" className="text-xs">{cat.name}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleReject(caregiver.id)}
                        >
                          <XCircle className="w-4 h-4 mr-1" /> Reject
                        </Button>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleApprove(caregiver.id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" /> Approve
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verified">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="border-b border-border/40 bg-muted/20">
              <CardTitle>Verified Caregivers</CardTitle>
              <CardDescription>Currently active and visible to care seekers.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingCaregivers ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
                </div>
              ) : verifiedCaregivers.length === 0 ? (
                <div className="p-10 text-center text-muted-foreground">No verified caregivers yet.</div>
              ) : (
                <div className="divide-y divide-border/40">
                  {verifiedCaregivers.map(caregiver => (
                    <div key={caregiver.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 border border-border">
                          <AvatarImage src={caregiver.avatarUrl ?? undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {caregiver.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold text-lg flex items-center gap-2">
                            {caregiver.name}
                            <ShieldCheck className="w-4 h-4 text-green-500" />
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {caregiver.location} · {caregiver.reviewCount} reviews · {caregiver.rating.toFixed(1)} rating
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleReject(caregiver.id)}
                      >
                        <XCircle className="w-4 h-4 mr-1" /> Deactivate
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="border-b border-border/40 bg-muted/20">
              <CardTitle>Review Moderation</CardTitle>
              <CardDescription>Review and approve or reject submitted ratings before they go live.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingReviews ? (
                <div className="p-6 space-y-4">
                  {[1, 2].map(i => <Skeleton key={i} className="h-24 w-full" />)}
                </div>
              ) : pendingReviews.length === 0 ? (
                <div className="p-10 text-center text-muted-foreground">No pending reviews to moderate.</div>
              ) : (
                <div className="divide-y divide-border/40">
                  {pendingReviews.map(review => (
                    <div key={review.id} className="p-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{review.reviewerName}</span>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
                            ))}
                          </div>
                          <Badge variant="outline" className="text-xs border-yellow-400 text-yellow-600">Pending</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{review.comment}</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">
                          Caregiver ID: {review.caregiverId} · {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleReviewStatus(review.id, "rejected")}
                        >
                          <XCircle className="w-4 h-4 mr-1" /> Reject
                        </Button>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleReviewStatus(review.id, "approved")}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" /> Approve
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="refunds">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="border-b border-border/40 bg-muted/20">
              <CardTitle>Refunds &amp; Cancellations</CardTitle>
              <CardDescription>Review cancellations and apply manual refund overrides when needed.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <RefundPanel />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
