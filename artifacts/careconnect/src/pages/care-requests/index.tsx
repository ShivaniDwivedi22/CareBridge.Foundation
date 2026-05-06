import { useListCareRequests, useListCategories } from "@/hooks/api-hooks";
import { Link } from "wouter";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MapPin, Clock, Calendar, User, PlusCircle,
  SlidersHorizontal, Search, X,
} from "lucide-react";
import { motion } from "framer-motion";

type SortKey = "newest" | "budget-high" | "budget-low";

export default function CareRequests() {
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // Filter state
  const [search, setSearch] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [minBudget, setMinBudget] = useState<string>("");
  const [maxBudget, setMaxBudget] = useState<string>("");
  const [minDuration, setMinDuration] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortKey>("newest");

  const { data: categories } = useListCategories();
  const { data: requests, isLoading } = useListCareRequests({
    category: categoryFilter !== "all" ? categoryFilter : undefined,
    status: "open",
  });

  const filtered = useMemo(() => {
    if (!requests) return [];
    let out = [...requests];

    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter(
        (r) =>
          r.title?.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q) ||
          r.location?.toLowerCase().includes(q),
      );
    }

    if (locationQuery.trim()) {
      const lq = locationQuery.toLowerCase();
      out = out.filter((r) => r.location?.toLowerCase().includes(lq));
    }

    const minB = parseFloat(minBudget);
    if (!isNaN(minB)) out = out.filter((r) => Number(r.budget) >= minB);

    const maxB = parseFloat(maxBudget);
    if (!isNaN(maxB)) out = out.filter((r) => Number(r.budget) <= maxB);

    const minD = parseFloat(minDuration);
    if (!isNaN(minD)) out = out.filter((r) => Number(r.durationHours ?? 0) >= minD);

    if (sortBy === "budget-high") out.sort((a, b) => Number(b.budget) - Number(a.budget));
    else if (sortBy === "budget-low") out.sort((a, b) => Number(a.budget) - Number(b.budget));
    else out.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return out;
  }, [requests, search, locationQuery, minBudget, maxBudget, minDuration, sortBy]);

  const activeFilterCount =
    (search ? 1 : 0) +
    (locationQuery ? 1 : 0) +
    (minBudget ? 1 : 0) +
    (maxBudget ? 1 : 0) +
    (minDuration ? 1 : 0) +
    (sortBy !== "newest" ? 1 : 0);

  const clearFilters = () => {
    setSearch("");
    setLocationQuery("");
    setMinBudget("");
    setMaxBudget("");
    setMinDuration("");
    setSortBy("newest");
  };

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

      {/* Category tabs */}
      <div className="flex gap-3 mb-4 overflow-x-auto pb-2 scrollbar-hide">
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

      {/* Filter bar */}
      <div className="mb-6 bg-background border border-border/50 rounded-xl shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center gap-3 p-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search title, description, or location..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="budget-high">Budget: high to low</SelectItem>
              <SelectItem value="budget-low">Budget: low to high</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => setShowFilters((s) => !s)}
            className="gap-2"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge className="ml-1 bg-primary text-primary-foreground h-5 min-w-5 px-1.5">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground">
              <X className="w-3.5 h-3.5" /> Clear
            </Button>
          )}
        </div>

        {showFilters && (
          <div className="border-t border-border/50 p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Location contains</Label>
              <Input
                placeholder="e.g. Toronto"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Min budget ($/hr)</Label>
              <Input
                type="number"
                min="0"
                placeholder="10"
                value={minBudget}
                onChange={(e) => setMinBudget(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Max budget ($/hr)</Label>
              <Input
                type="number"
                min="0"
                placeholder="100"
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Min duration (hrs)</Label>
              <Input
                type="number"
                min="0"
                step="0.5"
                placeholder="1"
                value={minDuration}
                onChange={(e) => setMinDuration(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Result count */}
      {!isLoading && requests && (
        <p className="text-sm text-muted-foreground mb-4">
          Showing <strong>{filtered.length}</strong> of {requests.length} request{requests.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-background rounded-2xl border border-dashed border-border shadow-sm">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No matching requests</h3>
          <p className="text-muted-foreground mb-6">Try adjusting your filters or category.</p>
          <Button variant="outline" onClick={() => { clearFilters(); setCategoryFilter("all"); }}>
            Clear all filters
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {filtered.map((request, index) => (
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
                    {request.durationHours && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-primary/70" />
                        {request.durationHours} hr{request.durationHours !== 1 ? "s" : ""}/session
                      </span>
                    )}
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
