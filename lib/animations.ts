/**
 * Centralized animation configuration for consistent timing across the app
 */

export const ANIMATION_CONFIG = {
  // Card flip animations (for DailyActionTracker and FlippableScoreChart)
  cardFlip: {
    duration: 500, // 500ms
    easing: 'ease-in-out'
  },
  
  // Chart bar animations (for WeeklyChart)
  chartBars: {
    duration: 500, // 500ms - matching card flip speed
    easing: 'easeInOut',
    staggerDelay: 60 // 60ms delay between each bar
  },
  
  // Score change animations
  scoreChange: {
    duration: 800, // 800ms for smooth number transitions
    easing: 'easeOutCubic'
  },
  
  // Quick interactions (buttons, hovers)
  quick: {
    duration: 150,
    easing: 'ease-out'
  },
  
  // Standard transitions
  standard: {
    duration: 300,
    easing: 'ease-in-out'
  }
} as const;

// Tailwind CSS classes for common animations
export const ANIMATION_CLASSES = {
  cardFlip: `transition-transform duration-${ANIMATION_CONFIG.cardFlip.duration} ${ANIMATION_CONFIG.cardFlip.easing}`,
  quick: `transition-all duration-${ANIMATION_CONFIG.quick.duration} ${ANIMATION_CONFIG.quick.easing}`,
  standard: `transition-colors duration-${ANIMATION_CONFIG.standard.duration} ${ANIMATION_CONFIG.standard.easing}`
} as const;
