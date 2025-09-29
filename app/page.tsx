"use client";

import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";
import { Authenticator } from "@aws-amplify/ui-react";
import DailyActionTracker from "@/components/DailyActionTracker";

Amplify.configure(outputs);

const client = generateClient<Schema>();

function ActionApp({ signOut, user }: { signOut: (() => void) | undefined; user: any }) {
  const [actions, setActions] = useState<Array<Schema["Action"]["type"]>>([]);

  function listActions() {
    client.models.Action.observeQuery().subscribe({
      next: (data) => setActions([...data.items]),
    });
  }

  useEffect(() => {
    // Only fetch actions when user is authenticated
    if (user) {
      listActions();
    }
  }, [user]);

  function createAction(actionData: Omit<Schema["Action"]["type"], 'id' | 'completed' | 'completedAt' | 'createdAt'>) {
    client.models.Action.create(actionData);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Kinisi</h1>
        <button
          onClick={() => signOut?.()}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
        >
          Sign out
        </button>
      </div>
      
              <div className="p-4">
                <DailyActionTracker
                  actions={actions}
                  onDataUpdate={() => {
                    // Refresh actions data
                    listActions();
                  }}
                  onCreateAction={createAction}
                  user={user}
                />
              </div>
    </div>
  );
}

export default function App() {
  return (
    <Authenticator>
      {({ signOut, user }) => (
        <ActionApp signOut={signOut} user={user} />
      )}
    </Authenticator>
  );
}
