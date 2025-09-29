'use client';

import { useState, useEffect } from 'react';
import { generateClient } from "aws-amplify/data";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import type { Schema } from "@/amplify/data/resource";
import AddActionModal from './AddActionModal';
import HistoryModal from './HistoryModal';
import FlippableScoreChart from './FlippableScoreChart';
import { useSound } from './SoundContext';
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
}

export default function DailyActionTracker({ 
  actions, 
  onDataUpdate, 
  onCreateAction,
  user
}: DailyActionTrackerProps) {
  const { playCompletionSound, playPreCompletionSound, playDecrementSound } = useSound();
  const [logsCache, setLogsCache] = useState<Record<string, DailyLog[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [updatingActions, setUpdatingActions] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [daysBack, setDaysBack] = useState(0);
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());
  const [showConfetti, setShowConfetti] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());
  const [editingAction, setEditingAction] = useState<Action | null>(null);
  const [historyAction, setHistoryAction] = useState<Action | null>(null);

  // Get current date based on days back
  const getCurrentDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - daysBack);
    return date.toISOString().split('T')[0];
  };

  // Get action count based on daily progress logs
  const getActionCount = (actionId: string): number => {
    const logsForDate = logsCache[selectedDate] || [];
    const log = logsForDate.find(l => l.actionId === actionId);
    return log ? log.count : 0;
  };

  // Check if action is complete
  const isActionComplete = (action: Action, count: number) => {
    return count >= (action.targetCount || 0);
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
      const currentDate = selectedDate;
      const currentLogs = logsCache[currentDate] || [];
      const existingLog = currentLogs.find(l => l.actionId === actionId);
      
      let newCount = existingLog ? existingLog.count : 0;
      if (increment) {
        newCount += 1;
      } else {
        newCount = Math.max(0, newCount - 1);
      }
      
      console.log('Updating action count:', { actionId, currentDate, newCount, increment });
      
      // Save to backend
      let updatedLog: DailyLog;
      if (existingLog) {
        // Update existing log
                const result = await client.models.DailyLog.update({
                  id: existingLog.id,
                  count: newCount,
                  points: (action.progressPoints || 0) * newCount,
                });
                updatedLog = { ...existingLog, count: newCount, points: (action.progressPoints || 0) * newCount };
      } else {
        // Create new log
        const result = await client.models.DailyLog.create({
          actionId: actionId,
          count: newCount,
          points: (action.progressPoints || 0) * newCount,
          date: currentDate,
        });
        updatedLog = { 
          id: result.data?.id || '', 
          actionId, 
          count: newCount, 
          points: (action.progressPoints || 0) * newCount, 
          date: currentDate 
        };
      }
      
      // Update the logs cache
      const updatedLogs = existingLog 
        ? currentLogs.map(l => l.actionId === actionId ? updatedLog : l)
        : [...currentLogs, updatedLog];
      
      setLogsCache(prev => ({
        ...prev,
        [currentDate]: updatedLogs
      }));
      
      // Handle completion animations and sounds
      if (increment && newCount >= (action.targetCount || 0)) {
        setCompletedActions(prev => new Set(prev).add(actionId));
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
      } else if (increment && newCount === (action.targetCount || 0) - 1) {
        // Play pre-completion sound when one away from target
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
      setDaysBack(prev => prev + 1);
    }
  };

  const goForwardOneDay = () => {
    if (daysBack > 0) {
      setDaysBack(prev => prev - 1);
    }
  };

  const getDateLabel = () => {
    if (daysBack === 0) return 'Today';
    
    const date = new Date(selectedDate + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

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

  // Load existing daily logs from backend for a specific date
  const loadDailyLogs = async (date?: string) => {
    if (!user) return;
    
    try {
      const targetDate = date || getCurrentDate();
      console.log('Loading daily logs for date:', targetDate);
      
      // Check if we already have logs for this date in cache
      if (logsCache[targetDate]) {
        console.log('Logs already cached for date:', targetDate);
        return;
      }
      
      const { data: logs } = await client.models.DailyLog.list({
        filter: {
          date: { eq: targetDate }
        }
      });
      
      console.log('Loaded daily logs:', logs);
      
      // Update logs cache
      setLogsCache(prev => ({
        ...prev,
        [targetDate]: logs || []
      }));
    } catch (error) {
      console.error('Failed to load daily logs:', error);
    }
  };

  // Load logs when component mounts or user changes
  useEffect(() => {
    if (user) {
      loadDailyLogs();
    }
  }, [user]);

  // Update selected date when daysBack changes
  useEffect(() => {
    setSelectedDate(getCurrentDate());
  }, [daysBack]);

  // Load logs when selectedDate changes
  useEffect(() => {
    if (user && selectedDate) {
      loadDailyLogs(selectedDate);
    }
  }, [selectedDate, user]);

  // Calculate score summary
  const calculateScoreSummary = () => {
    const currentDate = selectedDate;
    const logsForDate = logsCache[currentDate] || [];
    const currentScore = logsForDate.reduce((sum, log) => sum + (log.points || 0), 0);
    
    // Calculate yesterday's score for comparison
    const yesterday = new Date(currentDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = yesterday.toISOString().split('T')[0];
    const yesterdayLogs = logsCache[yesterdayDate] || [];
    const yesterdayScore = yesterdayLogs.reduce((sum, log) => sum + (log.points || 0), 0);
    
    // Count completed actions for today
    const encourageCompleted = actions.filter(action => {
      const log = logsForDate.find(l => l.actionId === action.id);
      return log && log.count >= (action.targetCount || 0);
    }).length;
    
    const avoidCompleted = actions.filter(action => {
      const log = logsForDate.find(l => l.actionId === action.id);
      return log && log.count >= (action.targetCount || 0);
    }).length;
    
    return {
      currentScore,
      difference: currentScore - yesterdayScore,
      actionCounts: {
        encourage: { completed: encourageCompleted },
        avoid: { completed: avoidCompleted }
      },
      todayScore: currentScore
    };
  };

  // Show empty state if no actions
  if (actions.length === 0) {
    return (
      <div className="space-y-6">
        {/* Date Navigation */}
        <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <button
            onClick={goBackOneDay}
            disabled={daysBack >= 7}
            className="p-2 rounded-lg bg-gray-100 text-gray-600 dark:text-gray-100 dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {getDateLabel()}
          </h2>
          <button
            onClick={goForwardOneDay}
            disabled={daysBack <= 0}
            className="p-2 rounded-lg bg-gray-100 text-gray-600 dark:text-gray-100 dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Empty State */}
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-gray-500 dark:text-gray-300">No actions configured yet.</p>
            <p className="text-sm text-gray-400 dark:text-gray-400 mt-2 mb-6">
              Create your first action to start tracking your habits!
            </p>
            <button
              onClick={() => setShowAddModal(true)}
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
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Navigation */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <button
          onClick={goBackOneDay}
          disabled={daysBack >= 7}
          className="p-2 rounded-lg bg-gray-100 text-gray-600 dark:text-gray-100 dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {getDateLabel()}
        </h2>
        <button
          onClick={goForwardOneDay}
          disabled={daysBack <= 0}
          className="p-2 rounded-lg bg-gray-100 text-gray-600 dark:text-gray-100 dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Score Chart */}
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <FlippableScoreChart
          scoreSummary={calculateScoreSummary()}
          userTimezone="America/Los_Angeles"
          selectedDate={selectedDate}
          refreshTrigger={0}
          previousScore={null}
          animationTrigger={0}
        />
      </div>

      {/* Actions List */}
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Actions</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="p-2 rounded-lg bg-gray-100 text-gray-600 dark:text-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 active:bg-gray-800 active:scale-95 transition-all duration-150 cursor-pointer hover:bg-gray-200"
            title="Add action"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          {actions.map((action) => {
            const count = getActionCount(action.id);
            const isEncourage = action.type === 'ENCOURAGE';
            const isComplete = isActionComplete(action, count);
            const isFlipped = flippedCards.has(action.id);
            
            return (
              <div key={action.id} className="relative overflow-hidden">
                {/* Completion Animation */}
                {completedActions.has(action.id) && (
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-yellow-500 border border-yellow-600 rounded-lg flex items-center justify-center z-20 animate-slide-up">
                    <div className="text-white font-bold text-lg drop-shadow-lg">
                      Complete!
                    </div>
                  </div>
                )}

                <div className="relative h-24 perspective-1000">
                  <div 
                    className="relative w-full h-full transition-transform duration-500 ease-in-out"
                    style={{ 
                      transform: isFlipped ? 'rotateX(180deg)' : 'rotateX(0deg)',
                      transformStyle: 'preserve-3d'
                    }}
                    onClick={() => toggleCardFlip(action.id)}
                  >
                    {/* Front Side - Action Item */}
                    <div
                      className={`absolute inset-0 flex gap-3 items-stretch p-3 rounded-lg border-l-8 cursor-pointer ${
                        isEncourage 
                          ? 'border-l-green-600 bg-gray-50 dark:bg-gray-700' 
                          : 'border-l-purple-600 bg-gray-50 dark:bg-gray-700'
                      }`}
                      style={{ 
                        backfaceVisibility: 'hidden',
                        transform: 'rotateX(0deg)'
                      }}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {action.name}
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            action.type === 'ENCOURAGE' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                          }`}>
                            {action.type}
                          </div>
                        </div>
                        
                        {action.description && (
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {action.description}
                          </div>
                        )}
                        
                        <div className="flex flex-wrap gap-2 text-xs">
                          <div className="px-2 py-1 rounded bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                            {action.progressPoints} pts
                          </div>
                          <div className="px-2 py-1 rounded bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                            {action.frequency}
                          </div>
                          <div className="px-2 py-1 rounded bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                            {action.timeOfDay}
                          </div>
                          <div className="px-2 py-1 rounded bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                            Target: {action.targetCount}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateActionCount(action.id, true);
                          }}
                          disabled={updatingActions.has(action.id)}
                          className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform ${
                            updatingActions.has(action.id)
                              ? 'opacity-50 cursor-not-allowed' 
                              : 'cursor-pointer'
                          }`}
                          title={isComplete ? `Completed! Click to add more (${count}/${action.targetCount})` : `Mark as complete (${count}/${action.targetCount})`}
                        >
                          <div className="relative w-full h-full">
                            {/* Progress border */}
                            {count > 0 && !isComplete && (
                              <div
                                className="absolute inset-0 rounded-full"
                                style={{
                                  background: `conic-gradient(from 0deg, #fbbf24 ${(count / (action.targetCount || 1)) * 360}deg, transparent ${(count / (action.targetCount || 1)) * 360}deg)`,
                                  mask: 'radial-gradient(circle at center, transparent 0px, transparent 20px, black 21px)',
                                  WebkitMask: 'radial-gradient(circle at center, transparent 0px, transparent 20px, black 21px)'
                                }}
                              />
                            )}
                            
                            <div 
                              className={`rounded-full flex items-center justify-center ${
                                isComplete 
                                  ? 'bg-gradient-to-t from-amber-400 to-yellow-300 text-gray-800' 
                                  : 'bg-gradient-to-br from-gray-500 to-gray-600 text-white hover:from-gray-600 hover:to-gray-700'
                              }`}
                              style={{ width: '100%', height: '100%' }}
                            >
                              <div className="relative z-10">
                                {updatingActions.has(action.id) ? (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                  </div>
                                ) : isComplete ? (
                                  <div className="flex items-center justify-center">
                                    {count === action.targetCount ? (
                                      <svg className="w-5 h-5 text-gray-800" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    ) : (
                                      <span className="text-sm font-bold text-gray-800">
                                        {count}/{action.targetCount}
                                      </span>
                                    )}
                                  </div>
                                ) : count > 0 ? (
                                  <div className="text-xs font-bold text-white">
                                    {count}/{action.targetCount}
                                  </div>
                                ) : (
                                  <div>
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Back Side - Management Options */}
                    <div
                      className={`absolute inset-0 flex items-center justify-between p-3 rounded-lg border-l-8 ${
                        isEncourage 
                          ? 'border-l-green-600 bg-indigo-600' 
                          : 'border-l-purple-600 bg-indigo-600'
                      }`}
                      style={{ 
                        backfaceVisibility: 'hidden',
                        transform: 'rotateX(180deg)'
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="p-2 rounded-lg text-white bg-indigo-400"
                          title="Drag to reorder"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                          </svg>
                        </div>
                        <div className="relative">
                          <p className="font-semibold text-indigo-100 leading-none">
                            {action.name}
                          </p>
                          <p className="text-sm text-indigo-200">Click to edit</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleViewHistory(action);
                            }}
                            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-400 text-indigo-100 rounded-xl hover:bg-indigo-500 active:bg-indigo-600 active:scale-95 transition-all duration-100 cursor-pointer"
                            title="View history"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleEditAction(action);
                            }}
                            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-400 text-indigo-100 rounded-xl hover:bg-indigo-500 active:bg-indigo-600 active:scale-95 transition-all duration-100 cursor-pointer"
                            title="Edit action"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </button>
                        </div>
                        {count > 0 && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              updateActionCount(action.id, false);
                              toggleCardFlip(action.id);
                            }}
                            disabled={updatingActions.has(action.id)}
                            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl transition-all duration-50 w-full ${
                              updatingActions.has(action.id)
                                ? 'bg-indigo-300 text-indigo-200 cursor-not-allowed'
                                : 'bg-indigo-400 text-indigo-100 hover:bg-indigo-500 active:bg-indigo-600 active:scale-95 cursor-pointer'
                            }`}
                            title="Decrease count"
                          >
                            {updatingActions.has(action.id) ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-200 border-t-transparent"></div>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                              </svg>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Confetti Celebration */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-6xl">🎉</div>
          </div>
        </div>
      )}

      {/* Add Action Modal */}
      {showAddModal && (
        <AddActionModal
          onClose={() => setShowAddModal(false)}
          onAdd={(actionData) => {
            onCreateAction(actionData);
            setShowAddModal(false);
          }}
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
  );
}
