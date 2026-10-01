/**
 * Securely Retired Module: src/lib/sms-service.ts
 *
 * The administrator dual-phone SMS OTP verification flow has been retired.
 * Administrator verification is now handled exclusively via server-side
 * Nodemailer email delivery to the registered mailbox: campusspaceadmin@gmail.com
 *
 * See: src/lib/email-service.ts
 */

export const RETIRED_NOTICE =
  'Administrator SMS verification has been retired in favor of Nodemailer email verification to campusspaceadmin@gmail.com.';

export type DeliveryStatus = 'unconfigured' | 'failed' | 'accepted' | 'delivered' | 'verified' | 'sending';

export const ADMIN_CHALLENGES = new Map<string, any>();

export async function createAdminLoginChallenge() {
  return {
    success: false,
    error: RETIRED_NOTICE,
    statusCode: 410,
  };
}

export async function resendRecipientOtp() {
  return {
    success: false,
    error: RETIRED_NOTICE,
    statusCode: 410,
  };
}

export async function verifyAdminChallenge() {
  return {
    success: false,
    error: RETIRED_NOTICE,
    statusCode: 410,
  };
}

export function recordDeliveryCallback() {
  return false;
}

export async function refreshTwilioDeliveryStatus() {
  return false;
}

export function getClientChallengeState() {
  return null;
}
