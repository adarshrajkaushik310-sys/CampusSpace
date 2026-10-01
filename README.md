# CampusSpace

> **Campus Facility & Smart Classroom Booking System with Conflict Check**  
> *Engineered for collegiate institutions with shared auditoriums, seminar halls, computing labs, and smart classrooms.*

[![Next.js 15](https://img.shields.io/badge/Next.js-15.1-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-GiST%20Range%20Exclusion-336791?logo=postgresql)](https://www.postgresql.org/docs/current/rangetypes.html)
[![Verification Suite](https://img.shields.io/badge/Tests-74%2F74%20Passed%20(100%25)-emerald)](scripts/verify-system.ts)

---

## 🏛️ Project Organization for Judges & Evaluators

If judges or reviewers ask: *"Where is the Frontend? Where is the Backend? Where is the Database? Where is the Environment configuration?"*, the project is modularly structured into 4 dedicated directories:

| Component | Dedicated Directory | Core Responsibilities & Source Files |
|---|---|---|
| 🎨 **FRONTEND** | [`frontend/`](file:///c:/Users/User/CampusSpace/frontend) | Next.js App Router views ([`src/app/`](file:///c:/Users/User/CampusSpace/src/app)), UI components ([`src/components/`](file:///c:/Users/User/CampusSpace/src/components)), design tokens ([`globals.css`](file:///c:/Users/User/CampusSpace/src/app/globals.css)), client store ([`src/lib/store.tsx`](file:///c:/Users/User/CampusSpace/src/lib/store.tsx)) |
| ⚙️ **BACKEND** | [`backend/`](file:///c:/Users/User/CampusSpace/backend) | REST APIs ([`src/app/api/`](file:///c:/Users/User/CampusSpace/src/app/api)), approval matrix engine ([`src/lib/approval-matrix.ts`](file:///c:/Users/User/CampusSpace/src/lib/approval-matrix.ts)), dual-OTP security engine ([`src/lib/email-service.ts`](file:///c:/Users/User/CampusSpace/src/lib/email-service.ts)), interval collision math ([`src/lib/date-utils.ts`](file:///c:/Users/User/CampusSpace/src/lib/date-utils.ts)) |
| 🗄️ **DATABASE** | [`database/`](file:///c:/Users/User/CampusSpace/database) | Unified schema ([`database/schema.sql`](file:///c:/Users/User/CampusSpace/database/schema.sql)), production seed ([`database/seed.sql`](file:///c:/Users/User/CampusSpace/database/seed.sql)), migrations ([`supabase/migrations/`](file:///c:/Users/User/CampusSpace/supabase/migrations)), DB client ([`src/lib/supabase.ts`](file:///c:/Users/User/CampusSpace/src/lib/supabase.ts)) |
| 🔐 **ENV** | [`env/`](file:///c:/Users/User/CampusSpace/env) | Environment variable documentation ([`env/README.md`](file:///c:/Users/User/CampusSpace/env/README.md)), reference templates ([`env/.env.example`](file:///c:/Users/User/CampusSpace/env/.env.example)), typed configuration loader ([`env/index.ts`](file:///c:/Users/User/CampusSpace/env/index.ts)) |

📖 *For full details and question answers, see the [Project Structure & Judges Guide](file:///c:/Users/User/CampusSpace/PROJECT_STRUCTURE.md).*

---

## 1. Problem Overview

Colleges and universities struggle with severe contention over high-spec facilities:
- **Auditoriums & Seminar Halls**: Shared across 30+ clubs and multiple academic departments.
- **Smart Classrooms & GPU Computing Labs**: Constrained capacity and specialized equipment.
- **Manual Booking Failures**: Overlapping double-bookings, email approval blindspots, lack of physical gate security, and inefficient asset utilization.

**CampusSpace** solves this with atomic conflict prevention at the database engine level, an interactive 2D spatial campus blueprint, a strict 4-tier sequential governance hierarchy, cryptographic QR digital hall passes, and real-time utilization intelligence.

---

## 2. Six Core Capabilities

```
CODING CLUB REQUESTER
        │
        ▼
   Booking Wizard
        │
        ▼
  Conflict Engine (PostgreSQL GiST [start, end))
       / \
Conflict Free  Overlap Blocked + Explainable Alternatives
     │
     ▼
Student Council Secretary ✓
     │
     ▼
Faculty Advisor ✓
     │
     ▼
Head of Department (HOD) ✓
     │
     ▼
Estate Manager ✓
     │
     ▼
   APPROVED
     │
     ▼
Digital QR Hall Pass 🎫 (Cryptographic Unguessable Token)
     │
     ▼
Security Verification Gate
```

1. **Interactive 2D Campus Floor Plan (`/map`)**:
   - Believable academic campus with 12 facilities across 3 buildings and 4 floors.
   - SVG blueprint with pan/zoom, floor switcher, category filters, and keyboard navigation.
   - Chromatic & symbolic status indicators: Available (Emerald Check), Pending (Amber Clock), Approved (Indigo Shield), Maintenance (Slate Wrench).
   - Contextual drawer with capacity, fixed gear, operating hours, and schedule.
2. **Slot Reservation Wizard (`/book`)**:
   - 5-step guided wizard: Facility &rarr; Event & Club &rarr; Schedule & Attendees &rarr; Equipment &rarr; Review & Submit.
   - Validates duration, future dates, opening hours (07:00–22:00 IST), capacity, and equipment compatibility.
3. **Automated Conflict Prevention**:
   - Enforces PostgreSQL `btree_gist` exclusion constraint using half-open timestamp ranges `tstzrange(start, end, '[)')`.
   - Prevents race conditions under concurrent submissions; permits adjacent back-to-back bookings seamlessly.
4. **Multi-Tier Approval Hierarchy (`/approvals`)**:
   - Strict sequential state machine: Secretary &rarr; Faculty Advisor &rarr; HOD &rarr; Estate Manager.
   - Role-scoped inbox views; any stage can reject with mandatory reason shown to requester.
5. **Digital Hall Pass with Cryptographic QR Code (`/pass/[id]`, `/verify/[token]`)**:
   - Printable pass with security watermark and high-density QR code.
   - QR encodes an unguessable token verified server-side in real-time (`VALID_ACTIVE`, `NOT_YET_VALID`, `EXPIRED`, `CANCELLED_REVOKED`, `INVALID_TOKEN`).
   - Fallback booking reference lookup for security guards.
6. **Utilization Analytics (`/analytics`)**:
   - Formula-accurate Reserved Utilization: $\frac{\text{Approved Booked Hours}}{\text{Total Available Operating Hours}}$.
   - Peak booking days and hours heat matrix.
   - Department and club allocation breakdown.
   - Approval turnaround time and SLA metrics.

---

## 3. Distinctive Hackathon Features

- **Explainable Alternatives Engine**: When an interval conflict is detected, the engine deterministically recommends up to 3 valid alternatives (alternative available facilities at the same time with matching capacity and equipment, or adjacent time slots in the same venue) with 1-click adoption.
- **Approval Transparency & SLA Tracker**: Real-time counter embedded in `WorkflowTracker.tsx` displaying exact time elapsed at the current pending stage, target SLA (24h), and sequential progress.
- **Live Concurrency Battle Simulator (`ConcurrencySimulator.tsx`)**: Interactive widget on the homepage allowing judges to launch simultaneous race-condition requests (Thread Alpha vs Beta) to visibly witness atomic GiST lock victory and polite conflict mitigation.

---

## 4. Quick Start Guide

### 4.1 Zero-Friction Demo Mode (Runs Instantly)
CampusSpace boots out of the box with an intelligent dual-mode architecture. No database setup is required to run the full interactive demonstration:

```bash
# 1. Install dependencies (if not already installed)
npm install

# 2. Run local development server
npm run dev

# 3. Open browser
http://localhost:3000
```

### 4.2 Production Setup with Supabase PostgreSQL
1. Create a Supabase project at [supabase.com](https://supabase.com).
2. Run `supabase/migrations/20260930000001_campus_space_schema.sql` in the SQL Editor.
3. Run `supabase/seed.sql` in the SQL Editor.
4. Add environment variables to `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

---

## 5. Automated Verification Suite

Run the comprehensive invariant and test suite:

```bash
npm run test:verify
```

Validates:
- Overlapping, contained, identical, and adjacent intervals.
- Concurrent competing reservations under atomic lock.
- Capacity bounds and equipment compatibility.
- Multi-tier governance state transitions and skipped-stage prevention.
- Slot release upon rejection or cancellation.
- QR token lifecycles and revocation.

---

## 6. Comprehensive Documentation Index

- [Research & Architectural Foundations](docs/RESEARCH.md)
- [Implementation & Engineering Plan](docs/PLANNING.md)
- [Progress Log & Changelog](docs/PROGRESS.md)
- [Deployment & Vercel Guide](docs/DEPLOYMENT.md)
- [Technical Defense & Judging Presentation Script](docs/DEFENSE_QA.md)

---

## 7. License

MIT &copy; 2026 CampusSpace Contributors. Built for National and International Hackathons.
