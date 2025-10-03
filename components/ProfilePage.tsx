'use client';

import { useState, useEffect, useRef } from 'react';
import { useTheme } from './ThemeContext';
import { useUserProfile } from './UserProfileContext';
import { useSavingIndicator } from './SavingIndicatorContext';
import { APP_VERSION, BUILD_NUMBER } from '@/lib/version';
import { ProfilePageSkeleton } from './SkeletonComponents';
import KinisiLogo from './KinisiLogo';

interface ProfilePageProps {
  onBack: () => void;
  onSignOut?: () => void;
}

export default function ProfilePage({ onBack, onSignOut }: ProfilePageProps) {
  const { theme, setTheme } = useTheme();
  const { timezone, setTimezone, firstName, lastName, setFirstName, setLastName, isLoading } = useUserProfile();
  const { showSaving, showSaved } = useSavingIndicator();
  
  // Local state for auto-save feedback
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [localFirstName, setLocalFirstName] = useState(firstName);
  const [localLastName, setLocalLastName] = useState(lastName);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);


  // Update local state when context values change (but only if user hasn't interacted)
  useEffect(() => {
    if (!hasUserInteracted) {
      setLocalFirstName(firstName);
      setLocalLastName(lastName);
    }
  }, [firstName, lastName, hasUserInteracted]);

  const timezones = [
    'America/New_York',
    'America/Chicago', 
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney'
  ];

  const getTimezoneDisplay = (tz: string) => {
    const parts = tz.split('/');
    if (parts.length > 1) {
      return parts[parts.length - 1].replace('_', ' ');
    }
    return tz;
  };

  // Auto-save profile fields with debouncing (only when user has interacted and values have changed)
  useEffect(() => {
    if (hasUserInteracted && 
        (localFirstName !== firstName || localLastName !== lastName)) {
      
      // Clear any existing save timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      
      // Show saving indicator immediately
      showSaving();
      
      // Set new timeout for saving
      saveTimeoutRef.current = setTimeout(() => {
        // Save to context (which will save to database)
        setFirstName(localFirstName);
        setLastName(localLastName);
        showSaved();
        saveTimeoutRef.current = null;
      }, 2000); // Save 2 seconds after user stops typing

      return () => {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
          saveTimeoutRef.current = null;
        }
      };
    }
  }, [localFirstName, localLastName, hasUserInteracted, firstName, lastName]);

  // Auto-save theme changes immediately
  const handleThemeChange = (newTheme: 'light' | 'dark' | 'auto') => {
    setTheme(newTheme);
    // Theme is automatically saved by the ThemeContext
  };

  // Auto-save timezone changes immediately  
  const handleTimezoneChange = (newTimezone: string) => {
    setTimezone(newTimezone);
    // Timezone is automatically saved by the UserProfileContext
  };

  if (isLoading) {
    return <ProfilePageSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}

        {/* Profile Content */}
        <div className="space-y-6">

        {/* Profile Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Profile</h2>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-amber-600 border-t-transparent"></div>
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Loading profile...</span>
            </div>
          ) : (
            <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                First Name
              </label>
              <input
                type="text"
                value={localFirstName}
                onChange={(e) => {
                  setLocalFirstName(e.target.value);
                  setHasUserInteracted(true);
                }}
                placeholder="Enter your first name"
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Last Name
              </label>
              <input
                type="text"
                value={localLastName}
                onChange={(e) => {
                  setLocalLastName(e.target.value);
                  setHasUserInteracted(true);
                }}
                placeholder="Enter your last name"
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Plan</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Free Plan</p>
              </div>
              <button className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors">
                Upgrade
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Data Export</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Download your data</p>
              </div>
              <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors">
                Export
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Sign Out</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Sign out of your account</p>
              </div>
              <button 
                onClick={onSignOut || onBack}
                className="px-4 py-2 bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium transition-colors"
              >
                Sign Out
              </button>
            </div>
            </div>
          )}
        </div>

        {/* Timezone Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Time & Location</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => handleTimezoneChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                {timezones.map((tz) => (
                  <option key={tz} value={tz}>
                    {getTimezoneDisplay(tz)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Theme Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Appearance</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Theme
              </label>
                  <div className="flex gap-2">
                    {[
                      { value: 'light', label: 'Light', icon: (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                        </svg>
                      )},
                      { value: 'dark', label: 'Dark', icon: (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
                        </svg>
                      )},
                      { value: 'auto', label: 'Auto', icon: (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                      )}
                    ].map((themeOption) => (
                      <button
                        key={themeOption.value}
                        onClick={() => handleThemeChange(themeOption.value as 'light' | 'dark' | 'auto')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                          theme === themeOption.value
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {themeOption.icon}
                        {themeOption.label}
                      </button>
                    ))}
                  </div>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">About</h2>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">App Name</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">Kinisi</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Description</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">Mindful Movement</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
