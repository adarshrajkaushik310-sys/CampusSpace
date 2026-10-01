'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCampusStore } from '@/lib/store';
import { BubbleButton } from '@/components/BubbleButton';
import { IdProofUpload } from '@/components/IdProofUpload';
import { INSTITUTIONAL_STREAMS, INSTITUTIONAL_SUBJECTS } from '@/lib/seed-data';
import {
  UserCheck,
  BookOpen,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';

export default function CompleteProfilePage() {
  const router = useRouter();
  const { sessionUser, completeProfile } = useCampusStore();

  const isHod = sessionUser?.role === 'hod' || sessionUser?.requestedRole === 'hod';
  const needsId = !sessionUser?.idProofFilename;
  const needsStream = isHod && !sessionUser?.stream;
  const needsSubject = isHod && !sessionUser?.subject;

  const [stream, setStream] = useState<string>(sessionUser?.stream || INSTITUTIONAL_STREAMS[0]);
  const [subject, setSubject] = useState<string>(sessionUser?.subject || '');
  const [idFile, setIdFile] = useState<File | null>(null);
  const [idFileError, setIdFileError] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (needsStream && !stream.trim()) {
      setErrorMessage('Please select or specify your department stream.');
      return;
    }
    if (needsSubject && !subject.trim()) {
      setErrorMessage('Please specify your primary subject.');
      return;
    }
    if (needsId && !idFile) {
      setErrorMessage('Please upload your institutional staff ID proof document.');
      return;
    }
    if (idFileError) {
      setErrorMessage(idFileError);
      return;
    }

    setIsLoading(true);

    try {
      let filename = idFile?.name;
      if (idFile) {
        const formData = new FormData();
        formData.append('file', idFile);
        formData.append('userId', sessionUser?.id || `user_${Date.now()}`);

        const uploadRes = await fetch('/api/auth/upload-id', {
          method: 'POST',
          body: formData,
        });

        const uploadData = await uploadRes.json();
        if (uploadRes.ok) {
          filename = uploadData.filename;
        }
      }

      const res = await completeProfile({
        stream: isHod ? stream : undefined,
        subject: isHod ? subject : undefined,
        idProofFile: idFile,
        idProofFilename: filename,
      });

      if (res.success) {
        setSuccessMessage('Profile completed successfully! Preserving existing bookings & records.');
        setTimeout(() => {
          router.push('/');
        }, 800);
      } else {
        setErrorMessage(res.error || 'Failed to complete profile.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while updating profile.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center py-8 px-4 sm:px-6">
      <div className="max-w-xl w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-3xl bg-gradient-to-tr from-violet-600 via-violet-700 to-indigo-600 text-white shadow-lg shadow-violet-500/25 mb-1 animate-in zoom-in-95">
            <UserCheck className="w-7 h-7 text-violet-200" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Complete Profile Information
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Your account is active. Please provide required institutional accreditation fields.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-7 sm:p-8 border border-slate-200/90 shadow-elevation">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {errorMessage && (
              <div className="flex items-start gap-2 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {isHod && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    Stream / Department <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={stream}
                    onChange={(e) => setStream(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900"
                  >
                    {INSTITUTIONAL_STREAMS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    Subject Specialization <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Distributed Systems & Cloud Architecture"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900"
                  />
                </div>
              </div>
            )}

            {needsId && (
              <IdProofUpload
                onFileSelect={(file, err) => {
                  setIdFile(file);
                  setIdFileError(err);
                }}
                isRequired={true}
                disabled={isLoading}
              />
            )}

            <div className="pt-2">
              <BubbleButton
                type="submit"
                variant="primary"
                size="md"
                isLoading={isLoading}
                disabled={isLoading}
                className="w-full"
                icon={<ArrowRight className="w-4 h-4" />}
                iconPosition="right"
              >
                Save & Continue to Dashboard
              </BubbleButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
