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

const App: React.FC = () => {
  return (
    <AuthProvider>
      <FoodLogProvider>
        <MealSuggestionProvider>
          <Routes>
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

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (adminOnly && (!user || user.role !== 'admin')) {
    return <Navigate to="/index" replace />;
  }

  return <>{children}</>;
};

export default App;
