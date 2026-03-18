import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AdminLayout from "./components/AdminLayout";
import ClientLayout from "./components/ClientLayout";
import { useAuth } from "./_core/hooks/useAuth";
import { lazy, Suspense, useEffect } from "react";
import { Loader2 } from "lucide-react";
import CookieConsent from "./components/CookieConsent";

// Landing page (public)
const Landing = lazy(() => import("./pages/Landing"));
const LoginPage = lazy(() => import("./pages/Login"));
const TermosPage = lazy(() => import("./pages/Termos"));
const PrivacidadePage = lazy(() => import("./pages/Privacidade"));

// Admin pages (lazy loaded)
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminUpload = lazy(() => import("./pages/admin/Upload"));
const AdminLeads = lazy(() => import("./pages/admin/Leads"));
const AdminCategories = lazy(() => import("./pages/admin/Categories"));
const AdminPricing = lazy(() => import("./pages/admin/Pricing"));
const AdminOrders = lazy(() => import("./pages/admin/Orders"));
const AdminAnalytics = lazy(() => import("./pages/admin/Analytics"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const AdminActivityLog = lazy(() => import("./pages/admin/ActivityLog"));

// Client pages (lazy loaded)
const ClientDashboard = lazy(() => import("./pages/client/Dashboard"));
const Explore = lazy(() => import("./pages/client/Explore"));
const CategoryDetail = lazy(() => import("./pages/client/CategoryDetail"));
const Cart = lazy(() => import("./pages/client/Cart"));
const MyOrders = lazy(() => import("./pages/client/MyOrders"));
const OrderDetail = lazy(() => import("./pages/client/OrderDetail"));
const SearchPage = lazy(() => import("./pages/client/Search"));
const ProfilePage = lazy(() => import("./pages/client/Profile"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}

function AdminRoutes() {
  return (
    <AdminLayout>
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/admin/upload" component={AdminUpload} />
          <Route path="/admin/leads" component={AdminLeads} />
          <Route path="/admin/categories" component={AdminCategories} />
          <Route path="/admin/pricing" component={AdminPricing} />
          <Route path="/admin/orders" component={AdminOrders} />
          <Route path="/admin/analytics" component={AdminAnalytics} />
          <Route path="/admin/users" component={AdminUsers} />
          <Route path="/admin/activity" component={AdminActivityLog} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </AdminLayout>
  );
}

function ClientRoutes() {
  return (
    <ClientLayout>
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/dashboard" component={ClientDashboard} />
          <Route path="/explore" component={Explore} />
          <Route path="/explore/:slug" component={CategoryDetail} />
          <Route path="/search" component={SearchPage} />
          <Route path="/cart" component={Cart} />
          <Route path="/orders" component={MyOrders} />
          <Route path="/orders/:id" component={OrderDetail} />
          <Route path="/profile" component={ProfilePage} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </ClientLayout>
  );
}

function AdminGuard() {
  const { user } = useAuth();
  if (user?.role !== "admin") return <Redirect to="/dashboard" />;
  return <AdminRoutes />;
}

/**
 * PostLoginRedirect: handles redirect after OAuth callback
 * Checks sessionStorage for saved return path and redirects accordingly
 */
function PostLoginRedirect() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading || !user) return;

    // Check for saved return path
    const returnPath = sessionStorage.getItem("leasy-return-path");
    if (returnPath) {
      sessionStorage.removeItem("leasy-return-path");
      // Don't redirect to login or root
      if (returnPath !== "/" && returnPath !== "/login") {
        window.location.replace(returnPath);
        return;
      }
    }

    // Default redirect based on role
    if (user.role === "admin") {
      window.location.replace("/admin");
    } else {
      window.location.replace("/dashboard");
    }
  }, [user, loading]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F0F0F]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-[#FF4500] border-t-transparent rounded-full animate-spin" />
        <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Entrando...</span>
      </div>
    </div>
  );
}

function AppRouter() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not authenticated: show public pages
  if (!user) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/" component={Landing} />
          <Route path="/login" component={LoginPage} />
          <Route path="/termos" component={TermosPage} />
          <Route path="/privacidade" component={PrivacidadePage} />
          <Route>
            <Redirect to="/login" />
          </Route>
        </Switch>
      </Suspense>
    );
  }

  // Authenticated: route based on path
  return (
    <Switch>
      {/* Root redirect — handles post-login redirect */}
      <Route path="/">
        <PostLoginRedirect />
      </Route>

      {/* Public pages accessible when logged in too */}
      <Route path="/termos">
        <Suspense fallback={<PageLoader />}>
          <TermosPage />
        </Suspense>
      </Route>
      <Route path="/privacidade">
        <Suspense fallback={<PageLoader />}>
          <PrivacidadePage />
        </Suspense>
      </Route>

      {/* Login page redirect when already authenticated */}
      <Route path="/login">
        <PostLoginRedirect />
      </Route>

      {/* Admin routes - match both /admin and /admin/* */}
      <Route path="/admin" component={AdminGuard} />
      <Route path="/admin/:rest*" component={AdminGuard} />

      {/* Client routes - for everyone */}
      <Route path="/dashboard" component={ClientRoutes} />
      <Route path="/dashboard/:rest*" component={ClientRoutes} />
      <Route path="/explore" component={ClientRoutes} />
      <Route path="/explore/:rest*" component={ClientRoutes} />
      <Route path="/search" component={ClientRoutes} />
      <Route path="/cart" component={ClientRoutes} />
      <Route path="/orders" component={ClientRoutes} />
      <Route path="/orders/:rest*" component={ClientRoutes} />
      <Route path="/profile" component={ClientRoutes} />

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <AppRouter />
          <CookieConsent />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
