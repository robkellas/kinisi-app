'use client';

import { createContext, useContext, useState, useRef, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SavingIndicatorContextType {
  isSaving: boolean;
  showSaving: () => void;
  showSaved: () => void;
  hide: () => void;
}

const SavingIndicatorContext = createContext<SavingIndicatorContextType | undefined>(undefined);

export function SavingIndicatorProvider({ children }: { children: ReactNode }) {
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showSaving = () => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsSaving(true);
    setShowSaved(false);
  };

  const showSavedIndicator = () => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    setIsSaving(false);
    setShowSaved(true);
    
    // Auto-hide after 2 seconds
    timeoutRef.current = setTimeout(() => {
      setShowSaved(false);
      timeoutRef.current = null;
    }, 2000);
  };

  const hide = () => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsSaving(false);
    setShowSaved(false);
  };

  return (
    <SavingIndicatorContext.Provider value={{
      isSaving,
      showSaving,
      showSaved: showSavedIndicator,
      hide
    }}>
      {children}
      
          {/* Global Saving Indicator */}
          <AnimatePresence>
            {(isSaving || showSaved) && (
              <motion.div 
                className="fixed bottom-4 right-4 z-50"
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 flex items-center gap-2">
                  {isSaving && (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-amber-600 border-t-transparent"></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">Saving...</span>
                    </>
                  )}
                  {showSaved && (
                    <>
                      <motion.svg 
                        className="w-4 h-4 text-green-600 dark:text-green-400" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1, duration: 0.2, ease: "easeOut" }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </motion.svg>
                      <span className="text-sm text-green-600 dark:text-green-400">Saved</span>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
    </SavingIndicatorContext.Provider>
  );
}

export function useSavingIndicator() {
  const context = useContext(SavingIndicatorContext);
  if (context === undefined) {
    throw new Error('useSavingIndicator must be used within a SavingIndicatorProvider');
  }
  return context;
}
