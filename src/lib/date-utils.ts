/**
 * CampusSpace Date & Timezone Utilities
 * All timestamps stored in UTC and displayed in Asia/Kolkata (IST = UTC+5:30)
 */

export const CAMPUS_TIMEZONE = 'Asia/Kolkata';

/**
 * Checks if two half-open intervals [startA, endA) and [startB, endB) overlap.
 * Adjacent intervals where endA === startB or endB === startA do NOT overlap.
 */
export function areIntervalsOverlapping(
  startA: Date | string | number,
  endA: Date | string | number,
  startB: Date | string | number,
  endB: Date | string | number
): boolean {
  const sA = new Date(startA).getTime();
  const eA = new Date(endA).getTime();
  const sB = new Date(startB).getTime();
  const eB = new Date(endB).getTime();

  return Math.max(sA, sB) < Math.min(eA, eB);
}

/**
 * Converts a date string (YYYY-MM-DD) and local time (HH:MM in IST) to a UTC ISO string.
 * Asia/Kolkata is fixed offset UTC+05:30.
 */
export function istToUtcIso(dateStr: string, timeStr: string): string {
  // Construct ISO string with +05:30 offset
  const istString = `${dateStr}T${timeStr}:00+05:30`;
  const dateObj = new Date(istString);
  return dateObj.toISOString();
}

/**
 * Format a UTC ISO date or date string into readable IST time (e.g. 10:30 AM)
 */
export function formatIstTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: CAMPUS_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch {
    return isoString;
  }
}

/**
 * Format a UTC ISO date or date string into readable IST date (e.g. 12 Oct 2026)
 */
export function formatIstDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: CAMPUS_TIMEZONE,
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return isoString;
  }
}

/**
 * Format full date & time (e.g. 12 Oct 2026, 04:00 PM IST)
 */
export function formatIstDateTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const datePart = formatIstDate(isoString);
    const timePart = formatIstTime(isoString);
    return `${datePart}, ${timePart} IST`;
  } catch {
    return isoString;
  }
}

/**
 * Get current date string in IST format YYYY-MM-DD
 */
export function getTodayIst(): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: CAMPUS_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(now);
}

/**
 * Add days to YYYY-MM-DD string
 */
export function addDaysToDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00+05:30');
  d.setDate(d.getDate() + days);
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: CAMPUS_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(d);
}

/**
 * Check if date string YYYY-MM-DD is today or in the future
 */
export function isDateInFutureOrToday(dateStr: string): boolean {
  const today = getTodayIst();
  return dateStr >= today;
}

/**
 * Get current time in HH:MM format in Asia/Kolkata (IST)
 */
export function getCurrentIstTime(): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: CAMPUS_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return formatter.format(now);
}

