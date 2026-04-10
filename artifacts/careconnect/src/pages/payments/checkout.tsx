import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiUrl } from "@/lib/api";
import { Loader2, ShieldCheck, CreditCard, ArrowLeft, CheckCircle2 } from "lucide-react";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? "");

function fmt(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

// ── Inner checkout form ───────────────────────────────────────────────────────
function CheckoutForm({
  paymentId,
  stripePaymentIntentId,
  bookingId,
  onSuccess,
}: {
  paymentId: number;
  stripePaymentIntentId: string;
  bookingId: number;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setErrorMsg(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: "if_required",
    });

    if (error) {
      setErrorMsg(error.message ?? "Payment failed. Please try again.");
      setIsProcessing(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      try {
        const resp = await fetch(apiUrl(`/api/payments/${paymentId}/confirm`), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stripePaymentIntentId }),
        });
        if (!resp.ok) throw new Error(await resp.text());

        toast({ title: "Payment confirmed!", description: "Your contact details are now unlocked." });
        onSuccess();
      } catch (err: any) {
        toast({ title: "Confirmation error", description: err.message, variant: "destructive" });
      }
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement />
      {errorMsg && (
        <p className="text-sm text-destructive font-medium">{errorMsg}</p>
      )}
      <Button type="submit" className="w-full h-12 rounded-full text-base shadow-md" disabled={!stripe || isProcessing}>
        {isProcessing ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing…</>
        ) : (
          <><CreditCard className="w-4 h-4 mr-2" /> Pay Now</>
        )}
      </Button>
      <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
        Secured by Stripe — your card details are encrypted and never stored
      </p>
    </form>
  );
}

// ── Main checkout page ────────────────────────────────────────────────────────
export default function CheckoutPage() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const bookingId = parseInt(params.get("bookingId") ?? "0", 10);
  const amountCents = parseInt(params.get("amount") ?? "0", 10);
  const caregiverName = params.get("caregiver") ?? "your caregiver";
  const serviceName = params.get("service") ?? "Care Service";

  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [breakdown, setBreakdown] = useState<{
    subtotal: number; platformFee: number; providerPayout: number;
  } | null>(null);
  const [paymentId, setPaymentId] = useState<number | null>(null);
  const [piId, setPiId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookingId || !amountCents) {
      toast({ title: "Invalid checkout link", variant: "destructive" });
      setLocation("/dashboard");
      return;
    }

    fetch(apiUrl("/api/payments/create-intent"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, amountCents }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setClientSecret(data.clientSecret);
        setBreakdown(data.breakdown);
        setPaymentId(data.paymentId);
        setPiId(data.stripePaymentIntentId ?? data.clientSecret?.split("_secret")[0]);
        setLoading(false);
      })
      .catch((err) => {
        toast({ title: "Could not initialise payment", description: err.message, variant: "destructive" });
        setLoading(false);
      });
  }, [bookingId, amountCents]);

  return (
    <div className="container max-w-2xl mx-auto px-4 py-12 md:py-16">
      <button
        onClick={() => window.history.back()}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="grid md:grid-cols-[1fr_300px] gap-8 items-start">
        <div>
          <h1 className="font-serif text-3xl font-bold mb-2">Complete Payment</h1>
          <p className="text-muted-foreground mb-8">Pay securely to confirm your booking with {caregiverName}.</p>

          <Card className="border-border/50 shadow-sm">
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : clientSecret ? (
                <Elements
                  stripe={stripePromise}
                  options={{ clientSecret, appearance: { theme: "stripe", variables: { borderRadius: "8px" } } }}
                >
                  <CheckoutForm
                    paymentId={paymentId!}
                    stripePaymentIntentId={piId!}
                    bookingId={bookingId}
                    onSuccess={() => setLocation(`/payments/success?bookingId=${bookingId}&caregiver=${encodeURIComponent(caregiverName)}`)}
                  />
                </Elements>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Unable to load payment form. Please go back and try again.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order summary */}
        <div className="space-y-4">
          <Card className="border-border/50 bg-muted/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{serviceName}</span>
                <span className="font-medium">{fmt(amountCents)}</span>
              </div>
              {breakdown && (
                <>
                  <Separator />
                  <div className="flex justify-between text-muted-foreground">
                    <span>Platform fee (15%)</span>
                    <span>{fmt(breakdown.platformFee)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Provider receives</span>
                    <span>{fmt(breakdown.providerPayout)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-base">
                    <span>Total</span>
                    <span>{fmt(breakdown.subtotal)}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50 dark:bg-green-900/10">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-green-800 dark:text-green-300 space-y-1">
                <strong className="block mb-1">Cancellation Policy</strong>
                <span className="block">• Cancel 48h+ before: full refund</span>
                <span className="block">• Cancel 24–48h before: 50% refund</span>
                <span className="block">• Cancel within 24h: no refund</span>
              </p>
            </CardContent>
          </Card>

          <Badge variant="secondary" className="w-full justify-center py-2 text-xs gap-2 bg-muted/50">
            <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
            256-bit SSL encrypted payment
          </Badge>
        </div>
      </div>
    </div>
  );
}
