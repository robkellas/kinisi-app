'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { generateClient } from "aws-amplify/data";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import type { Schema } from "@/amplify/data/resource";
import AddActionModal from './AddActionModal';
import HistoryModal from './HistoryModal';
import ActionItem from './ActionItem';
import FlippableScoreChart from './FlippableScoreChart';
import SettingsModal from './SettingsModal';
import { useSound } from './SoundContext';
import { ANIMATION_CLASSES } from '@/lib/animations';
import { getTodayInTimezone, getDateInTimezone, getYesterdayInTimezone } from '@/lib/dateUtils';
import { useUserProfile } from './UserProfileContext';
// Simple icons using SVG

Amplify.configure(outputs);
const client = generateClient<Schema>();

type Action = Schema["Action"]["type"];

interface DailyLog {
  id: string;
  actionId: string;
  count: number;
  points: number;
  date: string;
}

interface DailyActionTrackerProps {
  actions: Action[];
  onDataUpdate: () => void;
  onCreateAction: (actionData: Omit<Action, 'id' | 'completed' | 'completedAt' | 'createdAt'>) => void;
  user?: any; // Add user prop to check authentication
  onSignOut?: () => void;
}

export default function DailyActionTracker({ 
  actions, 
  onDataUpdate, 
  onCreateAction,
  user,
  onSignOut
}: DailyActionTrackerProps) {
  // Don't render anything if user is not authenticated
  if (!user) {
    return (
      <div className="space-y-6">
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-gray-500 dark:text-gray-300">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  const { playCompletionSound, playPreCompletionSound, playDecrementSound } = useSound();
  const { timezone } = useUserProfile();
  const [logsCache, setLogsCache] = useState<Record<string, DailyLog[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [updatingActions, setUpdatingActions] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState(() => {
    // Use user's timezone from profile
    const initialDate = getTodayInTimezone(timezone);
    return initialDate;
  });
  const [daysBack, setDaysBack] = useState(0);
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());
  const [showConfetti, setShowConfetti] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());
  const [recentlyCompleted, setRecentlyCompleted] = useState<Set<string>>(new Set());
  const [editingAction, setEditingAction] = useState<Action | null>(null);
  const [historyAction, setHistoryAction] = useState<Action | null>(null);
  const [hasLoadedWeeklyData, setHasLoadedWeeklyData] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kinisi-sort-order');
      return (saved as 'asc' | 'desc') || 'desc';
    }
    return 'desc';
  });
  
  const [sortBy, setSortBy] = useState<'points' | 'routine'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kinisi-sort-by');
      return (saved as 'points' | 'routine') || 'points';
    }
    return 'points';
  });
  
  const [showFilters, setShowFilters] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  
  // Filter state
  const [activeFilters, setActiveFilters] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kinisi-filter-preferences');
      if (saved) {
        return JSON.parse(saved);
      }
    }
    return {
      types: ['ENCOURAGE', 'AVOID'],
      times: ['MORNING', 'AFTERNOON', 'EVENING', 'ANYTIME'],
      statuses: ['INCOMPLETE', 'COMPLETE']
    };
  });

  // Update selectedDate when timezone changes
  useEffect(() => {
    const newSelectedDate = getTodayInTimezone(timezone);
    setSelectedDate(newSelectedDate);
    setDaysBack(0); // Reset to today when timezone changes
  }, [timezone]);

  // Save filter preferences to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('kinisi-filter-preferences', JSON.stringify(activeFilters));
    }
  }, [activeFilters]);

  // Save sort order to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('kinisi-sort-order', sortOrder);
    }
  }, [sortOrder]);

  // Save sort by to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('kinisi-sort-by', sortBy);
    }
  }, [sortBy]);

  // Force selectedDate to today on component mount
  useEffect(() => {
    const today = getTodayInTimezone(timezone);
    setSelectedDate(today);
    setDaysBack(0);
  }, []); // Run once on mount

  // Auto-update filters when new actions are added with new categories
  useEffect(() => {
    if (actions.length === 0) return;

    // Get all unique types and times from current actions
    const availableTypes = Array.from(new Set(actions.map(action => action.type).filter(Boolean)));
    const availableTimes = Array.from(new Set(actions.map(action => action.timeOfDay).filter(Boolean)));

    // Check if we need to update filters
    const needsTypeUpdate = availableTypes.some(type => !activeFilters.types.includes(type));
    const needsTimeUpdate = availableTimes.some(time => !activeFilters.times.includes(time));

    if (needsTypeUpdate || needsTimeUpdate) {
      setActiveFilters((prev: typeof activeFilters) => ({
        ...prev,
        types: needsTypeUpdate ? Array.from(new Set([...prev.types, ...availableTypes])) : prev.types,
        times: needsTimeUpdate ? Array.from(new Set([...prev.times, ...availableTimes])) : prev.times
      }));
    }
  }, [actions]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showSortDropdown) {
        const target = event.target as Element;
        // Check if click is outside the dropdown
        if (!target.closest('[data-dropdown="sort"]')) {
          setShowSortDropdown(false);
        }
      }
    };

    if (showSortDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSortDropdown]);

  // Get current date based on days back
  const getCurrentDate = () => {
    return getDateInTimezone(daysBack, timezone);
  };

  // Get action count based on daily progress logs
  const getActionCount = (actionId: string): number => {
    const logsForDate = logsCache[selectedDate] || [];
    const log = logsForDate.find(l => l.actionId === actionId);
    return log ? log.count : 0;
  };

  // Check if action is complete
  const isActionComplete = (action: Action, count: number) => {
    return count >= (action.targetCount || 1);
  };

  // Get current time of day based on user's timezone
  const getCurrentTimeOfDay = (): 'MORNING' | 'AFTERNOON' | 'EVENING' | 'ANYTIME' => {
    const now = new Date();
    const hour = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false
    }).formatToParts(now).find(part => part.type === 'hour')?.value || '12';
    
    const hourNum = parseInt(hour);
    if (hourNum >= 6 && hourNum < 12) return 'MORNING';
    if (hourNum >= 12 && hourNum < 18) return 'AFTERNOON';
    if (hourNum >= 18 && hourNum < 22) return 'EVENING';
    return 'ANYTIME';
  };

  // Update action count
  const updateActionCount = async (actionId: string, increment: boolean) => {
    console.log('updateActionCount called:', { actionId, increment, updatingActions: Array.from(updatingActions), user: !!user });
    
    if (!user) {
      console.log('User not authenticated, skipping update');
      return;
    }
    
    if (updatingActions.has(actionId)) {
      console.log('Action already updating, skipping:', actionId);
      return;
    }
    
    const action = actions.find(a => a.id === actionId);
    if (!action) {
      console.log('Action not found:', actionId);
      return;
    }
    
    console.log('Starting update for action:', action);
    setUpdatingActions(prev => new Set(prev).add(actionId));
    
    try {
      // Always use selectedDate for consistency
      const currentDate = selectedDate;
      console.log('Using selectedDate for update:', currentDate);
      const currentLogs = logsCache[currentDate] || [];
      const existingLog = currentLogs.find(l => l.actionId === actionId);
      
      let newCount = existingLog ? existingLog.count : 0;
      if (increment) {
        newCount += 1;
      } else {
        newCount = Math.max(0, newCount - 1);
      }
      
      console.log('Updating action count:', { actionId, currentDate, newCount, increment });
      
      // Set animation trigger BEFORE updating cache to prevent flash
      if (increment && newCount >= (action.targetCount || 0)) {
        setCompletedActions(prev => new Set(prev).add(actionId));
        setRecentlyCompleted(prev => new Set(prev).add(actionId));
        setShowConfetti(true);
        playCompletionSound(); // Play completion sound
        
        setTimeout(() => {
          setCompletedActions(prev => {
            const newSet = new Set(prev);
            newSet.delete(actionId);
            return newSet;
          });
          setShowConfetti(false); // Hide confetti after animation
        }, 1500);
        
        // Clear recently completed after animation completes
        setTimeout(() => {
          setRecentlyCompleted(prev => {
            const newSet = new Set(prev);
            newSet.delete(actionId);
            return newSet;
          });
        }, 1000); // Clear after 1 second (animation duration)
      } else if (increment && (action.targetCount || 0) > 1) {
        // For milestone actions, animate on every progression step
        setRecentlyCompleted(prev => new Set(prev).add(actionId));
        
        // Clear recently completed after animation completes
        setTimeout(() => {
          setRecentlyCompleted(prev => {
            const newSet = new Set(prev);
            newSet.delete(actionId);
            return newSet;
          });
        }, 1000); // Clear after 1 second (animation duration)
      }

      // Update local cache immediately for instant UI response
      const updatedLog: DailyLog = existingLog 
        ? { ...existingLog, count: newCount, points: (action.progressPoints || 0) * newCount }
        : { 
            id: `temp-${Date.now()}`, // Temporary ID for optimistic update
            actionId, 
            count: newCount, 
            points: (action.progressPoints || 0) * newCount, 
            date: currentDate 
          };
      
      const updatedLogs = existingLog 
        ? currentLogs.map(l => l.actionId === actionId ? updatedLog : l)
        : [...currentLogs, updatedLog];
      
      setLogsCache(prev => ({
        ...prev,
        [currentDate]: updatedLogs
      }));
      
      // Save to backend asynchronously (let AppSync handle sync)
      try {
        if (existingLog) {
          // Update existing log
          await client.models.DailyLog.update({
            id: existingLog.id,
            count: newCount,
            points: (action.progressPoints || 0) * newCount,
          });
        } else {
          // Create new log
          const result = await client.models.DailyLog.create({
            actionId: actionId,
            count: newCount,
            points: (action.progressPoints || 0) * newCount,
            date: currentDate,
          });
          
          // Update cache with real ID from backend
          if (result.data?.id) {
            setLogsCache(prev => ({
              ...prev,
              [currentDate]: updatedLogs.map(l => 
                l.id === updatedLog.id ? { ...l, id: result.data!.id } : l
              )
            }));
          }
        }
      } catch (error) {
        console.error('Failed to sync with backend:', error);
        // Could implement retry logic here if needed
      }
      
      if (increment && (action.targetCount || 0) > 1 && newCount < (action.targetCount || 0)) {
        // Play pre-completion sound for milestone actions before each step
        playPreCompletionSound();
      } else if (!increment) {
        setCompletedActions(prev => {
          const newSet = new Set(prev);
          newSet.delete(actionId);
          return newSet;
        });
        playDecrementSound(); // Play decrement sound
      }
      
      console.log('Action count updated successfully');
      
    } catch (error: unknown) {
      console.error('Failed to update action count:', error);
      console.error('Error details:', {
        actionId,
        increment,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    } finally {
      setUpdatingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(actionId);
        return newSet;
      });
    }
  };

  // Navigation functions
  const goBackOneDay = () => {
    if (daysBack < 7) {
      const newDaysBack = daysBack + 1;
      setDaysBack(newDaysBack);
      // Use timezone-aware date calculation
      const dateString = getDateInTimezone(newDaysBack, timezone);
      setSelectedDate(dateString);
    }
  };

  const goForwardOneDay = () => {
    if (daysBack > 0) {
      const newDaysBack = daysBack - 1;
      setDaysBack(newDaysBack);
      // Use timezone-aware date calculation
      const dateString = getDateInTimezone(newDaysBack, timezone);
      setSelectedDate(dateString);
    }
  };

  const goToToday = () => {
    setDaysBack(0);
    const todayDate = getTodayInTimezone(timezone);
    setSelectedDate(todayDate);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    // Calculate daysBack from the selected date using the same logic as WeeklyChart
    // WeeklyChart generates dates from 7 days ago (daysBack=7) to today (daysBack=0)
    // Calculate daysBack using timezone-aware date comparison
    const todayDate = getTodayInTimezone(timezone);
    const diffTime = new Date(todayDate + 'T00:00:00').getTime() - new Date(date + 'T00:00:00').getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    setDaysBack(Math.max(0, Math.min(7, diffDays)));
  };

  const dateLabel = useMemo(() => {
    if (daysBack === 0) {
      return 'Today';
    }
    
    // Calculate the date based on daysBack to ensure consistency
    const currentDate = getDateInTimezone(daysBack, timezone);
    const date = new Date(currentDate + 'T00:00:00');
    const weekday = date.toLocaleDateString('en-US', { 
      weekday: 'short',
      timeZone: timezone
    });
    return weekday;
  }, [daysBack, timezone]);

  const toggleCardFlip = (actionId: string) => {
    setFlippedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(actionId)) {
        newSet.delete(actionId);
      } else {
        newSet.add(actionId);
      }
      return newSet;
    });
  };

  const handleEditAction = (action: Action) => {
    setEditingAction(action);
    // Flip the card back to front side when editing
    setFlippedCards(prev => {
      const newSet = new Set(prev);
      newSet.delete(action.id);
      return newSet;
    });
  };

  const handleViewHistory = (action: Action) => {
    setHistoryAction(action);
    // Flip the card back to front side when viewing history
    setFlippedCards(prev => {
      const newSet = new Set(prev);
      newSet.delete(action.id);
      return newSet;
    });
  };

  const handleDeleteAction = (actionId: string) => {
    // Trigger parent refresh to reload actions
    onDataUpdate();
    // Close the edit modal
    setEditingAction(null);
  };

  const handleDataCleared = () => {
    // Clear local cache
    setLogsCache({});
    // Reset weekly data loading flag
    setHasLoadedWeeklyData(false);
    // Trigger parent refresh to reload actions
    onDataUpdate();
  };

  // Filter toggle functions
  const toggleFilter = (category: 'types' | 'times' | 'statuses', value: string) => {
    setActiveFilters((prev: typeof activeFilters) => {
      const current = prev[category];
      const newValues = current.includes(value)
        ? current.filter((v: string) => v !== value)
        : [...current, value];
      
      return {
        ...prev,
        [category]: newValues
      };
    });
  };

  // Get available filter values from current actions
  const availableFilters = useMemo(() => {
    const types = new Set<string>();
    const times = new Set<string>();
    const statuses = new Set<string>();
    
    actions.forEach(action => {
      if (action.type) types.add(action.type);
      if (action.timeOfDay) times.add(action.timeOfDay);
      
      const isComplete = isActionComplete(action, getActionCount(action.id));
      statuses.add(isComplete ? 'COMPLETE' : 'INCOMPLETE');
    });
    
    return {
      types: Array.from(types),
      times: Array.from(times),
      statuses: Array.from(statuses)
    };
  }, [actions, selectedDate, logsCache]);

  // Memoize sorted and filtered actions
  const filteredActions = useMemo(() => {
    // First, apply filters
    let filtered = actions.filter(action => {
      // Filter by type
      if (!activeFilters.types.includes(action.type)) {
        return false;
      }
      
      // Filter by time of day
      if (!activeFilters.times.includes(action.timeOfDay)) {
        return false;
      }
      
      // Filter by completion status
      const isComplete = isActionComplete(action, getActionCount(action.id));
      const status = isComplete ? 'COMPLETE' : 'INCOMPLETE';
      if (!activeFilters.statuses.includes(status)) {
        return false;
      }
      
      return true;
    });

    // Then, sort by selected criteria
    return filtered.sort((a, b) => {
      if (sortBy === 'points') {
        const aPoints = a.progressPoints || 0;
        const bPoints = b.progressPoints || 0;
        return sortOrder === 'desc' ? bPoints - aPoints : aPoints - bPoints;
      } else {
        // Sort by routine (time of day)
        const aTime = a.timeOfDay || 'ANYTIME';
        const bTime = b.timeOfDay || 'ANYTIME';
        
        // Define time order
        const timeOrder = ['MORNING', 'AFTERNOON', 'EVENING', 'ANYTIME'];
        const aIndex = timeOrder.indexOf(aTime);
        const bIndex = timeOrder.indexOf(bTime);
        
        if (aIndex !== bIndex) {
          return sortOrder === 'desc' ? bIndex - aIndex : aIndex - bIndex;
        }
        
        // If same time, sort by points as secondary criteria
        const aPoints = a.progressPoints || 0;
        const bPoints = b.progressPoints || 0;
        return sortOrder === 'desc' ? bPoints - aPoints : aPoints - bPoints;
      }
    });
  }, [actions, timezone, selectedDate, logsCache, activeFilters, sortOrder, sortBy]);


  // Load all weekly data at once and cache it (only once on mount)
  const loadWeeklyData = async () => {
    if (!user || hasLoadedWeeklyData) return;
    
    try {
      console.log('Loading weekly data for past 8 days (first time)');
      setHasLoadedWeeklyData(true);
      
      // Get the last 8 days (7 days + today) to match WeeklyChart needs
      const dates: string[] = [];
      for (let i = 7; i >= 0; i--) {
        const date = getDateInTimezone(i, timezone);
        dates.push(date);
      }
      
      // Fetch all daily logs for the past 8 days
      const { data: logs } = await client.models.DailyLog.list();
      
      // Group logs by date
      const logsByDate: Record<string, any[]> = {};
      logs?.forEach(log => {
        if (dates.includes(log.date)) {
          if (!logsByDate[log.date]) {
            logsByDate[log.date] = [];
          }
          logsByDate[log.date].push(log);
        }
      });
      
      console.log('Loaded weekly data:', logsByDate);
      
      // Update logs cache with all weekly data
      setLogsCache(prev => ({
        ...prev,
        ...logsByDate
      }));
    } catch (error) {
      console.error('Failed to load weekly data:', error);
      setHasLoadedWeeklyData(false); // Reset flag on error
    }
  };

  // Load existing daily logs from backend for a specific date (fallback)
  const loadDailyLogs = async (date?: string) => {
    if (!user) return;
    
    try {
      const targetDate = date || getCurrentDate();
      
      // Check if we already have logs for this date in cache
      if (logsCache[targetDate]) {
        return;
      }
      
      const { data: logs } = await client.models.DailyLog.list({
        filter: {
          date: { eq: targetDate }
        }
      });
      
      // Update logs cache
      setLogsCache(prev => ({
        ...prev,
        [targetDate]: logs || []
      }));
    } catch (error) {
      console.error('Failed to load daily logs:', error);
    }
  };

  // Load weekly data when component mounts or user changes
  useEffect(() => {
    if (user) {
      loadWeeklyData();
    }
  }, [user]);

  // Clear recently completed when switching days
  useEffect(() => {
    setRecentlyCompleted(new Set());
  }, [selectedDate]);

  // Note: selectedDate is now updated directly in navigation functions to prevent sync issues

  // Calculate score summary with memoization
  const scoreSummary = useMemo(() => {
    // Always use today's date for the score calculation, not the selectedDate
    const today = getTodayInTimezone(timezone);
    const currentDate = selectedDate;
    
    console.log('Calculating score summary for date:', currentDate, 'but todayScore from:', today);
    
    // Get logs for the currently selected date (for action counts)
    const logsForDate = logsCache[currentDate] || [];
    
    // Get logs for today (for todayScore)
    const todayLogs = logsCache[today] || [];
    const todayScore = todayLogs.reduce((sum, log) => sum + (log.points || 0), 0);
    
    // Get logs for yesterday (for comparison)
    const yesterdayDate = getDateInTimezone(1, timezone);
    const yesterdayLogs = logsCache[yesterdayDate] || [];
    const yesterdayScore = yesterdayLogs.reduce((sum, log) => sum + (log.points || 0), 0);
    
    console.log('Score summary data:', { 
      currentDate, 
      today, 
      todayScore, 
      yesterdayScore,
      logsCount: logsForDate.length 
    });
    
    // Count completed actions for the currently selected date
    const encourageCompleted = actions.filter(action => {
      const log = logsForDate.find(l => l.actionId === action.id);
      return log && log.count >= (action.targetCount || 0);
    }).length;
    
    const avoidCompleted = actions.filter(action => {
      const log = logsForDate.find(l => l.actionId === action.id);
      return log && log.count >= (action.targetCount || 0);
    }).length;
    
    return {
      currentScore: todayScore, // Always use today's score
      difference: todayScore - yesterdayScore,
      actionCounts: {
        encourage: { completed: encourageCompleted },
        avoid: { completed: avoidCompleted }
      },
      todayScore: todayScore
    };
  }, [selectedDate, logsCache]);

  // Debug logging removed to prevent excessive console output

  // Show empty state if no actions
  if (actions.length === 0) {
    return (
      <>
        <div className="space-y-6">

          {/* Empty State */}
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-gray-500 dark:text-gray-300">No actions configured yet.</p>
              <p className="text-sm text-gray-400 dark:text-gray-400 mt-2 mb-6">
                Create your first action to start tracking your habits!
              </p>
              <button
                onClick={() => {
                  console.log('Create Your First Action button clicked');
                  setShowAddModal(true);
                }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white dark:text-gray-100 dark:bg-indigo-700 dark:hover:bg-indigo-600 font-medium rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Your First Action
              </button>
            </div>
          </div>
        </div>

        {/* Add Action Modal */}
        {showAddModal && (
          <AddActionModal
            onClose={() => setShowAddModal(false)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
      {/* Score Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <FlippableScoreChart
          scoreSummary={scoreSummary}
          userTimezone={timezone}
          selectedDate={selectedDate}
          refreshTrigger={0}
          previousScore={null}
          animationTrigger={0}
          logsCache={logsCache}
          onDateSelect={handleDateSelect}
        />
      </div>


      {/* Actions List */}
      <div className="p-0">
        {/* Day Navigation */}
        <div className="flex items-center justify-between mb-4">
          {/* Day Picker - Connected Button Group */}
          <div className="flex items-center w-40">
            {/* Previous Day Button */}
            <button
              onClick={goBackOneDay}
              disabled={daysBack >= 7}
              className="px-3 py-2 text-xs font-medium rounded-l-lg border-r-0 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
              title="Previous day"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            {/* Today/Day Button */}
            <button
              onClick={goToToday}
              className="px-3 py-2 text-xs font-medium border-l-0 border-r-0 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-150 cursor-pointer flex-1 min-w-0 flex items-center justify-center"
              title={`Go to today (currently: ${dateLabel})`}
            >
              <span className="truncate">{dateLabel}</span>
            </button>
            
            {/* Next Day Button */}
            <button
              onClick={goForwardOneDay}
              disabled={daysBack <= 0}
              className="px-3 py-2 text-xs font-medium rounded-r-lg border-l-0 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
              title="Next day"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-2">
            {/* Sort Controls - Custom Dropdown + Arrow */}
            <div className="flex items-center">
              {/* Sort By Custom Dropdown */}
              <div className="relative" data-dropdown="sort">
                <button
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className="px-3 py-2 text-xs font-medium rounded-l-lg border-r-0 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-150 cursor-pointer flex items-center gap-1"
                  title="Choose sort criteria"
                >
                  <span>{sortBy === 'points' ? 'Points' : 'Routine'}</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Dropdown Menu */}
                {showSortDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50">
                    <button
                      onClick={() => {
                        setSortBy('points');
                        setShowSortDropdown(false);
                      }}
                      className={`w-full px-3 py-2 text-xs text-left hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${
                        sortBy === 'points' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      Points
                    </button>
                    <button
                      onClick={() => {
                        setSortBy('routine');
                        setShowSortDropdown(false);
                      }}
                      className={`w-full px-3 py-2 text-xs text-left hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${
                        sortBy === 'routine' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      Routine
                    </button>
                  </div>
                )}
              </div>
              
              {/* Sort Order Arrow */}
              <button
                onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                className="px-3 py-2 rounded-r-lg border-l-0 transition-all duration-150 cursor-pointer flex items-center justify-center bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                title={`Sort ${sortOrder === 'desc' ? 'descending' : 'ascending'}. Click to sort ${sortOrder === 'desc' ? 'ascending' : 'descending'}.`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  {sortOrder === 'desc' ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
                  )}
                </svg>
              </button>
            </div>
            
            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(prev => !prev)}
              className={`p-2 rounded-lg transition-all duration-150 ${
                showFilters 
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title="Toggle filters"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
              </svg>
            </button>
            
        </div>
                    </div>

        {/* Filter UI - Collapsible */}
        {showFilters && (
          <div className="space-y-2 mb-4">
          {/* Routine Filters */}
          {availableFilters.times.length > 0 && (
            <div className="flex gap-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center w-[3rem] flex-shrink-0">
                Routine:
              </span>
              <div className="flex flex-wrap gap-2">
                {['MORNING', 'AFTERNOON', 'EVENING', 'ANYTIME'].filter(time => 
                  availableFilters.times.includes(time)
                ).map(time => (
                  <button
                    key={time}
                    onClick={() => toggleFilter('times', time)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 ${
                      activeFilters.times.includes(time)
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}
                  >
                    {activeFilters.times.includes(time) && (
                      <div className="w-1.5 h-1.5 bg-green-600 dark:bg-green-400 rounded-full"></div>
                    )}
                    {time.charAt(0) + time.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
          )}
                        
          {/* Status Filters */}
          {availableFilters.statuses.length > 0 && (
            <div className="flex gap-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center w-[3rem] flex-shrink-0">
                Status:
              </span>
              <div className="flex flex-wrap gap-2">
                {availableFilters.statuses.includes('INCOMPLETE') && (
                        <button
                    onClick={() => toggleFilter('statuses', 'INCOMPLETE')}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 ${
                      activeFilters.statuses.includes('INCOMPLETE')
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}
                  >
                    {activeFilters.statuses.includes('INCOMPLETE') && (
                      <div className="w-1.5 h-1.5 bg-green-600 dark:bg-green-400 rounded-full"></div>
                    )}
                    Incomplete
                        </button>
                )}
                {availableFilters.statuses.includes('COMPLETE') && (
                          <button
                    onClick={() => toggleFilter('statuses', 'COMPLETE')}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 ${
                      activeFilters.statuses.includes('COMPLETE')
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}
                  >
                    {activeFilters.statuses.includes('COMPLETE') && (
                      <div className="w-1.5 h-1.5 bg-green-600 dark:bg-green-400 rounded-full"></div>
                    )}
                    Complete
                          </button>
                        )}
                      </div>
                    </div>
          )}
                  </div>
        )}

        <div className="space-y-3">
          {filteredActions.map((action, index) => {
            const count = getActionCount(action.id);
            const isEncourage = action.type === 'ENCOURAGE';
            const isComplete = isActionComplete(action, count);
            const isFlipped = flippedCards.has(action.id);
            const targetCount = action.targetCount || 1;
            const progressPercentage = Math.min(100, (count / targetCount) * 100);
            
            // Calculate previous progress percentage for animation
            const previousCount = Math.max(0, count - 1);
            const previousProgressPercentage = Math.min(100, (previousCount / targetCount) * 100);
            
            return (
              <div key={`${action.id}-${sortOrder}-${index}`} className="relative">
                <ActionItem
                  action={action}
                  count={count}
                  isComplete={isComplete}
                  isFlipped={isFlipped}
                  isUpdating={updatingActions.has(action.id)}
                  targetCount={targetCount}
                  progressPercentage={progressPercentage}
                  previousProgressPercentage={previousProgressPercentage}
                  animateCompletion={recentlyCompleted.has(action.id)}
                  onToggleFlip={() => toggleCardFlip(action.id)}
                  onUpdateCount={(increment) => updateActionCount(action.id, increment)}
                  onViewHistory={() => handleViewHistory(action)}
                  onEditAction={() => handleEditAction(action)}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Action Modal */}
      {showAddModal && (
        <AddActionModal
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Edit Action Modal */}
      {editingAction && (
        <AddActionModal
          onClose={() => {
            setEditingAction(null);
            // Ensure card is flipped back to front side
            setFlippedCards(prev => {
              const newSet = new Set(prev);
              newSet.delete(editingAction.id);
              return newSet;
            });
          }}
          onAdd={(actionData) => {
            // Handle edit action here
            setEditingAction(null);
            // Ensure card is flipped back to front side after successful edit
            setFlippedCards(prev => {
              const newSet = new Set(prev);
              newSet.delete(editingAction.id);
              return newSet;
            });
          }}
          onDelete={handleDeleteAction}
          editingAction={editingAction}
        />
      )}

        {/* History Modal */}
        {historyAction && (
          <HistoryModal
            action={historyAction}
            onClose={() => {
              setHistoryAction(null);
              // Ensure card is flipped back to front side
              setFlippedCards(prev => {
                const newSet = new Set(prev);
                newSet.delete(historyAction.id);
                return newSet;
              });
            }}
          />
        )}

      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50">
        <div className="flex items-center justify-around py-2 px-4">
          {/* Dashboard */}
          <button className="flex flex-col items-center gap-1 p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
            </svg>
            <span className="text-xs font-medium">Dashboard</span>
          </button>

          {/* Analytics */}
          <button className="flex flex-col items-center gap-1 p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-xs font-medium">Analytics</span>
          </button>

          {/* Add Action - Primary Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex flex-col items-center gap-1 p-3 bg-gradient-to-t from-amber-400 to-yellow-300 hover:from-amber-500 hover:to-yellow-400 text-white rounded-full shadow-lg transition-all duration-200"
          >
            <svg className="w-6 h-6 text-gray-900 dark:text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>

          {/* Settings */}
          <button 
            onClick={() => setShowSettings(true)}
            className="flex flex-col items-center gap-1 p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
            <span className="text-xs font-medium">Settings</span>
          </button>

          {/* Profile */}
          <button 
            onClick={() => setShowProfileDrawer(true)}
            className="flex flex-col items-center gap-1 p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <div className="w-5 h-5 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <span className="text-xs font-medium">Profile</span>
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal 
          isOpen={showSettings} 
          onClose={() => setShowSettings(false)} 
        />
      )}

      {/* Profile Bottom Drawer */}
      {showProfileDrawer && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowProfileDrawer(false)}
          />
          
          {/* Drawer */}
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-2xl shadow-2xl transform transition-transform duration-300 ease-out">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
            </div>
            
            {/* Content */}
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {user?.username || 'User'}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Free Plan</p>
                </div>
              </div>
              
              {/* Actions */}
              <div className="space-y-3">
                <button className="w-full flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-gray-900 dark:text-white font-medium">Edit Profile</span>
                </button>
                
                <button className="w-full flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-900 dark:text-white font-medium">Upgrade Plan</span>
                </button>
                
                {onSignOut && (
                  <button 
                    onClick={() => {
                      setShowProfileDrawer(false);
                      onSignOut();
                    }}
                    className="w-full flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                  >
                    <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="text-red-600 dark:text-red-400 font-medium">Sign Out</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      </>
    );
  }
