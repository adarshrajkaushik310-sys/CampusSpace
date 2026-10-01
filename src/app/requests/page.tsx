'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCampusStore } from '@/lib/store';
import { WorkflowTracker } from '@/components/WorkflowTracker';
import { BubbleButton } from '@/components/BubbleButton';
import { formatIstDate, formatIstTime } from '@/lib/date-utils';
import { evaluateBookingStatus, getAuthorizedBookingsForUser } from '@/lib/approval-matrix';
import {
  BookmarkCheck,
  Search,
  Filter,
  QrCode,
  Calendar,
  Clock,
  Building,
  Users,
  AlertTriangle,
  XCircle,
  CalendarPlus,
  CheckCircle2,
  Hourglass,
  FlaskConical,
  RefreshCw,
  ShieldCheck,
  FileText,
} from 'lucide-react';

function MyRequestsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightedId = searchParams.get('highlight');
  const wasSubmitted = searchParams.get('submitted') === 'true';

  const { bookings, cancelBooking, currentUser, refreshData } = useCampusStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Refresh status when window/tab regains focus or explicitly triggered
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    if (refreshData) {
      await refreshData();
    }
    setLastRefreshed(new Date());
    setTimeout(() => setIsRefreshing(false), 400);
  }, [refreshData]);

  useEffect(() => {
    const handleFocus = () => {
      handleRefresh();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [handleRefresh]);

  // Privacy & Access Control Enforcement:
  // Requesters must not be able to view another person's private requests by manipulating URLs or query IDs.
  // We filter requests strictly by the authenticated user's actual assignments or submissions.
  const myBookings = getAuthorizedBookingsForUser(bookings, currentUser);

  const filteredBookings = myBookings.filter((b) => {
    const evalStatus = evaluateBookingStatus(b);
    const matchesSearch =
      b.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.bookingRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.facilityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.clubName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.labType && b.labType.toLowerCase().includes(searchQuery.toLowerCase()));

    const effectiveStatus = evalStatus.overallStatus;
    const matchesStatus = statusFilter === 'all' || effectiveStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleConfirmCancel = (id: string) => {
    cancelBooking(id, cancelReason || 'Cancelled by requester');
    setCancellingBookingId(null);
    setCancelReason('');
    handleRefresh();
  };

  const isApproverUser = currentUser?.role === 'principal' || currentUser?.role === 'registrar' || currentUser?.role === 'hod';

  return (
    <div className="space-y-6 animate-page-enter">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-neutral-500">
              Logged in as {currentUser?.name} ({currentUser?.role === 'requester' ? 'Club Requester' : currentUser?.role?.toUpperCase()})
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-950 tracking-tight flex items-center gap-2.5">
            <BookmarkCheck className="w-6 h-6 text-campus-purple" />
            My requests
          </h1>
          <p className="text-sm text-neutral-600 mt-1">
            Track requests, approvals, and bookings.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            title="Refresh status"
            className="p-2 rounded-full border border-neutral-300 bg-white text-neutral-700 hover:text-neutral-950 hover:bg-neutral-50 shadow-xs flex items-center gap-1.5 text-xs font-medium"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-campus-purple' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <BubbleButton
            href="/facilities"
            variant="primary"
            size="md"
            icon={<CalendarPlus className="w-4 h-4" />}
          >
            Book a facility
          </BubbleButton>
        </div>
      </div>

      {/* Approver Switcher Notice */}
      {isApproverUser && (
        <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-xs text-neutral-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-campus-purple flex-shrink-0" />
            <div>
              <p className="font-semibold text-neutral-950">Administrative approver access active</p>
              <p className="text-neutral-600 text-xs">
                You have approver privileges for assigned venue routes. Switch to the approvals queue to review requests.
              </p>
            </div>
          </div>
          <BubbleButton href="/approvals" variant="secondary" size="sm">
            Open approvals queue
          </BubbleButton>
        </div>
      )}

      {/* Submission Success Toast Banner */}
      {wasSubmitted && (
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-neutral-950 flex items-center justify-between animate-page-enter">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-campus-blue flex-shrink-0" />
            <span>
              <strong className="text-campus-blue">Booking request submitted.</strong> Your request has passed conflict checks and is now in review.
            </span>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by reference, facility, or club..."
            className="w-full pl-9 pr-4 py-1.5 rounded-full border border-neutral-300 text-xs text-neutral-950 bg-white placeholder-neutral-400 focus:outline-none focus:border-campus-blue focus:ring-1 focus:ring-campus-blue"
          />
        </div>

        {/* Clear Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 self-start md:self-auto">
          {[
            { id: 'all', label: 'All requests' },
            { id: 'pending', label: 'Waiting for approval' },
            { id: 'approved', label: 'Approved' },
            { id: 'rejected', label: 'Rejected' },
            { id: 'cancelled', label: 'Cancelled' },
            { id: 'completed', label: 'Completed' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setStatusFilter(item.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
                statusFilter === item.id
                  ? 'bg-campus-purple text-white'
                  : 'bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-100 hover:text-neutral-950'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center border border-neutral-200 shadow-sm space-y-3">
            <BookmarkCheck className="w-8 h-8 text-neutral-400 mx-auto" />
            <h3 className="font-semibold text-sm text-neutral-950">No requests found</h3>
            <p className="text-xs text-neutral-600 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'all'
                ? 'No submitted requests match your query or filter criteria.'
                : 'You have not submitted any campus facility booking requests yet.'}
            </p>
            <div className="pt-2">
              <BubbleButton href="/facilities" variant="primary" size="sm">
                Book a facility
              </BubbleButton>
            </div>
          </div>
        ) : (
          filteredBookings.map((booking) => {
            const isHighlighted = highlightedId === booking.id;
            const evalResult = evaluateBookingStatus(booking);
            const isApproved = evalResult.overallStatus === 'approved';
            const isPending = evalResult.overallStatus === 'pending';
            const isRejected = evalResult.overallStatus === 'rejected';
            const isCancelled = evalResult.overallStatus === 'cancelled';
            const isCompleted = evalResult.overallStatus === 'completed';
            const canCancel = isPending || (isApproved && new Date(booking.endUtc).getTime() > Date.now());

            const isLab = booking.facilityCategory === 'labs' || !!booking.labType;

            return (
              <div
                key={booking.id}
                className={`bg-white rounded-xl p-5 border transition-all ${
                  isHighlighted
                    ? 'border-campus-purple ring-1 ring-campus-purple shadow-sm'
                    : 'border-neutral-200 shadow-sm'
                }`}
              >
                {/* Request Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-neutral-100">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      {/* Booking Reference */}
                      <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-800 border border-neutral-200">
                        Ref: {booking.bookingRef}
                      </span>

                      {/* Facility & Lab Type Badge */}
                      <span className="text-xs font-medium text-campus-blue bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                        {booking.facilityName}
                        {booking.labType && ` (${booking.labType.replace(/_/g, ' ')})`}
                      </span>

                      {/* Requesting Club */}
                      <span className="text-xs text-neutral-600">
                        {booking.clubName}
                      </span>
                    </div>

                    <h3 className="text-base font-semibold text-neutral-950 tracking-tight">
                      {booking.eventName}
                    </h3>

                    {/* Reason / Purpose */}
                    <div className="mt-2 flex items-start gap-1.5 text-xs text-neutral-600 bg-neutral-50 p-2.5 rounded-lg border border-neutral-200">
                      <FileText className="w-3.5 h-3.5 text-neutral-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong className="text-neutral-900 font-medium">Reason: </strong>
                        <span>{booking.eventDescription || 'No description provided.'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Overall Status Badge */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 flex-shrink-0">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-0.5 text-xs font-medium rounded-full border ${
                        isApproved
                          ? 'bg-blue-50 text-campus-blue border-blue-200'
                          : isPending
                          ? 'bg-purple-50 text-campus-purple border-purple-200'
                          : isRejected
                          ? 'bg-red-50 text-campus-red border-red-200'
                          : isCompleted
                          ? 'bg-blue-50 text-campus-blue border-blue-200'
                          : 'bg-neutral-100 text-neutral-600 border-neutral-300'
                      }`}
                    >
                      {isApproved && <CheckCircle2 className="w-3.5 h-3.5 text-campus-blue" />}
                      {isPending && <Clock className="w-3.5 h-3.5 text-campus-purple" />}
                      {isRejected && <XCircle className="w-3.5 h-3.5 text-campus-red" />}
                      {isCancelled && <XCircle className="w-3.5 h-3.5 text-neutral-500" />}
                      {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-campus-blue" />}
                      {isApproved && 'Approved'}
                      {isPending && 'Waiting for approval'}
                      {isRejected && 'Rejected'}
                      {isCancelled && 'Cancelled'}
                      {isCompleted && 'Completed'}
                    </span>

                    <span className="text-[11px] text-neutral-400">
                      Submitted: {formatIstDate(booking.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Logistics Metadata Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-3 text-xs text-neutral-600 border-b border-neutral-100">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-neutral-900 block">
                        {booking.facilityName}
                      </span>
                      <span className="text-[11px] text-neutral-500">
                        {isLab ? `Department: ${booking.department || 'Academic'}` : 'Institutional facility'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-neutral-900 block">
                        {formatIstDate(booking.startUtc)}
                      </span>
                      <span className="text-[11px] text-neutral-500">
                        {booking.startTime} – {booking.endTime} IST
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-neutral-900 block">
                        {booking.attendeeCount} attendees
                      </span>
                      <span className="text-[11px] text-neutral-500">Sanctioned seating</span>
                    </div>
                  </div>
                </div>

                {/* Approver Decisions & Outstanding Status Breakdown */}
                <div className="pt-3">
                  <WorkflowTracker booking={booking} />
                </div>

                {/* Rejection Reason Alert Banner */}
                {isRejected && (
                  <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-neutral-950 space-y-1">
                    <div className="font-medium flex items-center gap-1.5 text-campus-red">
                      <XCircle className="w-4 h-4 text-campus-red" />
                      Rejection reason:
                    </div>
                    <p className="leading-relaxed text-neutral-700">
                      {booking.rejectionReason || evalResult.rejectionReason || 'No specific explanation was provided.'}
                    </p>
                  </div>
                )}

                {/* Action Buttons Strip */}
                <div className="mt-4 pt-3 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-[11px] text-neutral-500">
                    Submission: {formatIstDate(booking.createdAt)} &bull; Reference #{booking.bookingRef}
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Cancellation prompt */}
                    {canCancel && cancellingBookingId !== booking.id && (
                      <button
                        onClick={() => setCancellingBookingId(booking.id)}
                        className="text-xs font-medium text-campus-red hover:underline transition-colors p-1"
                      >
                        Cancel request
                      </button>
                    )}

                    {/* Digital Hall Pass Button (Approved only) */}
                    {isApproved && (
                      <BubbleButton
                        href={`/pass/${booking.id}`}
                        variant="primary"
                        size="sm"
                        icon={<QrCode className="w-4 h-4" />}
                      >
                        View QR hall pass
                      </BubbleButton>
                    )}
                  </div>
                </div>

                {/* Cancellation Dialog Inline */}
                {cancellingBookingId === booking.id && (
                  <div className="mt-3 p-4 rounded-xl bg-neutral-50 border border-red-200 animate-dialog-enter space-y-3">
                    <p className="text-xs font-semibold text-campus-red flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-campus-red" />
                      Confirm request cancellation
                    </p>
                    <p className="text-xs text-neutral-600">
                      Cancelling will release the facility reservation window and allow you to submit a new request.
                    </p>
                    <input
                      type="text"
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="Optional cancellation note..."
                      className="w-full p-2 rounded-lg border border-neutral-300 text-xs bg-white text-neutral-950 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-campus-red focus:border-campus-red"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <BubbleButton
                        variant="secondary"
                        size="sm"
                        onClick={() => setCancellingBookingId(null)}
                      >
                        Keep request
                      </BubbleButton>
                      <BubbleButton
                        variant="danger"
                        size="sm"
                        onClick={() => handleConfirmCancel(booking.id)}
                      >
                        Confirm cancellation
                      </BubbleButton>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function MyRequestsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-[#B4B8CC]">
          Loading requests...
        </div>
      }
    >
      <MyRequestsContent />
    </Suspense>
  );
}
