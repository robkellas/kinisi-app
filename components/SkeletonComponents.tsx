'use client';

import { motion } from 'framer-motion';

// Base skeleton component with shimmer animation
export function Skeleton({ className = "", ...props }: { className?: string; [key: string]: any }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
      {...props}
    />
  );
}

// Action Item Skeleton
export function ActionItemSkeleton() {
  return (
    <div className="relative h-24">
      {/* Button skeleton */}
      <div className="absolute inset-y-0 left-0 w-16 bg-gray-200 dark:bg-gray-700 rounded-l-lg flex items-center justify-center">
        <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
      </div>
      
      {/* Content skeleton */}
      <div className="absolute inset-y-0 left-16 right-0 bg-gray-200 dark:bg-gray-700 rounded-r-lg flex gap-3 items-center px-4 py-3">
        <div className="flex-1 space-y-2">
          {/* Title */}
          <Skeleton className="h-4 w-3/4" />
          {/* Description */}
          <Skeleton className="h-3 w-1/2" />
          {/* Points and frequency */}
          <Skeleton className="h-3 w-2/3" />
        </div>
        
        {/* Right side buttons */}
        <div className="flex items-center gap-2">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="w-8 h-8 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// Weekly Chart Skeleton
export function WeeklyChartSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
      
      <div className="space-y-4">
        {/* Chart bars */}
        <div className="flex items-end justify-between h-32 space-x-2">
          {Array.from({ length: 7 }).map((_, i) => {
            // Use deterministic heights based on index to avoid hydration mismatch
            const heights = [85, 65, 45, 70, 55, 75, 90];
            return (
              <div key={i} className="flex flex-col items-center space-y-2 flex-1">
                <Skeleton className="w-full rounded-t" style={{ height: `${heights[i]}%` }} />
                <Skeleton className="h-3 w-8" />
              </div>
            );
          })}
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="text-center">
              <Skeleton className="h-6 w-8 mx-auto mb-1" />
              <Skeleton className="h-3 w-16 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Profile Page Skeleton
export function ProfilePageSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <Skeleton className="h-6 w-24 mb-4" />
          <div className="space-y-4">
            {i === 0 ? (
              // Profile section
              <>
                <div>
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div>
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="flex justify-between">
                  <div>
                    <Skeleton className="h-4 w-12 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-8 w-20 rounded-lg" />
                </div>
              </>
            ) : i === 1 ? (
              // Timezone section
              <>
                <div>
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </>
            ) : i === 2 ? (
              // Theme section
              <>
                <div>
                  <Skeleton className="h-4 w-16 mb-2" />
                  <div className="flex gap-2">
                    {Array.from({ length: 3 }).map((_, j) => (
                      <Skeleton key={j} className="h-8 w-20 rounded-lg" />
                    ))}
                  </div>
                </div>
              </>
            ) : (
              // About section
              <>
                {Array.from({ length: 2 }).map((_, j) => (
                  <div key={j} className="flex justify-between">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// Sidebar Skeleton
export function SidebarSkeleton() {
  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Skeleton className="w-8 h-8" />
          <Skeleton className="h-6 w-20" />
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-md">
              <Skeleton className="w-4 h-4" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </nav>
      
      {/* User info */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Main App Loading Skeleton
export function AppLoadingSkeleton() {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <SidebarSkeleton />
      
      {/* Main Content */}
      <div className="flex-1 flex">
        <div className="w-2/3 p-6 space-y-6">
          {/* Weekly Chart */}
          <WeeklyChartSkeleton />
          
          {/* Action Items */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <Skeleton className="h-6 w-32" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-20 rounded-lg" />
                <Skeleton className="h-8 w-24 rounded-lg" />
              </div>
            </div>
            
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <ActionItemSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
        
        {/* Right Column */}
        <div className="w-1/3 p-6 border-l border-gray-200 dark:border-gray-700">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-3">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-5/6" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Mobile Loading Skeleton
export function MobileLoadingSkeleton() {
  return (
    <div className="lg:hidden space-y-6 p-4 pb-20">
      {/* Weekly Chart */}
      <WeeklyChartSkeleton />
      
      {/* Action Items */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-6 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20 rounded-lg" />
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
        </div>
        
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <ActionItemSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
