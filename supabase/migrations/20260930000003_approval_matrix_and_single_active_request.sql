-- =====================================================================
-- CampusSpace - Non-Destructive Migration:
-- 1. Adds 'completed' status to booking_status ENUM
-- 2. Adds category, lab_type, department metadata to facilities & bookings
-- 3. Atomic Single Active Request Enforcement via Transactional Trigger
--    (Advisory lock + active status check across all facility categories)
-- 4. Atomic Facility Overlap Prevention via GiST Exclusion Constraint
-- 5. Updated Approval Matrix RLS Policies (Principal & Registrar for non-lab, Assigned HOD for labs)
-- 6. Anomaly Reporting View for legacy overlapping or multiple active requests
-- =====================================================================

-- 1. Extend booking_status ENUM with 'completed'
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'completed';

-- 2. Additive columns for facilities
ALTER TABLE facilities
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS lab_type TEXT,
  ADD COLUMN IF NOT EXISTS department TEXT;

-- 3. Additive columns for bookings
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS facility_category TEXT,
  ADD COLUMN IF NOT EXISTS lab_type TEXT,
  ADD COLUMN IF NOT EXISTS routing_error TEXT;

-- 4. Additive column for approval_steps
ALTER TABLE approval_steps
  ADD COLUMN IF NOT EXISTS approver_department TEXT;

-- =====================================================================
-- 5. TRANSACTIONAL SINGLE ACTIVE REQUEST PER PERSON ENFORCEMENT
-- =====================================================================
-- Rule: A person may have only one active booking request across all facility categories.
-- Active = 'pending' OR ('approved' AND end_time > NOW())
-- Transactional advisory lock ensures simultaneous requests from the same user serialize.

CREATE OR REPLACE FUNCTION enforce_single_active_request_per_person()
RETURNS TRIGGER AS $$
DECLARE
  v_active_count INT;
BEGIN
  -- Only validate on INSERT or when transitioning to active status ('pending', 'approved')
  IF (NEW.status IN ('pending', 'approved')) THEN
    -- Acquire transaction-level advisory lock hashed to the user's UUID
    -- Ensures concurrent submissions from the same user serialize atomically
    PERFORM pg_advisory_xact_lock(hashtext('user_active_booking_' || NEW.requester_id::text));

    -- Check if this user already has an active request
    SELECT COUNT(*)
    INTO v_active_count
    FROM bookings
    WHERE requester_id = NEW.requester_id
      AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND (
        status = 'pending'
        OR (status = 'approved' AND end_time > NOW())
      );

    IF v_active_count > 0 THEN
      RAISE EXCEPTION 'You already have an active request. You can submit another after it is rejected, cancelled, or completed.'
        USING ERRCODE = '23514'; -- check_violation
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_single_active_request ON bookings;
CREATE TRIGGER trg_enforce_single_active_request
  BEFORE INSERT OR UPDATE OF status, requester_id, end_time
  ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION enforce_single_active_request_per_person();

-- =====================================================================
-- 6. ATOMIC OVERLAP PREVENTION VIA GIST EXCLUSION CONSTRAINT
-- =====================================================================
-- Re-affirm half-open interval GiST exclusion constraint on active bookings
-- (Handles [start, end) intervals so adjacent bookings are permitted)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'prevent_overlapping_active_bookings'
  ) THEN
    ALTER TABLE bookings
      ADD CONSTRAINT prevent_overlapping_active_bookings
      EXCLUDE USING gist (
        facility_id WITH =,
        time_range WITH &&
      ) WHERE (status IN ('pending', 'approved'));
  END IF;
END $$;

-- =====================================================================
-- 7. REVISED ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================
-- Replaces old 4-stage review policies with Principal, Registrar & Assigned HOD matrix

-- Drop legacy stage-based approver update policies
DROP POLICY IF EXISTS "Approvers can update bookings in their stage" ON bookings;

-- Non-lab approver policy (Principal & Registrar)
CREATE POLICY "Principal and Registrar can view and update non-lab bookings"
  ON bookings FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('principal', 'registrar')
        AND profiles.verification_status = 'approved'
    )
    AND (facility_category IS NULL OR facility_category <> 'labs')
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('principal', 'registrar')
        AND profiles.verification_status = 'approved'
    )
    AND (facility_category IS NULL OR facility_category <> 'labs')
  );

-- Lab approver policy (Assigned Department HOD only)
CREATE POLICY "Assigned HOD can view and update lab bookings for their department"
  ON bookings FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'hod'
        AND profiles.verification_status = 'approved'
        AND profiles.department = bookings.facility_category
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN facilities f ON f.id = bookings.facility_id
      WHERE p.id = auth.uid()
        AND p.role = 'hod'
        AND p.verification_status = 'approved'
        AND p.department = f.department
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN facilities f ON f.id = bookings.facility_id
      WHERE p.id = auth.uid()
        AND p.role = 'hod'
        AND p.verification_status = 'approved'
        AND p.department = f.department
    )
  );

-- Requesters strictly isolated to their own bookings
DROP POLICY IF EXISTS "Requesters can view their own bookings" ON bookings;
CREATE POLICY "Requesters can view their own bookings"
  ON bookings FOR SELECT TO authenticated
  USING (
    requester_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('principal', 'registrar')
        AND profiles.verification_status = 'approved'
    )
    OR EXISTS (
      SELECT 1 FROM profiles p
      JOIN facilities f ON f.id = bookings.facility_id
      WHERE p.id = auth.uid()
        AND p.role = 'hod'
        AND p.verification_status = 'approved'
        AND p.department = f.department
    )
  );

-- =====================================================================
-- 8. NON-DESTRUCTIVE ANOMALY AUDIT VIEW
-- =====================================================================
-- Requirement 8: "If existing data contains multiple active requests from one person
-- or overlapping reservations, report them for resolution. Do not silently delete or cancel records."
CREATE OR REPLACE VIEW view_booking_data_anomalies AS
SELECT 
  'multiple_active_requests_per_person' AS anomaly_type,
  b1.requester_id::text AS reference_key,
  b1.booking_ref || ' & ' || b2.booking_ref AS affected_records,
  'User has multiple overlapping active requests (' || b1.status || ' / ' || b2.status || ')' AS details,
  b1.created_at
FROM bookings b1
JOIN bookings b2 ON b1.requester_id = b2.requester_id AND b1.id < b2.id
WHERE (b1.status = 'pending' OR (b1.status = 'approved' AND b1.end_time > NOW()))
  AND (b2.status = 'pending' OR (b2.status = 'approved' AND b2.end_time > NOW()))

UNION ALL

SELECT 
  'overlapping_facility_reservations' AS anomaly_type,
  b1.facility_id::text AS reference_key,
  b1.booking_ref || ' & ' || b2.booking_ref AS affected_records,
  'Facility has overlapping intervals: [' || b1.start_time || ' - ' || b1.end_time || '] vs [' || b2.start_time || ' - ' || b2.end_time || ']' AS details,
  b1.created_at
FROM bookings b1
JOIN bookings b2 ON b1.facility_id = b2.facility_id AND b1.id < b2.id
WHERE b1.status IN ('pending', 'approved')
  AND b2.status IN ('pending', 'approved')
  AND b1.time_range && b2.time_range;
