'use client';

import React from 'react';
import Link from 'next/link';
import { Booking } from '@/lib/types';
import { evaluateBookingStatus } from '@/lib/approval-matrix';
import {
  Check,
  X,
  Clock,
  AlertTriangle,
  QrCode,
  ShieldCheck,
  GraduationCap,
  Scroll,
  Building,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

interface WorkflowTrackerProps {
  booking: Booking;
  compact?: boolean;
}

export function WorkflowTracker({ booking, compact = false }: WorkflowTrackerProps) {
  const statusDetails = evaluateBookingStatus(booking);
  const { overallStatus, statusHeadline, statusDescription, isReadyForHallPass } = statusDetails;
  const isLab = booking.facilityCategory === 'labs' || !!booking.labType;

  // Compact Mode (for list rows or summaries)
  if (compact) {
    if (isLab) {
      const hodStep = booking.approvalSteps.find((s) => s.stage === 'hod' || s.approverRole === 'hod');
      const hodDecision = hodStep?.decision || 'pending';

      return (
        <div className="flex items-center gap-2 text-xs">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
              hodDecision === 'approved'
                ? 'bg-blue-50 text-campus-blue border-blue-200'
                : hodDecision === 'rejected'
                ? 'bg-red-50 text-campus-red border-red-200'
                : 'bg-purple-50 text-campus-purple border-purple-200'
            }`}
          >
            {hodDecision === 'approved' && <Check className="w-3 h-3 text-campus-blue" />}
            {hodDecision === 'rejected' && <X className="w-3 h-3 text-campus-red" />}
            {hodDecision === 'pending' && <Clock className="w-3 h-3 text-campus-purple" />}
            HOD: {hodDecision === 'approved' ? 'Approved' : hodDecision === 'rejected' ? 'Rejected' : 'Waiting for approval'}
          </span>
          <span className="text-neutral-300">&bull;</span>
          <span className="text-[11px] font-normal text-neutral-600">{statusHeadline}</span>
        </div>
      );
    }

    // Non-lab compact
    const princStep = booking.approvalSteps.find((s) => s.stage === 'principal');
    const regStep = booking.approvalSteps.find((s) => s.stage === 'registrar');

    const princDecision = princStep?.decision || 'pending';
    const regDecision = regStep?.decision || 'pending';

    return (
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
            princDecision === 'approved'
              ? 'bg-blue-50 text-campus-blue border-blue-200'
              : princDecision === 'rejected'
              ? 'bg-red-50 text-campus-red border-red-200'
              : 'bg-purple-50 text-campus-purple border-purple-200'
          }`}
        >
          {princDecision === 'approved' && <Check className="w-2.5 h-2.5" />}
          {princDecision === 'rejected' && <X className="w-2.5 h-2.5" />}
          {princDecision === 'pending' && <Clock className="w-2.5 h-2.5" />}
          Principal: {princDecision === 'approved' ? 'Approved' : princDecision === 'rejected' ? 'Rejected' : 'Waiting'}
        </span>

        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
            regDecision === 'approved'
              ? 'bg-blue-50 text-campus-blue border-blue-200'
              : regDecision === 'rejected'
              ? 'bg-red-50 text-campus-red border-red-200'
              : 'bg-purple-50 text-campus-purple border-purple-200'
          }`}
        >
          {regDecision === 'approved' && <Check className="w-2.5 h-2.5" />}
          {regDecision === 'rejected' && <X className="w-2.5 h-2.5" />}
          {regDecision === 'pending' && <Clock className="w-2.5 h-2.5" />}
          Registrar: {regDecision === 'approved' ? 'Approved' : regDecision === 'rejected' ? 'Rejected' : 'Waiting'}
        </span>

        <span className="text-[10px] font-medium text-neutral-700 ml-1">
          ({statusDetails.statusHeadline})
        </span>
      </div>
    );
  }

  // Full Tracker View
  return (
    <div className="bg-neutral-50 rounded-xl p-4 sm:p-5 border border-neutral-200 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-200">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-campus-purple" />
            <h4 className="text-sm font-semibold text-neutral-950">
              {isLab ? 'Laboratory approval route (HOD)' : 'Institutional approval route (Principal & Registrar)'}
            </h4>
          </div>
          <p className="text-xs text-neutral-600 mt-0.5">
            {isLab
              ? 'Laboratory access requires review and approval exclusively by the department head.'
              : 'Requires review and approval by both Principal and Registrar.'}
          </p>
        </div>

        {/* Hall pass indicator */}
        {isReadyForHallPass && (
          <Link
            href={`/pass?ref=${booking.bookingRef}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-campus-blue hover:bg-blue-700 text-white text-xs font-medium shadow-xs transition-colors"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>View hall pass</span>
            <ExternalLink className="w-3 h-3 ml-0.5" />
          </Link>
        )}
      </div>

      {/* Routing Error Alert */}
      {booking.routingError && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-neutral-950 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-campus-red flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-campus-red">Routing configuration error</p>
            <p className="text-[11px] text-neutral-700 mt-0.5">{booking.routingError}</p>
          </div>
        </div>
      )}

      {/* Decisions Grid */}
      {isLab ? (
        // Laboratory Approver Display: Assigned HOD only
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(() => {
            const hodStep = booking.approvalSteps.find((s) => s.stage === 'hod' || s.approverRole === 'hod');
            const decision = hodStep?.decision || 'pending';

            return (
              <div
                className={`p-3.5 rounded-lg border transition-colors bg-white ${
                  decision === 'approved'
                    ? 'border-blue-200'
                    : decision === 'rejected'
                    ? 'border-red-200'
                    : 'border-neutral-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-neutral-100 text-neutral-800 flex items-center justify-center font-bold text-xs">
                      <Building className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-neutral-950">Head of Department (HOD)</p>
                      <p className="text-[10px] text-neutral-500">{booking.department || 'Assigned Department'}</p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      decision === 'approved'
                        ? 'bg-blue-50 text-campus-blue border-blue-200'
                        : decision === 'rejected'
                        ? 'bg-red-50 text-campus-red border-red-200'
                        : 'bg-purple-50 text-campus-purple border-purple-200'
                    }`}
                  >
                    {decision === 'approved' && <Check className="w-3 h-3 text-campus-blue" />}
                    {decision === 'rejected' && <X className="w-3 h-3 text-campus-red" />}
                    {decision === 'pending' && <Clock className="w-3 h-3 text-campus-purple" />}
                    {decision === 'approved' ? 'Approved' : decision === 'rejected' ? 'Rejected' : 'Waiting for approval'}
                  </span>
                </div>

                <div className="text-[11px] text-neutral-600 mt-2 space-y-1">
                  <p>
                    <strong className="text-neutral-900">Approver:</strong> {hodStep?.approverName || 'Assigned Department Head'}
                  </p>
                  {hodStep?.decidedAt && (
                    <p className="text-[10px] text-neutral-500">
                      Decided at: {new Date(hodStep.decidedAt).toLocaleString()}
                    </p>
                  )}
                  {hodStep?.comments && (
                    <p className="italic text-neutral-800 bg-neutral-50 p-2 rounded-md border border-neutral-200 mt-1">
                      &ldquo;{hodStep.comments}&rdquo;
                    </p>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Department Lab Policy Note */}
          <div className="p-3.5 rounded-lg bg-white border border-neutral-200 flex flex-col justify-center text-xs text-neutral-600">
            <p className="font-semibold text-neutral-950">Laboratory review scope</p>
            <p className="text-[11px] text-neutral-600 mt-1 leading-relaxed">
              Laboratory requests are routed directly to the designated department head for safety verification and scheduling.
            </p>
          </div>
        </div>
      ) : (
        // Non-lab Approvers Display: Principal AND Registrar
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Principal Card */}
          {(() => {
            const step = booking.approvalSteps.find((s) => s.stage === 'principal');
            const decision = step?.decision || 'pending';

            return (
              <div
                className={`p-3.5 rounded-lg border transition-colors bg-white ${
                  decision === 'approved'
                    ? 'border-blue-200'
                    : decision === 'rejected'
                    ? 'border-red-200'
                    : 'border-neutral-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-neutral-100 text-neutral-800 flex items-center justify-center font-bold text-xs">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-neutral-950">Principal</p>
                      <p className="text-[10px] text-neutral-500">Campus administration</p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      decision === 'approved'
                        ? 'bg-blue-50 text-campus-blue border-blue-200'
                        : decision === 'rejected'
                        ? 'bg-red-50 text-campus-red border-red-200'
                        : 'bg-purple-50 text-campus-purple border-purple-200'
                    }`}
                  >
                    {decision === 'approved' && <Check className="w-3 h-3 text-campus-blue" />}
                    {decision === 'rejected' && <X className="w-3 h-3 text-campus-red" />}
                    {decision === 'pending' && <Clock className="w-3 h-3 text-campus-purple" />}
                    {decision === 'approved' ? 'Approved' : decision === 'rejected' ? 'Rejected' : 'Waiting for approval'}
                  </span>
                </div>

                <div className="text-[11px] text-neutral-600 mt-2 space-y-1">
                  <p>
                    <strong className="text-neutral-900">Approver:</strong> {step?.approverName || 'Dr. S. Radhakrishnan'}
                  </p>
                  {step?.decidedAt && (
                    <p className="text-[10px] text-neutral-500">
                      Decided at: {new Date(step.decidedAt).toLocaleString()}
                    </p>
                  )}
                  {step?.comments && (
                    <p className="italic text-neutral-800 bg-neutral-50 p-2 rounded-md border border-neutral-200 mt-1">
                      &ldquo;{step.comments}&rdquo;
                    </p>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Registrar Card */}
          {(() => {
            const step = booking.approvalSteps.find((s) => s.stage === 'registrar');
            const decision = step?.decision || 'pending';

            return (
              <div
                className={`p-3.5 rounded-lg border transition-colors bg-white ${
                  decision === 'approved'
                    ? 'border-blue-200'
                    : decision === 'rejected'
                    ? 'border-red-200'
                    : 'border-neutral-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-neutral-100 text-neutral-800 flex items-center justify-center font-bold text-xs">
                      <Scroll className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-neutral-950">Registrar</p>
                      <p className="text-[10px] text-neutral-500">Operational sanction</p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      decision === 'approved'
                        ? 'bg-blue-50 text-campus-blue border-blue-200'
                        : decision === 'rejected'
                        ? 'bg-red-50 text-campus-red border-red-200'
                        : 'bg-purple-50 text-campus-purple border-purple-200'
                    }`}
                  >
                    {decision === 'approved' && <Check className="w-3 h-3 text-campus-blue" />}
                    {decision === 'rejected' && <X className="w-3 h-3 text-campus-red" />}
                    {decision === 'pending' && <Clock className="w-3 h-3 text-campus-purple" />}
                    {decision === 'approved' ? 'Approved' : decision === 'rejected' ? 'Rejected' : 'Waiting for approval'}
                  </span>
                </div>

                <div className="text-[11px] text-neutral-600 mt-2 space-y-1">
                  <p>
                    <strong className="text-neutral-900">Approver:</strong> {step?.approverName || 'Prof. K. Narayanan'}
                  </p>
                  {step?.decidedAt && (
                    <p className="text-[10px] text-neutral-500">
                      Decided at: {new Date(step.decidedAt).toLocaleString()}
                    </p>
                  )}
                  {step?.comments && (
                    <p className="italic text-neutral-800 bg-neutral-50 p-2 rounded-md border border-neutral-200 mt-1">
                      &ldquo;{step.comments}&rdquo;
                    </p>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Overall Status Banner */}
      <div
        className={`p-3.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
          overallStatus === 'approved'
            ? 'bg-blue-50 border-blue-200 text-neutral-950'
            : overallStatus === 'rejected'
            ? 'bg-red-50 border-red-200 text-neutral-950'
            : overallStatus === 'cancelled'
            ? 'bg-neutral-100 border-neutral-200 text-neutral-700'
            : overallStatus === 'completed'
            ? 'bg-neutral-100 border-neutral-200 text-neutral-700'
            : 'bg-purple-50 border-purple-200 text-neutral-950'
        }`}
      >
        <div className="flex items-center gap-2">
          {overallStatus === 'approved' && <Check className="w-4 h-4 text-campus-blue flex-shrink-0" />}
          {overallStatus === 'rejected' && <X className="w-4 h-4 text-campus-red flex-shrink-0" />}
          {overallStatus === 'pending' && <Clock className="w-4 h-4 text-campus-purple flex-shrink-0" />}
          <div>
            <p className="font-semibold">
              Overall status:{' '}
              <span>{statusHeadline}</span>
            </p>
            <p className="text-[11px] mt-0.5 text-neutral-600">{statusDescription}</p>
          </div>
        </div>

        {overallStatus === 'pending' && statusDetails.outstandingApprover && (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white border border-purple-200 text-campus-purple self-start sm:self-auto">
            Awaiting {statusDetails.outstandingApprover} decision
          </span>
        )}
      </div>

      {/* Rejection Details Banner if Rejected */}
      {overallStatus === 'rejected' && (booking.rejectionReason || statusDetails.rejectionReason) && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-neutral-950">
          <p className="font-semibold flex items-center gap-1.5 text-campus-red">
            <AlertTriangle className="w-3.5 h-3.5 text-campus-red" />
            Rejection reason:
          </p>
          <p className="mt-1 text-[11px] text-neutral-800 bg-white p-2 rounded-md border border-red-200">
            &ldquo;{booking.rejectionReason || statusDetails.rejectionReason}&rdquo;
          </p>
          <p className="text-[10px] text-neutral-500 mt-1">
            The reservation window has been released and is open for other campus bookings.
          </p>
        </div>
      )}

      {/* Cancellation Details Banner */}
      {overallStatus === 'cancelled' && (
        <div className="p-3 rounded-lg bg-neutral-100 border border-neutral-200 text-xs text-neutral-600">
          <p className="font-semibold text-neutral-900">Reservation cancelled</p>
          <p className="text-[11px] mt-0.5 text-neutral-600">
            {booking.cancellationReason || 'This booking was cancelled by the requester. Any associated QR hall pass has been revoked.'}
          </p>
        </div>
      )}
    </div>
  );
}
