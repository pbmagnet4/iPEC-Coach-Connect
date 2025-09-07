import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  AlertCircle, 
  Calendar, 
  CheckCircle, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  Globe,
  Loader2
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { type AvailableSlot, bookingService } from '../../services/booking.service';
import { coachManagementService } from '../../services/coach.service';
import { addDays, endOfWeek, format, isBefore, isSameDay, isToday, parseISO, startOfWeek } from 'date-fns';

interface BookingCalendarProps {
  coachId: string;
  sessionDurationMinutes: number;
  selectedDate?: Date;
  selectedTime?: string;
  onDateSelect: (date: Date) => void;
  onTimeSelect: (time: string, slot: AvailableSlot) => void;
  timezone?: string;
}

interface TimeSlot extends AvailableSlot {
  displayTime: string;
  isSelected: boolean;
  isPast: boolean;
}

export function BookingCalendar({
  coachId,
  sessionDurationMinutes,
  selectedDate,
  selectedTime,
  onDateSelect,
  onTimeSelect,
  timezone = 'America/New_York'
}: BookingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [coachTimezone, setCoachTimezone] = useState(timezone);

  // Load coach timezone and availability
  useEffect(() => {
    loadCoachAvailability();
  }, [coachId, currentMonth]);

  // Generate time slots when date changes
  useEffect(() => {
    if (selectedDate) {
      generateTimeSlotsForDate(selectedDate);
    } else {
      setTimeSlots([]);
    }
  }, [selectedDate, availableSlots]);

  const loadCoachAvailability = async () => {
    if (!coachId) return;

    setLoading(true);
    setError('');

    try {
      // Get coach profile to get timezone
      const coachResult = await coachManagementService.getCoachProfile(coachId);
      if (coachResult.data?.profile?.timezone) {
        setCoachTimezone(coachResult.data.profile.timezone);
      }

      // Get available slots for the current month
      const startDate = startOfWeek(currentMonth);
      const endDate = endOfWeek(addDays(currentMonth, 35)); // Cover full month view

      const slotsResult = await bookingService.getAvailableSlots(
        coachId,
        startDate.toISOString(),
        endDate.toISOString(),
        sessionDurationMinutes
      );

      if (slotsResult.error) {
        setError(slotsResult.error.message);
      } else {
        setAvailableSlots(slotsResult.data || []);
      }
    } catch (err) {
      setError('Failed to load availability. Please try again.');
  void console.error('Error loading coach availability:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateTimeSlotsForDate = (date: Date) => {
    const daySlots = availableSlots.filter(slot => 
      isSameDay(parseISO(slot.startTime), date)
    );

    const timeSlots: TimeSlot[] = daySlots.map(slot => {
      const startTime = parseISO(slot.startTime);
      const displayTime = format(startTime, 'h:mm a');
      const timeString = format(startTime, 'HH:mm');
      
      return {
        ...slot,
        displayTime,
        isSelected: selectedTime === timeString,
        isPast: isBefore(startTime, new Date())
      };
    });

    // Sort by time
  void imeSlots.sort((a, b) => parseISO(a.startTime).getTime() - parseISO(b.startTime).getTime());

    setTimeSlots(timeSlots);
  };

  const handleDateSelect = (date: Date) => {
    onDateSelect(date);
  };

  const handleTimeSelect = (slot: TimeSlot) => {
    if (slot.isPast || !slot.available) return;
    
    const timeString = format(parseISO(slot.startTime), 'HH:mm');
    onTimeSelect(timeString, slot);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
  void newMonth.setMonth(newMonth.getMonth() + (direction === 'prev' ? -1 : 1));
    setCurrentMonth(newMonth);
  };

  const getDaysInMonth = () => {
    const start = startOfWeek(currentMonth);
    const end = endOfWeek(addDays(currentMonth, 35));
    const days = [];

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const daySlots = availableSlots.filter(slot => 
        isSameDay(parseISO(slot.startTime), date)
      );
      
      const hasSlots = daySlots.length > 0;
      const availableCount = daySlots.filter(slot => slot.available).length;

      days.push({
        date: new Date(date),
        hasSlots,
        availableCount,
        isSelected: selectedDate && isSameDay(date, selectedDate),
        isToday: isToday(date),
        isCurrentMonth: date.getMonth() === currentMonth.getMonth(),
        isPast: isBefore(date, new Date()) && !isToday(date)
      });
    }

    return days;
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
        <h3 className="font-semibold text-red-800 mb-2">Unable to Load Availability</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={loadCoachAvailability} variant="outline" size="sm">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Timezone Display */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Globe className="h-4 w-4" />
        <span>Times shown in {coachTimezone} timezone</span>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Calendar */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth('prev')}
                disabled={loading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <h3 className="font-semibold">
                {format(currentMonth, 'MMMM yyyy')}
              </h3>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth('next')}
                disabled={loading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="p-4">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
                <span className="ml-2 text-gray-600">Loading availability...</span>
              </div>
            )}

            {!loading && (
              <div className="grid grid-cols-7 gap-2">
                {/* Day headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-gray-500 p-2">
                    {day}
                  </div>
                ))}

                {/* Calendar days */}
                {getDaysInMonth().map((day, index) => (
                  <button
                    key={index}
                    onClick={() => !day.isPast && day.hasSlots && handleDateSelect(day.date)}
                    disabled={day.isPast || !day.hasSlots}
                    className={`
                      relative aspect-square p-2 text-sm rounded-lg transition-all
                      ${!day.isCurrentMonth 
                        ? 'text-gray-300 cursor-not-allowed' 
                        : day.isPast 
                        ? 'text-gray-400 cursor-not-allowed'
                        : day.hasSlots
                        ? 'hover:bg-brand-50 cursor-pointer'
                        : 'text-gray-400 cursor-not-allowed'
                      }
                      ${day.isSelected 
                        ? 'bg-brand-600 text-white hover:bg-brand-700' 
                        : day.isToday 
                        ? 'bg-brand-100 text-brand-800 font-semibold'
                        : ''
                      }
                    `}
                  >
                    <span>{day.date.getDate()}</span>
                    
                    {day.hasSlots && day.availableCount > 0 && !day.isSelected && (
                      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                        <div className="w-1.5 h-1.5 bg-brand-500 rounded-full"></div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Time Slots */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-600" />
            <h3 className="font-semibold">
              {selectedDate ? `Available Times - ${format(selectedDate, 'MMM d')}` : 'Select a Date'}
            </h3>
          </div>

          {!selectedDate && (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Select a date to view available time slots</p>
            </div>
          )}

          {selectedDate && timeSlots.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No available time slots for this date</p>
              <p className="text-sm mt-2">Try selecting a different date</p>
            </div>
          )}

          {selectedDate && timeSlots.length > 0 && (
            <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto">
              {timeSlots.map((slot, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleTimeSelect(slot)}
                  disabled={slot.isPast || !slot.available}
                  className={`
                    p-3 rounded-lg text-center font-medium transition-all
                    ${slot.isSelected
                      ? 'bg-brand-600 text-white shadow-md scale-105'
                      : slot.isPast || !slot.available
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white border-2 border-gray-200 hover:border-brand-500 hover:bg-brand-50 cursor-pointer'
                    }
                  `}
                >
                  <div className="flex items-center justify-center gap-1">
                    {slot.isSelected && <CheckCircle className="h-4 w-4" />}
                    <span>{slot.displayTime}</span>
                  </div>
                  {slot.isPast && (
                    <Badge variant="secondary" size="sm" className="mt-1">
                      Past
                    </Badge>
                  )}
                  {!slot.available && !slot.isPast && (
                    <Badge variant="warning" size="sm" className="mt-1">
                      Booked
                    </Badge>
                  )}
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BookingCalendar;