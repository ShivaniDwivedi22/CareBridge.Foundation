import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useUser } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiUrl } from "@/lib/api";
import { AlertTriangle, ArrowLeft, CheckCircle2, XCircle, Loader2 } from "lucide-react";

function fmt(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

const CANCEL_REASONS = [
  "Schedule changed",
  "Found another caregiver",
  "Personal emergency",
  "Financial reasons",
  "Caregiver not responding",
  "Service no longer needed",
  "Other",
];

function PolicyBanner({ hours }: { hours: number | null }) {
  if (hours === null) return null;

  let pct = 100;
  let label = "Full refund";
  let color = "bg-green-100 text-green-800 border-green-200";

  if (hours <= 24) {
    pct = 0;
    label = "No refund (within 24 hours)";
    color = "bg-red-100 text-red-800 border-red-200";
  } else if (hours <= 48) {
    pct = 50;
    label = "50% refund (24–48 hours notice)";
    color = "bg-yellow-100 text-yellow-800 border-yellow-200";
  }

  return (
    <div className={`rounded-xl border p-4 text-sm font-medium ${color}`}>
      <div className="flex items-center gap-2">
        {pct === 100 ? <CheckCircle2 className="w-4 h-4" /> : pct > 0 ? <AlertTriangle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
        {label} — {hours}h before service
      </div>
    </div>
  );
}

export default function CancelBooking() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const bookingId = parseInt(params.get("bookingId") ?? "0", 10);
  const hoursParam = params.get("hours");
  const hours = hoursParam ? parseInt(hoursParam, 10) : null;
  const caregiverName = params.get("caregiver") ?? "your caregiver";
  const amountCents = parseInt(params.get("amount") ?? "0", 10);

  const { user } = useUser();
  const { toast } = useToast();

  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [result, setResult] = useState<{
    refundAmountCents: number;
    refundPercentage: number;
    refundStatus: string;
    message: string;
  } | null>(null);

  const refundPct = hours === null ? 100 : hours > 48 ? 100 : hours > 24 ? 50 : 0;
  const estimatedRefund = Math.round(amountCents * (refundPct / 100));
  const finalReason = reason === "Other" ? customReason : reason;

  const handleSubmit = async () => {
    if (!finalReason) {
      toast({ title: "Please select a reason", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const resp = await fetch(apiUrl("/api/cancellations"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          initiatedBy: "seeker",
          initiatorId: user?.id,
          reason: finalReason,
          hoursBeforeService: hours,
        }),
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error ?? "Cancellation failed");

      setResult(data);
      setCancelled(true);
      toast({ title: "Booking cancelled", description: data.message });
    } catch (err: any) {
      toast({ title: "Cancellation failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (cancelled && result) {
    return (
      <div className="container max-w-lg mx-auto px-4 py-20 text-center">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${result.refundAmountCents > 0 ? "bg-blue-100" : "bg-orange-100"}`}>
          {result.refundAmountCents > 0
            ? <CheckCircle2 className="w-10 h-10 text-blue-600" />
            : <XCircle className="w-10 h-10 text-orange-600" />}
        </div>
        <h1 className="text-3xl font-serif font-bold mb-3">Booking Cancelled</h1>
        <p className="text-muted-foreground mb-2">{result.message}</p>
        {result.refundAmountCents > 0 && (
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-blue-800 font-medium text-sm mt-2 mb-6">
            Refund of {fmt(result.refundAmountCents)} ({result.refundPercentage}%) will appear in 5–10 business days
          </div>
        )}
        <div className="flex gap-3 justify-center mt-6">
          <Button variant="outline" onClick={() => setLocation("/dashboard")}>View Dashboard</Button>
          <Button className="rounded-full" onClick={() => setLocation("/caregivers")}>Find Another Caregiver</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-lg mx-auto px-4 py-12 md:py-16">
      <button
        onClick={() => window.history.back()}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold mb-2">Cancel Booking</h1>
        <p className="text-muted-foreground">Your booking with {caregiverName}</p>
      </div>

      <div className="space-y-5">
        <PolicyBanner hours={hours} />

        {amountCents > 0 && (
          <Card className="border-border/50 bg-muted/10">
            <CardContent className="pt-4 pb-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Amount paid</span>
                <span className="font-medium">{fmt(amountCents)}</span>
              </div>
              <div className="flex justify-between items-center text-sm mt-2">
                <span className="text-muted-foreground">Estimated refund</span>
                <span className={`font-semibold ${estimatedRefund > 0 ? "text-green-600" : "text-muted-foreground"}`}>
                  {estimatedRefund > 0 ? fmt(estimatedRefund) : "No refund"}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Reason for cancellation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {CANCEL_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {reason === "Other" && (
              <Textarea
                placeholder="Please describe your reason..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                rows={3}
              />
            )}
          </CardContent>
        </Card>

        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl p-4 text-sm text-amber-800 dark:text-amber-300">
          <AlertTriangle className="w-4 h-4 inline mr-1.5 -mt-0.5" />
          This action cannot be undone. The caregiver will be notified immediately.
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => window.history.back()}>
            Keep Booking
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={handleSubmit}
            disabled={submitting || !reason || (reason === "Other" && !customReason)}
          >
            {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Cancelling…</> : "Confirm Cancellation"}
          </Button>
        </div>
      </div>
    </div>
  );
}
