import { useListCategories, useListCaregivers, useListCareRequests } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Star, MapPin, Clock, ArrowRight, ShieldCheck, HeartHandshake, Sparkles } from "lucide-react";
import heroImage from "@/assets/images/hero-home.png";

import imgPetCare from "@/assets/images/category-pet-care.png";
import imgNewbornCare from "@/assets/images/category-newborn-care.png";
import imgPostpartumCare from "@/assets/images/category-postpartum-care.png";
import imgElderlyCare from "@/assets/images/category-elderly-care.png";
import imgSpecialNeedsCare from "@/assets/images/category-special-needs-care.png";
import imgChildCare from "@/assets/images/category-child-care.png";
import imgHouseHelp from "@/assets/images/category-house-help.png";
import imgKitchenFoodHelp from "@/assets/images/category-kitchen-food-help.png";
import imgEventSupport from "@/assets/images/category-event-support.png";
import imgTravelMedicalCare from "@/assets/images/category-travel-medical-care.png";

const CATEGORY_IMAGES: Record<string, string> = {
  "pet-care": imgPetCare,
  "newborn-care": imgNewbornCare,
  "postpartum-care": imgPostpartumCare,
  "elderly-care": imgElderlyCare,
  "special-needs-care": imgSpecialNeedsCare,
  "child-care": imgChildCare,
  "house-help": imgHouseHelp,
  "kitchen-food-help": imgKitchenFoodHelp,
  "event-support": imgEventSupport,
  "travel-medical-care": imgTravelMedicalCare,
};

export default function Home() {
  const { data: categories, isLoading: isLoadingCategories } = useListCategories();
  const { data: featuredCaregivers, isLoading: isLoadingCaregivers } = useListCaregivers({ minRating: 4.5 });
  const { data: recentRequests, isLoading: isLoadingRequests } = useListCareRequests({ status: "open" });

  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-muted/30 pt-16 md:pt-24 pb-20 lg:pb-32">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl"
            >
              <Badge variant="secondary" className="mb-6 rounded-full px-4 py-1.5 text-sm bg-primary/10 text-primary hover:bg-primary/20 font-medium">
                Apna care community
              </Badge>
              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.15] tracking-tight mb-6 text-foreground">
                Compassionate care,<br/>
                <span className="text-primary italic">exactly when you need it.</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
                Connect with trusted, experienced desis for elderly care, newborn support, and special needs — someone who understands your language, culture, and traditions.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="rounded-full text-base h-14 px-8 shadow-md hover-elevate" asChild>
                  <Link href="/caregivers">Find a Caregiver</Link>
                </Button>
                <Button size="lg" variant="outline" className="rounded-full text-base h-14 px-8" asChild>
                  <Link href="/post-request">Post a Request</Link>
                </Button>
              </div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative lg:ml-auto"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-[4/3] max-w-[600px] border border-border/50">
                <img 
                  src={heroImage} 
                  alt="Indian caregiver helping elderly woman at home" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
              </div>
              <div className="absolute -bottom-6 -left-6 bg-card p-6 rounded-xl shadow-xl border border-border/40 animate-in slide-in-from-bottom-4 fade-in duration-700 delay-500 max-w-xs">
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex -space-x-3">
                    {[1,2,3].map(i => (
                      <div key={i} className="w-10 h-10 rounded-full border-2 border-card bg-primary/10 flex items-center justify-center overflow-hidden text-primary font-semibold text-sm">
                        {String.fromCharCode(64 + i)}
                      </div>
                    ))}
                  </div>
                  <div className="text-sm font-medium">
                    <span className="text-primary font-bold">500+</span> Indian families served
                  </div>
                </div>
                <div className="flex items-center gap-1 text-yellow-500">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="font-serif text-3xl font-bold mb-4">What kind of care do you need?</h2>
            <p className="text-muted-foreground">Browse vetted desi professionals who speak your language and understand your family's needs.</p>
          </div>
          
          {isLoadingCategories ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-5">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-44 rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-5">
              {categories?.map((category, index) => {
                const img = CATEGORY_IMAGES[category.slug];
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.07 }}
                    key={category.id}
                  >
                    <Link href={`/caregivers?category=${category.slug}`}>
                      <div className="group flex flex-col rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 border border-border/40 bg-card">
                        <div className="relative h-28 overflow-hidden">
                          {img ? (
                            <img
                              src={img}
                              alt={category.name}
                              className="w-full h-full object-cover opacity-80 transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="w-full h-full bg-primary/10" />
                          )}
                          <div className="absolute inset-0 bg-primary/10 group-hover:bg-primary/5 transition-colors" />
                        </div>
                        <div className="px-3 py-3 bg-card border-t border-border/30">
                          <h3 className="font-bold text-foreground text-sm leading-snug group-hover:text-primary transition-colors">{category.name}</h3>
                          <p className="text-muted-foreground text-xs mt-0.5">{category.caregiverCount} professionals</p>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Our Story + Mission */}
      <section className="py-20 bg-primary/5 border-y border-primary/10">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-10 max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-card rounded-2xl p-8 shadow-sm border border-border/40"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <h2 className="font-serif text-2xl font-bold">Our Story</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                From late-night chai cravings to festive marigold rushes, we know life doesn't slow down when you're far from home. Care Bridge was born to bring Indian families in the U.S. and Canada a little closer to the comfort of their roots — while keeping everyday care simple and stress-free.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="bg-card rounded-2xl p-8 shadow-sm border border-border/40"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <HeartHandshake className="w-5 h-5 text-primary" />
                </div>
                <h2 className="font-serif text-2xl font-bold">Our Mission</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                To connect you with trusted helpers who speak your language, honor your traditions, and treat your loved ones like their own — because real care should feel like family, not a chore.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Caregivers */}
      <section className="py-20 bg-muted/20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div className="max-w-2xl">
              <h2 className="font-serif text-3xl font-bold mb-4">Highly rated caregivers</h2>
              <p className="text-muted-foreground">Meet some of our most trusted and experienced Indian caregiving professionals.</p>
            </div>
            <Button variant="ghost" className="gap-2 shrink-0 md:self-end" asChild>
              <Link href="/caregivers">View all <ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </div>

          {isLoadingCaregivers ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-[400px] rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {featuredCaregivers?.slice(0, 3).map((caregiver, index) => (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  key={caregiver.id}
                >
                  <Card className="h-full flex flex-col hover:shadow-lg transition-shadow overflow-hidden border-border/50">
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start mb-4">
                        <Avatar className="w-16 h-16 border-2 border-background shadow-sm">
                          <AvatarImage src={caregiver.avatarUrl} alt={caregiver.name} className="object-cover" />
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
                        <CardTitle className="text-xl flex items-center gap-2">
                          {caregiver.name}
                          {caregiver.isVerified && (
                            <ShieldCheck className="w-5 h-5 text-green-500 shrink-0" />
                          )}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1.5 text-sm">
                          <MapPin className="w-3.5 h-3.5" />
                          {caregiver.location}
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {caregiver.categories?.slice(0, 3).map(cat => (
                          <Badge key={cat.id} variant="secondary" className="bg-secondary/10 text-secondary-foreground font-normal">
                            {cat.name}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                        {caregiver.bio}
                      </p>
                    </CardContent>
                    <CardFooter className="pt-4 border-t border-border/40 bg-muted/10 flex items-center justify-between">
                      <div className="font-semibold text-lg">
                        ${caregiver.hourlyRate}<span className="text-sm text-muted-foreground font-normal">/hr</span>
                      </div>
                      <Button asChild variant="default" className="rounded-full shadow-sm hover-elevate">
                        <Link href={`/caregivers/${caregiver.id}`}>View Profile</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Recent Requests */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div className="max-w-2xl">
              <h2 className="font-serif text-3xl font-bold mb-4">Recent care requests</h2>
              <p className="text-muted-foreground">Indian families near you are looking for trusted care. Apply and make a difference.</p>
            </div>
            <Button variant="outline" className="gap-2 shrink-0 md:self-end rounded-full" asChild>
              <Link href="/care-requests">Browse all jobs <ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </div>

          {isLoadingRequests ? (
            <div className="grid md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {recentRequests?.slice(0, 4).map((request, index) => (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  key={request.id}
                >
                  <Card className="h-full hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <Badge variant="outline" className="mb-3">
                            {request.category?.name}
                          </Badge>
                          <h3 className="font-semibold text-lg line-clamp-1 mb-1 text-foreground">
                            {request.title}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5" />
                              {request.location}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              {new Date(request.startDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-primary">
                            ${request.budget}<span className="text-sm text-muted-foreground font-normal">/hr</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {request.description}
                      </p>
                      <div className="flex items-center justify-between pt-4 border-t border-border/40">
                        <span className="text-xs text-muted-foreground">
                          Posted by {request.seekerName}
                        </span>
                        <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary hover:bg-primary/10">
                          <Link href={`/care-requests/${request.id}`}>View Details <ArrowRight className="w-3.5 h-3.5 ml-1" /></Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
