'use client';

import React, { useState } from 'react';
import { useCampusStore } from '@/lib/store';
import { BubbleButton } from '@/components/BubbleButton';
import { getAuthorizedBookingsForUser } from '@/lib/approval-matrix';
import { getTodayIst, addDaysToDate, formatIstDate } from '@/lib/date-utils';
import {
  BarChart3,
  TrendingUp,
  Building,
  Calendar,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ShieldCheck,
  CalendarPlus,
  Inbox,
  Filter,
} from 'lucide-react';

export default function AnalyticsPage() {
  const { bookings, currentUser, currentRole } = useCampusStore();
  const [dateRange, setDateRange] = useState<'all' | 'upcoming7' | 'upcoming30' | 'past30'>('all');

  // Filter requests strictly by authenticated user's actual approval assignments or submissions
  const authorizedBookings = getAuthorizedBookingsForUser(bookings, currentUser);
  const isRequester = currentRole === 'requester';

  // Apply selected booking-date range consistently
  const today = getTodayIst();
  const filteredBookings = authorizedBookings.filter((b) => {
    if (dateRange === 'all') return true;
    if (dateRange === 'upcoming7') {
      return b.date >= today && b.date <= addDaysToDate(today, 7);
    }
    if (dateRange === 'upcoming30') {
      return b.date >= today && b.date <= addDaysToDate(today, 30);
    }
    if (dateRange === 'past30') {
      return b.date <= today && b.date >= addDaysToDate(today, -30);
    }
    return true;
  });

  // Calculate Requests by Facility (only visible requests, no zero-value placeholders)
  const facilityCounts: Record<string, { id: string; name: string; count: number; category: string }> = {};
  filteredBookings.forEach((b) => {
    if (!facilityCounts[b.facilityId]) {
      facilityCounts[b.facilityId] = {
        id: b.facilityId,
        name: b.facilityName,
        count: 0,
        category: b.facilityCategory || 'general',
      };
    }
    facilityCounts[b.facilityId].count += 1;
  });

  const sortedFacilities = Object.values(facilityCounts).sort((a, b) => b.count - a.count);
  const maxFacilityCount = sortedFacilities.length > 0 ? sortedFacilities[0].count : 1;

  // Calculate Requests by Booking Day (dynamic day-of-week tally from actual booking dates)
  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dayCounts: Record<string, number> = {
    Monday: 0,
    Tuesday: 0,
    Wednesday: 0,
    Thursday: 0,
    Friday: 0,
    Saturday: 0,
    Sunday: 0,
  };

  filteredBookings.forEach((b) => {
    if (!b.date) return;
    const [year, month, day] = b.date.split('-').map(Number);
    if (!year || !month || !day) return;
    const dateObj = new Date(year, month - 1, day);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[dateObj.getDay()];
    if (dayCounts[dayName] !== undefined) {
      dayCounts[dayName] += 1;
    }
  });

  const maxDayCount = Math.max(...Object.values(dayCounts), 1);

  // Status breakdown of visible requests
  const approvedCount = filteredBookings.filter((b) => b.status === 'approved').length;
  const pendingCount = filteredBookings.filter((b) => b.status === 'pending').length;
  const rejectedCount = filteredBookings.filter((b) => b.status === 'rejected' || b.status === 'cancelled').length;

  return (
    <div className="space-y-6 animate-page-enter">
      {/* Header - Clean White Work Surface */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-neutral-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-950 tracking-tight flex items-center gap-2.5">
              <BarChart3 className="w-6 h-6 text-campus-purple flex-shrink-0" />
              <span>Request analytics.</span>
            </h1>
            <p className="text-sm text-neutral-600">
              {currentRole === 'admin'
                ? 'Requests across the campus.'
                : isRequester
                ? 'Your booking requests.'
                : 'Requests assigned to you.'}
            </p>
          </div>

          {/* Date Filter Controls in Compact Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 bg-neutral-50 p-1.5 rounded-lg border border-neutral-200 self-start lg:self-auto flex-shrink-0">
            <div className="flex items-center gap-1.5 px-2 py-1 text-neutral-600 text-xs font-medium border-b sm:border-b-0 sm:border-r border-neutral-200">
              <Filter className="w-3.5 h-3.5 text-neutral-500" />
              <span>Booking date (IST)</span>
            </div>
            <div className="flex flex-wrap items-center gap-1">
              {[
                { id: 'all', label: 'All dates' },
                { id: 'upcoming7', label: 'Next 7 days' },
                { id: 'upcoming30', label: 'Next 30 days' },
                { id: 'past30', label: 'Past 30 days' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setDateRange(p.id as any)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    dateRange === p.id
                      ? 'bg-campus-purple text-white'
                      : 'text-neutral-700 hover:text-neutral-950 hover:bg-neutral-200/60'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area or Empty States */}
      {authorizedBookings.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center border border-neutral-200 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-700 flex items-center justify-center mx-auto border border-neutral-200">
            {isRequester ? <CalendarPlus className="w-6 h-6" /> : <Inbox className="w-6 h-6" />}
          </div>
          <h2 className="text-lg font-semibold text-neutral-950">
            {isRequester
              ? 'You have not submitted any requests yet.'
              : 'No requests have been assigned to you yet.'}
          </h2>
          <p className="text-sm text-neutral-600 max-w-md mx-auto">
            {isRequester
              ? 'Reserve auditoriums, classrooms, sports facilities, or departmental laboratories to generate request analytics.'
              : 'Incoming facility requests assigned to your departmental or institutional authority will appear here once submitted.'}
          </p>
          <div className="pt-2">
            {isRequester ? (
              <BubbleButton href="/facilities" variant="primary" size="md">
                Book a facility
              </BubbleButton>
            ) : (
              <BubbleButton href="/approvals" variant="secondary" size="md">
                View approvals inbox
              </BubbleButton>
            )}
          </div>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center border border-neutral-200 shadow-sm space-y-3">
          <Calendar className="w-8 h-8 text-neutral-400 mx-auto" />
          <h3 className="font-medium text-sm text-neutral-950">
            No requests found for the selected booking date range.
          </h3>
          <p className="text-xs text-neutral-600 max-w-sm mx-auto">
            You have {authorizedBookings.length} total request(s), but none fall within this reservation window.
          </p>
          <div className="pt-1">
            <button
              onClick={() => setDateRange('all')}
              className="text-xs font-medium text-campus-purple hover:underline"
            >
              Reset to all dates
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Metric Strip for Authorized Dataset */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-sm space-y-1">
              <span className="text-xs font-medium text-neutral-500 block">
                Total requests
              </span>
              <p className="text-2xl font-bold text-neutral-950">{filteredBookings.length}</p>
              <span className="text-xs text-neutral-500">In selected filter</span>
            </div>

            <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-sm space-y-1">
              <span className="text-xs font-medium text-campus-blue flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-campus-blue" /> Approved
              </span>
              <p className="text-2xl font-bold text-campus-blue">{approvedCount}</p>
              <span className="text-xs text-neutral-500">Confirmed bookings</span>
            </div>

            <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-sm space-y-1">
              <span className="text-xs font-medium text-campus-purple flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-campus-purple" /> Waiting for approval
              </span>
              <p className="text-2xl font-bold text-campus-purple">{pendingCount}</p>
              <span className="text-xs text-neutral-500">In review</span>
            </div>

            <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-sm space-y-1">
              <span className="text-xs font-medium text-campus-red flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5 text-campus-red" /> Rejected or cancelled
              </span>
              <p className="text-2xl font-bold text-campus-red">{rejectedCount}</p>
              <span className="text-xs text-neutral-500">Not approved</span>
            </div>
          </div>

          {/* Adapted Charts: Requests by Facility & Requests by Booking Day */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Requests by Facility */}
            <div className="bg-white rounded-xl p-5 border border-neutral-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <h3 className="font-semibold text-sm text-neutral-950 flex items-center gap-2">
                  <Building className="w-4 h-4 text-campus-purple" />
                  Requests by facility
                </h3>
                <span className="text-xs text-neutral-500">
                  {sortedFacilities.length} {sortedFacilities.length === 1 ? 'facility' : 'facilities'} active
                </span>
              </div>

              <div className="space-y-3 pt-1">
                {sortedFacilities.map((fac, idx) => {
                  const percentage = Math.round((fac.count / maxFacilityCount) * 100);

                  return (
                    <div key={fac.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-neutral-900 truncate max-w-[200px]">
                          {idx + 1}. {fac.name}
                        </span>
                        <span className="font-mono text-campus-blue font-semibold">
                          {fac.count} {fac.count === 1 ? 'request' : 'requests'}
                        </span>
                      </div>
                      <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden border border-neutral-200">
                        <div
                          className="bg-campus-blue h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.max(percentage, 8)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chart 2: Requests by Booking Day */}
            <div className="bg-white rounded-xl p-5 border border-neutral-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <h3 className="font-semibold text-sm text-neutral-950 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-campus-purple" />
                  Requests by booking day
                </h3>
                <span className="text-xs text-neutral-500">Day-of-week distribution</span>
              </div>

              <div className="space-y-2.5 pt-1">
                {dayOrder.map((day) => {
                  const count = dayCounts[day] || 0;
                  const pct = (count / maxDayCount) * 100;
                  const hasRequests = count > 0;

                  return (
                    <div key={day} className="flex items-center gap-3 text-xs">
                      <span className={`w-20 font-medium ${hasRequests ? 'text-neutral-950' : 'text-neutral-400'}`}>
                        {day}
                      </span>
                      <div className="flex-1 bg-neutral-100 rounded-full h-2 overflow-hidden border border-neutral-200">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            hasRequests ? 'bg-campus-purple' : 'bg-transparent'
                          }`}
                          style={{ width: hasRequests ? `${Math.max(pct, 8)}%` : '0%' }}
                        />
                      </div>
                      <span className="w-16 text-right font-mono text-neutral-500 text-xs">
                        {count} {count === 1 ? 'req' : 'reqs'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Scoped Request Details Table */}
          <div className="bg-white rounded-xl p-5 border border-neutral-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="font-semibold text-sm text-neutral-950 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-campus-purple" />
                Requests list ({filteredBookings.length})
              </h3>
              <span className="text-xs text-neutral-500 font-mono">
                {currentRole === 'admin' ? 'Campus scope' : isRequester ? 'Your submissions' : 'Assigned scope'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-500 uppercase tracking-wider text-[11px]">
                    <th className="pb-2.5 font-medium">Reference</th>
                    <th className="pb-2.5 font-medium">Event name</th>
                    <th className="pb-2.5 font-medium">Facility</th>
                    <th className="pb-2.5 font-medium">Booking date</th>
                    <th className="pb-2.5 font-medium">Time (IST)</th>
                    <th className="pb-2.5 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-neutral-50/70 transition-colors">
                      <td className="py-2.5 font-mono font-medium text-neutral-950">{b.bookingRef}</td>
                      <td className="py-2.5 font-medium text-neutral-900 max-w-[200px] truncate">{b.eventName}</td>
                      <td className="py-2.5 text-neutral-600">{b.facilityName}</td>
                      <td className="py-2.5 text-neutral-600">{b.date}</td>
                      <td className="py-2.5 font-mono text-neutral-600">{b.startTime} - {b.endTime}</td>
                      <td className="py-2.5 text-right">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                            b.status === 'approved'
                              ? 'bg-blue-50 text-campus-blue border-blue-200'
                              : b.status === 'pending'
                              ? 'bg-purple-50 text-campus-purple border-purple-200'
                              : 'bg-red-50 text-campus-red border-red-200'
                          }`}
                        >
                          {b.status === 'approved' ? (
                            <CheckCircle2 className="w-3 h-3 text-campus-blue" />
                          ) : b.status === 'pending' ? (
                            <Clock className="w-3 h-3 text-campus-purple" />
                          ) : (
                            <XCircle className="w-3 h-3 text-campus-red" />
                          )}
                          {b.status === 'approved'
                            ? 'Approved'
                            : b.status === 'pending'
                            ? 'Waiting for approval'
                            : 'Rejected'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
