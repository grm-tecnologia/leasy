import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import CvPage from "./pages/CvPage";
import LinkedinPage from "./pages/LinkedinPage";
import AudioPage from "./pages/AudioPage";
import SsiPage from "./pages/SsiPage";
import TemplatesPage from "./pages/TemplatesPage";
import PlansPage from "./pages/PlansPage";
import AdminPage from "./pages/AdminPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard">
        <DashboardLayout><Dashboard /></DashboardLayout>
      </Route>
      <Route path="/cv">
        <DashboardLayout><CvPage /></DashboardLayout>
      </Route>
      <Route path="/linkedin">
        <DashboardLayout><LinkedinPage /></DashboardLayout>
      </Route>
      <Route path="/audio">
        <DashboardLayout><AudioPage /></DashboardLayout>
      </Route>
      <Route path="/ssi">
        <DashboardLayout><SsiPage /></DashboardLayout>
      </Route>
      <Route path="/templates">
        <DashboardLayout><TemplatesPage /></DashboardLayout>
      </Route>
      <Route path="/plans">
        <DashboardLayout><PlansPage /></DashboardLayout>
      </Route>
      <Route path="/admin">
        <DashboardLayout><AdminPage /></DashboardLayout>
      </Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
