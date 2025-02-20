import React, { useState, useEffect } from 'react';
import { UserService } from '../services/user-service';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Users, TrendingUp, Star } from 'lucide-react';

export const UserStatistics: React.FC = () => {
  const [userStats, setUserStats] = useState<{
    totalUsers: number;
    averageLoginCount: number;
    mostActiveUsers: any[];
  }>({
    totalUsers: 0,
    averageLoginCount: 0,
    mostActiveUsers: []
  });

  useEffect(() => {
    const fetchUserStatistics = async () => {
      try {
        const statistics = await UserService.getUserLoginStatistics();
        setUserStats(statistics);
      } catch (error) {
        console.error('Failed to fetch user statistics', error);
      }
    };

    fetchUserStatistics();
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>User Statistics</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-4">
        <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
          <Users className="h-8 w-8 text-blue-500" />
          <div>
            <p className="text-sm text-gray-500">Total Users</p>
            <p className="text-2xl font-bold">{userStats.totalUsers}</p>
          </div>
        </div>

        <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
          <TrendingUp className="h-8 w-8 text-green-500" />
          <div>
            <p className="text-sm text-gray-500">Avg Logins</p>
            <p className="text-2xl font-bold">
              {userStats.averageLoginCount.toFixed(1)}
            </p>
          </div>
        </div>

        <div className="flex flex-col space-y-2">
          <p className="text-sm font-semibold flex items-center">
            <Star className="h-4 w-4 mr-2 text-yellow-500" />
            Most Active Users
          </p>
          {userStats.mostActiveUsers.map((user, index) => (
            <div key={user.id} className="text-xs">
              {index + 1}. {user.email} ({user.loginCount} logins)
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
