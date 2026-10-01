'use client';

import React, { useState } from 'react';
import { useCampusStore } from '@/lib/store';
import { BubbleButton } from './BubbleButton';
import { AlertCircle, RotateCcw, ShieldCheck, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

export function DemoBanner() {
  const { isDemoMode, resetDemoData, bookings } = useCampusStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [resetNotice, setResetNotice] = useState(false);

  const handleReset = () => {
    resetDemoData();
    setResetNotice(true);
    setTimeout(() => setResetNotice(false), 3000);
  };

  const pendingCount = bookings.filter((b) => b.status === 'pending').length;
  const approvedCount = bookings.filter((b) => b.status === 'approved').length;

  return (
    <div className="bg-[#13131F] border-b border-[#2B2B40] text-[#B4B8CC] text-xs px-4 py-2 relative z-40 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#1C1C2B] text-[#F8FAFC] border border-[#2B2B40]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] animate-pulse" />
            {isDemoMode ? 'DEMO SIMULATION MODE' : 'LIVE BACKEND CONNECTED'}
          </span>
          <span className="text-[#B4B8CC] hidden sm:inline">
            Seeded with 12 facilities, pre-configured approval workflows, and mock Hall Pass QR codes.
          </span>
        </div>

        <div className="flex items-center gap-2">
          {resetNotice && (
            <span className="inline-flex items-center gap-1 text-[#3B82F6] font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#3B82F6]" />
              Reset complete!
            </span>
          )}

          <BubbleButton
            variant="secondary"
            size="sm"
            onClick={handleReset}
            icon={<RotateCcw className="w-3 h-3 text-[#8B5CF6]" />}
          >
            Reset Demo Data
          </BubbleButton>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[#B4B8CC] hover:text-[#F8FAFC] flex items-center gap-1 ml-1 font-medium p-1 rounded-lg hover:bg-[#1C1C2B] transition-colors"
            aria-label="Toggle demo details"
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-[#2B2B40] grid grid-cols-1 md:grid-cols-3 gap-3 text-[#B4B8CC] animate-in fade-in duration-200">
          <div className="bg-[#1C1C2B] p-2.5 rounded-xl border border-[#2B2B40]">
            <p className="font-semibold text-[#F8FAFC] flex items-center gap-1.5 mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#8B5CF6]" />
              Workflow Verification Flow
            </p>
            <p className="text-[11px] text-[#B4B8CC] leading-relaxed">
              Coding Club &rarr; Secretary &rarr; Faculty Advisor &rarr; HOD &rarr; Estate Manager. Use the top-right role switcher to test each sequential approval step.
            </p>
          </div>
          <div className="bg-[#1C1C2B] p-2.5 rounded-xl border border-[#2B2B40]">
            <p className="font-semibold text-[#F8FAFC] flex items-center gap-1.5 mb-1">
              <AlertCircle className="w-3.5 h-3.5 text-[#3B82F6]" />
              Active Interval Guard
            </p>
            <p className="text-[11px] text-[#B4B8CC] leading-relaxed">
              Concurrent conflict prevention uses PostgreSQL <code className="bg-[#13131F] px-1 py-0.5 rounded border border-[#2B2B40] font-mono text-purple-300">tstzrange</code> GiST exclusion intervals <code className="bg-[#13131F] px-1 py-0.5 rounded border border-[#2B2B40] font-mono text-purple-300">[start, end)</code>. Adjacent bookings allowed.
            </p>
          </div>
          <div className="bg-[#1C1C2B] p-2.5 rounded-xl border border-[#2B2B40]">
            <p className="font-semibold text-[#F8FAFC] mb-1">Current Seed Snapshot</p>
            <p className="text-[11px] text-[#B4B8CC]">
              <span className="font-medium text-[#8B5CF6]">{pendingCount} pending</span> &bull;{' '}
              <span className="font-medium text-[#3B82F6]">{approvedCount} approved</span> &bull; 12 smart venues.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
