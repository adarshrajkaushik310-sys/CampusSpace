'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useCampusStore } from '@/lib/store';

interface AuthGuardProps {
  children: React.ReactNode;
}

const PUBLIC_ROUTES = ['/login', '/signup', '/forgot-password', '/verify'];

export function AuthGuard({ children }: AuthGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, authLoading, sessionUser } = useCampusStore();

  const isPublicRoute =
    PUBLIC_ROUTES.some((route) => pathname.startsWith(route)) ||
    pathname.startsWith('/pass/') ||
    pathname.startsWith('/auth/');

  // Route protection
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated && !isPublicRoute) {
        router.replace('/login');
      } else if (isAuthenticated) {
        if (pathname === '/login' || pathname === '/signup') {
          router.replace('/');
        } else if (
          sessionUser &&
          sessionUser.verificationStatus === 'pending' &&
          (pathname === '/approvals' || pathname === '/book' || pathname === '/facilities')
        ) {
          router.replace('/auth/pending-verification');
        }
      }
    }
  }, [isAuthenticated, authLoading, isPublicRoute, pathname, sessionUser, router]);

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-[#4B5563]">
          Loading CampusSpace...
        </p>
      </div>
    );
  }

  // If unauthenticated on protected route, show clean minimal redirect screen
  if (!isAuthenticated && !isPublicRoute) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-[#4B5563]">
          Redirecting to Sign In...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
