import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isWithinInterval } from 'date-fns';
import { useFoodLog } from "@/context/FoodLogContext";
import { Flame } from "lucide-react";

interface CalendarProps {
  // Add any specific props you might need
}

export const Calendar: React.FC<CalendarProps> = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { foodLog } = useFoodLog();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center mb-4">
        <button 
          onClick={() => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
          className="p-2 bg-gray-200 rounded"
        >
          Prev
        </button>
        <h2 className="text-xl font-bold">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <button 
          onClick={() => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
          className="p-2 bg-gray-200 rounded"
        >
          Next
        </button>
      </div>
    );
  };

  const renderDays = () => {
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekdays.map(day => (
          <div key={day} className="text-center font-semibold text-sm">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCalendar = () => {
    return (
      <div className="grid grid-cols-7 gap-1">
        {daysInMonth.map(day => {
          // Find meals for this specific day
          const dayMeals = foodLog.filter(entry => {
            const entryDate = new Date(entry.date);
            return (
              entryDate.getFullYear() === day.getFullYear() &&
              entryDate.getMonth() === day.getMonth() &&
              entryDate.getDate() === day.getDate()
            );
          });

          return (
            <div 
              key={day.toISOString()} 
              className={`
                text-center 
                p-2 
                border 
                rounded 
                relative
                ${isToday(day) ? 'bg-blue-200' : 'bg-white'}
                ${dayMeals.length > 0 ? 'bg-green-100' : ''}
                hover:bg-gray-100
              `}
            >
              <div className="flex justify-between items-center">
                <span>{format(day, 'd')}</span>
                {dayMeals.length > 0 && (
                  <div 
                    className="absolute top-1 right-1 flex items-center text-xs text-green-600"
                    title={`${dayMeals.length} meal(s) logged`}
                  >
                    <Flame className="w-4 h-4" />
                    <span>{dayMeals.length}</span>
                  </div>
                )}
              </div>
              {dayMeals.length > 0 && (
                <div className="mt-1 text-xs text-gray-600">
                  {dayMeals.map((meal, index) => (
                    <div key={index} className="truncate">
                      {meal.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      {renderHeader()}
      {renderDays()}
      {renderCalendar()}
    </div>
  );
};
