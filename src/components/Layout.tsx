import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/context/AuthContext';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  NavigationMenu, 
  NavigationMenuItem, 
  NavigationMenuLink, 
  NavigationMenuList, 
  navigationMenuTriggerStyle 
} from "@/components/ui/navigation-menu";
import Logo from '@/assets/logo.png'; // Import the logo

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, signOut } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          {/* Logo and Project Name */}
          <div className="flex items-center space-x-4">
            <img 
              src={Logo} 
              alt="Smart Nutrition Logo" 
              className="h-10 w-10 object-contain" 
            />
            <div className="text-xl font-bold">Smart Nutrition</div>
          </div>

          {/* Navigation Menu */}
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link to="/">
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Home
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>

              {currentUser && (
                <>
                  <NavigationMenuItem>
                    <Link to="/dashboard">
                      <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                        Dashboard
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                  
                  {currentUser.email === 'reggietest655@gmail.com' && (
                    <NavigationMenuItem>
                      <Link to="/admin">
                        <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                          Admin
                        </NavigationMenuLink>
                      </Link>
                    </NavigationMenuItem>
                  )}
                </>
              )}
            </NavigationMenuList>
          </NavigationMenu>

          {/* User Menu */}
          {currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  {currentUser.email || 'User'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={signOut}>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login">
              <Button>Login</Button>
            </Link>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 py-4 text-center">
        <p>&copy; {new Date().getFullYear()} Smart Nutrition. All rights reserved.</p>
      </footer>
    </div>
  );
};
