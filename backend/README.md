# CampusSpace — Backend Architecture & Services

Welcome to the **Backend Layer** of CampusSpace. This folder serves as the dedicated entry point and documentation for judges, evaluators, and system architects inspecting the server-side logic, API endpoints, security protocols, and workflow engines.

---

## 🏛️ Directory Structure & Responsibilities

```
BACKEND /
├── README.md               # Backend architectural documentation & judge guide
├── index.ts                # TypeScript barrel exports for backend engines & APIs
├── services/               # Core server-side business logic and security modules
│   ├── approval-matrix.ts  # Multi-tier sequential approval engine & role routing
│   ├── email-service.ts    # Dual-OTP email challenge engine & Nodemailer SMTP dispatcher
│   ├── operating-hours.ts  # Schedule validation & operating hours constraints
│   ├── date-utils.ts       # Half-open [start, end) interval collision mathematics
│   └── sms-service.ts      # Multi-channel notification adapter
├── api/                    # REST API Route Handlers (located in src/app/api/)
│   ├── /api/auth/admin/challenge  # Step 1: Password-free Admin OTP challenge generation
│   ├── /api/auth/admin/verify     # Step 2: Atomic dual-code verification & session token issuance
│   ├── /api/auth/admin/resend     # 45-second cooldown protected OTP re-dispatch
│   ├── /api/auth/admin/status     # Real-time challenge status and expiry polling
│   ├── /api/auth/admin-login      # Direct credential fallback for emergency administration
│   ├── /api/auth/upload-id        # Encrypted identity proof document storage
│   └── /api/auth/document-url     # Short-lived 5-minute signed URL generator for ID proofs
└── tests/
    └── scripts/verify-system.ts   # 74/74 Automated invariant test suite (100% pass rate)
```

---

## 🔒 Security & Core Backend Invariants

### 1. Dual-OTP Administrator Authentication (`email-service.ts`)
* **Zero Password Requirement**: Administrators initiate login via claimed name alone.
* **Cryptographic Independent Codes**: Generates two distinct 6-digit random codes for a single login attempt.
* **Dual Dispatched Emails**: Sent with distinct labels (`Code 1` and `Code 2`) to the registered administrator mailbox (`campusspaceadmin@gmail.com`).
* **Atomic Consumption**: Both codes must be verified simultaneously; single-code verification and transposition are strictly rejected.
* **Attack Protections**: 5-minute TTL, 5-attempt brute-force lockout, 45-second resend cooldown, and mailbox flood protection.

### 2. Half-Open Interval Conflict Detection (`date-utils.ts`)
* Implements mathematical half-open interval checking `[start, end)`:
  $$\text{Overlap} \iff \max(\text{start}_1, \text{start}_2) < \min(\text{end}_1, \text{end}_2)$$
* Adjacent bookings (e.g. `10:00–12:00` and `12:00–14:00`) do not collide, while overlapping intervals are strictly prevented.

### 3. Sequential Approval Matrix Engine (`approval-matrix.ts`)
* **Non-Lab Venues (Auditorium, Seminar Hall)**: Requires approvals from **both** the Principal and the Registrar (in any order). Single approval leaves booking pending.
* **Department Labs**: Requires approval strictly from the **assigned Department HOD**; cross-department approvals are blocked.
* **Digital QR Hall Pass**: Generated only after final approval; immediately revoked upon cancellation.
