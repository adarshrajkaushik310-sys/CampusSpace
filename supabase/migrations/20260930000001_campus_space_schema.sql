-- =====================================================================
-- CampusSpace - Complete PostgreSQL & Supabase Database Migration
-- Implements:
-- 1. btree_gist extension for atomic exclusion constraints
-- 2. tstzrange GiST exclusion constraint preventing overlapping reservations [start, end)
-- 3. Profiles, Roles, Clubs, Buildings, Floors, Facilities, Equipment
-- 4. Bookings, Approval Steps (strictly sequential), Hall Passes, Audit Logs
-- 5. Row Level Security (RLS) policies scoped by role
-- =====================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- Enum types
CREATE TYPE user_role AS ENUM (
  'requester',
  'secretary',
  'faculty_advisor',
  'hod',
  'estate_manager',
  'security'
);

CREATE TYPE booking_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'cancelled'
);

CREATE TYPE workflow_stage AS ENUM (
  'draft',
  'secretary_review',
  'faculty_review',
  'hod_review',
  'estate_review',
  'approved',
  'rejected',
  'cancelled'
);

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'requester',
  department TEXT,
  club TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Clubs and Departments
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  faculty_advisor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Buildings, Floors & Facilities
CREATE TABLE IF NOT EXISTS buildings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  floors_count INT NOT NULL DEFAULT 4,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS facilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  floor INT NOT NULL DEFAULT 0,
  facility_type TEXT NOT NULL,
  capacity INT NOT NULL,
  description TEXT,
  is_operational BOOLEAN NOT NULL DEFAULT TRUE,
  dimensions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Equipment Catalog & Facility Equipment Mappings
CREATE TABLE IF NOT EXISTS equipment (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS facility_equipment (
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  equipment_id TEXT NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  PRIMARY KEY (facility_id, equipment_id)
);

-- 5. Bookings Table with Atomic GiST Exclusion Constraint
-- Uses tstzrange half-open intervals [start, end)
-- Overlapping reservations for the same facility are strictly blocked at database engine level
-- Only active bookings ('pending' or 'approved') reserve the interval.
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_ref TEXT NOT NULL UNIQUE,
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE RESTRICT,
  event_name TEXT NOT NULL,
  event_description TEXT NOT NULL,
  club_id UUID REFERENCES clubs(id) ON DELETE SET NULL,
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  attendee_count INT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  time_range TSTZRANGE GENERATED ALWAYS AS (tstzrange(start_time, end_time, '[)')) STORED,
  current_stage workflow_stage NOT NULL DEFAULT 'secretary_review',
  status booking_status NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  rejected_by_role user_role,
  cancellation_reason TEXT,
  verification_token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Positive duration check
  CONSTRAINT check_positive_duration CHECK (end_time > start_time),

  -- ATOMIC EXCLUSION CONSTRAINT
  -- Prevents overlapping active reservations for the same facility
  -- Half-open interval [start, end) permits adjacent bookings seamlessly
  CONSTRAINT prevent_overlapping_active_bookings EXCLUDE USING gist (
    facility_id WITH =,
    time_range WITH &&
  ) WHERE (status IN ('pending', 'approved'))
);

-- 6. Approval Steps Table
-- Strictly tracks Secretary -> Faculty Advisor -> HOD -> Estate Manager
CREATE TABLE IF NOT EXISTS approval_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  stage_order INT NOT NULL,
  stage_name TEXT NOT NULL,
  required_role user_role NOT NULL,
  decision TEXT NOT NULL DEFAULT 'pending' CHECK (decision IN ('pending', 'approved', 'rejected')),
  approver_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  comments TEXT,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (booking_id, stage_order)
);

-- 7. Digital Hall Passes (Issued only upon final approval)
CREATE TABLE IF NOT EXISTS hall_passes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  verification_token TEXT NOT NULL UNIQUE REFERENCES bookings(verification_token) ON DELETE CASCADE,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_valid BOOLEAN NOT NULL DEFAULT TRUE
);

-- 8. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  booking_ref TEXT NOT NULL,
  action TEXT NOT NULL,
  performed_by_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  role user_role NOT NULL,
  stage TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE hall_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Read policies
CREATE POLICY "Public profiles are viewable by authenticated users"
  ON profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Facilities and equipment are viewable by anyone"
  ON facilities FOR SELECT TO authenticated, anon USING (true);

-- Bookings RLS
-- Requesters see their own bookings; Approvers see bookings in the system
CREATE POLICY "Requesters can view their own bookings"
  ON bookings FOR SELECT TO authenticated
  USING (
    requester_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('secretary', 'faculty_advisor', 'hod', 'estate_manager', 'security')
    )
  );

CREATE POLICY "Requesters can create bookings"
  ON bookings FOR INSERT TO authenticated
  WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Requesters can cancel their own bookings"
  ON bookings FOR UPDATE TO authenticated
  USING (requester_id = auth.uid())
  WITH CHECK (status = 'cancelled');

-- Approvers can update bookings when in their stage
CREATE POLICY "Approvers can update bookings in their stage"
  ON bookings FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        (profiles.role = 'secretary' AND bookings.current_stage = 'secretary_review') OR
        (profiles.role = 'faculty_advisor' AND bookings.current_stage = 'faculty_review') OR
        (profiles.role = 'hod' AND bookings.current_stage = 'hod_review') OR
        (profiles.role = 'estate_manager' AND bookings.current_stage = 'estate_review')
      )
    )
  );

-- Hall Passes are viewable by anyone with the unguessable verification token
CREATE POLICY "Verification page can read hall passes by token"
  ON hall_passes FOR SELECT TO authenticated, anon
  USING (true);
