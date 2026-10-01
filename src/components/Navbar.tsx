'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCampusStore } from '@/lib/store';
import { UserAccountMenu } from './UserAccountMenu';
import { BubbleButton } from './BubbleButton';
import { RoleSwitcher } from './RoleSwitcher';
import { isBookingAssignedToUser } from '@/lib/approval-matrix';
import {
  Compass,
  CalendarPlus,
  BookmarkCheck,
  Inbox,
  BarChart3,
  Menu,
  X,
  UserCheck,
  ShieldCheck,
  Building,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const {
    bookings,
    currentRole,
    currentUser,
    isAuthenticated,
    applicants,
    resetDemoData,
    isDemoMode,
  } = useCampusStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // If user is unauthenticated or on public authentication routes, hide all navigation and accounts
  const isAuthRoute =
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/forgot-password' ||
    pathname.startsWith('/auth/');

  if (!isAuthenticated || isAuthRoute) {
    return null;
  }

  // Compute pending approvals relevant for current approver
  const getApprovalCount = () => {
    return bookings.filter((b) => {
      if (b.status !== 'pending') return false;
      if (!isBookingAssignedToUser(b, currentUser)) return false;

      if (currentRole === 'principal') {
        const step = b.approvalSteps.find((s) => s.stage === 'principal');
        return step && step.decision === 'pending';
      }
      if (currentRole === 'registrar') {
        const step = b.approvalSteps.find((s) => s.stage === 'registrar');
        return step && step.decision === 'pending';
      }
      if (currentRole === 'hod') {
        const step = b.approvalSteps.find((s) => s.stage === 'hod');
        return step && step.decision === 'pending';
      }
      return false;
    }).length;
  };

  const pendingApprovalsCount = getApprovalCount();
  const pendingApplicantsCount = applicants.filter((a) => a.verificationStatus === 'pending').length;
  const isApproverRole = currentRole === 'principal' || currentRole === 'registrar' || currentRole === 'hod';

  const navLinks = [
    { href: '/', label: 'Dashboard', icon: <Compass className="w-4 h-4" /> },
    { href: '/facilities', label: 'Facilities', icon: <Building className="w-4 h-4" /> },
    { href: '/requests', label: 'My requests', icon: <BookmarkCheck className="w-4 h-4" /> },
    ...(isApproverRole
      ? [
        {
          href: '/approvals',
          label: 'Approvals',
          icon: <Inbox className="w-4 h-4" />,
          badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
        },
      ]
      : []),
    ...(currentRole === 'registrar'
      ? [
        {
          href: '/verifications',
          label: 'Verifications',
          icon: <UserCheck className="w-4 h-4" />,
          badge: pendingApplicantsCount > 0 ? pendingApplicantsCount : undefined,
        },
      ]
      : []),
    ...(currentUser?.role === 'admin'
      ? [
        {
          href: '/admin',
          label: 'Admin overview',
          icon: <ShieldCheck className="w-4 h-4" />,
        },
      ]
      : []),
    { href: '/analytics', label: 'Request analytics', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  const handleResetDemo = () => {
    resetDemoData();
    setResetSuccess(true);
    setTimeout(() => setResetSuccess(false), 2500);
  };

  return (
    <>
      {/* ===================================================================== */}
      {/* TOP NAVIGATION BAR (Clean, White #FFFFFF, Border #E5E7EB, Sticky)     */}
      {/* ===================================================================== */}
      <header className="sticky top-0 z-30 bg-white border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Brand Logo & Horizontal Nav Links */}
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
                <span className="font-bold text-base tracking-tight text-[#000000]">CampusSpace</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-neutral-100 text-[#4B5563] rounded border border-neutral-200">
                  College
                </span>
              </Link>

              {/* Desktop Navigation Links */}
              <nav className="hidden lg:flex items-center gap-1" aria-label="Main Navigation">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${isActive
                          ? 'bg-[#111827] text-white'
                          : 'text-[#4B5563] hover:text-[#000000] hover:bg-neutral-100'
                        }`}
                    >
                      <span>{link.label}</span>
                      {link.badge !== undefined && (
                        <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-[#7C3AED] text-white">
                          {link.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Right: Actions, Role Switcher & User Account */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <BubbleButton
                href="/facilities"
                variant="primary"
                size="sm"
                icon={<CalendarPlus className="w-3.5 h-3.5" />}
                className="hidden sm:inline-flex"
              >
                Book a facility
              </BubbleButton>

              <RoleSwitcher />

              <UserAccountMenu />

              {/* Mobile Hamburger Toggle */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-lg text-[#4B5563] hover:text-[#000000] hover:bg-neutral-100 transition-colors"
                aria-label="Open navigation menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* MOBILE ACCESSIBLE NAVIGATION DRAWER                                   */}
      {/* ===================================================================== */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative ml-auto w-full max-w-xs bg-white text-[#111827] h-full shadow-2xl flex flex-col justify-between p-6 z-10 animate-dialog-enter">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
                  <span className="font-bold text-base text-[#000000]">CampusSpace</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-[#4B5563] hover:text-[#000000] hover:bg-neutral-100 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Nav Links */}
              <nav className="mt-4 space-y-1">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${isActive
                          ? 'bg-[#111827] text-white'
                          : 'text-[#4B5563] hover:text-[#000000] hover:bg-neutral-100'
                        }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {link.icon}
                        <span>{link.label}</span>
                      </div>
                      {link.badge !== undefined && (
                        <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-[#7C3AED] text-white">
                          {link.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-4 pt-4 border-t border-[#E5E7EB]">
                <BubbleButton
                  href="/facilities"
                  variant="primary"
                  size="sm"
                  className="w-full justify-center"
                  icon={<CalendarPlus className="w-3.5 h-3.5" />}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Book a facility
                </BubbleButton>
              </div>
            </div>

            {/* Mobile Drawer Footer: Demo Reset */}
            <div className="pt-4 border-t border-[#E5E7EB] space-y-2">
              <div className="flex items-center justify-between text-xs text-[#6B7280]">
                <span>Demo mode:</span>
                <span className="font-semibold text-[#111827]">{isDemoMode ? 'Active' : 'Live'}</span>
              </div>
              <button
                type="button"
                onClick={handleResetDemo}
                className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-[#4B5563] hover:text-[#000000] rounded-lg border border-[#E5E7EB] hover:bg-neutral-50 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Reset demo data</span>
              </button>
              {resetSuccess && (
                <p className="text-[11px] text-[#2563EB] text-center font-medium">
                  Demo data restored successfully.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
