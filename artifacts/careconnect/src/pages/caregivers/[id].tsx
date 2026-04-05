import {
  useGetCaregiver,
  useCreateBooking,
  useCreateConversation,
  useListReviews,
  useCreateReview,
  getGetCaregiverQueryKey,
  getListReviewsQueryKey,
} from "@workspace/api-client-react";
import { useParams, Link, useLocation } from "wouter";
import { useState } from "react";
import { useUser, Show } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Star, MapPin, ShieldCheck, Clock, Award, ChevronLeft, Calendar, Languages, Briefcase, MessageCircle } from "lucide-react";
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
    query: { enabled: !!id, queryKey: getGetCaregiverQueryKey(id) }
  });

  const { data: reviews } = useListReviews(
    { caregiverId: id, status: "approved" },
    { query: { queryKey: getListReviewsQueryKey({ caregiverId: id, status: "approved" }) } }
  );

  const createBooking = useCreateBooking();
  const createConversation = useCreateConversation();
  const createReview = useCreateReview();

  const handleBook = () => {
    createBooking.mutate({
      data: {
        caregiverId: id,
        careRequestId: 1,
        message,
        seekerClerkId: user?.id,
      }
    }, {
      onSuccess: () => {
        setIsBookingOpen(false);
        toast({
          title: "Booking Request Sent",
          description: `Your request has been sent to ${caregiver?.name}. They will respond shortly.`,
        });
        setLocation("/dashboard");
      }
    });
  };

  const handleMessage = () => {
    if (!user || !caregiver) {
      setLocation("/sign-in");
      return;
    }
    createConversation.mutate({
      data: {
        participantAClerkId: user.id,
        participantBClerkId: `caregiver_${caregiver.id}`,
        participantAName: user.firstName ?? user.emailAddresses[0]?.emailAddress ?? "Seeker",
        participantBName: caregiver.name,
      }
    }, {
      onSuccess: (data) => {
        setLocation(`/messages/${data.id}`);
      }
    });
  };

  const handleReview = () => {
    createReview.mutate({
      data: {
        caregiverId: id,
        rating: reviewRating,
        comment: reviewComment,
        reviewerName: user
          ? (user.firstName ?? user.emailAddresses[0]?.emailAddress ?? reviewerName)
          : reviewerName,
        reviewerClerkId: user?.id,
      }
    }, {
      onSuccess: () => {
        setIsReviewOpen(false);
        setReviewComment("");
        setReviewerName("");
        toast({
          title: "Review Submitted",
          description: "Your review has been submitted and will be visible after moderation.",
        });
        queryClient.invalidateQueries({ queryKey: getListReviewsQueryKey({ caregiverId: id, status: "approved" }) });
      }
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
        {/* Left Column: Profile Card */}
        <div className="md:col-span-1">
          <Card className="sticky top-24 border-border/50 shadow-lg overflow-hidden">
            <div className="h-24 bg-primary/10"></div>
            <div className="px-6 pt-0 pb-6 text-center">
              <Avatar className="w-32 h-32 border-4 border-background shadow-md mx-auto -mt-16 mb-4">
                <AvatarImage src={caregiver.avatarUrl ?? undefined} alt={caregiver.name} className="object-cover" />
                <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                  {caregiver.name.charAt(0)}
                </AvatarFallback>
              </Avatar>

              <h1 className="text-2xl font-serif font-bold flex items-center justify-center gap-2 mb-1">
                {caregiver.name}
                {caregiver.isVerified && (
                  <ShieldCheck className="w-5 h-5 text-green-500" />
                )}
              </h1>

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
                <div className="w-px h-8 bg-border"></div>
                <div className="text-center">
                  <div className="font-bold mb-1">${caregiver.hourlyRate}</div>
                  <div className="text-xs text-muted-foreground">per hour</div>
                </div>
                <div className="w-px h-8 bg-border"></div>
                <div className="text-center">
                  <div className="font-bold mb-1">{caregiver.yearsExperience}y</div>
                  <div className="text-xs text-muted-foreground">experience</div>
                </div>
              </div>

              <div className="space-y-3">
                <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
                  <Show when="signed-in">
                    <DialogTrigger asChild>
                      <Button className="w-full rounded-full h-12 text-lg shadow-sm hover-elevate">
                        Request Booking
                      </Button>
                    </DialogTrigger>
                  </Show>
                  <Show when="signed-out">
                    <Button className="w-full rounded-full h-12 text-lg shadow-sm" asChild>
                      <Link href="/sign-in">Request Booking</Link>
                    </Button>
                  </Show>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Book {caregiver.name}</DialogTitle>
                      <DialogDescription>
                        Send a message describing your care needs. {caregiver.name} will be notified immediately.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Initial Message</label>
                        <Textarea
                          placeholder="Hi there, I'm looking for care for my mother..."
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

                <Button
                  variant="outline"
                  className="w-full rounded-full h-10"
                  onClick={handleMessage}
                  disabled={createConversation.isPending}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </div>

              <p className="text-xs text-muted-foreground mt-4 text-center">
                Usually responds within 24 hours
              </p>
            </div>
          </Card>
        </div>

        {/* Right Column: Details */}
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
                        <div className="font-medium mb-1">Languages Spoken</div>
                        <div className="text-sm text-muted-foreground">{caregiver.languages}</div>
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

          {/* Reviews section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-2xl font-bold">Reviews</h2>
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
                    <Show when="signed-out">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Your Name</label>
                        <Input
                          placeholder="Enter your name"
                          value={reviewerName}
                          onChange={(e) => setReviewerName(e.target.value)}
                        />
                      </div>
                    </Show>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Rating</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setReviewRating(star)}
                            className="p-1"
                          >
                            <Star
                              className={`w-7 h-7 transition-colors ${
                                star <= reviewRating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-muted-foreground/30"
                              }`}
                            />
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
                              <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/20"}`} />
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
