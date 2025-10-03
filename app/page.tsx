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
import ProfilePage from "@/components/ProfilePage";
import { useUserProfile } from "@/components/UserProfileContext";
import AddActionModal from "@/components/AddActionModal";
import { AppLoadingSkeleton, MobileLoadingSkeleton } from "@/components/SkeletonComponents";

Amplify.configure(outputs);

const client = generateClient<Schema>();

function ActionApp({ signOut, user }: { signOut: (() => void) | undefined; user: any }) {
  const [actions, setActions] = useState<Array<Schema["Action"]["type"]>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'profile'>('dashboard');
  const [showAddModal, setShowAddModal] = useState(false);
  const { firstName } = useUserProfile();

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
      <div className="hidden lg:flex h-screen">
        {/* Left Sidebar - Navigation */}
        <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
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
              <button 
                onClick={() => setCurrentPage('dashboard')}
                className={`flex items-center gap-3 w-full px-3 py-2 text-sm rounded-md transition-colors ${
                  currentPage === 'dashboard'
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
                </svg>
                Dashboard
              </button>
              
              <button 
                onClick={() => setCurrentPage('profile')}
                className={`flex items-center gap-3 w-full px-3 py-2 text-sm rounded-md transition-colors ${
                  currentPage === 'profile'
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profile
              </button>
            </div>
          </nav>
          
          {/* User Section */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                  {(user?.signInDetails?.loginId || user?.username || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {firstName || (user?.signInDetails?.loginId || user?.username || 'User').split('@')[0]}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Free Plan</p>
              </div>
            </div>
          </div>
          
          {/* Version Info */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 mt-auto">
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <div className="flex justify-between">
                <span>Version</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">0.1.4</span>
              </div>
              <div className="flex justify-between">
                <span>Build</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">251002</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content Area - 2/3 width */}
        <div className="flex-1 flex mx-auto h-full overflow-hidden">
          <div className="w-[600px] p-6 overflow-y-auto">
            {currentPage === 'dashboard' ? (
              isLoading ? (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
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
              )
              ) : (
                <ProfilePage 
                  onBack={() => setCurrentPage('dashboard')} 
                  onSignOut={signOut}
                />
              )}
          </div>
          
          {/* Right Column - Data Breakdown */}
          <div className="w-1/3 p-6 border-l border-gray-200 dark:border-gray-700 h-full overflow-y-auto">
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
        {/* Mobile Header */}
        <div className="flex items-center pt-1 pl-4 -mb-2 justify-between">
          {/* Left: Kinisi Logo */}
          <button 
            onClick={() => setCurrentPage('dashboard')}
            className={`flex items-center gap-2 py-2 rounded-lg transition-all duration-200 ${
              currentPage === 'dashboard'
                ? 'text-amber-700 dark:text-amber-300'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <KinisiLogo className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            <span className="text-lg font-semibold text-gray-900 dark:text-white">Kinisi</span>
          </button>

          {/* Right: Profile */}
          <button 
            onClick={() => setCurrentPage('profile')}
            className={`flex items-center gap-2 px-3 rounded-lg transition-all duration-200 ${
              currentPage === 'profile'
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {firstName || 'User'}
            </span>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              currentPage === 'profile'
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}>
              {firstName ? firstName.charAt(0).toUpperCase() : 'U'}
            </div>
          </button>
        </div>
        
        {/* Mobile Content */}
        <div className="p-4 pb-20">
          {currentPage === 'dashboard' ? (
            isLoading ? (
              <MobileLoadingSkeleton />
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
            )
          ) : (
            <ProfilePage 
              onBack={() => setCurrentPage('dashboard')} 
              onSignOut={signOut}
            />
          )}
        </div>
        
        {/* Add Action Modal for Mobile */}
        <AddActionModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAdd={createAction}
        />
        
        {/* Mobile Bottom Navigation - Floating */}
        <div className="lg:hidden fixed bottom-4 left-4 right-4 z-50">
          <div className="filter backdrop-blur-sm backdrop-brightness-75 rounded-3xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl">
            <div className="flex items-center justify-center py-3 px-6">
              {/* Center: Add Action - Primary Button */}
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center justify-center p-3 bg-gradient-to-t from-amber-400 to-yellow-300 hover:from-amber-500 hover:to-yellow-400 text-white rounded-full shadow-lg transition-all duration-200"
              >
                <svg className="w-6 h-6 text-gray-900 dark:text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
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
    return <AppLoadingSkeleton />;
  }

  if (!user) {
    return <CustomAuth onAuthSuccess={handleAuthSuccess} />;
  }

  return <ActionApp signOut={handleSignOut} user={user} />;
}
