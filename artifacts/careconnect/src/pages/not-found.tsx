import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { HeartHandshake, Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center bg-background">
      <div className="max-w-md mx-auto px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <HeartHandshake className="w-10 h-10 text-primary" />
        </div>
        <h1 className="font-serif text-5xl font-bold text-primary mb-2">404</h1>
        <h2 className="text-xl font-semibold mb-3">Page not found</h2>
        <p className="text-muted-foreground mb-2">
          Oops — this page has wandered off. But the right care is just a click away.
        </p>
        <p className="text-sm text-muted-foreground italic mb-8">
          "Ghar jaisa care, aap ke liye."
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Button asChild variant="outline" className="rounded-full gap-2">
            <Link href="/"><Home className="w-4 h-4" /> Go Home</Link>
          </Button>
          <Button asChild className="rounded-full gap-2">
            <Link href="/caregivers"><Search className="w-4 h-4" /> Find Caregivers</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
