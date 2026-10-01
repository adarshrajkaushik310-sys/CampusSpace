# CampusSpace — Database Layer & Data Model

Welcome to the **Database Layer** of CampusSpace. This folder serves as the dedicated entry point and documentation for judges, evaluators, and database architects reviewing the schema design, relational integrity, row-level security (RLS), and seed datasets.

---

## 🏛️ Directory Structure & Responsibilities

```
DATABASE /
├── README.md               # Database architectural documentation & judge guide
├── index.ts                # TypeScript exports for database client & seed records
├── schema.sql              # Complete consolidated PostgreSQL schema (Tables, Enums, RLS)
├── seed.sql                # Production seed dataset (Facilities, Users, Roles, Equipment)
├── db-client.ts            # Typed Supabase client wrapper & connectivity validator
└── migrations/             # Chronological SQL migration files (located in supabase/migrations/)
    ├── 20260930000001_campus_space_schema.sql
    ├── 20260930000002_add_roles_verification_storage.sql
    ├── 20260930000003_approval_matrix_and_single_active_request.sql
    ├── 20260930000004_admin_authorities_overrides_and_audit_logs.sql
    └── 20261001000001_provision_unified_admin_email.sql
```

---

## 🗄️ Relational Entities & Data Schema

### 1. `facilities`
* Primary catalogue of campus venues.
* Dedicated single venues for **Auditorium** (`AUDITORIUM`) and **Seminar Hall** (`SEMINAR HALL`).
* Fields: `id`, `code`, `name`, `facility_type`, `capacity`, `dimensions`, `is_operational`, `building_id`, `operating_hours_start`, `operating_hours_end`.

### 2. `bookings`
* Central transactional table for facility reservations.
* Fields: `id`, `facility_id`, `user_id`, `title`, `description`, `booking_date`, `start_time`, `end_time`, `status`, `qr_pass_token`, `qr_pass_revoked`, `created_at`.
* Status Enum: `'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed'`.

### 3. `approval_steps`
* Models the sequential multi-step approval workflow matrix.
* Fields: `id`, `booking_id`, `step_order`, `role`, `status`, `assigned_to`, `decision_by`, `decision_at`, `notes`.
* Supports both Non-Lab joint approvals (Principal + Registrar) and Lab department approvals (Assigned HOD).

### 4. `audit_logs`
* Cryptographically attributable immutable audit trail.
* Captures all administrative events, dual-OTP logins, emergency overrides, and cancellations with actor attribution (`admin1` / `admin2`).

### 5. `staff_applicants` & `user_profiles`
* Handles institutional staff verification, appointment letter uploads, and role privilege enforcement (`student`, `faculty`, `hod`, `registrar`, `principal`, `admin`).

---

## 🛡️ Row Level Security (RLS) & Privacy
* **Requesters**: Can inspect only their own submitted requests and valid digital QR passes.
* **Approvers**: Can inspect only bookings routed to their specific authority (e.g. HOD CSE only sees CSE lab requests).
* **Administrators**: Full system visibility with strict audit logging for all mutations.
