import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminChallenge } from '@/lib/email-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { challengeId, code1, code2, otp1, otp2 } = body;

    const targetCode1 = code1 || otp1;
    const targetCode2 = code2 || otp2;

    if (!challengeId) {
      return NextResponse.json(
        { success: false, error: 'Challenge ID is required.' },
        { status: 400 }
      );
    }

    const result = await verifyAdminChallenge({
      challengeId,
      code1: targetCode1,
      code2: targetCode2,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          code1Valid: result.code1Valid,
          code2Valid: result.code2Valid,
        },
        { status: result.statusCode || 401 }
      );
    }

    // Set secure server-side session cookie
    const response = NextResponse.json({
      success: true,
      user: result.user,
      token: result.sessionToken,
      message: 'Dual-email verification successful. Administrator session authorized.',
    });

    if (result.sessionToken) {
      response.cookies.set('campus_admin_session_v1', result.sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 8 * 60 * 60, // 8 hours
        path: '/',
      });
    }

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to verify administrative challenge.' },
      { status: 500 }
    );
  }
}
