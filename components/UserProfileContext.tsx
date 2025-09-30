'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>();

interface UserProfileContextType {
  timezone: string;
  theme: 'light' | 'dark' | 'auto';
  displayName?: string;
  setTimezone: (timezone: string) => void;
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  setDisplayName: (displayName: string) => void;
  isLoading: boolean;
  userProfile?: Schema["UserProfile"]["type"];
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

// Comprehensive global timezone coverage
export const COMMON_TIMEZONES = [
  // North America
  { value: 'America/Anchorage', label: 'Alaska Time (Anchorage)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (Los Angeles)' },
  { value: 'America/Denver', label: 'Mountain Time (Denver)' },
  { value: 'America/Chicago', label: 'Central Time (Chicago)' },
  { value: 'America/New_York', label: 'Eastern Time (New York)' },
  { value: 'America/Toronto', label: 'Eastern Time (Toronto)' },
  { value: 'America/Vancouver', label: 'Pacific Time (Vancouver)' },
  { value: 'America/Mexico_City', label: 'Central Time (Mexico City)' },
  { value: 'America/Sao_Paulo', label: 'Brasília Time (São Paulo)' },
  { value: 'America/Buenos_Aires', label: 'Argentina Time (Buenos Aires)' },
  
  // Europe
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Dublin', label: 'Dublin (GMT/IST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
  { value: 'Europe/Rome', label: 'Rome (CET/CEST)' },
  { value: 'Europe/Madrid', label: 'Madrid (CET/CEST)' },
  { value: 'Europe/Amsterdam', label: 'Amsterdam (CET/CEST)' },
  { value: 'Europe/Stockholm', label: 'Stockholm (CET/CEST)' },
  { value: 'Europe/Oslo', label: 'Oslo (CET/CEST)' },
  { value: 'Europe/Copenhagen', label: 'Copenhagen (CET/CEST)' },
  { value: 'Europe/Warsaw', label: 'Warsaw (CET/CEST)' },
  { value: 'Europe/Prague', label: 'Prague (CET/CEST)' },
  { value: 'Europe/Vienna', label: 'Vienna (CET/CEST)' },
  { value: 'Europe/Zurich', label: 'Zurich (CET/CEST)' },
  { value: 'Europe/Athens', label: 'Athens (EET/EEST)' },
  { value: 'Europe/Helsinki', label: 'Helsinki (EET/EEST)' },
  { value: 'Europe/Moscow', label: 'Moscow (MSK)' },
  { value: 'Europe/Istanbul', label: 'Istanbul (TRT)' },
  
  // Asia
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Karachi', label: 'Karachi (PKT)' },
  { value: 'Asia/Kolkata', label: 'Mumbai/Delhi (IST)' },
  { value: 'Asia/Dhaka', label: 'Dhaka (BST)' },
  { value: 'Asia/Bangkok', label: 'Bangkok (ICT)' },
  { value: 'Asia/Jakarta', label: 'Jakarta (WIB)' },
  { value: 'Asia/Manila', label: 'Manila (PHT)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong (HKT)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Asia/Seoul', label: 'Seoul (KST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  
  // Africa
  { value: 'Africa/Cairo', label: 'Cairo (EET)' },
  { value: 'Africa/Johannesburg', label: 'Johannesburg (SAST)' },
  { value: 'Africa/Lagos', label: 'Lagos (WAT)' },
  { value: 'Africa/Nairobi', label: 'Nairobi (EAT)' },
  { value: 'Africa/Casablanca', label: 'Casablanca (WET)' },
  
  // Australia & Oceania
  { value: 'Australia/Perth', label: 'Perth (AWST)' },
  { value: 'Australia/Adelaide', label: 'Adelaide (ACST/ACDT)' },
  { value: 'Australia/Melbourne', label: 'Melbourne (AEST/AEDT)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
  { value: 'Australia/Brisbane', label: 'Brisbane (AEST)' },
  { value: 'Australia/Darwin', label: 'Darwin (ACST)' },
  { value: 'Pacific/Auckland', label: 'Auckland (NZST/NZDT)' },
  { value: 'Pacific/Fiji', label: 'Fiji (FJT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (Honolulu)' },
];

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const [userProfile, setUserProfile] = useState<Schema["UserProfile"]["type"] | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  // Load user profile on mount
  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      const { data: profiles } = await client.models.UserProfile.list();
      
      if (profiles.length > 0) {
        setUserProfile(profiles[0]);
      } else {
        // Create default profile if none exists
        const { data: newProfile } = await client.models.UserProfile.create({
          timezone: 'America/Los_Angeles',
          theme: 'auto',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        if (newProfile) {
          setUserProfile(newProfile);
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      // Fallback to default values
      setUserProfile({
        id: 'default',
        timezone: 'America/Los_Angeles',
        theme: 'auto',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserProfile = async (updates: Partial<Schema["UserProfile"]["type"]>) => {
    try {
      if (!userProfile) return;

      const { data: updatedProfile } = await client.models.UserProfile.update({
        id: userProfile.id,
        ...updates,
        updatedAt: new Date().toISOString(),
      });

      if (updatedProfile) {
        setUserProfile(updatedProfile);
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
    }
  };

  const setTimezone = (timezone: string) => {
    updateUserProfile({ timezone });
  };

  const setTheme = (theme: 'light' | 'dark' | 'auto') => {
    updateUserProfile({ theme });
  };

  const setDisplayName = (displayName: string) => {
    updateUserProfile({ displayName });
  };

  const contextValue: UserProfileContextType = {
    timezone: userProfile?.timezone || 'America/Los_Angeles',
    theme: userProfile?.theme || 'auto',
    displayName: userProfile?.displayName || undefined,
    setTimezone,
    setTheme,
    setDisplayName,
    isLoading,
    userProfile,
  };

  return (
    <UserProfileContext.Provider value={contextValue}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const context = useContext(UserProfileContext);
  if (context === undefined) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
}

// Backward compatibility
export function useTimezone() {
  const { timezone } = useUserProfile();
  return { timezone };
}
