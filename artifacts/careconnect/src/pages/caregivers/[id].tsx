import { useGetCaregiver, useCreateBooking, getGetCaregiverQueryKey } from "@workspace/api-client-react";
import { useParams, Link, useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Star, MapPin, ShieldCheck, Clock, Award, ChevronLeft, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CaregiverDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const { data: caregiver, isLoading } = useGetCaregiver(id, { 
    query: { enabled: !!id, queryKey: getGetCaregiverQueryKey(id) } 
  });

  const createBooking = useCreateBooking();

  const handleBook = () => {
    // In a real app, we'd select a specific care request. For now, we mock it with ID 1
    createBooking.mutate({
      data: {
        caregiverId: id,
        careRequestId: 1, // Mock
        message: message
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
                <AvatarImage src={caregiver.avatarUrl} alt={caregiver.name} className="object-cover" />
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

              <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full rounded-full h-12 text-lg shadow-sm hover-elevate">
                    Request Booking
                  </Button>
                </DialogTrigger>
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
        </div>
      </div>
    </div>
  );
}
