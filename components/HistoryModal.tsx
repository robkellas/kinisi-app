'use client';

import { useState, useEffect } from 'react';
import { generateClient } from "aws-amplify/data";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import type { Schema } from "@/amplify/data/resource";
import { getDateInTimezone } from '@/lib/dateUtils';
import { useUserProfile } from './UserProfileContext';

Amplify.configure(outputs);
const client = generateClient<Schema>();

type Action = Schema["Action"]["type"];
type DailyLog = Schema["DailyLog"]["type"];

interface HistoryModalProps {
  action: Action;
  onClose: () => void;
}

export default function HistoryModal({ action, onClose }: HistoryModalProps) {
  const { timezone } = useUserProfile();
  const [currentPeriod, setCurrentPeriod] = useState(() => {
    // Start with today for initial view
    const today = getDateInTimezone(0, timezone);
    return today;
  });
  const [isMonthView, setIsMonthView] = useState(false);
  const [logsData, setLogsData] = useState<Record<string, DailyLog[]>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Fetch real data for the current month
  const fetchLogsData = async () => {
    setIsLoading(true);
    try {
      // Generate date range based on view type
      const dates: string[] = [];
      
      if (isMonthView) {
        // Generate date range for the current month
        const currentDate = new Date(currentPeriod + 'T00:00:00');
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        
        for (let day = 1; day <= daysInMonth; day++) {
          const targetDate = new Date(year, month, day);
          const dateString = targetDate.toISOString().split('T')[0];
          dates.push(dateString);
        }
        console.log('Fetching data for month:', { currentPeriod, month: month + 1, year, dates: dates.slice(0, 5), timezone });
      } else {
        // Generate date range for 30 days from currentPeriod
        for (let i = 29; i >= 0; i--) {
          const currentDate = new Date(currentPeriod + 'T00:00:00');
          const targetDate = new Date(currentDate);
          targetDate.setDate(targetDate.getDate() - i);
          const dateString = targetDate.toISOString().split('T')[0];
          dates.push(dateString);
        }
        console.log('Fetching data for 30 days:', { currentPeriod, dates: dates.slice(0, 5), timezone });
      }
      
      // Fetch all logs for this action in the date range
      const { data: logs } = await client.models.DailyLog.list({
        filter: {
          actionId: { eq: action.id },
          date: { between: [dates[0], dates[dates.length - 1]] }
        }
      });
      
      // Group logs by date
      const logsByDate: Record<string, DailyLog[]> = {};
      logs?.forEach(log => {
        if (!logsByDate[log.date]) {
          logsByDate[log.date] = [];
        }
        logsByDate[log.date].push(log);
      });
      
      setLogsData(logsByDate);
    } catch (error) {
      console.error('Failed to fetch logs data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update currentPeriod when timezone changes
  useEffect(() => {
    const today = getDateInTimezone(0, timezone);
    setCurrentPeriod(today);
  }, [timezone]);

  // Fetch data when modal opens or period changes
  useEffect(() => {
    fetchLogsData();
  }, [action.id, currentPeriod, timezone]);

  // Generate calendar data for 30 days or full month
  const generateCalendarData = () => {
    const calendarData = [];
    
    const actualDates = [];
    
    if (isMonthView) {
      // Get all days in the current month
      const currentDate = new Date(currentPeriod + 'T00:00:00');
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      
      // Get first and last day of the month
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      
      for (let day = 1; day <= daysInMonth; day++) {
        const targetDate = new Date(year, month, day);
        const dateString = targetDate.toISOString().split('T')[0];
        const date = new Date(dateString + 'T00:00:00');
      
        // Get real data from logsData
        const dayLogs = logsData[dateString] || [];
        const count = dayLogs.reduce((sum, log) => sum + (log.count || 0), 0);
        const isCompleted = count >= (action.targetCount || 1);
      
      // Check if this is the first day of a new month
      const isFirstDayOfMonth = date.getDate() === 1;
      
      actualDates.push({
        date: date.getDate(),
        dateString,
        isCompleted,
        count,
        fullDate: date,
        isNewMonth: isFirstDayOfMonth,
        monthLabel: isFirstDayOfMonth ? date.toLocaleDateString('en-US', { 
          month: 'short'
        }).toUpperCase() : null,
        isPartial: count > 0 && !isCompleted,
        completionPercentage: (action.targetCount || 0) > 0 ? Math.min(100, (count / (action.targetCount || 1)) * 100) : 0,
        dayOfWeek: date.getDay() // 0 = Sunday, 1 = Monday, etc.
      });
    }
    } else {
      // Get 30 days starting from currentPeriod
      for (let i = 29; i >= 0; i--) {
        // Calculate days back from currentPeriod
        const currentDate = new Date(currentPeriod + 'T00:00:00');
        const targetDate = new Date(currentDate);
        targetDate.setDate(targetDate.getDate() - i);
        const dateString = targetDate.toISOString().split('T')[0];
        const date = new Date(dateString + 'T00:00:00');
        
        // Get real data from logsData
        const dayLogs = logsData[dateString] || [];
        const count = dayLogs.reduce((sum, log) => sum + (log.count || 0), 0);
        const isCompleted = count >= (action.targetCount || 1);
        
        // Check if this is the first day of a new month
        const isFirstDayOfMonth = date.getDate() === 1;
        
        actualDates.push({
          date: date.getDate(),
          dateString,
          isCompleted,
          count,
          fullDate: date,
          isNewMonth: isFirstDayOfMonth,
          monthLabel: isFirstDayOfMonth ? date.toLocaleDateString('en-US', { 
            month: 'short'
          }).toUpperCase() : null,
          isPartial: count > 0 && !isCompleted,
          completionPercentage: (action.targetCount || 0) > 0 ? Math.min(100, (count / (action.targetCount || 1)) * 100) : 0,
          dayOfWeek: date.getDay() // 0 = Sunday, 1 = Monday, etc.
        });
      }
    }
    
    // Now arrange them in a proper calendar grid
    // Find the first date's day of week to know where to start
    const firstDate = actualDates[0];
    const startDayOfWeek = firstDate.dayOfWeek;
    
    // Add empty cells for the days before the first date
    for (let i = 0; i < startDayOfWeek; i++) {
      calendarData.push({
        isEmpty: true,
        date: '',
        dateString: '',
        isCompleted: false,
        count: 0,
        fullDate: null,
        isNewMonth: false,
        monthLabel: null,
        isPartial: false,
        completionPercentage: 0
      });
    }
    
    // Add all the actual dates
    calendarData.push(...actualDates);
    
    return calendarData;
  };

  // Navigation functions for month-based periods
  const goToPreviousPeriod = () => {
    setIsMonthView(true);
    setCurrentPeriod(prev => {
      // Go back one month and set to first day of that month
      const currentDate = new Date(prev + 'T00:00:00');
      const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      const newDateString = newDate.toISOString().split('T')[0];
      console.log('Going to previous month:', { prev, newDateString });
      return newDateString;
    });
  };

  const goToNextPeriod = () => {
    setIsMonthView(true);
    setCurrentPeriod(prev => {
      // Go forward one month and set to first day of that month
      const currentDate = new Date(prev + 'T00:00:00');
      const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
      const newDateString = newDate.toISOString().split('T')[0];
      console.log('Going to next month:', { prev, newDateString });
      return newDateString;
    });
  };

  const goToCurrentPeriod = () => {
    // Go to today using timezone-aware date and reset to 30-day view
    const today = getDateInTimezone(0, timezone);
    setCurrentPeriod(today);
    setIsMonthView(false);
  };

  // Check if we can navigate to previous/next periods
  const canGoPrevious = () => {
    return true;
  };

  const canGoNext = () => {
    const today = getDateInTimezone(0, timezone);
    const currentDate = new Date(currentPeriod + 'T00:00:00');
    const nextPeriod = new Date(currentDate);
    nextPeriod.setDate(nextPeriod.getDate() + 30);
    const todayDate = new Date(today + 'T00:00:00');
    return nextPeriod <= todayDate;
  };

  const calendarData = generateCalendarData();

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 leading-none">
              {action.type === 'AVOID' ? `Avoid: ${action.name}` : action.name}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {isLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
            )}
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500 dark:text-gray-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>


        <div className="mb-4">
          <p className="text-sm text-gray-500 dark:text-gray-100">
            {action.type === 'ENCOURAGE' ? 'Goal' : 'Avoid'}: {action.targetCount} time{action.targetCount !== 1 ? 's' : ''} {action.frequency}
          </p>
        </div>

        {/* Period Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goToPreviousPeriod}
            disabled={!canGoPrevious()}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-colors ${
              canGoPrevious() 
                ? 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700' 
                : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
            }`}
            title="Previous 30 days"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm">Previous</span>
          </button>

          <div className="px-3 py-1 text-sm font-medium text-gray-600 dark:text-gray-400">
            {new Date(currentPeriod + 'T00:00:00').getFullYear()}
          </div>

          <button
            onClick={goToNextPeriod}
            disabled={!canGoNext()}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-colors ${
              canGoNext() 
                ? 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700' 
                : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
            }`}
            title="Next 30 days"
          >
            <span className="text-sm">Next</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div>
          {/* Calendar Grid */}
          <div className="mb-4">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                <div key={index} className="text-xs text-gray-500 dark:text-gray-100 text-center py-1 font-medium">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days with month labels */}
            <div className="grid grid-cols-7 gap-1">
              {calendarData.map((item, index) => {
                if (item.isEmpty) {
                  return (
                    <div key={`empty-${index}`} className="flex flex-col items-center">
                      <div className="h-4 mb-1"></div>
                      <div className="w-8 h-8"></div>
                    </div>
                  );
                }
                
                const { date, isCompleted, count, dateString, isNewMonth, monthLabel, isPartial, completionPercentage } = item;
                return (
                  <div key={dateString} className="flex flex-col items-center">
                    {/* Month label above first day of month */}
                    <div className="h-4 flex items-center justify-center mb-1">
                      {isNewMonth && monthLabel && (
                        <span className="text-xs text-gray-400 dark:text-gray-100 font-medium">
                          {monthLabel}
                        </span>
                      )}
                    </div>
                    
                    {/* Day circle */}
                    <div
                      className={`relative w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors overflow-hidden ${
                        isCompleted
                          ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white dark:text-emerald-900 shadow-md dark:font-bold'
                          : isPartial
                          ? 'border-2 border-green-300 text-gray-700 dark:text-gray-100'
                          : 'border-2 border-gray-300 text-gray-600 dark:text-gray-100 dark:hover:border-gray-400'
                      }`}
                      title={`${dateString}: ${count} time${count !== 1 ? 's' : ''} ${isCompleted ? '(Complete!)' : isPartial ? `(${Math.round(completionPercentage)}% complete)` : ''}`}
                    >
                      {/* Partial completion background */}
                      {isPartial && (
                        <div
                          className="absolute inset-0 bg-gradient-to-r from-green-200 to-green-100 dark:from-emerald-900 dark:to-emerald-700 rounded-full"
                          style={{ width: `${completionPercentage}%` }}
                        />
                      )}
                      
                      {/* Day number */}
                      <span className={`relative z-10 ${isCompleted ? 'text-white dark:text-emerald-900' : isPartial ? 'text-gray-800 dark:text-gray-100 font-semibold' : ''}`}>
                        {date}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
