'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useCampusStore } from '@/lib/store';

export function AppFooter() {
  const pathname = usePathname();
  const { isAuthenticated } = useCampusStore();

  const isAuthRoute =
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/forgot-password' ||
    pathname.startsWith('/auth/');

  // Hide footer on authentication routes or when unauthenticated to keep login focused
  if (!isAuthenticated || isAuthRoute) {
    return null;
  }

  return (
    <footer className="border-t border-[#E5E7EB] bg-white py-6 text-xs text-[#6B7280] no-print mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
          <span className="font-semibold text-[#111827]">CampusSpace</span>
          <span>&bull; Facility scheduling and hall pass system</span>
        </div>

        <div className="text-[11px] text-[#6B7280]">
          Timezone: Asia/Kolkata (IST) &bull; College facility portal
        </div>
      </div>
    </footer>
  );
}
