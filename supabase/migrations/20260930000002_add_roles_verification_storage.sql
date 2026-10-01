-- =====================================================================
-- CampusSpace - Additive Migration: Roles, Verifications & Private Storage
-- 1. Adds 'principal' and 'registrar' to user_role ENUM
-- 2. Extends profiles table with verification state, stream, subject & ID proof
-- 3. Sets up private 'id-proofs' storage bucket with strict RLS
-- 4. Enforces least-privilege server policies (no self-approval)
-- 5. Implements Principal read-only campus oversight without altering the 4-stage approval workflow
-- =====================================================================

-- 1. Extend user_role ENUM
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'principal';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'registrar';

-- 2. Additive columns for profiles
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS requested_role user_role DEFAULT 'requester',
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'approved' 
    CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS id_proof_url TEXT,
  ADD COLUMN IF NOT EXISTS id_proof_filename TEXT,
  ADD COLUMN IF NOT EXISTS id_proof_uploaded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS stream TEXT,
  ADD COLUMN IF NOT EXISTS subject TEXT,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Index for speedy verification queue lookups
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status 
  ON profiles (verification_status, requested_role);

-- 3. Setup Private Supabase Storage Bucket for ID Documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'id-proofs', 
  'id-proofs', 
  false, 
  5242880, -- 5 MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET 
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png'];

-- 4. Storage Bucket RLS Policies
-- Allow owners to upload their own document into their dedicated folder (uid/...)
CREATE POLICY "Users can upload their own staff ID document"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'id-proofs' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow owners to read their own document
CREATE POLICY "Users can view their own uploaded ID document"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'id-proofs' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow authorized reviewers (Registrar) to view all submitted applicant ID documents
CREATE POLICY "Registrar and reviewers can view all submitted ID documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'id-proofs' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('registrar', 'estate_manager')
      AND profiles.verification_status = 'approved'
    )
  );

-- 5. Profile Update Security Policies (Prevent Self-Approval)
-- Users may update their basic contact info or resubmit an ID proof, but cannot approve themselves
CREATE POLICY "Users can update their own unprivileged profile fields"
  ON profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() AND
    -- Role cannot be escalated by normal profile update
    role = (SELECT role FROM profiles WHERE id = auth.uid()) AND
    -- Verification status cannot be changed to approved by the user themselves
    (verification_status = 'pending' OR verification_status = (SELECT verification_status FROM profiles WHERE id = auth.uid()))
  );

-- Only verified Registrar can update applicant verification status and active role
CREATE POLICY "Registrar can verify staff applicant accounts"
  ON profiles FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'registrar'
      AND profiles.verification_status = 'approved'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'registrar'
      AND profiles.verification_status = 'approved'
    )
  );

-- 6. Principal and Registrar Read-Only Campus Oversight Policies
-- Principal has comprehensive institutional visibility across all bookings without modifying approvals
CREATE POLICY "Principal can view all bookings for campus oversight"
  ON bookings FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('principal', 'registrar')
      AND profiles.verification_status = 'approved'
    )
  );

CREATE POLICY "Principal and Registrar can inspect all approval steps"
  ON approval_steps FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('principal', 'registrar')
      AND profiles.verification_status = 'approved'
    )
  );

CREATE POLICY "Principal can inspect all audit logs"
  ON audit_logs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('principal', 'registrar')
      AND profiles.verification_status = 'approved'
    )
  );
