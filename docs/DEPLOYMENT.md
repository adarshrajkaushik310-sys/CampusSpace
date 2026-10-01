# CampusSpace: Deployment & Infrastructure Guide

> **Application**: CampusSpace &mdash; Smart Campus Booking Platform  
> **Deployment Target**: Vercel (Edge/Serverless) + Supabase (Managed PostgreSQL)  
> **Repository Ready**: Zero-credential demo mode runs automatically when Supabase variables are absent.

---

## 1. Zero-Friction Quick Start (Demo Mode)

CampusSpace includes an intelligent dual-mode architecture. If Supabase credentials are not configured, the platform boots instantly into **High-Fidelity Interactive Demo Mode**, utilizing an in-memory transactional store with local storage persistence and pre-seeded academic facilities:

```bash
# 1. Clone repository and navigate to workspace
cd "CAMPUS FACILITY & SMART CLASSROOM BOOKING"

# 2. Start Next.js development server
npm run dev

# 3. Open browser
# URL: http://localhost:3000
```

---

## 2. Production Deployment on Vercel + Supabase

### 2.1 Supabase PostgreSQL Database Setup
1. Create a new project in [Supabase](https://supabase.com).
2. Navigate to **SQL Editor**.
3. Execute the initial migration script:
   - File: `supabase/migrations/20260930000001_campus_space_schema.sql`
   - *Installs `btree_gist`, sets up tables, creates `tstzrange` exclusion constraints, and applies RLS policies.*
4. Execute seed data:
   - File: `supabase/seed.sql`
   - *Populates 12 campus facilities, demo users, equipment catalog, and initial reservations.*

### 2.2 Environment Variables
Configure the following in your Vercel Project Settings or local `.env.local`:

```env
# Public Supabase Client (Exposed to browser for auth & realtime subscriptions)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Private Server-Side Secret (STRICTLY ISOLATED on server, NEVER exposed to client)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Application Base URL (Used for absolute QR code verification URL generation)
NEXT_PUBLIC_APP_URL=https://campusspace.vercel.app

# Default Campus Timezone
NEXT_PUBLIC_CAMPUS_TIMEZONE=Asia/Kolkata
```

### 2.3 Deploy to Vercel
```bash
# Install Vercel CLI (if not already installed)
npm install -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

Or connect the repository via the [Vercel Dashboard](https://vercel.com/new). The default Next.js build preset automatically detects App Router and packages routes cleanly.

---

## 3. Database Invariant & Concurrency Verification

To verify that the database engine correctly blocks concurrent double-bookings before opening the system to campus users:

```bash
# Run automated verification suite
npm run test:verify
```

Expected output:
- 17/17 tests passing including GiST exclusion constraint simulation, adjacent half-open boundary compliance, sequential approval gating, and token revocation.

---

## 4. Production Security Checklist

- [x] **No Secrets Exposed**: `SUPABASE_SERVICE_ROLE_KEY` is never prefixed with `NEXT_PUBLIC_`.
- [x] **Row Level Security (RLS)**: Tables have RLS enabled. Requesters cannot alter approval status columns directly.
- [x] **Unguessable QR Tokens**: Digital passes use 128-bit cryptographically random tokens (`vtok_*`), evaluated on the server rather than trusting client parameters.
- [x] **Sanitized Audit Trail**: Every status transition logs actor ID, action, timestamp, and optional comment to append-only audit ledger.
- [x] **Print CSS Ready**: Hall pass (`/pass/[id]`) includes `@media print` rules for paper and gate badges without UI clutter.
