import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';

export const SubscriptionStatus: React.FC = () => {
  const { subscriptionStatus, upgradeToPremium } = useAuth();

  if (!subscriptionStatus) return null;

  const { isValid, remainingUploads, isPremium, trialDaysLeft } = subscriptionStatus;

  if (!isValid) {
    return (
      <Card className="w-full mb-4 border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-600">Trial Period Expired</CardTitle>
          <CardDescription>
            Your trial period has ended. Upgrade to premium to continue using all features.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={upgradeToPremium}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            Upgrade to Premium
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isPremium) {
    return (
      <Card className="w-full mb-4 border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-600">Premium Member</CardTitle>
          <CardDescription>
            Enjoy unlimited access to all features!
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full mb-4">
      <CardHeader>
        <CardTitle>Basic Plan</CardTitle>
        <CardDescription>
          {trialDaysLeft} days remaining in trial period
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2 text-sm">
              <span>Daily Uploads ({8 - remainingUploads}/8 used)</span>
              <span>{remainingUploads} remaining</span>
            </div>
            <Progress value={((8 - remainingUploads) / 8) * 100} />
          </div>
          
          {remainingUploads === 0 && (
            <div className="space-y-2">
              <p className="text-sm text-yellow-600">
                You've reached your daily upload limit. Upgrade to premium for unlimited uploads!
              </p>
              <Button 
                onClick={upgradeToPremium}
                className="w-full"
              >
                Upgrade to Premium
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
