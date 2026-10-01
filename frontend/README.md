# CampusSpace — Frontend Architecture

Welcome to the **Frontend Layer** of CampusSpace. This folder serves as the dedicated entry point and documentation for judges, evaluators, and engineers inspecting the client-side architecture.

---

## 🏛️ Directory Structure & Responsibilities

```
FRONTEND /
├── README.md               # Frontend architectural documentation & judge guide
├── index.ts                # TypeScript barrel exports for UI components & store
├── components/             # Reusable UI component library (design tokens, navigation, guards)
│   ├── Navbar.tsx          # Top sticky navigation bar with role badges & links
│   ├── AppFooter.tsx       # System footer with TLS & dual-OTP compliance badges
│   ├── AuthGuard.tsx       # Route access protection & authentication redirection
│   ├── BubbleButton.tsx    # Accessible, micro-animated interactive button primitives
│   ├── RoleSwitcher.tsx    # Multi-role testing switcher (Student, Faculty, HOD, Admin)
│   ├── VenueFilter.tsx     # Facility category filter (All, Auditoriums, Labs, Seminar Halls)
│   └── BookingModal.tsx    # Interval conflict-checked booking creation modal
├── pages/                  # Next.js App Router Page Manifest (located in src/app/)
│   ├── /                   # Interactive Dashboard (Pending Approvals, QR Hall Passes)
│   ├── /login              # Dual-mode Sign-in (Student/Faculty & Dual-OTP Admin)
│   ├── /signup             # Member registration with role & document upload
│   ├── /facilities         # Facility catalogue with single dedicated venue cards
│   ├── /approvals          # Sequential multi-tier approval decision interface
│   ├── /analytics          # User-scoped booking metrics & utilization charts
│   ├── /admin              # Central Administrator Console & Audit Trail
│   ├── /pass/[token]       # Cryptographic digital QR Hall Pass verification view
│   └── /verifications      # Institutional staff appointment & ID proof verification
└── styles/
    └── globals.css         # Strict 5-color palette tokens & responsive CSS utilities
```

---

## 🎨 Visual System & Strict Color Constraints
CampusSpace strictly adheres to a certified, accessible 5-color palette:
* **Black** (`#000000` / `#09090F`): Structural backgrounds and high-contrast typography.
* **White** (`#FFFFFF`): Elevated card surfaces and crisp foreground elements.
* **Campus Blue** (`#2563EB`): Primary action triggers, navigation indicators, and verified status.
* **Campus Purple** (`#7C3AED`): Administrative workflows and dual-OTP security badges.
* **Campus Red** (`#DC2626`): Conflict detection warnings, rejected requests, and destructive actions.
* **Neutral Gray Borders** (`#E5E7EB` / `#2B2B40`): Structural containment and card dividers.

---

## ⚡ Client State Management
* **Store Implementation**: [`src/lib/store.tsx`](file:///c:/Users/User/CampusSpace/src/lib/store.tsx)
* **Storage Synchronization**: Automatic fallback reconciliation with browser `localStorage` ensuring zero downtime and offline resiliency.
* **Authentication Gating**: Distraction-free login screen that hides navigation chrome until credentials or dual-OTP challenges are verified.
