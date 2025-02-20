import React from 'react';
import { Card } from "@/components/ui/card";
import { useFoodLog } from "@/context/FoodLogContext";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';
import { cn } from "@/lib/utils";

export const Calendar = () => {
  const { dailyMacroGoals, getTodaysMacroTotals } = useFoodLog();
  const today = new Date();
  const firstDayOfMonth = startOfMonth(today);
  const lastDayOfMonth = endOfMonth(today);
  
  const days = eachDayOfInterval({
    start: firstDayOfMonth,
    end: lastDayOfMonth,
  });

  // Get the day of the week for the first day (0 = Sunday)
  const firstDayOfWeek = firstDayOfMonth.getDay();

  // Calculate goals achievement
  const checkGoalsAchievement = (date: Date) => {
    const macros = getTodaysMacroTotals();
    
    // Check if all macros are within 90-100% of goals
    const caloriesAchieved = macros.calories >= dailyMacroGoals.calories * 0.9;
    const proteinAchieved = macros.protein >= dailyMacroGoals.protein * 0.9;
    const carbsAchieved = macros.carbs >= dailyMacroGoals.carbs * 0.9;
    const fatAchieved = macros.fat >= dailyMacroGoals.fat * 0.9;

    return caloriesAchieved && proteinAchieved && carbsAchieved && fatAchieved;
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">
            {format(today, 'MMMM yyyy')}
          </h2>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {/* Week days header */}
          {weekDays.map((day) => (
            <div
              key={day}
              className="h-10 flex items-center justify-center font-semibold text-sm"
            >
              {day}
            </div>
          ))}

          {/* Empty cells for days before the first day of month */}
          {Array.from({ length: firstDayOfWeek }).map((_, index) => (
            <div key={`empty-${index}`} className="h-24 p-2 border border-border/50" />
          ))}

          {/* Calendar days */}
          {days.map((day) => {
            const isToday = isSameDay(day, today);
            const isCurrentMonth = isSameMonth(day, today);
            const goalsAchieved = checkGoalsAchievement(day);
            
            return (
              <div
                key={day.toString()}
                className={cn(
                  "h-24 p-2 border border-border/50 relative",
                  isCurrentMonth ? "bg-background" : "bg-muted/50",
                  isToday && "ring-2 ring-primary",
                  goalsAchieved ? "bg-green-500/10" : "bg-red-500/10"
                )}
              >
                <span
                  className={cn(
                    "absolute top-1 right-1 h-6 w-6 text-sm flex items-center justify-center rounded-full",
                    isToday && "bg-primary text-primary-foreground"
                  )}
                >
                  {format(day, 'd')}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};
