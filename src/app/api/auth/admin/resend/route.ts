import { NextRequest, NextResponse } from 'next/server';
import { resendAdminBothCodes } from '@/lib/email-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { challengeId } = body;

    if (!challengeId) {
      return NextResponse.json(
        { success: false, error: 'Challenge ID is required.' },
        { status: 400 }
      );
    }

    const result = await resendAdminBothCodes({
      challengeId,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          retryAfterSeconds: result.retryAfterSeconds,
        },
        { status: result.statusCode || 400 }
      );
    }

    return NextResponse.json({
      success: true,
      state: result.clientState,
      ...result.clientState,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to resend verification codes.' },
      { status: 500 }
    );
  }
}
