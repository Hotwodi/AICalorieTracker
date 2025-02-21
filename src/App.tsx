import React from 'react';
import { Navigate, Routes, Route, Outlet } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { FoodLogProvider } from "@/context/FoodLogContext";
import { MealSuggestionProvider } from "@/context/MealSuggestionContext";
import { Layout } from "@/components/Layout";
import { Loader2 } from 'lucide-react';
import Index from "@/pages/Index";
import AdminPanel from "@/pages/AdminPanel";
import MainLayout from "@/pages/MainLayout";
import Auth from "@/pages/Auth"; 

const App: React.FC = () => {
  return (
    <AuthProvider>
      <FoodLogProvider>
        <MealSuggestionProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/auth" element={<Auth />} /> 
              <Route path="/" element={<Navigate to="/auth" replace />} /> 
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
          </Routes>
          <Toaster />
        </MealSuggestionProvider>
      </FoodLogProvider>
    </AuthProvider>
  );
};

const ProtectedRoute: React.FC<{ 
  children: React.ReactNode, 
  adminOnly?: boolean 
}> = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  console.log(`[ProtectedRoute] Current state: {isAuthenticated: ${isAuthenticated}, isLoading: ${isLoading}, user: '${user || 'No user'}', adminOnly: ${adminOnly}}`);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="mr-2 h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('[ProtectedRoute] Not authenticated, redirecting to home');
    return <Navigate to="/auth" replace />;
  }

  // Admin-only route check
  if (adminOnly && user !== 'reggietest655@gmail.com') {
    console.log('[ProtectedRoute] Not an admin, redirecting to home');
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

export default App;
