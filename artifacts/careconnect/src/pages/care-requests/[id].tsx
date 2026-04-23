import { useGetCareRequest, getGetCareRequestQueryKey, useListCaregivers, getListCaregiversQueryKey, useCreateBooking } from "@workspace/api-client-react";
import { useParams, Link, useLocation } from "wouter";
import { useState } from "react";
import { useUser } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin, Clock, Calendar, ChevronLeft, User, DollarSign, Star, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CareRequestDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0");
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const { toast } = useToast();

  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [applyMessage, setApplyMessage] = useState("");

  const { data: request, isLoading } = useGetCareRequest(id, {
    query: { enabled: !!id, queryKey: getGetCareRequestQueryKey(id) }
  });

  const { data: suggestedCaregivers } = useListCaregivers(
    { category: request?.category?.slug },
    { query: { enabled: !!request?.category?.slug, queryKey: getListCaregiversQueryKey({ category: request?.category?.slug }) } }
  );

  const { data: allCaregivers } = useListCaregivers(
    {},
    { query: { enabled: !!user, queryKey: getListCaregiversQueryKey({}) } }
  );

  const myCaregiverProfile = (allCaregivers as any[])?.find(
    (c: any) => c.clerkId === user?.id
  );

  const createBooking = useCreateBooking();

  const handleApply = () => {
    if (!user) {
      setLocation("/sign-in");
      return;
    }
    if (!myCaregiverProfile) {
      toast({
        title: "Caregiver profile required",
        description: "You must register as a caregiver before applying for jobs.",
      });
      setLocation("/become-caregiver");
      return;
    }
    setIsApplyOpen(true);
  };

  const submitApplication = () => {
    if (!myCaregiverProfile || !request) return;
    createBooking.mutate(
      {
        data: {
          caregiverId: myCaregiverProfile.id,
          careRequestId: request.id,
          message: applyMessage,
          seekerClerkId: request.seekerClerkId ?? undefined,
        },
      },
      {
        onSuccess: () => {
          setIsApplyOpen(false);
          setApplyMessage("");
          toast({
            title: "Application sent!",
            description: "Your application has been sent. You'll be notified if selected.",
          });
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.error ?? "Could not send application. Please try again.";
          toast({ title: "Error", description: msg, variant: "destructive" });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-8 w-32 mb-8" />
        <Skeleton className="h-[400px] rounded-2xl w-full" />
      </div>
    );
  }

  if (!request) return <div>Not found</div>;

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
      <Link href="/care-requests" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-8 transition-colors">
        <ChevronLeft className="w-4 h-4 mr-1" /> Back to Requests
      </Link>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Badge variant="secondary" className="bg-primary/10 text-primary text-sm px-3 py-1">
                {request.category?.name}
              </Badge>
              <Badge variant="outline" className={
                request.status === 'open' ? 'border-green-500 text-green-600' :
                request.status === 'filled' ? 'border-blue-500 text-blue-600' :
                'border-gray-500 text-gray-600'
              }>
                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
              </Badge>
            </div>

            <h1 className="font-serif text-3xl md:text-4xl font-bold mb-6">{request.title}</h1>

            <div className="flex flex-wrap gap-6 p-4 bg-muted/30 rounded-xl mb-8">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-background rounded-md shadow-sm">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Posted by</div>
                  <div className="font-medium text-sm">{request.seekerName}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-background rounded-md shadow-sm">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Location</div>
                  <div className="font-medium text-sm">{request.location}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-background rounded-md shadow-sm">
                  <DollarSign className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Budget</div>
                  <div className="font-medium text-sm">${request.budget}/hr</div>
                </div>
              </div>
            </div>

            <div className="prose prose-gray dark:prose-invert max-w-none">
              <h3 className="font-serif text-xl font-semibold mb-4">Description</h3>
              <div className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {request.description}
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-1 space-y-6">
          <Card className="border-border/50 shadow-md">
            <CardHeader className="bg-muted/20 border-b border-border/40 pb-4">
              <CardTitle className="text-lg">Schedule</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="font-medium">Start Date</div>
                  <div className="text-sm text-muted-foreground">{new Date(request.startDate).toLocaleDateString()}</div>
                </div>
              </div>
              {request.durationHours && (
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="font-medium">Duration per Session</div>
                    <div className="text-sm text-muted-foreground">{request.durationHours} hour{request.durationHours !== 1 ? "s" : ""}</div>
                  </div>
                </div>
              )}
              {request.endDate && (
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="font-medium">End Date</div>
                    <div className="text-sm text-muted-foreground">{new Date(request.endDate).toLocaleDateString()}</div>
                  </div>
                </div>
              )}

              <div className="pt-6">
                <Button
                  className="w-full rounded-full h-12 hover-elevate"
                  onClick={handleApply}
                  disabled={request.status !== 'open'}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {request.status === 'open' ? 'Apply for this job' : 'Position Filled'}
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-3">
                  Only verified caregivers can apply
                </p>
              </div>
            </CardContent>
          </Card>

          {suggestedCaregivers && suggestedCaregivers.length > 0 && (
            <div>
              <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Similar Caregivers</h3>
              <div className="space-y-3">
                {suggestedCaregivers.slice(0, 3).map(caregiver => (
                  <Link key={caregiver.id} href={`/caregivers/${caregiver.id}`}>
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-card hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer group">
                      <img
                        src={caregiver.avatarUrl ?? undefined}
                        alt={caregiver.name}
                        className="w-10 h-10 rounded-full object-cover border border-border"
                      />
                      <div className="flex-1 overflow-hidden">
                        <div className="font-medium text-sm group-hover:text-primary transition-colors truncate">
                          {caregiver.name}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          {caregiver.rating.toFixed(1)} • ${caregiver.hourlyRate}/hr
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isApplyOpen} onOpenChange={setIsApplyOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Apply for "{request.title}"</DialogTitle>
            <DialogDescription>
              Write a short cover message explaining why you're a great fit for this role. The family will review your profile and reach out if interested.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <label className="text-sm font-medium">Your cover message</label>
            <Textarea
              placeholder="Hi, I'm an experienced caregiver with X years of experience in... I'd love to help your family with..."
              value={applyMessage}
              onChange={(e) => setApplyMessage(e.target.value)}
              rows={5}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Your contact details remain private until the family confirms and pays for your services.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApplyOpen(false)}>Cancel</Button>
            <Button
              onClick={submitApplication}
              disabled={!applyMessage.trim() || createBooking.isPending}
            >
              {createBooking.isPending ? "Sending..." : "Send Application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
