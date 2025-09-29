'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { generateClient } from "aws-amplify/data";
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
}

interface ChartData {
  date: string;
  score: number;
  label: string;
}

export default function WeeklyChart({ 
  todayScore, 
  userTimezone = 'America/Los_Angeles', 
  selectedDate,
  shouldAnimate = false 
}: WeeklyChartProps) {
          const [chartData, setChartData] = useState<ChartData[]>([]);
          const [isLoading, setIsLoading] = useState(true);
          const [isFetching, setIsFetching] = useState(false);

  const CHART_HEIGHT = 180;
  const TOP_PADDING = 40;

  // Get date in timezone
  const getDateInTimezone = (daysBack: number, timezone: string) => {
    const date = new Date();
    date.setDate(date.getDate() - daysBack);
    return date.toISOString().split('T')[0];
  };

  // Fetch historical data for the past 7 days
  const fetchHistoricalData = async () => {
    if (isFetching) {
      console.log('WeeklyChart: fetch already in progress, skipping');
      return;
    }
    
    console.log('WeeklyChart: fetchHistoricalData called');
    setIsFetching(true);
    setIsLoading(true);
    try {
      const dates: string[] = [];
      for (let i = 6; i >= 0; i--) {
        dates.push(getDateInTimezone(i, userTimezone));
      }
      console.log('WeeklyChart: fetching data for dates:', dates);

      // Fetch daily logs for all dates
      const { data: logs } = await client.models.DailyLog.list();
      console.log('WeeklyChart: fetched logs:', logs);
      
      // Group logs by date and calculate scores
      const logsByDate: Record<string, number> = {};
      logs?.forEach(log => {
        if (dates.includes(log.date)) {
          logsByDate[log.date] = (logsByDate[log.date] || 0) + (log.points || 0);
        }
      });
      console.log('WeeklyChart: logsByDate:', logsByDate);

      // Create chart data
      const historicalData: ChartData[] = dates.slice(0, -1).map(date => ({
        date,
        score: logsByDate[date] || 0,
        label: new Date(date).toLocaleDateString('en-US', { weekday: 'short' })
      }));

      // Add today's data
      const todayData: ChartData = {
        date: dates[dates.length - 1],
        score: todayScore,
        label: 'Today'
      };

              const combined = [...historicalData, todayData];
              console.log('WeeklyChart: final chart data:', combined);
              setChartData(combined);
    } catch (error) {
      console.error('Failed to fetch historical data:', error);
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchHistoricalData();
  }, [userTimezone, todayScore]);

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
                
                console.log(`WeeklyChart: Bar ${index} - ${data.label} - score: ${data.score}, height: ${height}px, maxScore: ${maxScore}`);
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
                        duration: 0.6,
                        delay: index * 0.06,
                        ease: "easeInOut"
                      }}
                    >
                      {data.score}
                    </motion.div>
                    
                    {/* Bar */}
                    <motion.div
                      className={barClass}
                      initial={{ height: 0 }}
                      animate={{ height: height }}
                      transition={{ 
                        duration: 0.6,
                        delay: index * 0.06,
                        ease: "easeInOut"
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Day labels */}
        <div className="flex justify-between mt-2">
          {chartData.map((data) => {
            const isToday = data.label === 'Today';
            const isHighlighted = selectedDate ? (data.date === selectedDate) : isToday;
            return (
              <div key={data.date} className="flex-1 text-center">
                <div className={`text-xs ${isHighlighted ? 'text-amber-300 font-medium' : 'text-white opacity-90'}`}>
                  {data.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
