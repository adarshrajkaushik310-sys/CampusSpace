import { Facility, FacilityCategoryKey, LabSubcategoryKey, Booking, ApprovalStep, Role, BookingStatus, DemoUser } from './types';
import { areIntervalsOverlapping, istToUtcIso } from './date-utils';

/**
 * Standard Approval Matrix Facility Category Classification
 */
export function getFacilityCategory(facility: Facility): FacilityCategoryKey {
  if (facility.category) return facility.category;

  if (facility.type === 'auditorium') return 'auditorium';
  if (facility.type === 'seminar_hall') return 'seminar_hall';
  if (facility.type === 'smart_classroom') return 'smart_classroom';
  if (facility.type === 'sports_ground') return 'sports_ground';
  if (
    facility.type === 'computer_lab' ||
    facility.type === 'computing_lab' ||
    facility.type === 'chemistry_lab' ||
    facility.type === 'physics_lab' ||
    facility.type === 'innovation_hub'
  ) {
    return 'labs';
  }
  return 'auditorium';
}

export function getFacilityLabType(facility: Facility): LabSubcategoryKey | null {
  if (facility.labType) return facility.labType;
  if (facility.type === 'computer_lab' || facility.type === 'computing_lab') return 'computer_lab';
  if (facility.type === 'chemistry_lab') return 'chemistry_lab';
  if (facility.type === 'physics_lab') return 'physics_lab';
  return null;
}

export interface RouteSpecification {
  isLab: boolean;
  facilityCategory: FacilityCategoryKey;
  labType: LabSubcategoryKey | null;
  requiredRoles: Role[];
  department?: string;
  assignedHodEmail?: string;
  assignedHodName?: string;
  routingError?: string;
}

/**
 * Department configuration map for laboratory facilities.
 * Computer Lab -> Computer Science & Engineering (Prof. Meenakshi Sundaram)
 * Chemistry Lab -> Chemistry & Chemical Sciences (Dr. Savita Ramanathan)
 * Physics Lab -> Physics & Applied Sciences (Dr. Harish Chandra)
 */
export const LAB_DEPARTMENT_ROUTING: Record<LabSubcategoryKey, { department: string; hodEmail: string; hodName: string }> = {
  computer_lab: {
    department: 'Computer Science & Engineering',
    hodEmail: 'hod.cse@campus.edu',
    hodName: 'Prof. Meenakshi Sundaram',
  },
  chemistry_lab: {
    department: 'Chemistry & Chemical Sciences',
    hodEmail: 'hod.chem@campus.edu',
    hodName: 'Dr. Savita Ramanathan',
  },
  physics_lab: {
    department: 'Physics & Applied Sciences',
    hodEmail: 'hod.physics@campus.edu',
    hodName: 'Dr. Harish Chandra',
  },
};

/**
 * Derives the exact approval route according to institutional governance:
 * - Non-lab (Auditorium, Seminar Hall, Smart Classroom, Sports Ground): Principal AND Registrar
 * - Labs (Computer Lab, Chemistry Lab, Physics Lab): Assigned HOD only
 */
export function getRequiredApprovalRoute(
  facility: Facility,
  knownUsers?: DemoUser[]
): RouteSpecification {
  const category = getFacilityCategory(facility);
  const labType = getFacilityLabType(facility);

  if (category === 'labs') {
    if (!labType || !LAB_DEPARTMENT_ROUTING[labType]) {
      return {
        isLab: true,
        facilityCategory: category,
        labType: labType || null,
        requiredRoles: ['hod'],
        routingError: 'Routing Error: No responsible Head of Department (HOD) is configured for this laboratory.',
      };
    }

    const labConfig = LAB_DEPARTMENT_ROUTING[labType];
    // If knownUsers is provided, verify a responsible HOD exists for this lab's department
    if (knownUsers !== undefined) {
      const matchedHod = knownUsers.find(
        (u) =>
          u.role === 'hod' &&
          (u.department?.toLowerCase().trim() === (facility.department || labConfig.department).toLowerCase().trim() ||
            u.email?.toLowerCase().trim() === labConfig.hodEmail.toLowerCase().trim())
      );

      if (!matchedHod) {
        return {
          isLab: true,
          facilityCategory: category,
          labType,
          requiredRoles: ['hod'],
          department: facility.department || labConfig.department,
          routingError: `Routing Error: No responsible Head of Department (HOD) is configured for ${facility.department || labConfig.department}.`,
        };
      }

      return {
        isLab: true,
        facilityCategory: category,
        labType,
        requiredRoles: ['hod'],
        department: facility.department || labConfig.department,
        assignedHodEmail: matchedHod.email,
        assignedHodName: matchedHod.name,
      };
    }

    return {
      isLab: true,
      facilityCategory: category,
      labType,
      requiredRoles: ['hod'],
      department: facility.department || labConfig.department,
      assignedHodEmail: labConfig.hodEmail,
      assignedHodName: labConfig.hodName,
    };
  }

  // Non-lab facilities require Principal AND Registrar
  return {
    isLab: false,
    facilityCategory: category,
    labType: null,
    requiredRoles: ['principal', 'registrar'],
  };
}

/**
 * Initializes approval steps for a newly created booking based on the route specification.
 */
export function createApprovalStepsForBooking(
  bookingId: string,
  route: RouteSpecification
): ApprovalStep[] {
  if (route.isLab) {
    if (route.routingError) {
      return [
        {
          id: `step_hod_${Date.now()}`,
          bookingId,
          stage: 'hod',
          stageName: 'Head of Department (Routing Error)',
          approverRole: 'hod',
          decision: 'pending',
          comments: route.routingError,
        },
      ];
    }

    return [
      {
        id: `step_hod_${Date.now()}`,
        bookingId,
        stage: 'hod',
        stageName: `Head of Department (${route.department || 'Assigned'})`,
        approverRole: 'hod',
        approverName: route.assignedHodName,
        approverDepartment: route.department,
        decision: 'pending',
      },
    ];
  }

  // Non-lab: Principal AND Registrar
  return [
    {
      id: `step_princ_${Date.now()}`,
      bookingId,
      stage: 'principal',
      stageName: 'Principal',
      approverRole: 'principal',
      decision: 'pending',
    },
    {
      id: `step_reg_${Date.now()}`,
      bookingId,
      stage: 'registrar',
      stageName: 'Registrar',
      approverRole: 'registrar',
      decision: 'pending',
    },
  ];
}

export interface DetailedStatusResult {
  overallStatus: BookingStatus;
  statusHeadline: string;
  statusDescription: string;
  isReadyForHallPass: boolean;
  principalDecision?: 'pending' | 'approved' | 'rejected';
  registrarDecision?: 'pending' | 'approved' | 'rejected';
  hodDecision?: 'pending' | 'approved' | 'rejected';
  outstandingApprover?: 'Principal' | 'Registrar' | 'Principal & Registrar' | 'HOD' | null;
  rejectionReason?: string;
  routingError?: string;
}

/**
 * Evaluates the status of a booking given its approval steps and facility type.
 * Also factors in time expiration for approved bookings (completed).
 */
export function evaluateBookingStatus(
  booking: Booking,
  nowMs: number = Date.now()
): DetailedStatusResult {
  // If explicitly cancelled
  if (booking.status === 'cancelled') {
    return {
      overallStatus: 'cancelled',
      statusHeadline: 'Cancelled',
      statusDescription: booking.cancellationReason || 'Booking was cancelled by requester.',
      isReadyForHallPass: false,
    };
  }

  // If explicitly marked completed, or approved and end time has passed
  const endMs = new Date(booking.endUtc).getTime();
  if (booking.status === 'completed' || (booking.status === 'approved' && endMs <= nowMs)) {
    return {
      overallStatus: 'completed',
      statusHeadline: 'Completed',
      statusDescription: 'Facility booking reservation has concluded.',
      isReadyForHallPass: false,
    };
  }

  // Check for routing error
  if (booking.routingError) {
    return {
      overallStatus: 'pending',
      statusHeadline: 'Routing Error',
      statusDescription: booking.routingError,
      isReadyForHallPass: false,
      routingError: booking.routingError,
    };
  }

  const steps = booking.approvalSteps || [];

  // Check for Administrator Override intervention
  const adminOverrideStep = steps.find((s) => s.stage === 'admin_override');
  if (adminOverrideStep) {
    if (adminOverrideStep.decision === 'approved' || booking.status === 'approved') {
      return {
        overallStatus: 'approved',
        statusHeadline: 'Approved via Admin Override',
        statusDescription: adminOverrideStep.comments || 'Sanctioned via Administrator Override. QR Hall Pass active.',
        isReadyForHallPass: true,
      };
    }
    if (adminOverrideStep.decision === 'rejected' || booking.status === 'rejected') {
      return {
        overallStatus: 'rejected',
        statusHeadline: 'Rejected via Admin Override',
        statusDescription: booking.rejectionReason || adminOverrideStep.comments || 'Declined via Administrator Override.',
        isReadyForHallPass: false,
        rejectionReason: booking.rejectionReason || adminOverrideStep.comments,
      };
    }
  }

  const isLab = booking.facilityCategory === 'labs' || !!booking.labType;

  if (isLab) {
    const hodStep = steps.find((s) => s.stage === 'hod' || s.approverRole === 'hod');
    const hodDecision = hodStep?.decision || 'pending';

    if (hodDecision === 'rejected' || booking.status === 'rejected') {
      return {
        overallStatus: 'rejected',
        statusHeadline: 'Rejected',
        statusDescription: booking.rejectionReason || hodStep?.comments || 'Rejected by assigned Department Head.',
        isReadyForHallPass: false,
        hodDecision: 'rejected',
        rejectionReason: booking.rejectionReason || hodStep?.comments,
      };
    }

    if (hodDecision === 'approved') {
      return {
        overallStatus: 'approved',
        statusHeadline: 'Approved',
        statusDescription: 'Approved by assigned Department Head. QR Hall Pass active.',
        isReadyForHallPass: true,
        hodDecision: 'approved',
      };
    }

    return {
      overallStatus: 'pending',
      statusHeadline: 'Pending approval',
      statusDescription: `Awaiting HOD approval (${booking.department || 'Department'})`,
      isReadyForHallPass: false,
      hodDecision: 'pending',
      outstandingApprover: 'HOD',
    };
  }

  // Non-lab: Principal AND Registrar
  const princStep = steps.find((s) => s.stage === 'principal' || s.approverRole === 'principal');
  const regStep = steps.find((s) => s.stage === 'registrar' || s.approverRole === 'registrar');

  const princDecision = princStep?.decision || 'pending';
  const regDecision = regStep?.decision || 'pending';

  // Either rejection rejects the request
  if (princDecision === 'rejected' || regDecision === 'rejected' || booking.status === 'rejected') {
    const reason =
      booking.rejectionReason ||
      (princDecision === 'rejected' ? princStep?.comments : regStep?.comments) ||
      'Request rejected during institutional review.';

    return {
      overallStatus: 'rejected',
      statusHeadline: 'Rejected',
      statusDescription: reason,
      isReadyForHallPass: false,
      principalDecision: princDecision,
      registrarDecision: regDecision,
      rejectionReason: reason,
    };
  }

  // Both approvals are required for final approval
  if (princDecision === 'approved' && regDecision === 'approved') {
    return {
      overallStatus: 'approved',
      statusHeadline: 'Approved',
      statusDescription: 'Sanctioned by both Principal & Registrar. QR Hall Pass issued.',
      isReadyForHallPass: true,
      principalDecision: 'approved',
      registrarDecision: 'approved',
    };
  }

  // One approved, one pending
  if (princDecision === 'approved' && regDecision === 'pending') {
    return {
      overallStatus: 'pending',
      statusHeadline: 'Pending approval',
      statusDescription: 'Principal: Approved • Registrar: Pending • Awaiting Registrar approval',
      isReadyForHallPass: false,
      principalDecision: 'approved',
      registrarDecision: 'pending',
      outstandingApprover: 'Registrar',
    };
  }

  if (regDecision === 'approved' && princDecision === 'pending') {
    return {
      overallStatus: 'pending',
      statusHeadline: 'Pending approval',
      statusDescription: 'Registrar: Approved • Principal: Pending • Awaiting Principal approval',
      isReadyForHallPass: false,
      principalDecision: 'pending',
      registrarDecision: 'approved',
      outstandingApprover: 'Principal',
    };
  }

  // Both pending
  return {
    overallStatus: 'pending',
    statusHeadline: 'Pending approval',
    statusDescription: 'Principal: Pending • Registrar: Pending • Awaiting Principal and Registrar approval',
    isReadyForHallPass: false,
    principalDecision: 'pending',
    registrarDecision: 'pending',
    outstandingApprover: 'Principal & Registrar',
  };
}

/**
 * Checks whether a booking is considered ACTIVE per policy:
 * An active request is:
 * - Pending approval; or
 * - Approved and its booked end time has not yet passed.
 *
 * Rejected, cancelled, and completed requests do NOT count as active.
 */
export function isBookingActive(booking: Booking, nowMs: number = Date.now()): boolean {
  if (booking.status === 'rejected' || booking.status === 'cancelled' || booking.status === 'completed') {
    return false;
  }

  if (booking.status === 'pending') {
    return true;
  }

  if (booking.status === 'approved') {
    const endMs = new Date(booking.endUtc).getTime();
    return endMs > nowMs;
  }

  return false;
}

/**
 * Finds the currently active booking for a given user ID across all facility categories.
 * Enforces: "A person may have only one active booking request across all facility categories."
 */
export function getUserActiveBooking(
  param1: Booking[] | string,
  param2: string | Booking[],
  nowMs: number = Date.now()
): Booking | undefined {
  const bookings = Array.isArray(param1) ? param1 : Array.isArray(param2) ? param2 : [];
  const userId = typeof param1 === 'string' ? param1 : typeof param2 === 'string' ? param2 : '';

  if (!userId || !bookings.length) return undefined;

  return bookings.find((b) => {
    // Match by authenticated requester ID
    if (b.requesterId !== userId) return false;
    return isBookingActive(b, nowMs);
  });
}

/**
 * Conflict check helper returning the exact required error message:
 * "This facility is unavailable during your selected time. Please choose another time or facility."
 */
export const FACILITY_UNAVAILABLE_MESSAGE =
  'This facility is unavailable during your selected time. Please choose another time or facility.';

export const ACTIVE_REQUEST_BLOCKED_MESSAGE =
  'You already have an active request. You can submit another after it is rejected, cancelled, or completed.';

/**
 * Checks whether a booking is visible and assigned to a specific user.
 * Implements Requirements 4, 5, 6:
 * - Requesters see only their own submitted requests.
 * - Non-lab approvers (Principal & Registrar) see only non-lab requests assigned to them.
 * - Lab approvers (HODs) see only lab requests assigned to their department.
 * - Sharing the same role title does not grant access to another person's assignments.
 * - Retains authorized historical requests after a decision so approvers can review history.
 */
export function isBookingAssignedToUser(booking: Booking, user: DemoUser | null): boolean {
  if (!user) return false;

  // System Administrators: Equal, system-wide authority across all facility requests
  if (user.role === 'admin') {
    return true;
  }

  const isOwner: boolean = Boolean(
    (booking.requesterId && user.id && booking.requesterId === user.id) ||
    (booking.requesterEmail && user.email && booking.requesterEmail.toLowerCase().trim() === user.email.toLowerCase().trim())
  );

  // Non-lab approvers: Principal & Registrar
  if (user.role === 'principal' || user.role === 'registrar') {
    const isLab = booking.facilityCategory === 'labs' || Boolean(booking.labType);
    return isOwner || !isLab;
  }

  // Lab approver: Responsible HOD only
  if (user.role === 'hod') {
    const isLab = booking.facilityCategory === 'labs' || Boolean(booking.labType);
    if (!isLab) return isOwner;

    const userDept = user.department?.toLowerCase().trim();
    const userEmail = user.email?.toLowerCase().trim();

    // Check direct booking department
    const bookingDept = booking.department?.toLowerCase().trim();
    if (userDept && bookingDept && userDept === bookingDept) {
      return true;
    }

    // Check approval step department or assigned approver
    const hodStep = booking.approvalSteps?.find((s) => s.stage === 'hod');
    if (hodStep) {
      if (userDept && hodStep.approverDepartment && userDept === hodStep.approverDepartment.toLowerCase().trim()) {
        return true;
      }
      if (user.name && hodStep.approverName && user.name.toLowerCase().trim() === hodStep.approverName.toLowerCase().trim()) {
        return true;
      }
    }

    // Check configured lab routing map
    if (booking.labType && LAB_DEPARTMENT_ROUTING[booking.labType]) {
      const config = LAB_DEPARTMENT_ROUTING[booking.labType];
      if (userDept && userDept === config.department.toLowerCase().trim()) {
        return true;
      }
      if (userEmail && userEmail === config.hodEmail.toLowerCase().trim()) {
        return true;
      }
    }

    return isOwner;
  }

  // Club Requesters and other unprivileged roles: strictly their own requests
  return isOwner;
}

/**
 * Filters a list of bookings to only those assigned/visible to the authenticated user.
 */
export function getAuthorizedBookingsForUser(bookings: Booking[], user: DemoUser | null): Booking[] {
  if (!user || !Array.isArray(bookings)) return [];
  return bookings.filter((b) => isBookingAssignedToUser(b, user));
}
