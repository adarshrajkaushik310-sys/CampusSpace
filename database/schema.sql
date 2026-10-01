-- =====================================================================
-- CampusSpace Consolidated Database Schema
-- Target: PostgreSQL / Supabase
-- =====================================================================

-- 1. Create Enums
DO $$ BEGIN
  CREATE TYPE role_type AS ENUM ('student', 'faculty', 'hod', 'registrar', 'principal', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE booking_status_type AS ENUM ('pending', 'approved', 'rejected', 'cancelled', 'completed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE approval_step_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Buildings Table
CREATE TABLE IF NOT EXISTS buildings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  floors_count INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Facilities Table
CREATE TABLE IF NOT EXISTS facilities (
  id VARCHAR(100) PRIMARY KEY,
  building_id UUID REFERENCES buildings(id) ON DELETE SET NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  floor INT DEFAULT 0,
  facility_type VARCHAR(100) NOT NULL,
  capacity INT NOT NULL,
  dimensions VARCHAR(100),
  description TEXT,
  is_operational BOOLEAN DEFAULT true,
  operating_hours_start TIME DEFAULT '08:00:00',
  operating_hours_end TIME DEFAULT '20:00:00',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Equipment Catalog
CREATE TABLE IF NOT EXISTS equipment (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role role_type NOT NULL DEFAULT 'student',
  department VARCHAR(100),
  account_status VARCHAR(50) DEFAULT 'active',
  verification_status VARCHAR(50) DEFAULT 'approved',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
  id VARCHAR(100) PRIMARY KEY,
  facility_id VARCHAR(100) NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  user_id VARCHAR(100) NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status booking_status_type DEFAULT 'pending',
  qr_pass_token VARCHAR(255) UNIQUE,
  qr_pass_revoked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Approval Steps Table (Sequential Approval Matrix)
CREATE TABLE IF NOT EXISTS approval_steps (
  id VARCHAR(100) PRIMARY KEY,
  booking_id VARCHAR(100) NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  step_order INT NOT NULL,
  role role_type NOT NULL,
  status approval_step_status DEFAULT 'pending',
  assigned_to VARCHAR(100),
  decision_by VARCHAR(100),
  decision_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Audit Logs Table (Administrative Traceability)
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(100) PRIMARY KEY,
  action VARCHAR(100) NOT NULL,
  performed_by VARCHAR(255) NOT NULL,
  role role_type NOT NULL,
  actor_admin VARCHAR(50),
  affected_entity VARCHAR(255) NOT NULL,
  outcome VARCHAR(50) NOT NULL,
  reason TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Indices for Fast Search & Interval Arithmetic
CREATE INDEX IF NOT EXISTS idx_bookings_facility_date ON bookings(facility_id, booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_approval_steps_booking ON approval_steps(booking_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
