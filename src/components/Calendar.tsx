import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { 
  addCalendarEntry, 
  getCalendarEntriesByUser, 
  updateCalendarEntry, 
  CalendarEntry 
} from '@/lib/firebase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Logger } from '@/lib/logger';

export const Calendar: React.FC = () => {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const logger = new Logger('Calendar');

  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarEntries, setCalendarEntries] = useState<{[key: string]: CalendarEntry}>({});
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [dayNote, setDayNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch calendar entries for the current month
  useEffect(() => {
    const fetchEntries = async () => {
      // Validate user and permissions
      if (!user) {
        setError('User not authenticated');
        return;
      }

      if (!userProfile?.permissions?.read) {
        setError('Insufficient permissions to view calendar');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const monthStart = format(startOfMonth(currentDate), 'yyyy-MM-dd');
        const monthEnd = format(endOfMonth(currentDate), 'yyyy-MM-dd');
        
        const entries = await getCalendarEntriesByUser(
          user.uid, 
          monthStart, 
          monthEnd
        );

        // Convert entries to a map for easy lookup
        const entriesMap = entries.reduce((acc, entry) => {
          acc[entry.date] = entry;
          return acc;
        }, {} as {[key: string]: CalendarEntry});

        setCalendarEntries(entriesMap);
        logger.info('Calendar entries fetched successfully', { 
          entryCount: entries.length 
        });
      } catch (error) {
        const errorMessage = error instanceof Error 
          ? error.message 
          : 'Unknown error fetching calendar entries';
        
        setError(errorMessage);
        logger.error('Failed to fetch calendar entries', { 
          error: errorMessage,
          userId: user?.uid 
        });

        toast({
          title: "Error Loading Calendar",
          description: errorMessage,
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEntries();
  }, [currentDate, user, userProfile, toast]);

  // Render loading or error state
  if (isLoading) {
    return (
      <div className="text-center py-4">
        <p>Loading calendar entries...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4 text-red-500">
        <p>Error: {error}</p>
        <Button 
          onClick={() => {
            setError(null);
            setCurrentDate(new Date()); // Reset to current month
          }}
          className="mt-2"
        >
          Try Again
        </Button>
      </div>
    );
  }

  // Add or update a calendar entry
  const handleSaveEntry = async () => {
    if (!user || !selectedDay) return;

    const dateString = format(selectedDay, 'yyyy-MM-dd');

    try {
      const existingEntry = calendarEntries[dateString];

      if (existingEntry) {
        // Update existing entry
        await updateCalendarEntry(existingEntry.id!, {
          notes: dayNote
        });
      } else {
        // Create new entry
        const newEntryId = await addCalendarEntry(user.uid, {
          date: dateString,
          notes: dayNote,
          completed: false
        });

        // Update local state
        setCalendarEntries(prev => ({
          ...prev,
          [dateString]: { 
            id: newEntryId, 
            userId: user.uid, 
            date: dateString, 
            notes: dayNote,
            completed: false 
          }
        }));
      }

      toast({
        title: "Success",
        description: "Calendar entry saved",
        variant: "default"
      });

      // Close dialog
      setSelectedDay(null);
      setDayNote('');
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Unknown error saving calendar entry';
      
      setError(errorMessage);
      logger.error('Failed to save calendar entry', { 
        error: errorMessage,
        userId: user?.uid 
      });

      toast({
        title: "Error Saving Calendar Entry",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center mb-4">
        <Button 
          variant="outline"
          onClick={() => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
        >
          Prev
        </Button>
        <h2 className="text-xl font-bold">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <Button 
          variant="outline"
          onClick={() => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
        >
          Next
        </Button>
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
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return (
      <div className="grid grid-cols-7 gap-1">
        {daysInMonth.map(day => {
          const dateString = format(day, 'yyyy-MM-dd');
          const hasEntry = !!calendarEntries[dateString];

          return (
            <Dialog 
              key={dateString} 
              open={selectedDay?.toDateString() === day.toDateString()}
              onOpenChange={(open) => {
                if (open) {
                  setSelectedDay(day);
                  const existingEntry = calendarEntries[dateString];
                  setDayNote(existingEntry?.notes || '');
                } else {
                  setSelectedDay(null);
                }
              }}
            >
              <DialogTrigger asChild>
                <div 
                  className={`
                    text-center 
                    p-2 
                    border 
                    rounded 
                    cursor-pointer
                    ${isToday(day) ? 'bg-blue-200' : 'bg-white'}
                    ${hasEntry ? 'border-green-500' : 'border-gray-200'}
                    hover:bg-gray-100
                  `}
                >
                  {format(day, 'd')}
                  {hasEntry && <span className="text-xs text-green-600 block">Note</span>}
                </div>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {format(day, 'MMMM d, yyyy')}
                  </DialogTitle>
                </DialogHeader>
                <Input 
                  placeholder="Add a note for this day"
                  value={dayNote}
                  onChange={(e) => setDayNote(e.target.value)}
                />
                <Button onClick={handleSaveEntry}>
                  Save Note
                </Button>
              </DialogContent>
            </Dialog>
          );
        })}
      </div>
    );
  };

  if (!user) return null;

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      {renderHeader()}
      {renderDays()}
      {renderCalendar()}
    </div>
  );
};
