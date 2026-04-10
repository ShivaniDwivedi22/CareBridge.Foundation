import { useState, useEffect } from "react";
import { useSearch, Link } from "wouter";
import { apiUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { CheckCircle2, Phone, MessageCircle, ArrowRight, Star, Calendar, Users, Lock } from "lucide-react";

const steps = [
  { label: "Request sent", desc: "You reached out" },
  { label: "Caregiver accepted", desc: "They said yes" },
  { label: "Payment complete", desc: "Booking confirmed" },
  { label: "Contact revealed", desc: "Connect directly", active: true },
  { label: "Service happens", desc: "Care delivered" },
  { label: "Leave a review", desc: "Share your experience" },
];

export default function PaymentSuccess() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const bookingId = parseInt(params.get("bookingId") ?? "0", 10);
  const caregiverName = params.get("caregiver") ?? "your caregiver";

  const [caregiver, setCaregiver] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookingId) { setLoading(false); return; }
    fetch(apiUrl("/api/bookings"))
      .then(r => r.json())
      .then((bookings: any[]) => {
        const booking = bookings.find((b: any) => b.id === bookingId);
        if (booking?.caregiver) setCaregiver(booking.caregiver);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [bookingId]);

  return (
    <div className="min-h-[80vh] bg-gradient-to-b from-green-50/50 to-background">
      <div className="container max-w-lg mx-auto px-4 py-16">

        {/* Celebration header */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
          >
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold mb-2">Shukriya! You're all set.</h1>
          <p className="text-muted-foreground text-lg">
            Payment confirmed. Your booking with <span className="font-semibold text-foreground">{caregiverName}</span> is locked in.
          </p>
        </motion.div>

        {/* Contact reveal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          {!loading && caregiver?.phone ? (
            <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 mb-6 text-left shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="font-semibold text-green-800">Contact Unlocked</div>
                  <div className="text-xs text-green-600">Reach out to {caregiverName} directly</div>
                </div>
              </div>
              <div className="text-2xl font-bold text-green-900 tracking-wide">{caregiver.phone}</div>
            </div>
          ) : !loading && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-6 flex items-center gap-3 text-sm text-blue-800 shadow-sm">
              <MessageCircle className="w-5 h-5 shrink-0 text-blue-500" />
              <span>Contact details are available in your dashboard. Use the in-app messages to coordinate with {caregiverName}.</span>
            </div>
          )}
        </motion.div>

        {/* 6-step journey */}
        <motion.div
          className="bg-white rounded-2xl border border-border/50 p-6 mb-6 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-5">Your care journey</div>
          <div className="space-y-4">
            {steps.map((step, i) => {
              const isDone = i < 4;
              const isActive = step.active;
              const isFuture = i >= 4;
              return (
                <div key={i} className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold transition-all ${
                    isActive
                      ? "bg-green-500 text-white ring-4 ring-green-100"
                      : isDone
                      ? "bg-green-500 text-white"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium ${isActive ? "text-green-700" : isFuture ? "text-muted-foreground" : "text-foreground"}`}>
                      {step.label}
                      {isActive && <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">You are here</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">{step.desc}</div>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`w-px h-4 rounded ${isDone ? "bg-green-300" : "bg-border"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* CTA buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
        >
          <Button asChild variant="outline" className="flex-1 rounded-full h-12">
            <Link href="/messages">
              <MessageCircle className="w-4 h-4 mr-2" /> Message Caregiver
            </Link>
          </Button>
          <Button asChild className="flex-1 rounded-full h-12">
            <Link href="/dashboard">
              View Dashboard <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </motion.div>

        {/* Tip */}
        <motion.p
          className="text-center text-xs text-muted-foreground mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65 }}
        >
          After the service, come back to leave a review — it helps other families choose the right care.
        </motion.p>
      </div>
    </div>
  );
}
