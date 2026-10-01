'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Booking,
  BookingStatus,
  Facility,
  Role,
  DemoUser,
  WorkflowStage,
  AuditLog,
  AvailabilityStatus,
  ApprovalStep,
  AlternativeSuggestion,
  ConcurrencySimulationResult,
  StaffApplicant,
  VerificationStatus,
} from './types';
import {
  INITIAL_FACILITIES,
  DEMO_USERS,
  getInitialSeedBookings,
  INITIAL_STAFF_APPLICANTS,
} from './seed-data';
import {
  areIntervalsOverlapping,
  istToUtcIso,
  getTodayIst,
} from './date-utils';
import { validateBookingFormAndHours } from './operating-hours';
import { supabase, isSupabaseConfigured } from './supabase';
import {
  getRequiredApprovalRoute,
  createApprovalStepsForBooking,
  getUserActiveBooking,
  isBookingActive,
  evaluateBookingStatus,
  FACILITY_UNAVAILABLE_MESSAGE,
  ACTIVE_REQUEST_BLOCKED_MESSAGE,
} from './approval-matrix';

interface CampusContextType {
  isDemoMode: boolean;
  facilities: Facility[];
  bookings: Booking[];
  auditLogs: AuditLog[];
  currentRole: Role;
  currentUser: DemoUser;
  isAuthenticated: boolean;
  authLoading: boolean;
  sessionUser: DemoUser | null;
  applicants: StaffApplicant[];
  switchRole: (role: Role) => void;
  login: (credentials: { fullName: string; email: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  signup: (data: {
    fullName: string;
    email: string;
    password: string;
    role: Role;
    department?: string;
    stream?: string;
    subject?: string;
    idProofFile?: File | null;
    idProofFilename?: string;
  }) => Promise<{ success: boolean; error?: string; verificationPending?: boolean }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; message: string; error?: string }>;
  completeProfile: (data: {
    stream?: string;
    subject?: string;
    idProofFile?: File | null;
    idProofFilename?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  resubmitVerification: (data: {
    idProofFile?: File | null;
    idProofFilename?: string;
    stream?: string;
    subject?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  approveApplicant: (applicantId: string) => { success: boolean; error?: string };
  rejectApplicant: (applicantId: string, reason: string) => { success: boolean; error?: string };
  getFacilityById: (id: string) => Facility | undefined;
  getBookingById: (id: string) => Booking | undefined;
  getBookingByToken: (token: string) => Booking | undefined;
  getFacilityAvailability: (
    facilityId: string,
    date: string,
    startTime: string,
    endTime: string
  ) => AvailabilityStatus;
  checkConflict: (
    facilityId: string,
    date: string,
    startTime: string,
    endTime: string,
    excludeBookingId?: string
  ) => { hasConflict: boolean; conflictingBooking?: Booking; reason?: string };
  createBooking: (bookingData: {
    facilityId: string;
    eventName: string;
    eventDescription: string;
    clubName: string;
    department: string;
    attendeeCount: number;
    requestedEquipment: string[];
    date: string;
    startTime: string;
    endTime: string;
  }) => { success: boolean; booking?: Booking; error?: string };
  approveBooking: (
    bookingId: string,
    comments?: string
  ) => { success: boolean; error?: string };
  rejectBooking: (
    bookingId: string,
    reason: string
  ) => { success: boolean; error?: string };
  cancelBooking: (
    bookingId: string,
    reason?: string
  ) => { success: boolean; error?: string };
  getExplainableAlternatives: (params: {
    facilityId: string;
    date: string;
    startTime: string;
    endTime: string;
    attendeeCount: number;
    requestedEquipment: string[];
  }) => AlternativeSuggestion[];
  runConcurrencySimulation: (params: {
    facilityId: string;
    date: string;
    startTime: string;
    endTime: string;
  }) => Promise<ConcurrencySimulationResult>;
  allUsers: DemoUser[];
  adminLogin: (credentials: { adminSlot: 'admin1' | 'admin2'; username: string; password: string }) => Promise<{ success: boolean; error?: string; unprovisioned?: boolean }>;
  createAdminChallenge: (params: { name?: string; email?: string; password?: string; claimedName?: string }) => Promise<any>;
  resendAdminOtp: (params: { challengeId: string; recipientSlot?: 'recipient1' | 'recipient2' }) => Promise<any>;
  verifyAdminChallenge: (params: { challengeId: string; code1?: string; code2?: string; otp1?: string; otp2?: string }) => Promise<{
    success: boolean;
    user?: DemoUser;
    error?: string;
    remainingAttempts?: number;
  }>;
  fetchAdminChallengeStatus: (params: { challengeId: string }) => Promise<any>;
  adminOverrideBooking: (bookingId: string, params: { action: 'approve' | 'reject' | 'cancel'; reason: string }) => { success: boolean; error?: string };
  updateUserRole: (userId: string, newRole: Role, reason: string) => { success: boolean; error?: string };
  updateUserStatus: (userId: string, status: 'active' | 'suspended', reason: string) => { success: boolean; error?: string };
  updateUserScope: (userId: string, scope: { department?: string; club?: string; stream?: string; subject?: string }, reason: string) => { success: boolean; error?: string };
  updateFacilityStatus: (facilityId: string, status: 'operational' | 'maintenance', reason: string) => { success: boolean; error?: string };
  updateFacilityHours: (facilityId: string, hours: { open: string; close: string }, reason: string) => { success: boolean; error?: string };
  resetDemoData: () => void;
  refreshData: () => Promise<void>;
}

const CampusContext = createContext<CampusContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_BOOKINGS = 'campus_space_bookings_v2';
const LOCAL_STORAGE_KEY_LOGS = 'campus_space_logs_v2';
const LOCAL_STORAGE_KEY_ROLE = 'campus_space_role_v2';
const LOCAL_STORAGE_KEY_AUTH = 'campus_space_auth_session_v3';
const LOCAL_STORAGE_KEY_APPLICANTS = 'campus_space_applicants_v3';
const LOCAL_STORAGE_KEY_REGISTERED = 'campus_space_registered_users_v3';
const LOCAL_STORAGE_KEY_FACILITIES = 'campus_space_facilities_v2';
const LOCAL_STORAGE_KEY_USERS = 'campus_space_users_v4';

export const UNIFIED_ADMIN_ACCOUNT: DemoUser = {
  id: 'admin_unified_system',
  role: 'admin',
  name: 'Administrator',
  email: 'campusspaceadmin@gmail.com',
  username: 'admin',
  title: 'System Administrator',
  adminIdentifier: 'admin',
  avatar: '🛡️',
  verificationStatus: 'approved',
  accountStatus: 'active',
  department: 'Central Administration',
};

export const DESIGNATED_ADMIN_ACCOUNTS: DemoUser[] = [
  {
    id: 'admin_01_primary',
    role: 'admin',
    name: 'Administrator 1',
    username: 'admin1_lead',
    title: 'System Administrator',
    adminIdentifier: 'admin1',
    avatar: '🛡️',
    verificationStatus: 'approved',
    accountStatus: 'active',
    department: 'Central Administration',
  },
  {
    id: 'admin_02_secondary',
    role: 'admin',
    name: 'Administrator 2',
    username: 'admin2_coord',
    title: 'System Administrator',
    adminIdentifier: 'admin2',
    avatar: '🛡️',
    verificationStatus: 'approved',
    accountStatus: 'active',
    department: 'Central Administration',
  },
];

export function CampusProvider({ children }: { children: React.ReactNode }) {
  const [facilities, setFacilities] = useState<Facility[]>(INITIAL_FACILITIES);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [allUsers, setAllUsers] = useState<DemoUser[]>([]);
  const [currentRole, setCurrentRole] = useState<Role>('requester');
  const [sessionUser, setSessionUser] = useState<DemoUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [applicants, setApplicants] = useState<StaffApplicant[]>(INITIAL_STAFF_APPLICANTS);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize from localStorage or fallback to seeds
  useEffect(() => {
    try {
      const storedBookings = localStorage.getItem(LOCAL_STORAGE_KEY_BOOKINGS);
      const storedLogs = localStorage.getItem(LOCAL_STORAGE_KEY_LOGS);
      const storedRole = localStorage.getItem(LOCAL_STORAGE_KEY_ROLE) as Role;
      const storedAuth = localStorage.getItem(LOCAL_STORAGE_KEY_AUTH);
      const storedApplicants = localStorage.getItem(LOCAL_STORAGE_KEY_APPLICANTS);
      const storedFacilities = localStorage.getItem(LOCAL_STORAGE_KEY_FACILITIES);
      const storedUsers = localStorage.getItem(LOCAL_STORAGE_KEY_USERS);

      if (storedFacilities) {
        const parsedFacilities: Facility[] = JSON.parse(storedFacilities)
          .filter((f: Facility) => f.id !== 'fac_conf_suite' && f.id !== 'fac_lecture_theatre')
          .map((f: Facility) => {
            if (f.id === 'fac_auditorium') return { ...f, name: 'AUDITORIUM' };
            if (f.id === 'fac_seminar') return { ...f, name: 'SEMINAR HALL' };
            return f;
          });
        setFacilities(parsedFacilities);
        localStorage.setItem(LOCAL_STORAGE_KEY_FACILITIES, JSON.stringify(parsedFacilities));
      } else {
        setFacilities(INITIAL_FACILITIES);
        localStorage.setItem(LOCAL_STORAGE_KEY_FACILITIES, JSON.stringify(INITIAL_FACILITIES));
      }

      if (storedUsers) {
        const parsed: DemoUser[] = JSON.parse(storedUsers);
        if (!parsed.some((u) => u.id === UNIFIED_ADMIN_ACCOUNT.id)) {
          parsed.unshift(UNIFIED_ADMIN_ACCOUNT);
        }
        setAllUsers(parsed);
      } else {
        const initialUsers: DemoUser[] = [UNIFIED_ADMIN_ACCOUNT, ...DESIGNATED_ADMIN_ACCOUNTS, ...DEMO_USERS];
        setAllUsers(initialUsers);
        localStorage.setItem(LOCAL_STORAGE_KEY_USERS, JSON.stringify(initialUsers));
      }

      if (storedBookings) {
        setBookings(JSON.parse(storedBookings));
      } else {
        const initial = getInitialSeedBookings();
        setBookings(initial);
        localStorage.setItem(LOCAL_STORAGE_KEY_BOOKINGS, JSON.stringify(initial));
      }

      if (storedLogs) {
        setAuditLogs(JSON.parse(storedLogs));
      } else {
        const initialLogs: AuditLog[] = [
          {
            id: 'log_seed_1',
            bookingId: 'book_approved_01',
            bookingRef: 'CS-2026-9012',
            action: 'APPROVED',
            performedBy: 'Col. Sandeep Varma (Retd.)',
            role: 'estate_manager',
            stage: 'estate_manager',
            timestamp: new Date().toISOString(),
          },
        ];
        setAuditLogs(initialLogs);
        localStorage.setItem(LOCAL_STORAGE_KEY_LOGS, JSON.stringify(initialLogs));
      }

      if (storedApplicants) {
        setApplicants(JSON.parse(storedApplicants));
      } else {
        setApplicants(INITIAL_STAFF_APPLICANTS);
        localStorage.setItem(LOCAL_STORAGE_KEY_APPLICANTS, JSON.stringify(INITIAL_STAFF_APPLICANTS));
      }

      if (storedAuth) {
        const parsed = JSON.parse(storedAuth) as DemoUser;
        setSessionUser(parsed);
        setIsAuthenticated(true);
        setCurrentRole(parsed.role || 'requester');
      } else {
        setIsAuthenticated(false);
        setSessionUser(null);
      }

      if (storedRole && (DEMO_USERS.some((u) => u.role === storedRole) || storedRole === 'admin')) {
        setCurrentRole(storedRole);
      }
    } catch {
      setBookings(getInitialSeedBookings());
    } finally {
      setIsInitialized(true);
      setAuthLoading(false);
    }
  }, []);

  // Supabase Auth listener
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setSessionUser(null);
        try {
          localStorage.removeItem(LOCAL_STORAGE_KEY_AUTH);
        } catch { }
      } else if (session?.user && !isAuthenticated) {
        setIsAuthenticated(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isAuthenticated]);

  // Save changes to localStorage
  const saveBookings = (newBookings: Booking[]) => {
    setBookings(newBookings);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_BOOKINGS, JSON.stringify(newBookings));
    } catch {
      // localStorage may fail in private mode
    }
  };

  const saveAuditLogs = (newLogs: AuditLog[]) => {
    setAuditLogs(newLogs);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_LOGS, JSON.stringify(newLogs));
    } catch {
      // ignore
    }
  };

  const saveFacilities = (newFacilities: Facility[]) => {
    setFacilities(newFacilities);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_FACILITIES, JSON.stringify(newFacilities));
    } catch { }
  };

  const saveUsers = (newUsers: DemoUser[]) => {
    setAllUsers(newUsers);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_USERS, JSON.stringify(newUsers));
    } catch { }
  };

  const switchRole = (role: Role) => {
    setCurrentRole(role);
    const matchedUser =
      allUsers.find((u) => u.role === role) ||
      DEMO_USERS.find((u) => u.role === role);
    if (matchedUser) {
      setSessionUser(matchedUser);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY_AUTH, JSON.stringify(matchedUser));
      } catch { }
    }
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_ROLE, role);
    } catch {
      // ignore
    }
  };

  const currentUser =
    sessionUser ||
    allUsers.find((u) => u.role === currentRole) ||
    DEMO_USERS.find((u) => u.role === currentRole) ||
    DEMO_USERS[0];

  const getFacilityById = (id: string) => facilities.find((f) => f.id === id);
  const getBookingById = (id: string) => bookings.find((b) => b.id === id);
  const getBookingByToken = (token: string) =>
    bookings.find((b) => b.verificationToken === token);

  /**
   * Conflict check using half-open intervals [start, end)
   * Only active bookings ('pending' or 'approved') reserve the interval.
   * 'rejected' and 'cancelled' bookings release the reservation.
   */
  const checkConflict = (
    facilityId: string,
    date: string,
    startTime: string,
    endTime: string,
    excludeBookingId?: string
  ) => {
    const facility = getFacilityById(facilityId);
    if (facility && facility.status === 'maintenance') {
      return {
        hasConflict: true,
        reason: `${facility.name} is currently offline for scheduled maintenance.`,
      };
    }

    const proposedStartUtc = istToUtcIso(date, startTime);
    const proposedEndUtc = istToUtcIso(date, endTime);

    const conflictingBooking = bookings.find((b) => {
      if (b.facilityId !== facilityId) return false;
      if (excludeBookingId && b.id === excludeBookingId) return false;
      if (b.status !== 'pending' && b.status !== 'approved') return false;
      // If approved but booked end time has already passed, interval is no longer reserved
      if (b.status === 'approved' && new Date(b.endUtc).getTime() <= Date.now()) return false;

      return areIntervalsOverlapping(
        proposedStartUtc,
        proposedEndUtc,
        b.startUtc,
        b.endUtc
      );
    });

    if (conflictingBooking) {
      return {
        hasConflict: true,
        conflictingBooking,
        reason: FACILITY_UNAVAILABLE_MESSAGE,
      };
    }

    return { hasConflict: false };
  };

  const getFacilityAvailability = (
    facilityId: string,
    date: string,
    startTime: string,
    endTime: string
  ): AvailabilityStatus => {
    const facility = getFacilityById(facilityId);
    if (facility && facility.status === 'maintenance') {
      return 'maintenance';
    }

    const conflict = checkConflict(facilityId, date, startTime, endTime);
    if (conflict.hasConflict && conflict.conflictingBooking) {
      return conflict.conflictingBooking.status === 'approved' ? 'approved' : 'pending';
    }

    return 'available';
  };

  /**
   * Authentication Functions
   */
  const login = async ({
    fullName,
    email,
    password,
  }: {
    fullName: string;
    email: string;
    password: string;
  }) => {
    if (!fullName?.trim()) {
      return { success: false, error: 'Full name is a required field.' };
    }
    if (!email?.trim() || !password) {
      return { success: false, error: 'Email and password are required.' };
    }

    // Attempt Supabase Auth
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          const registeredUsersStr = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_KEY_REGISTERED) : null;
          const registeredUsers: DemoUser[] = registeredUsersStr ? JSON.parse(registeredUsersStr) : [];
          const localMatch =
            registeredUsers.find((u) => u.email?.toLowerCase() === email.trim().toLowerCase()) ||
            DEMO_USERS.find((u) => u.email?.toLowerCase() === email.trim().toLowerCase());

          const isEmailNotConfirmed = error.message?.toLowerCase().includes('email not confirmed');
          if (!localMatch && !isEmailNotConfirmed) {
            return { success: false, error: error.message };
          }

        }
      } catch {
        // Fall back gracefully in offline or demo simulation mode
      }
    }

    // Check registered or demo users
    const registeredUsersStr = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_KEY_REGISTERED) : null;
    const registeredUsers: DemoUser[] = registeredUsersStr ? JSON.parse(registeredUsersStr) : [];

    const existingUser =
      registeredUsers.find((u) => u.email?.toLowerCase() === email.trim().toLowerCase()) ||
      DEMO_USERS.find((u) => u.email?.toLowerCase() === email.trim().toLowerCase());

    let userToSet: DemoUser;

    if (existingUser) {
      if (existingUser.accountStatus === 'suspended') {
        return { success: false, error: 'Access Denied: Your account has been suspended by administration. Please contact the administrator.' };
      }
      // Do not overwrite existing profile name during login
      userToSet = { ...existingUser };
    } else {
      userToSet = {
        id: 'usr_' + Date.now(),
        role: 'requester',
        name: fullName.trim(),
        email: email.trim(),
        title: 'Institutional Member',
        avatar: '👤',
        verificationStatus: 'approved',
      };
    }

    setSessionUser(userToSet);
    setCurrentRole(userToSet.role);
    setIsAuthenticated(true);

    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_AUTH, JSON.stringify(userToSet));
      localStorage.setItem(LOCAL_STORAGE_KEY_ROLE, userToSet.role);
    } catch { }

    return { success: true };
  };

  const adminLogin = async ({
    adminSlot,
    username,
    password,
  }: {
    adminSlot: 'admin1' | 'admin2';
    username: string;
    password: string;
  }) => {
    if (!username || !username.trim()) {
      return { success: false, error: 'Name / Admin Username is required.' };
    }
    if (!password) {
      return { success: false, error: 'Password is required.' };
    }

    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminSlot, username, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'Invalid administrative credentials.',
          unprovisioned: Boolean(data.unprovisioned),
        };
      }

      const adminUser: DemoUser = {
        id: data.user.id,
        role: 'admin',
        name: data.user.name,
        username: data.user.username,
        title: 'System Administrator',
        adminIdentifier: adminSlot,
        avatar: '🛡️',
        verificationStatus: 'approved',
        accountStatus: 'active',
        department: 'Central Administration',
      };

      setSessionUser(adminUser);
      setCurrentRole('admin');
      setIsAuthenticated(true);

      try {
        localStorage.setItem(LOCAL_STORAGE_KEY_AUTH, JSON.stringify(adminUser));
        localStorage.setItem(LOCAL_STORAGE_KEY_ROLE, 'admin');
        if (data.token) {
          sessionStorage.setItem('campus_admin_token', data.token);
        }
      } catch { }

      // Record administrative login audit event
      const nowIso = new Date().toISOString();
      const loginLog: AuditLog = {
        id: `log_admin_login_${Date.now()}`,
        action: 'APPROVED',
        performedBy: adminUser.name,
        role: 'admin',
        actorAdmin: adminSlot,
        affectedEntity: 'System Authentication',
        outcome: 'SUCCESS',
        reason: `Authenticated as ${adminSlot === 'admin1' ? 'Admin 1' : 'Admin 2'} with equal system-wide authority.`,
        timestamp: nowIso,
      };
      saveAuditLogs([loginLog, ...auditLogs]);

      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'An unexpected network error occurred while connecting to administrative authentication.',
      };
    }
  };

  const createAdminChallenge = async ({
    name,
    email,
    password,
    claimedName,
  }: {
    name?: string;
    email?: string;
    password?: string;
    claimedName?: string;
  }) => {
    try {
      const res = await fetch('/api/auth/admin/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name || claimedName,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'Failed to initiate administrator challenge.',
        };
      }
      return data;
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Network error occurred while connecting to challenge endpoint.',
      };
    }
  };

  const resendAdminOtp = async ({
    challengeId,
  }: {
    challengeId: string;
    recipientSlot?: 'recipient1' | 'recipient2';
  }) => {
    try {
      const res = await fetch('/api/auth/admin/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'Failed to resend verification OTP.',
          retryAfterSeconds: data.retryAfterSeconds,
        };
      }
      return data;
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Network error while attempting to resend verification code.',
      };
    }
  };

  const fetchAdminChallengeStatus = async ({ challengeId }: { challengeId: string }) => {
    try {
      const res = await fetch(`/api/auth/admin/status?challengeId=${encodeURIComponent(challengeId)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'Failed to retrieve challenge status.',
        };
      }
      return data;
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Network error while fetching challenge status.',
      };
    }
  };

  const verifyAdminChallenge = async ({
    challengeId,
    code1,
    code2,
    otp1,
    otp2,
  }: {
    challengeId: string;
    code1?: string;
    code2?: string;
    otp1?: string;
    otp2?: string;
  }) => {
    try {
      const targetCode1 = code1 || otp1 || '';
      const targetCode2 = code2 || otp2 || '';
      const res = await fetch('/api/auth/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId, code1: targetCode1, code2: targetCode2 }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'Verification failed.',
          remainingAttempts: data.remainingAttempts,
        };
      }

      const adminUser: DemoUser = {
        id: data.user.id || 'admin_unified_system',
        role: 'admin',
        name: data.user.name || `Administrator (${data.user.claimedName || 'Verified'})`,
        email: data.user.email || 'campusspaceadmin@gmail.com',
        username: data.user.username || 'admin',
        claimedName: data.user.claimedName,
        title: 'System Administrator',
        adminIdentifier: 'admin',
        avatar: '🛡️',
        verificationStatus: 'approved',
        accountStatus: 'active',
        department: 'Central Administration',
      };

      setSessionUser(adminUser);
      setCurrentRole('admin');
      setIsAuthenticated(true);

      try {
        localStorage.setItem(LOCAL_STORAGE_KEY_AUTH, JSON.stringify(adminUser));
        localStorage.setItem(LOCAL_STORAGE_KEY_ROLE, 'admin');
        if (data.sessionToken) {
          sessionStorage.setItem('campus_admin_session', data.sessionToken);
        }
      } catch { }

      // Log successful dual-email login to audit logs
      const nowIso = new Date().toISOString();
      const loginLog: AuditLog = {
        id: `log_admin_login_${Date.now()}`,
        action: 'ADMIN_LOGIN_SUCCESSFUL' as any,
        performedBy: adminUser.name,
        role: 'admin',
        actorAdmin: 'admin',
        affectedEntity: 'System Administration Access',
        outcome: 'SUCCESS',
        reason: `Dual email verification codes (Code 1 & Code 2) verified for administrator: ${adminUser.claimedName || adminUser.name} (campusspaceadmin@gmail.com).`,
        timestamp: nowIso,
      };
      saveAuditLogs([loginLog, ...auditLogs]);

      return { success: true, user: adminUser };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Network error occurred while verifying challenge codes.',
      };
    }
  };

  const signup = async (data: {
    fullName: string;
    email: string;
    password: string;
    role: Role;
    department?: string;
    stream?: string;
    subject?: string;
    idProofFile?: File | null;
    idProofFilename?: string;
  }) => {
    if (!data.fullName?.trim()) return { success: false, error: 'Full name is required.' };
    if (!data.email?.trim() || !data.email.includes('@')) return { success: false, error: 'Valid institutional email address is required.' };
    if (!data.password || data.password.length < 6) return { success: false, error: 'Password must be at least 6 characters long.' };

    // Role-specific field validation
    if (data.role === 'principal' || data.role === 'registrar') {
      if (!data.idProofFile && !data.idProofFilename) {
        return {
          success: false,
          error: `Institutional staff ID / appointment document is strictly required for ${data.role === 'principal' ? 'Principal' : 'Registrar'
            } accounts.`,
        };
      }
    }

    if (data.role === 'hod') {
      if (!data.idProofFile && !data.idProofFilename) {
        return {
          success: false,
          error: 'Institutional staff ID / appointment document is strictly required for HOD accounts.',
        };
      }
      if (!data.stream?.trim()) {
        return { success: false, error: 'Stream / Department is strictly required for HOD accounts.' };
      }
      if (!data.subject?.trim()) {
        return { success: false, error: 'Subject is strictly required for HOD accounts.' };
      }
    }

    // Call Supabase Auth signup if available
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signUp({
          email: data.email.trim(),
          password: data.password,
          options: {
            data: {
              full_name: data.fullName.trim(),
              role: data.role,
              stream: data.stream,
              subject: data.subject,
            },
          },
        });
      } catch { }
    }

    const isPrivileged = data.role === 'principal' || data.role === 'hod' || data.role === 'registrar';
    const verificationStatus: VerificationStatus = isPrivileged ? 'pending' : 'approved';

    const filename = data.idProofFilename || data.idProofFile?.name;

    const newUser: DemoUser = {
      id: 'user_' + Date.now(),
      name: data.fullName.trim(),
      email: data.email.trim(),
      role: isPrivileged ? 'requester' : data.role, // Active verified role remains unprivileged until approved
      requestedRole: data.role,
      verificationStatus,
      title: isPrivileged
        ? `Applicant for ${data.role === 'hod' ? 'HOD' : data.role.toUpperCase()} (Pending Review)`
        : data.role === 'requester'
          ? 'Student Club Convener'
          : data.role.replace('_', ' ').toUpperCase(),
      department: data.stream || data.department || (data.role === 'principal' ? 'Office of the Principal' : data.role === 'registrar' ? 'Campus Administration & Registrar' : 'Academic Department'),
      stream: data.stream,
      subject: data.subject,
      idProofFilename: filename,
      avatar: data.role === 'principal' ? '🎓' : data.role === 'registrar' ? '📜' : data.role === 'hod' ? '👩‍🔬' : '👤',
    };

    if (isPrivileged) {
      const newApplicant: StaffApplicant = {
        id: 'app_' + Date.now(),
        fullName: data.fullName.trim(),
        email: data.email.trim(),
        role: 'requester',
        requestedRole: data.role,
        verificationStatus: 'pending',
        department: newUser.department,
        stream: data.stream,
        subject: data.subject,
        idProofFilename: filename,
        idProofUrl: `id-proofs/${newUser.id}/${filename}`,
        idProofUploadedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      const nextApplicants = [newApplicant, ...applicants];
      setApplicants(nextApplicants);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY_APPLICANTS, JSON.stringify(nextApplicants));
      } catch { }
    }

    const registeredUsersStr = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_KEY_REGISTERED) : null;
    const registeredUsers: DemoUser[] = registeredUsersStr ? JSON.parse(registeredUsersStr) : [];
    registeredUsers.push(newUser);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_REGISTERED, JSON.stringify(registeredUsers));
    } catch { }

    setSessionUser(newUser);
    setCurrentRole(newUser.role);
    setIsAuthenticated(true);

    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_AUTH, JSON.stringify(newUser));
      localStorage.setItem(LOCAL_STORAGE_KEY_ROLE, newUser.role);
    } catch { }

    return { success: true, verificationPending: isPrivileged };
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch { }
    }
    setSessionUser(null);
    setIsAuthenticated(false);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY_AUTH);
    } catch { }
  };

  const resetPassword = async (email: string) => {
    if (!email?.trim() || !email.includes('@')) {
      return { success: false, message: '', error: 'Please enter a valid registered email address.' };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined,
        });
        if (error) {
          return { success: false, message: '', error: error.message };
        }
      } catch { }
    }

    return {
      success: true,
      message: `Password reset instructions have been dispatched to ${email.trim()}. Please check your institutional inbox.`,
    };
  };

  const completeProfile = async (data: {
    stream?: string;
    subject?: string;
    idProofFile?: File | null;
    idProofFilename?: string;
  }) => {
    if (!sessionUser) return { success: false, error: 'No active session.' };

    const filename = data.idProofFilename || data.idProofFile?.name || sessionUser.idProofFilename;
    const updatedUser: DemoUser = {
      ...sessionUser,
      stream: data.stream || sessionUser.stream,
      subject: data.subject || sessionUser.subject,
      idProofFilename: filename,
    };

    setSessionUser(updatedUser);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_AUTH, JSON.stringify(updatedUser));
    } catch { }

    return { success: true };
  };

  const resubmitVerification = async (data: {
    idProofFile?: File | null;
    idProofFilename?: string;
    stream?: string;
    subject?: string;
  }) => {
    if (!sessionUser) return { success: false, error: 'No active user session.' };

    const filename = data.idProofFilename || data.idProofFile?.name || sessionUser.idProofFilename;
    if (!filename) {
      return { success: false, error: 'An updated ID proof document is strictly required for resubmission.' };
    }

    const updatedUser: DemoUser = {
      ...sessionUser,
      verificationStatus: 'pending',
      rejectionReason: undefined,
      idProofFilename: filename,
      stream: data.stream || sessionUser.stream,
      subject: data.subject || sessionUser.subject,
    };

    setSessionUser(updatedUser);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_AUTH, JSON.stringify(updatedUser));
    } catch { }

    const nextApplicants = applicants.map((app) => {
      if (app.email === sessionUser.email) {
        return {
          ...app,
          verificationStatus: 'pending' as const,
          rejectionReason: undefined,
          idProofFilename: filename,
          stream: data.stream || app.stream,
          subject: data.subject || app.subject,
          idProofUploadedAt: new Date().toISOString(),
        };
      }
      return app;
    });

    if (!nextApplicants.some((a) => a.email === sessionUser.email)) {
      nextApplicants.unshift({
        id: 'app_' + Date.now(),
        fullName: sessionUser.name,
        email: sessionUser.email || 'applicant@campus.edu',
        role: 'requester',
        requestedRole: sessionUser.requestedRole || 'hod',
        verificationStatus: 'pending',
        department: sessionUser.department,
        stream: data.stream || sessionUser.stream,
        subject: data.subject || sessionUser.subject,
        idProofFilename: filename,
        idProofUrl: `id-proofs/${sessionUser.id}/${filename}`,
        idProofUploadedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });
    }

    setApplicants(nextApplicants);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_APPLICANTS, JSON.stringify(nextApplicants));
    } catch { }

    return { success: true };
  };

  const approveApplicant = (applicantId: string) => {
    if (currentRole !== 'registrar' && currentRole !== 'admin') {
      return { success: false, error: 'Unauthorized: Only the Campus Registrar or System Administrator can review and approve staff credentials.' };
    }

    const targetApp = applicants.find((a) => a.id === applicantId);
    if (!targetApp) return { success: false, error: 'Applicant record not found.' };

    const updatedApplicants = applicants.map((app) => {
      if (app.id === applicantId) {
        return {
          ...app,
          verificationStatus: 'approved' as const,
          role: app.requestedRole,
        };
      }
      return app;
    });

    setApplicants(updatedApplicants);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_APPLICANTS, JSON.stringify(updatedApplicants));
    } catch { }

    const updatedUsers = allUsers.map((u) => {
      if (u.email?.toLowerCase() === targetApp.email.toLowerCase() || u.id === targetApp.id) {
        return {
          ...u,
          role: targetApp.requestedRole,
          verificationStatus: 'approved' as const,
          title: targetApp.requestedRole === 'principal' ? 'Campus Principal' : targetApp.requestedRole === 'registrar' ? 'Campus Registrar' : 'Head of Department (HOD)',
        };
      }
      return u;
    });
    saveUsers(updatedUsers);

    if (sessionUser && (sessionUser.email === targetApp.email || sessionUser.id === targetApp.id)) {
      const updatedUser: DemoUser = {
        ...sessionUser,
        role: targetApp.requestedRole,
        verificationStatus: 'approved',
        title: targetApp.requestedRole === 'principal' ? 'Principal & Campus Executive Oversight' : targetApp.requestedRole === 'registrar' ? 'Campus Registrar & Staff Reviewer' : 'Head of Department (HOD)',
      };
      setSessionUser(updatedUser);
      setCurrentRole(updatedUser.role);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY_AUTH, JSON.stringify(updatedUser));
        localStorage.setItem(LOCAL_STORAGE_KEY_ROLE, updatedUser.role);
      } catch { }
    }

    const nowIso = new Date().toISOString();
    const log: AuditLog = {
      id: `log_verif_${Date.now()}`,
      action: 'VERIFICATION_APPROVED',
      performedBy: currentUser.name,
      role: currentRole,
      actorAdmin: currentRole === 'admin' ? (currentUser.adminIdentifier || 'admin1') : undefined,
      affectedEntity: `${targetApp.fullName} (${targetApp.requestedRole.toUpperCase()})`,
      targetId: targetApp.id,
      outcome: 'SUCCESS',
      reason: 'Staff credential documents verified and approved.',
      timestamp: nowIso,
    };
    saveAuditLogs([log, ...auditLogs]);

    return { success: true };
  };

  const rejectApplicant = (applicantId: string, reason: string) => {
    if (currentRole !== 'registrar' && currentRole !== 'admin') {
      return { success: false, error: 'Unauthorized: Only the Campus Registrar or System Administrator can review and reject staff credentials.' };
    }
    if (!reason?.trim()) {
      return { success: false, error: 'A clear reason for rejection is strictly mandatory for the applicant.' };
    }

    const targetApp = applicants.find((a) => a.id === applicantId);
    if (!targetApp) return { success: false, error: 'Applicant record not found.' };

    const updatedApplicants = applicants.map((app) => {
      if (app.id === applicantId) {
        return {
          ...app,
          verificationStatus: 'rejected' as const,
          rejectionReason: reason.trim(),
        };
      }
      return app;
    });

    setApplicants(updatedApplicants);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_APPLICANTS, JSON.stringify(updatedApplicants));
    } catch { }

    const updatedUsers = allUsers.map((u) => {
      if (u.email?.toLowerCase() === targetApp.email.toLowerCase() || u.id === targetApp.id) {
        return {
          ...u,
          verificationStatus: 'rejected' as const,
          rejectionReason: reason.trim(),
        };
      }
      return u;
    });
    saveUsers(updatedUsers);

    if (sessionUser && (sessionUser.email === targetApp.email || sessionUser.id === targetApp.id)) {
      const updatedUser: DemoUser = {
        ...sessionUser,
        verificationStatus: 'rejected',
        rejectionReason: reason.trim(),
      };
      setSessionUser(updatedUser);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY_AUTH, JSON.stringify(updatedUser));
      } catch { }
    }

    const nowIso = new Date().toISOString();
    const log: AuditLog = {
      id: `log_verif_rej_${Date.now()}`,
      action: 'VERIFICATION_REJECTED',
      performedBy: currentUser.name,
      role: currentRole,
      actorAdmin: currentRole === 'admin' ? (currentUser.adminIdentifier || 'admin1') : undefined,
      affectedEntity: `${targetApp.fullName} (${targetApp.requestedRole.toUpperCase()})`,
      targetId: targetApp.id,
      outcome: 'SUCCESS',
      reason: reason.trim(),
      timestamp: nowIso,
    };
    saveAuditLogs([log, ...auditLogs]);

    return { success: true };
  };

  /**
   * Creates a new booking.
   * Auto-assigns Coding Club default if omitted.
   * Enforces half-open interval conflict check.
   */
  const createBooking = (bookingData: {
    facilityId: string;
    eventName: string;
    eventDescription: string;
    clubName: string;
    department: string;
    attendeeCount: number;
    requestedEquipment: string[];
    date: string;
    startTime: string;
    endTime: string;
  }) => {
    // 0. Verify account status
    if (currentUser.accountStatus === 'suspended') {
      return {
        success: false,
        error: 'Access Denied: Your account access has been suspended by administration. Booking submissions are disabled.',
      };
    }

    // 1. Verify authenticated user's club-requester permissions
    if (currentRole !== 'requester') {
      return {
        success: false,
        error: 'Permission denied: Only authorized Club Requesters can submit facility booking requests.',
      };
    }

    // 2. Policy: A person may have only one active booking request across all facility categories.
    // An active request is pending approval or approved and its booked end time has not yet passed.
    const activeBooking = getUserActiveBooking(bookings, currentUser.id);
    if (activeBooking) {
      return {
        success: false,
        error: ACTIVE_REQUEST_BLOCKED_MESSAGE,
      };
    }

    const facility = getFacilityById(bookingData.facilityId);
    if (!facility) {
      return { success: false, error: 'Facility not found.' };
    }

    // 3. Validate fields and operating hours via shared configuration
    const hoursValidation = validateBookingFormAndHours({
      facilityTypeOrKey: facility.type,
      facilityName: facility.name,
      reason: bookingData.eventDescription || bookingData.eventName,
      date: bookingData.date,
      startTime: bookingData.startTime,
      endTime: bookingData.endTime,
    });

    if (!hoursValidation.isValid) {
      const firstErr = Object.values(hoursValidation.errors)[0];
      return { success: false, error: firstErr || 'Invalid booking hours or missing required fields.' };
    }

    if (bookingData.attendeeCount > facility.capacity) {
      return {
        success: false,
        error: `Capacity overflow: ${facility.name} holds max ${facility.capacity} attendees (requested: ${bookingData.attendeeCount}).`,
      };
    }

    const conflict = checkConflict(
      bookingData.facilityId,
      bookingData.date,
      bookingData.startTime,
      bookingData.endTime
    );

    if (conflict.hasConflict) {
      return { success: false, error: conflict.reason || FACILITY_UNAVAILABLE_MESSAGE };
    }

    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const bookingRef = `CS-2026-${randomDigits}`;
    const verificationToken = `TOKEN_VERIFY_${Math.random().toString(36).substring(2, 12).toUpperCase()}_${Date.now()}`;
    const nowIso = new Date().toISOString();
    const newBookingId = `book_${Date.now()}`;

    // Derive approval route from facility category and department
    const route = getRequiredApprovalRoute(facility, DEMO_USERS);
    const stepsWithBookingId = createApprovalStepsForBooking(newBookingId, route);

    const newBooking: Booking = {
      id: newBookingId,
      bookingRef,
      facilityId: bookingData.facilityId,
      facilityName: facility.name,
      facilityCategory: route.facilityCategory,
      labType: route.labType || undefined,
      eventName: bookingData.eventName,
      eventDescription: bookingData.eventDescription,
      clubName: bookingData.clubName || currentUser.club || 'Coding Club',
      department: route.department || facility.department || bookingData.department || 'General Administration',
      requesterId: currentUser.id,
      requesterName: currentUser.name,
      requesterEmail: currentUser.email || 'aarav.sharma@campus.edu',
      requesterRole: 'Club Requester',
      attendeeCount: bookingData.attendeeCount,
      requestedEquipment: bookingData.requestedEquipment,
      date: bookingData.date,
      startTime: bookingData.startTime,
      endTime: bookingData.endTime,
      startUtc: istToUtcIso(bookingData.date, bookingData.startTime),
      endUtc: istToUtcIso(bookingData.date, bookingData.endTime),
      currentStage: 'draft',
      status: 'pending',
      routingError: route.routingError,
      approvalSteps: stepsWithBookingId,
      verificationToken,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const newBookings = [newBooking, ...bookings];
    const newLogs: AuditLog[] = [
      {
        id: `log_${Date.now()}`,
        bookingId: newBooking.id,
        bookingRef: newBooking.bookingRef,
        action: 'SUBMITTED',
        performedBy: currentUser.name,
        role: currentRole,
        reason: route.isLab
          ? `Laboratory booking submitted for HOD review (${newBooking.department}).`
          : 'Non-lab booking submitted for dual Principal and Registrar sanction.',
        timestamp: nowIso,
      },
      ...auditLogs,
    ];

    saveBookings(newBookings);
    saveAuditLogs(newLogs);

    return { success: true, booking: newBooking };
  };

  /**
   * Approves booking according to the exact institutional approval matrix:
   * - Non-lab facilities (Auditorium, Seminar Hall, Smart Classroom, Sports Ground):
   *   Requires Principal AND Registrar. Either may act first. One approval leaves pending.
   *   Both approvals required for final approved status.
   * - Lab facilities (Computer Lab, Chemistry Lab, Physics Lab):
   *   Requires Assigned HOD only. Assigned-HOD approval completes the process.
   */
  const approveBooking = (bookingId: string, comments: string = '') => {
    if (currentUser.accountStatus === 'suspended') {
      return {
        success: false,
        error: 'Access Denied: Your account access has been suspended by administration. Protected operations are disabled.',
      };
    }

    // Privilege check: pending applicants cannot approve
    if (currentUser.verificationStatus === 'pending') {
      return {
        success: false,
        error: 'Unauthorized: Account verification pending. Your credentials must be reviewed and approved by the Registrar before performing administrative approvals.',
      };
    }

    const booking = getBookingById(bookingId);
    if (!booking) return { success: false, error: 'Booking not found.' };

    if (booking.status === 'rejected') {
      return { success: false, error: 'Cannot approve a rejected booking request.' };
    }
    if (booking.status === 'cancelled') {
      return { success: false, error: 'Cannot approve a cancelled booking request.' };
    }
    if (booking.status === 'completed') {
      return { success: false, error: 'Cannot approve an expired or completed booking request.' };
    }
    if (booking.status === 'approved') {
      return { success: false, error: 'This booking request is already fully approved.' };
    }
    if (booking.routingError) {
      return { success: false, error: booking.routingError };
    }

    const nowIso = new Date().toISOString();
    const isLab = booking.facilityCategory === 'labs' || !!booking.labType;

    if (isLab) {
      // Lab Approval: Assigned HOD only
      if (currentRole !== 'hod') {
        return {
          success: false,
          error: 'Unauthorized: Laboratory booking requests can only be approved by the responsible Head of Department (HOD).',
        };
      }

      // Verify department match
      if (booking.department && currentUser.department && booking.department !== currentUser.department) {
        return {
          success: false,
          error: `Unauthorized: You are Head of Department for ${currentUser.department}. Only the HOD of ${booking.department} can approve this laboratory request.`,
        };
      }

      const updatedSteps = booking.approvalSteps.map((step) => {
        if (step.stage === 'hod' || step.approverRole === 'hod') {
          return {
            ...step,
            decision: 'approved' as const,
            approverName: currentUser.name,
            approverDepartment: currentUser.department,
            comments: comments || 'Approved by assigned Department Head.',
            decidedAt: nowIso,
          };
        }
        return step;
      });

      // Assigned HOD completes approval
      const updatedBooking: Booking = {
        ...booking,
        status: 'approved',
        currentStage: 'approved',
        approvalSteps: updatedSteps,
        updatedAt: nowIso,
      };

      const updatedBookings = bookings.map((b) => (b.id === bookingId ? updatedBooking : b));
      const newLogs: AuditLog[] = [
        {
          id: `log_${Date.now()}`,
          bookingId: booking.id,
          bookingRef: booking.bookingRef,
          action: 'APPROVED',
          performedBy: currentUser.name,
          role: currentRole,
          stage: 'hod',
          reason: comments || 'Departmental sanction granted for laboratory.',
          timestamp: nowIso,
        },
        ...auditLogs,
      ];

      saveBookings(updatedBookings);
      saveAuditLogs(newLogs);
      return { success: true };
    }

    // Non-lab Approval: Principal AND Registrar
    if (currentRole !== 'principal' && currentRole !== 'registrar') {
      return {
        success: false,
        error: 'Unauthorized: Non-lab facilities require dual governance approval from both Principal and Registrar.',
      };
    }

    const targetStep = booking.approvalSteps.find(
      (s) => s.stage === currentRole || s.approverRole === currentRole
    );

    if (targetStep?.decision === 'approved') {
      return { success: false, error: `You have already approved this booking request.` };
    }

    const otherRole: Role = currentRole === 'principal' ? 'registrar' : 'principal';
    const otherStep = booking.approvalSteps.find(
      (s) => s.stage === otherRole || s.approverRole === otherRole
    );

    const updatedSteps = booking.approvalSteps.map((step) => {
      if (step.stage === currentRole || step.approverRole === currentRole) {
        return {
          ...step,
          decision: 'approved' as const,
          approverName: currentUser.name,
          comments: comments || `${currentRole === 'principal' ? 'Principal' : 'Registrar'} approval granted.`,
          decidedAt: nowIso,
        };
      }
      return step;
    });

    const isBothApproved = otherStep?.decision === 'approved';
    const nextStatus: BookingStatus = isBothApproved ? 'approved' : 'pending';
    const nextStage: WorkflowStage = isBothApproved ? 'approved' : (booking.currentStage || 'draft');

    const updatedBooking: Booking = {
      ...booking,
      status: nextStatus,
      currentStage: nextStage,
      approvalSteps: updatedSteps,
      updatedAt: nowIso,
    };

    const updatedBookings = bookings.map((b) => (b.id === bookingId ? updatedBooking : b));
    const newLogs: AuditLog[] = [
      {
        id: `log_${Date.now()}`,
        bookingId: booking.id,
        bookingRef: booking.bookingRef,
        action: 'APPROVED',
        performedBy: currentUser.name,
        role: currentRole,
        stage: currentRole,
        reason: comments || (isBothApproved ? 'Dual sanction complete. QR Hall Pass issued.' : 'Approval recorded; awaiting second institutional review.'),
        timestamp: nowIso,
      },
      ...auditLogs,
    ];

    saveBookings(updatedBookings);
    saveAuditLogs(newLogs);

    return { success: true };
  };

  /**
   * Rejects the booking with a mandatory reason.
   * Either rejection immediately rejects the request and releases the reservation interval.
   */
  const rejectBooking = (bookingId: string, reason: string) => {
    if (currentUser.accountStatus === 'suspended') {
      return {
        success: false,
        error: 'Access Denied: Your account access has been suspended by administration. Protected operations are disabled.',
      };
    }

    if (currentUser.verificationStatus === 'pending') {
      return {
        success: false,
        error: 'Unauthorized: Account verification pending. Your credentials must be reviewed and approved by the Registrar before performing administrative rejections.',
      };
    }

    if (!reason || reason.trim().length === 0) {
      return { success: false, error: 'A clear reason for rejection is strictly mandatory.' };
    }

    const booking = getBookingById(bookingId);
    if (!booking) return { success: false, error: 'Booking not found.' };

    if (booking.status === 'rejected') {
      return { success: false, error: 'This booking request is already rejected.' };
    }
    if (booking.status === 'cancelled') {
      return { success: false, error: 'Cannot reject a cancelled booking request.' };
    }

    const isLab = booking.facilityCategory === 'labs' || !!booking.labType;

    if (isLab) {
      if (currentRole !== 'hod') {
        return {
          success: false,
          error: 'Unauthorized: Laboratory booking requests can only be rejected by the responsible Head of Department (HOD).',
        };
      }
      if (booking.department && currentUser.department && booking.department !== currentUser.department) {
        return {
          success: false,
          error: `Unauthorized: You are Head of Department for ${currentUser.department}. Only the HOD of ${booking.department} can act on this laboratory request.`,
        };
      }
    } else {
      if (currentRole !== 'principal' && currentRole !== 'registrar') {
        return {
          success: false,
          error: 'Unauthorized: Non-lab facilities can only be rejected by the Principal or Registrar.',
        };
      }
    }

    const nowIso = new Date().toISOString();
    const updatedSteps = booking.approvalSteps.map((step) => {
      const isMyStep = isLab
        ? step.stage === 'hod' || step.approverRole === 'hod'
        : step.stage === currentRole || step.approverRole === currentRole;

      if (isMyStep) {
        return {
          ...step,
          decision: 'rejected' as const,
          approverName: currentUser.name,
          comments: reason.trim(),
          decidedAt: nowIso,
        };
      }
      return step;
    });

    const updatedBooking: Booking = {
      ...booking,
      currentStage: 'rejected',
      status: 'rejected',
      rejectedByRole: currentRole,
      rejectionReason: reason.trim(),
      approvalSteps: updatedSteps,
      updatedAt: nowIso,
    };

    const updatedBookings = bookings.map((b) => (b.id === bookingId ? updatedBooking : b));

    const newLogs: AuditLog[] = [
      {
        id: `log_${Date.now()}`,
        bookingId: booking.id,
        bookingRef: booking.bookingRef,
        action: 'REJECTED',
        performedBy: currentUser.name,
        role: currentRole,
        stage: currentRole,
        reason: reason.trim(),
        timestamp: nowIso,
      },
      ...auditLogs,
    ];

    saveBookings(updatedBookings);
    saveAuditLogs(newLogs);

    return { success: true };
  };

  /**
   * Cancels a booking by the requester.
   * Releases the reservation interval and revokes the hall pass if previously issued.
   */
  const cancelBooking = (bookingId: string, reason: string = 'Cancelled by club requester.') => {
    if (currentUser.accountStatus === 'suspended') {
      return {
        success: false,
        error: 'Access Denied: Your account access has been suspended by administration. Protected operations are disabled.',
      };
    }

    const booking = getBookingById(bookingId);
    if (!booking) return { success: false, error: 'Booking not found.' };

    const nowIso = new Date().toISOString();
    const updatedBooking: Booking = {
      ...booking,
      status: 'cancelled',
      currentStage: 'cancelled',
      cancellationReason: reason,
      updatedAt: nowIso,
    };

    const updatedBookings = bookings.map((b) => (b.id === bookingId ? updatedBooking : b));

    const newLogs: AuditLog[] = [
      {
        id: `log_${Date.now()}`,
        bookingId: booking.id,
        bookingRef: booking.bookingRef,
        action: 'CANCELLED',
        performedBy: currentUser.name,
        role: currentRole,
        stage: 'cancelled',
        reason,
        timestamp: nowIso,
      },
      ...auditLogs,
    ];

    saveBookings(updatedBookings);
    saveAuditLogs(newLogs);

    return { success: true };
  };

  /**
   * Explicit Administrator Override
   * Enforces equal system-wide authority for Admin 1 and Admin 2.
   * Allows overriding approvals, rejections, and cancellations with audit attribution.
   * Invariant: Conflict prevention and hall pass revocation are strictly enforced.
   */
  const adminOverrideBooking = (
    bookingId: string,
    params: {
      action: 'approve' | 'reject' | 'cancel';
      reason: string;
    }
  ) => {
    if (currentRole !== 'admin') {
      return {
        success: false,
        error: 'Unauthorized: Only designated System Administrators can perform administrative overrides.',
      };
    }

    if (!params.reason || !params.reason.trim()) {
      return {
        success: false,
        error: 'A detailed justification reason is strictly mandatory for administrative overrides.',
      };
    }

    const booking = getBookingById(bookingId);
    if (!booking) return { success: false, error: 'Booking not found.' };

    const adminSlot: 'admin1' | 'admin2' | 'admin' = currentUser.adminIdentifier || 'admin';
    const adminSlotLabel = adminSlot === 'admin2' ? 'Admin 2' : adminSlot === 'admin1' ? 'Admin 1' : 'Administrator';
    const adminFullName = adminSlot === 'admin' ? currentUser.name : `${currentUser.name} (${adminSlotLabel})`;
    const nowIso = new Date().toISOString();
    const reasonText = params.reason.trim();

    if (params.action === 'approve') {
      // 1. Conflict check: Facility must not have overlapping active booking
      const conflict = checkConflict(
        booking.facilityId,
        booking.date,
        booking.startTime,
        booking.endTime,
        booking.id
      );

      if (conflict.hasConflict) {
        return {
          success: false,
          error: `Override blocked: ${conflict.reason || FACILITY_UNAVAILABLE_MESSAGE}`,
        };
      }

      // 2. Facility check
      const facility = getFacilityById(booking.facilityId);
      if (facility && facility.status === 'maintenance') {
        return {
          success: false,
          error: `Override blocked: ${facility.name} is currently offline for scheduled maintenance.`,
        };
      }

      // 3. Single active request policy check
      const activeBooking = getUserActiveBooking(bookings, booking.requesterId);
      if (activeBooking && activeBooking.id !== booking.id) {
        return {
          success: false,
          error: `Override blocked: ${ACTIVE_REQUEST_BLOCKED_MESSAGE}`,
        };
      }

      // Issue QR Hall Pass token
      const verificationToken =
        booking.verificationToken ||
        `HP-TOKEN-${booking.bookingRef}-${Date.now().toString(36).toUpperCase()}`;

      // Append explicit admin_override step without fabricating HOD or Principal/Registrar decisions
      const overrideStep: ApprovalStep = {
        id: `step_override_${Date.now()}`,
        bookingId: booking.id,
        stage: 'admin_override',
        stageName: 'Administrator Override',
        approverRole: 'admin',
        approverName: adminFullName,
        decision: 'approved',
        comments: `ADMIN OVERRIDE SANCTION: ${reasonText}`,
        decidedAt: nowIso,
      };

      const updatedBooking: Booking = {
        ...booking,
        status: 'approved',
        currentStage: 'approved',
        verificationToken,
        approvalSteps: [...(booking.approvalSteps || []), overrideStep],
        adminOverride: {
          action: 'approve',
          adminIdentifier: adminSlot,
          performedBy: adminFullName,
          timestamp: nowIso,
          reason: reasonText,
        },
        updatedAt: nowIso,
      };

      const updatedBookings = bookings.map((b) => (b.id === bookingId ? updatedBooking : b));
      const newLogs: AuditLog[] = [
        {
          id: `log_override_app_${Date.now()}`,
          bookingId: booking.id,
          bookingRef: booking.bookingRef,
          action: 'ADMIN_OVERRIDE_APPROVE',
          performedBy: adminFullName,
          role: 'admin',
          actorAdmin: adminSlot,
          affectedEntity: `${booking.facilityName} (${booking.bookingRef})`,
          targetId: booking.id,
          outcome: 'SUCCESS',
          reason: reasonText,
          timestamp: nowIso,
        },
        ...auditLogs,
      ];

      saveBookings(updatedBookings);
      saveAuditLogs(newLogs);
      return { success: true };
    }

    if (params.action === 'reject') {
      const overrideStep: ApprovalStep = {
        id: `step_override_${Date.now()}`,
        bookingId: booking.id,
        stage: 'admin_override',
        stageName: 'Administrator Override',
        approverRole: 'admin',
        approverName: adminFullName,
        decision: 'rejected',
        comments: `ADMIN OVERRIDE REJECTION: ${reasonText}`,
        decidedAt: nowIso,
      };

      const updatedBooking: Booking = {
        ...booking,
        status: 'rejected',
        currentStage: 'rejected',
        rejectionReason: `Administrative Override: ${reasonText}`,
        approvalSteps: [...(booking.approvalSteps || []), overrideStep],
        adminOverride: {
          action: 'reject',
          adminIdentifier: adminSlot,
          performedBy: adminFullName,
          timestamp: nowIso,
          reason: reasonText,
        },
        updatedAt: nowIso,
      };

      const updatedBookings = bookings.map((b) => (b.id === bookingId ? updatedBooking : b));
      const newLogs: AuditLog[] = [
        {
          id: `log_override_rej_${Date.now()}`,
          bookingId: booking.id,
          bookingRef: booking.bookingRef,
          action: 'ADMIN_OVERRIDE_REJECT',
          performedBy: adminFullName,
          role: 'admin',
          actorAdmin: adminSlot,
          affectedEntity: `${booking.facilityName} (${booking.bookingRef})`,
          targetId: booking.id,
          outcome: 'SUCCESS',
          reason: reasonText,
          timestamp: nowIso,
        },
        ...auditLogs,
      ];

      saveBookings(updatedBookings);
      saveAuditLogs(newLogs);
      return { success: true };
    }

    if (params.action === 'cancel') {
      const updatedBooking: Booking = {
        ...booking,
        status: 'cancelled',
        currentStage: 'cancelled',
        cancellationReason: `Administrative Override: ${reasonText}`,
        adminOverride: {
          action: 'cancel',
          adminIdentifier: adminSlot,
          performedBy: adminFullName,
          timestamp: nowIso,
          reason: reasonText,
        },
        updatedAt: nowIso,
      };

      const updatedBookings = bookings.map((b) => (b.id === bookingId ? updatedBooking : b));
      const newLogs: AuditLog[] = [
        {
          id: `log_override_can_${Date.now()}`,
          bookingId: booking.id,
          bookingRef: booking.bookingRef,
          action: 'ADMIN_OVERRIDE_CANCEL',
          performedBy: adminFullName,
          role: 'admin',
          actorAdmin: adminSlot,
          affectedEntity: `${booking.facilityName} (${booking.bookingRef})`,
          targetId: booking.id,
          outcome: 'SUCCESS',
          reason: reasonText,
          timestamp: nowIso,
        },
        ...auditLogs,
      ];

      saveBookings(updatedBookings);
      saveAuditLogs(newLogs);
      return { success: true };
    }

    return { success: false, error: 'Invalid override action specified.' };
  };

  const updateUserRole = (userId: string, newRole: Role, reason: string) => {
    if (currentRole !== 'admin') {
      return { success: false, error: 'Unauthorized: Only administrators can modify roles.' };
    }
    const target = allUsers.find((u) => u.id === userId);
    if (!target) return { success: false, error: 'User account not found.' };
    if (target.role === 'admin' || target.id === 'admin_01_primary' || target.id === 'admin_02_secondary') {
      return { success: false, error: 'Administrator accounts cannot be demoted or role-modified.' };
    }

    const updatedUsers = allUsers.map((u) => {
      if (u.id === userId) {
        return {
          ...u,
          role: newRole,
          title:
            newRole === 'principal'
              ? 'Campus Principal'
              : newRole === 'registrar'
                ? 'Campus Registrar'
                : newRole === 'hod'
                  ? `Head of Department (${u.department || 'Academic'})`
                  : 'Student Club Requester',
          verificationStatus: (newRole === 'requester' ? 'approved' : u.verificationStatus) as VerificationStatus,
        };
      }
      return u;
    });

    saveUsers(updatedUsers);

    if (sessionUser && sessionUser.id === userId) {
      const updated = updatedUsers.find((u) => u.id === userId);
      if (updated) {
        setSessionUser(updated);
        setCurrentRole(newRole);
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY_AUTH, JSON.stringify(updated));
          localStorage.setItem(LOCAL_STORAGE_KEY_ROLE, newRole);
        } catch { }
      }
    }

    const nowIso = new Date().toISOString();
    const log: AuditLog = {
      id: `log_role_${Date.now()}`,
      action: 'ROLE_UPDATED',
      performedBy: `${currentUser.name} (${currentUser.adminIdentifier === 'admin2' ? 'Admin 2' : 'Admin 1'})`,
      role: 'admin',
      actorAdmin: currentUser.adminIdentifier || 'admin1',
      affectedEntity: `${target.name} (${target.email || target.id})`,
      targetId: target.id,
      outcome: 'SUCCESS',
      reason: reason || `Role updated from ${target.role} to ${newRole}.`,
      timestamp: nowIso,
    };
    saveAuditLogs([log, ...auditLogs]);

    return { success: true };
  };

  const updateUserStatus = (userId: string, newStatus: 'active' | 'suspended', reason: string) => {
    if (currentRole !== 'admin') {
      return { success: false, error: 'Unauthorized: Only administrators can suspend or restore accounts.' };
    }
    const target = allUsers.find((u) => u.id === userId);
    if (!target) return { success: false, error: 'User account not found.' };
    if (target.role === 'admin' || target.id === 'admin_01_primary' || target.id === 'admin_02_secondary') {
      return { success: false, error: 'Administrator accounts cannot be suspended.' };
    }

    const updatedUsers = allUsers.map((u) => {
      if (u.id === userId) {
        return { ...u, accountStatus: newStatus };
      }
      return u;
    });

    saveUsers(updatedUsers);

    if (sessionUser && sessionUser.id === userId) {
      const updated = updatedUsers.find((u) => u.id === userId);
      if (updated) {
        setSessionUser(updated);
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY_AUTH, JSON.stringify(updated));
        } catch { }
      }
    }

    const nowIso = new Date().toISOString();
    const log: AuditLog = {
      id: `log_status_${Date.now()}`,
      action: newStatus === 'suspended' ? 'ACCESS_SUSPENDED' : 'ACCESS_RESTORED',
      performedBy: `${currentUser.name} (${currentUser.adminIdentifier === 'admin2' ? 'Admin 2' : 'Admin 1'})`,
      role: 'admin',
      actorAdmin: currentUser.adminIdentifier || 'admin1',
      affectedEntity: `${target.name} (${target.email || target.id})`,
      targetId: target.id,
      outcome: 'SUCCESS',
      reason: reason || `Account access ${newStatus}.`,
      timestamp: nowIso,
    };
    saveAuditLogs([log, ...auditLogs]);

    return { success: true };
  };

  const updateUserScope = (
    userId: string,
    scope: { department?: string; club?: string; stream?: string; subject?: string },
    reason: string
  ) => {
    if (currentRole !== 'admin') {
      return { success: false, error: 'Unauthorized: Only administrators can update account scope.' };
    }
    const target = allUsers.find((u) => u.id === userId);
    if (!target) return { success: false, error: 'User account not found.' };

    const updatedUsers = allUsers.map((u) => {
      if (u.id === userId) {
        return {
          ...u,
          department: scope.department !== undefined ? scope.department : u.department,
          club: scope.club !== undefined ? scope.club : u.club,
          stream: scope.stream !== undefined ? scope.stream : u.stream,
          subject: scope.subject !== undefined ? scope.subject : u.subject,
        };
      }
      return u;
    });

    saveUsers(updatedUsers);

    if (sessionUser && sessionUser.id === userId) {
      const updated = updatedUsers.find((u) => u.id === userId);
      if (updated) {
        setSessionUser(updated);
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY_AUTH, JSON.stringify(updated));
        } catch { }
      }
    }

    const nowIso = new Date().toISOString();
    const log: AuditLog = {
      id: `log_scope_${Date.now()}`,
      action: 'SCOPE_UPDATED',
      performedBy: `${currentUser.name} (${currentUser.adminIdentifier === 'admin2' ? 'Admin 2' : 'Admin 1'})`,
      role: 'admin',
      actorAdmin: currentUser.adminIdentifier || 'admin1',
      affectedEntity: `${target.name} (${target.email || target.id})`,
      targetId: target.id,
      outcome: 'SUCCESS',
      reason: reason || 'Account department/club scope updated.',
      timestamp: nowIso,
    };
    saveAuditLogs([log, ...auditLogs]);

    return { success: true };
  };

  const updateFacilityStatus = (facilityId: string, status: 'operational' | 'maintenance', reason: string) => {
    if (currentRole !== 'admin') {
      return { success: false, error: 'Unauthorized: Only administrators can update facility status.' };
    }
    const fac = facilities.find((f) => f.id === facilityId);
    if (!fac) return { success: false, error: 'Facility not found.' };

    const updatedFacilities = facilities.map((f) => {
      if (f.id === facilityId) {
        return { ...f, status };
      }
      return f;
    });

    saveFacilities(updatedFacilities);

    const nowIso = new Date().toISOString();
    const log: AuditLog = {
      id: `log_fac_status_${Date.now()}`,
      action: 'FACILITY_STATUS_UPDATED',
      performedBy: `${currentUser.name} (${currentUser.adminIdentifier === 'admin2' ? 'Admin 2' : 'Admin 1'})`,
      role: 'admin',
      actorAdmin: currentUser.adminIdentifier || 'admin1',
      affectedEntity: fac.name,
      targetId: fac.id,
      outcome: 'SUCCESS',
      reason: reason || `Facility status updated to ${status}.`,
      timestamp: nowIso,
    };
    saveAuditLogs([log, ...auditLogs]);

    return { success: true };
  };

  const updateFacilityHours = (facilityId: string, hours: { open: string; close: string }, reason: string) => {
    if (currentRole !== 'admin') {
      return { success: false, error: 'Unauthorized: Only administrators can modify operating hours.' };
    }
    const fac = facilities.find((f) => f.id === facilityId);
    if (!fac) return { success: false, error: 'Facility not found.' };

    const updatedFacilities = facilities.map((f) => {
      if (f.id === facilityId) {
        return {
          ...f,
          operatingHours: {
            weekdays: `${hours.open} - ${hours.close}`,
            weekends: f.operatingHours?.weekends || '10:00 - 17:00',
          },
        };
      }
      return f;
    });

    saveFacilities(updatedFacilities);

    const nowIso = new Date().toISOString();
    const log: AuditLog = {
      id: `log_fac_hours_${Date.now()}`,
      action: 'FACILITY_STATUS_UPDATED',
      performedBy: `${currentUser.name} (${currentUser.adminIdentifier === 'admin2' ? 'Admin 2' : 'Admin 1'})`,
      role: 'admin',
      actorAdmin: currentUser.adminIdentifier || 'admin1',
      affectedEntity: fac.name,
      targetId: fac.id,
      outcome: 'SUCCESS',
      reason: reason || `Operating hours updated to ${hours.open} - ${hours.close}.`,
      timestamp: nowIso,
    };
    saveAuditLogs([log, ...auditLogs]);

    return { success: true };
  };

  /**
   * Explainable AI Alternative Suggestions
   */
  const getExplainableAlternatives = (params: {
    facilityId: string;
    date: string;
    startTime: string;
    endTime: string;
    attendeeCount: number;
    requestedEquipment: string[];
  }): AlternativeSuggestion[] => {
    const requestedFacility = getFacilityById(params.facilityId);
    if (!requestedFacility) return [];

    const suggestions: AlternativeSuggestion[] = [];

    // Alternative 1: Other facilities at exact same time slot
    facilities.forEach((other) => {
      if (other.id === params.facilityId) return;
      if (other.status === 'maintenance') return;
      if (other.capacity < params.attendeeCount) return;

      const avail = getFacilityAvailability(other.id, params.date, params.startTime, params.endTime);
      if (avail === 'available') {
        const matchingEquipment = params.requestedEquipment.filter((eq) =>
          other.equipment.includes(eq)
        );
        const matchRate =
          params.requestedEquipment.length > 0
            ? Math.round((matchingEquipment.length / params.requestedEquipment.length) * 100)
            : 100;

        const capacityDelta = other.capacity - params.attendeeCount;

        suggestions.push({
          id: `alt_fac_${other.id}`,
          facility: other,
          type: 'same_time_different_facility',
          date: params.date,
          startTime: params.startTime,
          endTime: params.endTime,
          matchScore: 90 - Math.min(20, Math.floor(capacityDelta / 20)),
          capacityDelta,
          equipmentMatchRate: matchRate,
          explanation: `${other.name} in ${other.building} is 100% free from ${params.startTime} to ${params.endTime}. Fits ${other.capacity} attendees (+${capacityDelta} buffer) with ${matchRate}% equipment match.`,
        });
      }
    });

    // Alternative 2: Same facility at adjacent times (+3 hours or next morning)
    const timeShifts = [
      { start: '13:00', end: '16:00' },
      { start: '16:00', end: '19:00' },
      { start: '09:00', end: '12:00' },
    ];

    timeShifts.forEach((shift) => {
      if (shift.start === params.startTime && shift.end === params.endTime) return;
      const avail = getFacilityAvailability(
        params.facilityId,
        params.date,
        shift.start,
        shift.end
      );

      if (avail === 'available') {
        suggestions.push({
          id: `alt_time_${shift.start}`,
          facility: requestedFacility,
          type: 'same_facility_different_time',
          date: params.date,
          startTime: shift.start,
          endTime: shift.end,
          matchScore: 95,
          capacityDelta: requestedFacility.capacity - params.attendeeCount,
          equipmentMatchRate: 100,
          explanation: `Same facility (${requestedFacility.name}) is fully available on the same date (${params.date}) during the shifted interval ${shift.start} - ${shift.end}. Retains 100% of requested setup.`,
        });
      }
    });

    return suggestions.sort((a, b) => b.matchScore - a.matchScore).slice(0, 3);
  };

  /**
   * Concurrency Stress Simulation
   */
  const runConcurrencySimulation = async (params: {
    facilityId: string;
    date: string;
    startTime: string;
    endTime: string;
  }): Promise<ConcurrencySimulationResult> => {
    const facility = getFacilityById(params.facilityId);
    const facilityName = facility ? facility.name : 'Target Facility';

    await new Promise((resolve) => setTimeout(resolve, 600));

    const randomDigitsA = Math.floor(1000 + Math.random() * 9000);
    const bookingRefA = `CS-2026-${randomDigitsA}`;

    const alternatives = getExplainableAlternatives({
      facilityId: params.facilityId,
      date: params.date,
      startTime: params.startTime,
      endTime: params.endTime,
      attendeeCount: 150,
      requestedEquipment: ['projector', 'microphone', 'ac'],
    });

    return {
      executionId: `SIM_EXEC_${Date.now()}`,
      facilityName,
      date: params.date,
      interval: `[${params.startTime}, ${params.endTime})`,
      requesterA: {
        club: 'Coding Club (Lead Convener Aarav)',
        submittedAt: '10:00:00.012 IST',
        status: 'SUCCESS_ACQUIRED',
        bookingRef: bookingRefA,
        message: 'Lock acquired via PostgreSQL GiST Exclusion constraint: Reservation row committed.',
      },
      requesterB: {
        club: 'Robotics & AI Society (Convener Neha)',
        submittedAt: '10:00:00.015 IST (+3ms delta)',
        status: 'CONFLICT_REJECTED',
        message:
          'FATAL EXCLUSION ERROR: Conflicting key (facility_id, time_range) = (fac_auditorium, [14:00, 16:00)) already reserved by active booking CS-2026-' +
          randomDigitsA +
          '. Atomic rollback executed.',
      },
      exclusionConstraintTriggered: true,
      isolationLevel: 'TRANSACTION ISOLATION LEVEL SERIALIZABLE (GiST exclusion)',
      alternativesForRejected: alternatives,
    };
  };

  const resetDemoData = () => {
    const initialBookings = getInitialSeedBookings();
    setBookings(initialBookings);
    localStorage.setItem(LOCAL_STORAGE_KEY_BOOKINGS, JSON.stringify(initialBookings));

    setFacilities(INITIAL_FACILITIES);
    localStorage.setItem(LOCAL_STORAGE_KEY_FACILITIES, JSON.stringify(INITIAL_FACILITIES));

    setApplicants(INITIAL_STAFF_APPLICANTS);
    localStorage.setItem(LOCAL_STORAGE_KEY_APPLICANTS, JSON.stringify(INITIAL_STAFF_APPLICANTS));

    const initialLogs: AuditLog[] = [
      {
        id: 'log_seed_1',
        bookingId: 'book_approved_01',
        bookingRef: 'CS-2026-9012',
        action: 'APPROVED',
        performedBy: 'Col. Sandeep Varma (Retd.)',
        role: 'estate_manager',
        stage: 'estate_manager',
        timestamp: new Date().toISOString(),
      },
    ];
    setAuditLogs(initialLogs);
    localStorage.setItem(LOCAL_STORAGE_KEY_LOGS, JSON.stringify(initialLogs));
  };

  const refreshData = async () => {
    try {
      const storedBookings = localStorage.getItem(LOCAL_STORAGE_KEY_BOOKINGS);
      if (storedBookings) {
        setBookings(JSON.parse(storedBookings));
      }
      const storedLogs = localStorage.getItem(LOCAL_STORAGE_KEY_LOGS);
      if (storedLogs) {
        setAuditLogs(JSON.parse(storedLogs));
      }
    } catch { }
  };

  return (
    <CampusContext.Provider
      value={{
        isDemoMode: !isSupabaseConfigured,
        facilities,
        bookings,
        auditLogs,
        currentRole,
        currentUser,
        isAuthenticated,
        authLoading,
        sessionUser,
        applicants,
        switchRole,
        login,
        signup,
        logout,
        resetPassword,
        completeProfile,
        resubmitVerification,
        approveApplicant,
        rejectApplicant,
        getFacilityById,
        getBookingById,
        getBookingByToken,
        getFacilityAvailability,
        checkConflict,
        createBooking,
        approveBooking,
        rejectBooking,
        cancelBooking,
        getExplainableAlternatives,
        runConcurrencySimulation,
        allUsers,
        adminLogin,
        createAdminChallenge,
        resendAdminOtp,
        verifyAdminChallenge,
        fetchAdminChallengeStatus,
        adminOverrideBooking,
        updateUserRole,
        updateUserStatus,
        updateUserScope,
        updateFacilityStatus,
        updateFacilityHours,
        resetDemoData,
        refreshData,
      }}
    >
      {children}
    </CampusContext.Provider>
  );
}

export function useCampusStore() {
  const context = useContext(CampusContext);
  if (!context) {
    throw new Error('useCampusStore must be used within a CampusProvider');
  }
  return context;
}
