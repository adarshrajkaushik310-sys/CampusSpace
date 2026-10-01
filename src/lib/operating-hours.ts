import { CAMPUS_TIMEZONE, getTodayIst, getCurrentIstTime } from './date-utils';

export interface OperatingHoursConfig {
  earliestStart: string; // '09:00'
  latestEnd: string;     // '19:00', '20:00', '16:20'
  display: string;       // '9:00 AM – 7:00 PM'
  earliestDisplay: string;
  latestDisplay: string;
}

export type FacilityCategoryKey =
  | 'auditorium'
  | 'seminar_hall'
  | 'smart_classroom'
  | 'labs'
  | 'sports_ground';

export type LabSubcategoryKey =
  | 'computer_lab'
  | 'chemistry_lab'
  | 'physics_lab';

export type FacilityHoursKey =
  | 'auditorium'
  | 'seminar_hall'
  | 'smart_classroom'
  | 'computer_lab'
  | 'chemistry_lab'
  | 'physics_lab'
  | 'sports_ground';

export const OPERATING_HOURS_TABLE: Record<FacilityHoursKey, OperatingHoursConfig> = {
  auditorium: {
    earliestStart: '09:00',
    latestEnd: '19:00',
    display: '9:00 AM – 7:00 PM',
    earliestDisplay: '9:00 AM',
    latestDisplay: '7:00 PM',
  },
  seminar_hall: {
    earliestStart: '09:00',
    latestEnd: '20:00',
    display: '9:00 AM – 8:00 PM',
    earliestDisplay: '9:00 AM',
    latestDisplay: '8:00 PM',
  },
  smart_classroom: {
    earliestStart: '09:00',
    latestEnd: '16:20',
    display: '9:00 AM – 4:20 PM',
    earliestDisplay: '9:00 AM',
    latestDisplay: '4:20 PM',
  },
  computer_lab: {
    earliestStart: '09:00',
    latestEnd: '16:20',
    display: '9:00 AM – 4:20 PM',
    earliestDisplay: '9:00 AM',
    latestDisplay: '4:20 PM',
  },
  chemistry_lab: {
    earliestStart: '09:00',
    latestEnd: '16:20',
    display: '9:00 AM – 4:20 PM',
    earliestDisplay: '9:00 AM',
    latestDisplay: '4:20 PM',
  },
  physics_lab: {
    earliestStart: '09:00',
    latestEnd: '16:20',
    display: '9:00 AM – 4:20 PM',
    earliestDisplay: '9:00 AM',
    latestDisplay: '4:20 PM',
  },
  sports_ground: {
    earliestStart: '09:00',
    latestEnd: '20:00',
    display: '9:00 AM – 8:00 PM',
    earliestDisplay: '9:00 AM',
    latestDisplay: '8:00 PM',
  },
};

/**
 * Normalizes any facility type, category, or facility object to a FacilityHoursKey
 */
export function resolveOperatingHoursKey(facilityTypeOrCategory: string): FacilityHoursKey {
  const norm = facilityTypeOrCategory.toLowerCase().trim();
  if (norm === 'auditorium') return 'auditorium';
  if (norm === 'seminar_hall' || norm === 'seminar hall') return 'seminar_hall';
  if (norm === 'smart_classroom' || norm === 'smart projection classroom' || norm === 'classroom') {
    return 'smart_classroom';
  }
  if (norm === 'computer_lab' || norm === 'computer lab' || norm === 'computing_lab') {
    return 'computer_lab';
  }
  if (norm === 'chemistry_lab' || norm === 'chemistry lab') return 'chemistry_lab';
  if (norm === 'physics_lab' || norm === 'physics lab') return 'physics_lab';
  if (norm === 'sports_ground' || norm === 'sports ground' || norm === 'sports') return 'sports_ground';
  
  // Labs default to 4:20 PM
  if (norm === 'labs' || norm === 'lab') return 'computer_lab';

  return 'auditorium';
}

/**
 * Gets operating hours configuration for a given facility key or type
 */
export function getOperatingHours(facilityTypeOrCategory: string): OperatingHoursConfig {
  const key = resolveOperatingHoursKey(facilityTypeOrCategory);
  return OPERATING_HOURS_TABLE[key];
}

export interface BookingValidationResult {
  isValid: boolean;
  errors: {
    reason?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
    operatingHours?: string;
    general?: string;
  };
}

/**
 * Shared validation logic for both client form and backend submission
 */
export function validateBookingFormAndHours(params: {
  facilityTypeOrKey: string;
  facilityName?: string;
  reason: string;
  date: string;
  startTime: string;
  endTime: string;
}): BookingValidationResult {
  const errors: BookingValidationResult['errors'] = {};
  const config = getOperatingHours(params.facilityTypeOrKey);
  const facilityLabel = params.facilityName || 'This facility';

  // 1. Reason validation (meaningful, non-whitespace)
  if (!params.reason || !params.reason.trim()) {
    errors.reason = 'Reason / purpose of booking is required.';
  } else if (params.reason.trim().length < 3) {
    errors.reason = 'Reason must be at least 3 characters of meaningful text.';
  }

  // 2. Date validation (required, not past in Asia/Kolkata)
  const today = getTodayIst();
  if (!params.date) {
    errors.date = 'Reservation date is required.';
  } else if (params.date < today) {
    errors.date = 'Bookings cannot be scheduled for past dates.';
  }

  // 3. Time presence and ordering
  if (!params.startTime) {
    errors.startTime = 'Start time is required.';
  }
  if (!params.endTime) {
    errors.endTime = 'End time is required.';
  }

  if (params.startTime && params.endTime) {
    if (params.startTime >= params.endTime) {
      errors.endTime = 'End time must be strictly after start time.';
    }

    // 4. Past time on today check (Asia/Kolkata)
    if (params.date === today) {
      const currentIst = getCurrentIstTime();
      if (params.startTime < currentIst) {
        errors.startTime = `Start time (${params.startTime}) has already passed today (current campus time: ${currentIst} IST).`;
      }
    }

    // 5. Operating hours interval check
    // Allow start exactly at opening or end exactly at closing
    if (params.startTime < config.earliestStart) {
      errors.startTime = `Start time cannot be earlier than opening time (${config.earliestDisplay}). Operating hours: ${config.display}.`;
    }

    if (params.endTime > config.latestEnd) {
      errors.endTime = `End time cannot exceed closing time (${config.latestDisplay}). Operating hours: ${config.display}.`;
    }

    if (params.startTime < config.earliestStart || params.endTime > config.latestEnd) {
      errors.operatingHours = `${facilityLabel} operates strictly from ${config.display}. Requested interval (${params.startTime} - ${params.endTime}) falls outside allowable operating hours.`;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
