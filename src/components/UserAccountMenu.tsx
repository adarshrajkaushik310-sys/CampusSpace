'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCampusStore } from '@/lib/store';
import { BubbleButton } from './BubbleButton';
import {
  User,
  LogOut,
  ShieldCheck,
  Building,
  BookmarkCheck,
  ChevronDown,
  X,
  CheckCircle2,
} from 'lucide-react';

export function UserAccountMenu() {
  const router = useRouter();
  const { currentUser, logout, isAuthenticated } = useCampusStore();
  const [isOpen, setIsOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isAuthenticated || !currentUser) {
    return null;
  }

  const handleLogout = async () => {
    setIsOpen(false);
    try {
      localStorage.removeItem('campus_space_auth_session_v3');
      localStorage.removeItem('campus_space_role_v2');
      sessionStorage.clear();
    } catch {}
    await logout();
    router.push('/login');
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'principal':
        return 'Campus Principal';
      case 'registrar':
        return 'Campus Registrar';
      case 'hod':
        return 'Head of Department';
      case 'requester':
        return 'Club Requester';
      case 'secretary':
        return 'Student Council Secretary';
      case 'faculty_advisor':
        return 'Faculty Advisor';
      case 'estate_manager':
        return 'Estate & Facility Officer';
      case 'security':
        return 'Security Supervisor';
      default:
        return role;
    }
  };

  const relevantUnit = currentUser.role === 'admin'
    ? 'Office of System Administration'
    : (currentUser.club || currentUser.department || 'Campus Member');

  return (
    <>
      <div className="relative inline-block text-left" ref={menuRef}>
        {/* Trigger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-full bg-white border border-[#D1D5DB] shadow-xs hover:border-[#9CA3AF] hover:bg-[#F9FAFB] transition-all text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
          title={`Signed in as ${currentUser.name}`}
          aria-haspopup="true"
          aria-expanded={isOpen}
          id="user-account-menu-button"
        >
          <div className="w-6 h-6 rounded-full bg-[#111827] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
            {currentUser.avatar || <User className="w-3.5 h-3.5" />}
          </div>
          <div className="text-left hidden sm:block min-w-0">
            <p className="font-semibold text-[#111827] leading-tight flex items-center gap-1.5">
              <span className="truncate max-w-[120px] sm:max-w-[150px] lg:max-w-[180px]">
                {currentUser.role === 'admin'
                  ? (currentUser.claimedName ? `Administrator (${currentUser.claimedName})` : 'Administrator')
                  : currentUser.name}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#2563EB] bg-[#EFF6FF] px-1.5 py-0.2 rounded-full border border-[#BFDBFE] flex-shrink-0">
                Verified
              </span>
            </p>
            <p className="text-[10px] text-[#4B5563] truncate max-w-[120px] sm:max-w-[150px] font-normal">
              {getRoleDisplayName(currentUser.role)}
            </p>
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 text-[#6B7280] transition-transform flex-shrink-0 ${
              isOpen ? 'rotate-180 text-[#111827]' : ''
            }`}
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="origin-top-right absolute right-0 mt-2 w-72 rounded-xl shadow-panel bg-white border border-[#E5E7EB] divide-y divide-[#E5E7EB] z-50 animate-dropdown-enter">
            {/* Authenticated User Header */}
            <div className="p-4 bg-[#F9FAFB] rounded-t-xl">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-[#111827] text-white flex items-center justify-center text-base font-bold flex-shrink-0">
                  {currentUser.avatar || currentUser.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-[#000000] text-sm truncate">
                    {currentUser.role === 'admin'
                      ? (currentUser.claimedName ? `Administrator (${currentUser.claimedName})` : 'Administrator')
                      : currentUser.name}
                  </p>
                  <p className="text-xs text-[#4B5563] truncate mt-0.5">
                    {currentUser.role === 'admin'
                      ? (currentUser.claimedName ? `Claimed name: ${currentUser.claimedName}` : 'Central Administration')
                      : currentUser.email}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                      <ShieldCheck className="w-3 h-3 text-[#2563EB]" />
                      {getRoleDisplayName(currentUser.role)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Department / Club Badge */}
              <div className="mt-3 pt-3 border-t border-[#E5E7EB] flex items-center gap-1.5 text-xs text-[#4B5563]">
                <Building className="w-3.5 h-3.5 text-[#4B5563] flex-shrink-0" />
                <span className="truncate font-medium">{relevantUnit}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="p-1.5 space-y-0.5">
              {currentUser.role === 'admin' && (
                <Link
                  href="/admin"
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#111827] hover:bg-[#F3F4F6] rounded-lg transition-colors text-left"
                  id="admin-dashboard-menu-link"
                >
                  <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
                  <span>Admin overview</span>
                </Link>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setShowProfileModal(true);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#111827] hover:bg-[#F3F4F6] rounded-lg transition-colors text-left"
                id="my-profile-button"
              >
                <User className="w-4 h-4 text-[#4B5563]" />
                <span>My profile</span>
              </button>

              <Link
                href="/requests"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#111827] hover:bg-[#F3F4F6] rounded-lg transition-colors text-left"
              >
                <BookmarkCheck className="w-4 h-4 text-[#4B5563]" />
                <span>My requests</span>
              </Link>
            </div>

            {/* Logout Option */}
            <div className="p-1.5">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#DC2626] hover:bg-[#FEF2F2] rounded-lg transition-colors text-left"
                id="user-logout-button"
              >
                <LogOut className="w-4 h-4 text-[#DC2626]" />
                <span>Log out</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* "My Profile" Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-panel border border-[#E5E7EB] relative animate-dialog-enter text-[#111827]">
            <button
              onClick={() => setShowProfileModal(false)}
              className="absolute top-4 right-4 p-2 text-[#4B5563] hover:text-[#000000] rounded-full hover:bg-[#F3F4F6] transition-colors"
              aria-label="Close Profile Modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-full bg-[#111827] text-white flex items-center justify-center text-lg font-bold">
                {currentUser.avatar || currentUser.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#000000]">{currentUser.name}</h3>
                <p className="text-xs text-[#4B5563]">{currentUser.email}</p>
              </div>
            </div>

            <div className="space-y-3 bg-[#F9FAFB] p-4 rounded-lg border border-[#E5E7EB] text-xs">
              <div className="flex justify-between items-center py-1 border-b border-[#E5E7EB]">
                <span className="text-[#4B5563] font-medium">Role:</span>
                <span className="font-semibold text-[#000000] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB]" />
                  {getRoleDisplayName(currentUser.role)}
                </span>
              </div>

              {currentUser.role === 'admin' && (
                <>
                  {currentUser.claimedName && (
                    <div className="flex justify-between items-center py-1 border-b border-[#E5E7EB]">
                      <span className="text-[#4B5563] font-medium">Claimed name:</span>
                      <span className="font-semibold text-[#000000]">
                        {currentUser.claimedName}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-1 border-b border-[#E5E7EB]">
                    <span className="text-[#4B5563] font-medium">Authentication:</span>
                    <span className="font-semibold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded-full border border-[#BFDBFE] text-[11px]">
                      Email OTP verified
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-[#E5E7EB]">
                    <span className="text-[#4B5563] font-medium">Registered email:</span>
                    <span className="font-mono text-[#000000] text-[11px]">
                      campusspaceadmin@gmail.com
                    </span>
                  </div>
                </>
              )}

              {currentUser.club && (
                <div className="flex justify-between items-center py-1 border-b border-[#E5E7EB]">
                  <span className="text-[#4B5563] font-medium">Club:</span>
                  <span className="font-semibold text-[#000000]">{currentUser.club}</span>
                </div>
              )}

              {currentUser.department && (
                <div className="flex justify-between items-center py-1 border-b border-[#E5E7EB]">
                  <span className="text-[#4B5563] font-medium">Department:</span>
                  <span className="font-semibold text-[#000000]">{currentUser.department}</span>
                </div>
              )}

              {currentUser.stream && (
                <div className="flex justify-between items-center py-1 border-b border-[#E5E7EB]">
                  <span className="text-[#4B5563] font-medium">Stream:</span>
                  <span className="font-semibold text-[#000000]">{currentUser.stream}</span>
                </div>
              )}

              {currentUser.subject && (
                <div className="flex justify-between items-center py-1 border-b border-[#E5E7EB]">
                  <span className="text-[#4B5563] font-medium">Subject:</span>
                  <span className="font-semibold text-[#000000]">{currentUser.subject}</span>
                </div>
              )}

              <div className="flex justify-between items-center py-1">
                <span className="text-[#4B5563] font-medium">Status:</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                  Active
                </span>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <BubbleButton
                variant="primary"
                size="sm"
                onClick={() => setShowProfileModal(false)}
              >
                Close
              </BubbleButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
