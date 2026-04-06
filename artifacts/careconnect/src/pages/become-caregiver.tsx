import { useCreateCaregiver, useListCategories } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useGeolocation } from "@/hooks/use-geolocation";
import { motion, AnimatePresence } from "framer-motion";
import {
  HeartHandshake, User, Briefcase, ShieldCheck, Award, MapPin,
  DollarSign, FileCheck, ChevronRight, ChevronLeft, LocateFixed, Loader2, Check
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Requirement matrix ────────────────────────────────────────────────────────
// Categories (slugs): child-care, newborn-care, postpartum-care, elderly-care,
//                     pet-care, house-help, kitchen-food-help, event-support,
//                     travel-medical-care, special-needs-care
// R = required, O = optional, N = not applicable

type ReqLevel = "R" | "O" | "N";

type FieldReq = {
  [fieldKey: string]: { [categorySlug: string]: ReqLevel };
};

const FIELD_REQUIREMENTS: FieldReq = {
  pastWorkReferences: {
    "child-care": "O", "newborn-care": "R", "postpartum-care": "R",
    "elderly-care": "O", "pet-care": "O", "house-help": "O",
    "kitchen-food-help": "O", "event-support": "R",
    "travel-medical-care": "N", "special-needs-care": "O",
  },
  backgroundCheckConsent: {
    "child-care": "R", "newborn-care": "R", "postpartum-care": "R",
    "elderly-care": "O", "pet-care": "R", "house-help": "R",
    "kitchen-food-help": "O", "event-support": "R",
    "travel-medical-care": "N", "special-needs-care": "R",
  },
  policeVerification: {
    "child-care": "R", "newborn-care": "R", "postpartum-care": "R",
    "elderly-care": "O", "pet-care": "R", "house-help": "O",
    "kitchen-food-help": "O", "event-support": "R",
    "travel-medical-care": "N", "special-needs-care": "R",
  },
  medicalFitnessDeclaration: {
    "child-care": "R", "newborn-care": "R", "postpartum-care": "R",
    "elderly-care": "N", "pet-care": "N", "house-help": "R",
    "kitchen-food-help": "N", "event-support": "R",
    "travel-medical-care": "N", "special-needs-care": "R",
  },
  certifications: {
    "child-care": "O", "newborn-care": "R", "postpartum-care": "R",
    "elderly-care": "O", "pet-care": "O", "house-help": "R",
    "kitchen-food-help": "O", "event-support": "R",
    "travel-medical-care": "R", "special-needs-care": "R",
  },
  medicalNursingLicense: {
    "child-care": "O", "newborn-care": "O", "postpartum-care": "O",
    "elderly-care": "O", "pet-care": "N", "house-help": "N",
    "kitchen-food-help": "N", "event-support": "R",
    "travel-medical-care": "R", "special-needs-care": "R",
  },
  foodSafetyCertificate: {
    "child-care": "N", "newborn-care": "O", "postpartum-care": "O",
    "elderly-care": "N", "pet-care": "N", "house-help": "R",
    "kitchen-food-help": "N", "event-support": "N",
    "travel-medical-care": "N", "special-needs-care": "N",
  },
  insuranceLicense: {
    "child-care": "O", "newborn-care": "N", "postpartum-care": "N",
    "elderly-care": "N", "pet-care": "N", "house-help": "N",
    "kitchen-food-help": "N", "event-support": "N",
    "travel-medical-care": "R", "special-needs-care": "O",
  },
  liabilityWaiverAccepted: {
    "child-care": "R", "newborn-care": "R", "postpartum-care": "R",
    "elderly-care": "O", "pet-care": "R", "house-help": "R",
    "kitchen-food-help": "R", "event-support": "R",
    "travel-medical-care": "R", "special-needs-care": "R",
  },
};

function getReqLevel(fieldKey: string, slugs: string[]): ReqLevel {
  if (slugs.length === 0) return "O";
  const fieldMap = FIELD_REQUIREMENTS[fieldKey];
  if (!fieldMap) return "O";
  const levels = slugs.map((s) => fieldMap[s] ?? "O");
  if (levels.includes("R")) return "R";
  if (levels.every((l) => l === "N")) return "N";
  return "O";
}

function ReqBadge({ level }: { level: ReqLevel }) {
  if (level === "R") return <span className="text-xs font-medium text-red-500 ml-1">(Required)</span>;
  if (level === "O") return <span className="text-xs text-muted-foreground ml-1">(Optional)</span>;
  return null;
}

// ── Form schema ───────────────────────────────────────────────────────────────
const formSchema = z.object({
  // Step 1
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(7, "Phone number is required"),
  categoryIds: z.array(z.number()).min(1, "Select at least one category"),
  // Step 2
  yearsExperience: z.coerce.number().min(0),
  bio: z.string().min(30, "Please describe your services (min 30 chars)"),
  languages: z.string().optional(),
  pastWorkReferences: z.string().optional(),
  // Step 3
  backgroundCheckConsent: z.boolean().optional(),
  policeVerification: z.boolean().optional(),
  medicalFitnessDeclaration: z.boolean().optional(),
  // Step 4
  certifications: z.string().optional(),
  medicalNursingLicense: z.string().optional(),
  foodSafetyCertificate: z.boolean().optional(),
  insuranceLicense: z.string().optional(),
  // Step 5
  location: z.string().min(3, "Location is required"),
  serviceRadius: z.string().optional(),
  onSiteRemote: z.string().optional(),
  availabilitySchedule: z.string().min(3, "Please describe your availability"),
  // Step 6
  hourlyRate: z.coerce.number().min(10, "Minimum rate is $10"),
  pricingUnit: z.string().default("hourly"),
  // Step 7
  termsAccepted: z.literal(true, { errorMap: () => ({ message: "You must accept the Terms of Service" }) }),
  codeOfConductAccepted: z.literal(true, { errorMap: () => ({ message: "You must accept the Code of Conduct" }) }),
  liabilityWaiverAccepted: z.boolean().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const STEPS = [
  { id: 1, label: "Account", icon: User },
  { id: 2, label: "Experience", icon: Briefcase },
  { id: 3, label: "Safety", icon: ShieldCheck },
  { id: 4, label: "Licenses", icon: Award },
  { id: 5, label: "Logistics", icon: MapPin },
  { id: 6, label: "Pricing", icon: DollarSign },
  { id: 7, label: "Agreement", icon: FileCheck },
];

export default function BecomeCaregiver() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const { toast } = useToast();
  const { data: categories } = useListCategories();
  const createCaregiver = useCreateCaregiver();
  const geo = useGeolocation();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "", phone: "", categoryIds: [],
      yearsExperience: 1, bio: "", languages: "", pastWorkReferences: "",
      backgroundCheckConsent: false, policeVerification: false, medicalFitnessDeclaration: false,
      certifications: "", medicalNursingLicense: "", foodSafetyCertificate: false, insuranceLicense: "",
      location: "", serviceRadius: "", onSiteRemote: "on-site", availabilitySchedule: "",
      hourlyRate: 25, pricingUnit: "hourly",
      termsAccepted: undefined as any, codeOfConductAccepted: undefined as any, liabilityWaiverAccepted: false,
    },
    mode: "onChange",
  });

  const selectedCategoryIds = form.watch("categoryIds");
  const selectedSlugs = categories
    ?.filter((c) => selectedCategoryIds.includes(c.id))
    .map((c) => c.slug) ?? [];

  // Auto-fill location when geo detects
  useEffect(() => {
    if (geo.location) {
      form.setValue("location", geo.location);
    }
  }, [geo.location, form]);

  const stepFields: Record<number, (keyof FormValues)[]> = {
    1: ["name", "phone", "categoryIds"],
    2: ["yearsExperience", "bio", "languages", "pastWorkReferences"],
    3: ["backgroundCheckConsent", "policeVerification", "medicalFitnessDeclaration"],
    4: ["certifications", "medicalNursingLicense", "foodSafetyCertificate", "insuranceLicense"],
    5: ["location", "serviceRadius", "onSiteRemote", "availabilitySchedule"],
    6: ["hourlyRate", "pricingUnit"],
    7: ["termsAccepted", "codeOfConductAccepted", "liabilityWaiverAccepted"],
  };

  const validateStep = async (step: number) => {
    const fields = stepFields[step];
    const result = await form.trigger(fields);
    return result;
  };

  const handleNext = async () => {
    const valid = await validateStep(currentStep);
    if (valid) setCurrentStep((s) => Math.min(s + 1, 7));
  };

  const handleBack = () => setCurrentStep((s) => Math.max(s - 1, 1));

  function onSubmit(data: FormValues) {
    createCaregiver.mutate({ data }, {
      onSuccess: (result) => {
        toast({
          title: "Welcome to CareConnect!",
          description: "Your profile is under review and will be activated shortly.",
        });
        setLocation(`/caregivers/${result.id}`);
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to create profile. Please try again.", variant: "destructive" });
      },
    });
  }

  return (
    <div className="min-h-screen bg-muted/10 py-12 md:py-20">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <HeartHandshake className="w-4 h-4" /> Join Our Network
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">Become a Caregiver</h1>
          <p className="text-lg text-muted-foreground">
            Complete your registration to connect with families who need your care.
          </p>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-between mb-8 px-2">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isComplete = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1">
                  <div className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all",
                    isComplete ? "bg-primary border-primary text-primary-foreground" :
                    isCurrent ? "border-primary text-primary bg-primary/10" :
                    "border-border text-muted-foreground bg-background"
                  )}>
                    {isComplete ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={cn(
                    "text-xs font-medium hidden sm:block",
                    isCurrent ? "text-primary" : isComplete ? "text-muted-foreground" : "text-muted-foreground/40"
                  )}>
                    {step.label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={cn("flex-1 h-0.5 mx-1 sm:mx-2 mt-0 sm:-mt-5 transition-colors", isComplete ? "bg-primary" : "bg-border")} />
                )}
              </div>
            );
          })}
        </div>

        <Card className="border-border/50 shadow-xl overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-primary via-secondary to-primary" style={{
            backgroundSize: `${(currentStep / 7) * 100}% 100%`,
            backgroundRepeat: "no-repeat",
          }} />
          <CardHeader className="pb-2 pt-6 px-6 md:px-10 border-b border-border/40">
            <CardTitle className="font-serif text-2xl flex items-center gap-3">
              {(() => { const Icon = STEPS[currentStep - 1].icon; return <Icon className="w-6 h-6 text-primary" />; })()}
              {currentStep === 1 ? "Basic Account & Identity" :
               currentStep === 2 ? "Experience & Skills" :
               currentStep === 3 ? "Background & Safety Checks" :
               currentStep === 4 ? "Certifications & Licenses" :
               currentStep === 5 ? "Service Logistics" :
               currentStep === 6 ? "Pricing & Payment" :
               "Compliance & Agreement"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 px-6 md:px-10 pb-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >

                    {/* ── Step 1: Basic Account ─────────────────────────────── */}
                    {currentStep === 1 && (
                      <>
                        <div className="grid md:grid-cols-2 gap-5">
                          <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name <span className="text-red-500">*</span></FormLabel>
                              <FormControl><Input placeholder="Jane Smith" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="phone" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number <span className="text-red-500">*</span></FormLabel>
                              <FormControl><Input placeholder="+1 (555) 000-0000" type="tel" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>

                        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl p-4 text-sm text-amber-800 dark:text-amber-300">
                          A Government ID and Profile Photo will be required during identity verification after registration.
                        </div>

                        <div className="space-y-2">
                          <div className="mb-3">
                            <p className="text-base font-medium leading-none">Care Specialties <span className="text-red-500">*</span></p>
                            <p className="text-sm text-muted-foreground mt-1">Select all categories where you offer professional services.</p>
                          </div>
                          <div className="grid sm:grid-cols-2 gap-2 bg-muted/20 p-4 rounded-xl border border-border/40">
                            {categories?.map((item) => (
                              <div key={item.id} className="flex flex-row items-center space-x-3 py-1.5">
                                <Checkbox
                                  id={`cat-${item.id}`}
                                  checked={selectedCategoryIds?.includes(item.id)}
                                  onCheckedChange={(checked) => {
                                    const vals = form.getValues("categoryIds");
                                    if (checked) {
                                      form.setValue("categoryIds", [...vals, item.id], { shouldValidate: true });
                                    } else {
                                      form.setValue("categoryIds", vals.filter((v) => v !== item.id), { shouldValidate: true });
                                    }
                                  }}
                                />
                                <label htmlFor={`cat-${item.id}`} className="font-normal cursor-pointer text-sm leading-none">
                                  {item.name}
                                </label>
                              </div>
                            ))}
                          </div>
                          {form.formState.errors.categoryIds && (
                            <p className="text-sm font-medium text-destructive mt-2">
                              {form.formState.errors.categoryIds.message as string}
                            </p>
                          )}
                        </div>
                      </>
                    )}

                    {/* ── Step 2: Experience & Skills ────────────────────────── */}
                    {currentStep === 2 && (
                      <>
                        <div className="grid md:grid-cols-2 gap-5">
                          <FormField control={form.control} name="yearsExperience" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Years of Experience <span className="text-red-500">*</span></FormLabel>
                              <FormControl><Input type="number" min="0" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="languages" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Languages Spoken <ReqBadge level="O" /></FormLabel>
                              <FormControl><Input placeholder="English, Spanish" {...field} /></FormControl>
                            </FormItem>
                          )} />
                        </div>

                        <FormField control={form.control} name="bio" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Service Description <span className="text-red-500">*</span></FormLabel>
                            <FormDescription>Describe your background, experience, and care approach.</FormDescription>
                            <FormControl>
                              <Textarea placeholder="I have been working as a caregiver for over 5 years, specialising in..." className="min-h-[140px] resize-y" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />

                        {getReqLevel("pastWorkReferences", selectedSlugs) !== "N" && (
                          <FormField control={form.control} name="pastWorkReferences" render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Past Work References
                                <ReqBadge level={getReqLevel("pastWorkReferences", selectedSlugs)} />
                              </FormLabel>
                              <FormDescription>List previous employers or families you have worked with (name + contact).</FormDescription>
                              <FormControl>
                                <Textarea placeholder="Reference 1: Jane Doe, +1 555-1234&#10;Reference 2: ..." rows={3} {...field} />
                              </FormControl>
                            </FormItem>
                          )} />
                        )}
                      </>
                    )}

                    {/* ── Step 3: Background & Safety ────────────────────────── */}
                    {currentStep === 3 && (
                      <>
                        <p className="text-sm text-muted-foreground bg-muted/30 rounded-xl p-4 border border-border/40">
                          Safety checks ensure trust and security for the families you serve. Requirements vary by care category.
                        </p>
                        {getReqLevel("backgroundCheckConsent", selectedSlugs) !== "N" && (
                          <FormField control={form.control} name="backgroundCheckConsent" render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border border-border/50 p-4 bg-muted/10">
                              <FormControl>
                                <Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} />
                              </FormControl>
                              <div className="space-y-1">
                                <FormLabel className="cursor-pointer font-medium">
                                  Background Check Consent
                                  <ReqBadge level={getReqLevel("backgroundCheckConsent", selectedSlugs)} />
                                </FormLabel>
                                <FormDescription>I consent to a background check being conducted on my behalf.</FormDescription>
                              </div>
                            </FormItem>
                          )} />
                        )}

                        {getReqLevel("policeVerification", selectedSlugs) !== "N" && (
                          <FormField control={form.control} name="policeVerification" render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border border-border/50 p-4 bg-muted/10">
                              <FormControl>
                                <Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} />
                              </FormControl>
                              <div className="space-y-1">
                                <FormLabel className="cursor-pointer font-medium">
                                  Police Verification
                                  <ReqBadge level={getReqLevel("policeVerification", selectedSlugs)} />
                                </FormLabel>
                                <FormDescription>I confirm that I will submit or have submitted a police clearance certificate.</FormDescription>
                              </div>
                            </FormItem>
                          )} />
                        )}

                        {getReqLevel("medicalFitnessDeclaration", selectedSlugs) !== "N" && (
                          <FormField control={form.control} name="medicalFitnessDeclaration" render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border border-border/50 p-4 bg-muted/10">
                              <FormControl>
                                <Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} />
                              </FormControl>
                              <div className="space-y-1">
                                <FormLabel className="cursor-pointer font-medium">
                                  Medical Fitness Declaration
                                  <ReqBadge level={getReqLevel("medicalFitnessDeclaration", selectedSlugs)} />
                                </FormLabel>
                                <FormDescription>I declare that I am medically fit to perform caregiving duties.</FormDescription>
                              </div>
                            </FormItem>
                          )} />
                        )}

                        {getReqLevel("backgroundCheckConsent", selectedSlugs) === "N" &&
                          getReqLevel("policeVerification", selectedSlugs) === "N" &&
                          getReqLevel("medicalFitnessDeclaration", selectedSlugs) === "N" && (
                          <div className="text-center py-8 text-muted-foreground text-sm">
                            No safety checks are required for your selected care categories.
                          </div>
                        )}
                      </>
                    )}

                    {/* ── Step 4: Certifications & Licenses ──────────────────── */}
                    {currentStep === 4 && (
                      <>
                        {getReqLevel("certifications", selectedSlugs) !== "N" && (
                          <FormField control={form.control} name="certifications" render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Professional Certifications
                                <ReqBadge level={getReqLevel("certifications", selectedSlugs)} />
                              </FormLabel>
                              <FormDescription>List relevant certifications (e.g., CPR, First Aid, CNA).</FormDescription>
                              <FormControl>
                                <Textarea placeholder="CPR Certified (2024), First Aid Training, ..." rows={3} {...field} />
                              </FormControl>
                            </FormItem>
                          )} />
                        )}

                        {getReqLevel("medicalNursingLicense", selectedSlugs) !== "N" && (
                          <FormField control={form.control} name="medicalNursingLicense" render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Medical / Nursing License Number
                                <ReqBadge level={getReqLevel("medicalNursingLicense", selectedSlugs)} />
                              </FormLabel>
                              <FormControl><Input placeholder="RN-12345678" {...field} /></FormControl>
                            </FormItem>
                          )} />
                        )}

                        {getReqLevel("foodSafetyCertificate", selectedSlugs) !== "N" && (
                          <FormField control={form.control} name="foodSafetyCertificate" render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border border-border/50 p-4 bg-muted/10">
                              <FormControl>
                                <Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} />
                              </FormControl>
                              <div className="space-y-1">
                                <FormLabel className="cursor-pointer font-medium">
                                  Food Safety Certificate
                                  <ReqBadge level={getReqLevel("foodSafetyCertificate", selectedSlugs)} />
                                </FormLabel>
                                <FormDescription>I hold a valid food safety or food handler's certificate.</FormDescription>
                              </div>
                            </FormItem>
                          )} />
                        )}

                        {getReqLevel("insuranceLicense", selectedSlugs) !== "N" && (
                          <FormField control={form.control} name="insuranceLicense" render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Insurance License Number
                                <ReqBadge level={getReqLevel("insuranceLicense", selectedSlugs)} />
                              </FormLabel>
                              <FormControl><Input placeholder="INS-98765" {...field} /></FormControl>
                            </FormItem>
                          )} />
                        )}

                        {getReqLevel("certifications", selectedSlugs) === "N" &&
                          getReqLevel("medicalNursingLicense", selectedSlugs) === "N" &&
                          getReqLevel("foodSafetyCertificate", selectedSlugs) === "N" &&
                          getReqLevel("insuranceLicense", selectedSlugs) === "N" && (
                          <div className="text-center py-8 text-muted-foreground text-sm">
                            No licenses are required for your selected care categories.
                          </div>
                        )}
                      </>
                    )}

                    {/* ── Step 5: Service Logistics ───────────────────────────── */}
                    {currentStep === 5 && (
                      <>
                        <FormField control={form.control} name="location" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Service Location <span className="text-red-500">*</span></FormLabel>
                            <FormDescription>The primary city or area where you offer services.</FormDescription>
                            <FormControl>
                              <div className="flex gap-2">
                                <div className="relative flex-1">
                                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input placeholder="City, State" className="pl-9" {...field} />
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="shrink-0 h-10 w-10"
                                  onClick={geo.detectLocation}
                                  disabled={geo.isDetecting}
                                  title="Detect my location"
                                >
                                  {geo.isDetecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
                                </Button>
                              </div>
                            </FormControl>
                            {geo.error && <p className="text-xs text-destructive">{geo.error}</p>}
                            <FormMessage />
                          </FormItem>
                        )} />

                        <div className="grid md:grid-cols-2 gap-5">
                          <FormField control={form.control} name="serviceRadius" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Service Radius <ReqBadge level="O" /></FormLabel>
                              <FormControl><Input placeholder="e.g. 10 miles, 20 km" {...field} /></FormControl>
                            </FormItem>
                          )} />

                          <FormField control={form.control} name="onSiteRemote" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Work Setting <ReqBadge level="O" /></FormLabel>
                              <Select onValueChange={field.onChange} value={field.value ?? "on-site"}>
                                <FormControl>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="on-site">On-site only</SelectItem>
                                  <SelectItem value="remote">Remote / Virtual</SelectItem>
                                  <SelectItem value="both">Both on-site and remote</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )} />
                        </div>

                        <FormField control={form.control} name="availabilitySchedule" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Availability Schedule <span className="text-red-500">*</span></FormLabel>
                            <FormDescription>Describe your typical availability (days, hours, overnight, etc.).</FormDescription>
                            <FormControl>
                              <Textarea placeholder="Monday–Friday, 8am–6pm. Available weekends with advance notice. No overnight shifts." rows={3} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </>
                    )}

                    {/* ── Step 6: Pricing & Payment ───────────────────────────── */}
                    {currentStep === 6 && (
                      <>
                        <div className="grid md:grid-cols-2 gap-5">
                          <FormField control={form.control} name="hourlyRate" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Base Rate <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                  <Input type="number" className="pl-7" min="10" {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />

                          <FormField control={form.control} name="pricingUnit" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Pricing Unit <span className="text-red-500">*</span></FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="hourly">Per Hour</SelectItem>
                                  <SelectItem value="daily">Per Day</SelectItem>
                                  <SelectItem value="weekly">Per Week</SelectItem>
                                  <SelectItem value="project">Per Project</SelectItem>
                                  <SelectItem value="visit">Per Visit</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )} />
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 rounded-xl p-4 text-sm text-blue-800 dark:text-blue-300">
                          Bank account details for payouts will be collected securely after your profile is approved. CareConnect uses encrypted banking connections.
                        </div>
                      </>
                    )}

                    {/* ── Step 7: Compliance & Agreement ─────────────────────── */}
                    {currentStep === 7 && (
                      <>
                        <p className="text-sm text-muted-foreground">
                          Please review and accept all applicable agreements before submitting your application.
                        </p>

                        <FormField control={form.control} name="termsAccepted" render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border border-border/50 p-4 bg-muted/10">
                            <FormControl>
                              <Checkbox
                                checked={field.value === true}
                                onCheckedChange={(v) => field.onChange(v === true ? true : undefined)}
                              />
                            </FormControl>
                            <div className="space-y-1">
                              <FormLabel className="cursor-pointer font-medium">
                                Terms & Privacy Policy <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormDescription>
                                I have read and agree to CareConnect's Terms of Service and Privacy Policy.
                              </FormDescription>
                              <FormMessage />
                            </div>
                          </FormItem>
                        )} />

                        <FormField control={form.control} name="codeOfConductAccepted" render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border border-border/50 p-4 bg-muted/10">
                            <FormControl>
                              <Checkbox
                                checked={field.value === true}
                                onCheckedChange={(v) => field.onChange(v === true ? true : undefined)}
                              />
                            </FormControl>
                            <div className="space-y-1">
                              <FormLabel className="cursor-pointer font-medium">
                                Code of Conduct <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormDescription>
                                I agree to uphold CareConnect's professional Code of Conduct and treat all clients with dignity and respect.
                              </FormDescription>
                              <FormMessage />
                            </div>
                          </FormItem>
                        )} />

                        {getReqLevel("liabilityWaiverAccepted", selectedSlugs) !== "N" && (
                          <FormField control={form.control} name="liabilityWaiverAccepted" render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border border-border/50 p-4 bg-muted/10">
                              <FormControl>
                                <Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} />
                              </FormControl>
                              <div className="space-y-1">
                                <FormLabel className="cursor-pointer font-medium">
                                  Liability Waiver
                                  <ReqBadge level={getReqLevel("liabilityWaiverAccepted", selectedSlugs)} />
                                </FormLabel>
                                <FormDescription>
                                  I acknowledge the liability waiver and understand the limits of CareConnect's coverage.
                                </FormDescription>
                              </div>
                            </FormItem>
                          )} />
                        )}
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Navigation Buttons */}
                <div className="flex gap-3 mt-8 pt-6 border-t border-border/40">
                  {currentStep > 1 && (
                    <Button type="button" variant="outline" onClick={handleBack} className="flex-1 sm:flex-none">
                      <ChevronLeft className="w-4 h-4 mr-1" /> Back
                    </Button>
                  )}
                  <div className="flex-1" />
                  {currentStep < 7 ? (
                    <Button type="button" onClick={handleNext} className="flex-1 sm:flex-none rounded-full">
                      Continue <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  ) : (
                    <Button type="submit" size="lg" className="flex-1 sm:flex-none rounded-full h-12 shadow-md" disabled={createCaregiver.isPending}>
                      {createCaregiver.isPending ? "Submitting..." : "Submit Application"}
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Step {currentStep} of {STEPS.length} — Your information is encrypted and secure.
        </p>
      </div>
    </div>
  );
}
