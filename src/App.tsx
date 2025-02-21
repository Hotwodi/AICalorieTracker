import React from 'react';
import { 
  Navigate, 
  Routes, 
  Route, 
  Outlet,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements
} from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { FoodLogProvider } from "@/context/FoodLogContext";
import { MealSuggestionProvider } from "@/context/MealSuggestionContext";
import { Layout } from "@/components/Layout";
import { Loader2 } from 'lucide-react';
import Index from "@/pages/Index";
import AdminPanel from "@/pages/AdminPanel";
import MainLayout from "@/pages/MainLayout";

const ProtectedRoute: React.FC<{ 
  children: React.ReactNode, 
  adminOnly?: boolean 
}> = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  console.log('[ProtectedRoute] Current state:', {
    isAuthenticated,
    isLoading,
    user: user ? user.email : 'No user',
    adminOnly
  });

  if (isLoading) {
    console.log('[ProtectedRoute] Still loading, showing loader');
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('[ProtectedRoute] Not authenticated, redirecting to home');
    return <Navigate to="/" replace />;
  }

  if (adminOnly && (!user || user.role !== 'admin')) {
    console.log('[ProtectedRoute] Not an admin, redirecting to index');
    return <Navigate to="/index" replace />;
  }

  console.log('[ProtectedRoute] Rendering protected content');
  return <>{children}</>;
};

const App: React.FC = () => {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route element={<Layout />}>
        <Route path="/" element={<MainLayout />} />
        <Route 
          path="/index" 
          element={
            <ProtectedRoute>
              <Index />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute adminOnly>
              <AdminPanel />
            </ProtectedRoute>
          } 
        />
      </Route>
    ),
    {
      // Add future flags to address deprecation warnings
      future: {
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }
    }
  );

  return (
    <AuthProvider>
      <FoodLogProvider>
        <MealSuggestionProvider>
          <RouterProvider router={router} />
          <Toaster />
        </MealSuggestionProvider>
      </FoodLogProvider>
    </AuthProvider>
  );
};

export default App;
