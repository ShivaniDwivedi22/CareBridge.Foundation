import { useGetCareRequest, getGetCareRequestQueryKey, useListCaregivers } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Clock, Calendar, ChevronLeft, User, DollarSign, Star } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function CareRequestDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0");

  const { data: request, isLoading } = useGetCareRequest(id, { 
    query: { enabled: !!id, queryKey: getGetCareRequestQueryKey(id) } 
  });

  // Fetch some caregivers in the same category to suggest
  const { data: suggestedCaregivers } = useListCaregivers({ 
    category: request?.category?.slug 
  }, { 
    query: { enabled: !!request?.category?.slug } 
  });

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
                <Button className="w-full rounded-full h-12 hover-elevate">
                  Apply for this job
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
                        src={caregiver.avatarUrl} 
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
    </div>
  );
}
