import { useState, useEffect } from "react";
import { useUser } from "@clerk/react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiUrl } from "@/lib/api";
import { DollarSign, CheckCircle2, Clock, XCircle, RefreshCw } from "lucide-react";

function fmt(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

type Payment = {
  id: number;
  bookingId: number;
  amountCents: number;
  platformFeeCents: number;
  providerPayoutCents: number;
  status: string;
  refundAmountCents: number;
  refundStatus: string | null;
  paidAt: string | null;
  createdAt: string;
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string; Icon: any }> = {
    succeeded: { label: "Paid", className: "bg-green-100 text-green-800", Icon: CheckCircle2 },
    pending: { label: "Pending", className: "bg-yellow-100 text-yellow-800", Icon: Clock },
    failed: { label: "Failed", className: "bg-red-100 text-red-800", Icon: XCircle },
    refunded: { label: "Refunded", className: "bg-blue-100 text-blue-800", Icon: RefreshCw },
  };
  const cfg = map[status] ?? { label: status, className: "bg-muted", Icon: DollarSign };
  const { Icon } = cfg;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

export default function PaymentHistory() {
  const { user } = useUser();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetch(apiUrl(`/api/payments/history?clerkId=${user.id}`))
      .then((r) => r.json())
      .then((data) => {
        setPayments(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user]);

  return (
    <div className="container mx-auto px-4 py-12 md:py-16 max-w-3xl">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold mb-2">Payment History</h1>
        <p className="text-muted-foreground">All your transactions and refunds in one place.</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : payments.length === 0 ? (
        <Card className="text-center py-16 border-dashed">
          <CardContent>
            <DollarSign className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No payments yet.</p>
            <Link href="/caregivers" className="text-primary text-sm hover:underline mt-2 inline-block">
              Find a caregiver to get started
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {payments.map((p) => (
            <Card key={p.id} className="border-border/50 hover:shadow-sm transition-shadow">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">Booking #{p.bookingId}</p>
                      <StatusBadge status={p.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {p.paidAt
                        ? `Paid on ${new Date(p.paidAt).toLocaleDateString("en-US", { dateStyle: "medium" })}`
                        : `Created ${new Date(p.createdAt).toLocaleDateString("en-US", { dateStyle: "medium" })}`}
                    </p>
                    {p.refundAmountCents > 0 && (
                      <p className="text-sm text-blue-600 mt-1 font-medium">
                        Refund: {fmt(p.refundAmountCents)}
                        {p.refundStatus === "completed" ? " (processed)" : " (pending)"}
                      </p>
                    )}
                    <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                      <span>Platform fee: {fmt(p.platformFeeCents)}</span>
                      <span>Provider payout: {fmt(p.providerPayoutCents)}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xl font-bold">{fmt(p.amountCents)}</p>
                    <p className="text-xs text-muted-foreground uppercase">USD</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
