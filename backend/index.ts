/**
 * CampusSpace Backend Module Entry Point
 * Re-exports server-side business logic, security engines, and API services for judges & modular consumers.
 */

import * as approvalMatrix from '../src/lib/approval-matrix';
import * as emailService from '../src/lib/email-service';
import * as operatingHours from '../src/lib/operating-hours';
import * as dateUtils from '../src/lib/date-utils';
import * as types from '../src/lib/types';

export { approvalMatrix, emailService, operatingHours, dateUtils, types };
export * from '../src/lib/types';
export {
  areIntervalsOverlapping,
  istToUtcIso,
  getTodayIst,
} from '../src/lib/date-utils';
export {
  getRequiredApprovalRoute,
  createApprovalStepsForBooking,
  evaluateBookingStatus,
  isBookingActive,
  getUserActiveBooking,
} from '../src/lib/approval-matrix';
export {
  createAdminLoginChallenge,
  verifyAdminChallenge,
  resendAdminBothCodes,
} from '../src/lib/email-service';
