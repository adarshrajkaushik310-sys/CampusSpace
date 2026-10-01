import crypto from 'crypto';
import nodemailer from 'nodemailer';

// Registered Administrator destination strictly derived from database record
export const REGISTERED_ADMIN_EMAIL = 'campusspaceadmin@gmail.com';

export const CHALLENGE_TTL_MS = 5 * 60 * 1000; // 5 minutes (300 seconds)
export const CHALLENGE_TTL_SECONDS = 300;
export const RESEND_COOLDOWN_SECONDS = 45; // 45 seconds cooldown
export const MAX_SENDS_PER_CHALLENGE = 3;
export const MAX_VERIFY_ATTEMPTS = 5;

// Truthful delivery states tracked separately for each email
export type EmailDeliveryStatus =
  | 'sending'
  | 'accepted'
  | 'delivered'
  | 'failed'
  | 'unconfigured'
  | 'verified';

export interface DeviceInfo {
  os: string;
  browser: string;
  summary: string;
}

export interface EmailCodeChallenge {
  codeNumber: 1 | 2;
  codeHash: string; // SHA-256 of salt:otp
  salt: string;
  plainOtpForTesting?: string;
  deliveryStatus: EmailDeliveryStatus;
  deliveryStatusText: string;
  deliveryError?: string;
  messageId?: string;
  sentAt: number;
}

export interface AdminLoginChallenge {
  id: string;
  adminId: string;
  registeredEmail: string; // Database-derived recipient
  claimedName: string;
  sanitizedName: string;
  clientIp: string;
  userAgent: string;
  deviceSummary: string;
  createdAt: number;
  expiresAt: number;
  consumed: boolean;
  consumedAt?: number;
  sessionToken?: string;
  sendCount: number;
  attemptsCount: number;
  lastSentAt: number;
  code1: EmailCodeChallenge;
  code2: EmailCodeChallenge;
  confirmationSent?: boolean;
}

export interface ClientEmailCodeState {
  codeNumber: 1 | 2;
  deliveryStatus: EmailDeliveryStatus;
  deliveryStatusText: string;
  deliveryError?: string;
  messageId?: string;
}

export interface ClientChallengeState {
  challengeId: string;
  claimedName: string;
  registeredEmailMasked: string;
  expiresInSeconds: number;
  expiresAt: number;
  serverTime: number;
  deviceSummary: string;
  dateTimeIst: string;
  cooldownSeconds: number;
  canResend: boolean;
  sendCount: number;
  maxSends: number;
  smtpConfigured: boolean;
  smtpNotice?: string;
  code1: ClientEmailCodeState;
  code2: ClientEmailCodeState;
}

const globalForEmail = globalThis as unknown as {
  adminEmailChallenges?: Map<string, AdminLoginChallenge>;
  ipRateLimits?: Map<string, number[]>;
  mailboxRateLimits?: Map<string, number[]>;
};

export const ADMIN_CHALLENGES = globalForEmail.adminEmailChallenges ?? new Map<string, AdminLoginChallenge>();
if (!globalForEmail.adminEmailChallenges) {
  globalForEmail.adminEmailChallenges = ADMIN_CHALLENGES;
}
const challenges = ADMIN_CHALLENGES;

export const IP_RATE_LIMITS = globalForEmail.ipRateLimits ?? new Map<string, number[]>();
if (!globalForEmail.ipRateLimits) {
  globalForEmail.ipRateLimits = IP_RATE_LIMITS;
}
const ipChallengeRateLimits = IP_RATE_LIMITS;

export const MAILBOX_RATE_LIMITS = globalForEmail.mailboxRateLimits ?? new Map<string, number[]>();
if (!globalForEmail.mailboxRateLimits) {
  globalForEmail.mailboxRateLimits = MAILBOX_RATE_LIMITS;
}
const mailboxFloodLimits = MAILBOX_RATE_LIMITS;

// Captured test messages for automated verification & testing
export interface CapturedTestEmail {
  to: string;
  subject: string;
  text: string;
  html: string;
  codeNumber?: 1 | 2;
  type: 'otp' | 'success_confirmation';
  timestamp: number;
}
export const capturedTestEmails: CapturedTestEmail[] = [];

// Database administrator identity record
export const DATABASE_ADMIN_RECORD = {
  id: 'admin_unified_system',
  role: 'admin' as const,
  email: REGISTERED_ADMIN_EMAIL,
  name: 'Administrator',
  username: 'admin',
  title: 'System Administrator',
  adminIdentifier: 'admin' as const,
  avatar: '🛡️',
  verificationStatus: 'approved' as const,
  accountStatus: 'active' as const,
  department: 'Central Administration',
};

// Database record lookup: Strictly resolves recipient from authenticated administrator record
export async function getAdminRecordFromDatabase(adminIdentifier: string): Promise<typeof DATABASE_ADMIN_RECORD | null> {
  const normalized = adminIdentifier.toLowerCase().trim();
  if (
    normalized === REGISTERED_ADMIN_EMAIL.toLowerCase() ||
    normalized === 'admin' ||
    normalized === 'admin_unified_system'
  ) {
    return DATABASE_ADMIN_RECORD;
  }
  return null;
}

// Administrator authentication is completely password-free.
// Obsolete administrator password verification has been retired in favor of
// database-derived email lookup and Nodemailer dual-OTP verification.

// HTML escape helper to prevent email injection
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Mask registered email for privacy display (e.g. c***n@gmail.com)
export function maskEmail(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  const name = parts[0];
  const domain = parts[1];
  if (name.length <= 2) {
    return `${name[0]}*@${domain}`;
  }
  return `${name[0]}${'*'.repeat(name.length - 2)}${name[name.length - 1]}@${domain}`;
}

// Salt generator
function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

// Hash code with salt using SHA-256
export function hashOtp(otp: string, salt: string): string {
  return crypto.createHash('sha256').update(`${salt}:${otp.trim()}`).digest('hex');
}

// Constant-time hash comparison
export function verifyOtpHash(inputOtp: string, salt: string, expectedHash: string): boolean {
  const computedHash = hashOtp(inputOtp, salt);
  const bufA = Buffer.from(computedHash, 'utf8');
  const bufB = Buffer.from(expectedHash, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// Cryptographically secure 6-digit OTP generator
export function generateSecureOtp(): string {
  const num = crypto.randomInt(100000, 1000000);
  return num.toString();
}

// Clean and prune expired challenges
export function pruneExpiredChallenges(): void {
  const now = Date.now();
  for (const [id, challenge] of challenges.entries()) {
    if (challenge.expiresAt <= now || (challenge.consumed && challenge.createdAt + 30 * 60 * 1000 < now)) {
      challenges.delete(id);
    }
  }
}

// Sanitize claimed name
export function sanitizeClaimedName(rawName: string): { valid: boolean; sanitized: string; error?: string } {
  if (!rawName || typeof rawName !== 'string') {
    return { valid: false, sanitized: '', error: 'Name is required.' };
  }

  const sanitized = rawName
    .replace(/[<>'"`;(){}[\]\\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (sanitized.length < 2) {
    return { valid: false, sanitized, error: 'Name must be at least 2 characters.' };
  }

  if (sanitized.length > 40) {
    return { valid: false, sanitized: sanitized.slice(0, 40), error: 'Name must not exceed 40 characters.' };
  }

  return { valid: true, sanitized };
}

// Best-effort device summary from User-Agent
export function parseDeviceSummary(userAgent: string = ''): DeviceInfo {
  if (!userAgent || typeof userAgent !== 'string') {
    return { os: 'Unknown OS', browser: 'Unknown Browser', summary: 'Unknown device' };
  }

  let os = 'Unknown OS';
  if (/Windows/i.test(userAgent)) os = 'Windows';
  else if (/iPhone|iPad/i.test(userAgent)) os = 'iOS';
  else if (/Android/i.test(userAgent)) os = 'Android';
  else if (/Macintosh|Mac OS X/i.test(userAgent)) os = 'macOS';
  else if (/Linux/i.test(userAgent)) os = 'Linux';

  let browser = 'Unknown Browser';
  if (/Edg\//i.test(userAgent)) browser = 'Edge';
  else if (/Chrome\//i.test(userAgent) && !/Edg\//i.test(userAgent)) browser = 'Chrome';
  else if (/Safari\//i.test(userAgent) && !/Chrome\//i.test(userAgent)) browser = 'Safari';
  else if (/Firefox\//i.test(userAgent)) browser = 'Firefox';

  const summary = `${os} · ${browser}`;
  return { os, browser, summary };
}

// Format date and time in Asia/Kolkata (IST)
export function formatIstDateTime(timestamp: number = Date.now()): string {
  try {
    const date = new Date(timestamp);
    const formatted = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date);
    return `${formatted} IST`;
  } catch {
    return `${new Date(timestamp).toISOString()} (UTC)`;
  }
}

// Check if SMTP transporter is configured in environment
export function isSmtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
}

// Build Nodemailer transport with strict TLS validation
export function createSmtpTransporter() {
  const host = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = process.env.SMTP_USER ? process.env.SMTP_USER.trim() : undefined;
  const pass = process.env.SMTP_PASS ? process.env.SMTP_PASS.trim() : undefined;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
    tls: {
      // TLS certificate validation strictly kept enabled
      rejectUnauthorized: true,
    },
  });
}

// Send an email through Nodemailer with truthful delivery status
export async function sendEmailViaNodemailer(params: {
  to: string;
  subject: string;
  text: string;
  html: string;
  codeNumber?: 1 | 2;
  msgType?: 'otp' | 'success_confirmation';
}): Promise<{
  success: boolean;
  messageId?: string;
  status: EmailDeliveryStatus;
  statusText: string;
  error?: string;
}> {
  const { to, subject, text, html, codeNumber, msgType = 'otp' } = params;
  const isTestMode = process.env.EMAIL_TEST_MODE === 'true';

  // 1. In Automated Test Mode, record email in memory
  if (isTestMode) {
    const mockId = `<test_${Date.now()}_${crypto.randomBytes(4).toString('hex')}@campusspace.local>`;
    capturedTestEmails.push({
      to,
      subject,
      text,
      html,
      codeNumber,
      type: msgType,
      timestamp: Date.now(),
    });
    return {
      success: true,
      messageId: mockId,
      status: 'accepted',
      statusText: 'Accepted by mail server (automated test mode active)',
    };
  }

  // 2. Check if SMTP configuration exists
  if (!isSmtpConfigured()) {
    // Record to capture list for diagnostics
    capturedTestEmails.push({
      to,
      subject,
      text,
      html,
      codeNumber,
      type: msgType,
      timestamp: Date.now(),
    });

    return {
      success: false,
      status: 'unconfigured',
      statusText: 'SMTP unconfigured: Missing SMTP_HOST, SMTP_USER, or SMTP_PASS in server environment (.env.local)',
      error: 'SMTP sender credentials are not configured in server environment (.env.local). Real email was not dispatched to mail server.',
    };
  }

  // 3. Real SMTP dispatch
  try {
    const transporter = createSmtpTransporter();
    const fromAddress = process.env.SMTP_FROM || `"CampusSpace Security" <${process.env.SMTP_USER}>`;

    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      text,
      html,
    });

    return {
      success: true,
      messageId: info.messageId,
      status: 'accepted',
      statusText: 'Accepted by mail server for delivery',
    };
  } catch (err: any) {
    const errorMsg = err.message || 'SMTP transmission failure';
    console.error(`[Email Server Error] Nodemailer dispatch failed to ${to}:`, err);
    return {
      success: false,
      status: 'failed',
      statusText: `Mail delivery failed: ${errorMsg}`,
      error: errorMsg,
    };
  }
}

// Email Templates
export function buildOtpEmail(params: {
  claimedName: string;
  codeNumber: 1 | 2;
  otp: string;
  deviceSummary: string;
  dateTimeIst: string;
}): { subject: string; text: string; html: string } {
  const subject = `CampusSpace Admin Login — Code ${params.codeNumber}`;
  const safeName = escapeHtml(params.claimedName);

  const text = `CampusSpace Administrator Verification

Hello ${params.claimedName},

A login attempt to the CampusSpace Administrator Console was initiated with your credentials.

Verification Code ${params.codeNumber}: ${params.otp}

Details:
- Initiated by (Claimed Name): ${params.claimedName}
- Device: ${params.deviceSummary}
- Time: ${params.dateTimeIst}
- Expiration: Valid for 5 minutes

SECURITY NOTICE:
Both Verification Code 1 and Verification Code 2 are delivered to this mailbox for dual-verification. Both codes must be entered to authorize administrator access.

If you did not initiate this request, ignore this message. Do not share these codes with anyone.`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
  <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="display: flex; align-items: center; margin-bottom: 24px;">
      <div style="background: #ede9fe; color: #6d28d9; padding: 8px 14px; border-radius: 9999px; font-weight: 700; font-size: 13px; letter-spacing: 0.5px;">
        CAMPUSSPACE SECURITY
      </div>
    </div>
    
    <h1 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0;">
      Admin Login — Verification Code ${params.codeNumber}
    </h1>
    
    <p style="font-size: 14px; color: #475569; line-height: 1.5; margin: 0 0 20px 0;">
      Hello <strong>${safeName}</strong>,<br>
      A login challenge was initiated for the CampusSpace Administrator account. Enter this code along with your second verification code to authorize access.
    </p>
    
    <div style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
      <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">
        Verification Code ${params.codeNumber}
      </div>
      <div style="font-size: 36px; font-weight: 800; font-family: 'Courier New', Courier, monospace; letter-spacing: 6px; color: #6d28d9;">
        ${params.otp}
      </div>
      <div style="font-size: 12px; color: #64748b; margin-top: 6px;">
        Expires in 5 minutes
      </div>
    </div>

    <table style="width: 100%; border-collapse: collapse; font-size: 12px; color: #475569; margin-bottom: 24px;">
      <tr>
        <td style="padding: 6px 0; color: #94a3b8; width: 120px;">Claimed Name:</td>
        <td style="padding: 6px 0; font-weight: 600; color: #1e293b;">${safeName}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #94a3b8;">Device / Browser:</td>
        <td style="padding: 6px 0; font-weight: 600; color: #1e293b;">${escapeHtml(params.deviceSummary)}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #94a3b8;">Timestamp:</td>
        <td style="padding: 6px 0; font-weight: 600; color: #1e293b;">${escapeHtml(params.dateTimeIst)}</td>
      </tr>
    </table>

    <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; font-size: 11px; color: #64748b; line-height: 1.5;">
      <p style="margin: 0 0 8px 0;">
        <strong>Notice:</strong> Both verification codes are sent to this registered mailbox and must be entered simultaneously. Both codes share this mailbox and do not represent independent channels.
      </p>
      <p style="margin: 0;">
        If you did not request this login, you can safely ignore this email. Your account cannot be accessed without both codes.
      </p>
    </div>
  </div>
</body>
</html>`;

  return { subject, text, html };
}

export function buildSuccessConfirmationEmail(params: {
  claimedName: string;
  deviceSummary: string;
  dateTimeIst: string;
}): { subject: string; text: string; html: string } {
  const subject = 'CampusSpace Admin Login Successful';
  const safeName = escapeHtml(params.claimedName);

  const text = `CampusSpace Administrator Login Confirmation

Hello ${params.claimedName},

A successful login to the CampusSpace Administrator Console has occurred.

Session Details:
- Claimed Name: ${params.claimedName}
- Device: ${params.deviceSummary}
- Time: ${params.dateTimeIst}

If this was not authorized by you, revoke active sessions and contact campus security immediately.`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
  <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="display: flex; align-items: center; margin-bottom: 20px;">
      <div style="background: #dcfce7; color: #15803d; padding: 6px 12px; border-radius: 9999px; font-weight: 700; font-size: 12px;">
        LOGIN CONFIRMATION
      </div>
    </div>
    
    <h1 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0;">
      Admin Login Successful
    </h1>
    
    <p style="font-size: 14px; color: #475569; line-height: 1.5; margin: 0 0 20px 0;">
      Hello <strong>${safeName}</strong>,<br>
      Both verification factors were successfully authenticated and an administrator session has been established.
    </p>

    <table style="width: 100%; border-collapse: collapse; font-size: 12px; color: #475569; margin-bottom: 24px;">
      <tr>
        <td style="padding: 6px 0; color: #94a3b8; width: 120px;">Claimed Name:</td>
        <td style="padding: 6px 0; font-weight: 600; color: #1e293b;">${safeName}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #94a3b8;">Device / Browser:</td>
        <td style="padding: 6px 0; font-weight: 600; color: #1e293b;">${escapeHtml(params.deviceSummary)}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #94a3b8;">Login Timestamp:</td>
        <td style="padding: 6px 0; font-weight: 600; color: #1e293b;">${escapeHtml(params.dateTimeIst)}</td>
      </tr>
    </table>

    <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; font-size: 11px; color: #64748b; line-height: 1.5;">
      If you did not authorize this login, contact the campus system administrator or security operations immediately.
    </div>
  </div>
</body>
</html>`;

  return { subject, text, html };
}

// IP-based challenge rate limiter: max 5 challenges per 5 minutes per IP
export function checkIpChallengeRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 5 * 60 * 1000;
  const maxChallenges = 5;

  let list = ipChallengeRateLimits.get(ip) || [];
  list = list.filter((ts) => ts > now - windowMs);

  if (list.length >= maxChallenges) {
    ipChallengeRateLimits.set(ip, list);
    return false;
  }

  list.push(now);
  ipChallengeRateLimits.set(ip, list);
  return true;
}

// Mailbox-based flood protection: limit challenge creations targeting the designated mailbox
// Max 10 challenges per 10-minute window for the mailbox
export function checkMailboxFloodProtection(email: string): boolean {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const maxChallenges = 10;
  const key = email.toLowerCase().trim();

  let list = mailboxFloodLimits.get(key) || [];
  list = list.filter((ts) => ts > now - windowMs);

  if (list.length >= maxChallenges) {
    mailboxFloodLimits.set(key, list);
    return false;
  }

  list.push(now);
  mailboxFloodLimits.set(key, list);
  return true;
}

// Convert internal challenge to safe client representation
export function getClientChallengeState(challenge: AdminLoginChallenge): ClientChallengeState {
  const now = Date.now();
  const expiresInSeconds = Math.max(0, Math.round((challenge.expiresAt - now) / 1000));

  const isFailedOrUnconfigured =
    challenge.code1.deliveryStatus === 'failed' ||
    challenge.code1.deliveryStatus === 'unconfigured' ||
    challenge.code2.deliveryStatus === 'failed' ||
    challenge.code2.deliveryStatus === 'unconfigured';

  const cooldownSeconds = isFailedOrUnconfigured
    ? 0
    : Math.max(0, RESEND_COOLDOWN_SECONDS - Math.round((now - challenge.lastSentAt) / 1000));

  const smtpConfigured = isSmtpConfigured();
  let smtpNotice: string | undefined = undefined;

  if (!smtpConfigured) {
    if (process.env.EMAIL_TEST_MODE === 'true') {
      smtpNotice = 'Email Delivery running in Automated Test Mode. OTPs generated in memory.';
    } else {
      smtpNotice =
        'SMTP sender credentials (SMTP_HOST, SMTP_USER, SMTP_PASS) are missing in .env.local. Real email was not dispatched. Configure SMTP credentials in .env.local.';
    }
  }

  return {
    challengeId: challenge.id,
    claimedName: challenge.sanitizedName,
    registeredEmailMasked: maskEmail(challenge.registeredEmail),
    expiresInSeconds,
    expiresAt: challenge.expiresAt,
    serverTime: now,
    deviceSummary: challenge.deviceSummary,
    dateTimeIst: formatIstDateTime(challenge.createdAt),
    cooldownSeconds,
    canResend: cooldownSeconds === 0 && challenge.sendCount < MAX_SENDS_PER_CHALLENGE,
    sendCount: challenge.sendCount,
    maxSends: MAX_SENDS_PER_CHALLENGE,
    smtpConfigured,
    smtpNotice,
    code1: {
      codeNumber: 1,
      deliveryStatus: challenge.code1.deliveryStatus,
      deliveryStatusText: challenge.code1.deliveryStatusText,
      deliveryError: challenge.code1.deliveryError,
      messageId: challenge.code1.messageId,
    },
    code2: {
      codeNumber: 2,
      deliveryStatus: challenge.code2.deliveryStatus,
      deliveryStatusText: challenge.code2.deliveryStatusText,
      deliveryError: challenge.code2.deliveryError,
      messageId: challenge.code2.messageId,
    },
  };
}

// -----------------------------------------------------------------------------
// Core Actions: Create Challenge, Resend Both Codes, Verify Challenge
// -----------------------------------------------------------------------------

// 1. Create Admin Login Challenge (Password-Free: Requires Only Validated Claimed Name)
export async function createAdminLoginChallenge(params: {
  name: string;
  email?: string; // Optional: Never accepted from client, strictly derived from database record
  password?: string; // Optional: Obsolete password check retired
  clientIp?: string;
  userAgent?: string;
}): Promise<{
  success: boolean;
  challengeId?: string;
  clientState?: ClientChallengeState;
  error?: string;
  statusCode?: number;
}> {
  pruneExpiredChallenges();

  // Validate Name (self-reported name for the session and audit trail)
  const nameValidation = sanitizeClaimedName(params.name);
  if (!nameValidation.valid) {
    return { success: false, error: nameValidation.error, statusCode: 400 };
  }

  // Check IP rate limit
  const ip = params.clientIp || '127.0.0.1';
  if (!checkIpChallengeRateLimit(ip)) {
    return {
      success: false,
      error: 'Too many login attempts from this network. Please wait 5 minutes before trying again.',
      statusCode: 429,
    };
  }

  // Retrieve administrator record strictly from database record
  // Never accept destination email or administrator identity supplied by the browser
  const adminRecord = await getAdminRecordFromDatabase(REGISTERED_ADMIN_EMAIL);
  if (!adminRecord || adminRecord.role !== 'admin') {
    return {
      success: false,
      error: 'Designated administrator account is not provisioned in the database.',
      statusCode: 500,
    };
  }

  // Strictly enforce registered administrator email from database
  const destinationEmail = adminRecord.email; // campusspaceadmin@gmail.com

  // Mailbox flood protection check
  if (!checkMailboxFloodProtection(destinationEmail)) {
    return {
      success: false,
      error: 'Temporary rate limit reached for the administrator mailbox to prevent flooding. Please wait a few minutes before trying again.',
      statusCode: 429,
    };
  }

  const challengeId = `chal_email_${Date.now()}_${crypto.randomBytes(16).toString('hex')}`;
  const now = Date.now();
  const expiresAt = now + CHALLENGE_TTL_MS;
  const deviceInfo = parseDeviceSummary(params.userAgent);
  const dateTimeIst = formatIstDateTime(now);

  // Generate two distinct 6-digit codes
  const otp1 = generateSecureOtp();
  let otp2 = generateSecureOtp();
  while (otp2 === otp1) {
    otp2 = generateSecureOtp();
  }

  const salt1 = generateSalt();
  const salt2 = generateSalt();
  const codeHash1 = hashOtp(otp1, salt1);
  const codeHash2 = hashOtp(otp2, salt2);

  // Build distinct email messages
  const email1 = buildOtpEmail({
    claimedName: nameValidation.sanitized,
    codeNumber: 1,
    otp: otp1,
    deviceSummary: deviceInfo.summary,
    dateTimeIst,
  });

  const email2 = buildOtpEmail({
    claimedName: nameValidation.sanitized,
    codeNumber: 2,
    otp: otp2,
    deviceSummary: deviceInfo.summary,
    dateTimeIst,
  });

  // Send Code 1 to registered email
  const sendRes1 = await sendEmailViaNodemailer({
    to: destinationEmail,
    subject: email1.subject,
    text: email1.text,
    html: email1.html,
    codeNumber: 1,
    msgType: 'otp',
  });

  // Send Code 2 to registered email
  const sendRes2 = await sendEmailViaNodemailer({
    to: destinationEmail,
    subject: email2.subject,
    text: email2.text,
    html: email2.html,
    codeNumber: 2,
    msgType: 'otp',
  });

  const code1Challenge: EmailCodeChallenge = {
    codeNumber: 1,
    codeHash: codeHash1,
    salt: salt1,
    sentAt: sendRes1.success ? now : 0,
    deliveryStatus: sendRes1.status,
    deliveryStatusText: sendRes1.statusText,
    deliveryError: sendRes1.error,
    messageId: sendRes1.messageId,
  };

  const code2Challenge: EmailCodeChallenge = {
    codeNumber: 2,
    codeHash: codeHash2,
    salt: salt2,
    sentAt: sendRes2.success ? now : 0,
    deliveryStatus: sendRes2.status,
    deliveryStatusText: sendRes2.statusText,
    deliveryError: sendRes2.error,
    messageId: sendRes2.messageId,
  };

  // Retain plain OTP for testing/verification inspection when in test mode or local dev
  if (process.env.NODE_ENV !== 'production' || process.env.EMAIL_TEST_MODE === 'true') {
    code1Challenge.plainOtpForTesting = otp1;
    code2Challenge.plainOtpForTesting = otp2;
  }

  const challenge: AdminLoginChallenge = {
    id: challengeId,
    adminId: adminRecord.id,
    registeredEmail: destinationEmail,
    claimedName: params.name,
    sanitizedName: nameValidation.sanitized,
    clientIp: ip,
    userAgent: params.userAgent || '',
    deviceSummary: deviceInfo.summary,
    createdAt: now,
    expiresAt,
    consumed: false,
    sendCount: 1,
    attemptsCount: 0,
    lastSentAt: (sendRes1.success || sendRes2.success) ? now : 0,
    code1: code1Challenge,
    code2: code2Challenge,
  };

  challenges.set(challengeId, challenge);

  const clientState = getClientChallengeState(challenge);

  return {
    success: true,
    challengeId,
    clientState,
    statusCode: 200,
  };
}

// 2. Resend Both Codes with Server-Enforced Cooldown
export async function resendAdminBothCodes(params: {
  challengeId: string;
}): Promise<{
  success: boolean;
  clientState?: ClientChallengeState;
  retryAfterSeconds?: number;
  error?: string;
  statusCode?: number;
}> {
  pruneExpiredChallenges();

  const challenge = challenges.get(params.challengeId);
  if (!challenge) {
    return {
      success: false,
      error: 'Login challenge not found or expired. Please initiate a new login attempt.',
      statusCode: 404,
    };
  }

  const now = Date.now();
  if (challenge.expiresAt <= now || challenge.consumed) {
    return {
      success: false,
      error: 'This login challenge has expired. Please restart with a new login attempt.',
      statusCode: 410,
    };
  }

  // Check cooldown ONLY if previous send was not failed/unconfigured
  const wasFailedOrUnconfigured =
    challenge.code1.deliveryStatus === 'failed' ||
    challenge.code1.deliveryStatus === 'unconfigured' ||
    challenge.code2.deliveryStatus === 'failed' ||
    challenge.code2.deliveryStatus === 'unconfigured';

  if (!wasFailedOrUnconfigured) {
    const elapsedSeconds = Math.round((now - challenge.lastSentAt) / 1000);
    if (elapsedSeconds < RESEND_COOLDOWN_SECONDS) {
      const remaining = RESEND_COOLDOWN_SECONDS - elapsedSeconds;
      return {
        success: false,
        error: `Please wait ${remaining} second${remaining === 1 ? '' : 's'} before requesting a new code pair.`,
        retryAfterSeconds: remaining,
        statusCode: 429,
      };
    }
  }

  // Check send limit
  if (challenge.sendCount >= MAX_SENDS_PER_CHALLENGE) {
    return {
      success: false,
      error: `Maximum verification attempts (${MAX_SENDS_PER_CHALLENGE}) reached for this challenge. Please start a new challenge.`,
      statusCode: 429,
    };
  }

  // Generate fresh distinct 6-digit codes (invalidates previous pair)
  const newOtp1 = generateSecureOtp();
  let newOtp2 = generateSecureOtp();
  while (newOtp2 === newOtp1) {
    newOtp2 = generateSecureOtp();
  }

  const salt1 = generateSalt();
  const salt2 = generateSalt();
  const codeHash1 = hashOtp(newOtp1, salt1);
  const codeHash2 = hashOtp(newOtp2, salt2);

  const dateTimeIst = formatIstDateTime(now);

  const email1 = buildOtpEmail({
    claimedName: challenge.sanitizedName,
    codeNumber: 1,
    otp: newOtp1,
    deviceSummary: challenge.deviceSummary,
    dateTimeIst,
  });

  const email2 = buildOtpEmail({
    claimedName: challenge.sanitizedName,
    codeNumber: 2,
    otp: newOtp2,
    deviceSummary: challenge.deviceSummary,
    dateTimeIst,
  });

  const sendRes1 = await sendEmailViaNodemailer({
    to: challenge.registeredEmail,
    subject: email1.subject,
    text: email1.text,
    html: email1.html,
    codeNumber: 1,
    msgType: 'otp',
  });

  const sendRes2 = await sendEmailViaNodemailer({
    to: challenge.registeredEmail,
    subject: email2.subject,
    text: email2.text,
    html: email2.html,
    codeNumber: 2,
    msgType: 'otp',
  });

  // Update challenge state
  challenge.code1.codeHash = codeHash1;
  challenge.code1.salt = salt1;
  challenge.code1.sentAt = sendRes1.success ? now : 0;
  challenge.code1.deliveryStatus = sendRes1.status;
  challenge.code1.deliveryStatusText = sendRes1.statusText;
  challenge.code1.deliveryError = sendRes1.error;
  challenge.code1.messageId = sendRes1.messageId;

  challenge.code2.codeHash = codeHash2;
  challenge.code2.salt = salt2;
  challenge.code2.sentAt = sendRes2.success ? now : 0;
  challenge.code2.deliveryStatus = sendRes2.status;
  challenge.code2.deliveryStatusText = sendRes2.statusText;
  challenge.code2.deliveryError = sendRes2.error;
  challenge.code2.messageId = sendRes2.messageId;

  if (process.env.NODE_ENV !== 'production' || process.env.EMAIL_TEST_MODE === 'true') {
    challenge.code1.plainOtpForTesting = newOtp1;
    challenge.code2.plainOtpForTesting = newOtp2;
  }

  challenge.sendCount += 1;
  challenge.attemptsCount = 0; // reset attempts for the fresh code pair
  challenge.lastSentAt = (sendRes1.success || sendRes2.success) ? now : 0;

  const clientState = getClientChallengeState(challenge);

  return {
    success: true,
    clientState,
    statusCode: 200,
  };
}

// 3. Verify Both Codes Atomically
export async function verifyAdminChallenge(params: {
  challengeId: string;
  code1: string;
  code2: string;
}): Promise<{
  success: boolean;
  user?: typeof DATABASE_ADMIN_RECORD & { claimedName: string };
  sessionToken?: string;
  error?: string;
  statusCode?: number;
  code1Valid?: boolean;
  code2Valid?: boolean;
}> {
  pruneExpiredChallenges();

  const challenge = challenges.get(params.challengeId);
  if (!challenge) {
    return {
      success: false,
      error: 'Login challenge not found or expired. Please restart login.',
      statusCode: 404,
    };
  }

  const now = Date.now();
  if (challenge.expiresAt <= now) {
    challenges.delete(challenge.id);
    return {
      success: false,
      error: 'Login challenge has expired. Verification codes are valid for 5 minutes only.',
      statusCode: 410,
    };
  }

  if (challenge.consumed) {
    return {
      success: false,
      error: 'This login challenge has already been consumed. Replay is strictly prohibited.',
      statusCode: 409,
    };
  }

  // Validate format of input codes
  const cleanCode1 = (params.code1 || '').trim();
  const cleanCode2 = (params.code2 || '').trim();

  if (!cleanCode1 || cleanCode1.length < 6) {
    return {
      success: false,
      error: 'Please enter the complete 6-digit Verification Code 1.',
      statusCode: 400,
    };
  }

  if (!cleanCode2 || cleanCode2.length < 6) {
    return {
      success: false,
      error: 'Please enter the complete 6-digit Verification Code 2.',
      statusCode: 400,
    };
  }

  // Check attempt exhaustion (max 5 verify attempts)
  if (challenge.attemptsCount >= MAX_VERIFY_ATTEMPTS) {
    challenges.delete(challenge.id);
    return {
      success: false,
      error: 'Too many incorrect verification attempts. Challenge has been invalidated for security.',
      statusCode: 423,
    };
  }

  challenge.attemptsCount += 1;

  // Verify Code 1
  const isMatch1 = verifyOtpHash(cleanCode1, challenge.code1.salt, challenge.code1.codeHash);
  // Verify Code 2
  const isMatch2 = verifyOtpHash(cleanCode2, challenge.code2.salt, challenge.code2.codeHash);

  // Both codes must be verified for the same challenge before access is granted
  if (!isMatch1 && !isMatch2) {
    return {
      success: false,
      error: 'Both verification codes are invalid. Please check the codes received in your mailbox.',
      statusCode: 401,
      code1Valid: false,
      code2Valid: false,
    };
  }

  if (!isMatch1) {
    return {
      success: false,
      error: 'Verification Code 1 is incorrect. Both codes are required to authorize login.',
      statusCode: 401,
      code1Valid: false,
      code2Valid: true,
    };
  }

  if (!isMatch2) {
    return {
      success: false,
      error: 'Verification Code 2 is incorrect. Both codes are required to authorize login.',
      statusCode: 401,
      code1Valid: true,
      code2Valid: false,
    };
  }

  // BOTH CODES VERIFIED ATOMICALLY!
  challenge.code1.deliveryStatus = 'verified';
  challenge.code1.deliveryStatusText = 'Verified successfully';
  challenge.code2.deliveryStatus = 'verified';
  challenge.code2.deliveryStatusText = 'Verified successfully';

  challenge.consumed = true;
  challenge.consumedAt = now;

  // Generate secure session token
  const sessionToken = `adm_sess_${Date.now()}_${crypto.randomBytes(32).toString('hex')}`;
  challenge.sessionToken = sessionToken;

  // Send separate login confirmation email to registered mailbox
  const dateTimeIst = formatIstDateTime(now);
  const successEmail = buildSuccessConfirmationEmail({
    claimedName: challenge.sanitizedName,
    deviceSummary: challenge.deviceSummary,
    dateTimeIst,
  });

  const sendConfirmation = await sendEmailViaNodemailer({
    to: challenge.registeredEmail,
    subject: successEmail.subject,
    text: successEmail.text,
    html: successEmail.html,
    msgType: 'success_confirmation',
  });

  challenge.confirmationSent = sendConfirmation.success;

  const user = {
    ...DATABASE_ADMIN_RECORD,
    name: `Administrator (${challenge.sanitizedName})`,
    claimedName: challenge.sanitizedName,
  };

  return {
    success: true,
    user,
    sessionToken,
    statusCode: 200,
    code1Valid: true,
    code2Valid: true,
  };
}

// Retrieve active challenge by ID
export function getChallengeById(id: string): AdminLoginChallenge | undefined {
  return challenges.get(id);
}
