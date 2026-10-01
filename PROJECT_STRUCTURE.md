# CampusSpace — Project Architecture & Judges Directory Guide

> **Official Evaluation Guide**: This document explains the exact four-layer architecture of CampusSpace (**FRONTEND**, **BACKEND**, **DATABASE**, and **ENV**). If judges or evaluators ask where any part of the project lives, refer directly to this directory map.

---

## 🏛️ Executive 4-Layer Architecture Map

```
CampusSpace/
│
├── 🎨 FRONTEND/                 # [CLIENT-SIDE LAYER]
│   ├── README.md               # Frontend documentation & design tokens guide
│   ├── index.ts                # TypeScript barrel exports for all UI components & store
│   ├── components/             # Reusable UI library (Navbar, BubbleButton, Guards, Modals)
│   ├── pages/                  # Next.js App Router views (Dashboard, Login, Facilities, etc.)
│   └── styles/                 # globals.css & strict 5-color palette tokens
│
├── ⚙️ BACKEND/                  # [SERVER-SIDE LAYER]
│   ├── README.md               # Backend documentation, security invariants & API guide
│   ├── index.ts                # TypeScript barrel exports for server logic & types
│   ├── services/               # Core engines (Approval Matrix, Dual-OTP, Interval Math)
│   ├── api/                    # REST API route handlers (/api/auth/admin/*, /api/auth/upload-id)
│   └── tests/                  # 74/74 Automated system verification test suite
│
├── 🗄️ DATABASE/                 # [DATA & STORAGE LAYER]
│   ├── README.md               # Database schema documentation, ER model & RLS policies
│   ├── index.ts                # Re-exports Supabase client & initial datasets
│   ├── schema.sql              # Consolidated PostgreSQL schema (Tables, Enums, Constraints)
│   ├── seed.sql                # Production seed data (Venues, Roles, Equipment)
│   └── migrations/             # Chronological SQL migrations
│
└── 🔐 env/                      # [CONFIGURATION & SECRETS LAYER]
    ├── README.md               # Environment variables specification & security guide
    ├── index.ts                # Type-safe environment variable loader & validator
    ├── .env.example            # Reference configuration template with all variable docs
    └── .env.local.template     # Local developer template
```

---

## 🎯 Quick Cheat-Sheet for Judges' Questions

### 1. "Frontend Kahan Hai?" (Where is the Frontend?)
* **Directory**: [`frontend/`](file:///c:/Users/User/CampusSpace/frontend) and [`src/components/`](file:///c:/Users/User/CampusSpace/src/components) + [`src/app/`](file:///c:/Users/User/CampusSpace/src/app).
* **Tech Stack**: Next.js App Router (React 19), TypeScript, Tailwind CSS.
* **Key Components**:
  * Top Sticky Navigation: [`src/components/Navbar.tsx`](file:///c:/Users/User/CampusSpace/src/components/Navbar.tsx)
  * Dual-Mode Sign-In (Member + Dual-OTP Admin): [`src/app/login/page.tsx`](file:///c:/Users/User/CampusSpace/src/app/login/page.tsx)
  * Interactive Dashboard & Refresh Controls: [`src/app/page.tsx`](file:///c:/Users/User/CampusSpace/src/app/page.tsx)
  * Facility Catalogue (Dedicated Single Venues): [`src/app/facilities/page.tsx`](file:///c:/Users/User/CampusSpace/src/app/facilities/page.tsx)
  * Sequential Approval Interface: [`src/app/approvals/page.tsx`](file:///c:/Users/User/CampusSpace/src/app/approvals/page.tsx)
  * User-Scoped Analytics: [`src/app/analytics/page.tsx`](file:///c:/Users/User/CampusSpace/src/app/analytics/page.tsx)
  * Digital QR Hall Pass Renderer: [`src/app/pass/[token]/page.tsx`](file:///c:/Users/User/CampusSpace/src/app/pass/[token]/page.tsx)
* **Design Standards**: Certified 5-color palette (Black `#000000`, White `#FFFFFF`, Blue `#2563EB`, Purple `#7C3AED`, Red `#DC2626`).

---

### 2. "Backend Kahan Hai?" (Where is the Backend?)
* **Directory**: [`backend/`](file:///c:/Users/User/CampusSpace/backend) and [`src/app/api/`](file:///c:/Users/User/CampusSpace/src/app/api) + [`src/lib/`](file:///c:/Users/User/CampusSpace/src/lib).
* **Tech Stack**: Next.js Server Route Handlers, Node.js runtime, Nodemailer, Web Crypto.
* **Core Business Engines**:
  * **Sequential Approval Matrix**: [`src/lib/approval-matrix.ts`](file:///c:/Users/User/CampusSpace/src/lib/approval-matrix.ts)
    * Non-Lab venues require both Principal & Registrar approvals in any order.
    * Lab venues require assigned Department HOD approval only.
  * **Dual-OTP Administrator Challenge Engine**: [`src/lib/email-service.ts`](file:///c:/Users/User/CampusSpace/src/lib/email-service.ts)
    * Dispatches Code 1 and Code 2 to `campusspaceadmin@gmail.com`.
    * Enforces atomic consumption, 5-minute TTL, 45-second resend cooldown, and 5-attempt brute-force lockout.
  * **Half-Open Interval Collision Math**: [`src/lib/date-utils.ts`](file:///c:/Users/User/CampusSpace/src/lib/date-utils.ts)
    * Evaluates `max(start1, start2) < min(end1, end2)` with exact collision messaging.
  * **REST API Endpoints**:
    * Initiate Admin Challenge: [`src/app/api/auth/admin/challenge/route.ts`](file:///c:/Users/User/CampusSpace/src/app/api/auth/admin/challenge/route.ts)
    * Verify Dual-OTP: [`src/app/api/auth/admin/verify/route.ts`](file:///c:/Users/User/CampusSpace/src/app/api/auth/admin/verify/route.ts)
    * Resend Verification Codes: [`src/app/api/auth/admin/resend/route.ts`](file:///c:/Users/User/CampusSpace/src/app/api/auth/admin/resend/route.ts)
    * Status Polling: [`src/app/api/auth/admin/status/route.ts`](file:///c:/Users/User/CampusSpace/src/app/api/auth/admin/status/route.ts)

---

### 3. "Database Kahan Hai?" (Where is the Database?)
* **Directory**: [`database/`](file:///c:/Users/User/CampusSpace/database) and [`supabase/`](file:///c:/Users/User/CampusSpace/supabase).
* **Tech Stack**: PostgreSQL with Supabase, Row-Level Security (RLS).
* **Key Files**:
  * Unified SQL Schema: [`database/schema.sql`](file:///c:/Users/User/CampusSpace/database/schema.sql)
  * Production Seed Data: [`database/seed.sql`](file:///c:/Users/User/CampusSpace/database/seed.sql)
  * Chronological Migrations: [`supabase/migrations/`](file:///c:/Users/User/CampusSpace/supabase/migrations)
  * Supabase Client Connection: [`src/lib/supabase.ts`](file:///c:/Users/User/CampusSpace/src/lib/supabase.ts)
* **Tables**: `facilities`, `buildings`, `equipment`, `user_profiles`, `bookings`, `approval_steps`, `audit_logs`, `staff_applicants`.

---

### 4. "Environment Variables Kahan Hai?" (Where is the Env?)
* **Directory**: [`env/`](file:///c:/Users/User/CampusSpace/env) and [`.env.example`](file:///c:/Users/User/CampusSpace/.env.example) / [`.env.local`](file:///c:/Users/User/CampusSpace/.env.local).
* **Key Files**:
  * Documentation & Specs: [`env/README.md`](file:///c:/Users/User/CampusSpace/env/README.md)
  * Reference Template: [`env/.env.example`](file:///c:/Users/User/CampusSpace/env/.env.example)
  * Typed Env Validator: [`env/index.ts`](file:///c:/Users/User/CampusSpace/env/index.ts)
* **Key Configuration Keys**:
  * `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
  * `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase client-safe anonymous key
  * `ADMIN_EMAIL`: Bound administrator mailbox (`campusspaceadmin@gmail.com`)
  * `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`: Mail server credentials for Nodemailer dispatch.

---

## 🧪 Verification & Invariant Proof
CampusSpace includes an automated test runner validating all 74 platform invariants:
```bash
npx tsx scripts/verify-system.ts
```
**Current Status**: **74/74 tests passed (100% success rate)** covering sequential approval matrices, interval mathematics, role privacy, dual-OTP challenge lifecycles, and audit logging.
