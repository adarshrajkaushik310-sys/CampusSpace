'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCampusStore } from '@/lib/store';
import { BubbleButton } from '@/components/BubbleButton';
import { WorkflowTracker } from '@/components/WorkflowTracker';
import { getAuthorizedBookingsForUser } from '@/lib/approval-matrix';
import { getTodayIst, formatIstDate } from '@/lib/date-utils';
import {
  CalendarPlus,
  CheckCircle2,
  Clock,
  QrCode,
  Building,
  Users,
  RotateCcw,
} from 'lucide-react';

export default function DashboardPage() {
  const {
    facilities,
    bookings,
    currentRole,
    currentUser,
    getFacilityAvailability,
    refreshData,
  } = useCampusStore();

  const today = getTodayIst();
  const [filterDate, setFilterDate] = useState<string>(today);
  const [filterStart, setFilterStart] = useState<string>('09:00');
  const [filterEnd, setFilterEnd] = useState<string>('12:00');

  // Refresh animation states
  const [isRefreshingWaiting, setIsRefreshingWaiting] = useState(false);
  const [isRefreshingApproved, setIsRefreshingApproved] = useState(false);

  const handleRefreshWaiting = async () => {
    setIsRefreshingWaiting(true);
    await refreshData();
    setTimeout(() => setIsRefreshingWaiting(false), 500);
  };

  const handleRefreshApproved = async () => {
    setIsRefreshingApproved(true);
    await refreshData();
    setTimeout(() => setIsRefreshingApproved(false), 500);
  };

  // Requests scoped strictly to authenticated user's actual approval assignments or submissions
  const authorizedBookings = getAuthorizedBookingsForUser(bookings, currentUser);
  const approvedBookings = authorizedBookings.filter((b) => b.status === 'approved');
  const pendingBookings = authorizedBookings.filter((b) => b.status === 'pending');

  const availableFacilitiesCount = facilities.filter(
    (f) => getFacilityAvailability(f.id, filterDate, filterStart, filterEnd) === 'available'
  ).length;

  const isApproverRole = currentRole === 'principal' || currentRole === 'registrar' || currentRole === 'hod';
  const roleDescription = currentRole === 'admin'
    ? 'Requests across the campus.'
    : isApproverRole
    ? 'Requests assigned to you.'
    : 'Your booking requests.';

  return (
    <div className="space-y-6 animate-page-enter">
      {/* Compact Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#000000] tracking-tight">
            Track requests, approvals, and bookings
          </h1>
          <p className="text-sm text-[#4B5563] mt-1">
            {roleDescription}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-shrink-0">
          <BubbleButton
            href="/facilities"
            variant="secondary"
            size="sm"
            icon={<Building className="w-3.5 h-3.5" />}
          >
            Facilities
          </BubbleButton>
          <BubbleButton
            href="/facilities"
            variant="primary"
            size="sm"
            icon={<CalendarPlus className="w-3.5 h-3.5" />}
          >
            Book a facility
          </BubbleButton>
        </div>
      </div>

      {/* Restrained Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 border border-[#E5E7EB] shadow-xs">
          <span className="text-xs text-[#6B7280]">Total</span>
          <p className="text-2xl font-bold text-[#000000] mt-1">{authorizedBookings.length}</p>
          <p className="text-xs text-[#6B7280]">Accessible requests</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-[#E5E7EB] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#6B7280]">
            <span>Approved</span>
            <CheckCircle2 className="w-4 h-4 text-[#2563EB]" />
          </div>
          <p className="text-2xl font-bold text-[#000000] mt-1">{approvedBookings.length}</p>
          <p className="text-xs text-[#6B7280]">Active bookings</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-[#E5E7EB] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#6B7280]">
            <span>Waiting</span>
            <Clock className="w-4 h-4 text-[#7C3AED]" />
          </div>
          <p className="text-2xl font-bold text-[#000000] mt-1">{pendingBookings.length}</p>
          <p className="text-xs text-[#6B7280]">Waiting for approval</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-[#E5E7EB] shadow-xs">
          <span className="text-xs text-[#6B7280]">Available</span>
          <p className="text-2xl font-bold text-[#000000] mt-1">{availableFacilitiesCount}</p>
          <p className="text-xs text-[#6B7280]">Venues free in slot</p>
        </div>
      </div>

      {/* Compact Availability Filter Toolbar */}
      <section className="bg-white rounded-xl p-4 border border-[#E5E7EB] shadow-xs">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E5E7EB]">
          <h2 className="text-sm font-semibold text-[#000000] flex items-center gap-2">
            <Building className="w-4 h-4 text-[#2563EB]" />
            Check venue availability
          </h2>
          <span className="text-xs text-[#6B7280]">
            {availableFacilitiesCount} venue(s) available
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-[#4B5563] mb-1">
              Date
            </label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-[#D1D5DB] text-xs text-[#111827] bg-white focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#4B5563] mb-1">
              Start time
            </label>
            <input
              type="time"
              value={filterStart}
              onChange={(e) => setFilterStart(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-[#D1D5DB] text-xs text-[#111827] bg-white focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#4B5563] mb-1">
              End time
            </label>
            <input
              type="time"
              value={filterEnd}
              onChange={(e) => setFilterEnd(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-[#D1D5DB] text-xs text-[#111827] bg-white focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
            />
          </div>
        </div>
      </section>

      {/* Main Sections: Requests Waiting for Approval & Approved Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Waiting for approval */}
        <section className="bg-white rounded-xl p-5 border border-[#E5E7EB] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                <Clock className="w-4 h-4 text-[#7C3AED]" />
                <h3 className="font-semibold text-sm text-[#000000]">
                  Waiting for approval
                </h3>
                <button
                  type="button"
                  id="refresh-waiting-approval-btn"
                  onClick={handleRefreshWaiting}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-[#4B5563] hover:text-[#000000] bg-[#F3F4F6] hover:bg-[#E5E7EB] border border-[#E5E7EB] transition-all cursor-pointer"
                  title="Refresh waiting for approval"
                  aria-label="Refresh waiting for approval"
                >
                  <RotateCcw className={`w-3 h-3 text-[#7C3AED] ${isRefreshingWaiting ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
              <Link
                href="/approvals"
                className="text-xs font-medium text-[#7C3AED] hover:underline"
              >
                View all &rarr;
              </Link>
            </div>

            <div className="divide-y divide-[#E5E7EB]">
              {pendingBookings.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#6B7280]">
                  No requests waiting for approval.
                </div>
              ) : (
                pendingBookings.slice(0, 4).map((booking) => (
                  <div key={booking.id} className="py-3.5 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F3F4F6] text-[#4B5563]">
                            {booking.bookingRef}
                          </span>
                          <span className="text-xs font-medium text-[#7C3AED]">
                            {booking.clubName}
                          </span>
                        </div>
                        <h4 className="font-semibold text-sm text-[#000000] mt-1">
                          {booking.eventName}
                        </h4>
                        <p className="text-xs text-[#6B7280]">
                          {booking.facilityName} &bull; {formatIstDate(booking.startUtc)} ({booking.startTime} - {booking.endTime})
                        </p>
                      </div>

                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE]">
                        <Clock className="w-3 h-3" />
                        Waiting for approval
                      </span>
                    </div>

                    <WorkflowTracker booking={booking} compact />
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-[#E5E7EB] flex items-center gap-2">
            <BubbleButton href="/approvals" variant="secondary" size="sm" className="flex-1">
              Manage approvals
            </BubbleButton>
            <BubbleButton
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleRefreshWaiting}
              icon={<RotateCcw className={`w-3 h-3 ${isRefreshingWaiting ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </BubbleButton>
          </div>
        </section>

        {/* Approved bookings & hall passes */}
        <section className="bg-white rounded-xl p-5 border border-[#E5E7EB] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                <CheckCircle2 className="w-4 h-4 text-[#2563EB]" />
                <h3 className="font-semibold text-sm text-[#000000]">
                  Approved bookings &amp; hall passes
                </h3>
                <button
                  type="button"
                  id="refresh-approved-bookings-btn"
                  onClick={handleRefreshApproved}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-[#4B5563] hover:text-[#000000] bg-[#F3F4F6] hover:bg-[#E5E7EB] border border-[#E5E7EB] transition-all cursor-pointer"
                  title="Refresh approved bookings and hall passes"
                  aria-label="Refresh approved bookings and hall passes"
                >
                  <RotateCcw className={`w-3 h-3 text-[#2563EB] ${isRefreshingApproved ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
              <Link
                href="/requests"
                className="text-xs font-medium text-[#2563EB] hover:underline"
              >
                View all &rarr;
              </Link>
            </div>

            <div className="divide-y divide-[#E5E7EB]">
              {approvedBookings.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#6B7280]">
                  No approved bookings yet.
                </div>
              ) : (
                approvedBookings.slice(0, 3).map((booking) => (
                  <div key={booking.id} className="py-3.5 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB]">
                            {booking.bookingRef}
                          </span>
                          <span className="text-xs font-medium text-[#111827]">
                            {booking.clubName}
                          </span>
                        </div>
                        <h4 className="font-semibold text-sm text-[#000000] mt-1">
                          {booking.eventName}
                        </h4>
                        <p className="text-xs text-[#6B7280]">
                          {booking.facilityName} &bull; {formatIstDate(booking.startUtc)} ({booking.startTime} - {booking.endTime})
                        </p>
                      </div>

                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                        <CheckCircle2 className="w-3 h-3" />
                        Approved
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-[#6B7280] flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {booking.attendeeCount} attendees
                      </span>

                      <BubbleButton
                        href={`/pass/${booking.id}`}
                        variant="primary"
                        size="sm"
                        icon={<QrCode className="w-3.5 h-3.5" />}
                      >
                        View hall pass
                      </BubbleButton>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-[#E5E7EB] flex items-center gap-2">
            <BubbleButton href="/requests" variant="secondary" size="sm" className="flex-1">
              View all requests
            </BubbleButton>
            <BubbleButton
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleRefreshApproved}
              icon={<RotateCcw className={`w-3 h-3 ${isRefreshingApproved ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </BubbleButton>
          </div>
        </section>
      </div>
    </div>
  );
}
