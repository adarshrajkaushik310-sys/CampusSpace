# Administrator Dual-SMS OTP Login & Carrier Delivery Guide

## 1. Investigation & Root Cause Analysis

### Why the page previously displayed “OTP sent” but neither phone received an SMS:

1. **Missing Server-Side Carrier Credentials**:
   Inspection of `.env.local` and the server runtime environment revealed that no SMS carrier credentials (`TWILIO_ACCOUNT_SID`, `MSG91_AUTH_KEY`, or `FAST2SMS_API_KEY`) were present in the environment.

2. **Silent In-Memory Fallback**:
   In `src/lib/sms-service.ts`, when carrier keys were absent in non-production environments, the backend silently simulated delivery by pushing the generated OTP to an internal test buffer (`capturedTestMessages`) without connecting to any cellular gateway or telecom network.

3. **Deceptive Hardcoded UI Label**:
   In `src/app/login/page.tsx`, the field labels were statically hardcoded as:
   - `OTP sent to phone ending 3408`
   - `OTP sent to phone ending 0295`
   
   Furthermore, an API response nesting mismatch caused the client to read `res.smsProviderConfigured` instead of `res.state.smsProviderConfigured`, which defaulted to `true`. This suppressed the developer notification and falsely signaled to visitors that SMS messages had been transmitted to mobile carriers.

---

## 2. Implemented Architecture & Truthful Delivery Flow

### 2.1 Fixed Server-Side Destinations
The recipients are strictly pinned to server-side constants and cannot be overridden by client requests:
- **Recipient 1**: `+91 7980393408` (masked in browser as `+91 ******3408`)
- **Recipient 2**: `+91 9332870295` (masked in browser as `+91 ******0295`)

### 2.2 Independent Verification Tokens
- Each recipient receives a cryptographically independent, 6-digit numeric token (`crypto.randomInt(100000, 1000000)`).
- Codes are hashed using SHA-256 with unique cryptographic salts before storage.
- Codes are verified using constant-time comparison (`crypto.timingSafeEqual`) to prevent timing side-channel attacks.

### 2.3 Truthful Delivery State Lifecycle
Delivery states are tracked independently for each recipient slot:
- `sending`: Backend/client is currently dispatching request to provider API.
- `accepted`: SMS provider acknowledged the message (e.g. Twilio returned HTTP 201 with `queued`/`sending` status).
- `delivered`: Real handset delivery receipt confirmed by telecom carrier via webhook or status polling.
- `failed`: Provider rejected message (e.g., unverified trial number, Geo-permissions blocked, or carrier error).
- `unconfigured`: No carrier credentials present in `.env.local`. Transparently disclosed in the UI.
- `verified`: Recipient's code was successfully verified.

### 2.4 Resend & Error Recovery Rules
- **Normal Cooldown**: 45 seconds per recipient when previous dispatch was accepted.
- **Immediate Retry for Delivery Failures**: If carrier dispatch fails or credentials are unconfigured, the 45-second cooldown penalty is bypassed, enabling an immediate "Retry Send" click.
- **Separate Recipient States**: If Recipient 1 is accepted and Recipient 2 fails, Recipient 1 retains its cooldown while Recipient 2 shows the exact failure diagnosis and an active retry button.
- **Backend Expiry Synchronization**: Challenge countdown is strictly anchored to `expiresAt` epoch milliseconds returned by the backend, rather than an independent browser timer.

---

## 3. SMS Provider Configuration Setup

To enable real SMS delivery to `+917980393408` and `+919332870295`, configure at least one of the supported providers in `.env.local`:

### Option A: Twilio (Recommended for Global Routing)

Add the following to `.env.local`:
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_FROM_NUMBER=+1xxxxxxxxxx
# Optional: Twilio Messaging Service SID
# TWILIO_MESSAGING_SERVICE_SID=MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### Critical Requirements for Indian Destinations (+91):
1. **Twilio India Geo-Permissions**:
   - Navigate to **Twilio Console** > **Messaging** > **Settings** > **Geo Permissions**.
   - Ensure the checkbox for **India (+91)** is enabled. Otherwise, Twilio rejects requests with error `21408`.

2. **Trial Account Verified Caller IDs**:
   - If using a Twilio Trial Account, SMS messages can **only** be delivered to verified phone numbers.
   - Go to **Twilio Console** > **Phone Numbers** > **Manage** > **Verified Caller IDs**.
   - Add and verify both numbers:
     - `+91 7980393408`
     - `+91 9332870295`
   - Otherwise, Twilio rejects sends with error `21608`.

3. **Indian Telecom (TRAI) DLT Requirements**:
   - For production traffic, Indian telecom operators require Distributed Ledger Technology (DLT) registration. Messages without registered Principal Entity (PE) ID and Content Template ID may be filtered by Indian operators (Twilio error `30034`).

4. **Delivery Receipt Webhook**:
   - Configure Twilio Status Callback URL to:
     `https://your-domain.com/api/auth/admin/delivery-callback`
   - The application automatically updates message status from `accepted` to `delivered` or `failed`.

---

### Option B: MSG91 (India DLT Registered Gateway)

Add the following to `.env.local`:
```env
MSG91_AUTH_KEY=your_msg91_auth_key
MSG91_DLT_TEMPLATE_ID=your_dlt_template_id
MSG91_SENDER_ID=your_sender_id
```

---

### Option C: Fast2SMS (Indian Quick Transactional Route)

Add the following to `.env.local`:
```env
FAST2SMS_API_KEY=your_fast2sms_api_key
```

---

## 4. Message Content Templates

The following exact approved templates are used for all dispatches:

### OTP Verification Request:
```
CampusSpace admin login requested. Name: {claimed_name}. Device: {device_summary}. Time: {date_time_and_timezone}. Your verification code: {otp}. Expires in 5 minutes. If you did not initiate or authorize this request, do not share this code.
```

### Successful Login Confirmation (Sent to Both Numbers):
```
CampusSpace admin login successful. Name: {claimed_name}. Device: {device_summary}. Time: {date_time_and_timezone}. If this was not authorized, contact the system operator immediately.
```
