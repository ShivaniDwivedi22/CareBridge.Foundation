import { useCreateCaregiver, useListCategories } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  bio: z.string().min(50, "Please provide a detailed bio (min 50 characters)"),
  location: z.string().min(3, "Location is required"),
  hourlyRate: z.coerce.number().min(15, "Minimum rate is $15/hr"),
  yearsExperience: z.coerce.number().min(0, "Experience is required"),
  categoryIds: z.array(z.number()).min(1, "Select at least one category"),
});

type FormValues = z.infer<typeof formSchema>;

export default function BecomeCaregiver() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: categories } = useListCategories();
  const createCaregiver = useCreateCaregiver();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      bio: "",
      location: "",
      hourlyRate: 25,
      yearsExperience: 1,
      categoryIds: [],
    },
  });

  function onSubmit(data: FormValues) {
    createCaregiver.mutate({
      data
    }, {
      onSuccess: (result) => {
        toast({
          title: "Welcome to CareConnect!",
          description: "Your caregiver profile has been created successfully.",
        });
        setLocation(`/caregivers/${result.id}`);
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to create profile. Please try again.",
          variant: "destructive",
        });
      }
    });
  }

  return (
    <div className="min-h-screen bg-muted/10 py-12 md:py-20">
      <div className="container mx-auto px-4 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-4 text-primary border-primary/20 bg-primary/5">Join Our Network</Badge>
            <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">Become a Caregiver</h1>
            <p className="text-lg text-muted-foreground">
              Create your profile to connect with families who need your expertise and compassion.
            </p>
          </div>

          <Card className="border-border/50 shadow-xl overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-primary via-secondary to-primary"></div>
            <CardContent className="pt-8 md:p-10">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Jane Smith" {...field} />
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
                            <Input placeholder="City, State" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="categoryIds"
                    render={() => (
                      <FormItem>
                        <div className="mb-4">
                          <FormLabel className="text-base">Specialties</FormLabel>
                          <FormDescription>
                            Select the areas where you have professional experience.
                          </FormDescription>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-3 bg-muted/20 p-4 rounded-xl border border-border/40">
                          {categories?.map((item) => (
                            <FormField
                              key={item.id}
                              control={form.control}
                              name="categoryIds"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={item.id}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(item.id)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, item.id])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== item.id
                                                )
                                              )
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer">
                                      {item.name}
                                    </FormLabel>
                                  </FormItem>
                                )
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="yearsExperience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Years of Experience</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="hourlyRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hourly Rate ($)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                              <Input type="number" className="pl-7" min="15" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Professional Bio</FormLabel>
                        <FormDescription>
                          Tell families about your background, approach to care, and why you love what you do.
                        </FormDescription>
                        <FormControl>
                          <Textarea 
                            placeholder="I have been working as a specialized caregiver for over 10 years, focusing primarily on..." 
                            className="min-h-[150px] resize-y"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="pt-6 border-t border-border/40">
                    <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl mb-6">
                      <h4 className="font-medium text-primary mb-1">Background Check Notice</h4>
                      <p className="text-sm text-muted-foreground">
                        By submitting this form, you agree to undergo our standard verification process and background check before your profile becomes fully active.
                      </p>
                    </div>
                    
                    <Button 
                      type="submit" 
                      size="lg" 
                      className="w-full rounded-full h-14 text-lg shadow-md hover-elevate"
                      disabled={createCaregiver.isPending}
                    >
                      {createCaregiver.isPending ? "Creating Profile..." : "Create Caregiver Profile"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

// Temporary Badge component since it's not imported at the top
function Badge({ className, variant, children, ...props }: any) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`} {...props}>
      {children}
    </span>
  )
}
