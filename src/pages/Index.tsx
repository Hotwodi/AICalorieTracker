import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/context/AuthContext';
import Logo from '@/assets/logo.png';

const Index: React.FC = () => {
  const { currentUser } = useAuth();

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50">
      <div className="text-center mb-8">
        <div className="flex justify-center items-center mb-4">
          <img 
            src={Logo} 
            alt="Smart Nutrition Logo" 
            className="h-20 w-20 mr-4" 
          />
          <h1 className="text-4xl font-bold text-gray-800">Smart Nutrition</h1>
        </div>
        <p className="text-xl text-gray-600 mb-6">
          Your personal nutrition and wellness companion
        </p>
      </div>

      <Card className="w-[350px] shadow-lg">
        <CardHeader>
          <CardTitle className="text-center">Welcome to Smart Nutrition</CardTitle>
        </CardHeader>
        <CardContent>
          {currentUser ? (
            <div className="space-y-4">
              <p className="text-center">
                Welcome back, {currentUser.email || 'User'}!
              </p>
              <Link to="/dashboard" className="block">
                <Button className="w-full">
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <Link to="/login" className="block">
                <Button className="w-full">
                  Login
                </Button>
              </Link>
              <Link to="/signup" className="block">
                <Button variant="outline" className="w-full">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;