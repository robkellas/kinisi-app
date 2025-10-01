'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { generateClient } from "aws-amplify/data";
import { ANIMATION_CONFIG } from '@/lib/animations';
import { useUserProfile } from './UserProfileContext';
import { getDateInTimezone } from '@/lib/dateUtils';
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import type { Schema } from "@/amplify/data/resource";

Amplify.configure(outputs);
const client = generateClient<Schema>();

interface WeeklyChartProps {
  todayScore: number;
  userTimezone?: string;
  selectedDate?: string;
  shouldAnimate?: boolean;
  logsCache?: Record<string, any[]>;
  onDateSelect?: (date: string) => void;
}

interface ChartData {
  date: string;
  score: number;
  label: string;
}

// Component to animate number values with fade out/in
function AnimatedNumber({ value, delay = 0 }: { value: number; delay?: number }) {
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { 
    stiffness: 100, 
    damping: 30
  });
  const display = useTransform(springValue, (latest) => Math.round(latest));

  useEffect(() => {
    // Start with opacity 0, then animate to value
    motionValue.set(0);
    const timeout = setTimeout(() => {
      motionValue.set(value);
    }, delay);
    
    return () => clearTimeout(timeout);
  }, [motionValue, value, delay]);

  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ 
        duration: ANIMATION_CONFIG.chartBars.duration / 1000,
        delay: delay / 1000,
        ease: ANIMATION_CONFIG.chartBars.easing
      }}
    >
      {display}
    </motion.span>
  );
}

export default function WeeklyChart({ 
  todayScore, 
  userTimezone = 'America/Los_Angeles', 
  selectedDate,
  shouldAnimate = false,
  logsCache,
  onDateSelect
}: WeeklyChartProps) {
  const { timezone } = useUserProfile();
  const [isLoading, setIsLoading] = useState(true);

  const CHART_HEIGHT = 180;
  const TOP_PADDING = 40;


  // Memoize chart data calculation using cached data
  const chartData = useMemo(() => {
    // Always use the last 8 days from today (7 days + today) to compare with same day last week
    const dates: string[] = [];
    for (let i = 7; i >= 0; i--) {
      const date = getDateInTimezone(i, timezone);
      dates.push(date);
    }

    // Use cached data if available, otherwise use empty data
    const historicalData: ChartData[] = dates.slice(0, -1).map(date => {
      const logsForDate = logsCache?.[date] || [];
      const score = logsForDate.reduce((sum, log) => sum + (log.points || 0), 0);
      
      return {
        date,
        score,
        label: new Date(date + 'T00:00:00').toLocaleDateString('en-US', { 
          weekday: 'short',
          timeZone: timezone
        })
      };
    });

    // Add today's data
    const todayData: ChartData = {
      date: dates[dates.length - 1],
      score: todayScore,
      label: 'Today'
    };

    return [...historicalData, todayData];
  }, [userTimezone, todayScore, logsCache]);

  useEffect(() => {
    setIsLoading(false);
  }, [chartData]);

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded mb-4"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const allZero = chartData.every(data => data.score === 0);

  if (allZero) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">7-Day Trend</h3>
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500 font-medium">No data yet</span>
          </div>
        </div>
        <div className="text-center py-8 rounded-lg">
          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <p className="text-sm text-blue-50">Start tracking your actions</p>
          <p className="text-xs text-blue-50">Your 7-day trend will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg">
        {/* Header above chart area */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-white">7-Day Trend</h3>
          {chartData.length > 0 && (
            <div className="text-[11px] text-white">
              {(() => {
                const total = chartData.reduce((s, d) => s + d.score, 0);
                const avg = total / chartData.length;
                return `Avg ${avg.toFixed(0)} pts/day`;
              })()}
            </div>
          )}
        </div>
        
        {/* Chart area with reserved top padding for labels */}
        <div className="relative" style={{ height: `${CHART_HEIGHT + TOP_PADDING}px` }}>
          <div className="absolute left-0 right-0 bottom-0" style={{ height: `${CHART_HEIGHT}px` }}>
            {/* Simple average line */}
            {chartData.length > 0 && (() => {
              const maxScore = Math.max(...chartData.map(d => d.score), 1);
              const total = chartData.reduce((s, d) => s + d.score, 0);
              const avg = total / chartData.length;
              const topPercent = 100 - (avg / maxScore) * 100;
              return (
                <div
                  className="absolute left-0 right-0 border-t border-dashed border-t-purple-300 z-20 pointer-events-none"
                  style={{ top: `${Math.min(100, Math.max(0, topPercent))}%` }}
                />
              );
            })()}
            
            <div className="relative z-10 h-full flex items-end justify-between gap-1">
              {chartData.map((data, index) => {
                const maxScore = Math.max(...chartData.map(d => d.score), 1);
                const height = maxScore > 0 ? Math.max((data.score / maxScore) * CHART_HEIGHT, 0) : 0;
                const isToday = data.label === 'Today';
                const isHighlighted = selectedDate ? (data.date === selectedDate) : isToday;
                
                // Bar rendered
                const barClass = isHighlighted 
                  ? "w-full rounded-t bg-gradient-to-t from-amber-400 to-yellow-300"
                  : "w-full rounded-t bg-white shadow-lg";
                
                return (
                  <div key={data.date} className="relative h-full flex-1 flex flex-col justify-end items-center overflow-visible">
                    {/* Points label above bar top */}
                    <motion.div 
                      className={`absolute z-20 text-[11px] font-bold pointer-events-none ${isHighlighted ? 'text-amber-300' : 'text-white'}`}
                      style={{ 
                        bottom: Math.min(height + 12, CHART_HEIGHT + TOP_PADDING - 12),
                      }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ 
                        duration: ANIMATION_CONFIG.chartBars.duration / 1000, // Convert to seconds
                        delay: (index * ANIMATION_CONFIG.chartBars.staggerDelay) / 1000, // Convert to seconds
                        ease: ANIMATION_CONFIG.chartBars.easing
                      }}
                    >
                      <AnimatedNumber 
                        value={data.score} 
                        delay={index * ANIMATION_CONFIG.chartBars.staggerDelay}
                      />
                    </motion.div>
                    
                    {/* Bar - now clickable */}
                    <motion.button
                      className={`${barClass} cursor-pointer ${!isHighlighted ? 'hover:opacity-80' : ''} transition-opacity`}
                      initial={{ height: 0 }}
                      animate={{ height: height }}
                      transition={{ 
                        duration: ANIMATION_CONFIG.chartBars.duration / 1000, // Convert to seconds
                        delay: (index * ANIMATION_CONFIG.chartBars.staggerDelay) / 1000, // Convert to seconds
                        ease: ANIMATION_CONFIG.chartBars.easing
                      }}
                      onClick={() => onDateSelect?.(data.date)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Day labels */}
        <div className="flex justify-between mt-2">
          {chartData.map((data, index) => {
            const isToday = data.label === 'Today';
            const isHighlighted = selectedDate ? (data.date === selectedDate) : isToday;
            return (
              <motion.div 
                key={data.date} 
                className="flex-1 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: ANIMATION_CONFIG.chartBars.duration / 1000,
                  delay: index * (ANIMATION_CONFIG.chartBars.staggerDelay / 1000),
                  ease: ANIMATION_CONFIG.chartBars.easing
                }}
              >
                <button
                  onClick={() => onDateSelect?.(data.date)}
                  className={`text-xs cursor-pointer ${
                    isHighlighted 
                      ? 'text-amber-400 font-semibold' 
                      : 'text-white opacity-90 hover:opacity-100'
                  }`}
                >
                  {data.label}
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
