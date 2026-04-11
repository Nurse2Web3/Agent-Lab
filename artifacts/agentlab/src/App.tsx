import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Layout & Pages
import { Layout } from "@/components/layout";
import Landing from "@/pages/landing";
import Playground from "@/pages/playground";
import History from "@/pages/history";
import Settings from "@/pages/settings";
import Pricing from "@/pages/pricing";
import Usage from "@/pages/usage";
import Success from "@/pages/success";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/playground" component={Playground} />
        <Route path="/usage" component={Usage} />
        <Route path="/history" component={History} />
        <Route path="/settings" component={Settings} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/success" component={Success} />
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
