import React from 'react';
import { Navigate, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { FoodLogProvider } from "@/context/FoodLogContext";
import Index from "@/pages/Index";
import AdminPanel from "@/pages/AdminPanel";
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { initializeUserRecord } from "@/userInitialization";

// Private Route Component
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  console.log('PrivateRoute: ', { 
    isAuthenticated, 
    isLoading, 
    currentPath: location.pathname 
  });

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">
      <div>Loading... Please wait</div>
    </div>;
  }

  if (!isAuthenticated) {
    // Redirect to login, preserving the current location
    console.log('Redirecting to login');
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// Admin Route Guard Component
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">
      <div>Loading... Please wait</div>
    </div>;
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

// Main Layout Component (Login/Signup)
const MainLayout: React.FC = () => {
  const { isAuthenticated, isLoading, logout, login, signup } = useAuth();
  const navigate = useLocation();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = React.useState(true);
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');

  console.log('MainLayout: ', { 
    isAuthenticated, 
    isLoading 
  });

  React.useEffect(() => {
    console.log('Auth state changed:', { isAuthenticated, isLoading });
    if (isAuthenticated && !isLoading) {
      navigate('/index', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isLogin) {
        await login(email, password);
        // Navigation will be handled by the useEffect
      } else {
        if (password !== confirmPassword) {
          toast({
            title: "Password Error",
            description: "Passwords do not match",
            variant: "destructive"
          });
          return;
        }
        await signup(email, password, { name });
        // Navigation will be handled by the useEffect
      }
    } catch (error) {
      console.error('Authentication error:', error);
      toast({
        title: "Authentication Error",
        description: isLogin ? "Login failed" : "Signup failed",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">
      <div>Loading... Please wait</div>
    </div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/index" />;
  }

  // Login/Signup form
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md p-8">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {isLogin ? 'Login' : 'Sign Up'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Enter your name"
              />
            </div>
          )}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </div>
          {!isLogin && (
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirm your password"
              />
            </div>
          )}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait</>
            ) : (
              isLogin ? 'Login' : 'Sign Up'
            )}
          </Button>
          <Separator className="my-4" />
          <div className="text-center">
            <Button 
              type="button" 
              variant="link" 
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin 
                ? 'Need an account? Sign Up' 
                : 'Already have an account? Login'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

// Main App Component
const App: React.FC = () => {
  // Initialize user record when the app starts
  React.useEffect(() => {
    console.log('App component mounted');
    initializeUserRecord();
  }, []);

  return (
    <AuthProvider>
      <FoodLogProvider>
        <Routes>
          <Route path="/" element={<MainLayout />} />
          <Route 
            path="/index" 
            element={
              <PrivateRoute>
                <Index />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <PrivateRoute>
                <AdminRoute>
                  <AdminPanel />
                </AdminRoute>
              </PrivateRoute>
            } 
          />
          {/* Add a catch-all route to handle 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </FoodLogProvider>
    </AuthProvider>
  );
};

export default App;
