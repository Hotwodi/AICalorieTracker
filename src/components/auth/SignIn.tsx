import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'react-router-dom';
import logo from '@/assets/logo.png';
import { cn } from '@/lib/utils';

export function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const user = await login(email, password);
      
      // Explicitly check for user and navigate
      if (user) {
        // Use replace to prevent going back to login page
        navigate('/index', { replace: true });
      } else {
        setError('Login failed. Please try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during sign-in');
    }
  };

  const handleImageError = () => {
    setImageError(true);
    console.error('Failed to load logo image');
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      {/* Logo Section */}
      <div className="flex justify-center mb-6">
        {!imageError ? (
          <img 
            src={logo} 
            alt="AI Calorie Tracker Logo" 
            onError={handleImageError}
            className={cn(
              "h-24 w-24 object-contain",
              "transition-all duration-300 hover:scale-110"
            )}
          />
        ) : (
          <div className="h-24 w-24 bg-gray-200 flex items-center justify-center rounded-full">
            <span className="text-gray-500 text-sm">Logo</span>
          </div>
        )}
      </div>

      <h2 className="text-2xl font-bold mb-6 text-center">Sign In</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSignIn} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Enter your email"
          />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            placeholder="Enter your password"
          />
        </div>
        <Button type="submit" className="w-full">
          Sign In
        </Button>
      </form>
      <div className="mt-4 text-center text-sm">
        Don't have an account? 
        <Link to="/signup" className="ml-1 text-blue-600 hover:underline">
          Sign Up
        </Link>
      </div>
    </div>
  );
}
