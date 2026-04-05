import { useGetStatsOverview, useListBookings, useUpdateBookingStatus, getListBookingsQueryKey, getGetStatsOverviewQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Briefcase, CalendarCheck, FileText, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Dashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stats, isLoading: isLoadingStats } = useGetStatsOverview({
    query: { queryKey: getGetStatsOverviewQueryKey() }
  });
  
  const { data: bookings, isLoading: isLoadingBookings } = useListBookings({}, {
    query: { queryKey: getListBookingsQueryKey() }
  });

  const updateBooking = useUpdateBookingStatus();

  const handleStatusUpdate = (id: number, status: 'confirmed' | 'cancelled' | 'completed') => {
    updateBooking.mutate({
      id,
      data: { status }
    }, {
      onSuccess: () => {
        toast({
          title: "Status Updated",
          description: `Booking is now ${status}.`,
        });
        queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
      }
    });
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="mb-10">
        <h1 className="font-serif text-4xl font-bold mb-2">Platform Dashboard</h1>
        <p className="text-muted-foreground">Overview of CareConnect marketplace activity.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <Card className="border-border/50 shadow-sm bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-primary/20 rounded-xl">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
            {isLoadingStats ? (
              <Skeleton className="h-10 w-20 mb-1" />
            ) : (
              <div className="text-3xl font-bold text-foreground mb-1">{stats?.totalCaregivers}</div>
            )}
            <div className="text-sm font-medium text-muted-foreground">Total Caregivers</div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm bg-secondary/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-secondary/20 rounded-xl">
                <FileText className="w-6 h-6 text-secondary-foreground" />
              </div>
            </div>
            {isLoadingStats ? (
              <Skeleton className="h-10 w-20 mb-1" />
            ) : (
              <div className="text-3xl font-bold text-foreground mb-1">{stats?.totalCareRequests}</div>
            )}
            <div className="text-sm font-medium text-muted-foreground">Total Requests</div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm bg-blue-50 dark:bg-blue-900/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-200 dark:bg-blue-800/30 rounded-xl">
                <Briefcase className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            {isLoadingStats ? (
              <Skeleton className="h-10 w-20 mb-1" />
            ) : (
              <div className="text-3xl font-bold text-foreground mb-1">{stats?.openRequests}</div>
            )}
            <div className="text-sm font-medium text-muted-foreground">Open Jobs</div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm bg-purple-50 dark:bg-purple-900/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-200 dark:bg-purple-800/30 rounded-xl">
                <CalendarCheck className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            {isLoadingStats ? (
              <Skeleton className="h-10 w-20 mb-1" />
            ) : (
              <div className="text-3xl font-bold text-foreground mb-1">{stats?.totalBookings}</div>
            )}
            <div className="text-sm font-medium text-muted-foreground">Total Bookings</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Bookings Management */}
        <div className="lg:col-span-2">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="border-b border-border/40 bg-muted/20">
              <CardTitle>Recent Bookings</CardTitle>
              <CardDescription>Manage incoming care connection requests</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingBookings ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
                </div>
              ) : bookings?.length === 0 ? (
                <div className="p-10 text-center text-muted-foreground">
                  No bookings found
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {bookings?.map(booking => (
                    <div key={booking.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-semibold text-lg">{booking.caregiver?.name}</span>
                          <Badge variant="outline" className={
                            booking.status === 'confirmed' ? 'border-green-500 text-green-600 bg-green-50 dark:bg-green-950/20' : 
                            booking.status === 'pending' ? 'border-yellow-500 text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20' : 
                            booking.status === 'completed' ? 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-950/20' : 
                            'border-gray-500 text-gray-600'
                          }>
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mb-1">
                          Request: <span className="font-medium text-foreground">{booking.careRequest?.title}</span>
                        </div>
                        <div className="text-sm text-muted-foreground italic">
                          "{booking.message}"
                        </div>
                      </div>
                      
                      {booking.status === 'pending' && (
                        <div className="flex gap-2 shrink-0">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                            disabled={updateBooking.isPending}
                          >
                            <XCircle className="w-4 h-4 mr-1" /> Reject
                          </Button>
                          <Button 
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                            disabled={updateBooking.isPending}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" /> Accept
                          </Button>
                        </div>
                      )}
                      {booking.status === 'confirmed' && (
                        <div className="flex gap-2 shrink-0">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleStatusUpdate(booking.id, 'completed')}
                            disabled={updateBooking.isPending}
                          >
                            Mark Completed
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Categories Breakdown */}
        <div className="lg:col-span-1">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="border-b border-border/40 bg-muted/20">
              <CardTitle>Category Distribution</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {isLoadingStats ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : (
                <div className="space-y-5">
                  {stats?.categoryCounts.map((cat, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-medium">{cat.categoryName}</span>
                        <span className="text-muted-foreground">{cat.count}</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full" 
                          style={{ width: `${Math.max(5, (cat.count / Math.max(1, stats.totalCaregivers)) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
