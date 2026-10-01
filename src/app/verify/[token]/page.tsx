'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { useCampusStore } from '@/lib/store';
import { BubbleButton } from '@/components/BubbleButton';
import { formatIstDate, formatIstTime, CAMPUS_TIMEZONE } from '@/lib/date-utils';
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Clock,
  CheckCircle2,
  Building,
  Calendar,
  Users,
  AlertTriangle,
  ArrowLeft,
  Lock,
} from 'lucide-react';

interface VerifyPageProps {
  params: Promise<{ token: string }>;
}

export type VerificationState = 'valid' | 'not_yet_valid' | 'expired' | 'cancelled' | 'invalid';

export default function VerifyPassPage({ params }: VerifyPageProps) {
  const { token } = use(params);
  const { getBookingByToken, getFacilityById } = useCampusStore();

  const booking = getBookingByToken(token);
  const facility = booking ? getFacilityById(booking.facilityId) : null;

  // Determine verification state based on current time & booking status
  const getVerificationState = (): {
    state: VerificationState;
    title: string;
    description: string;
    theme: 'emerald' | 'amber' | 'rose' | 'slate';
  } => {
    if (!booking) {
      return {
        state: 'invalid',
        title: 'Invalid Pass Token',
        description:
          'This security token does not correspond to any valid institutional reservation. Entry must be denied.',
        theme: 'rose',
      };
    }

    if (booking.status === 'cancelled') {
      return {
        state: 'cancelled',
        title: 'Pass Cancelled & Revoked',
        description:
          'This reservation was cancelled by the requester or administration. Entry is not permitted.',
        theme: 'rose',
      };
    }

    if (booking.status === 'rejected') {
      return {
        state: 'invalid',
        title: 'Reservation Rejected',
        description:
          'This reservation was rejected during administrative review and does not possess a valid hall pass.',
        theme: 'rose',
      };
    }

    if (booking.status !== 'approved') {
      return {
        state: 'invalid',
        title: 'Unsanctioned Pass',
        description:
          'This reservation has not completed all 4 sequential approval stages. Hall pass is not active.',
        theme: 'amber',
      };
    }

    // Now evaluate time window against current time in UTC
    const nowMs = Date.now();
    const startMs = new Date(booking.startUtc).getTime();
    const endMs = new Date(booking.endUtc).getTime();

    // 1-hour early grace period for setup
    const earlyGraceMs = startMs - 60 * 60 * 1000;
    // 30-minute departure grace period
    const lateGraceMs = endMs + 30 * 60 * 1000;

    if (nowMs < earlyGraceMs) {
      return {
        state: 'not_yet_valid',
        title: 'Not Yet Valid (Future Event)',
        description: `This pass is scheduled for ${formatIstDate(booking.startUtc)} starting at ${booking.startTime} IST. Early entry is only authorized 1 hour prior to event start.`,
        theme: 'amber',
      };
    }

    if (nowMs > lateGraceMs) {
      return {
        state: 'expired',
        title: 'Pass Expired',
        description: `The validity window for this event concluded on ${formatIstDate(booking.endUtc)} at ${booking.endTime} IST.`,
        theme: 'slate',
      };
    }

    return {
      state: 'valid',
      title: 'Valid Security Hall Pass',
      description:
        'Sanction verified in live campus database. Admittance authorized for event participants.',
      theme: 'emerald',
    };
  };

  const statusInfo = getVerificationState();

  return (
    <div className="max-w-xl mx-auto my-8 space-y-6 animate-in fade-in duration-300">
      {/* Top Brand Link */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          CampusSpace Security Portal
        </Link>
        <span className="text-[11px] font-mono text-slate-400">
          Token: {token.substring(0, 10)}...
        </span>
      </div>

      {/* Main Verification Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-elevation overflow-hidden">
        {/* Banner based on Status */}
        <div
          className={`p-6 sm:p-8 text-white ${
            statusInfo.theme === 'emerald'
              ? 'bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800'
              : statusInfo.theme === 'amber'
              ? 'bg-gradient-to-r from-amber-600 to-orange-700'
              : statusInfo.theme === 'rose'
              ? 'bg-gradient-to-r from-rose-600 to-red-700'
              : 'bg-gradient-to-r from-slate-700 to-slate-800'
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                {statusInfo.state === 'valid' && <ShieldCheck className="w-7 h-7 text-white" />}
                {statusInfo.state === 'not_yet_valid' && <Clock className="w-7 h-7 text-white" />}
                {statusInfo.state === 'expired' && <Clock className="w-7 h-7 text-white" />}
                {(statusInfo.state === 'cancelled' || statusInfo.state === 'invalid') && (
                  <ShieldAlert className="w-7 h-7 text-white" />
                )}
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest px-2 py-0.5 rounded-full bg-white/20">
                  {statusInfo.state.replace('_', ' ').toUpperCase()}
                </span>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight mt-1">
                  {statusInfo.title}
                </h1>
              </div>
            </div>
          </div>

          <p className="text-xs text-white/90 mt-3 leading-relaxed">
            {statusInfo.description}
          </p>
        </div>

        {/* Details limited to what security staff need (Privacy Compliant) */}
        {booking && (
          <div className="p-6 sm:p-8 space-y-6">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Sanctioned Event
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                {booking.eventName}
              </h2>
              <p className="text-xs font-semibold text-violet-700 mt-1">
                Organized by: {booking.clubName} ({booking.department})
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/60 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Designated Venue
                </span>
                <span className="font-bold text-slate-900 block text-sm">
                  {booking.facilityName}
                </span>
                <span className="text-slate-500 text-[11px]">
                  {facility?.building} &bull; Floor {facility?.floor}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Booking Reference
                </span>
                <span className="font-mono font-bold text-slate-900 text-sm block">
                  {booking.bookingRef}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Authorized Date
                </span>
                <span className="font-bold text-slate-900 block">
                  {formatIstDate(booking.startUtc)}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Permitted Time Window (IST)
                </span>
                <span className="font-bold text-slate-900 block">
                  {booking.startTime} - {booking.endTime}
                </span>
              </div>

              <div className="sm:col-span-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Authorized Capacity
                </span>
                <span className="font-bold text-slate-900">
                  Up to {booking.attendeeCount} Students / Guests
                </span>
              </div>
            </div>

            {/* Verification Security Notice */}
            <div className="p-3.5 rounded-2xl bg-violet-50/60 border border-violet-100 flex items-start gap-2.5 text-xs text-slate-700">
              <Lock className="w-4 h-4 text-violet-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Gate Staff Notice:</strong> This cryptographic validation does not display student phone numbers or personal private information, adhering to institutional privacy guidelines.
              </span>
            </div>

            <div className="pt-2 text-center">
              <BubbleButton href="/" variant="secondary" size="md">
                Return to CampusSpace
              </BubbleButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
