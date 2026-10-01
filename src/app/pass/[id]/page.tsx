'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useCampusStore } from '@/lib/store';
import { BubbleButton } from '@/components/BubbleButton';
import { formatIstDate, formatIstTime } from '@/lib/date-utils';
import { isBookingAssignedToUser } from '@/lib/approval-matrix';
import QRCode from 'qrcode';
import {
  QrCode,
  Printer,
  Share2,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';

interface HallPassPageProps {
  params: Promise<{ id: string }>;
}

export default function HallPassPage({ params }: HallPassPageProps) {
  const { id } = use(params);
  const { getBookingById, getFacilityById, currentUser } = useCampusStore();

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);

  const booking = getBookingById(id);
  const facility = booking ? getFacilityById(booking.facilityId) : null;

  // Verification URL with unguessable token
  const verificationPath = booking ? `/verify/${booking.verificationToken}` : '';

  useEffect(() => {
    if (booking && booking.verificationToken) {
      const fullUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}${verificationPath}`
          : `https://campusspace.university.edu${verificationPath}`;

      QRCode.toDataURL(fullUrl, {
        width: 280,
        margin: 3,
        color: {
          dark: '#000000', // pure black modules for optimal contrast & scanner reliability
          light: '#FFFFFF',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Failed to generate QR code', err));
    }
  }, [booking, verificationPath]);

  if (!booking) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-2xl p-8 text-center border border-neutral-200 shadow-sm space-y-4 animate-page-enter">
        <AlertTriangle className="w-10 h-10 text-campus-red mx-auto" />
        <h2 className="text-lg font-bold text-neutral-950">Hall Pass Not Found</h2>
        <p className="text-xs text-neutral-600">
          The requested booking record could not be found or has expired.
        </p>
        <BubbleButton href="/requests" variant="secondary" size="md">
          Return to Requests
        </BubbleButton>
      </div>
    );
  }

  // Guard: Restrict visibility according to authenticated user's actual approval assignments or ownership
  const isAuthorized = isBookingAssignedToUser(booking, currentUser);
  if (!isAuthorized) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-2xl p-8 text-center border border-neutral-200 shadow-sm space-y-4 animate-page-enter">
        <div className="w-10 h-10 rounded-full bg-campus-red/10 text-campus-red border border-campus-red/20 flex items-center justify-center mx-auto">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <h2 className="text-lg font-bold text-neutral-950">Access Restricted</h2>
        <p className="text-xs text-neutral-600 leading-relaxed">
          You do not have authorization to view this booking record. Access is limited to the request owner and assigned institutional approvers.
        </p>
        <BubbleButton href="/requests" variant="secondary" size="md">
          Return to My Requests
        </BubbleButton>
      </div>
    );
  }

  // Guard: Hall pass is only issued after final approval
  if (booking.status === 'cancelled') {
    return (
      <div className="max-w-lg mx-auto my-12 bg-white rounded-2xl p-8 text-center border border-campus-red/30 shadow-sm space-y-4 animate-page-enter">
        <div className="w-10 h-10 rounded-full bg-campus-red/10 text-campus-red border border-campus-red/20 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-bold text-campus-red">
          Hall Pass Revoked
        </h2>
        <p className="text-xs text-neutral-600 leading-relaxed">
          This booking was cancelled. The digital hall pass and its verification QR code have been permanently invalidated.
        </p>
        <BubbleButton href="/requests" variant="secondary" size="md">
          Return to My Requests
        </BubbleButton>
      </div>
    );
  }

  if (booking.status !== 'approved') {
    return (
      <div className="max-w-lg mx-auto my-12 bg-white rounded-2xl p-8 text-center border border-neutral-200 shadow-sm space-y-4 animate-page-enter">
        <div className="w-10 h-10 rounded-full bg-campus-purple/10 text-campus-purple border border-campus-purple/20 flex items-center justify-center mx-auto">
          <QrCode className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-bold text-neutral-950">
          Pass Issuance Pending Final Sanction
        </h2>
        <p className="text-xs text-neutral-600 leading-relaxed">
          Digital Hall Passes are locked and generated only after institutional approval is complete (Principal and Registrar for non-lab venues, or assigned HOD for laboratories).
        </p>
        <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs text-neutral-700">
          Current Status: <strong className="uppercase text-campus-purple">{booking.status}</strong>
        </div>
        <BubbleButton href="/requests" variant="primary" size="md">
          Track Approval Journey &rarr;
        </BubbleButton>
      </div>
    );
  }

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      const fullUrl = `${window.location.origin}${verificationPath}`;
      navigator.clipboard.writeText(fullUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-page-enter">
      {/* Top Navigation & Action Strip */}
      <div className="flex items-center justify-between no-print">
        <Link
          href="/requests"
          className="text-xs font-semibold text-neutral-600 hover:text-neutral-950 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-campus-purple" />
          Back to My Requests
        </Link>

        <div className="flex items-center gap-2">
          <BubbleButton
            variant="secondary"
            size="sm"
            onClick={handleCopyLink}
            icon={<Share2 className="w-3.5 h-3.5" />}
          >
            {copiedLink ? 'Link Copied!' : 'Copy Verification Link'}
          </BubbleButton>

          <BubbleButton
            variant="primary"
            size="sm"
            onClick={handlePrint}
            icon={<Printer className="w-3.5 h-3.5" />}
          >
            Print Hall Pass
          </BubbleButton>
        </div>
      </div>

      {/* The Printable Digital Hall Pass Card */}
      <div className="bg-white text-neutral-900 rounded-2xl border border-neutral-200 shadow-sm overflow-hidden relative">
        {/* Pass Header */}
        <div className="bg-neutral-950 text-white p-6 sm:p-8 border-b border-neutral-800 relative">
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono tracking-widest uppercase px-2.5 py-0.5 rounded-full bg-white/10 text-neutral-200 border border-white/20">
                OFFICIAL DIGITAL PASS
              </span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight mt-2 text-white">
                Campus Facility Access Sanction
              </h1>
              <p className="text-xs text-neutral-400 mt-0.5">
                Authorized by Campus Administration & Estate Works
              </p>
            </div>

            <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-700 flex items-center justify-center text-white">
              <ShieldCheck className="w-6 h-6 text-campus-blue" />
            </div>
          </div>
        </div>

        {/* Pass Body Content */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Status and Verification Badge */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-campus-blue/10 rounded-xl border border-campus-blue/20">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-campus-blue" />
              <div>
                <span className="text-xs font-bold text-neutral-950 block leading-tight">
                  Status: APPROVED & SANCTIONED
                </span>
                <span className="text-[11px] text-campus-blue font-medium">
                  Institutional approval complete
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider block">
                Booking Reference
              </span>
              <span className="font-mono font-bold text-xs text-neutral-950">
                {booking.bookingRef}
              </span>
            </div>
          </div>

          {/* Event & Requester Details */}
          <div>
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              Sanctioned Event
            </span>
            <h2 className="text-xl font-bold text-neutral-950 tracking-tight mt-0.5">
              {booking.eventName}
            </h2>
            <p className="text-xs font-semibold text-campus-purple mt-1">
              Host: {booking.clubName} &bull; {booking.department}
            </p>
          </div>

          {/* Logistics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-neutral-50 border border-neutral-200 text-xs">
            <div>
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Reserved Venue
              </span>
              <span className="font-bold text-neutral-950 text-sm block">
                {booking.facilityName}
              </span>
              <span className="text-neutral-500 text-[11px]">
                {facility?.building} &bull; Floor {facility?.floor}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Date & Schedule (IST)
              </span>
              <span className="font-bold text-neutral-950 text-sm block">
                {formatIstDate(booking.startUtc)}
              </span>
              <span className="text-neutral-500 text-[11px]">
                {booking.startTime} - {booking.endTime} (Asia/Kolkata)
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Sanctioned Attendees
              </span>
              <span className="font-bold text-neutral-950">{booking.attendeeCount} Attendees</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Requester
              </span>
              <span className="font-bold text-neutral-950">{booking.requesterName}</span>
              <span className="text-neutral-500 block text-[10px]">{booking.requesterRole}</span>
            </div>
          </div>

          {/* QR Code Presentation (Crisp black on white with clear quiet zone) */}
          <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-neutral-50 border border-neutral-200 text-center space-y-3">
            {qrDataUrl ? (
              <div className="p-4 bg-white rounded-xl shadow-sm border border-neutral-300 inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrDataUrl}
                  alt={`QR Verification code for booking ${booking.bookingRef}`}
                  className="w-48 h-48 mx-auto"
                />
              </div>
            ) : (
              <div className="w-48 h-48 bg-neutral-200 animate-pulse rounded-xl" />
            )}

            <div>
              <p className="text-xs font-bold text-neutral-950">
                Scannable Security Gate QR
              </p>
              <p className="text-[11px] text-neutral-500 max-w-xs mx-auto mt-0.5">
                Scan with any smartphone or gate scanner to verify authenticity.
              </p>
            </div>

            <div className="pt-2 no-print">
              <Link
                href={verificationPath}
                target="_blank"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-campus-blue hover:underline"
              >
                <span>Preview Public Security Verification Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Approver Sign-off Audit Seal */}
          <div className="pt-4 border-t border-neutral-200 flex flex-wrap items-center justify-between text-[11px] text-neutral-500">
            <span>Cryptographic Token: {booking.verificationToken.substring(0, 16)}...</span>
            <span>Issued: {formatIstDate(booking.updatedAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
