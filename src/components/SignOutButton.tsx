import React from 'react';
import { Button } from "@/components/ui/button";
import { LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const SignOutButton = ({ 
  className = '', 
  variant = 'ghost' 
}: { 
  className?: string, 
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' 
}) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await logout();
      toast.success('Signed out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Failed to sign out');
      console.error('Sign out error:', error);
    }
  };

  return (
    <Button 
      variant={variant} 
      onClick={handleSignOut} 
      className={`flex items-center gap-2 ${className}`}
    >
      <LogOut className="w-4 h-4" />
      Sign Out
    </Button>
  );
};
