import { useListCareRequests, useListCategories } from "@workspace/api-client-react";
import { Link } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Clock, Calendar, ArrowRight, User, PlusCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function CareRequests() {
  const [categoryFilter, setCategoryFilter] = useState("all");
  
  const { data: categories } = useListCategories();
  const { data: requests, isLoading } = useListCareRequests({
    category: categoryFilter !== "all" ? categoryFilter : undefined,
    status: "open"
  });

  return (
    <div className="container mx-auto px-4 py-12 md:py-16 bg-muted/10 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
        <div>
          <h1 className="font-serif text-4xl font-bold mb-4">Care Requests</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Find families looking for care in your area. Apply to jobs that match your skills.
          </p>
        </div>
        <Button asChild className="rounded-full shadow-sm hover-elevate">
          <Link href="/post-request"><PlusCircle className="w-4 h-4 mr-2" /> Post a Request</Link>
        </Button>
      </div>

      <div className="flex gap-4 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        <Button 
          variant={categoryFilter === "all" ? "default" : "outline"} 
          onClick={() => setCategoryFilter("all")}
          className="rounded-full"
        >
          All Requests
        </Button>
        {categories?.map((cat) => (
          <Button 
            key={cat.id}
            variant={categoryFilter === cat.slug ? "default" : "outline"} 
            onClick={() => setCategoryFilter(cat.slug)}
            className="rounded-full whitespace-nowrap"
          >
            {cat.name}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : requests?.length === 0 ? (
        <div className="text-center py-20 bg-background rounded-2xl border border-dashed border-border shadow-sm">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No active requests</h3>
          <p className="text-muted-foreground mb-6">Check back later or adjust your filters.</p>
          <Button variant="outline" onClick={() => setCategoryFilter("all")}>
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {requests?.map((request, index) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              key={request.id}
            >
              <Card className="h-full flex flex-col hover:shadow-md transition-all border-border/50 bg-background group">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="secondary" className="bg-primary/10 text-primary font-medium">
                      {request.category?.name}
                    </Badge>
                    <div className="font-semibold text-lg">
                      ${request.budget}<span className="text-sm text-muted-foreground font-normal">/hr</span>
                    </div>
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">{request.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 pb-4">
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4 bg-muted/30 p-3 rounded-lg">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-primary/70" />
                      {request.location}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-primary/70" />
                      Starts {new Date(request.startDate).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <User className="w-4 h-4 text-primary/70" />
                      {request.seekerName}
                    </span>
                  </div>
                  <p className="text-muted-foreground line-clamp-3 text-sm leading-relaxed">
                    {request.description}
                  </p>
                </CardContent>
                <CardFooter className="pt-0 border-t border-border/40 mt-auto px-6 py-4 flex items-center justify-between bg-muted/10">
                  <span className="text-xs text-muted-foreground">
                    Posted {new Date(request.createdAt).toLocaleDateString()}
                  </span>
                  <Button asChild variant="default" className="rounded-full shadow-sm hover-elevate">
                    <Link href={`/care-requests/${request.id}`}>View Details</Link>
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
