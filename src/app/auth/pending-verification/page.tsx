'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCampusStore } from '@/lib/store';
import { BubbleButton } from '@/components/BubbleButton';
import { IdProofUpload } from '@/components/IdProofUpload';
import {
  Clock,
  ShieldAlert,
  ShieldCheck,
  FileText,
  User,
  Mail,
  Building,
  BookOpen,
  ArrowRight,
  LogOut,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export default function PendingVerificationPage() {
  const router = useRouter();
  const { sessionUser, logout, switchRole, resubmitVerification } = useCampusStore();

  const [resubmitFile, setResubmitFile] = useState<File | null>(null);
  const [resubmitFileError, setResubmitFileError] = useState<string | undefined>(undefined);
  const [stream, setStream] = useState<string>(sessionUser?.stream || '');
  const [subject, setSubject] = useState<string>(sessionUser?.subject || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const status = sessionUser?.verificationStatus || 'pending';
  const isRejected = status === 'rejected';
  const isApproved = status === 'approved';
  const requestedRoleLabel = sessionUser?.requestedRole
    ? sessionUser.requestedRole === 'hod'
      ? 'Head of Department (HOD)'
      : sessionUser.requestedRole === 'principal'
      ? 'Principal'
      : sessionUser.requestedRole === 'registrar'
      ? 'Registrar'
      : sessionUser.requestedRole.replace('_', ' ').toUpperCase()
    : 'Privileged Staff';

  const handleResubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    if (!resubmitFile) {
      setActionError('Please upload an updated staff ID or appointment document.');
      return;
    }
    if (resubmitFileError) {
      setActionError(resubmitFileError);
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('file', resubmitFile);
      formData.append('userId', sessionUser?.id || `user_${Date.now()}`);

      const uploadRes = await fetch('/api/auth/upload-id', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(uploadData.error || 'Document validation failed on the server.');
      }

      const res = await resubmitVerification({
        idProofFile: resubmitFile,
        idProofFilename: uploadData.filename,
        stream: sessionUser?.requestedRole === 'hod' ? stream : undefined,
        subject: sessionUser?.requestedRole === 'hod' ? subject : undefined,
      });

      if (res.success) {
        setActionSuccess('Resubmission accepted. Your updated credentials are now pending review.');
        setResubmitFile(null);
      } else {
        setActionError(res.error || 'Failed to submit updated document.');
      }
    } catch (err: any) {
      setActionError(err.message || 'An error occurred while resubmitting.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleSwitchToRegistrarReview = () => {
    switchRole('registrar');
    router.push('/verifications');
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center py-8 px-4 sm:px-6 animate-page-enter">
      <div className="max-w-xl w-full space-y-6">
        {/* Main Status Card */}
        <div className="bg-white rounded-2xl p-7 sm:p-9 border border-neutral-200 shadow-sm text-center space-y-6">
          {/* Header Icon */}
          <div className="mx-auto">
            {isApproved ? (
              <div className="w-14 h-14 rounded-full bg-campus-blue/10 text-campus-blue border border-campus-blue/20 flex items-center justify-center mx-auto shadow-sm animate-dialog-enter">
                <ShieldCheck className="w-7 h-7" />
              </div>
            ) : isRejected ? (
              <div className="w-14 h-14 rounded-full bg-campus-red/10 text-campus-red border border-campus-red/20 flex items-center justify-center mx-auto shadow-sm animate-dialog-enter">
                <ShieldAlert className="w-7 h-7" />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-full bg-campus-purple/10 text-campus-purple border border-campus-purple/20 flex items-center justify-center mx-auto shadow-sm animate-dialog-enter">
                <Clock className="w-7 h-7" />
              </div>
            )}
          </div>

          {/* Heading */}
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-950 tracking-tight">
              {isApproved
                ? 'Account Verified'
                : isRejected
                ? 'Verification Request Rejected'
                : 'Account Verification Pending'}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-600 max-w-md mx-auto">
              {isApproved
                ? 'Your institutional accreditation has been approved. You now hold full authorized access.'
                : isRejected
                ? 'The administrative reviewer requested updated documentation before granting access.'
                : `Your registration for the ${requestedRoleLabel} role has been logged and is awaiting review by the Registrar's Office.`}
            </p>
          </div>

          {/* Rejection Details & Resubmission Form */}
          {isRejected && (
            <div className="text-left space-y-4 pt-2">
              <div className="p-3.5 rounded-xl bg-campus-red/10 border border-campus-red/20 text-xs text-campus-red space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-campus-red">
                  <AlertCircle className="w-4 h-4 text-campus-red flex-shrink-0" />
                  <span>Reason for Rejection:</span>
                </div>
                <p className="text-xs text-neutral-800 pl-5 leading-relaxed">
                  {sessionUser?.rejectionReason ||
                    'ID proof document was blurred or could not be verified against institutional staff records.'}
                </p>
              </div>

              {actionSuccess && (
                <div className="flex items-center gap-2 p-3.5 rounded-xl bg-campus-blue/10 border border-campus-blue/20 text-xs text-campus-blue animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-campus-blue flex-shrink-0" />
                  <span>{actionSuccess}</span>
                </div>
              )}

              {actionError && (
                <div className="flex items-center gap-2 p-3.5 rounded-xl bg-campus-red/10 border border-campus-red/20 text-xs text-campus-red animate-fade-in">
                  <AlertCircle className="w-4 h-4 text-campus-red flex-shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              {/* Resubmission Upload Control */}
              <form onSubmit={handleResubmit} className="space-y-4 pt-1">
                <IdProofUpload
                  onFileSelect={(file, err) => {
                    setResubmitFile(file);
                    setResubmitFileError(err);
                  }}
                  isRequired={true}
                  disabled={isSubmitting}
                  label="Upload Replacement Institutional Document"
                  description="Upload a clear scan of your staff ID or formal appointment letter (PDF, JPG, PNG up to 5 MB)."
                />

                {sessionUser?.requestedRole === 'hod' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">
                        Stream / Department
                      </label>
                      <input
                        type="text"
                        value={stream}
                        onChange={(e) => setStream(e.target.value)}
                        placeholder="Department Name"
                        className="w-full px-3 py-1.5 rounded-lg bg-neutral-50 border border-neutral-300 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-campus-blue"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">
                        Subject
                      </label>
                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Subject Specialization"
                        className="w-full px-3 py-1.5 rounded-lg bg-neutral-50 border border-neutral-300 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-campus-blue"
                      />
                    </div>
                  </div>
                )}

                <BubbleButton
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isSubmitting}
                  disabled={isSubmitting || !resubmitFile}
                  className="w-full"
                  icon={<RefreshCw className="w-4 h-4" />}
                >
                  Resubmit for Review
                </BubbleButton>
              </form>
            </div>
          )}

          {/* Application Details Summary */}
          {!isRejected && (
            <div className="bg-neutral-50 rounded-xl p-4 text-left border border-neutral-200 space-y-3">
              <h2 className="text-xs font-bold text-neutral-950 tracking-tight flex items-center justify-between">
                <span>Application Summary</span>
                <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded-full bg-campus-purple/10 text-campus-purple border border-campus-purple/20">
                  {status.toUpperCase()}
                </span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="flex items-center gap-2 text-neutral-600">
                  <User className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="truncate">
                    <strong className="text-neutral-900">Applicant:</strong> {sessionUser?.name || 'Applicant'}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-neutral-600">
                  <Mail className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="truncate">
                    <strong className="text-neutral-900">Email:</strong> {sessionUser?.email || 'N/A'}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-neutral-600">
                  <Building className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="truncate">
                    <strong className="text-neutral-900">Target Role:</strong> {requestedRoleLabel}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-neutral-600">
                  <FileText className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="truncate">
                    <strong className="text-neutral-900">Document:</strong>{' '}
                    {sessionUser?.idProofFilename || 'Official_Document.pdf'}
                  </span>
                </div>

                {sessionUser?.stream && (
                  <div className="flex items-center gap-2 text-neutral-600 col-span-2">
                    <BookOpen className="w-3.5 h-3.5 text-neutral-400" />
                    <span>
                      <strong className="text-neutral-900">Department:</strong> {sessionUser.stream} —{' '}
                      {sessionUser.subject}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Institutional Security Notice */}
          {!isRejected && (
            <div className="text-[11px] text-neutral-600 leading-relaxed text-left bg-neutral-50 p-3.5 rounded-xl border border-neutral-200">
              <p>
                <strong className="text-neutral-900">Security Policy:</strong> Privileged institutional roles (Principal, HOD,
                and Registrar) are strictly guarded against self-approval. While your review is
                underway, privileged governance and facility approvals remain restricted.
              </p>
            </div>
          )}

          {/* Bottom Actions */}
          <div className="pt-2 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-xs text-neutral-600 hover:text-neutral-950 transition-colors focus:outline-none"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>

            {isApproved ? (
              <BubbleButton href="/" variant="primary" size="sm" icon={<ArrowRight className="w-3.5 h-3.5" />}>
                Proceed to Dashboard
              </BubbleButton>
            ) : (
              <button
                type="button"
                onClick={handleSwitchToRegistrarReview}
                className="text-[11px] font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 px-3.5 py-1.5 rounded-full border border-neutral-200 transition-colors"
                title="Switch persona to Registrar to test the reviewer verification screen"
              >
                Reviewer Screen (Switch to Registrar)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
