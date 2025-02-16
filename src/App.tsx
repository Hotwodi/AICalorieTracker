import React from 'react';
import { Navigate } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { FoodLogProvider } from "@/context/FoodLogContext";
import Index from "@/pages/Index";
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { initializeUserRecord } from "@/userInitialization";

const MainLayout: React.FC = () => {
  const { isAuthenticated, isLoading, logout, login, signup } = useAuth();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = React.useState(true);
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (password !== confirmPassword) {
          toast({
            title: "Password Error",
            description: "Passwords do not match",
            variant: "destructive",
          });
          return;
        }
        await signup(email, password, { name });
      }
    } catch (error) {
      console.error('Authentication error:', error);
      toast({
        title: isLogin ? "Login Failed" : "Signup Failed",
        description: error instanceof Error ? error.message : "Authentication failed",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4 bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-accent/20">
        <Card className="w-full max-w-md p-6">
          <h2 className="text-2xl font-bold text-center mb-4">
            {isLogin ? 'Login' : 'Sign Up'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <Label>Name</Label>
                <Input 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                  placeholder="Your name" 
                />
              </div>
            )}
            <div>
              <Label>Email</Label>
              <Input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                placeholder="Your email" 
              />
            </div>
            <div>
              <Label>Password</Label>
              <Input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                minLength={6} 
                placeholder="Your password" 
              />
            </div>
            {!isLogin && (
              <div>
                <Label>Confirm Password</Label>
                <Input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  required 
                  minLength={6} 
                  placeholder="Confirm password" 
                />
              </div>
            )}
            <Button type="submit" className="w-full">
              {isLogin ? 'Login' : 'Sign Up'}
            </Button>
          </form>
          
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:underline"
            >
              {isLogin ? 'Sign up' : 'Login'}
            </button>
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <nav className="p-4 bg-background border-b">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">AI Calorie Tracker</h1>
          <Button variant="ghost" onClick={logout}>Logout</Button>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto p-4">
        <Index />
      </main>
    </div>
  );
};

const App = () => {
  // Initialize user record when the app starts
  React.useEffect(() => {
    initializeUserRecord();
  }, []);

  return (
    <AuthProvider>
      <FoodLogProvider>
        <MainLayout />
        <Toaster />
      </FoodLogProvider>
    </AuthProvider>
  );
};

export default App;
