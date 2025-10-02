"use client";

import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import { getCurrentUser, signOut } from "aws-amplify/auth";
import DailyActionTracker from "@/components/DailyActionTracker";
import CustomAuth from "@/components/CustomAuth";
import NavigationDropdown from "@/components/NavigationDropdown";
import KinisiLogo from "@/components/KinisiLogo";

Amplify.configure(outputs);

const client = generateClient<Schema>();

function ActionApp({ signOut, user }: { signOut: (() => void) | undefined; user: any }) {
  const [actions, setActions] = useState<Array<Schema["Action"]["type"]>>([]);
  const [isLoading, setIsLoading] = useState(true);

  function listActions() {
    try {
      client.models.Action.observeQuery().subscribe({
        next: (data) => {
          setActions([...data.items]);
          setIsLoading(false);
        },
        error: (error) => {
          console.error('Error fetching actions:', error);
          setIsLoading(false);
        }
      });
    } catch (error) {
      console.error('Error setting up action subscription:', error);
      setIsLoading(false);
    }
  }

  useEffect(() => {
    // Only fetch actions when user is authenticated
    if (user) {
      setIsLoading(true);
      listActions();
    }
  }, [user]);

  function createAction(actionData: Omit<Schema["Action"]["type"], 'id' | 'completed' | 'completedAt' | 'createdAt'>) {
    try {
      client.models.Action.create(actionData);
    } catch (error) {
      console.error('Error creating action:', error);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Desktop Layout - Three Columns */}
      <div className="hidden lg:flex min-h-screen">
        {/* Left Sidebar - Navigation */}
        <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          {/* Logo/Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <KinisiLogo className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Kinisi</h1>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Mindful Movement</p>
          </div>
          
          {/* Navigation Links */}
          <nav className="flex-1 p-4">
            <div className="space-y-2">
              <button className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
                </svg>
                Dashboard
              </button>
              
              <button className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Analytics
              </button>
              
              <button className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
                Settings
              </button>
            </div>
          </nav>
          
          {/* User Section */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user?.username || 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Free Plan</p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-2 w-full mt-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
        
        {/* Main Content Area - 2/3 width */}
        <div className="flex-1 flex">
          <div className="w-2/3 p-6">
            {isLoading ? (
              <div className="space-y-6">
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                  <div className="text-center py-12 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-500 dark:text-gray-300">Loading your actions...</p>
                  </div>
                </div>
              </div>
            ) : (
            <DailyActionTracker
              actions={actions}
              onDataUpdate={() => {
                // Refresh actions data
                listActions();
              }}
              onCreateAction={createAction}
              user={user}
              onSignOut={signOut}
            />
            )}
          </div>
          
          {/* Right Column - Data Breakdown */}
          <div className="w-1/3 p-6 border-l border-gray-200 dark:border-gray-700">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Data Breakdown</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                This section will contain detailed analytics and insights about your progress, 
                including completion rates, streak tracking, and performance metrics. We'll 
                implement comprehensive data visualization tools to help you understand your 
                habits and optimize your routine.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Layout - Single Column */}
      <div className="lg:hidden">
        {/* Mobile Navigation */}
        <div className="flex items-center justify-center px-4 pt-4 shadow-sm w-full">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Kinisi</h1>
            <KinisiLogo className="w-7 h-7 text-amber-600 dark:text-amber-400" />
          </div>
        </div>
        
        {/* Mobile Content */}
        <div className="p-4 pb-20">
          {isLoading ? (
            <div className="space-y-6">
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                  <p className="text-gray-500 dark:text-gray-300">Loading your actions...</p>
                </div>
              </div>
            </div>
          ) : (
            <DailyActionTracker
              actions={actions}
              onDataUpdate={() => {
                // Refresh actions data
                listActions();
              }}
              onCreateAction={createAction}
              user={user}
              onSignOut={signOut}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleAuthSuccess = (user: any) => {
    setUser(user);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <CustomAuth onAuthSuccess={handleAuthSuccess} />;
  }

  return <ActionApp signOut={handleSignOut} user={user} />;
}
