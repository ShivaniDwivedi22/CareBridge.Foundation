import { Link, useLocation } from "wouter";
import { HeartHandshake, Menu, X, UserCircle, Briefcase, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: "Find Care", href: "/caregivers", icon: UserCircle },
    { name: "Care Requests", href: "/care-requests", icon: Briefcase },
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20 selection:text-primary-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-primary/10 p-2 rounded-xl group-hover:bg-primary/20 transition-colors">
              <HeartHandshake className="h-6 w-6 text-primary" />
            </div>
            <span className="font-serif text-xl font-bold tracking-tight text-foreground">
              CareConnect
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <div className="flex items-center gap-6 text-sm font-medium">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`transition-colors hover:text-primary ${
                    location === item.href ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" asChild className="font-medium">
                <Link href="/become-caregiver">Become a Caregiver</Link>
              </Button>
              <Button asChild className="rounded-full shadow-sm hover-elevate">
                <Link href="/post-request">Post a Request</Link>
              </Button>
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-muted-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border/40 bg-background">
            <nav className="flex flex-col p-4 gap-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 p-3 rounded-lg text-sm font-medium ${
                    location === item.href
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              ))}
              <div className="grid gap-2 pt-4 border-t border-border/40 mt-2">
                <Button variant="outline" asChild className="w-full justify-center">
                  <Link href="/become-caregiver" onClick={() => setIsMobileMenuOpen(false)}>
                    Become a Caregiver
                  </Link>
                </Button>
                <Button asChild className="w-full justify-center rounded-full">
                  <Link href="/post-request" onClick={() => setIsMobileMenuOpen(false)}>
                    Post a Request
                  </Link>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1 flex flex-col">{children}</main>

      <footer className="border-t border-border/40 bg-muted/30 py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
            <div className="col-span-1 md:col-span-2 max-w-sm">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <HeartHandshake className="h-6 w-6 text-primary" />
                <span className="font-serif text-xl font-bold tracking-tight">CareConnect</span>
              </Link>
              <p className="text-muted-foreground leading-relaxed">
                The trusted bridge between families who need compassionate care and vetted professionals who provide it. Like asking a knowledgeable friend for a trusted recommendation.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Find Care</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="/caregivers" className="hover:text-primary transition-colors">Browse Caregivers</Link></li>
                <li><Link href="/post-request" className="hover:text-primary transition-colors">Post a Request</Link></li>
                <li><Link href="/care-requests" className="hover:text-primary transition-colors">View Requests</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">For Caregivers</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="/become-caregiver" className="hover:text-primary transition-colors">Become a Caregiver</Link></li>
                <li><Link href="/care-requests" className="hover:text-primary transition-colors">Find Jobs</Link></li>
                <li><Link href="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border/40 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} CareConnect. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
