import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/caregivers" component={Caregivers} />
        <Route path="/caregivers/:id" component={CaregiverDetail} />
        <Route path="/care-requests" component={CareRequests} />
        <Route path="/care-requests/:id" component={CareRequestDetail} />
        <Route path="/post-request" component={PostRequest} />
        <Route path="/become-caregiver" component={BecomeCaregiver} />
        <Route path="/dashboard" component={Dashboard} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
