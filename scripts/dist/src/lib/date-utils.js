"use strict";
/**
 * CampusSpace Date & Timezone Utilities
 * All timestamps stored in UTC and displayed in Asia/Kolkata (IST = UTC+5:30)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CAMPUS_TIMEZONE = void 0;
exports.areIntervalsOverlapping = areIntervalsOverlapping;
exports.istToUtcIso = istToUtcIso;
exports.formatIstTime = formatIstTime;
exports.formatIstDate = formatIstDate;
exports.formatIstDateTime = formatIstDateTime;
exports.getTodayIst = getTodayIst;
exports.addDaysToDate = addDaysToDate;
exports.isDateInFutureOrToday = isDateInFutureOrToday;
exports.getCurrentIstTime = getCurrentIstTime;
exports.CAMPUS_TIMEZONE = 'Asia/Kolkata';
/**
 * Checks if two half-open intervals [startA, endA) and [startB, endB) overlap.
 * Adjacent intervals where endA === startB or endB === startA do NOT overlap.
 */
function areIntervalsOverlapping(startA, endA, startB, endB) {
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
function istToUtcIso(dateStr, timeStr) {
    // Construct ISO string with +05:30 offset
    const istString = `${dateStr}T${timeStr}:00+05:30`;
    const dateObj = new Date(istString);
    return dateObj.toISOString();
}
/**
 * Format a UTC ISO date or date string into readable IST time (e.g. 10:30 AM)
 */
function formatIstTime(isoString) {
    try {
        const date = new Date(isoString);
        return new Intl.DateTimeFormat('en-IN', {
            timeZone: exports.CAMPUS_TIMEZONE,
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        }).format(date);
    }
    catch {
        return isoString;
    }
}
/**
 * Format a UTC ISO date or date string into readable IST date (e.g. 12 Oct 2026)
 */
function formatIstDate(isoString) {
    try {
        const date = new Date(isoString);
        return new Intl.DateTimeFormat('en-IN', {
            timeZone: exports.CAMPUS_TIMEZONE,
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        }).format(date);
    }
    catch {
        return isoString;
    }
}
/**
 * Format full date & time (e.g. 12 Oct 2026, 04:00 PM IST)
 */
function formatIstDateTime(isoString) {
    try {
        const date = new Date(isoString);
        const datePart = formatIstDate(isoString);
        const timePart = formatIstTime(isoString);
        return `${datePart}, ${timePart} IST`;
    }
    catch {
        return isoString;
    }
}
/**
 * Get current date string in IST format YYYY-MM-DD
 */
function getTodayIst() {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: exports.CAMPUS_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
    return formatter.format(now);
}
/**
 * Add days to YYYY-MM-DD string
 */
function addDaysToDate(dateStr, days) {
    const d = new Date(dateStr + 'T00:00:00+05:30');
    d.setDate(d.getDate() + days);
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: exports.CAMPUS_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
    return formatter.format(d);
}
/**
 * Check if date string YYYY-MM-DD is today or in the future
 */
function isDateInFutureOrToday(dateStr) {
    const today = getTodayIst();
    return dateStr >= today;
}
/**
 * Get current time in HH:MM format in Asia/Kolkata (IST)
 */
function getCurrentIstTime() {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: exports.CAMPUS_TIMEZONE,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
    return formatter.format(now);
}
