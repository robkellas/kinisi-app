'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useTheme } from './ThemeContext';
import type { Schema } from "@/amplify/data/resource";

type Action = Schema["Action"]["type"];

interface ActionItemProps {
  action: Action;
  count: number;
  isComplete: boolean;
  isFlipped: boolean;
  isUpdating: boolean;
  targetCount: number;
  progressPercentage: number;
  previousProgressPercentage: number;
  animateCompletion: boolean;
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
  targetCount,
  progressPercentage,
  previousProgressPercentage,
  animateCompletion,
  onToggleFlip,
  onUpdateCount,
  onViewHistory,
  onEditAction
}: ActionItemProps) {
  const { theme } = useTheme();
  const isEncourage = action.type === 'ENCOURAGE';
  
  // Track dark mode state
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    
    // Check initial state
    checkDarkMode();
    
    // Watch for changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);
  
  // Get the appropriate gray color based on theme
  const grayColor = isDarkMode ? 'rgb(107 114 128)' : 'rgb(209 213 219)';

  return (
    <div className="relative h-24 perspective-1000">
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
              
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">
                  {action.description}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  <span className="font-medium text-amber-600 dark:text-amber-400">{action.progressPoints} pts</span>
                  <span> · {(action.targetCount || 1) > 1 ? `${action.targetCount || 1}x ` : ''}Daily</span>
                  {action.timeOfDay && (
                    <span> · {action.timeOfDay.charAt(0).toUpperCase() + action.timeOfDay.slice(1).toLowerCase()}</span>
                  )}
                </div>
            </div>
              
            <div className="flex items-center">
              <div className="relative">
                {/* Progress Ring Background */}
                <motion.div
                  className="absolute inset-0 w-16 h-16 rounded-full"
                    style={{
                      background: animateCompletion
                        ? `conic-gradient(from 0deg, rgb(251 191 36) 0deg, rgb(251 191 36) ${(previousProgressPercentage / 100) * 360}deg, ${grayColor} ${(previousProgressPercentage / 100) * 360}deg, ${grayColor} 360deg)`
                        : isComplete
                          ? 'linear-gradient(to top, rgb(251 191 36), rgb(253 224 71))'
                          : `conic-gradient(from 0deg, rgb(251 191 36) 0deg, rgb(251 191 36) ${(progressPercentage / 100) * 360}deg, ${grayColor} ${(progressPercentage / 100) * 360}deg, ${grayColor} 360deg)`
                    }}
                    animate={{
                      background: animateCompletion
                        ? isComplete
                          ? [
                              `conic-gradient(from 0deg, rgb(251 191 36) 0deg, rgb(251 191 36) ${(previousProgressPercentage / 100) * 360}deg, ${grayColor} ${(previousProgressPercentage / 100) * 360}deg, ${grayColor} 360deg)`,
                              `conic-gradient(from 0deg, rgb(251 191 36) 0deg, rgb(251 191 36) 360deg, ${grayColor} 360deg, ${grayColor} 360deg)`,
                              'linear-gradient(to top, rgb(251 191 36), rgb(253 224 71))'
                            ]
                          : [
                              `conic-gradient(from 0deg, rgb(251 191 36) 0deg, rgb(251 191 36) ${(previousProgressPercentage / 100) * 360}deg, ${grayColor} ${(previousProgressPercentage / 100) * 360}deg, ${grayColor} 360deg)`,
                              `conic-gradient(from 0deg, rgb(251 191 36) 0deg, rgb(251 191 36) ${(progressPercentage / 100) * 360}deg, ${grayColor} ${(progressPercentage / 100) * 360}deg, ${grayColor} 360deg)`
                            ]
                        : `conic-gradient(from 0deg, rgb(251 191 36) 0deg, rgb(251 191 36) ${(progressPercentage / 100) * 360}deg, ${grayColor} ${(progressPercentage / 100) * 360}deg, ${grayColor} 360deg)`
                    }}
                  transition={{
                    background: { 
                      duration: animateCompletion ? (isComplete ? 0.8 : 0.6) : 0,
                      ease: "easeInOut",
                      times: animateCompletion && isComplete ? [0, 0.8, 1] : [0]
                    }
                  }}
                />
                
                <motion.button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onUpdateCount(true);
                  }}
                  disabled={isUpdating}
                    className={`w-16 h-16 rounded-full flex items-center justify-center relative z-20 ${
                      isComplete 
                        ? 'text-gray-800 shadow-lg' 
                        : 'text-gray-700 dark:text-white'
                    }`}
                  style={{
                    background: 'rgba(0, 0, 0, 0.1)'
                  }}
                  animate={{
                    scale: isComplete ? 1.05 : 1,
                    boxShadow: isComplete 
                      ? '0 0 20px rgba(251, 191, 36, 0.4)' 
                      : '0 0 0px rgba(0, 0, 0, 0)'
                  }}
                    transition={{
                      scale: { duration: 0.4, ease: "easeOut", delay: isComplete && animateCompletion ? 0.5 : 0 },
                      boxShadow: { duration: 0.4, ease: "easeOut", delay: isComplete && animateCompletion ? 0.5 : 0 }
                    }}
                  whileHover={{ scale: isUpdating ? 1 : 1.02 }}
                  whileTap={{ scale: 0.85 }}
                >
                    <motion.div 
                      className={`w-12 h-12 rounded-full flex items-center justify-center relative z-10 ${
                        isComplete 
                          ? 'bg-gradient-to-t from-amber-400 to-yellow-300' 
                          : 'bg-gray-300 dark:bg-gray-500'
                      }`}
                      animate={{
                        scale: 1,
                        background: isComplete 
                          ? 'linear-gradient(to top, rgb(251 191 36), rgb(253 224 71))' 
                          : grayColor // Dynamic gray color based on theme
                      }}
                        transition={{
                          background: { duration: 0.3, ease: "easeOut", delay: isComplete && animateCompletion ? 0.5 : 0 }
                        }}
                  >
                    {count > targetCount ? (
                      <div className="text-base font-bold text-center leading-none flex items-center justify-center w-full h-full">
                        {targetCount > 1 ? `${count}/${targetCount}` : `${count}x`}
                      </div>
                    ) : isComplete ? (
                      <motion.svg 
                        className="w-6 h-6" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                          transition={{ 
                            duration: 0.4, 
                            ease: "easeOut", 
                            delay: isComplete && animateCompletion ? 0.5 : 0 
                          }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </motion.svg>
                    ) : (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    )}
                  </motion.div>
                </motion.button>
              </div>
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
                  {action.description && (
                    <p className="text-sm text-white/80 mt-1">{action.description}</p>
                  )}
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