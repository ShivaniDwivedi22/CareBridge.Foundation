import { useState, useEffect } from "react";
import {
  useAdminListCaregivers,
  useAdminApproveCaregiver,
  useAdminRejectCaregiver,
  useListReviews,
  useUpdateReviewStatus,
  getAdminListCaregiversQueryKey,
  getListReviewsQueryKey,
} from "@/hooks/api-hooks";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle, XCircle, ShieldCheck, Star, Users, MessageSquare,
  RefreshCw, DollarSign, BarChart2, Banknote, AlertTriangle, BookOpen,
  Eye, Edit, Clock, FileText, MapPin, Phone, Award, Briefcase, ChevronDown, ChevronUp,
  ScrollText, UserCog, FolderOpen,
} from "lucide-react";
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

// ── Caregiver Detail Drawer ──────────────────────────────────────────────────
function CaregiverDetailDialog({ caregiver, open, onClose }: { caregiver: any; open: boolean; onClose: () => void }) {
  if (!caregiver) return null;
  const sections = [
    {
      title: "Identity & Contact", icon: <Users className="w-4 h-4" />,
      fields: [
        { label: "Full Name", value: caregiver.name },
        { label: "Phone", value: caregiver.phone || "Not provided" },
        { label: "Clerk ID", value: caregiver.clerkId || "N/A" },
        { label: "Location", value: caregiver.location },
        { label: "Registered", value: caregiver.createdAt ? new Date(caregiver.createdAt).toLocaleDateString() : "—" },
      ],
    },
    {
      title: "Experience & Skills", icon: <Briefcase className="w-4 h-4" />,
      fields: [
        { label: "Years of Experience", value: caregiver.yearsExperience ?? "—" },
        { label: "Languages", value: caregiver.languages || "Not specified" },
        { label: "Bio", value: caregiver.bio, full: true },
        { label: "Past Work References", value: caregiver.pastWorkReferences || "None provided", full: true },
      ],
    },
    {
      title: "Background & Safety", icon: <ShieldCheck className="w-4 h-4" />,
      fields: [
        { label: "Background Check Consent", value: caregiver.backgroundCheckConsent ? "Yes" : "No" },
        { label: "Police Verification", value: caregiver.policeVerification ? "Yes" : "No" },
        { label: "Medical Fitness Declaration", value: caregiver.medicalFitnessDeclaration ? "Yes" : "No" },
      ],
    },
    {
      title: "Certifications & Licenses", icon: <Award className="w-4 h-4" />,
      fields: [
        { label: "Certifications", value: caregiver.certifications || "None" },
        { label: "Medical/Nursing License", value: caregiver.medicalNursingLicense || "None" },
        { label: "Food Safety Certificate", value: caregiver.foodSafetyCertificate ? "Yes" : "No" },
        { label: "Insurance License", value: caregiver.insuranceLicense || "None" },
      ],
    },
    {
      title: "Service Logistics", icon: <MapPin className="w-4 h-4" />,
      fields: [
        { label: "Service Radius", value: caregiver.serviceRadius || "Not specified" },
        { label: "On-site / Remote", value: caregiver.onSiteRemote || "Not specified" },
        { label: "Availability", value: caregiver.availabilitySchedule || "Not specified", full: true },
      ],
    },
    {
      title: "Pricing & Compliance", icon: <DollarSign className="w-4 h-4" />,
      fields: [
        { label: "Hourly Rate", value: `$${caregiver.hourlyRate}/hr` },
        { label: "Pricing Unit", value: caregiver.pricingUnit || "hourly" },
        { label: "Terms Accepted", value: caregiver.termsAccepted ? "Yes" : "No" },
        { label: "Code of Conduct", value: caregiver.codeOfConductAccepted ? "Yes" : "No" },
        { label: "Liability Waiver", value: caregiver.liabilityWaiverAccepted ? "Yes" : "No" },
      ],
    },
  ];

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <Avatar className="h-10 w-10 border">
              <AvatarImage src={caregiver.avatarUrl ?? undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">{caregiver.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            {caregiver.name}
            {caregiver.isVerified
              ? <Badge className="bg-green-100 text-green-700 border-green-300">Verified</Badge>
              : <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">Pending</Badge>
            }
          </DialogTitle>
          <DialogDescription>
            Full application details — Categories: {caregiver.categories?.map((c: any) => c.name).join(", ") || "None"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 mt-2">
          {sections.map((section) => (
            <div key={section.title} className="rounded-lg border border-border/50 overflow-hidden">
              <div className="bg-muted/30 px-4 py-2.5 flex items-center gap-2 border-b border-border/40">
                {section.icon}
                <span className="font-semibold text-sm">{section.title}</span>
              </div>
              <div className="p-4 grid gap-3">
                {section.fields.map((f: any) => (
                  <div key={f.label} className={f.full ? "col-span-full" : ""}>
                    <div className="text-xs font-medium text-muted-foreground mb-0.5">{f.label}</div>
                    <div className={`text-sm ${f.full ? "whitespace-pre-wrap bg-muted/20 rounded p-2 border border-border/30" : ""}`}>
                      {f.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Edit Caregiver Dialog ─────────────────────────────────────────────────────
function EditCaregiverDialog({ caregiver, open, onClose, onSaved }: { caregiver: any; open: boolean; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});

  useEffect(() => {
    if (caregiver) {
      setForm({
        name: caregiver.name ?? "",
        phone: caregiver.phone ?? "",
        location: caregiver.location ?? "",
        bio: caregiver.bio ?? "",
        hourlyRate: caregiver.hourlyRate ?? 0,
        yearsExperience: caregiver.yearsExperience ?? 0,
        certifications: caregiver.certifications ?? "",
        languages: caregiver.languages ?? "",
        serviceRadius: caregiver.serviceRadius ?? "",
        onSiteRemote: caregiver.onSiteRemote ?? "",
        availabilitySchedule: caregiver.availabilitySchedule ?? "",
        pricingUnit: caregiver.pricingUnit ?? "hourly",
      });
    }
  }, [caregiver]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const resp = await fetch(apiUrl(`/api/admin/caregivers/${caregiver.id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!resp.ok) { const d = await resp.json(); throw new Error(d.error ?? "Update failed"); }
      toast({ title: "Profile updated" });
      onSaved();
      onClose();
    } catch (err: any) {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  if (!caregiver) return null;

  const fields = [
    { key: "name", label: "Full Name", type: "text" },
    { key: "phone", label: "Phone", type: "text" },
    { key: "location", label: "Location", type: "text" },
    { key: "hourlyRate", label: "Hourly Rate ($)", type: "number" },
    { key: "yearsExperience", label: "Years Experience", type: "number" },
    { key: "certifications", label: "Certifications", type: "text" },
    { key: "languages", label: "Languages", type: "text" },
    { key: "serviceRadius", label: "Service Radius", type: "text" },
    { key: "onSiteRemote", label: "On-site / Remote", type: "text" },
    { key: "pricingUnit", label: "Pricing Unit", type: "text" },
  ];

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Edit className="w-5 h-5" /> Edit {caregiver.name}</DialogTitle>
          <DialogDescription>Update caregiver profile fields. Changes are saved to the database immediately.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-3">
          {fields.map((f) => (
            <div key={f.key} className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">{f.label}</label>
              <Input
                type={f.type}
                value={form[f.key] ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, [f.key]: f.type === "number" ? parseFloat(e.target.value) || 0 : e.target.value }))}
                className="h-9 text-sm"
              />
            </div>
          ))}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Bio</label>
            <Textarea
              value={form.bio ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
              rows={3} className="text-sm resize-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Availability Schedule</label>
            <Textarea
              value={form.availabilitySchedule ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, availabilitySchedule: e.target.value }))}
              rows={2} className="text-sm resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Refund Panel ──────────────────────────────────────────────────────────────
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
    if (!data?.pct || !data?.note) { toast({ title: "Fill in refund % and note", variant: "destructive" }); return; }
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
    } finally { setSubmitting(null); }
  };

  if (loading) return <div className="p-6 space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>;
  if (cancellations.length === 0) return (
    <div className="p-10 text-center text-muted-foreground">
      <RefreshCw className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" /> No cancellations yet.
    </div>
  );

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
                }>{c.refundStatus === "none" ? "No refund" : c.refundStatus}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">By: {c.initiatedBy} · {new Date(c.cancelledAt).toLocaleDateString()}</p>
              <p className="text-sm mt-0.5">Reason: <span className="text-foreground">{c.reason}</span></p>
              <p className="text-sm text-muted-foreground">
                Refund: {fmt(c.refundAmountCents)} ({c.refundPercentage}%)
                {c.hoursBeforeService !== null && ` · ${c.hoursBeforeService}h notice`}
              </p>
              {c.adminNote && <p className="text-xs text-muted-foreground italic mt-1">Admin note: {c.adminNote}</p>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Override refund %</label>
              <Input type="number" min={0} max={100} placeholder="0–100" className="w-24 h-8 text-sm"
                value={overrideData[c.id]?.pct ?? ""}
                onChange={(e) => setOverrideData((p) => ({ ...p, [c.id]: { ...p[c.id], pct: e.target.value } }))} />
            </div>
            <div className="flex flex-col gap-1 flex-1 min-w-40">
              <label className="text-xs text-muted-foreground">Admin note</label>
              <Input placeholder="Reason for override..." className="h-8 text-sm"
                value={overrideData[c.id]?.note ?? ""}
                onChange={(e) => setOverrideData((p) => ({ ...p, [c.id]: { ...p[c.id], note: e.target.value } }))} />
            </div>
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleOverride(c.id)} disabled={submitting === c.id}>
              <DollarSign className="w-3 h-3 mr-1" /> {submitting === c.id ? "Applying…" : "Apply Override"}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Disputed Panel ────────────────────────────────────────────────────────────
function DisputedPanel() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(apiUrl("/api/bookings"))
      .then((r) => r.json())
      .then((d) => { setBookings(Array.isArray(d) ? d.filter((b: any) => b.status === "cancelled") : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>;
  if (bookings.length === 0) return (
    <div className="p-10 text-center text-muted-foreground">
      <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-muted-foreground/20" /> No cancelled or disputed services.
    </div>
  );
  return (
    <div className="divide-y divide-border/40">
      {bookings.map(b => (
        <div key={b.id} className="p-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold">Booking #{b.id}</span>
              <Badge variant="outline" className="border-red-400 text-red-600 text-xs">Cancelled</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Request: {b.careRequest?.title ?? "—"} · Caregiver: {b.caregiver?.name ?? "—"}
            </p>
            <p className="text-xs text-muted-foreground/70 mt-0.5">{new Date(b.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Care Requests Panel ───────────────────────────────────────────────────────
function CareRequestsPanel() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [updating, setUpdating] = useState<number | null>(null);

  const loadRequests = () => {
    setLoading(true);
    fetch(apiUrl("/api/admin/care-requests"))
      .then((r) => r.json())
      .then((d) => { setRequests(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { loadRequests(); }, []);

  const updateStatus = async (id: number, status: string) => {
    setUpdating(id);
    try {
      const resp = await fetch(apiUrl(`/api/admin/care-requests/${id}/status`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!resp.ok) throw new Error("Failed to update");
      toast({ title: `Request ${status}` });
      loadRequests();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally { setUpdating(null); }
  };

  const filtered = filter === "all" ? requests : requests.filter((r) => r.status === filter);

  if (loading) return <div className="p-6 space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>;

  return (
    <div>
      <div className="p-4 border-b border-border/40 flex flex-wrap gap-2">
        {["all", "open", "fulfilled", "closed", "flagged"].map((s) => (
          <Button key={s} size="sm" variant={filter === s ? "default" : "outline"} className="text-xs h-7 capitalize"
            onClick={() => setFilter(s)}>
            {s} {s !== "all" && `(${requests.filter((r) => r.status === s).length})`}
          </Button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className="p-10 text-center text-muted-foreground">No care requests found.</div>
      ) : (
        <div className="divide-y divide-border/40">
          {filtered.map((req) => (
            <div key={req.id} className="p-5 space-y-2">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{req.title}</span>
                    <Badge variant="outline" className={
                      req.status === "open" ? "border-green-400 text-green-700 bg-green-50" :
                      req.status === "flagged" ? "border-red-400 text-red-700 bg-red-50" :
                      req.status === "fulfilled" ? "border-blue-400 text-blue-700 bg-blue-50" :
                      "border-gray-400 text-gray-600"
                    }>{req.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{req.description}</p>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                    <span><MapPin className="w-3 h-3 inline mr-1" />{req.location}</span>
                    <span><DollarSign className="w-3 h-3 inline mr-1" />${req.budget}/hr</span>
                    <span><Clock className="w-3 h-3 inline mr-1" />{req.startDate}</span>
                    {req.category && <span><FolderOpen className="w-3 h-3 inline mr-1" />{req.category.name}</span>}
                    <span>By: {req.seekerName}</span>
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  {req.status === "open" && (
                    <>
                      <Button size="sm" variant="outline" className="h-7 text-xs text-red-600 hover:bg-red-50"
                        disabled={updating === req.id} onClick={() => updateStatus(req.id, "flagged")}>
                        <AlertTriangle className="w-3 h-3 mr-1" /> Flag
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs"
                        disabled={updating === req.id} onClick={() => updateStatus(req.id, "closed")}>
                        <XCircle className="w-3 h-3 mr-1" /> Close
                      </Button>
                    </>
                  )}
                  {req.status === "flagged" && (
                    <Button size="sm" variant="outline" className="h-7 text-xs text-green-600 hover:bg-green-50"
                      disabled={updating === req.id} onClick={() => updateStatus(req.id, "open")}>
                      <CheckCircle className="w-3 h-3 mr-1" /> Reopen
                    </Button>
                  )}
                  {req.status === "closed" && (
                    <Button size="sm" variant="outline" className="h-7 text-xs"
                      disabled={updating === req.id} onClick={() => updateStatus(req.id, "open")}>
                      <RefreshCw className="w-3 h-3 mr-1" /> Reopen
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Audit Log Panel ───────────────────────────────────────────────────────────
function AuditLogPanel() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(apiUrl("/api/admin/audit-log"))
      .then((r) => r.json())
      .then((d) => { setEntries(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>;
  if (entries.length === 0) return (
    <div className="p-10 text-center text-muted-foreground">
      <ScrollText className="w-10 h-10 mx-auto mb-3 text-muted-foreground/20" />
      <p>No audit log entries yet.</p>
      <p className="text-xs mt-1">Actions like approvals, rejections, and edits will appear here automatically.</p>
    </div>
  );

  const actionColors: Record<string, string> = {
    approve_caregiver: "bg-green-100 text-green-700",
    reject_caregiver: "bg-red-100 text-red-700",
    edit_caregiver: "bg-blue-100 text-blue-700",
    update_care_request_status: "bg-yellow-100 text-yellow-700",
  };

  return (
    <div className="divide-y divide-border/40">
      {entries.map((entry) => (
        <div key={entry.id} className="p-4 flex items-start gap-3">
          <div className={`px-2 py-0.5 rounded text-xs font-medium shrink-0 ${actionColors[entry.action] ?? "bg-gray-100 text-gray-700"}`}>
            {entry.action.replace(/_/g, " ")}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm">{entry.details || "No details"}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {entry.target_type} #{entry.target_id} · {new Date(entry.created_at).toLocaleString()}
              {entry.admin_clerk_id && ` · by ${entry.admin_clerk_id.slice(0, 12)}…`}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Enhanced Stats Dashboard ──────────────────────────────────────────────────
function StatsDashboard({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(apiUrl("/api/admin/stats"))
      .then((r) => r.json())
      .then((d) => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>;
  if (!stats) return <div className="p-10 text-center text-muted-foreground">Failed to load stats.</div>;

  const cards = [
    { label: "Total Caregivers", value: stats.totalCaregivers, icon: <Users className="w-5 h-5" />, bg: "bg-primary/5", ic: "bg-primary/20 text-primary", tab: "verified" },
    { label: "Pending Approval", value: stats.pendingCaregivers, icon: <ShieldCheck className="w-5 h-5" />, bg: "bg-yellow-50", ic: "bg-yellow-200 text-yellow-700", tab: "pending" },
    { label: "Verified", value: stats.verifiedCaregivers, icon: <CheckCircle className="w-5 h-5" />, bg: "bg-green-50", ic: "bg-green-200 text-green-700", tab: "verified" },
    { label: "New (30d)", value: stats.recentSignups, icon: <UserCog className="w-5 h-5" />, bg: "bg-indigo-50", ic: "bg-indigo-200 text-indigo-700", tab: "pending" },
    { label: "Open Requests", value: stats.openRequests, icon: <FolderOpen className="w-5 h-5" />, bg: "bg-orange-50", ic: "bg-orange-200 text-orange-700", tab: "care-requests" },
    { label: "Active Bookings", value: stats.activeBookings, icon: <BookOpen className="w-5 h-5" />, bg: "bg-blue-50", ic: "bg-blue-200 text-blue-700", tab: "care-requests" },
    { label: "Completed Bookings", value: stats.completedBookings, icon: <CheckCircle className="w-5 h-5" />, bg: "bg-teal-50", ic: "bg-teal-200 text-teal-700", tab: "care-requests" },
    { label: "Total Revenue", value: fmt(stats.totalRevenueCents ?? 0), icon: <DollarSign className="w-5 h-5" />, bg: "bg-emerald-50", ic: "bg-emerald-200 text-emerald-700", tab: "refunds" },
    { label: "Platform Fees", value: fmt(stats.platformFeeCents ?? 0), icon: <Banknote className="w-5 h-5" />, bg: "bg-rose-50", ic: "bg-rose-200 text-rose-700", tab: "refunds" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map(c => (
          <Card key={c.label} className={`${c.bg} border-border/50 cursor-pointer hover:shadow-md transition-shadow`} onClick={() => onNavigate(c.tab)}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2.5 rounded-xl shrink-0 ${c.ic}`}>{c.icon}</div>
              <div>
                <div className="text-2xl font-bold leading-none mb-1">{c.value}</div>
                <div className="text-xs text-muted-foreground leading-tight">{c.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {stats.categoryCounts && stats.categoryCounts.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {stats.categoryCounts.map((cat: any) => (
                <div key={cat.categoryName} className="flex items-center justify-between text-sm py-1.5 border-b border-border/30 last:border-0">
                  <span className="font-medium">{cat.categoryName}</span>
                  <div className="flex gap-4 text-muted-foreground text-xs">
                    <span>{cat.count} caregivers</span>
                    <span>{cat.requestCount ?? 0} requests</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Main Admin Panel ──────────────────────────────────────────────────────────
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

  const [rejectTarget, setRejectTarget] = useState<{ id: number; name: string; clerkId?: string | null } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [viewCaregiver, setViewCaregiver] = useState<any>(null);
  const [editCaregiver, setEditCaregiver] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("dashboard");

  const sendCaregiverMessage = async (caregiverClerkId: string, message: string) => {
    try {
      const convResp = await fetch(apiUrl("/api/conversations"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantAClerkId: "care_bridge_admin", participantBClerkId: caregiverClerkId }),
      });
      if (!convResp.ok) return;
      const conv = await convResp.json();
      await fetch(apiUrl(`/api/conversations/${conv.id}/messages`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderClerkId: "care_bridge_admin", content: message }),
      });
    } catch { /* silent */ }
  };

  const handleApprove = (id: number, clerkId?: string | null) => {
    approveCaregiver.mutate({ id }, {
      onSuccess: async () => {
        toast({ title: "Caregiver Approved", description: "The provider is now visible to seekers." });
        queryClient.invalidateQueries({ queryKey: getAdminListCaregiversQueryKey() });
        if (clerkId) {
          await sendCaregiverMessage(clerkId,
            "Congratulations! Your Care Bridge caregiver profile has been approved and is now live. Families in your area can now find and book you. Welcome to the Care Bridge network!"
          );
        }
      },
    });
  };

  const handleReject = (id: number, name: string, clerkId?: string | null) => {
    setRejectTarget({ id, name, clerkId });
    setRejectReason("");
  };

  const confirmReject = () => {
    if (!rejectTarget) return;
    rejectCaregiver.mutate({ id: rejectTarget.id }, {
      onSuccess: async () => {
        toast({ title: "Caregiver Deactivated", description: "The profile has been deactivated." });
        queryClient.invalidateQueries({ queryKey: getAdminListCaregiversQueryKey() });
        if (rejectTarget.clerkId) {
          const msg = rejectReason.trim()
            ? `Your Care Bridge caregiver profile has been deactivated. Reason: ${rejectReason.trim()}. Please contact support if you have questions.`
            : "Your Care Bridge caregiver profile has been deactivated. Please contact support for further information.";
          await sendCaregiverMessage(rejectTarget.clerkId, msg);
        }
        setRejectTarget(null);
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

  const renderCaregiverRow = (caregiver: any, showApprove: boolean) => (
    <div key={caregiver.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <Avatar className="h-12 w-12 border border-border shrink-0">
          <AvatarImage src={caregiver.avatarUrl ?? undefined} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">{caregiver.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="font-semibold text-lg flex items-center gap-2">
            {caregiver.name}
            {caregiver.isVerified && <ShieldCheck className="w-4 h-4 text-green-500 shrink-0" />}
          </div>
          <div className="text-sm text-muted-foreground">{caregiver.location} · ${caregiver.hourlyRate}/hr · {caregiver.yearsExperience ?? 0}yr exp</div>
          <div className="flex flex-wrap gap-1 mt-1">
            {caregiver.categories?.slice(0, 3).map((cat: any) => (
              <Badge key={cat.id} variant="outline" className="text-xs">{cat.name}</Badge>
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-1.5 shrink-0 flex-wrap">
        <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setViewCaregiver(caregiver)}>
          <Eye className="w-3.5 h-3.5 mr-1" /> View
        </Button>
        <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setEditCaregiver(caregiver)}>
          <Edit className="w-3.5 h-3.5 mr-1" /> Edit
        </Button>
        {showApprove ? (
          <>
            <Button size="sm" variant="outline" className="h-8 text-xs text-red-600 hover:bg-red-50"
              onClick={() => handleReject(caregiver.id, caregiver.name, (caregiver as any).clerkId)}>
              <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
            </Button>
            <Button size="sm" className="h-8 text-xs bg-green-600 hover:bg-green-700 text-white"
              onClick={() => handleApprove(caregiver.id, (caregiver as any).clerkId)}>
              <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
            </Button>
          </>
        ) : (
          <Button size="sm" variant="outline" className="h-8 text-xs text-red-600 hover:bg-red-50"
            onClick={() => handleReject(caregiver.id, caregiver.name, (caregiver as any).clerkId)}>
            <XCircle className="w-3.5 h-3.5 mr-1" /> Deactivate
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      {/* Dialogs */}
      <CaregiverDetailDialog caregiver={viewCaregiver} open={!!viewCaregiver} onClose={() => setViewCaregiver(null)} />
      <EditCaregiverDialog caregiver={editCaregiver} open={!!editCaregiver} onClose={() => setEditCaregiver(null)}
        onSaved={() => queryClient.invalidateQueries({ queryKey: getAdminListCaregiversQueryKey() })} />

      <Dialog open={!!rejectTarget} onOpenChange={(open) => { if (!open) setRejectTarget(null); }}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" /> Deactivate {rejectTarget?.name}?
            </DialogTitle>
            <DialogDescription>
              This will remove the caregiver from search results. They will receive an in-app notification with your reason.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <label className="text-sm font-medium">Reason (optional — sent to caregiver)</label>
            <Textarea placeholder="e.g. Incomplete documentation, failed background check, etc."
              value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} className="resize-none" />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRejectTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmReject} disabled={rejectCaregiver.isPending}>
              {rejectCaregiver.isPending ? "Deactivating…" : "Confirm Deactivate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mb-10">
        <h1 className="font-serif text-4xl font-bold mb-2">Admin Panel</h1>
        <p className="text-muted-foreground">Manage caregivers, care requests, reviews, and platform activity.</p>
      </div>

      const [activeTab, setActiveTab] = useState("dashboard");
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 flex-wrap gap-1">
          <TabsTrigger value="dashboard">
            <BarChart2 className="w-3.5 h-3.5 mr-1" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending
            {pendingCaregivers.length > 0 && (
              <Badge className="ml-2 bg-yellow-500/20 text-yellow-700 border-0 text-xs">{pendingCaregivers.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="verified">Verified</TabsTrigger>
          <TabsTrigger value="care-requests">
            <FolderOpen className="w-3.5 h-3.5 mr-1" /> Requests
          </TabsTrigger>
          <TabsTrigger value="reviews">
            Reviews
            {pendingReviews.length > 0 && (
              <Badge className="ml-2 bg-blue-500/20 text-blue-700 border-0 text-xs">{pendingReviews.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="refunds">Refunds</TabsTrigger>
          <TabsTrigger value="disputed">
            <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Disputed
          </TabsTrigger>
          <TabsTrigger value="audit">
            <ScrollText className="w-3.5 h-3.5 mr-1" /> Audit Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard"><StatsDashboard onNavigate={setActiveTab} /></TabsContent>

        <TabsContent value="pending">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="border-b border-border/40 bg-muted/20">
              <CardTitle>Awaiting Approval</CardTitle>
              <CardDescription>Review full application details before approving caregiver profiles.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingCaregivers ? (
                <div className="p-6 space-y-4">{[1,2].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
              ) : pendingCaregivers.length === 0 ? (
                <div className="p-10 text-center text-muted-foreground">No pending caregivers. All profiles are up to date.</div>
              ) : (
                <div className="divide-y divide-border/40">{pendingCaregivers.map(c => renderCaregiverRow(c, true))}</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verified">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="border-b border-border/40 bg-muted/20">
              <CardTitle>Verified Caregivers</CardTitle>
              <CardDescription>Active caregivers visible to care seekers.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingCaregivers ? (
                <div className="p-6 space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
              ) : verifiedCaregivers.length === 0 ? (
                <div className="p-10 text-center text-muted-foreground">No verified caregivers yet.</div>
              ) : (
                <div className="divide-y divide-border/40">{verifiedCaregivers.map(c => renderCaregiverRow(c, false))}</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="care-requests">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="border-b border-border/40 bg-muted/20">
              <CardTitle>Care Requests</CardTitle>
              <CardDescription>View, flag, or close care requests submitted by families.</CardDescription>
            </CardHeader>
            <CardContent className="p-0"><CareRequestsPanel /></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="border-b border-border/40 bg-muted/20">
              <CardTitle>Review Moderation</CardTitle>
              <CardDescription>Approve or reject submitted ratings before they go live.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingReviews ? (
                <div className="p-6 space-y-4">{[1,2].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
              ) : pendingReviews.length === 0 ? (
                <div className="p-10 text-center text-muted-foreground">No pending reviews to moderate.</div>
              ) : (
                <div className="divide-y divide-border/40">
                  {pendingReviews.map(review => {
                    const isSelfReview =
                      review.reviewerClerkId &&
                      (review as any).caregiverClerkId &&
                      review.reviewerClerkId === (review as any).caregiverClerkId;
                    return (
                      <div key={review.id} className={`p-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${isSelfReview ? "bg-red-50 border-l-4 border-red-400" : ""}`}>
                        <div className="flex-1">
                          {isSelfReview && (
                            <Badge className="bg-red-100 text-red-700 border-red-300 mb-2">Self-Review Detected</Badge>
                          )}
                          <div className="flex items-center gap-1 mb-1">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-4 h-4 ${i < review.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`} />
                            ))}
                            <span className="text-sm ml-2 text-muted-foreground">for caregiver #{review.caregiverId}</span>
                          </div>
                          <p className="text-sm mt-1">{review.comment || "No comment"}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50"
                            onClick={() => handleReviewStatus(review.id, "rejected")}>
                            <XCircle className="w-4 h-4 mr-1" /> Reject
                          </Button>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleReviewStatus(review.id, "approved")}
                            disabled={!!isSelfReview}>
                            <CheckCircle className="w-4 h-4 mr-1" /> Approve
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="refunds">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="border-b border-border/40 bg-muted/20">
              <CardTitle>Refund Management</CardTitle>
              <CardDescription>Review cancellations and apply refund overrides.</CardDescription>
            </CardHeader>
            <CardContent className="p-0"><RefundPanel /></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="disputed">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="border-b border-border/40 bg-muted/20">
              <CardTitle>Disputed Services</CardTitle>
              <CardDescription>Cancelled bookings that may need resolution.</CardDescription>
            </CardHeader>
            <CardContent className="p-0"><DisputedPanel /></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="border-b border-border/40 bg-muted/20">
              <CardTitle>Audit Log</CardTitle>
              <CardDescription>Complete history of admin actions — approvals, rejections, edits, and status changes.</CardDescription>
            </CardHeader>
            <CardContent className="p-0"><AuditLogPanel /></CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
