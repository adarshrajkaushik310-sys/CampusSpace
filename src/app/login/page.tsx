'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCampusStore } from '@/lib/store';
import { BubbleButton } from '@/components/BubbleButton';
import {
  Lock,
  Mail,
  User,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Shield,
  RotateCcw,
  Clock,
  Loader2,
  Radio,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Inbox,
  Send,
  Eye,
  EyeOff,
} from 'lucide-react';
import type { EmailDeliveryStatus } from '@/lib/email-service';

export default function LoginPage() {
  const router = useRouter();
  const {
    login,
    createAdminChallenge,
    resendAdminOtp,
    verifyAdminChallenge,
    fetchAdminChallengeStatus,
    isAuthenticated,
    sessionUser,
  } = useCampusStore();

  // Mode: standard institutional member login vs single unified admin login
  const [loginMode, setLoginMode] = useState<'institutional' | 'admin'>('institutional');

  // Institutional form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Administrator Challenge Step 1: Initial Login Form (Password-Free, Name-Only)
  const [adminStep, setAdminStep] = useState<'credentials' | 'verify'>('credentials');
  const [adminClaimedName, setAdminClaimedName] = useState('');

  // Administrator Challenge Step 2: Dual Email OTP Verification
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [registeredEmailMasked, setRegisteredEmailMasked] = useState('c***n@gmail.com');
  const [backendExpiresAt, setBackendExpiresAt] = useState<number | null>(null);
  const [challengeExpiresIn, setChallengeExpiresIn] = useState<number>(300);
  const [smtpConfigured, setSmtpConfigured] = useState<boolean>(false);
  const [smtpNotice, setSmtpNotice] = useState<string | null>(null);
  const [showSetupGuide, setShowSetupGuide] = useState<boolean>(false);

  // Dual Codes
  const [code1, setCode1] = useState('');
  const [code2, setCode2] = useState('');
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [sendCount, setSendCount] = useState(1);
  const [maxSends, setMaxSends] = useState(3);
  const [isResending, setIsResending] = useState(false);

  // Email 1 Delivery Tracking
  const [deliveryStatus1, setDeliveryStatus1] = useState<EmailDeliveryStatus>('unconfigured');
  const [deliveryStatusText1, setDeliveryStatusText1] = useState('');
  const [deliveryError1, setDeliveryError1] = useState<string | null>(null);

  // Email 2 Delivery Tracking
  const [deliveryStatus2, setDeliveryStatus2] = useState<EmailDeliveryStatus>('unconfigured');
  const [deliveryStatusText2, setDeliveryStatusText2] = useState('');
  const [deliveryError2, setDeliveryError2] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Dynamic visual transition state
  const [isSuccessTransition, setIsSuccessTransition] = useState<boolean>(false);

  // If already authenticated and approved, redirect to respective dashboard
  useEffect(() => {
    if (isAuthenticated && sessionUser) {
      if (sessionUser.role === 'admin') {
        router.push('/admin');
      } else if (sessionUser.verificationStatus === 'pending') {
        router.push('/auth/pending-verification');
      } else {
        router.push('/');
      }
    }
  }, [isAuthenticated, sessionUser, router]);

  // Accurate countdown reflecting backend expiry timestamp
  useEffect(() => {
    if (adminStep !== 'verify' || !challengeId) return;

    const updateTimers = () => {
      if (backendExpiresAt) {
        const remaining = Math.max(0, Math.floor((backendExpiresAt - Date.now()) / 1000));
        setChallengeExpiresIn(remaining);
      } else {
        setChallengeExpiresIn((prev) => (prev > 0 ? prev - 1 : 0));
      }
      setCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    };

    updateTimers();
    const interval = setInterval(updateTimers, 1000);
    return () => clearInterval(interval);
  }, [adminStep, challengeId, backendExpiresAt]);

  // Periodic polling for status
  useEffect(() => {
    if (adminStep !== 'verify' || !challengeId) return;

    const pollStatus = async () => {
      try {
        const res = await fetchAdminChallengeStatus({ challengeId });
        if (res.success && res.state) {
          if (res.state.code1) {
            setDeliveryStatus1(res.state.code1.deliveryStatus);
            setDeliveryStatusText1(res.state.code1.deliveryStatusText);
            setDeliveryError1(res.state.code1.deliveryError || null);
          }
          if (res.state.code2) {
            setDeliveryStatus2(res.state.code2.deliveryStatus);
            setDeliveryStatusText2(res.state.code2.deliveryStatusText);
            setDeliveryError2(res.state.code2.deliveryError || null);
          }
          if (typeof res.state.cooldownSeconds === 'number') {
            setCooldownSeconds(res.state.cooldownSeconds);
          }
          if (res.state.expiresAt) {
            setBackendExpiresAt(res.state.expiresAt);
          }
        }
      } catch (err) {
        // Silent poll error
      }
    };

    const interval = setInterval(pollStatus, 4000);
    return () => clearInterval(interval);
  }, [adminStep, challengeId, fetchAdminChallengeStatus]);

  const handleModeChange = (mode: 'institutional' | 'admin') => {
    setLoginMode(mode);
    setErrorMessage(null);
    setSuccessMessage(null);
    if (mode === 'institutional') {
      setAdminStep('credentials');
    }
  };

  const handleResetAdminStep = () => {
    setAdminStep('credentials');
    setChallengeId(null);
    setCode1('');
    setCode2('');
    setErrorMessage(null);
    setSuccessMessage(null);
    setDeliveryStatus1('unconfigured');
    setDeliveryStatus2('unconfigured');
  };

  // Format seconds into MM:SS
  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Submission handler for Standard Member Login
  const handleInstitutionalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!fullName.trim()) {
      setErrorMessage('Full name is required.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid institutional email.');
      return;
    }
    if (!password) {
      setErrorMessage('Password is required.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await login({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
      });

      if (res.success) {
        setIsSuccessTransition(true);
        setSuccessMessage('Authentication successful. Redirecting to dashboard...');
        setTimeout(() => {
          if (sessionUser?.role === 'admin') {
            router.push('/admin');
          } else if (sessionUser?.verificationStatus === 'pending') {
            router.push('/auth/pending-verification');
          } else {
            router.push('/');
          }
        }, 1200);
      } else {
        setIsSuccessTransition(false);
        setErrorMessage(res.error || 'Invalid credentials. Please verify your details.');
      }
    } catch (err: any) {
      setIsSuccessTransition(false);
      setErrorMessage(err.message || 'An unexpected error occurred during sign-in.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 1: Admin Challenge Initiation (Name-Only)
  const handleAdminInitiateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanName = adminClaimedName.trim();
    if (!cleanName) {
      setErrorMessage('Administrator name is required.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await createAdminChallenge({ claimedName: cleanName, name: cleanName });

      if (res.success && res.challengeId) {
        setChallengeId(res.challengeId);
        setRegisteredEmailMasked(res.registeredEmailMasked || 'c***n@gmail.com');
        setBackendExpiresAt(res.expiresAt || Date.now() + 300 * 1000);
        setChallengeExpiresIn(res.expiresInSeconds || 300);
        setSmtpConfigured(Boolean(res.smtpConfigured));
        setSmtpNotice(res.smtpNotice || null);

        const state = res.state || {};
        setCooldownSeconds(state.cooldownSeconds || 45);
        setSendCount(state.sendCount || 1);
        setMaxSends(state.maxSends || 3);

        if (state.code1) {
          setDeliveryStatus1(state.code1.deliveryStatus || 'unconfigured');
          setDeliveryStatusText1(state.code1.deliveryStatusText || '');
          setDeliveryError1(state.code1.deliveryError || null);
        }

        if (state.code2) {
          setDeliveryStatus2(state.code2.deliveryStatus || 'unconfigured');
          setDeliveryStatusText2(state.code2.deliveryStatusText || '');
          setDeliveryError2(state.code2.deliveryError || null);
        }

        setAdminStep('verify');
        setCode1('');
        setCode2('');
      } else {
        setErrorMessage(res.error || 'Failed to initiate administrator verification challenge.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error occurred while initiating verification.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Resend Both Codes with Server-Enforced Cooldown
  const handleResendBothCodes = async () => {
    if (!challengeId) return;
    setErrorMessage(null);

    const isFailedOrUnconfigured =
      deliveryStatus1 === 'failed' ||
      deliveryStatus1 === 'unconfigured' ||
      deliveryStatus2 === 'failed' ||
      deliveryStatus2 === 'unconfigured';

    if (!isFailedOrUnconfigured && cooldownSeconds > 0) return;
    if (sendCount >= maxSends) return;
    if (isResending) return;

    setIsResending(true);
    setDeliveryStatus1('sending');
    setDeliveryStatus2('sending');

    try {
      const res = await resendAdminOtp({ challengeId });
      const state = res.state || res;

      if (res.success) {
        setCooldownSeconds(state.cooldownSeconds ?? 45);
        setSendCount(state.sendCount ?? (sendCount + 1));
        if (state.code1) {
          setDeliveryStatus1(state.code1.deliveryStatus || 'accepted');
          setDeliveryStatusText1(state.code1.deliveryStatusText || 'Dispatched to mail server');
          setDeliveryError1(state.code1.deliveryError || null);
        }
        if (state.code2) {
          setDeliveryStatus2(state.code2.deliveryStatus || 'accepted');
          setDeliveryStatusText2(state.code2.deliveryStatusText || 'Dispatched to mail server');
          setDeliveryError2(state.code2.deliveryError || null);
        }
        setCode1('');
        setCode2('');
        setSuccessMessage('Fresh verification code pair dispatched to registered administrator mailbox.');
      } else {
        if (res.retryAfterSeconds) {
          setCooldownSeconds(res.retryAfterSeconds);
        }
        setErrorMessage(res.error || 'Failed to resend verification codes.');
        setDeliveryStatus1('failed');
        setDeliveryStatus2('failed');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error while requesting code resend.');
      setDeliveryStatus1('failed');
      setDeliveryStatus2('failed');
    } finally {
      setIsResending(false);
    }
  };

  // Step 2: Verify Both Codes Atomically
  const handleAdminVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!challengeId) {
      setErrorMessage('No active challenge. Please start over.');
      return;
    }

    if (challengeExpiresIn <= 0) {
      setErrorMessage('This verification challenge has expired. Please restart login to generate new codes.');
      return;
    }

    const cleanCode1 = code1.trim();
    const cleanCode2 = code2.trim();

    if (!cleanCode1 || !cleanCode2) {
      setErrorMessage('Both Verification Code 1 and Verification Code 2 are strictly required before administrator access can be granted.');
      return;
    }

    if (!/^\d{6}$/.test(cleanCode1)) {
      setErrorMessage('Please enter the complete 6-digit Verification Code 1.');
      return;
    }

    if (!/^\d{6}$/.test(cleanCode2)) {
      setErrorMessage('Please enter the complete 6-digit Verification Code 2.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await verifyAdminChallenge({
        challengeId,
        code1: cleanCode1,
        code2: cleanCode2,
      });

      if (res.success && res.user) {
        setIsSuccessTransition(true);
        setSuccessMessage('Dual-email verification successful. Directing to Administrator Console...');
        setDeliveryStatus1('verified');
        setDeliveryStatus2('verified');
        setTimeout(() => {
          router.push('/admin');
        }, 1200);
      } else {
        setIsSuccessTransition(false);
        setErrorMessage(
          res.error ||
            'Verification failed. Ensure both codes match the respective labelled emails.'
        );
      }
    } catch (err: any) {
      setIsSuccessTransition(false);
      setErrorMessage(err.message || 'Network error occurred while validating verification codes.');
    } finally {
      setIsLoading(false);
    }
  };

  // Render delivery badge with strict color palette
  const renderDeliveryBadge = (status: EmailDeliveryStatus, label: string) => {
    switch (status) {
      case 'sending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-100 text-neutral-700 border border-neutral-200">
            <Loader2 className="w-2.5 h-2.5 animate-spin text-neutral-500" />
            Sending to mail server...
          </span>
        );
      case 'accepted':
      case 'delivered':
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-campus-blue/10 text-campus-blue border border-campus-blue/20">
            <CheckCircle2 className="w-2.5 h-2.5 text-campus-blue" />
            {status === 'verified' ? 'Code Verified' : 'Accepted for Delivery'}
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-campus-red/10 text-campus-red border border-campus-red/20">
            <AlertTriangle className="w-2.5 h-2.5 text-campus-red" />
            Delivery Failed
          </span>
        );
      case 'unconfigured':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-100 text-neutral-700 border border-neutral-200">
            <AlertCircle className="w-2.5 h-2.5 text-neutral-500" />
            SMTP Unconfigured
          </span>
        );
    }
  };

  return (
    <div className="min-h-[85vh] bg-neutral-50 text-neutral-900 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-950 tracking-tight">
            Sign in to CampusSpace
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600">
            {loginMode === 'institutional'
              ? 'Student & Faculty Portal'
              : 'System Administration Access'}
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-sm space-y-5">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-neutral-100 border border-neutral-200 rounded-full">
            <button
              type="button"
              id="tab-member-login"
              onClick={() => handleModeChange('institutional')}
              className={`py-2 px-3 rounded-full text-xs font-semibold transition-all ${
                loginMode === 'institutional'
                  ? 'bg-white text-neutral-950 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-950'
              }`}
            >
              Member
            </button>
            <button
              type="button"
              id="tab-admin-login"
              onClick={() => handleModeChange('admin')}
              className={`py-2 px-3 rounded-full text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                loginMode === 'admin'
                  ? 'bg-white text-neutral-950 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-950'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Admin Login
            </button>
          </div>

          {/* Error & Feedback Banners */}
          {errorMessage && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-campus-red/10 border border-campus-red/20 text-xs text-campus-red flex items-start gap-2.5 animate-in fade-in"
            >
              <AlertCircle className="w-4 h-4 text-campus-red flex-shrink-0 mt-0.5" />
              <div className="leading-snug">{errorMessage}</div>
            </div>
          )}

          {successMessage && !isSuccessTransition && (
            <div
              role="status"
              className="p-3.5 rounded-xl bg-campus-blue/10 border border-campus-blue/20 text-xs text-campus-blue flex items-start gap-2.5 animate-in fade-in"
            >
              <CheckCircle2 className="w-4 h-4 text-campus-blue flex-shrink-0 mt-0.5" />
              <div className="leading-snug">{successMessage}</div>
            </div>
          )}

          {/* Logged-In Success State */}
          {isSuccessTransition && (
            <div className="py-8 text-center space-y-4 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-14 h-14 rounded-full bg-campus-blue/10 border border-campus-blue/20 text-campus-blue flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-neutral-950">Access Authorized</h3>
                <p className="text-xs text-neutral-600">
                  Welcome, <strong>{fullName || adminClaimedName || 'User'}</strong>
                </p>
              </div>
              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-600 flex items-center justify-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-campus-blue" />
                <span>Entering campus dashboard...</span>
              </div>
            </div>
          )}

          {/* ================================================================== */}
          {/* SECTION A: Standard Institutional Member Login */}
          {/* ================================================================== */}
          {!isSuccessTransition && loginMode === 'institutional' && (
            <form onSubmit={handleInstitutionalSubmit} className="space-y-4" noValidate>
              {/* Full Name */}
              <div className="space-y-1.5">
                <label
                  htmlFor="member-name"
                  className="block text-xs font-semibold text-neutral-700 tracking-tight"
                >
                  Full Name <span className="text-campus-red">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="member-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Dr. A. P. Sharma"
                    required
                    autoComplete="name"
                    disabled={isLoading}
                    className="w-full pl-10 pr-3.5 py-2 text-xs rounded-lg bg-neutral-50 border border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-campus-blue focus:border-campus-blue transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label
                  htmlFor="member-email"
                  className="block text-xs font-semibold text-neutral-700 tracking-tight"
                >
                  Institutional Email <span className="text-campus-red">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="member-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="username@campus.edu"
                    required
                    autoComplete="email"
                    disabled={isLoading}
                    className="w-full pl-10 pr-3.5 py-2 text-xs rounded-lg bg-neutral-50 border border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-campus-blue focus:border-campus-blue transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="member-password"
                    className="block text-xs font-semibold text-neutral-700 tracking-tight"
                  >
                    Password <span className="text-campus-red">*</span>
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-[11px] font-medium text-campus-blue hover:underline transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="member-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                    disabled={isLoading}
                    className="w-full pl-10 pr-12 py-2 text-xs rounded-lg bg-neutral-50 border border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-campus-blue focus:border-campus-blue transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-neutral-700 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit button */}
              <div className="pt-2">
                <BubbleButton
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isLoading}
                  disabled={isLoading || !fullName.trim() || !email.trim() || !password}
                  className="w-full"
                  icon={<ArrowRight className="w-4 h-4" />}
                  iconPosition="right"
                >
                  {isLoading ? 'Authenticating...' : 'Sign in to CampusSpace'}
                </BubbleButton>
              </div>

              {/* Create Account Link */}
              <div className="pt-2 text-center">
                <p className="text-xs text-neutral-600">
                  New member or applicant?{' '}
                  <Link
                    href="/signup"
                    className="font-bold text-campus-blue hover:underline transition-colors"
                  >
                    Create Account
                  </Link>
                </p>
              </div>
            </form>
          )}

          {/* ================================================================== */}
          {/* SECTION B: Unified Administrator Email Dual-OTP Login - Step 1 */}
          {/* ================================================================== */}
          {!isSuccessTransition && loginMode === 'admin' && adminStep === 'credentials' && (
            <form onSubmit={handleAdminInitiateSubmit} className="space-y-4" noValidate>
              <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 mb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-campus-blue flex-shrink-0" />
                  <span className="text-xs font-bold text-neutral-950">
                    Password-Free Administrator Login
                  </span>
                </div>
                <p className="text-[11px] text-neutral-600 mt-1 leading-snug">
                  Enter your name to initiate session verification. Two separate codes will be sent to the registered administrator mailbox: <strong className="text-neutral-900">campusspaceadmin@gmail.com</strong>.
                </p>
              </div>

              {/* Field: Name */}
              <div className="space-y-1.5">
                <label
                  htmlFor="admin-name"
                  className="block text-xs font-semibold text-neutral-700 tracking-tight"
                >
                  Administrator Name <span className="text-campus-red">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="admin-name"
                    type="text"
                    value={adminClaimedName}
                    onChange={(e) => setAdminClaimedName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                    autoComplete="name"
                    disabled={isLoading}
                    className="w-full pl-10 pr-3.5 py-2 text-xs rounded-lg bg-neutral-50 border border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-campus-blue focus:border-campus-blue transition-all"
                  />
                </div>
                <p className="text-[11px] text-neutral-500">
                  Self-reported administrator name for this session and the audit trail.
                </p>
              </div>

              {/* Send Verification Codes button */}
              <div className="pt-2">
                <BubbleButton
                  type="submit"
                  id="btn-admin-continue"
                  variant="primary"
                  size="md"
                  isLoading={isLoading}
                  disabled={isLoading || !adminClaimedName.trim()}
                  className="w-full"
                  icon={<Send className="w-4 h-4" />}
                  iconPosition="right"
                >
                  {isLoading ? 'Sending verification codes...' : 'Send verification codes'}
                </BubbleButton>
              </div>

              <div className="pt-2 text-center">
                <p className="text-[11px] text-neutral-500">
                  No password required. Dual-factor email verification authorizes access.
                </p>
              </div>
            </form>
          )}

          {/* ================================================================== */}
          {/* SECTION C: Step 2 - Dual Email OTP Verification */}
          {/* ================================================================== */}
          {!isSuccessTransition && loginMode === 'admin' && adminStep === 'verify' && (
            <form onSubmit={handleAdminVerifySubmit} className="space-y-4" noValidate>
              {/* Challenge Status Header */}
              <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-neutral-700 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-campus-blue" />
                    <span>Attempt for: <strong className="text-neutral-950">{adminClaimedName}</strong></span>
                  </span>
                  <button
                    type="button"
                    onClick={handleResetAdminStep}
                    className="text-[10px] font-bold text-campus-blue hover:underline flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Change Name / Start Over
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-neutral-200">
                  <span className="text-neutral-600 text-[11px] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-neutral-400" />
                    Challenge Expiry:
                  </span>
                  <span
                    className={`font-mono font-bold text-xs px-2 py-0.5 rounded-full ${
                      challengeExpiresIn === 0
                        ? 'bg-campus-red/10 text-campus-red border border-campus-red/20'
                        : 'bg-campus-purple/10 text-campus-purple border border-campus-purple/20'
                    }`}
                  >
                    {challengeExpiresIn === 0 ? 'EXPIRED' : formatSeconds(challengeExpiresIn)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-neutral-700 pt-1 border-t border-neutral-200">
                  <span className="flex items-center gap-1 text-neutral-500">
                    <Inbox className="w-3.5 h-3.5 text-neutral-400" />
                    Registered Destination:
                  </span>
                  <span className="font-mono font-bold text-neutral-900">
                    campusspaceadmin@gmail.com
                  </span>
                </div>
              </div>

              {/* Informative Note: Dual Codes */}
              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-700">
                <p className="leading-relaxed text-[11px]">
                  Two distinct emails have been dispatched to <strong className="text-neutral-900">campusspaceadmin@gmail.com</strong>:
                  <br />
                  1. <em>&ldquo;CampusSpace Admin Login — Code 1&rdquo;</em>
                  <br />
                  2. <em>&ldquo;CampusSpace Admin Login — Code 2&rdquo;</em>
                  <br />
                  <span className="text-neutral-600">Both codes are required for dual-factor verification.</span>
                </p>
              </div>

              {/* Notice if SMTP is unconfigured on server */}
              {!smtpConfigured && (
                <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-300 text-xs text-neutral-800 space-y-2">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-neutral-700 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold text-neutral-900 leading-tight">
                        SMTP Mail Server Not Configured
                      </p>
                      <p className="text-[11px] text-neutral-600 leading-relaxed">
                        Emails were not dispatched because SMTP credentials are not configured in <code>.env.local</code>.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowSetupGuide(!showSetupGuide)}
                    className="text-[11px] font-semibold text-campus-blue hover:underline flex items-center gap-1 pt-1"
                  >
                    {showSetupGuide ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {showSetupGuide ? 'Hide SMTP Instructions' : 'View SMTP Instructions'}
                  </button>

                  {showSetupGuide && (
                    <div className="pt-2 text-[10px] text-neutral-600 space-y-2 border-t border-neutral-200 font-sans">
                      <p className="font-semibold">To enable real Nodemailer email delivery via Gmail or custom SMTP:</p>
                      <div className="p-2 rounded-lg bg-neutral-100 border border-neutral-200 font-mono text-[10px] text-neutral-800 space-y-1">
                        <div>SMTP_HOST=smtp.gmail.com</div>
                        <div>SMTP_PORT=587</div>
                        <div>SMTP_USER=your_sender_email@gmail.com</div>
                        <div>SMTP_PASS=your_16_digit_gmail_app_password</div>
                        <div>SMTP_FROM=&quot;CampusSpace Security&quot; &lt;your_sender_email@gmail.com&gt;</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Code 1 Input Field */}
              <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="admin-code-1"
                    className="block text-xs font-semibold text-neutral-700"
                  >
                    Verification Code 1 <span className="text-campus-red">*</span>
                  </label>
                  <span className="text-[10px] font-mono font-semibold text-neutral-600 bg-white px-2 py-0.5 rounded border border-neutral-200">
                    Email #1
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {renderDeliveryBadge(deliveryStatus1, 'Code 1')}
                </div>

                {deliveryError1 && (
                  <p className="text-[11px] text-campus-red bg-campus-red/10 p-2 rounded-lg border border-campus-red/20 leading-snug">
                    {deliveryError1}
                  </p>
                )}

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="admin-code-1"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={code1}
                    onChange={(e) => setCode1(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit Code 1"
                    required
                    disabled={isLoading || challengeExpiresIn === 0}
                    className="w-full pl-10 pr-3.5 py-2 rounded-lg bg-white border border-neutral-300 text-sm font-mono tracking-widest text-neutral-900 placeholder-neutral-400 placeholder:tracking-normal focus:outline-none focus:ring-1 focus:ring-campus-blue focus:border-campus-blue transition-all"
                  />
                </div>
                <p className="text-[10px] text-neutral-500">
                  From email with subject: &ldquo;CampusSpace Admin Login — Code 1&rdquo;
                </p>
              </div>

              {/* Code 2 Input Field */}
              <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="admin-code-2"
                    className="block text-xs font-semibold text-neutral-700"
                  >
                    Verification Code 2 <span className="text-campus-red">*</span>
                  </label>
                  <span className="text-[10px] font-mono font-semibold text-neutral-600 bg-white px-2 py-0.5 rounded border border-neutral-200">
                    Email #2
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {renderDeliveryBadge(deliveryStatus2, 'Code 2')}
                </div>

                {deliveryError2 && (
                  <p className="text-[11px] text-campus-red bg-campus-red/10 p-2 rounded-lg border border-campus-red/20 leading-snug">
                    {deliveryError2}
                  </p>
                )}

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="admin-code-2"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={code2}
                    onChange={(e) => setCode2(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit Code 2"
                    required
                    disabled={isLoading || challengeExpiresIn === 0}
                    className="w-full pl-10 pr-3.5 py-2 rounded-lg bg-white border border-neutral-300 text-sm font-mono tracking-widest text-neutral-900 placeholder-neutral-400 placeholder:tracking-normal focus:outline-none focus:ring-1 focus:ring-campus-blue focus:border-campus-blue transition-all"
                  />
                </div>
                <p className="text-[10px] text-neutral-500">
                  From email with subject: &ldquo;CampusSpace Admin Login — Code 2&rdquo;
                </p>
              </div>

              {/* Resend Both Codes Action with Server-Enforced Cooldown */}
              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-between text-xs">
                <span className="text-neutral-500 text-[11px]">
                  {maxSends - sendCount} resend{maxSends - sendCount === 1 ? '' : 's'} remaining
                </span>
                <button
                  type="button"
                  id="btn-resend-both"
                  onClick={handleResendBothCodes}
                  disabled={
                    (deliveryStatus1 !== 'failed' && deliveryStatus1 !== 'unconfigured' && deliveryStatus2 !== 'failed' && deliveryStatus2 !== 'unconfigured' && cooldownSeconds > 0) ||
                    sendCount >= maxSends ||
                    isResending ||
                    challengeExpiresIn === 0
                  }
                  className={`font-semibold flex items-center gap-1.5 transition-colors ${
                    (deliveryStatus1 !== 'failed' && deliveryStatus1 !== 'unconfigured' && deliveryStatus2 !== 'failed' && deliveryStatus2 !== 'unconfigured' && cooldownSeconds > 0) ||
                    sendCount >= maxSends ||
                    isResending ||
                    challengeExpiresIn === 0
                      ? 'text-neutral-400 cursor-not-allowed'
                      : 'text-campus-blue hover:underline'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  {isResending
                    ? 'Dispatching fresh pair...'
                    : (deliveryStatus1 === 'failed' || deliveryStatus1 === 'unconfigured' || deliveryStatus2 === 'failed' || deliveryStatus2 === 'unconfigured')
                    ? 'Retry Sending Both Codes'
                    : cooldownSeconds > 0
                    ? `Resend Both Codes (${cooldownSeconds}s)`
                    : 'Resend Both Codes'}
                </button>
              </div>

              {/* Submit Verification Button */}
              <div className="pt-2">
                <BubbleButton
                  type="submit"
                  id="btn-admin-verify-submit"
                  variant="primary"
                  size="md"
                  isLoading={isLoading}
                  disabled={isLoading || challengeExpiresIn === 0 || !code1.trim() || !code2.trim()}
                  className="w-full"
                  icon={<ShieldCheck className="w-4 h-4" />}
                  iconPosition="right"
                >
                  {isLoading ? 'Verifying codes...' : 'Verify Both Codes & Sign In'}
                </BubbleButton>
              </div>

              <div className="pt-2 text-center">
                <p className="text-[11px] text-neutral-500">
                  Both Code 1 and Code 2 must be valid for this challenge to establish an authorized session.
                </p>
              </div>
            </form>
          )}

          {/* Bottom Security Footer */}
          <div className="flex items-center justify-center gap-2 pt-2 border-t border-neutral-200 text-[10px] text-neutral-500">
            <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
            <span>TLS Protected • Dual-OTP Authenticated • Strict Session Binding</span>
          </div>
        </div>
      </div>
    </div>
  );
}
