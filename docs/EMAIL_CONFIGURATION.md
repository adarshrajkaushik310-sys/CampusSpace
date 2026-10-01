# CampusSpace Password-Free Administrator Email Verification & Nodemailer SMTP Architecture

## 1. Overview & Single Administrator Identity

The administrator authentication architecture implements a password-free initial entry followed by a dual-OTP verification flow delivered via server-side **Nodemailer** to the provisioned administrator mailbox:
- **Registered Administrator Destination:** `campusspaceadmin@gmail.com`
- **Provisioned Account Record:** Stored in the database and loaded server-side.
- **Client Input Security:** The destination address is **strictly resolved from the database record** of the authenticated administrator, never from client-submitted input.
- **No Administrator Password:** The administrator login form has **no password field**. Name is the only input field, treated as a self-reported name for the session and audit history, not proof of identity or permission selector.

```
Admin Login Form
(Name only)
       ↓
Click "Send Verification Codes"
       ↓
Backend retrieves registered email: campusspaceadmin@gmail.com from database
       ↓
Nodemailer sends two separate OTPs to campusspaceadmin@gmail.com:
  • "CampusSpace Admin Login — Code 1"
  • "CampusSpace Admin Login — Code 2"
       ↓
Enter Code 1 and Code 2
       ↓
Backend verifies both codes atomically
       ↓
Create authorized administrator session (HttpOnly cookie + token)
       ↓
Confirmation email dispatched to campusspaceadmin@gmail.com
       ↓
Admin Dashboard access granted
```

---

## 2. Important Architectural Notice: Single Mailbox Dual-OTP Verification

> **SECURITY ARCHITECTURE DOCUMENTATION:**
> Both **Verification Code 1** and **Verification Code 2** are dispatched to the single registered mailbox (`campusspaceadmin@gmail.com`). 
> Because both codes share a single recipient mailbox, this mechanism enforces dual-code entry for the session challenge, but **represents one email verification channel** (unlike dual physical devices or multi-party approvals).
> Both codes are independently generated, distinct 6-digit tokens, and cryptographically verified using individual salts and SHA-256 digests.

---

## 3. Server-Side Nodemailer Configuration

Nodemailer operates exclusively in a **server-side Node.js runtime** (`src/lib/email-service.ts`) and is never imported or executed in client/browser bundles.

### 3.1 Environment Variables (`.env.local`)

Place the following variables in your server's `.env.local` file:

```ini
# Nodemailer SMTP Configuration (Exclusively backend email-sending credentials)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_sender_account@gmail.com
SMTP_PASS=
SMTP_FROM="CampusSpace Security" <your_sender_account@gmail.com>

# Optional: Automated test runner mock mode (bypasses live socket)
EMAIL_TEST_MODE=false
```

### 3.2 Confidentiality of SMTP Credentials
- **`SMTP_PASS` is exclusively a backend email-sending credential.** It is not an administrator login password.
- Read in server code strictly through `process.env.SMTP_PASS`.
- Never hardcoded or copied into any source, configuration, documentation, test, or generated file.
- Never exposed through any `NEXT_PUBLIC_` variable.
- Never included in browser responses, logs, screenshots, error messages, or Git commits.
- `.env` and `.env.local` are excluded from version control via `.gitignore`.
- `.env.example` includes only an empty `SMTP_PASS=` entry.

### 3.3 TLS Certificate Validation
- Node.js SMTP transport configuration enforces `tls: { rejectUnauthorized: true }`.
- Self-signed certificate bypasses and `rejectUnauthorized: false` are strictly prohibited.

### 3.4 Gmail App Password Setup Instructions
If using Gmail as the SMTP sender provider:
1. Navigate to your Google Account at [https://myaccount.google.com/security](https://myaccount.google.com/security).
2. Ensure **2-Step Verification** is turned ON.
3. Search for or navigate to **App Passwords** ([https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)).
4. Enter an app name (e.g. `CampusSpace Security`) and click **Create**.
5. Copy the generated 16-character code (format: `xxxx xxxx xxxx xxxx`).
6. Set `SMTP_PASS` in `.env.local` to this 16-character string (without spaces).
7. Set `SMTP_USER` to your Google account email address.

---

## 4. Truthful Delivery Tracking & State Machine

The application tracks delivery truthfully and does not simulate success when unconfigured:

| Status | Label | Meaning |
| :--- | :--- | :--- |
| `sending` | Sending to mail server... | Nodemailer is currently connecting to the SMTP server. |
| `accepted` | Accepted by Mail Server | SMTP server returned 250 OK. Message queued for delivery by provider. *(Notice: SMTP acceptance does not guarantee delivery to recipient inbox).* |
| `delivered` | Delivered to Mailbox | Confirmed by delivery receipt. |
| `failed` | Delivery Failed | SMTP transport encountered a connection, authentication, or network error. |
| `unconfigured` | SMTP Unconfigured | Server detects missing SMTP secrets in `.env.local`. Honest notice shown with setup instructions. |
| `verified` | Code Verified ✓ | Code was matched and verified for the active challenge. |

---

## 5. Security Invariants & Attack Mitigations

1. **Password-Free Administrator Initiation:**
   - No administrator password field or step exists.
   - Self-reported claimed name is accepted for audit history.
   - Changing the claimed name after codes are dispatched requires starting a new challenge.
2. **Database-Derived Recipient Enforcement:**
   - Recipient address `campusspaceadmin@gmail.com` is resolved strictly from the database administrator record.
   - Client-supplied destination emails or administrator identities are rejected.
3. **Short-Lived Challenge (5-Minute TTL):**
   - Challenges automatically expire after 300 seconds (5 minutes).
   - Expired challenges are permanently removed and cannot be verified.
4. **Cryptographic Salted Storage:**
   - Plaintext OTPs are never stored in memory or databases.
   - Each code is protected with a unique 16-byte cryptographic salt and hashed using SHA-256 (`hashOtp`).
   - Hash comparisons utilize constant-time equality (`crypto.timingSafeEqual`) to prevent timing side-channel attacks.
5. **Dual Code Requirement & Slot Binding:**
   - Both Code 1 and Code 2 must be submitted and validated for the same challenge.
   - Code 1 cannot be submitted in the Code 2 field (cross-slot transposition rejected).
   - One valid code alone is strictly rejected with HTTP 401.
6. **Atomic Challenge Consumption & Anti-Replay:**
   - Upon successful verification, `challenge.consumed` is immediately set to `true`.
   - Replay attempts of the same challenge or code pair are rejected.
7. **Brute-Force & Attempt Limits:**
   - Maximum 5 failed verification attempts per challenge before the challenge is permanently locked and invalidated.
   - Network IP rate limiting restricts challenge creation to 5 attempts per 5-minute window.
   - Mailbox flood protection limits challenge creations targeting the administrator mailbox to 10 attempts per 10-minute window.
8. **Cooldown & Resend Invalidation:**
   - "Resend Both Codes" enforces a 45-second cooldown interval (unless previous send failed or was unconfigured).
   - Resending immediately invalidates the previous code pair and issues fresh independent tokens.
9. **HTML Escaping & Content Sanitization:**
   - Self-reported claimed names are strictly sanitized and HTML-escaped using `escapeHtml()` prior to email template interpolation, preventing HTML injection.
10. **Privileged Path Protection:**
   - No browser-controlled `isAdmin` flag is trusted.
   - Administrator cookies (`campus_admin_session_v1`) are HttpOnly, SameSite=Lax, and issued exclusively upon successful dual email verification.
