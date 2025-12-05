import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools/production";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { FullPageLoader } from "./components/ui/loading-spinner";
import AdminProtectedRoute from "./components/auth/AdminProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Subscribers from "./pages/Subscribers";
import Plans from "./pages/Plans";
import Invoices from "./pages/Invoices";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";
import ClientProfile from "./pages/ClientProfile";
import Services from "./pages/Services";
import Login from "./pages/Login";
import { useAuthInit } from "./hooks/useAuthInit";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Simple layout wrapper for dashboard routes
const DashboardWrapper = () => (
  <DashboardLayout>
    <Outlet />
  </DashboardLayout>
);

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Redirect root to dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Protected admin routes */}
      <Route
        element={
          <AdminProtectedRoute>
            <DashboardWrapper />
          </AdminProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Client routes */}
        <Route path="/dashboard/clients">
          <Route index element={<Clients />} />
          <Route path="new" element={<ClientProfile />} />
          <Route path=":id" element={<ClientProfile />} />
        </Route>

        {/* Subscriber routes */}
        <Route path="/dashboard/subscribers">
          <Route index element={<Subscribers />} />
          <Route path=":id" element={<ClientProfile />} />
        </Route>

        <Route path="/dashboard/plans" element={<Plans />} />
        <Route path="/dashboard/invoices" element={<Invoices />} />
        <Route path="/dashboard/settings" element={<Settings />} />
        <Route path="/dashboard/services" element={<Services />} />

        {/* Legacy routes - redirect to new dashboard paths */}
        <Route
          path="/clients/:id"
          element={
            <Navigate
              to="/dashboard/clients/:id"
              replace
              state={{ from: window.location.pathname }}
            />
          }
        />
        <Route
          path="/subscribers"
          element={<Navigate to="/dashboard/subscribers" replace />}
        />

        {/* Additional legacy routes that should use the dashboard layout */}
        <Route path="/plans" element={<Plans />} />
        <Route path="/services" element={<Services />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* Redirect any unknown routes to dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

function App() {
  const { isReady } = useAuthInit();


  // Show loader while auth is initializing
  if (!isReady) {
    return <FullPageLoader />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <ErrorBoundary>
          <TooltipProvider>
            <AppRoutes />
            <Toaster />
            <Sonner position="top-right" />
            <ReactQueryDevtools initialIsOpen={false} />
          </TooltipProvider>
        </ErrorBoundary>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
