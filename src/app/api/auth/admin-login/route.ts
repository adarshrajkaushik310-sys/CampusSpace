import { NextRequest, NextResponse } from 'next/server';

/**
 * Securely Retired Endpoint: /api/auth/admin-login
 *
 * Replaced by password-free dual email OTP administrator verification:
 * - /api/auth/admin/challenge
 * - /api/auth/admin/resend
 * - /api/auth/admin/verify
 *
 * Historical records, audit trails, and previous permissions are preserved.
 */
export async function POST(req: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      retired: true,
      error: 'Legacy administrator password authentication has been retired. Administrator access now uses password-free dual email OTP verification to campusspaceadmin@gmail.com.',
      targetFlow: '/login',
    },
    { status: 410 }
  );
}
