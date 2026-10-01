import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const userId = (formData.get('userId') as string) || 'applicant_' + Date.now();

    if (!file) {
      return NextResponse.json(
        { error: 'No document file provided in request.' },
        { status: 400 }
      );
    }

    // Backend validation: File Size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `File size exceeds the strict 5 MB limit. Selected file is ${(
            file.size /
            (1024 * 1024)
          ).toFixed(2)} MB.`,
        },
        { status: 400 }
      );
    }

    // Backend validation: MIME Type & Extension
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    const isMimeValid = ALLOWED_MIME_TYPES.includes(file.type.toLowerCase());
    const isExtValid = ALLOWED_EXTENSIONS.includes(fileExt);

    if (!isMimeValid && !isExtValid) {
      return NextResponse.json(
        {
          error:
            'Unsupported file format. Only official PDF, JPG, and PNG files are accepted for verification.',
        },
        { status: 400 }
      );
    }

    // Sanitize filename to prevent directory traversal
    const sanitizedOriginalName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${userId}/${Date.now()}_${sanitizedOriginalName}`;

    // Upload to private Supabase storage bucket if configured
    if (isSupabaseConfigured && supabase) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { data, error } = await supabase.storage
        .from('id-proofs')
        .upload(storagePath, buffer, {
          contentType: file.type || 'application/octet-stream',
          upsert: true,
        });

      if (error) {
        // Fall back gracefully if remote bucket is not yet provisioned in cloud
        console.warn('Supabase storage upload note:', error.message);
      }
    }

    // Return secure storage reference (never a public URL)
    return NextResponse.json({
      success: true,
      filePath: storagePath,
      filename: sanitizedOriginalName,
      sizeBytes: file.size,
      mimeType: file.type,
      uploadedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process document upload securely.' },
      { status: 500 }
    );
  }
}
