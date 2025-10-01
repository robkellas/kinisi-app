'use client';

import { motion } from 'framer-motion';
import type { Schema } from "@/amplify/data/resource";

type Action = Schema["Action"]["type"];

interface ActionItemProps {
  action: Action;
  count: number;
  isComplete: boolean;
  isFlipped: boolean;
  isUpdating: boolean;
  showCompletionAnimation?: boolean;
  onToggleFlip: () => void;
  onUpdateCount: (increment: boolean) => void;
  onViewHistory: () => void;
  onEditAction: () => void;
}

export default function ActionItem({
  action,
  count,
  isComplete,
  isFlipped,
  isUpdating,
  showCompletionAnimation = false,
  onToggleFlip,
  onUpdateCount,
  onViewHistory,
  onEditAction
}: ActionItemProps) {
  const isEncourage = action.type === 'ENCOURAGE';

  return (
    <div className="relative h-24 perspective-1000">
      {/* Completion Animation */}
      {showCompletionAnimation && (
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-yellow-500 border border-yellow-600 rounded-lg flex items-center justify-center z-20 animate-slide-up">
          <div className="text-white font-bold text-lg drop-shadow-lg">
            Complete!
          </div>
        </div>
      )}
      
      <motion.div 
        className="relative w-full h-full"
        style={{ 
          transformStyle: 'preserve-3d'
        }}
        animate={{ 
          rotateX: isFlipped ? 180 : 0 
        }}
        transition={{ 
          duration: 0.6,
          ease: "easeInOut"
        }}
        onClick={onToggleFlip}
      >
        {/* Front Side - Action Item */}
        <div
          className={`absolute inset-0 rounded-lg cursor-pointer border-2 ${
            isEncourage 
              ? 'bg-indigo-600 border-indigo-600' 
              : 'bg-purple-600 border-purple-600'
          }`}
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateX(0deg)'
          }}
        >
          {/* Inner content area with gray background and rounded corners */}
          <div className="absolute inset-y-0 left-[1rem] right-0 bg-gray-100 dark:bg-gray-700 rounded-lg flex gap-3 items-center px-[1rem] py-3">
            <div className="flex-1">
            <div className="font-semibold text-gray-900 dark:text-white leading-none">
              {action.type === 'AVOID' && (
                <span className="text-purple-600 dark:text-purple-400">Avoid: </span>
              )}
              {action.name}
            </div>
            
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
              <span className="font-medium text-yellow-600 dark:text-yellow-500">{action.progressPoints} pts</span>
              {action.description && (
                <span> · {action.description}</span>
              )}
            </div>
          </div>
            
          <div className="flex items-center">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onUpdateCount(true);
              }}
              disabled={isUpdating}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
                    isComplete 
                      ? 'bg-gradient-to-t from-amber-400 to-yellow-300 text-gray-800' 
                      : 'bg-gradient-to-br from-gray-500 to-gray-600 text-white hover:from-gray-600 hover:to-gray-700'
                  }`}
                >
                  <div className="relative z-10">
                    {isUpdating ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    )}
                  </div>
                </button>
          </div>
        </div>
      </div>

          {/* Back Side - Management Options */}
          <div
            className={`absolute inset-0 rounded-lg cursor-pointer border-2 ${
              isEncourage 
                ? 'bg-indigo-600 border-indigo-600' 
                : 'bg-purple-600 border-purple-600'
            }`}
            style={{ 
              backfaceVisibility: 'hidden',
              transform: 'rotateX(180deg)'
            }}
          >
            {/* Inner content area - keeps the colored background, no gray needed */}
            <div className="absolute inset-y-0 left-[1rem] right-0 flex items-center justify-between px-3 py-3">
              <div className="flex items-center gap-3">
              <div className="relative">
                <p className="font-semibold text-white leading-none">
                  {action.type === 'AVOID' && <span>Avoid: </span>}
                  {action.name}
                </p>
                <p className="text-sm text-white/80">View history or edit</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onViewHistory();
                  }}
                  className="p-2 rounded-lg text-white bg-white/20 hover:bg-white/30 transition-colors"
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
                    onEditAction();
                  }}
                  className="p-2 rounded-lg text-white bg-white/20 hover:bg-white/30 transition-colors"
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
                    onUpdateCount(false);
                  }}
                  disabled={count === 0 || isUpdating}
                  className="w-full p-2 rounded-lg text-white bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center"
                  title="Decrement count"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                </button>
              )}
          </div>
        </div>
      </div>
        </motion.div>
      </div>
    );
  }
