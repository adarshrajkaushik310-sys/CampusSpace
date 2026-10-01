export type Role = 
  | 'requester' 
  | 'secretary' 
  | 'faculty_advisor' 
  | 'hod' 
  | 'estate_manager' 
  | 'security'
  | 'principal'
  | 'registrar'
  | 'admin';

export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export type WorkflowStage = 
  | 'draft'
  | 'secretary_review'
  | 'faculty_review'
  | 'hod_review'
  | 'estate_review'
  | 'admin_override'
  | 'approved'
  | 'rejected'
  | 'cancelled';

export type BookingStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';

export type AvailabilityStatus = 'available' | 'pending' | 'approved' | 'maintenance';

export type FacilityType = 
  | 'auditorium' 
  | 'seminar_hall' 
  | 'smart_classroom' 
  | 'computing_lab' 
  | 'computer_lab'
  | 'chemistry_lab'
  | 'physics_lab'
  | 'sports_ground'
  | 'innovation_hub';

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


export interface Equipment {
  id: string;
  name: string;
  icon: string; // lucide icon name
  category: 'av' | 'computing' | 'climate' | 'power';
}

export interface Facility {
  id: string;
  code: string;
  name: string;
  building: string;
  buildingId: string;
  floor: number;
  type: FacilityType;
  category?: FacilityCategoryKey;
  labType?: LabSubcategoryKey;
  department?: string;
  capacity: number;
  description: string;
  equipment: string[]; // equipment ids
  status: 'operational' | 'maintenance';
  operatingHours?: {
    weekdays: string;
    weekends: string;
  };
  image?: string;
  dimensions?: string;
  coordinates: {
    x: number;
    y: number;
    width: number;
    height: number;
    svgPath?: string;
  };
}

export interface ApprovalStep {
  id: string;
  bookingId: string;
  stage: 'principal' | 'registrar' | 'hod' | 'secretary' | 'faculty_advisor' | 'estate_manager' | string;
  stageName: string;
  approverRole: Role;
  approverName?: string;
  approverDepartment?: string;
  decision: 'pending' | 'approved' | 'rejected';
  comments?: string;
  decidedAt?: string; // ISO string UTC
}

export interface Booking {
  id: string;
  bookingRef: string; // e.g. CS-2026-8821
  facilityId: string;
  facilityName: string;
  facilityCategory?: FacilityCategoryKey;
  labType?: LabSubcategoryKey;
  eventName: string;
  eventDescription: string;
  clubName: string; // Default: 'Coding Club'
  department: string;
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  requesterRole: string;
  attendeeCount: number;
  requestedEquipment: string[]; // equipment ids
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM (Asia/Kolkata)
  endTime: string; // HH:MM (Asia/Kolkata)
  startUtc: string; // ISO UTC
  endUtc: string; // ISO UTC
  currentStage: WorkflowStage;
  status: BookingStatus;
  rejectionReason?: string;
  rejectedByStage?: string;
  rejectedByRole?: Role;
  cancellationReason?: string;
  routingError?: string;
  approvalSteps: ApprovalStep[];
  verificationToken: string; // Unguessable token
  adminOverride?: {
    action: 'approve' | 'reject' | 'cancel';
    adminIdentifier?: 'admin1' | 'admin2' | 'admin';
    performedBy: string;
    timestamp: string;
    reason: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface HallPass {
  bookingId: string;
  bookingRef: string;
  eventName: string;
  clubName: string;
  facilityName: string;
  building: string;
  floor: number;
  date: string;
  startTime: string;
  endTime: string;
  attendeeCount: number;
  verificationToken: string;
  issuedAt: string;
  status: BookingStatus;
}

export interface AuditLog {
  id: string;
  bookingId?: string;
  bookingRef?: string;
  action:
    | 'SUBMITTED'
    | 'APPROVED'
    | 'REJECTED'
    | 'CANCELLED'
    | 'ADMIN_OVERRIDE_APPROVE'
    | 'ADMIN_OVERRIDE_REJECT'
    | 'ADMIN_OVERRIDE_CANCEL'
    | 'ADMIN_LOGIN_CHALLENGE_CREATED'
    | 'ADMIN_LOGIN_SUCCESSFUL'
    | 'ADMIN_LOGIN_FAILED'
    | 'ROLE_UPDATED'
    | 'ACCESS_SUSPENDED'
    | 'ACCESS_RESTORED'
    | 'SCOPE_UPDATED'
    | 'VERIFICATION_APPROVED'
    | 'VERIFICATION_REJECTED'
    | 'FACILITY_STATUS_UPDATED';
  performedBy: string;
  role: Role;
  actorAdmin?: 'admin1' | 'admin2' | 'admin';
  affectedEntity?: string;
  targetId?: string;
  stage?: string;
  reason?: string;
  outcome?: 'SUCCESS' | 'FAILED';
  timestamp: string;
}

export interface DemoUser {
  id: string;
  role: Role;
  name: string;
  title: string;
  claimedName?: string;
  email?: string;
  username?: string;
  department?: string;
  club?: string;
  avatar: string;
  adminIdentifier?: 'admin1' | 'admin2' | 'admin';
  accountStatus?: 'active' | 'suspended';
  requestedRole?: Role;
  verificationStatus?: VerificationStatus;
  rejectionReason?: string;
  stream?: string;
  subject?: string;
  idProofUrl?: string;
  idProofFilename?: string;
}

export interface StaffApplicant {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  requestedRole: Role;
  verificationStatus: VerificationStatus;
  rejectionReason?: string;
  stream?: string;
  subject?: string;
  department?: string;
  idProofUrl?: string;
  idProofFilename?: string;
  idProofUploadedAt?: string;
  createdAt: string;
}

export interface AlternativeSuggestion {
  id: string;
  facility: Facility;
  type: 'same_time_different_facility' | 'same_facility_different_time';
  date: string;
  startTime: string;
  endTime: string;
  explanation: string;
  matchScore: number;
  capacityDelta: number;
  equipmentMatchRate: number;
}

export interface ConcurrencySimulationResult {
  executionId: string;
  facilityName: string;
  date: string;
  interval: string;
  requesterA: {
    club: string;
    submittedAt: string;
    status: 'SUCCESS_ACQUIRED' | 'CONFLICT_REJECTED';
    bookingRef?: string;
    message: string;
  };
  requesterB: {
    club: string;
    submittedAt: string;
    status: 'SUCCESS_ACQUIRED' | 'CONFLICT_REJECTED';
    bookingRef?: string;
    message: string;
  };
  exclusionConstraintTriggered: boolean;
  isolationLevel: string;
  alternativesForRejected?: AlternativeSuggestion[];
}
