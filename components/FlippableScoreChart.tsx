'use client';

import { useState, useEffect, useRef } from 'react';
import WeeklyChart from './WeeklyChart';

interface ScoreSummary {
  currentScore: number;
  difference: number;
  actionCounts: {
    encourage?: { completed?: number };
    avoid?: { completed?: number };
  };
  todayScore: number;
}

interface FlippableScoreChartProps {
  scoreSummary: ScoreSummary;
  userTimezone?: string;
  selectedDate?: string;
  refreshTrigger?: number;
  previousScore?: number | null;
  animationTrigger?: number;
}

export default function FlippableScoreChart({ 
  scoreSummary, 
  userTimezone = 'America/Los_Angeles', 
  selectedDate,
  refreshTrigger = 0,
  previousScore,
  animationTrigger = 0
}: FlippableScoreChartProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [animatedScore, setAnimatedScore] = useState(scoreSummary.currentScore);
  const [animatedDifference, setAnimatedDifference] = useState(scoreSummary.difference);
  const [didFrontChartGrow, setDidFrontChartGrow] = useState(false);
  const frontRef = useRef<HTMLDivElement>(null);

  // Animate score changes smoothly
  useEffect(() => {
    if (animationTrigger > 0 && previousScore !== null && previousScore !== scoreSummary.currentScore) {
      console.log('FlippableScoreChart - Animating score change:', {
        previousScore,
        currentScore: scoreSummary.currentScore,
        animationTrigger
      });
      
      const duration = 800; // Animation duration in ms
      const startTime = Date.now();
      const startScore = previousScore || 0;
      const endScore = scoreSummary.currentScore;
      const scoreDifference = endScore - startScore;
      const startDiffValue = animatedDifference;
      const endDiffValue = scoreSummary.difference;
      const diffDifference = endDiffValue - startDiffValue;
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Use easeOutCubic for smooth animation
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        const currentScore = startScore + (scoreDifference * easedProgress);
        const currentDiff = startDiffValue + (diffDifference * easedProgress);
        
        setAnimatedScore(Math.round(currentScore));
        setAnimatedDifference(Math.round(currentDiff));
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setAnimatedScore(endScore);
          setAnimatedDifference(endDiffValue);
        }
      };
      
      requestAnimationFrame(animate);
    } else {
      // No animation needed, just set the current values
      setAnimatedScore(scoreSummary.currentScore);
      setAnimatedDifference(scoreSummary.difference);
    }
  }, [scoreSummary.currentScore, scoreSummary.difference, animationTrigger, previousScore]);

  // Trigger front chart animation when data is available
  useEffect(() => {
    if (!didFrontChartGrow) {
      setDidFrontChartGrow(true);
    }
  }, [scoreSummary, userTimezone]);

  const toggleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="relative w-full">
      {/* Flip indicator */}
      <div className="absolute top-3 right-3 z-10">
        <button
          onClick={toggleFlip}
          className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
          title="Flip to see weekly comparison"
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* 3D Flip Container */}
      <div 
        className="relative w-full h-full"
        style={{ 
          perspective: '1000px',
          transformStyle: 'preserve-3d'
        }}
      >
        <div
          className="relative w-full h-full transition-transform duration-600 ease-in-out"
          style={{ 
            transform: isFlipped ? 'rotateX(180deg)' : 'rotateX(0deg)',
            transformStyle: 'preserve-3d'
          }}
        >
          {/* Front Side - Score Card with Weekly Chart */}
          <div
            ref={frontRef}
            className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-lg p-6 text-white"
            style={{ 
              backfaceVisibility: 'hidden',
              transform: 'rotateX(0deg)'
            }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Kinisi Score - Left Side */}
              <div className="lg:col-span-1">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span 
                        className="text-6xl font-bold transition-all duration-300"
                        style={{
                          transform: animatedScore !== scoreSummary.currentScore ? 'scale(1.1)' : 'scale(1)'
                        }}
                      >
                        {animatedScore}
                      </span>
                      <div className="bg-opacity-20 rounded-lg p-1.5">
                        <svg className="w-5 h-5 text-green-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                    </div>
                    {(() => {
                      if (animatedDifference > 0) {
                        return (
                          <p className="text-yellow-300 text-shadow-md text-md font-semibold mt-1">
                            +{Math.round(animatedDifference)} pts vs prior
                          </p>
                        );
                      } else if (animatedDifference < 0) {
                        return (
                          <p className="text-pink-100 text-shadow-md text-md mt-1">
                            {Math.round(animatedDifference)} pts vs prior
                          </p>
                        );
                      } else {
                        return <p className="text-indigo-200 text-shadow-md text-md mt-1">Same as prior</p>;
                      }
                    })()}
                    <p className="text-indigo-200 text-md text-shadow-md mt-1">
                      {((scoreSummary.actionCounts.encourage?.completed || 0) + (scoreSummary.actionCounts.avoid?.completed || 0))} actions
                    </p>
                  </div>
                </div>
              </div>

              {/* 7-Day Chart - Right Side */}
              <div className="lg:col-span-3">
                <WeeklyChart 
                  todayScore={scoreSummary.todayScore} 
                  userTimezone={userTimezone} 
                  selectedDate={selectedDate}
                  shouldAnimate={didFrontChartGrow}
                />
              </div>
            </div>
          </div>

          {/* Back Side - Weekly Comparison */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-lg p-6 text-white overflow-hidden"
            style={{ 
              backfaceVisibility: 'hidden',
              transform: 'rotateX(180deg)'
            }}
          >
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Weekly Comparison</h3>
                <button
                  onClick={toggleFlip}
                  className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                  title="Flip back to score view"
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
              
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">Weekly Analysis</h4>
                  <p className="text-sm text-blue-100 mb-4">
                    Compare your performance across the week
                  </p>
                  <div className="text-xs text-blue-200">
                    <p>• Track daily progress trends</p>
                    <p>• Identify your most productive days</p>
                    <p>• Set weekly goals and targets</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
