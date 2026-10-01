import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_CHALLENGES,
  getClientChallengeState,
} from '@/lib/email-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const challengeId = searchParams.get('challengeId');

    if (!challengeId) {
      return NextResponse.json(
        { success: false, error: 'Challenge ID query parameter is required.' },
        { status: 400 }
      );
    }

    const challenge = ADMIN_CHALLENGES.get(challengeId);
    if (!challenge) {
      return NextResponse.json(
        { success: false, error: 'Challenge not found or expired.' },
        { status: 404 }
      );
    }

    const clientState = getClientChallengeState(challenge);

    return NextResponse.json({
      success: true,
      state: clientState,
      ...clientState,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to retrieve challenge status.' },
      { status: 500 }
    );
  }
}
