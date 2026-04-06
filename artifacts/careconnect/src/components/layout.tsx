import { Link, useLocation } from "wouter";
import { HeartHandshake, Menu, X, UserCircle, Briefcase, LayoutDashboard, MessageCircle, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Show, useUser, useClerk } from "@clerk/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function UserProfileDropdown() {
  const { user } = useUser();
  const clerk = useClerk();

  return (
    <div className="flex items-center gap-3 ml-4 border-l border-border/40 pl-4">
      <Avatar className="h-8 w-8 border border-border">
        <AvatarImage src={user?.imageUrl} />
        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
          {user?.firstName?.[0] || user?.emailAddresses[0]?.emailAddress[0].toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <span className="text-sm font-medium text-foreground max-w-[120px] truncate">
        {user?.firstName ?? user?.emailAddresses[0]?.emailAddress}
      </span>
      <Button variant="ghost" size="sm" onClick={() => clerk.signOut()} className="text-muted-foreground hover:text-foreground">
        Sign Out
      </Button>
    </div>
  );
}

function MobileUserActions({ closeMenu }: { closeMenu: () => void }) {
  const { user } = useUser();
  const clerk = useClerk();
  
  return (
    <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-border/40">
      <div className="flex items-center gap-3 p-2">
        <Avatar className="h-8 w-8 border border-border">
          <AvatarImage src={user?.imageUrl} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
            {user?.firstName?.[0] || user?.emailAddresses[0]?.emailAddress[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium text-foreground truncate">
          {user?.firstName ?? user?.emailAddresses[0]?.emailAddress}
        </span>
      </div>
      <Button 
        variant="ghost" 
        className="w-full justify-start text-muted-foreground" 
        onClick={() => { clerk.signOut(); closeMenu(); }}
      >
        Sign Out
      </Button>
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: "Find Care", href: "/caregivers", icon: UserCircle },
    { name: "Care Requests", href: "/care-requests", icon: Briefcase },
    { name: "Messages", href: "/messages", icon: MessageCircle, authOnly: true },
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, authOnly: true },
    { name: "Payments", href: "/payments/history", icon: ShieldCheck, authOnly: true },
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
              {navigation.filter(item => !item.authOnly).map((item) => (
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
              <Show when="signed-in">
                {navigation.filter(item => item.authOnly).map((item) => (
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
              </Show>
            </div>
            <div className="flex items-center gap-3">
              <Show when="signed-out">
                <Button variant="ghost" asChild className="font-medium">
                  <Link href="/sign-in">Sign In</Link>
                </Button>
                <Button variant="outline" asChild className="font-medium">
                  <Link href="/sign-up">Sign Up</Link>
                </Button>
                <Button asChild className="rounded-full shadow-sm hover-elevate">
                  <Link href="/sign-in">Post a Request</Link>
                </Button>
              </Show>
              <Show when="signed-in">
                <Button variant="ghost" asChild className="font-medium">
                  <Link href="/become-caregiver">Become a Caregiver</Link>
                </Button>
                <Button asChild className="rounded-full shadow-sm hover-elevate">
                  <Link href="/post-request">Post a Request</Link>
                </Button>
                <UserProfileDropdown />
              </Show>
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
                <Show when="signed-out">
                  <Button variant="ghost" asChild className="w-full justify-center">
                    <Link href="/sign-in" onClick={() => setIsMobileMenuOpen(false)}>Sign In</Link>
                  </Button>
                  <Button variant="outline" asChild className="w-full justify-center">
                    <Link href="/sign-up" onClick={() => setIsMobileMenuOpen(false)}>Sign Up</Link>
                  </Button>
                  <Button asChild className="w-full justify-center rounded-full">
                    <Link href="/sign-in" onClick={() => setIsMobileMenuOpen(false)}>
                      Post a Request
                    </Link>
                  </Button>
                </Show>
                <Show when="signed-in">
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
                  <MobileUserActions closeMenu={() => setIsMobileMenuOpen(false)} />
                </Show>
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
