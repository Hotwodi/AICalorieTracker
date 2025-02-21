import React from 'react';
import { Outlet } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { LogOut } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

export const Layout: React.FC = () => {
  const { logout, user } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await logout();
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
        variant: "default"
      });
    } catch (error: any) {
      toast({
        title: "Sign Out Error",
        description: error.message || "An error occurred while signing out.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white shadow-md p-4 flex justify-between items-center">
        <div className="text-xl font-bold">Snap Nutrition Guide</div>
        <div className="flex items-center space-x-4">
          {user && (
            <div className="mr-4 text-sm">
              Welcome, {user.displayName || user.email}
            </div>
          )}
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
          </Button>
        </div>
      </header>
      <main className="flex-grow p-4">
        <Outlet />
      </main>
    </div>
  );
};
