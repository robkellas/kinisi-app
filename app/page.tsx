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
    <div className="min-h-screen max-w-5xl mx-auto bg-gray-50 dark:bg-gray-900">
      {/* Full-width navigation */}
      <div className="flex items-center justify-between px-4 pt-4 shadow-sm w-full">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Kinisi</h1>
          <KinisiLogo className="w-7 h-7 text-amber-600 dark:text-amber-400" />
        </div>
        <NavigationDropdown onSignOut={signOut} />
      </div>
      
      {/* Content with max-width container */}
      <div className="max-w-5xl mx-auto">
        <div className="p-4">
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
