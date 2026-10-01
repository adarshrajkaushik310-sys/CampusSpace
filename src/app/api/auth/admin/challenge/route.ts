import { NextRequest, NextResponse } from 'next/server';
import { createAdminLoginChallenge } from '@/lib/email-service';

/**
 * Administrator Login Challenge Endpoint: POST /api/auth/admin/challenge
 *
 * Password-Free Administrator Initiation:
 * - Accepts claimed name only for session tracking & audit logs.
 * - Administrator identity and recipient email (campusspaceadmin@gmail.com)
 *   are strictly derived from the administrator's database record.
 * - Does NOT accept any browser-supplied destination email or administrator identity.
 * - Generates two distinct 6-digit verification codes and dispatches them via Nodemailer.
 */
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || '';
    const body = await req.json().catch(() => ({}));

    const { name, claimedName } = body;
    const targetName = claimedName || name;

    if (!targetName || typeof targetName !== 'string' || !targetName.trim()) {
      return NextResponse.json(
        { success: false, error: 'Name is required to initiate administrator verification.' },
        { status: 400 }
      );
    }

    const result = await createAdminLoginChallenge({
      name: targetName.trim(),
      clientIp: ip,
      userAgent,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.statusCode || 400 }
      );
    }

    return NextResponse.json({
      success: true,
      challengeId: result.challengeId,
      state: result.clientState,
      ...result.clientState,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to initialize administrative login challenge.' },
      { status: 500 }
    );
  }
}
