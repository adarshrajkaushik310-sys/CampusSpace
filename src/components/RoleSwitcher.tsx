'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useCampusStore } from '@/lib/store';
import { DEMO_USERS } from '@/lib/seed-data';
import { Role } from '@/lib/types';
import { UserCheck, ChevronDown, Check, Info } from 'lucide-react';

export function RoleSwitcher() {
  const { currentRole, currentUser, switchRole, bookings, applicants, isAuthenticated } = useCampusStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  if (!isAuthenticated) {
    return null;
  }

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute pending approval counts for each role
  const getBadgeCount = (role: Role) => {
    switch (role) {
      case 'secretary':
        return bookings.filter((b) => b.currentStage === 'secretary_review').length;
      case 'faculty_advisor':
        return bookings.filter((b) => b.currentStage === 'faculty_review').length;
      case 'hod':
        return bookings.filter((b) => b.currentStage === 'hod_review').length;
      case 'estate_manager':
        return bookings.filter((b) => b.currentStage === 'estate_review').length;
      case 'registrar':
        return applicants.filter((a) => a.verificationStatus === 'pending').length;
      case 'principal':
        return bookings.filter((b) => b.status === 'pending').length;
      case 'requester':
        return bookings.filter((b) => b.clubName === 'Coding Club').length;
      default:
        return 0;
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#111827] border border-[#374151] hover:border-[#6B7280] hover:bg-[#1F2937] transition-all text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
        title="Switch user role"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span className="text-sm leading-none">{currentUser.avatar}</span>
        <div className="text-left hidden sm:block">
          <p className="font-semibold text-white leading-tight flex items-center gap-1">
            <span className="truncate max-w-[100px]">{currentUser.name}</span>
          </p>
        </div>
        <ChevronDown className={`w-3 h-3 text-[#9CA3AF] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="origin-bottom-left absolute bottom-full mb-2 left-0 w-72 rounded-xl shadow-panel bg-white border border-[#E5E7EB] divide-y divide-[#E5E7EB] z-50 animate-dropdown-enter text-[#111827]">
          <div className="p-3 bg-[#F9FAFB] rounded-t-xl">
            <div className="flex items-center gap-1.5 text-[#000000] font-semibold text-xs">
              <UserCheck className="w-4 h-4 text-[#2563EB]" />
              Role switcher
            </div>
            <p className="text-[11px] text-[#4B5563] mt-1 flex items-start gap-1">
              <Info className="w-3.5 h-3.5 text-[#6B7280] flex-shrink-0 mt-0.5" />
              <span>Simulates role-based authorization for the sequential approval pipeline.</span>
            </p>
          </div>

          <div className="py-1 max-h-72 overflow-y-auto">
            {DEMO_USERS.map((user) => {
              const isSelected = user.role === currentRole;
              const pendingCount = getBadgeCount(user.role);

              return (
                <button
                  key={user.id}
                  onClick={() => {
                    switchRole(user.role);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between text-xs hover:bg-[#F3F4F6] transition-colors ${isSelected ? 'bg-[#EFF6FF] font-medium text-[#2563EB]' : 'text-[#111827]'
                    }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{user.avatar}</span>
                    <div>
                      <p className={`font-semibold ${isSelected ? 'text-[#2563EB]' : 'text-[#111827]'}`}>
                        {user.name}
                      </p>
                      <p className="text-[10px] text-[#6B7280]">{user.title}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {pendingCount > 0 && (
                      <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-[#7C3AED] text-white">
                        {pendingCount}
                      </span>
                    )}
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#2563EB]" />}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-2 bg-[#F9FAFB] rounded-b-xl text-[10px] text-[#6B7280] text-center">
            Role changes apply immediately to your current session.
          </div>
        </div>
      )}
    </div>
  );
}
