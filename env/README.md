# CampusSpace — Environment & Configuration Layer

Welcome to the **Environment & Configuration Layer** of CampusSpace. This folder serves as the dedicated entry point and documentation for judges, evaluators, and DevOps engineers inspecting environment secrets, mail server integration, database credentials, and operational flags.

---

## 🏛️ Directory Structure & Responsibilities

```
env /
├── README.md               # Environment variables specification & security documentation
├── index.ts                # Typed environment configuration loader & validator
├── .env.example            # Canonical environment variable reference template
└── .env.local.template     # Local developer template with pre-filled safe defaults
```

---

## 🔐 Environment Variables Specification

| Variable Name | Scope | Sensitivity | Description | Example / Default |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server | Public | Supabase Project REST/Auth endpoint URL | `https://xyz.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + Server | Public (RLS) | Supabase anonymous public API key | `eyJhbGciOi...` |
| `NEXT_PUBLIC_CAMPUS_TIMEZONE` | Client + Server | Public | Canonical timezone for interval checking | `Asia/Kolkata` |
| `NEXT_PUBLIC_APP_URL` | Client + Server | Public | Root URL for QR Hall Pass links and callbacks | `http://localhost:3000` |
| `ADMIN_EMAIL` | Server-side only | Protected | Registered Administrator mailbox for dual-OTP codes | `campusspaceadmin@gmail.com` |
| `SMTP_HOST` | Server-side only | Secret | Mail server host for Nodemailer dispatch | `smtp.gmail.com` |
| `SMTP_PORT` | Server-side only | Configuration | Mail server port (587 for TLS, 465 for SSL) | `587` |
| `SMTP_SECURE` | Server-side only | Configuration | Use SSL/TLS encryption directly | `false` |
| `SMTP_USER` | Server-side only | Secret | SMTP authentication username / sender address | `security@campusspace.edu` |
| `SMTP_PASS` | Server-side only | Critical Secret | SMTP 16-character application-specific password | `••••••••••••••••` |
| `SMTP_FROM` | Server-side only | Public Header | Sender name and email header | `"CampusSpace Security" <no-reply@campusspace.edu>` |
| `EMAIL_TEST_MODE` | Server / Test | Development | Captures OTPs in memory for automated testing | `true` (in tests) |

---

## 🛡️ Security Best Practices
1. **Never commit `.env.local` to version control**: It is strictly ignored via [`.gitignore`](file:///c:/Users/User/CampusSpace/.gitignore).
2. **Zero Password Admin Authentication**: `SMTP_PASS` is purely an email-dispatching secret for the mail server, never a user password.
3. **Graceful Degraded Mode**: If SMTP is unconfigured, the system runs safely in offline simulation mode and guides the administrator with on-screen verification diagnostics.
