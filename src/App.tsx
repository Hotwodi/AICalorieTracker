import React from 'react';
import { Navigate, Routes, Route, useNavigate } from 'react-router-dom';
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

// Admin route guard component
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

const MainLayout: React.FC = () => {
  const { isAuthenticated, isLoading, logout, login, signup } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = React.useState(true);
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');

  // Redirect to Index page when authenticated
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

  // If already authenticated, redirect
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

const App: React.FC = () => {
  // Initialize user record when the app starts
  React.useEffect(() => {
    initializeUserRecord();
  }, []);

  return (
    <AuthProvider>
      <FoodLogProvider>
        <Routes>
          <Route path="/" element={<MainLayout />} />
          <Route path="/index" element={<Index />} />
          <Route 
            path="/admin" 
            element={
              <AdminRoute>
                <AdminPanel />
              </AdminRoute>
            } 
          />
        </Routes>
        <Toaster />
      </FoodLogProvider>
    </AuthProvider>
  );
};

export default App;
