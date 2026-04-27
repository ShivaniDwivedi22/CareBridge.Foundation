//import {
  useGetCaregiver,
  useCreateBooking,
  useListReviews,
  useCreateReview,
  getGetCaregiverQueryKey,
  getListReviewsQueryKey,
} from "@workspace/api-client-react";
import {
  useGetCaregiver,
  useCreateBooking,
  useListReviews,
  useCreateReview,
  getGetCaregiverQueryKey,
  getListReviewsQueryKey,
} from "@/hooks/api-hooks";
import { useParams, Link, useLocation } from "wouter";
import { useState } from "react";
// import { useUser, SignedIn, SignedOut } from "@clerk/react";
import { useUser } from "@clerk/react";
import { SignedIn, SignedOut } from "@/components/clerk-helpers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Star, MapPin, ShieldCheck, Clock, Award, ChevronLeft,
  Calendar, Languages, Briefcase, Lock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function CaregiverDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useUser();
  const queryClient = useQueryClient();

  const [message, setMessage] = useState("");
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewerName, setReviewerName] = useState("");

  const { data: caregiver, isLoading } = useGetCaregiver(id, {
    query: { enabled: !!id, queryKey: getGetCaregiverQueryKey(id) },
  });

  const { data: reviews } = useListReviews(
    { caregiverId: id, status: "approved" },
    { query: { queryKey: getListReviewsQueryKey({ caregiverId: id, status: "approved" }) } }
  );

  const createBooking = useCreateBooking();
  const createReview = useCreateReview();

  // ✅ Issue 9: derive self-review flag here so it's used consistently
  const isSelf = !!(user?.id && caregiver?.clerkId && user.id === caregiver.clerkId);

  const handleBook = () => {
    createBooking.mutate({
      data: {
        caregiverId: id,
        careRequestId: 1,
        message,
        seekerClerkId: user?.id,
      },
    }, {
      onSuccess: () => {
        setIsBookingOpen(false);
        toast({
          title: "Booking Request Sent",
          description: `Your request has been sent to ${caregiver?.name}. They will respond shortly.`,
        });
        setLocation("/dashboard");
      },
    });
  };

  const handleReview = () => {
    // ✅ Issue 9: double-check self-review client-side before submitting
    if (isSelf) {
      toast({
        title: "Not allowed",
        description: "You cannot review your own profile.",
        variant: "destructive",
      });
      return;
    }

    createReview.mutate({
      data: {
        caregiverId: id,
        rating: reviewRating,
        comment: reviewComment,
        reviewerName: user
          ? (user.firstName ?? user.emailAddresses[0]?.emailAddress ?? reviewerName)
          : reviewerName,
        reviewerClerkId: user?.id,
      },
    }, {
      onSuccess: () => {
        setIsReviewOpen(false);
        setReviewComment("");
        setReviewerName("");
        toast({
          title: "Review Submitted",
          description: "Your review has been submitted and will be visible after moderation.",
        });
        queryClient.invalidateQueries({
          queryKey: getListReviewsQueryKey({ caregiverId: id, status: "approved" }),
        });
      },
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-32 mb-8" />
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-1 space-y-6">
            <Skeleton className="h-[400px] rounded-2xl w-full" />
          </div>
          <div className="md:col-span-2 space-y-6">
            <Skeleton className="h-16 w-3/4" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!caregiver) return <div>Not found</div>;

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <Link href="/caregivers" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-8 transition-colors">
        <ChevronLeft className="w-4 h-4 mr-1" /> Back to Caregivers
      </Link>

      <div className="grid md:grid-cols-3 gap-8 lg:gap-12">

        {/* ── Left Column: Profile Card ─────────────────────────────────── */}
        <div className="md:col-span-1">
          <Card className="sticky top-24 border-border/50 shadow-lg overflow-hidden">
            <div className="h-24 bg-primary/10" />
            <div className="px-6 pt-0 pb-6 text-center">
              <Avatar className="w-32 h-32 border-4 border-background shadow-md mx-auto -mt-16 mb-4">
                <AvatarImage src={caregiver.avatarUrl ?? undefined} alt={caregiver.name} className="object-cover" />
                <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                  {caregiver.name.charAt(0)}
                </AvatarFallback>
              </Avatar>

              <h1 className="text-2xl font-serif font-bold flex items-center justify-center gap-2 mb-1">
                {caregiver.name}
                {caregiver.isVerified && <ShieldCheck className="w-5 h-5 text-green-500" />}
              </h1>

              {caregiver.backgroundCheckConsent && caregiver.policeVerification && caregiver.medicalFitnessDeclaration && (
                <div className="inline-flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-2">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Background Checked
                </div>
              )}

              <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-4">
                <MapPin className="w-4 h-4" />
                {caregiver.location}
              </div>

              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="text-center">
                  <div className="flex items-center justify-center text-yellow-500 font-bold mb-1">
                    <Star className="w-4 h-4 fill-current mr-1" />
                    {caregiver.rating.toFixed(1)}
                  </div>
                  <div className="text-xs text-muted-foreground">{caregiver.reviewCount} reviews</div>
                </div>
                <div className="w-px h-8 bg-border" />
                <div className="text-center">
                  <div className="font-bold mb-1">${caregiver.hourlyRate}</div>
                  <div className="text-xs text-muted-foreground">per hour</div>
                </div>
                <div className="w-px h-8 bg-border" />
                <div className="text-center">
                  <div className="font-bold mb-1">{caregiver.yearsExperience}y</div>
                  <div className="text-xs text-muted-foreground">experience</div>
                </div>
              </div>

              <div className="space-y-3">
                {/* ✅ Fix: replaced Show with SignedIn/SignedOut */}
                <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
                  <SignedIn>
                    {/* ✅ Issue 9: prevent caregiver from booking themselves */}
                    {isSelf ? (
                      <Button className="w-full rounded-full h-12 text-lg" disabled>
                        This is your profile
                      </Button>
                    ) : (
                      <DialogTrigger asChild>
                        <Button className="w-full rounded-full h-12 text-lg shadow-sm">
                          Book Now
                        </Button>
                      </DialogTrigger>
                    )}
                  </SignedIn>
                  <SignedOut>
                    <Button className="w-full rounded-full h-12 text-lg shadow-sm" asChild>
                      <Link href="/sign-in">Book Now</Link>
                    </Button>
                  </SignedOut>

                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Book {caregiver.name}</DialogTitle>
                      <DialogDescription>
                        Describe your care needs. {caregiver.name} will review and accept your request. Contact details are revealed after payment.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Describe Your Care Needs</label>
                        <Textarea
                          placeholder="Hi, I'm looking for care for my mother. She needs help with..."
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          rows={4}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsBookingOpen(false)}>Cancel</Button>
                      <Button onClick={handleBook} disabled={createBooking.isPending}>
                        {createBooking.isPending ? "Sending..." : "Send Request"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800">
                  <Lock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>Contact details revealed only after payment — your family's safety first.</span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mt-4 text-center">
                Usually responds within 24 hours
              </p>

              <div className="mt-5 pt-5 border-t border-border/40 space-y-2.5">
                <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                  <ShieldCheck className="w-4 h-4 text-green-500 shrink-0" />
                  <span>Background verified by Care Bridge</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                  <Award className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>Credentials reviewed &amp; approved</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                  <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>15% platform fee · Cancellation protected</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* ── Right Column: Details ─────────────────────────────────────── */}
        <div className="md:col-span-2 space-y-8">

          <section>
            <h2 className="font-serif text-2xl font-bold mb-4">About Me</h2>
            <div className="prose prose-gray dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
              {caregiver.bio.split('\n').map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold mb-4">Care Categories</h2>
            <div className="flex flex-wrap gap-2">
              {caregiver.categories?.map(cat => (
                <Badge key={cat.id} variant="secondary" className="px-3 py-1.5 text-sm bg-secondary/10 text-secondary-foreground">
                  {cat.name}
                </Badge>
              ))}
            </div>
          </section>

          {(caregiver.services || caregiver.certifications || caregiver.languages) && (
            <section>
              <h2 className="font-serif text-2xl font-bold mb-4">Details</h2>
              <div className="grid sm:grid-cols-1 gap-4">
                {caregiver.services && (
                  <Card className="bg-muted/30 border-none shadow-none">
                    <CardContent className="p-4 flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-medium mb-1">Services Offered</div>
                        <div className="text-sm text-muted-foreground">{caregiver.services}</div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {caregiver.certifications && (
                  <Card className="bg-muted/30 border-none shadow-none">
                    <CardContent className="p-4 flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-medium mb-1">Certifications</div>
                        <div className="text-sm text-muted-foreground">{caregiver.certifications}</div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {caregiver.languages && (
                  <Card className="bg-muted/30 border-none shadow-none">
                    <CardContent className="p-4 flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                        <Languages className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-medium mb-2">Languages Spoken</div>
                        <div className="flex flex-wrap gap-1.5">
                          {caregiver.languages.split(",").map(l => l.trim()).filter(Boolean).map((lang) => (
                            <span key={lang} className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-medium">
                              {lang}
                            </span>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </section>
          )}

          <section>
            <h2 className="font-serif text-2xl font-bold mb-4">Verification & Credentials</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Card className="bg-muted/30 border-none shadow-none">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-medium">Background Check</div>
                    <div className="text-xs text-muted-foreground">Cleared</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-muted/30 border-none shadow-none">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-medium">Experience</div>
                    <div className="text-xs text-muted-foreground">{caregiver.yearsExperience} Years Verified</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-muted/30 border-none shadow-none">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-medium">Availability</div>
                    <div className="text-xs text-muted-foreground">Flexible hours</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-muted/30 border-none shadow-none">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-medium">Member Since</div>
                    <div className="text-xs text-muted-foreground">{new Date(caregiver.createdAt).getFullYear()}</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* ── Reviews ──────────────────────────────────────────────────── */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-2xl font-bold">Reviews</h2>

              {/* ✅ Issue 9: three-way render — self / signed-in / signed-out */}
              {isSelf ? (
                <span className="text-xs text-muted-foreground italic border border-border/50 rounded-full px-3 py-1.5">
                  You cannot review your own profile
                </span>
              ) : (
                <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="rounded-full">
                      Write a Review
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Review {caregiver.name}</DialogTitle>
                      <DialogDescription>
                        Share your experience to help other families make informed decisions.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                      {/* ✅ Fix: replaced Show with SignedOut */}
                      <SignedOut>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Your Name</label>
                          <Input
                            placeholder="Enter your name"
                            value={reviewerName}
                            onChange={(e) => setReviewerName(e.target.value)}
                          />
                        </div>
                      </SignedOut>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Rating</label>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button key={star} onClick={() => setReviewRating(star)} className="p-1">
                              <Star className={`w-7 h-7 transition-colors ${
                                star <= reviewRating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-muted-foreground/30"
                              }`} />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Your Review</label>
                        <Textarea
                          placeholder="Share your experience working with this caregiver..."
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          rows={4}
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsReviewOpen(false)}>Cancel</Button>
                      <Button
                        onClick={handleReview}
                        disabled={createReview.isPending || !reviewComment.trim()}
                      >
                        {createReview.isPending ? "Submitting..." : "Submit Review"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {!reviews || reviews.length === 0 ? (
              <Card className="border-border/50 shadow-sm">
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Star className="w-8 h-8 text-muted-foreground/20 mx-auto mb-3" />
                  <p>No reviews yet. Be the first to share your experience.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {reviews.map(review => (
                  <Card key={review.id} className="border-border/50 shadow-sm">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar className="h-9 w-9 border border-border">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                            {review.reviewerName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold text-sm">{review.reviewerName}</div>
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-3.5 h-3.5 ${
                                i < review.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-muted-foreground/20"
                              }`} />
                            ))}
                          </div>
                        </div>
                        <span className="ml-auto text-xs text-muted-foreground">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}
