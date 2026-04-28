import { useCreateCareRequest, useListCategories } from "@/hooks/api-hooks";
import { useLocation } from "wouter";
import { useForm, useWatch } from "react-hook-form";
import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Please provide more details (min 20 characters)"),
  categoryId: z.coerce.number().min(1, "Please select a category"),
  location: z.string().min(3, "Location is required"),
  startDate: z.string().min(1, "Start date is required"),
  budget: z.coerce.number().min(10, "Minimum budget is $10/hr"),
  durationHours: z.coerce.number().min(1, "Minimum 1 hour").optional(),
  seekerName: z.string().min(2, "Your name is required"),
});

type FormValues = z.infer<typeof formSchema>;

const CATEGORY_HEADLINES: Record<string, string> = {
  "Elderly Care":       "Looking for a compassionate caregiver for my elderly parent",
  "Child Care":         "Seeking a reliable and experienced child care professional",
  "Newborn Care":       "Need a skilled newborn care specialist for our new baby",
  "Postpartum Care":    "Looking for postpartum support and new mother care",
  "Pet Care":           "Need a trusted pet sitter / dog walker for my furry family",
  "House Help":         "Seeking reliable household help and domestic assistance",
  "Kitchen & Food Help": "Looking for cooking and meal preparation support at home",
  "Event Support":      "Need helping hands for an upcoming family event",
  "Travel & Medical Care": "Seeking a travel companion and medical support assistant",
  "Special Needs Care": "Looking for a compassionate special needs care professional",
};

export default function PostRequest() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: categories } = useListCategories();
  const createRequest = useCreateCareRequest();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      categoryId: 0,
      location: "",
      startDate: new Date().toISOString().split('T')[0],
      budget: 20,
      durationHours: undefined,
      seekerName: "",
    },
  });

  const watchedCategoryId = useWatch({ control: form.control, name: "categoryId" });

  useEffect(() => {
    if (!watchedCategoryId || !categories) return;
    const cat = categories.find(c => c.id === Number(watchedCategoryId));
    if (!cat) return;
    const suggested = CATEGORY_HEADLINES[cat.name] ?? `Looking for a ${cat.name.toLowerCase()} professional`;
    const currentTitle = form.getValues("title");
    const prevValues = Object.values(CATEGORY_HEADLINES);
    if (!currentTitle || prevValues.some(v => currentTitle === v)) {
      form.setValue("title", suggested, { shouldValidate: false });
    }
  }, [watchedCategoryId, categories]);

  function onSubmit(data: FormValues) {
    createRequest.mutate({
      data
    }, {
      onSuccess: (result) => {
        toast({
          title: "Request Posted Successfully",
          description: "Your care request is now visible to caregivers.",
        });
        setLocation(`/care-requests/${result.id}`);
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to post request. Please try again.",
          variant: "destructive",
        });
      }
    });
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-10">
          <h1 className="font-serif text-4xl font-bold mb-4">Post a Care Request</h1>
          <p className="text-lg text-muted-foreground">
            Describe what you're looking for, and we'll connect you with qualified professionals.
          </p>
        </div>

        <Card className="border-border/50 shadow-lg">
          <CardContent className="pt-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="seekerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input placeholder="City, State or Zip" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type of Care Needed</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value ? field.value.toString() : ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories?.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => {
                    const isSuggested = Object.values(CATEGORY_HEADLINES).includes(field.value);
                    return (
                      <FormItem>
                        <FormLabel>Headline</FormLabel>
                        <FormControl>
                          <Input placeholder="E.g. Need experienced caregiver for elderly mother" {...field} />
                        </FormControl>
                        <FormDescription>
                          {isSuggested && field.value
                            ? <span className="text-primary font-medium">✦ Auto-suggested from category — feel free to edit</span>
                            : "A brief summary of what you need."
                          }
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Detailed Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Please describe the duties, schedule, and any specific requirements..." 
                          className="min-h-[150px] resize-y"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="durationHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (hours)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="number"
                              placeholder="e.g. 4"
                              min="1"
                              step="0.5"
                              {...field}
                              value={field.value ?? ""}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">hrs</span>
                          </div>
                        </FormControl>
                        <FormDescription>How many hours per session</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hourly Budget ($)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                            <Input type="number" className="pl-7" min="10" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="pt-4 border-t border-border/40 flex justify-end">
                  <Button 
                    type="submit" 
                    size="lg" 
                    className="rounded-full px-8 shadow-md hover-elevate"
                    disabled={createRequest.isPending}
                  >
                    {createRequest.isPending ? "Posting..." : "Post Request"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
