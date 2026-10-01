'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCampusStore } from '@/lib/store';
import { BubbleButton } from '@/components/BubbleButton';
import {
  Sparkles,
  Mail,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  KeyRound,
  Shield,
} from 'lucide-react';

export default function ForgotPasswordPage() {
  const { resetPassword } = useCampusStore();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    setErrorMessage(null);

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid institutional email address.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await resetPassword(email.trim());
      if (res.success) {
        setStatusMessage(res.message);
      } else {
        setErrorMessage(res.error || 'Failed to dispatch password reset request.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during password reset.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center py-6 px-4 sm:px-6 animate-page-enter">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-3xl bg-gradient-to-tr from-[#8B5CF6] to-[#3B82F6] text-white shadow-bubble mb-1">
            <KeyRound className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] tracking-tight">
            Reset Password
          </h1>
          <p className="text-xs sm:text-sm text-[#B4B8CC]">
            Enter your registered institutional email to receive secure recovery instructions.
          </p>
        </div>

        <div className="bg-[#13131F] rounded-3xl p-7 sm:p-8 border border-[#2B2B40] shadow-card-dark">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {errorMessage && (
              <div className="flex items-start gap-2 p-3 rounded-2xl bg-[#1C1C2B] border border-[#F43F5E]/40 text-xs text-[#FDA4AF] animate-dropdown-enter">
                <AlertCircle className="w-4 h-4 text-[#F43F5E] flex-shrink-0 mt-0.5" />
                <span className="leading-snug">{errorMessage}</span>
              </div>
            )}

            {statusMessage && (
              <div className="flex items-start gap-2 p-3.5 rounded-2xl bg-[#1C1C2B] border border-[#10B981]/40 text-xs text-[#6EE7B7] animate-dropdown-enter">
                <CheckCircle2 className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{statusMessage}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="reset-email"
                className="block text-xs font-bold text-[#B4B8CC] tracking-tight"
              >
                Institutional Email Address <span className="text-[#F43F5E]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#B4B8CC]/60">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="username@campus.edu"
                  required
                  disabled={isLoading || !!statusMessage}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-[#1C1C2B] border border-[#2B2B40] text-xs text-[#F8FAFC] placeholder-[#B4B8CC]/50 focus:outline-none focus:ring-1 focus:ring-[#8B5CF6] focus:border-[#8B5CF6] transition-all"
                />
              </div>
            </div>

            <div className="pt-2">
              <BubbleButton
                type="submit"
                variant="primary"
                size="md"
                isLoading={isLoading}
                disabled={isLoading || !!statusMessage}
                className="w-full"
              >
                {isLoading ? 'Dispatching Instructions...' : 'Send Reset Link'}
              </BubbleButton>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-[#2B2B40] text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8B5CF6] hover:text-[#C4B5FD] transition-colors focus:outline-none focus-visible:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Sign In</span>
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-[11px] text-[#B4B8CC]/60 text-center">
          <Shield className="w-3.5 h-3.5 text-[#B4B8CC]/60" />
          <span>Encrypted cryptographic recovery dispatched via Supabase Auth</span>
        </div>
      </div>
    </div>
  );
}
