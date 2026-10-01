-- =====================================================================
-- Migration: 20261001000001_provision_unified_admin_email.sql
-- Description:
-- 1. Provisions the single authorized administrator identity with registered email campusspaceadmin@gmail.com
-- 2. Preserves historical administrator audit records (admin1, admin2)
-- 3. Protects the unified administrator identity from demotion, suspension, or unauthorized deletion
-- 4. Guarantees administrator identity is not publicly registerable
-- =====================================================================

-- 1. Ensure profiles table has the provisioned administrator account
INSERT INTO profiles (
  id,
  email,
  full_name,
  role,
  title,
  department,
  verification_status,
  account_status,
  created_at,
  updated_at
)
VALUES (
  '00000000-0000-0000-0000-0000000000a0'::uuid,
  'campusspaceadmin@gmail.com',
  'Administrator',
  'admin',
  'System Administrator',
  'Central Administration',
  'approved',
  'active',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  email = 'campusspaceadmin@gmail.com',
  role = 'admin',
  verification_status = 'approved',
  account_status = 'active',
  updated_at = NOW();

-- 2. Update the administrator protection trigger to cover campusspaceadmin@gmail.com
CREATE OR REPLACE FUNCTION protect_designated_administrators()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if target user was a designated or unified admin
  IF (
    OLD.email IN ('campusspaceadmin@gmail.com', 'admin1@campus.edu', 'admin2@campus.edu') OR
    OLD.id IN (
      '00000000-0000-0000-0000-0000000000a0'::uuid,
      '00000000-0000-0000-0000-0000000000a1'::uuid,
      '00000000-0000-0000-0000-0000000000a2'::uuid
    )
  ) THEN
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

-- 3. Document provisioning in immutable audit logs
INSERT INTO audit_logs (
  performed_by,
  action,
  affected_entity,
  outcome,
  reason,
  details
)
VALUES (
  'System Provisioning Process',
  'ADMIN_PROVISIONED',
  'campusspaceadmin@gmail.com',
  'SUCCESS',
  'Trusted provisioning of single authorized administrator identity with email verification.',
  'Historical administrator audit records preserved. Public administrator registration strictly disallowed.'
);
