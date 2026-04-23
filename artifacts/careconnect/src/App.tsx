import { useEffect, useRef } from "react";
// import { ClerkProvider, SignIn, SignUp, SignedIn, SignedOut, useClerk } from '@clerk/react';
import { SignedIn, SignedOut } from "@/components/clerk-helpers";
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from 'wouter';
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { Layout } from "@/components/layout";
import Home from "@/pages/home";
import Caregivers from "@/pages/caregivers/index";
import CaregiverDetail from "@/pages/caregivers/[id]";
import CareRequests from "@/pages/care-requests/index";
import CareRequestDetail from "@/pages/care-requests/[id]";
import PostRequest from "@/pages/post-request";
import BecomeCaregiver from "@/pages/become-caregiver";
import Dashboard from "@/pages/dashboard";
import MessagesPage from "@/pages/messages/index";
import MessageThread from "@/pages/messages/[id]";
import AdminPanel from "@/pages/admin";
import CheckoutPage from "@/pages/payments/checkout";
import PaymentHistory from "@/pages/payments/history";
import PaymentSuccess from "@/pages/payments/success";
import CancelBooking from "@/pages/bookings/cancel";
import { loadStripe } from "@stripe/stripe-js";

const queryClient = new QueryClient();

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");


function stripBase(path: string): string {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || "/" : path;
}

function SignInPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);
  return null;
}

//  use SignedIn/SignedOut instead of broken Show component
function Protected({ component: Component }: { component: React.ComponentType }) {
  return (
    <>
      <SignedIn><Component /></SignedIn>
      <SignedOut><Redirect to="/sign-in" /></SignedOut>
    </>
  );
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/caregivers" component={Caregivers} />
        <Route path="/caregivers/:id" component={CaregiverDetail} />
        <Route path="/care-requests" component={CareRequests} />
        <Route path="/care-requests/:id" component={CareRequestDetail} />
        <Route path="/post-request">
          {() => <Protected component={PostRequest} />}
        </Route>
        <Route path="/become-caregiver">
          {() => <Protected component={BecomeCaregiver} />}
        </Route>
        <Route path="/dashboard">
          {() => <Protected component={Dashboard} />}
        </Route>
        <Route path="/messages">
          {() => <Protected component={MessagesPage} />}
        </Route>
        <Route path="/messages/:id">
          {() => <Protected component={MessageThread} />}
        </Route>
        <Route path="/admin">
          {() => <Protected component={AdminPanel} />}
        </Route>
        <Route path="/checkout" component={CheckoutPage} />
        <Route path="/payments/success" component={PaymentSuccess} />
        <Route path="/payments/history">
          {() => <Protected component={PaymentHistory} />}
        </Route>
        <Route path="/bookings/cancel" component={CancelBooking} />
        <Route path="/sign-in/*?" component={SignInPage} />
        <Route path="/sign-up/*?" component={SignUpPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  if (!clerkPubKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-8">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Configuration Error</h1>
          <p className="text-muted-foreground">
            The <code className="bg-muted px-1 rounded">VITE_CLERK_PUBLISHABLE_KEY</code> environment
            variable is not set. Please add it in your Vercel project settings under{" "}
            <strong>Settings → Environment Variables</strong> and redeploy.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ClerkQueryClientCacheInvalidator />
          <Router />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
