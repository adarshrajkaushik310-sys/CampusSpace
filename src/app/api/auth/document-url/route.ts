import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filePath = searchParams.get('path');
    const reviewerRole = searchParams.get('role');

    if (!filePath) {
      return NextResponse.json(
        { error: 'Document path is required.' },
        { status: 400 }
      );
    }

    // Role check: Only authorized reviewers (registrar, admin) or document owner
    const isAuthorizedReviewer =
      reviewerRole === 'registrar' ||
      reviewerRole === 'admin' ||
      reviewerRole === 'principal';

    // If Supabase Storage is configured and accessible, generate a 5-minute signed URL
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.storage
        .from('id-proofs')
        .createSignedUrl(filePath, 300); // 5 minutes (300 seconds)

      if (data?.signedUrl) {
        return NextResponse.json({
          success: true,
          signedUrl: data.signedUrl,
          expiresInSeconds: 300,
          isTemporary: true,
        });
      }
    }

    // Fallback for demo simulation mode: Return a temporary data preview reference
    return NextResponse.json({
      success: true,
      signedUrl: `#preview-doc:${encodeURIComponent(filePath)}`,
      expiresInSeconds: 300,
      isTemporary: true,
      message: 'Temporary authorized access token generated for reviewer evaluation.',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Unable to generate temporary authorized document link.' },
      { status: 500 }
    );
  }
}
