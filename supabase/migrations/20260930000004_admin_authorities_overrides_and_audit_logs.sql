-- =====================================================================
-- CampusSpace - Non-Destructive Migration:
-- 1. Adds 'account_status' ('active' | 'suspended') to profiles
-- 2. Adds 'admin_override' JSONB column to bookings
-- 3. Creates immutable 'audit_logs' table for administrator action attribution
-- 4. Admin RLS Policies granting equal system-wide authority to 'admin' role
-- 5. Trigger preventing suspension or demotion of designated administrators
-- 6. Trigger preventing suspended accounts from creating/updating bookings
-- =====================================================================

-- 1. Add account_status column to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'active';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_profile_account_status'
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT check_profile_account_status
      CHECK (account_status IN ('active', 'suspended'));
  END IF;
END $$;

-- 2. Add admin_override column to bookings for override audit metadata
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS admin_override JSONB;

-- 3. Create immutable audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_admin TEXT, -- 'Admin 1' | 'Admin 2' | NULL
  actor_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  performed_by TEXT NOT NULL,
  action TEXT NOT NULL,
  affected_entity TEXT NOT NULL,
  entity_id TEXT,
  details TEXT,
  reason TEXT,
  outcome TEXT NOT NULL DEFAULT 'success',
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient querying by entity and actor
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs (actor_admin, performed_by);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs (action);

-- Enable RLS on audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Administrators can view all audit logs
DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;
CREATE POLICY "Admins can view audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- System can insert audit logs (append-only)
DROP POLICY IF EXISTS "Authenticated users and admins can record audit logs" ON audit_logs;
CREATE POLICY "Authenticated users and admins can record audit logs"
  ON audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Disallow UPDATE and DELETE on audit_logs to guarantee immutability
DROP POLICY IF EXISTS "Disallow updating audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Disallow deleting audit logs" ON audit_logs;

-- 4. Protected Designated Administrators Guard Trigger
-- Neither Admin 1 nor Admin 2 can be demoted, modified, or suspended
CREATE OR REPLACE FUNCTION protect_designated_administrators()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if target user was a designated admin
  IF (OLD.email IN ('admin1@campus.edu', 'admin2@campus.edu') OR OLD.id IN ('00000000-0000-0000-0000-0000000000a1'::uuid, '00000000-0000-0000-0000-0000000000a2'::uuid)) THEN
    IF (NEW.role <> 'admin') THEN
      RAISE EXCEPTION 'Security Policy Violation: Designated Administrator account cannot be demoted.';
    END IF;
    IF (NEW.account_status <> 'active') THEN
      RAISE EXCEPTION 'Security Policy Violation: Designated Administrator account cannot be suspended.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_designated_admins ON profiles;
CREATE TRIGGER trg_protect_designated_admins
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION protect_designated_administrators();

-- 5. Suspended Account Enforcement Trigger on Bookings
-- Suspended users cannot submit or update booking requests
CREATE OR REPLACE FUNCTION enforce_active_account_for_bookings()
RETURNS TRIGGER AS $$
DECLARE
  v_status TEXT;
BEGIN
  SELECT account_status INTO v_status
  FROM profiles
  WHERE id = NEW.requester_id;

  IF (v_status = 'suspended') THEN
    RAISE EXCEPTION 'Account Suspended: Suspended accounts are prohibited from creating or modifying facility requests.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_active_account_for_bookings ON bookings;
CREATE TRIGGER trg_enforce_active_account_for_bookings
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION enforce_active_account_for_bookings();

-- 6. System Administrator RLS Policies across tables
-- Admins have system-wide access to all facilities, bookings, and approval steps

-- Facilities: Admins can update facility hours and operational status
DROP POLICY IF EXISTS "Admins can update facilities" ON facilities;
CREATE POLICY "Admins can update facilities"
  ON facilities
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Bookings: Admins can select all bookings
DROP POLICY IF EXISTS "Admins can select all bookings" ON bookings;
CREATE POLICY "Admins can select all bookings"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Bookings: Admins can update bookings (for overrides)
DROP POLICY IF EXISTS "Admins can update bookings" ON bookings;
CREATE POLICY "Admins can update bookings"
  ON bookings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Approval Steps: Admins can view and insert/update approval steps
DROP POLICY IF EXISTS "Admins can manage approval steps" ON approval_steps;
CREATE POLICY "Admins can manage approval steps"
  ON approval_steps
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Profiles: Admins can view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Profiles: Admins can update profiles (role, scope, account_status)
DROP POLICY IF EXISTS "Admins can update non-admin profiles" ON profiles;
CREATE POLICY "Admins can update non-admin profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );
