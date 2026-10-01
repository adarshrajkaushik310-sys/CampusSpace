'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCampusStore } from '@/lib/store';
import { BubbleButton } from '@/components/BubbleButton';
import { Role, DemoUser, Booking, Facility } from '@/lib/types';
import { getTodayIst, formatIstDate, formatIstTime } from '@/lib/date-utils';
import {
  Shield,
  ShieldCheck,
  Users,
  Calendar,
  Clock,
  Building,
  Activity,
  BarChart3,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  ExternalLink,
  Lock,
  QrCode,
  Check,
  X,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const {
    currentUser,
    currentRole,
    isAuthenticated,
    bookings,
    facilities,
    auditLogs,
    allUsers,
    applicants,
    adminOverrideBooking,
    updateUserRole,
    updateUserStatus,
    updateUserScope,
    updateFacilityStatus,
    updateFacilityHours,
    approveApplicant,
    rejectApplicant,
  } = useCampusStore();

  const [activeTab, setActiveTab] = useState<'access' | 'bookings' | 'activity' | 'facilities' | 'overview'>('access');

  // Search & filter states
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<string>('all');

  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingFacilityFilter, setBookingFacilityFilter] = useState('all');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');

  const [logSearch, setLogSearch] = useState('');
  const [logRoleFilter, setLogRoleFilter] = useState('all');
  const [logActionFilter, setLogActionFilter] = useState('all');
  const [logDateFilter, setLogDateFilter] = useState('all');

  // Modal Dialog States
  const [overrideModal, setOverrideModal] = useState<{
    booking: Booking;
    action: 'approve' | 'reject' | 'cancel';
  } | null>(null);
  const [overrideReason, setOverrideReason] = useState('');

  const [roleChangeModal, setRoleChangeModal] = useState<{
    user: DemoUser;
    newRole: Role;
  } | null>(null);
  const [roleChangeReason, setRoleChangeReason] = useState('');

  const [statusChangeModal, setStatusChangeModal] = useState<{
    user: DemoUser;
    newStatus: 'active' | 'suspended';
  } | null>(null);
  const [statusChangeReason, setStatusChangeReason] = useState('');

  const [scopeChangeModal, setScopeChangeModal] = useState<{
    user: DemoUser;
    department: string;
    club: string;
  } | null>(null);
  const [scopeChangeReason, setScopeChangeReason] = useState('');

  const [facilityHoursModal, setFacilityHoursModal] = useState<{
    facility: Facility;
    open: string;
    close: string;
  } | null>(null);
  const [facilityHoursReason, setFacilityHoursReason] = useState('');

  const [viewingDocument, setViewingDocument] = useState<{
    userName: string;
    filename: string;
    signedUrl: string;
    expiresIn: number;
  } | null>(null);

  const [feedbackToast, setFeedbackToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setFeedbackToast({ type, message });
    setTimeout(() => setFeedbackToast(null), 5000);
  };

  // Access Protection: Verify administrator role
  if (!isAuthenticated || currentRole !== 'admin') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 animate-page-enter">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-neutral-200 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-campus-red/10 border border-campus-red/20 text-campus-red flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-neutral-950">Administrator Access Restricted</h2>
          <p className="text-sm text-neutral-600 leading-relaxed">
            This management dashboard is restricted to designated administrators. Please sign in through the Admin Login portal.
          </p>
          <div className="pt-2">
            <BubbleButton href="/login" variant="primary" size="md" className="w-full">
              Go to Admin Login
            </BubbleButton>
          </div>
        </div>
      </div>
    );
  }

  const currentAdminSlot = currentUser.adminIdentifier || 'admin';
  const currentAdminLabel = currentAdminSlot === 'admin2'
    ? 'Administrator 2'
    : currentAdminSlot === 'admin1'
    ? 'Administrator 1'
    : (currentUser.claimedName ? `Administrator (${currentUser.claimedName})` : 'Administrator');

  // Filtered Users for Access Management
  const filteredUsers = allUsers.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(userSearch.toLowerCase())) ||
      (u.department && u.department.toLowerCase().includes(userSearch.toLowerCase())) ||
      (u.club && u.club.toLowerCase().includes(userSearch.toLowerCase()));

    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    const matchesStatus =
      userStatusFilter === 'all' ||
      (userStatusFilter === 'suspended' ? u.accountStatus === 'suspended' : u.accountStatus !== 'suspended');

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Filtered Bookings for Override & Management
  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      b.bookingRef.toLowerCase().includes(bookingSearch.toLowerCase()) ||
      b.eventName.toLowerCase().includes(bookingSearch.toLowerCase()) ||
      b.requesterName.toLowerCase().includes(bookingSearch.toLowerCase()) ||
      b.facilityName.toLowerCase().includes(bookingSearch.toLowerCase());

    const matchesFacility = bookingFacilityFilter === 'all' || b.facilityId === bookingFacilityFilter;
    const matchesStatus = bookingStatusFilter === 'all' || b.status === bookingStatusFilter;

    return matchesSearch && matchesFacility && matchesStatus;
  });

  // Filtered Activity Logs
  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.performedBy.toLowerCase().includes(logSearch.toLowerCase()) ||
      (log.affectedEntity && log.affectedEntity.toLowerCase().includes(logSearch.toLowerCase())) ||
      (log.bookingRef && log.bookingRef.toLowerCase().includes(logSearch.toLowerCase())) ||
      (log.reason && log.reason.toLowerCase().includes(logSearch.toLowerCase()));

    const matchesRole = logRoleFilter === 'all' || log.role === logRoleFilter;
    const matchesAction = logActionFilter === 'all' || log.action === logActionFilter;

    let matchesDate = true;
    const today = getTodayIst();
    if (logDateFilter === 'today') {
      matchesDate = log.timestamp.startsWith(today);
    } else if (logDateFilter === '7days') {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      matchesDate = log.timestamp >= sevenDaysAgo;
    } else if (logDateFilter === '30days') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      matchesDate = log.timestamp >= thirtyDaysAgo;
    }

    return matchesSearch && matchesRole && matchesAction && matchesDate;
  });

  // Handler for Admin Overrides
  const handleConfirmOverride = () => {
    if (!overrideModal) return;
    if (!overrideReason.trim()) {
      showToast('error', 'A justification reason is required for administrative overrides.');
      return;
    }

    const res = adminOverrideBooking(overrideModal.booking.id, {
      action: overrideModal.action,
      reason: overrideReason.trim(),
    });

    if (res.success) {
      showToast(
        'success',
        `Admin Override successfully executed: Booking ${overrideModal.booking.bookingRef} marked as ${overrideModal.action}.`
      );
      setOverrideModal(null);
      setOverrideReason('');
    } else {
      showToast('error', res.error || 'Failed to execute administrative override.');
    }
  };

  // Handler for Suspend / Restore User
  const handleConfirmStatusChange = () => {
    if (!statusChangeModal) return;
    if (!statusChangeReason.trim()) {
      showToast('error', 'A reason is required to modify account status.');
      return;
    }

    const res = updateUserStatus(statusChangeModal.user.id, statusChangeModal.newStatus, statusChangeReason.trim());
    if (res.success) {
      showToast(
        'success',
        `Account access for ${statusChangeModal.user.name} has been ${statusChangeModal.newStatus}.`
      );
      setStatusChangeModal(null);
      setStatusChangeReason('');
    } else {
      showToast('error', res.error || 'Failed to update account status.');
    }
  };

  // Handler for Role Change
  const handleConfirmRoleChange = () => {
    if (!roleChangeModal) return;
    if (!roleChangeReason.trim()) {
      showToast('error', 'A justification reason is required to modify account role.');
      return;
    }

    const res = updateUserRole(roleChangeModal.user.id, roleChangeModal.newRole, roleChangeReason.trim());
    if (res.success) {
      showToast(
        'success',
        `Role for ${roleChangeModal.user.name} updated to ${roleChangeModal.newRole.toUpperCase()}.`
      );
      setRoleChangeModal(null);
      setRoleChangeReason('');
    } else {
      showToast('error', res.error || 'Failed to update user role.');
    }
  };

  // Handler for Scope Change
  const handleConfirmScopeChange = () => {
    if (!scopeChangeModal) return;
    if (!scopeChangeReason.trim()) {
      showToast('error', 'A reason is required to update scope associations.');
      return;
    }

    const res = updateUserScope(
      scopeChangeModal.user.id,
      {
        department: scopeChangeModal.department,
        club: scopeChangeModal.club,
      },
      scopeChangeReason.trim()
    );

    if (res.success) {
      showToast('success', `Scope associations updated for ${scopeChangeModal.user.name}.`);
      setScopeChangeModal(null);
      setScopeChangeReason('');
    } else {
      showToast('error', res.error || 'Failed to update user scope.');
    }
  };

  // Handler for Facility Operating Hours Update
  const handleConfirmFacilityHours = () => {
    if (!facilityHoursModal) return;
    if (!facilityHoursReason.trim()) {
      showToast('error', 'A justification reason is required to modify facility operating hours.');
      return;
    }

    const weekdaysStr = `${facilityHoursModal.open} - ${facilityHoursModal.close}`;
    const res = updateFacilityHours(
      facilityHoursModal.facility.id,
      {
        open: facilityHoursModal.open,
        close: facilityHoursModal.close,
      },
      facilityHoursReason.trim()
    );

    if (res.success) {
      showToast(
        'success',
        `Operating hours for ${facilityHoursModal.facility.name} updated to ${weekdaysStr}.`
      );
      setFacilityHoursModal(null);
      setFacilityHoursReason('');
    } else {
      showToast('error', res.error || 'Failed to update operating hours.');
    }
  };

  // Handler to open secure temporary document URL
  const handleViewIdDocument = async (user: DemoUser) => {
    const docPath = user.idProofUrl || user.idProofFilename;
    if (!docPath) {
      showToast('error', 'No document on file for this user account.');
      return;
    }

    try {
      const res = await fetch(`/api/auth/document-url?path=${encodeURIComponent(docPath)}&role=admin`);
      const data = await res.json();

      if (res.ok && data.url) {
        setViewingDocument({
          userName: user.name,
          filename: data.filename,
          signedUrl: data.url,
          expiresIn: data.expiresInSeconds || 300,
        });
      } else {
        showToast('error', data.error || 'Could not generate secure document link.');
      }
    } catch {
      showToast('error', 'Network error fetching secure document link.');
    }
  };

  // Verification Counts
  const pendingVerificationsCount = applicants.filter((a) => a.verificationStatus === 'pending').length;
  const suspendedAccountsCount = allUsers.filter((u) => u.accountStatus === 'suspended').length;

  return (
    <div className="space-y-6 animate-page-enter">
      {/* Toast Feedback */}
      {feedbackToast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg text-xs font-semibold ${
            feedbackToast.type === 'success'
              ? 'bg-white border-campus-blue text-campus-blue'
              : 'bg-white border-campus-red text-campus-red'
          }`}
        >
          {feedbackToast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{feedbackToast.message}</span>
        </div>
      )}

      {/* Top Header: Natural language, compact */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-neutral-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950">
            Admin overview.
          </h1>
          <p className="text-sm text-neutral-600 mt-1">
            Requests across the campus.
          </p>
        </div>

        {/* Active Admin Badge */}
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-neutral-50 border border-neutral-200">
          <div className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-neutral-950">{currentAdminLabel}</span>
              <span className="text-[10px] font-semibold bg-campus-blue/10 text-campus-blue px-2 py-0.5 rounded-full border border-campus-blue/20">
                {currentAdminSlot === 'admin' ? 'SYSTEM' : currentAdminSlot.toUpperCase()}
              </span>
            </div>
            <p className="text-[11px] text-neutral-500">Dual-authenticated administrator</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-full bg-neutral-100 border border-neutral-200">
        <button
          type="button"
          onClick={() => setActiveTab('access')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
            activeTab === 'access'
              ? 'bg-white text-neutral-950 shadow-sm'
              : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-200/50'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>User Directory</span>
          {pendingVerificationsCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-campus-purple text-white">
              {pendingVerificationsCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bookings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
            activeTab === 'bookings'
              ? 'bg-white text-neutral-950 shadow-sm'
              : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-200/50'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Override Approvals</span>
          <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-neutral-200 text-neutral-700">
            {bookings.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('activity')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
            activeTab === 'activity'
              ? 'bg-white text-neutral-950 shadow-sm'
              : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-200/50'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Audit Logs</span>
          <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-neutral-200 text-neutral-700">
            {auditLogs.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('facilities')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
            activeTab === 'facilities'
              ? 'bg-white text-neutral-950 shadow-sm'
              : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-200/50'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>System Facilities</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
            activeTab === 'overview'
              ? 'bg-white text-neutral-950 shadow-sm'
              : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-200/50'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Overview</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ACCESS MANAGEMENT SCREEN                                           */}
      {/* ========================================================================= */}
      {activeTab === 'access' && (
        <div className="space-y-6">
          {/* Restrained metric strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white border border-neutral-200 shadow-sm">
              <p className="text-xs font-medium text-neutral-600">Total User Accounts</p>
              <p className="text-2xl font-bold text-neutral-950 mt-1">{allUsers.length}</p>
              <p className="text-[11px] text-neutral-500 mt-0.5">Across all roles</p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-neutral-200 shadow-sm">
              <p className="text-xs font-medium text-campus-purple">Pending Verification</p>
              <p className="text-2xl font-bold text-campus-purple mt-1">{pendingVerificationsCount}</p>
              <p className="text-[11px] text-neutral-500 mt-0.5">Awaiting credential review</p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-neutral-200 shadow-sm">
              <p className="text-xs font-medium text-campus-blue">Active Accounts</p>
              <p className="text-2xl font-bold text-campus-blue mt-1">
                {allUsers.filter((u) => u.accountStatus !== 'suspended').length}
              </p>
              <p className="text-[11px] text-neutral-500 mt-0.5">Authorized for portal access</p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-neutral-200 shadow-sm">
              <p className="text-xs font-medium text-campus-red">Suspended Accounts</p>
              <p className="text-2xl font-bold text-campus-red mt-1">{suspendedAccountsCount}</p>
              <p className="text-[11px] text-neutral-500 mt-0.5">Access revoked by admin</p>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3.5 rounded-xl border border-neutral-200 shadow-sm">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search user by name, email, department, or club..."
                className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-lg bg-neutral-50 border border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-campus-blue focus:border-campus-blue"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="text-xs px-3 py-1.5 rounded-lg bg-neutral-50 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-1 focus:ring-campus-blue focus:border-campus-blue"
              >
                <option value="all">All Roles</option>
                <option value="admin">Administrators</option>
                <option value="principal">Principal</option>
                <option value="registrar">Registrar</option>
                <option value="hod">HOD (Department Head)</option>
                <option value="requester">Club Requester</option>
              </select>

              <select
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value)}
                className="text-xs px-3 py-1.5 rounded-lg bg-neutral-50 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-1 focus:ring-campus-blue focus:border-campus-blue"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="suspended">Suspended Only</option>
              </select>
            </div>
          </div>

          {/* Users Access Table */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-neutral-700">
                <thead className="bg-neutral-50 border-b border-neutral-200 text-xs font-semibold text-neutral-600">
                  <tr>
                    <th className="px-5 py-3.5">User Identity</th>
                    <th className="px-5 py-3.5">Verified Role</th>
                    <th className="px-5 py-3.5">Assigned Scope</th>
                    <th className="px-5 py-3.5">Account Status</th>
                    <th className="px-5 py-3.5">Verification & ID</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 bg-white">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-neutral-500">
                        No user accounts found matching your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isSelf = u.id === currentUser.id;
                      const isAdmin = u.role === 'admin';
                      const isSuspended = u.accountStatus === 'suspended';

                      return (
                        <tr key={u.id} className="hover:bg-neutral-50 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <span className="w-7 h-7 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-xs font-bold text-neutral-700">
                                {u.avatar || u.name.charAt(0)}
                              </span>
                              <div>
                                <p className="font-bold text-neutral-950 flex items-center gap-1.5">
                                  <span>{u.name}</span>
                                  {isAdmin && (
                                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-700 border border-neutral-300">
                                      {u.adminIdentifier?.toUpperCase() || 'ADMIN'}
                                    </span>
                                  )}
                                </p>
                                <p className="text-[11px] text-neutral-500">{u.email || u.username}</p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                u.role === 'admin'
                                  ? 'bg-neutral-100 text-neutral-900 border border-neutral-300'
                                  : u.role === 'principal' || u.role === 'registrar'
                                  ? 'bg-campus-blue/10 text-campus-blue border border-campus-blue/20'
                                  : u.role === 'hod'
                                  ? 'bg-campus-purple/10 text-campus-purple border border-campus-purple/20'
                                  : 'bg-neutral-100 text-neutral-700 border border-neutral-200'
                              }`}
                            >
                              {u.role.toUpperCase()}
                            </span>
                          </td>

                          <td className="px-5 py-3.5">
                            <div>
                              {u.department && (
                                <p className="font-semibold text-neutral-900">{u.department}</p>
                              )}
                              {u.club && <p className="text-[11px] text-neutral-500">Club: {u.club}</p>}
                              {!u.department && !u.club && (
                                <span className="text-neutral-400 italic">Campus-wide</span>
                              )}
                            </div>
                          </td>

                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                isSuspended
                                  ? 'bg-campus-red/10 text-campus-red border border-campus-red/20'
                                  : 'bg-campus-blue/10 text-campus-blue border border-campus-blue/20'
                              }`}
                            >
                              {isSuspended ? (
                                <>
                                  <XCircle className="w-3 h-3 text-campus-red" />
                                  Suspended
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-3 h-3 text-campus-blue" />
                                  Active
                                </>
                              )}
                            </span>
                          </td>

                          <td className="px-5 py-3.5">
                            <div className="space-y-1">
                              <span
                                className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                                  u.verificationStatus === 'approved'
                                    ? 'text-campus-blue'
                                    : u.verificationStatus === 'rejected'
                                    ? 'text-campus-red'
                                    : 'text-campus-purple'
                                }`}
                              >
                                {u.verificationStatus === 'approved'
                                  ? 'Approved'
                                  : u.verificationStatus === 'rejected'
                                  ? 'Rejected'
                                  : 'Pending'}
                              </span>

                              {(u.idProofUrl || u.idProofFilename) && (
                                <div>
                                  <button
                                    type="button"
                                    onClick={() => handleViewIdDocument(u)}
                                    className="inline-flex items-center gap-1 text-[11px] text-campus-blue hover:underline font-medium"
                                  >
                                    <FileText className="w-3 h-3" />
                                    <span>View ID</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>

                          <td className="px-5 py-3.5 text-right">
                            {isAdmin ? (
                              <span className="text-[11px] text-neutral-400 italic">
                                Protected Admin
                              </span>
                            ) : (
                              <div className="inline-flex items-center gap-1.5">
                                {/* Role Change */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    setRoleChangeModal({
                                      user: u,
                                      newRole: u.role,
                                    })
                                  }
                                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-200 transition-colors"
                                >
                                  Role
                                </button>

                                {/* Scope Change */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    setScopeChangeModal({
                                      user: u,
                                      department: u.department || '',
                                      club: u.club || '',
                                    })
                                  }
                                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-200 transition-colors"
                                >
                                  Scope
                                </button>

                                {/* Suspend / Restore */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    setStatusChangeModal({
                                      user: u,
                                      newStatus: isSuspended ? 'active' : 'suspended',
                                    })
                                  }
                                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                                    isSuspended
                                      ? 'bg-campus-blue/10 hover:bg-campus-blue/20 text-campus-blue border-campus-blue/20'
                                      : 'bg-campus-red/10 hover:bg-campus-red/20 text-campus-red border-campus-red/20'
                                  }`}
                                >
                                  {isSuspended ? 'Restore' : 'Suspend'}
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ALL BOOKINGS & ADMINISTRATOR OVERRIDES                              */}
      {/* ========================================================================= */}
      {activeTab === 'bookings' && (
        <div className="space-y-6">
          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3.5 rounded-xl border border-neutral-200 shadow-sm">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={bookingSearch}
                onChange={(e) => setBookingSearch(e.target.value)}
                placeholder="Search booking ref, event title, requester, or facility..."
                className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-lg bg-neutral-50 border border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-campus-blue focus:border-campus-blue"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={bookingFacilityFilter}
                onChange={(e) => setBookingFacilityFilter(e.target.value)}
                className="text-xs px-3 py-1.5 rounded-lg bg-neutral-50 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-1 focus:ring-campus-blue focus:border-campus-blue"
              >
                <option value="all">All Facilities</option>
                {facilities.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>

              <select
                value={bookingStatusFilter}
                onChange={(e) => setBookingStatusFilter(e.target.value)}
                className="text-xs px-3 py-1.5 rounded-lg bg-neutral-50 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-1 focus:ring-campus-blue focus:border-campus-blue"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Waiting for approval</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Bookings List with Explicit Admin Overrides */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-neutral-700">
                <thead className="bg-neutral-50 border-b border-neutral-200 text-xs font-semibold text-neutral-600">
                  <tr>
                    <th className="px-5 py-3.5">Booking Reference</th>
                    <th className="px-5 py-3.5">Event & Requester</th>
                    <th className="px-5 py-3.5">Facility & Interval</th>
                    <th className="px-5 py-3.5">Approval Status</th>
                    <th className="px-5 py-3.5">Hall Pass</th>
                    <th className="px-5 py-3.5 text-right">Admin Override</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 bg-white">
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-neutral-500">
                        No bookings found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map((b) => {
                      const isApproved = b.status === 'approved';
                      const isRejected = b.status === 'rejected';
                      const isCancelled = b.status === 'cancelled';

                      return (
                        <tr key={b.id} className="hover:bg-neutral-50 transition-colors">
                          <td className="px-5 py-3.5">
                            <span className="font-mono font-bold text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
                              {b.bookingRef}
                            </span>
                            <p className="text-[11px] text-neutral-500 mt-1">
                              {formatIstDate(b.date)}
                            </p>
                          </td>

                          <td className="px-5 py-3.5">
                            <div>
                              <p className="font-bold text-neutral-950">{b.eventName}</p>
                              <p className="text-[11px] text-neutral-600">
                                {b.requesterName} • <span className="font-medium text-neutral-900">{b.clubName || b.department}</span>
                              </p>
                              <p className="text-[10px] text-neutral-500">{b.attendeeCount} attendees</p>
                            </div>
                          </td>

                          <td className="px-5 py-3.5">
                            <div>
                              <p className="font-bold text-neutral-950">{b.facilityName}</p>
                              <p className="text-[11px] font-mono text-neutral-600">
                                {formatIstTime(b.startTime)} - {formatIstTime(b.endTime)} IST
                              </p>
                              <span className="text-[10px] uppercase font-semibold text-neutral-400">
                                {b.facilityCategory || 'Venue'}
                              </span>
                            </div>
                          </td>

                          <td className="px-5 py-3.5">
                            <div className="space-y-1">
                              {isApproved ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-campus-blue/10 text-campus-blue border border-campus-blue/20">
                                  <CheckCircle2 className="w-3 h-3 text-campus-blue" />
                                  Approved
                                </span>
                              ) : isRejected ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-campus-red/10 text-campus-red border border-campus-red/20">
                                  <XCircle className="w-3 h-3 text-campus-red" />
                                  Rejected
                                </span>
                              ) : isCancelled ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-neutral-100 text-neutral-700 border border-neutral-200">
                                  Cancelled
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-campus-purple/10 text-campus-purple border border-campus-purple/20">
                                  <Clock className="w-3 h-3 text-campus-purple" />
                                  Waiting for approval
                                </span>
                              )}

                              {b.adminOverride && (
                                <div className="text-[10px] font-medium text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
                                  Override by {b.adminOverride.performedBy}
                                </div>
                              )}
                            </div>
                          </td>

                          <td className="px-5 py-3.5">
                            {isApproved ? (
                              <Link
                                href={`/pass/${b.id}`}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-campus-blue hover:text-blue-700 bg-campus-blue/10 px-2.5 py-1 rounded-full border border-campus-blue/20 transition-colors"
                              >
                                <QrCode className="w-3.5 h-3.5 text-campus-blue" />
                                Hall Pass
                              </Link>
                            ) : (
                              <span className="text-[11px] text-neutral-400 italic">No Pass</span>
                            )}
                          </td>

                          <td className="px-5 py-3.5 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              {/* Override Approve */}
                              {!isApproved && (
                                <button
                                  type="button"
                                  onClick={() => setOverrideModal({ booking: b, action: 'approve' })}
                                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-campus-blue/10 hover:bg-campus-blue/20 text-campus-blue border border-campus-blue/20 transition-colors"
                                  title="Approve booking via admin override"
                                >
                                  Approve
                                </button>
                              )}

                              {/* Override Reject */}
                              {!isRejected && !isCancelled && (
                                <button
                                  type="button"
                                  onClick={() => setOverrideModal({ booking: b, action: 'reject' })}
                                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-campus-red/10 hover:bg-campus-red/20 text-campus-red border border-campus-red/20 transition-colors"
                                  title="Reject booking via admin override"
                                >
                                  Reject
                                </button>
                              )}

                              {/* Override Cancel */}
                              {!isCancelled && (
                                <button
                                  type="button"
                                  onClick={() => setOverrideModal({ booking: b, action: 'cancel' })}
                                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-200 transition-colors"
                                  title="Cancel booking via admin override"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ACTIVITY LOG SCREEN                                                */}
      {/* ========================================================================= */}
      {activeTab === 'activity' && (
        <div className="space-y-6">
          {/* Header Note */}
          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 flex items-start gap-3">
            <Activity className="w-5 h-5 text-neutral-900 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h2 className="text-xs font-bold text-neutral-950">
                Audit history
              </h2>
              <p className="text-[11px] text-neutral-600 leading-relaxed">
                Immutable audit history tracking actions across Student Clubs, HODs, Principal, Registrar, and Administrators. Sensitive credentials are never logged.
              </p>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3.5 rounded-xl border border-neutral-200 shadow-sm">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                placeholder="Search activity by actor, booking ref, affected entity, or reason..."
                className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-lg bg-neutral-50 border border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-campus-blue focus:border-campus-blue"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <select
                value={logRoleFilter}
                onChange={(e) => setLogRoleFilter(e.target.value)}
                className="text-xs px-3 py-1.5 rounded-lg bg-neutral-50 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-1 focus:ring-campus-blue focus:border-campus-blue"
              >
                <option value="all">All Roles</option>
                <option value="admin">Administrators</option>
                <option value="principal">Principal</option>
                <option value="registrar">Registrar</option>
                <option value="hod">HOD</option>
                <option value="requester">Requester</option>
              </select>

              <select
                value={logActionFilter}
                onChange={(e) => setLogActionFilter(e.target.value)}
                className="text-xs px-3 py-1.5 rounded-lg bg-neutral-50 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-1 focus:ring-campus-blue focus:border-campus-blue"
              >
                <option value="all">All Actions</option>
                <option value="ADMIN_OVERRIDE_APPROVE">Admin Override Approve</option>
                <option value="ADMIN_OVERRIDE_REJECT">Admin Override Reject</option>
                <option value="ADMIN_OVERRIDE_CANCEL">Admin Override Cancel</option>
                <option value="APPROVED">Standard Approvals</option>
                <option value="REJECTED">Standard Rejections</option>
                <option value="ACCESS_SUSPENDED">Access Suspended</option>
                <option value="ACCESS_RESTORED">Access Restored</option>
                <option value="ROLE_UPDATED">Role Updated</option>
              </select>

              <select
                value={logDateFilter}
                onChange={(e) => setLogDateFilter(e.target.value)}
                className="text-xs px-3 py-1.5 rounded-lg bg-neutral-50 border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-1 focus:ring-campus-blue focus:border-campus-blue"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
              </select>
            </div>
          </div>

          {/* Activity Log Table */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-neutral-700">
                <thead className="bg-neutral-50 border-b border-neutral-200 text-xs font-semibold text-neutral-600">
                  <tr>
                    <th className="px-5 py-3.5">Timestamp</th>
                    <th className="px-5 py-3.5">Actor</th>
                    <th className="px-5 py-3.5">Action Executed</th>
                    <th className="px-5 py-3.5">Affected Target</th>
                    <th className="px-5 py-3.5">Outcome</th>
                    <th className="px-5 py-3.5">Recorded Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 bg-white">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-neutral-500">
                        No activity records found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => {
                      const isOverride = log.action.startsWith('ADMIN_OVERRIDE');

                      return (
                        <tr key={log.id} className="hover:bg-neutral-50 transition-colors">
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <span className="font-mono text-xs text-neutral-950 block">
                              {new Date(log.timestamp).toLocaleDateString()}
                            </span>
                            <span className="text-[10px] text-neutral-500">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                          </td>

                          <td className="px-5 py-3.5">
                            <div>
                              <p className="font-bold text-neutral-950 flex items-center gap-1.5">
                                <span>{log.performedBy}</span>
                                {log.actorAdmin && (
                                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 bg-neutral-100 text-neutral-700 border border-neutral-200 rounded">
                                    {log.actorAdmin === 'admin2' ? 'Admin 2' : 'Admin 1'}
                                  </span>
                                )}
                              </p>
                              <span className="text-[10px] uppercase font-semibold text-neutral-500">
                                {log.role.replace('_', ' ')}
                              </span>
                            </div>
                          </td>

                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                isOverride
                                  ? 'bg-campus-purple/10 text-campus-purple border border-campus-purple/20'
                                  : log.action === 'APPROVED'
                                  ? 'bg-campus-blue/10 text-campus-blue border border-campus-blue/20'
                                  : log.action === 'REJECTED' || log.action === 'ACCESS_SUSPENDED'
                                  ? 'bg-campus-red/10 text-campus-red border border-campus-red/20'
                                  : 'bg-neutral-100 text-neutral-700 border border-neutral-200'
                              }`}
                            >
                              {log.action.replace(/_/g, ' ')}
                            </span>
                          </td>

                          <td className="px-5 py-3.5">
                            <p className="font-semibold text-neutral-950">
                              {log.affectedEntity || log.bookingRef || 'System'}
                            </p>
                            {log.bookingRef && log.affectedEntity !== log.bookingRef && (
                              <p className="font-mono text-[10px] text-neutral-500">Ref: {log.bookingRef}</p>
                            )}
                          </td>

                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                log.outcome === 'FAILED'
                                  ? 'bg-campus-red/10 text-campus-red border border-campus-red/20'
                                  : 'bg-campus-blue/10 text-campus-blue border border-campus-blue/20'
                              }`}
                            >
                              {log.outcome === 'FAILED' ? (
                                <X className="w-2.5 h-2.5 text-campus-red" />
                              ) : (
                                <Check className="w-2.5 h-2.5 text-campus-blue" />
                              )}
                              {log.outcome || 'SUCCESS'}
                            </span>
                          </td>

                          <td className="px-5 py-3.5 max-w-xs">
                            <p className="text-xs text-neutral-600 line-clamp-2" title={log.reason}>
                              {log.reason || 'Routine operational update.'}
                            </p>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: FACILITIES & OPERATING HOURS                                       */}
      {/* ========================================================================= */}
      {activeTab === 'facilities' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 flex items-start gap-3">
            <Building className="w-5 h-5 text-neutral-900 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h2 className="text-xs font-bold text-neutral-950">
                Campus Facilities & Operating Schedules Governance
              </h2>
              <p className="text-[11px] text-neutral-600 leading-relaxed">
                Configure facility status (maintenance vs operational) and verify operating window boundaries. Overlapping bookings are blocked automatically.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {facilities.map((fac) => {
              const isMaintenance = fac.status === 'maintenance';

              return (
                <div
                  key={fac.id}
                  className={`p-5 rounded-xl bg-white border transition-all shadow-sm ${
                    isMaintenance ? 'border-campus-red/30' : 'border-neutral-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
                        {fac.code}
                      </span>
                      <h3 className="font-bold text-sm text-neutral-950 mt-1">{fac.name}</h3>
                      <p className="text-[11px] text-neutral-500">
                        {fac.building} • Floor {fac.floor}
                      </p>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isMaintenance
                          ? 'bg-campus-red/10 text-campus-red border border-campus-red/20'
                          : 'bg-campus-blue/10 text-campus-blue border border-campus-blue/20'
                      }`}
                    >
                      {isMaintenance ? 'Maintenance' : 'Operational'}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-neutral-600 py-3 border-y border-neutral-200">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Capacity:</span>
                      <span className="font-semibold text-neutral-950">{fac.capacity} attendees</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Category:</span>
                      <span className="font-semibold text-neutral-950 uppercase">{fac.category || fac.type}</span>
                    </div>
                    {fac.department && (
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Department:</span>
                        <span className="font-semibold text-neutral-950 truncate max-w-[160px]">
                          {fac.department}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Operating Hours:</span>
                      <span className="font-semibold text-neutral-950 font-mono">
                        {fac.operatingHours?.weekdays || '08:00 - 20:00'}
                      </span>
                    </div>
                  </div>

                  {/* Administrative Action Controls */}
                  <div className="mt-4 pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const newStatus = isMaintenance ? 'operational' : 'maintenance';
                        const reason = prompt(
                          `Please state the reason for marking ${fac.name} as ${newStatus}:`,
                          isMaintenance ? 'Maintenance work concluded.' : 'Scheduled infrastructure maintenance.'
                        );
                        if (reason && reason.trim()) {
                          updateFacilityStatus(fac.id, newStatus, reason.trim());
                          showToast('success', `${fac.name} status updated to ${newStatus}.`);
                        }
                      }}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors border ${
                        isMaintenance
                          ? 'bg-campus-blue/10 hover:bg-campus-blue/20 text-campus-blue border-campus-blue/20'
                          : 'bg-campus-red/10 hover:bg-campus-red/20 text-campus-red border-campus-red/20'
                      }`}
                    >
                      {isMaintenance ? 'Mark Operational' : 'Put to Maintenance'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const current = fac.operatingHours?.weekdays?.split(' - ') || ['08:00', '20:00'];
                        setFacilityHoursModal({
                          facility: fac,
                          open: current[0] || '08:00',
                          close: current[1] || '20:00',
                        });
                      }}
                      className="py-1.5 px-3 rounded-lg text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-200 transition-colors"
                    >
                      Hours
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: SYSTEM OVERVIEW & EXECUTIVE ANALYTICS                              */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-6 rounded-xl bg-white border border-neutral-200 shadow-sm space-y-3">
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Bookings Overview</p>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-neutral-950">{bookings.length}</p>
                <p className="text-xs text-neutral-500">Total booking requests recorded</p>
              </div>
              <div className="space-y-1.5 pt-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-campus-blue font-medium">Approved:</span>
                  <span className="font-bold text-neutral-950">{bookings.filter((b) => b.status === 'approved').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-campus-purple font-medium">Waiting for approval:</span>
                  <span className="font-bold text-neutral-950">{bookings.filter((b) => b.status === 'pending').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-campus-red font-medium">Rejected / Cancelled:</span>
                  <span className="font-bold text-neutral-950">{bookings.filter((b) => b.status === 'rejected' || b.status === 'cancelled').length}</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-xl bg-white border border-neutral-200 shadow-sm space-y-3">
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Campus Accounts</p>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-neutral-950">{allUsers.length}</p>
                <p className="text-xs text-neutral-500">Registered and provisioned users</p>
              </div>
              <div className="space-y-1.5 pt-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Student Requesters:</span>
                  <span className="font-bold text-neutral-950">{allUsers.filter((u) => u.role === 'requester').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Department HODs:</span>
                  <span className="font-bold text-neutral-950">{allUsers.filter((u) => u.role === 'hod').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Principal & Registrar:</span>
                  <span className="font-bold text-neutral-950">
                    {allUsers.filter((u) => u.role === 'principal' || u.role === 'registrar').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-campus-purple font-medium">Designated Admins:</span>
                  <span className="font-bold text-neutral-950">2 (Equal Authority)</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-xl bg-white border border-neutral-200 shadow-sm space-y-3">
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Facilities Online</p>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-neutral-950">{facilities.length}</p>
                <p className="text-xs text-neutral-500">Total physical campus venues</p>
              </div>
              <div className="space-y-1.5 pt-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-campus-blue font-medium">Operational:</span>
                  <span className="font-bold text-neutral-950">
                    {facilities.filter((f) => f.status === 'operational').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-campus-red font-medium">In Maintenance:</span>
                  <span className="font-bold text-neutral-950">
                    {facilities.filter((f) => f.status === 'maintenance').length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-white border border-neutral-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-sm text-neutral-950">Request Analytics Page</h3>
              <p className="text-xs text-neutral-600 mt-0.5">
                View detailed facility demand charts, day-of-week distribution, and booking metrics.
              </p>
            </div>
            <BubbleButton href="/analytics" variant="primary" size="md">
              Open Request Analytics
            </BubbleButton>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADMIN OVERRIDE CONFIRMATION                                      */}
      {/* ========================================================================= */}
      {overrideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="max-w-md w-full bg-white rounded-2xl p-6 border border-neutral-200 shadow-xl animate-dialog-enter space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-campus-blue" />
                <h3 className="font-bold text-sm text-neutral-950">
                  Administrative Override: {overrideModal.action.toUpperCase()}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOverrideModal(null)}
                className="p-1 rounded-full text-neutral-400 hover:text-neutral-950 hover:bg-neutral-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-700 space-y-1">
              <p className="font-semibold text-neutral-950">
                Booking Reference: {overrideModal.booking.bookingRef} ({overrideModal.booking.eventName})
              </p>
              <p className="text-neutral-600">
                Facility: {overrideModal.booking.facilityName} • {formatIstDate(overrideModal.booking.date)}
              </p>
              <p className="text-[11px] text-neutral-500">
                Attributed to <span className="font-semibold text-neutral-950">{currentAdminLabel}</span>.
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="override-reason-input" className="block text-xs font-semibold text-neutral-700">
                Override Justification Reason <span className="text-campus-red">*</span>
              </label>
              <textarea
                id="override-reason-input"
                rows={3}
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="State the institutional justification for this administrative override..."
                className="w-full p-2.5 rounded-lg bg-neutral-50 border border-neutral-300 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-campus-blue focus:border-campus-blue"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <BubbleButton
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setOverrideModal(null)}
              >
                Cancel
              </BubbleButton>

              <BubbleButton
                onClick={handleConfirmOverride}
                variant={overrideModal.action === 'approve' ? 'primary' : 'danger'}
                size="sm"
              >
                Confirm {overrideModal.action.toUpperCase()}
              </BubbleButton>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: SUSPEND / RESTORE CONFIRMATION                                   */}
      {/* ========================================================================= */}
      {statusChangeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="max-w-md w-full bg-white rounded-2xl p-6 border border-neutral-200 shadow-xl animate-dialog-enter space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-campus-red" />
                <h3 className="font-bold text-sm text-neutral-950">
                  {statusChangeModal.newStatus === 'suspended' ? 'Suspend Account Access' : 'Restore Account Access'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setStatusChangeModal(null)}
                className="p-1 rounded-full text-neutral-400 hover:text-neutral-950 hover:bg-neutral-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              {statusChangeModal.newStatus === 'suspended'
                ? `Suspending ${statusChangeModal.user.name} will immediately block portal sign-in and invalidate subsequent operations.`
                : `Restoring ${statusChangeModal.user.name} will grant access back to their authorized role.`}
            </p>

            <div className="space-y-1.5">
              <label htmlFor="status-reason-input" className="block text-xs font-semibold text-neutral-700">
                Reason for Access Modification <span className="text-campus-red">*</span>
              </label>
              <textarea
                id="status-reason-input"
                rows={2}
                value={statusChangeReason}
                onChange={(e) => setStatusChangeReason(e.target.value)}
                placeholder="State the official reason..."
                className="w-full p-2.5 rounded-lg bg-neutral-50 border border-neutral-300 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-campus-blue focus:border-campus-blue"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <BubbleButton
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setStatusChangeModal(null)}
              >
                Cancel
              </BubbleButton>

              <BubbleButton
                onClick={handleConfirmStatusChange}
                variant={statusChangeModal.newStatus === 'suspended' ? 'danger' : 'primary'}
                size="sm"
              >
                Confirm {statusChangeModal.newStatus === 'suspended' ? 'Suspension' : 'Restoration'}
              </BubbleButton>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ROLE CHANGE CONFIRMATION                                         */}
      {/* ========================================================================= */}
      {roleChangeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="max-w-md w-full bg-white rounded-2xl p-6 border border-neutral-200 shadow-xl animate-dialog-enter space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-campus-blue" />
                <h3 className="font-bold text-sm text-neutral-950">
                  Modify Role for {roleChangeModal.user.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRoleChangeModal(null)}
                className="p-1 rounded-full text-neutral-400 hover:text-neutral-950 hover:bg-neutral-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="select-role-input" className="block text-xs font-semibold text-neutral-700">
                Select Supported Role
              </label>
              <select
                id="select-role-input"
                value={roleChangeModal.newRole}
                onChange={(e) => setRoleChangeModal({ ...roleChangeModal, newRole: e.target.value as Role })}
                className="w-full p-2 rounded-lg bg-neutral-50 border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-campus-blue focus:border-campus-blue"
              >
                <option value="requester">Club Requester</option>
                <option value="hod">Head of Department (HOD)</option>
                <option value="principal">Principal</option>
                <option value="registrar">Registrar</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="role-reason-input" className="block text-xs font-semibold text-neutral-700">
                Reason for Role Modification <span className="text-campus-red">*</span>
              </label>
              <textarea
                id="role-reason-input"
                rows={2}
                value={roleChangeReason}
                onChange={(e) => setRoleChangeReason(e.target.value)}
                placeholder="State the reason for this administrative role change..."
                className="w-full p-2.5 rounded-lg bg-neutral-50 border border-neutral-300 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-campus-blue focus:border-campus-blue"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <BubbleButton
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setRoleChangeModal(null)}
              >
                Cancel
              </BubbleButton>

              <BubbleButton onClick={handleConfirmRoleChange} variant="primary" size="sm">
                Save Role
              </BubbleButton>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: SCOPE CHANGE                                                     */}
      {/* ========================================================================= */}
      {scopeChangeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="max-w-md w-full bg-white rounded-2xl p-6 border border-neutral-200 shadow-xl animate-dialog-enter space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-neutral-950">
                Update Scope for {scopeChangeModal.user.name}
              </h3>
              <button
                type="button"
                onClick={() => setScopeChangeModal(null)}
                className="p-1 rounded-full text-neutral-400 hover:text-neutral-950 hover:bg-neutral-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label htmlFor="scope-dept-input" className="block text-xs font-semibold text-neutral-700">
                  Department Association
                </label>
                <input
                  id="scope-dept-input"
                  type="text"
                  value={scopeChangeModal.department}
                  onChange={(e) => setScopeChangeModal({ ...scopeChangeModal, department: e.target.value })}
                  className="w-full p-2 rounded-lg bg-neutral-50 border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-campus-blue focus:border-campus-blue"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="scope-club-input" className="block text-xs font-semibold text-neutral-700">
                  Club Association
                </label>
                <input
                  id="scope-club-input"
                  type="text"
                  value={scopeChangeModal.club}
                  onChange={(e) => setScopeChangeModal({ ...scopeChangeModal, club: e.target.value })}
                  className="w-full p-2 rounded-lg bg-neutral-50 border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-campus-blue focus:border-campus-blue"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="scope-reason-input" className="block text-xs font-semibold text-neutral-700">
                  Reason <span className="text-campus-red">*</span>
                </label>
                <input
                  id="scope-reason-input"
                  type="text"
                  value={scopeChangeReason}
                  onChange={(e) => setScopeChangeReason(e.target.value)}
                  placeholder="Reason for change..."
                  className="w-full p-2 rounded-lg bg-neutral-50 border border-neutral-300 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-campus-blue focus:border-campus-blue"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <BubbleButton
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setScopeChangeModal(null)}
              >
                Cancel
              </BubbleButton>

              <BubbleButton onClick={handleConfirmScopeChange} variant="primary" size="sm">
                Save Scope
              </BubbleButton>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: FACILITY OPERATING HOURS                                         */}
      {/* ========================================================================= */}
      {facilityHoursModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="max-w-md w-full bg-white rounded-2xl p-6 border border-neutral-200 shadow-xl animate-dialog-enter space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-neutral-950">
                Edit Operating Hours: {facilityHoursModal.facility.name}
              </h3>
              <button
                type="button"
                onClick={() => setFacilityHoursModal(null)}
                className="p-1 rounded-full text-neutral-400 hover:text-neutral-950 hover:bg-neutral-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="hours-open" className="block text-xs font-semibold text-neutral-700 mb-1">
                  Opening Time
                </label>
                <input
                  id="hours-open"
                  type="time"
                  value={facilityHoursModal.open}
                  onChange={(e) => setFacilityHoursModal({ ...facilityHoursModal, open: e.target.value })}
                  className="w-full p-2 rounded-lg bg-neutral-50 border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-campus-blue focus:border-campus-blue"
                />
              </div>
              <div>
                <label htmlFor="hours-close" className="block text-xs font-semibold text-neutral-700 mb-1">
                  Closing Time
                </label>
                <input
                  id="hours-close"
                  type="time"
                  value={facilityHoursModal.close}
                  onChange={(e) => setFacilityHoursModal({ ...facilityHoursModal, close: e.target.value })}
                  className="w-full p-2 rounded-lg bg-neutral-50 border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-campus-blue focus:border-campus-blue"
                />
              </div>
            </div>

            <div>
              <label htmlFor="hours-reason" className="block text-xs font-semibold text-neutral-700 mb-1">
                Reason for Hours Revision <span className="text-campus-red">*</span>
              </label>
              <input
                id="hours-reason"
                type="text"
                value={facilityHoursReason}
                onChange={(e) => setFacilityHoursReason(e.target.value)}
                placeholder="e.g. Extended campus hours for annual festival"
                className="w-full p-2 rounded-lg bg-neutral-50 border border-neutral-300 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-campus-blue focus:border-campus-blue"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <BubbleButton
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setFacilityHoursModal(null)}
              >
                Cancel
              </BubbleButton>
              <BubbleButton onClick={handleConfirmFacilityHours} variant="primary" size="sm">
                Save Operating Hours
              </BubbleButton>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: TEMPORARY SIGNED ID DOCUMENT VIEWER                              */}
      {/* ========================================================================= */}
      {viewingDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="max-w-lg w-full bg-white rounded-2xl p-6 border border-neutral-200 shadow-xl animate-dialog-enter space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-campus-blue" />
                <h3 className="font-bold text-sm text-neutral-950">
                  Temporary Authorized Document Access
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingDocument(null)}
                className="p-1 rounded-full text-neutral-400 hover:text-neutral-950 hover:bg-neutral-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2 text-xs">
              <p className="font-bold text-neutral-950">Applicant: {viewingDocument.userName}</p>
              <p className="text-neutral-600 font-mono text-[11px]">Filename: {viewingDocument.filename}</p>
              <div className="p-2.5 rounded-lg bg-campus-purple/10 text-[11px] text-campus-purple border border-campus-purple/20 leading-relaxed font-medium">
                Authorized temporary access link issued. Token expires automatically in {viewingDocument.expiresIn} seconds.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <BubbleButton
                href={viewingDocument.signedUrl}
                target="_blank"
                rel="noopener noreferrer"
                variant="primary"
                size="sm"
                icon={<ExternalLink className="w-3.5 h-3.5" />}
              >
                Open Secure Document
              </BubbleButton>
              <BubbleButton
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setViewingDocument(null)}
              >
                Close
              </BubbleButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

