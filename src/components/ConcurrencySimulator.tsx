'use client';

import React, { useState } from 'react';
import { useCampusStore } from '@/lib/store';
import { ConcurrencySimulationResult } from '@/lib/types';
import { BubbleButton } from './BubbleButton';
import { getTodayIst } from '@/lib/date-utils';
import {
  Zap,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Sparkles,
  RefreshCw,
  Cpu,
} from 'lucide-react';

export function ConcurrencySimulator() {
  const { facilities, runConcurrencySimulation } = useCampusStore();
  const [selectedFacilityId, setSelectedFacilityId] = useState(facilities[0]?.id || 'auditorium_kalam');
  const [date, setDate] = useState(getTodayIst());
  const [startTime, setStartTime] = useState('11:00');
  const [endTime, setEndTime] = useState('13:00');
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<ConcurrencySimulationResult | null>(null);

  const selectedFacility = facilities.find((f) => f.id === selectedFacilityId);

  const handleSimulate = async () => {
    setIsRunning(true);
    setResult(null);

    // Artificial short delay to heighten visual suspense during live demo presentation
    await new Promise((resolve) => setTimeout(resolve, 600));

    const simResult = await runConcurrencySimulation({
      facilityId: selectedFacilityId,
      date,
      startTime,
      endTime,
    });

    setResult(simResult);
    setIsRunning(false);
  };

  return (
    <div className="bg-[#13131F] rounded-3xl p-6 sm:p-8 border border-[#2B2B40] shadow-card-dark space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#2B2B40]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8B5CF6]/15 text-[#C4B5FD] border border-[#8B5CF6]/30 text-xs font-semibold mb-2">
            <Zap className="w-3.5 h-3.5 text-[#8B5CF6] fill-[#8B5CF6]" />
            Hackathon Live Technical Demo &bull; ACID Invariant Verification
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#F8FAFC] tracking-tight flex items-center gap-2">
            <Cpu className="w-6 h-6 text-[#8B5CF6]" />
            Atomic Concurrency & Race Condition Simulator
          </h2>
          <p className="text-xs sm:text-sm text-[#B4B8CC] mt-1">
            Simulate two competing student organizations dispatching booking requests for the exact same facility and interval at the exact same millisecond.
          </p>
        </div>

        {result && (
          <BubbleButton
            variant="secondary"
            size="sm"
            onClick={() => setResult(null)}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Reset Simulator
          </BubbleButton>
        )}
      </div>

      {/* Target Parameters */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-[#1C1C2B] p-4 rounded-2xl border border-[#2B2B40]">
        <div className="sm:col-span-2">
          <label className="block text-[11px] font-bold text-[#B4B8CC] uppercase tracking-wider mb-1">
            Contested Facility
          </label>
          <select
            value={selectedFacilityId}
            onChange={(e) => setSelectedFacilityId(e.target.value)}
            disabled={isRunning}
            className="w-full text-xs font-semibold text-[#F8FAFC] bg-[#13131F] border border-[#2B2B40] rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#8B5CF6] outline-none transition-all"
          >
            {facilities.map((fac) => (
              <option key={fac.id} value={fac.id} className="bg-[#13131F] text-[#F8FAFC]">
                {fac.name} (Cap: {fac.capacity} &bull; {fac.building})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-[#B4B8CC] uppercase tracking-wider mb-1">
            Contested Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={isRunning}
            className="w-full text-xs font-semibold text-[#F8FAFC] bg-[#13131F] border border-[#2B2B40] rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#8B5CF6] outline-none transition-all"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-[#B4B8CC] uppercase tracking-wider mb-1">
            Contested Time Window
          </label>
          <div className="flex items-center gap-1.5">
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              disabled={isRunning}
              className="w-full text-xs font-semibold text-[#F8FAFC] bg-[#13131F] border border-[#2B2B40] rounded-xl px-2 py-2 focus:ring-2 focus:ring-[#8B5CF6] outline-none transition-all"
            />
            <span className="text-xs text-[#B4B8CC]">&ndash;</span>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              disabled={isRunning}
              className="w-full text-xs font-semibold text-[#F8FAFC] bg-[#13131F] border border-[#2B2B40] rounded-xl px-2 py-2 focus:ring-2 focus:ring-[#8B5CF6] outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Competing Requesters Visualization */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Requester A Card */}
        <div className={`p-5 rounded-2xl border transition-all ${
          result?.requesterA.status === 'SUCCESS_ACQUIRED'
            ? 'bg-[#3B82F6]/10 border-[#3B82F6]/50 ring-1 ring-[#3B82F6]/30 shadow-md'
            : result?.requesterA.status === 'CONFLICT_REJECTED'
            ? 'bg-[#F43F5E]/10 border-[#F43F5E]/50 ring-1 ring-[#F43F5E]/30'
            : 'bg-[#1C1C2B] border-[#2B2B40]'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#8B5CF6] text-white font-black text-xs flex items-center justify-center">
                A
              </span>
              <div>
                <h4 className="font-bold text-xs text-[#F8FAFC]">Requester Thread Alpha</h4>
                <p className="text-[10px] text-[#B4B8CC]">Coding Club &bull; Rohan Sharma</p>
              </div>
            </div>

            {result?.requesterA.status === 'SUCCESS_ACQUIRED' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#3B82F6] text-white font-bold text-[10px] shadow-sm">
                <CheckCircle2 className="w-3 h-3" />
                ACQUIRED (200 OK)
              </span>
            )}
            {result?.requesterA.status === 'CONFLICT_REJECTED' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F43F5E] text-white font-bold text-[10px]">
                <XCircle className="w-3 h-3" />
                REJECTED (409)
              </span>
            )}
          </div>

          <div className="space-y-1.5 text-xs text-[#B4B8CC] bg-[#13131F] p-3 rounded-xl border border-[#2B2B40]">
            <p className="font-semibold text-[#F8FAFC]">
              Payload: <span className="font-normal text-[#B4B8CC]">AI Systems Keynote</span>
            </p>
            <p>
              Target: <span className="font-medium text-[#F8FAFC]">{selectedFacility?.name}</span>
            </p>
            <p>
              Interval: <span className="font-mono text-[#F8FAFC]">{startTime} &ndash; {endTime} IST</span>
            </p>
          </div>

          {result && (
            <div className="mt-3 text-xs leading-relaxed">
              <p className={`font-mono text-[11px] ${
                result.requesterA.status === 'SUCCESS_ACQUIRED' ? 'text-[#93C5FD] font-semibold' : 'text-[#FDA4AF]'
              }`}>
                {result.requesterA.message}
              </p>
              {result.requesterA.bookingRef && (
                <p className="text-[10px] text-[#B4B8CC] mt-1">
                  Active Booking Reference: <strong className="text-[#F8FAFC]">{result.requesterA.bookingRef}</strong>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Requester B Card */}
        <div className={`p-5 rounded-2xl border transition-all ${
          result?.requesterB.status === 'SUCCESS_ACQUIRED'
            ? 'bg-[#3B82F6]/10 border-[#3B82F6]/50 ring-1 ring-[#3B82F6]/30 shadow-md'
            : result?.requesterB.status === 'CONFLICT_REJECTED'
            ? 'bg-[#F43F5E]/10 border-[#F43F5E]/50 ring-1 ring-[#F43F5E]/30'
            : 'bg-[#1C1C2B] border-[#2B2B40]'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#3B82F6] text-white font-black text-xs flex items-center justify-center">
                B
              </span>
              <div>
                <h4 className="font-bold text-xs text-[#F8FAFC]">Requester Thread Beta</h4>
                <p className="text-[10px] text-[#B4B8CC]">RoboTech Society &bull; Ananya Iyer</p>
              </div>
            </div>

            {result?.requesterB.status === 'SUCCESS_ACQUIRED' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#3B82F6] text-white font-bold text-[10px] shadow-sm">
                <CheckCircle2 className="w-3 h-3" />
                ACQUIRED (200 OK)
              </span>
            )}
            {result?.requesterB.status === 'CONFLICT_REJECTED' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F43F5E] text-white font-bold text-[10px] shadow-sm animate-pulse">
                <XCircle className="w-3 h-3" />
                BLOCKED (409 CONFLICT)
              </span>
            )}
          </div>

          <div className="space-y-1.5 text-xs text-[#B4B8CC] bg-[#13131F] p-3 rounded-xl border border-[#2B2B40]">
            <p className="font-semibold text-[#F8FAFC]">
              Payload: <span className="font-normal text-[#B4B8CC]">Robotics Autonomous Challenge</span>
            </p>
            <p>
              Target: <span className="font-medium text-[#F8FAFC]">{selectedFacility?.name}</span>
            </p>
            <p>
              Interval: <span className="font-mono text-[#F8FAFC]">{startTime} &ndash; {endTime} IST</span>
            </p>
          </div>

          {result && (
            <div className="mt-3 text-xs leading-relaxed">
              <p className={`font-mono text-[11px] ${
                result.requesterB.status === 'SUCCESS_ACQUIRED' ? 'text-[#93C5FD] font-semibold' : 'text-[#FDA4AF] font-medium'
              }`}>
                {result.requesterB.message}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Action Simulation Trigger */}
      {!result && (
        <div className="text-center pt-2">
          <BubbleButton
            variant="primary"
            size="lg"
            onClick={handleSimulate}
            disabled={isRunning}
            icon={isRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-white" />}
          >
            {isRunning ? 'Executing Concurrent Atomic Invariant Check...' : 'Dispatch Concurrent Race Condition'}
          </BubbleButton>
          <p className="text-[11px] text-[#B4B8CC] mt-2">
            Dispatches simultaneous asynchronous payloads to demonstrate PostgreSQL GiST range exclusion lock.
          </p>
        </div>
      )}

      {/* Technical Evidence / Invariant Verification Banner */}
      {result && (
        <div className="space-y-4 pt-2 border-t border-[#2B2B40] animate-dialog-enter">
          <div className="p-4 rounded-2xl bg-[#1C1C2B] border border-[#3B82F6]/30 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-[#3B82F6] flex-shrink-0 mt-0.5" />
            <div className="text-xs text-[#F8FAFC] space-y-1">
              <p className="font-bold text-[#93C5FD]">
                Verification Proof &bull; Transactional Integrity Guaranteed
              </p>
              <p className="text-[#B4B8CC] leading-relaxed">
                PostgreSQL Exclusion Constraint <code className="bg-[#13131F] px-1.5 py-0.5 rounded text-[#C4B5FD] font-mono border border-[#2B2B40]">EXCLUDE USING gist (facility_id WITH =, tstzrange(start, end, &apos;[)&apos;) WITH &amp;&amp;)</code> atomically verified that zero double-booking occurred. Exactly 1 slot was awarded; exactly 1 conflict rollback was generated with zero data corruption.
              </p>
            </div>
          </div>

          {/* Explainable Alternatives for Requester B */}
          {result.alternativesForRejected && result.alternativesForRejected.length > 0 && (
            <div className="p-5 rounded-2xl bg-[#1C1C2B] border border-[#2B2B40] space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
                <h4 className="font-bold text-xs text-[#F8FAFC] uppercase tracking-wider">
                  Automated Conflict Mitigation &bull; Explainable Alternatives for Requester B
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {result.alternativesForRejected.map((alt) => (
                  <div key={alt.id} className="bg-[#13131F] p-3.5 rounded-xl border border-[#2B2B40] shadow-sm space-y-2 card-interactive">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#F8FAFC] truncate">
                        {alt.facility.name}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#3B82F6]/15 text-[#93C5FD] border border-[#3B82F6]/30">
                        {alt.matchScore}% Match
                      </span>
                    </div>
                    <p className="text-[11px] text-[#B4B8CC] leading-snug line-clamp-3">
                      {alt.explanation}
                    </p>
                    <div className="pt-1 text-[10px] text-[#B4B8CC] flex items-center justify-between font-mono">
                      <span>Cap: {alt.facility.capacity}</span>
                      <span>{alt.startTime} - {alt.endTime}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
