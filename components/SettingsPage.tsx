'use client';

import { useState, useEffect } from 'react';
import { useTheme } from './ThemeContext';
import { useUserProfile } from './UserProfileContext';
import KinisiLogo from './KinisiLogo';

interface SettingsPageProps {
  onBack: () => void;
}

export default function SettingsPage({ onBack }: SettingsPageProps) {
  const { theme, setTheme } = useTheme();
  const { timezone, setTimezone, firstName, lastName, setFirstName, setLastName, isLoading } = useUserProfile();
  
  // Local state for auto-save feedback
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [localFirstName, setLocalFirstName] = useState(firstName);
  const [localLastName, setLocalLastName] = useState(lastName);

  // Debug logging
  console.log('SettingsPage - Context values:', { firstName, lastName, isLoading });
  console.log('SettingsPage - Local values:', { localFirstName, localLastName, hasUserInteracted });

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
      setSaveStatus('saving');
      
      const timer = setTimeout(() => {
        // Save to context (which will save to database)
        setFirstName(localFirstName);
        setLastName(localLastName);
        setSaveStatus('saved');
        // Auto-hide the saved status after 2 seconds
        setTimeout(() => setSaveStatus('idle'), 2000);
      }, 1000); // Save 1 second after user stops typing

      return () => clearTimeout(timer);
    }
  }, [localFirstName, localLastName, hasUserInteracted, firstName, lastName, setFirstName, setLastName]);

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

  return (
    <div className="space-y-6">
      {/* Header */}

      {/* Settings Content */}
      <div className="space-y-6">

        {/* Profile Settings */}        {/* Account Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account</h2>
          
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
            
            {/* Auto-save Status Indicator */}
            {saveStatus !== 'idle' && (
              <div className="flex items-center gap-2">
                {saveStatus === 'saving' && (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-amber-600 border-t-transparent"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Saving...</span>
                  </>
                )}
                {saveStatus === 'saved' && (
                  <>
                    <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-green-600 dark:text-green-400">Saved</span>
                  </>
                )}
                {saveStatus === 'error' && (
                  <>
                    <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-sm text-red-600 dark:text-red-400">Save failed</span>
                  </>
                )}
              </div>
            )}
            
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
                {['light', 'dark', 'auto'].map((themeOption) => (
                  <button
                    key={themeOption}
                    onClick={() => handleThemeChange(themeOption as 'light' | 'dark' | 'auto')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      theme === themeOption
                        ? 'bg-amber-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {themeOption === 'light' && '☀️ Light'}
                    {themeOption === 'dark' && '🌙 Dark'}
                    {themeOption === 'auto' && '🔄 Auto'}
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
              <span className="text-sm text-gray-600 dark:text-gray-400">Version</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">0.1.3</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Build</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">2025.10.12</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
