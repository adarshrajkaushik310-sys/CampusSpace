'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCampusStore } from '@/lib/store';
import { BubbleButton } from '@/components/BubbleButton';
import { WorkflowTracker } from '@/components/WorkflowTracker';
import { RejectModal } from '@/components/RejectModal';
import { formatIstDate, formatIstTime } from '@/lib/date-utils';
import { evaluateBookingStatus, getAuthorizedBookingsForUser } from '@/lib/approval-matrix';
import {
  Inbox,
  CheckCircle2,
  XCircle,
  Building,
  Calendar,
  Users,
  AlertCircle,
  ShieldCheck,
  Check,
  X,
  Clock,
  ArrowRight,
  FlaskConical,
  GraduationCap,
  Scroll,
  History,
  QrCode,
  FileText,
} from 'lucide-react';

export default function ApprovalsPage() {
  const router = useRouter();
  const {
    bookings,
    currentRole,
    currentUser,
    approveBooking,
    rejectBooking,
  } = useCampusStore();

  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [rejectingBooking, setRejectingBooking] = useState<{
    id: string;
    bookingRef: string;
    eventName: string;
  } | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);

  // Exact Approval Matrix Authority Verification:
  // Non-lab: Principal AND Registrar
  // Labs: Assigned HOD only for that lab's department
  const isPrincipal = currentRole === 'principal';
  const isRegistrar = currentRole === 'registrar';
  const isHod = currentRole === 'hod';
  const isAuthorizedApprover = isPrincipal || isRegistrar || isHod;

  // Restrict requests strictly to authenticated user's actual approval assignments
  const authorizedBookings = getAuthorizedBookingsForUser(bookings, currentUser);

  // Requests awaiting the authenticated user's specific pending action
  const pendingRequestsForUser = authorizedBookings.filter((b) => {
    if (b.status !== 'pending') return false;

    if (isPrincipal) {
      const princStep = b.approvalSteps.find((s) => s.stage === 'principal');
      return princStep ? princStep.decision === 'pending' : false;
    }

    if (isRegistrar) {
      const regStep = b.approvalSteps.find((s) => s.stage === 'registrar');
      return regStep ? regStep.decision === 'pending' : false;
    }

    if (isHod) {
      const hodStep = b.approvalSteps.find((s) => s.stage === 'hod');
      return hodStep ? hodStep.decision === 'pending' : false;
    }

    return false;
  });

  // Approver's authorized historical requests (past decisions or finalized requests in their assigned scope)
  const historyRequestsForUser = authorizedBookings.filter((b) => {
    if (b.status !== 'pending') return true;

    // Requests where this approver has already recorded their decision
    if (isPrincipal) {
      const princStep = b.approvalSteps.find((s) => s.stage === 'principal');
      return princStep ? princStep.decision !== 'pending' : false;
    }

    if (isRegistrar) {
      const regStep = b.approvalSteps.find((s) => s.stage === 'registrar');
      return regStep ? regStep.decision !== 'pending' : false;
    }

    if (isHod) {
      const hodStep = b.approvalSteps.find((s) => s.stage === 'hod');
      return hodStep ? hodStep.decision !== 'pending' : false;
    }

    return false;
  });

  const handleApprove = (bookingId: string) => {
    const comments = commentInputs[bookingId] || '';
    const res = approveBooking(bookingId, comments);
    if (res.success) {
      setActionSuccessMessage('Approval decision recorded successfully!');
      setActionErrorMessage(null);
      setTimeout(() => setActionSuccessMessage(null), 4000);
      setCommentInputs((prev) => {
        const next = { ...prev };
        delete next[bookingId];
        return next;
      });
    } else {
      setActionErrorMessage(res.error || 'Failed to approve booking.');
      setTimeout(() => setActionErrorMessage(null), 4000);
    }
  };

  const handleConfirmReject = (reason: string) => {
    if (!rejectingBooking) return;
    const res = rejectBooking(rejectingBooking.id, reason);
    if (res.success) {
      setActionSuccessMessage('Request rejected. Reservation interval has been released.');
      setActionErrorMessage(null);
      setTimeout(() => setActionSuccessMessage(null), 4000);
      setRejectingBooking(null);
    } else {
      setActionErrorMessage(res.error || 'Failed to reject booking.');
      setTimeout(() => setActionErrorMessage(null), 4000);
    }
  };

  if (!isAuthorizedApprover) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-[#13131F] rounded-3xl p-8 text-center border border-[#2B2B40] shadow-card-dark space-y-4 animate-page-enter">
        <div className="w-12 h-12 rounded-full bg-[#1C1C2B] text-[#8B5CF6] border border-[#2B2B40] flex items-center justify-center mx-auto">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-[#F8FAFC]">
          Approvals Portal Access Restricted
        </h2>
        <p className="text-xs text-[#B4B8CC] leading-relaxed">
          You are currently signed in as <strong className="text-[#F8FAFC]">{currentUser.name}</strong> ({currentUser.title}). Administrative approval actions are reserved for designated institutional authorities (Principal, Registrar, and assigned Department HODs).
        </p>
        <div className="pt-2">
          <BubbleButton href="/requests" variant="primary" size="md">
            Go to My Requests
          </BubbleButton>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-page-enter">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-950 tracking-tight">
            Approvals queue
          </h1>
          <p className="text-sm text-neutral-600 mt-1">
            Requests assigned to you.
          </p>
        </div>

        {/* Current Approver Indicator */}
        <div className="flex items-center gap-3 bg-neutral-50 p-3 rounded-lg border border-neutral-200">
          <div className="w-9 h-9 rounded-md bg-white text-neutral-800 border border-neutral-200 flex items-center justify-center font-bold text-sm">
            {isPrincipal ? <GraduationCap className="w-5 h-5 text-neutral-800" /> : isRegistrar ? <Scroll className="w-5 h-5 text-neutral-800" /> : <FlaskConical className="w-5 h-5 text-neutral-800" />}
          </div>
          <div>
            <p className="text-xs font-semibold text-neutral-950 leading-tight">
              {currentUser.name}
            </p>
            <p className="text-[11px] text-campus-purple font-medium">
              {currentUser.title}
            </p>
            {currentUser.department && (
              <p className="text-[10px] text-neutral-500">
                {currentUser.department}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Action Notification Banners */}
      {actionSuccessMessage && (
        <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200 text-xs text-neutral-950 flex items-center gap-2 animate-page-enter">
          <CheckCircle2 className="w-4 h-4 text-campus-blue flex-shrink-0" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {actionErrorMessage && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-neutral-950 flex items-center gap-2 animate-page-enter">
          <AlertCircle className="w-4 h-4 text-campus-red flex-shrink-0" />
          <span>{actionErrorMessage}</span>
        </div>
      )}

      {/* Approver Policy Notice Strip */}
      <div className="p-3.5 rounded-lg bg-neutral-50 border border-neutral-200 text-xs text-neutral-600 space-y-0.5">
        <span className="font-semibold text-neutral-900 block">Approval routing rules:</span>
        <p className="leading-relaxed text-[11px]">
          {isHod
            ? 'Laboratories require approval only from the responsible Head of Department (HOD). Your approval completes the process and generates the QR Hall Pass.'
            : 'Non-lab facilities (Auditorium, Seminar Hall, Smart Classroom, Sports Ground) require approval from both Principal and Registrar in either order.'}
        </p>
      </div>

      {/* Inbox & History Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200 pb-3">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
            activeTab === 'pending'
              ? 'bg-campus-purple text-white'
              : 'text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          Waiting for your decision ({pendingRequestsForUser.length})
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
            activeTab === 'history'
              ? 'bg-campus-purple text-white'
              : 'text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          Approval history ({historyRequestsForUser.length})
        </button>
      </div>

      {/* Tab 1: Requests Awaiting Action */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pendingRequestsForUser.length === 0 ? (
            <div className="bg-white rounded-xl p-10 text-center border border-neutral-200 shadow-sm space-y-3">
              <CheckCircle2 className="w-10 h-10 text-campus-blue mx-auto" />
              <h3 className="font-semibold text-sm text-neutral-950">Your approval queue is clear</h3>
              <p className="text-xs text-neutral-600 max-w-sm mx-auto">
                No requests currently require your review.
              </p>
            </div>
          ) : (
            pendingRequestsForUser.map((booking) => {
              const isLab = booking.facilityCategory === 'labs' || !!booking.labType;

              return (
                <div
                  key={booking.id}
                  className="bg-white rounded-xl p-5 border border-neutral-200 shadow-sm space-y-4"
                >
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-3 border-b border-neutral-100">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-800 border border-neutral-200">
                          {booking.bookingRef}
                        </span>
                        <span className="text-xs font-medium text-campus-blue">
                          {booking.clubName}
                        </span>
                        <span className="text-neutral-300">&bull;</span>
                        <span className="text-xs text-neutral-600">{booking.department}</span>
                      </div>

                      <h3 className="text-base font-semibold text-neutral-950 tracking-tight">
                        {booking.eventName}
                      </h3>
                      <p className="text-xs text-neutral-600 mt-1 max-w-2xl leading-relaxed">
                        {booking.eventDescription || 'No description provided.'}
                      </p>
                    </div>

                    <div className="sm:text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-campus-purple border border-purple-200">
                        <Clock className="w-3.5 h-3.5 text-campus-purple" />
                        Waiting for your review
                      </span>
                      <p className="text-[11px] text-neutral-400 mt-1">
                        Submitted: {formatIstDate(booking.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Logistics Strip */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-lg bg-neutral-50 border border-neutral-200 text-xs text-neutral-600">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                      <div>
                        <span className="font-medium text-neutral-900 block">
                          {booking.facilityName}
                          {booking.labType && ` (${booking.labType.replace(/_/g, ' ')})`}
                        </span>
                        <span className="text-[11px] text-neutral-500">
                          {isLab ? `Department: ${booking.department}` : 'Institutional facility'}
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

                  {/* Workflow Tracker displaying individual decisions */}
                  <div className="pt-1">
                    <WorkflowTracker booking={booking} />
                  </div>

                  {/* Approver Decision Input & Action Buttons */}
                  <div className="pt-3 border-t border-neutral-100 space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-900 mb-1">
                        Endorsement notes (optional)
                      </label>
                      <input
                        type="text"
                        value={commentInputs[booking.id] || ''}
                        onChange={(e) =>
                          setCommentInputs({
                            ...commentInputs,
                            [booking.id]: e.target.value,
                          })
                        }
                        placeholder={
                          isLab
                            ? 'e.g. Lab equipment and supervisor confirmed.'
                            : 'e.g. Approved per campus scheduling policies.'
                        }
                        className="w-full p-2.5 rounded-lg border border-neutral-300 text-xs bg-white text-neutral-950 placeholder-neutral-400 focus:outline-none focus:border-campus-blue focus:ring-1 focus:ring-campus-blue"
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <p className="text-[11px] text-neutral-500">
                        {isLab
                          ? 'HOD approval will finalize authorization and issue the QR Hall Pass.'
                          : 'Both Principal and Registrar approvals are required before QR Hall Pass issuance.'}
                      </p>

                      <div className="flex items-center gap-2.5">
                        {/* Reject Button (Opens reason modal) */}
                        <BubbleButton
                          variant="danger"
                          size="md"
                          onClick={() =>
                            setRejectingBooking({
                              id: booking.id,
                              bookingRef: booking.bookingRef,
                              eventName: booking.eventName,
                            })
                          }
                          icon={<X className="w-4 h-4" />}
                        >
                          Reject request
                        </BubbleButton>

                        {/* Approve Button */}
                        <BubbleButton
                          variant="primary"
                          size="md"
                          onClick={() => handleApprove(booking.id)}
                          icon={<Check className="w-4 h-4" />}
                        >
                          Approve request
                        </BubbleButton>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Approval History (Past decisions in assigned scope) */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {historyRequestsForUser.length === 0 ? (
            <div className="bg-white rounded-xl p-10 text-center border border-neutral-200 shadow-sm space-y-3">
              <History className="w-10 h-10 text-neutral-400 mx-auto" />
              <h3 className="font-semibold text-sm text-neutral-950">No approval history recorded yet</h3>
              <p className="text-xs text-neutral-600 max-w-sm mx-auto">
                Decisions you record on assigned facility requests will be archived here.
              </p>
            </div>
          ) : (
            historyRequestsForUser.map((booking) => {
              const isLab = booking.facilityCategory === 'labs' || !!booking.labType;
              const isApproved = booking.status === 'approved';
              const isRejected = booking.status === 'rejected' || booking.status === 'cancelled';

              return (
                <div
                  key={booking.id}
                  className="bg-white rounded-xl p-5 border border-neutral-200 shadow-sm space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-3 border-b border-neutral-100">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-800 border border-neutral-200">
                          {booking.bookingRef}
                        </span>
                        <span className="text-xs font-medium text-campus-blue">
                          {booking.clubName}
                        </span>
                        <span className="text-neutral-300">&bull;</span>
                        <span className="text-xs text-neutral-600">{booking.department}</span>
                      </div>

                      <h3 className="text-base font-semibold text-neutral-950 tracking-tight">
                        {booking.eventName}
                      </h3>
                      <p className="text-xs text-neutral-600 mt-1 max-w-2xl leading-relaxed">
                        {booking.eventDescription || 'No description provided.'}
                      </p>
                    </div>

                    <div className="sm:text-right space-y-1">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          isApproved
                            ? 'bg-blue-50 text-campus-blue border-blue-200'
                            : isRejected
                            ? 'bg-red-50 text-campus-red border-red-200'
                            : 'bg-purple-50 text-campus-purple border-purple-200'
                        }`}
                      >
                        {isApproved ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-campus-blue" />
                        ) : isRejected ? (
                          <XCircle className="w-3.5 h-3.5 text-campus-red" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-campus-purple" />
                        )}
                        {isApproved ? 'Approved' : isRejected ? 'Rejected' : 'Waiting for approval'}
                      </span>
                      <p className="text-[11px] text-neutral-400">
                        Date: {booking.date}
                      </p>
                    </div>
                  </div>

                  {/* Logistics Strip */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-lg bg-neutral-50 border border-neutral-200 text-xs text-neutral-600">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                      <div>
                        <span className="font-medium text-neutral-900 block">
                          {booking.facilityName}
                        </span>
                        <span className="text-[11px] text-neutral-500">
                          {isLab ? `Department: ${booking.department}` : 'Institutional facility'}
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
                        <span className="text-[11px] text-neutral-500">Capacity</span>
                      </div>
                    </div>
                  </div>

                  {/* Workflow Tracker displaying historical steps */}
                  <div className="pt-1">
                    <WorkflowTracker booking={booking} />
                  </div>

                  {/* Footer Action Links */}
                  {isApproved && (
                    <div className="pt-3 border-t border-neutral-100 flex items-center justify-end">
                      <BubbleButton
                        href={`/pass/${booking.id}`}
                        variant="secondary"
                        size="sm"
                        icon={<QrCode className="w-4 h-4 text-campus-purple" />}
                      >
                        View QR hall pass
                      </BubbleButton>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Modal for rejecting request with mandatory explanation */}
      {rejectingBooking && (
        <RejectModal
          isOpen={true}
          bookingRef={rejectingBooking.bookingRef}
          eventName={rejectingBooking.eventName}
          onClose={() => setRejectingBooking(null)}
          onConfirmReject={handleConfirmReject}
        />
      )}
    </div>
  );
}
