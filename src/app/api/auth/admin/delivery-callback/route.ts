import { NextRequest, NextResponse } from 'next/server';

/**
 * Securely Retired Endpoint: /api/auth/admin/delivery-callback
 *
 * SMS webhook callbacks have been retired. Administrator verification is now handled
 * via server-side Nodemailer email dispatch to the registered administrator mailbox.
 */
export async function POST(req: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      retired: true,
      message: 'SMS delivery callback endpoint has been retired. Administrator verification is handled via Nodemailer email.',
    },
    { status: 410 }
  );
}
