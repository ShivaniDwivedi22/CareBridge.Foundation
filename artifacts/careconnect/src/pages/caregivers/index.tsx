import { useListCaregivers, useListCategories } from "@workspace/api-client-react";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, MapPin, ShieldCheck, Search, SlidersHorizontal, ArrowRight, LocateFixed, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useGeolocation } from "@/hooks/use-geolocation";

export default function Caregivers() {
  const [searchParams] = useState(() => new URLSearchParams(window.location.search));
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get("category") || "");
  const [locationFilter, setLocationFilter] = useState(searchParams.get("location") || "");

  const geo = useGeolocation();

  const { data: categories } = useListCategories();
  const { data: caregivers, isLoading } = useListCaregivers({
    category: categoryFilter && categoryFilter !== "all_cats" ? categoryFilter : undefined,
    location: locationFilter || undefined,
  });

  const handleDetectLocation = async () => {
    geo.detectLocation();
  };

  useEffect(() => {
    if (geo.location) {
      setLocationFilter(geo.location);
    }
  }, [geo.location]);

  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <div className="mb-10">
        <h1 className="font-serif text-4xl font-bold mb-4">Find a Caregiver</h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Browse our community of compassionate, vetted professionals ready to help your family.
        </p>
      </div>

      <div className="bg-card border border-border/50 rounded-2xl p-4 md:p-6 mb-10 shadow-sm flex flex-col md:flex-row gap-4 items-end">
        <div className="w-full md:w-1/3 space-y-2">
          <label className="text-sm font-medium px-1">Category</label>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_cats">All Categories</SelectItem>
              {categories?.map((cat) => (
                <SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full md:w-1/3 space-y-2">
          <label className="text-sm font-medium px-1">Location</label>
          <div className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="City, State"
                className="pl-9"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="shrink-0 h-10 w-10"
              onClick={handleDetectLocation}
              disabled={geo.isDetecting}
              title="Use my current location"
            >
              {geo.isDetecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LocateFixed className="h-4 w-4" />
              )}
            </Button>
          </div>
          {geo.error && (
            <p className="text-xs text-destructive px-1">{geo.error}</p>
          )}
        </div>

        <div className="w-full md:w-auto flex gap-2">
          <Button variant="outline" className="w-full gap-2" onClick={() => {
            setCategoryFilter("all_cats");
            setLocationFilter("");
          }}>
            <SlidersHorizontal className="h-4 w-4" />
            Clear
          </Button>
        </div>
      </div>

      {locationFilter && (
        <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4 text-primary" />
          Showing caregivers near <span className="font-medium text-foreground">{locationFilter}</span>
        </div>
      )}

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-[420px] rounded-xl" />
          ))}
        </div>
      ) : caregivers?.length === 0 ? (
        <div className="text-center py-20 bg-muted/20 rounded-2xl border border-dashed border-border">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No caregivers found</h3>
          <p className="text-muted-foreground mb-6">Try adjusting your filters or expanding your search area.</p>
          <Button variant="outline" onClick={() => {
            setCategoryFilter("all_cats");
            setLocationFilter("");
          }}>
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {caregivers?.map((caregiver, index) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              key={caregiver.id}
            >
              <Card className="h-full flex flex-col hover:shadow-md transition-all hover:border-primary/30 group">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start mb-4">
                    <Avatar className="w-16 h-16 border-2 border-background shadow-sm">
                      <AvatarImage src={caregiver.avatarUrl ?? undefined} alt={caregiver.name} className="object-cover" />
                      <AvatarFallback className="text-lg bg-primary/10 text-primary">
                        {caregiver.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2 py-1 rounded-full text-sm font-medium">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{caregiver.rating.toFixed(1)}</span>
                      <span className="text-yellow-600/60 ml-0.5">({caregiver.reviewCount})</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-xl flex items-center gap-2 group-hover:text-primary transition-colors">
                      {caregiver.name}
                      {caregiver.isVerified && (
                        <ShieldCheck className="w-4 h-4 text-green-500 shrink-0" />
                      )}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1.5 text-sm">
                      <MapPin className="w-3.5 h-3.5" />
                      {caregiver.location}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <div className="flex flex-wrap gap-1.5">
                    {caregiver.categories?.slice(0, 2).map(cat => (
                      <Badge key={cat.id} variant="secondary" className="bg-secondary/10 text-secondary-foreground font-normal text-xs">
                        {cat.name}
                      </Badge>
                    ))}
                    {(caregiver.categories?.length || 0) > 2 && (
                      <Badge variant="secondary" className="bg-muted text-muted-foreground font-normal text-xs">
                        +{(caregiver.categories?.length || 0) - 2}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                    {caregiver.bio}
                  </p>
                </CardContent>
                <CardFooter className="pt-4 border-t border-border/40 bg-muted/5 flex items-center justify-between">
                  <div className="font-semibold">
                    ${caregiver.hourlyRate}<span className="text-xs text-muted-foreground font-normal">/hr</span>
                  </div>
                  <Button asChild variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary -mr-2">
                    <Link href={`/caregivers/${caregiver.id}`}>Profile <ArrowRight className="w-4 h-4 ml-1" /></Link>
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
