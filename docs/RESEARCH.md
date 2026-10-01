# CampusSpace: Research & Architectural Foundations

> **Executive Summary**: CampusSpace is an enterprise-grade Campus Facility & Smart Classroom Booking System with Atomic Conflict Prevention, Multi-Tier Hierarchical Governance, Interactive 2D Spatial Floor Plans, Cryptographic Digital Hall Passes, and Real-Time Utilization Analytics.

---

## 1. Problem Space & Academic Context

Modern academic institutions operate with high-demand, finite physical infrastructure:
- **Auditoriums & Seminar Halls**: Shared across 30+ clubs, academic departments, external guest lectures, and administrative conferences.
- **Smart Classrooms & IoT Laboratories**: High-density technology suites requiring specialized equipment (4K laser projectors, acoustic mic arrays, GPU workstations).
- **Sports Grounds & Outdoor Complexes**: Weather-dependent, daylight-constrained spaces.

### Core Failure Modes of Conventional Manual Systems:
1. **Ghost Reservations & Double-Bookings**: Disparate Google Sheets or paper logbooks allow two student clubs to reserve the same hall for identical time intervals.
2. **Approval Blindspots & Opaque Governance**: Requests get stuck in email threads between Student Secretaries, Faculty Advisors, Heads of Department (HODs), and Estate Managers without accountability or SLA timestamps.
3. **Physical Access Breakdowns**: Campus security guards have no cryptographic or reliable means to verify if a student gathering in an auditorium at 7:00 PM is officially authorized.
4. **Sub-optimal Asset Allocation**: Peak hours (10:00 AM – 3:00 PM) suffer congestion, while high-spec facilities sit vacant without transparency or alternative suggestions.

---

## 2. Competitive & Industry Product Analysis

To ground the design in proven patterns without copying proprietary layouts, we analyzed two leading spatial and facility management platforms:

### 2.1 Joan Workplace & Floor Plan Management ([getjoan.com/workplace-assets-on-floorplan](https://getjoan.com/workplace-assets-on-floorplan/))
- **Key Interaction Patterns Analyzed**:
  - **Dynamic 2D Spatial Blueprint**: Assets are rendered visually on interactive building blueprints with immediate chromatic status indicators (Available: Emerald, Pending: Amber, Reserved: Blue/Indigo, Offline: Slate).
  - **Contextual Side Drawer**: Selecting a room opens an unobtrusive drawer with capacity, amenities, and current schedule, keeping the map context intact.
  - **Time Scrubbing**: A unified temporal scrubber updates room availability instantly as users change date or time windows.
- **Implementation Takeaway for CampusSpace**: The interactive SVG campus map must serve as the primary command center. Room state must be derived dynamically from the selected interval rather than static metadata.

### 2.2 Robin Powered & Condeco Enterprise Facility Management
- **Key Interaction Patterns Analyzed**:
  - **Explainable Conflict Alternatives**: When a user attempts to book an occupied slot, Robin suggests alternative rooms matching equivalent capacity and equipment within 1 hour.
  - **Multi-Tier Sequential Sign-Off**: Workflow engines that route bookings based on resource tier (e.g., standard classrooms require 1 approval; main auditoriums require Estate & Dean sign-off).
  - **Digital Badge / QR Access Check-In**: Generating time-bounded digital passes for on-site security checkpoints.
- **Implementation Takeaway for CampusSpace**: Provide deterministic alternative recommendations (capacity match, equipment overlap, proximity) and a sequential 4-tier approval state machine with mandatory rejection rationales.

---

## 3. Technology Architecture & Official Documentation Guidance

### 3.1 Next.js App Router Data Security ([nextjs.org/docs/app/guides/data-security](https://nextjs.org/docs/app/guides/data-security))
- **Server-Side Enforcement**: All authorization and booking validations occur in Server Actions and Route Handlers. Client-side checks are strictly advisory UX enhancements.
- **Secret Isolation**: `SUPABASE_SERVICE_ROLE_KEY` and database credentials remain strictly server-side. Only public anon keys are exposed via `NEXT_PUBLIC_`.
- **Anonymized Availability Projections**: Users viewing the public calendar see "Reserved (Club Event)" without leaking private details, contact numbers, or internal club agendas.

### 3.2 PostgreSQL Range Types & Atomic Exclusion Constraints ([postgresql.org/docs/current/rangetypes.html](https://www.postgresql.org/docs/current/rangetypes.html))
- **Mathematical Invariant**: To prevent double-booking under concurrent web requests, reliance on application-level `SELECT ... WHERE NOT EXISTS ... INSERT` is vulnerable to race conditions (Time-of-Check to Time-of-Use / TOCTOU).
- **Database-Level Guard**: Using PostgreSQL `btree_gist` and `tstzrange` with half-open intervals `[start, end)`:
  ```sql
  CREATE EXTENSION IF NOT EXISTS btree_gist;

  ALTER TABLE bookings
  ADD CONSTRAINT no_overlapping_active_bookings
  EXCLUDE USING gist (
    facility_id WITH =,
    tstzrange(start_time, end_time, '[)') WITH &&
  )
  WHERE (status IN ('PENDING', 'APPROVED'));
  ```
- **Interval Boundary Semantics**: A booking ending at `15:00:00` and another starting at `15:00:00` do NOT overlap under `[)` half-open intervals ($[t_1, t_2) \cap [t_2, t_3) = \emptyset$).

### 3.3 Supabase Row Level Security (RLS) & Realtime ([supabase.com/docs](https://supabase.com/docs))
- **Least-Privilege Policies**:
  - Requesters can insert bookings for their authorized club and view their own full bookings.
  - Public/Authenticated users can read facility metadata, schedules, and anonymized availability.
  - Approvers can only update bookings matching their role's scope and stage in the sequence.
  - Audit logs are append-only via database trigger or service role.
- **Realtime Availability**: Postgres changes broadcast to clients subscribed to channel `realtime:bookings` for live map color updates.

### 3.4 Accessibility (WCAG 2.2 AA) & Design Aesthetics ([w3.org/WAI/WCAG22/quickref](https://www.w3.org/WAI/WCAG22/quickref/))
- **Bubble Button Styling**: Tactile pill-shaped buttons (`rounded-full`, soft multidirectional drop shadow, subtle hover elevation `translate-y-[-1px]`, active press state `scale-95`).
- **Chromatic & Symbolic Redundancy**: Never rely on color alone. Availability states are conveyed with both color tokens AND distinct semantic icons and text badges (Available: Checkmark, Pending: Clock, Approved: Lock/Shield, Maintenance: Wrench).
- **Focus Rings & Reduced Motion**: High-contrast focus outlines (`focus-visible:ring-4 focus-visible:ring-indigo-300`) and `@media (prefers-reduced-motion: reduce)` animation disables.

---

## 4. Requirements Traceability Matrix

| Requirement ID | Capability Area | User Screen / UI Route | Backend / Engine Behavior | Automated & Manual Acceptance Tests |
| :--- | :--- | :--- | :--- | :--- |
| **REQ-1** | Interactive 2D Campus Floor Plan | `/` & `/map` | SVG building blueprint, floor selector, dynamic occupancy projection from selected interval | Pan/zoom controls, keyboard room selection (`Enter`/`Space`), aria-expanded modal trigger, status filter |
| **REQ-2** | Slot Reservation Wizard | `/book` | 5-step wizard with client validation + server revalidation of duration, bounds, capacity & gear | Step sequence retention, capacity exceeding guard, invalid past dates rejection |
| **REQ-3** | Automated Conflict Prevention | `/book`, API `/api/bookings` | PostgreSQL GiST exclusion constraint on `tstzrange [)` for `facility_id` | Concurrent booking stress test: 2 simultaneous submissions &rarr; 1 success, 1 atomic conflict error with alternatives |
| **REQ-4** | Multi-Tier Approval Hierarchy | `/approvals`, `/bookings` | Strict state machine: Secretary &rarr; Faculty &rarr; HOD &rarr; Estate Manager; role validation | Non-authorized role cannot approve; skip-stage attempt rejected; rejection releases slot with required note |
| **REQ-5** | Digital Hall Pass & QR Verification | `/pass/[id]`, `/verify/[token]` | Cryptographic unguessable token generation upon final approval; server validation endpoint | Scannable QR code; token verification returns Valid, Expired, Revoked, or Invalid states; print CSS |
| **REQ-6** | Utilization Analytics | `/analytics` | Formula: Approved Booked Hours / Total Available Operating Hours; peak days/hours; department split | Correct exclusion of cancelled/rejected hours; zero double-count; pending hours reported distinctly |

---

## 5. Architectural Assumptions & Operational Constraints

1. **Campus Operating Hours**: Default facility operating envelope is 07:00 to 22:00 IST (Asia/Kolkata, UTC+05:30). Overnight bookings require explicit Estate Manager waiver.
2. **Reservation Horizon**: Bookings can be scheduled up to 60 days in advance, with a minimum 2-hour advance notice.
3. **Approval Hierarchy Authority**:
   - *Secretary*: Verifies student club affiliation and basic scheduling sanity.
   - *Faculty Advisor*: Confirms academic alignment and faculty oversight.
   - *HOD (Head of Department)*: Approves departmental facility usage and equipment allocation.
   - *Estate Manager*: Final authority on campus safety, power, security logistics, and unlocks.
4. **Cancellation Policy**: Once approved, changes to date, time, or venue require explicit cancellation and re-submission to preserve audit chain of custody.
5. **Dual-Mode Architecture**: Full PostgreSQL/Supabase schema with migrations for production, coupled with a high-fidelity client/server in-memory transactional store for zero-friction demo environments.
  