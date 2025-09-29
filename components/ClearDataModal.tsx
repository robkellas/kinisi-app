'use client';

import { useState } from 'react';
import { generateClient } from "aws-amplify/data";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import type { Schema } from "@/amplify/data/resource";

// Configure Amplify
Amplify.configure(outputs);

interface ClearDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataCleared: () => void;
}

export default function ClearDataModal({ isOpen, onClose, onDataCleared }: ClearDataModalProps) {
  const [isClearing, setIsClearing] = useState(false);
  const [clearingStep, setClearingStep] = useState('');
  const client = generateClient<Schema>();

  const handleClearAllData = async () => {
    if (isClearing) return;
    
    setIsClearing(true);
    
    try {
      // Step 1: Delete all DailyLogs
      setClearingStep('Deleting daily logs...');
      const { data: dailyLogs } = await client.models.DailyLog.list();
      if (dailyLogs) {
        for (const log of dailyLogs) {
          await client.models.DailyLog.delete({ id: log.id });
        }
      }
      
      // Step 2: Delete all Actions
      setClearingStep('Deleting actions...');
      const { data: actions } = await client.models.Action.list();
      if (actions) {
        for (const action of actions) {
          await client.models.Action.delete({ id: action.id });
        }
      }
      
      setClearingStep('Data cleared successfully!');
      
      // Notify parent that data has been cleared
      onDataCleared();
      
      // Close modal after a brief delay
      setTimeout(() => {
        onClose();
        setClearingStep('');
      }, 1500);
      
    } catch (error) {
      console.error('Failed to clear data:', error);
      setClearingStep('Error clearing data. Please try again.');
    } finally {
      setIsClearing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Clear All Data
          </h3>
          <button
            onClick={onClose}
            disabled={isClearing}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5 text-gray-500 dark:text-gray-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h4 className="font-medium text-red-800 dark:text-red-200">Warning</h4>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  This will permanently delete all your actions and daily progress logs. This action cannot be undone.
                </p>
              </div>
            </div>
          </div>

          {clearingStep && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center gap-3">
                {isClearing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                ) : (
                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                <span className="text-sm text-blue-800 dark:text-blue-200">{clearingStep}</span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={onClose}
              disabled={isClearing}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleClearAllData}
              disabled={isClearing}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md"
            >
              {isClearing ? 'Clearing...' : 'Clear All Data'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
