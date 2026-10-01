/**
 * CampusSpace Environment Configuration Validator & Loader
 * Exposes type-safe access to environment variables.
 */

export interface CampusEnvironment {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  timezone: string;
  appUrl: string;
  adminEmail: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  isTestMode: boolean;
}

export function getCampusEnvironment(): CampusEnvironment {
  return {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    timezone: process.env.NEXT_PUBLIC_CAMPUS_TIMEZONE || 'Asia/Kolkata',
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    adminEmail: process.env.ADMIN_EMAIL || 'campusspaceadmin@gmail.com',
    smtpHost: process.env.SMTP_HOST,
    smtpPort: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
    smtpUser: process.env.SMTP_USER,
    isTestMode: process.env.EMAIL_TEST_MODE === 'true' || process.env.NODE_ENV === 'test',
  };
}
