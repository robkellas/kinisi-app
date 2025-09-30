/**
 * Date utility functions for consistent timezone handling
 */

/**
 * Get a date string in YYYY-MM-DD format for a specific timezone
 * @param dateOffset - Number of days to offset from today (0 = today, 1 = yesterday, etc.)
 * @param timezone - Timezone string (e.g., 'America/Los_Angeles')
 * @returns Date string in YYYY-MM-DD format
 */
export function getDateInTimezone(dateOffset: number = 0, timezone: string = 'America/Los_Angeles'): string {
  const now = new Date();
  
  // Get the current date in the specified timezone using Intl.DateTimeFormat
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  const parts = formatter.formatToParts(now);
  const year = parts.find(part => part.type === 'year')?.value;
  const month = parts.find(part => part.type === 'month')?.value;
  const day = parts.find(part => part.type === 'day')?.value;
  
  // Create date string in YYYY-MM-DD format
  const dateString = `${year}-${month}-${day}`;
  
  // Apply the offset by creating a new date and subtracting days
  const date = new Date(dateString + 'T00:00:00');
  date.setDate(date.getDate() - dateOffset);
  
  // Return in YYYY-MM-DD format
  return date.toISOString().split('T')[0];
}

/**
 * Get today's date string in YYYY-MM-DD format for a specific timezone
 * @param timezone - Timezone string (e.g., 'America/Los_Angeles')
 * @returns Date string in YYYY-MM-DD format
 */
export function getTodayInTimezone(timezone: string = 'America/Los_Angeles'): string {
  return getDateInTimezone(0, timezone);
}

/**
 * Get yesterday's date string in YYYY-MM-DD format for a specific timezone
 * @param timezone - Timezone string (e.g., 'America/Los_Angeles')
 * @returns Date string in YYYY-MM-DD format
 */
export function getYesterdayInTimezone(timezone: string = 'America/Los_Angeles'): string {
  return getDateInTimezone(1, timezone);
}

/**
 * Get the last N days of date strings for a specific timezone
 * @param days - Number of days to get (default 7)
 * @param timezone - Timezone string (e.g., 'America/Los_Angeles')
 * @returns Array of date strings in YYYY-MM-DD format
 */
export function getLastNDays(days: number = 7, timezone: string = 'America/Los_Angeles'): string[] {
  const dates: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    dates.push(getDateInTimezone(i, timezone));
  }
  return dates;
}

/**
 * Get a weekday label for a date string
 * @param dateString - Date string in YYYY-MM-DD format
 * @param timezone - Timezone string (e.g., 'America/Los_Angeles')
 * @returns Weekday label (e.g., 'Mon', 'Tue', 'Today')
 */
export function getWeekdayLabel(dateString: string, timezone: string = 'America/Los_Angeles'): string {
  const today = getTodayInTimezone(timezone);
  
  if (dateString === today) {
    return 'Today';
  }
  
  // Create a date object from the date string
  const date = new Date(dateString + 'T00:00:00');
  
  // Get the weekday in the specified timezone
  return date.toLocaleDateString('en-US', { 
    weekday: 'short',
    timeZone: timezone
  });
}

/**
 * Hook to get timezone-aware date functions
 * This should be used in components that have access to the TimezoneContext
 */
export function useTimezoneAwareDates(timezone: string) {
  return {
    getToday: () => getTodayInTimezone(timezone),
    getDate: (offset: number) => getDateInTimezone(offset, timezone),
    getYesterday: () => getYesterdayInTimezone(timezone),
    getLastNDays: (days: number) => getLastNDays(days, timezone),
    getWeekdayLabel: (dateString: string) => getWeekdayLabel(dateString, timezone),
  };
}
