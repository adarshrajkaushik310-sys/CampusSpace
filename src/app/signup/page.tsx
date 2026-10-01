'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCampusStore } from '@/lib/store';
import { BubbleButton } from '@/components/BubbleButton';
import { IdProofUpload } from '@/components/IdProofUpload';
import { Role } from '@/lib/types';
import { INSTITUTIONAL_STREAMS, INSTITUTIONAL_SUBJECTS } from '@/lib/seed-data';
import {
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useCampusStore();

  const [role, setRole] = useState<Role>('requester');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // HOD specific fields
  const [selectedStream, setSelectedStream] = useState<string>(INSTITUTIONAL_STREAMS[0]);
  const [customStream, setCustomStream] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [customSubject, setCustomSubject] = useState<string>('');

  // ID proof upload
  const [idFile, setIdFile] = useState<File | null>(null);
  const [idFileError, setIdFileError] = useState<string | undefined>(undefined);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isPrivilegedRole = role === 'principal' || role === 'hod' || role === 'registrar';

  const handleRoleChange = (newRole: Role) => {
    setRole(newRole);
    setErrorMessage(null);
    if (newRole === 'hod' && !selectedSubject) {
      const defaultSubjects = INSTITUTIONAL_SUBJECTS[selectedStream] || [];
      if (defaultSubjects.length > 0) {
        setSelectedSubject(defaultSubjects[0]);
      }
    }
  };

  const handleStreamChange = (stream: string) => {
    setSelectedStream(stream);
    if (stream !== 'OTHER') {
      const availableSubjects = INSTITUTIONAL_SUBJECTS[stream] || [];
      if (availableSubjects.length > 0) {
        setSelectedSubject(availableSubjects[0]);
      } else {
        setSelectedSubject('OTHER');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Common validations
    if (!fullName.trim()) {
      setErrorMessage('Full name is required.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid institutional email address.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    // Role-specific validations
    const finalStream = selectedStream === 'OTHER' ? customStream.trim() : selectedStream;
    const finalSubject = selectedSubject === 'OTHER' ? customSubject.trim() : selectedSubject;

    if (role === 'principal' || role === 'registrar') {
      if (!idFile) {
        setErrorMessage(
          `Official ID proof or appointment document is mandatory for ${
            role === 'principal' ? 'Principal' : 'Registrar'
          } account registration.`
        );
        return;
      }
    }

    if (role === 'hod') {
      if (!finalStream) {
        setErrorMessage('Stream / Department is strictly required for HOD account registration.');
        return;
      }
      if (!finalSubject) {
        setErrorMessage('Subject specialization is strictly required for HOD account registration.');
        return;
      }
      if (!idFile) {
        setErrorMessage('Official ID proof or appointment document is mandatory for HOD registration.');
        return;
      }
    }

    if (idFileError) {
      setErrorMessage(idFileError);
      return;
    }

    setIsLoading(true);

    try {
      // If a document was selected, upload via backend API with strict validation
      let uploadedFilePath: string | undefined = undefined;
      let uploadedFilename: string | undefined = undefined;

      if (idFile) {
        const formData = new FormData();
        formData.append('file', idFile);
        formData.append('userId', `temp_${Date.now()}`);

        const uploadRes = await fetch('/api/auth/upload-id', {
          method: 'POST',
          body: formData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(uploadData.error || 'Document validation failed on the server.');
        }

        uploadedFilePath = uploadData.filePath;
        uploadedFilename = uploadData.filename;
      }

      const res = await signup({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        role,
        stream: role === 'hod' ? finalStream : undefined,
        subject: role === 'hod' ? finalSubject : undefined,
        idProofFile: idFile,
        idProofFilename: uploadedFilename || idFile?.name,
      });

      if (res.success) {
        if (res.verificationPending) {
          setSuccessMessage(
            'Account created successfully. Principal, HOD, and Registrar registrations require administrative verification before privileged access is granted. Directing to verification status...'
          );
          setTimeout(() => {
            router.push('/auth/pending-verification');
          }, 1000);
        } else {
          setSuccessMessage('Account created and verified. Redirecting to campus dashboard...');
          setTimeout(() => {
            router.push('/');
          }, 800);
        }
      } else {
        setErrorMessage(res.error || 'Registration failed. Please check your details and try again.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during account creation.');
    } finally {
      setIsLoading(false);
    }
  };

  const availableSubjects = INSTITUTIONAL_SUBJECTS[selectedStream] || [];

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center py-6 px-4 sm:px-6 animate-page-enter">
      <div className="max-w-2xl w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-950 tracking-tight">
            Create institutional account
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600">
            Select your role and provide account details.
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-neutral-200 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Feedback Banners */}
            {errorMessage && (
              <div className="flex items-start gap-2 p-3.5 rounded-xl bg-campus-red/10 border border-campus-red/20 text-xs text-campus-red animate-dropdown-enter">
                <AlertCircle className="w-4 h-4 text-campus-red flex-shrink-0 mt-0.5" />
                <span className="leading-snug">{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="flex items-center gap-2 p-3.5 rounded-xl bg-campus-blue/10 border border-campus-blue/20 text-xs text-campus-blue animate-dropdown-enter">
                <CheckCircle2 className="w-4 h-4 text-campus-blue flex-shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* 1. Clear Role Selector with Bubble Style Buttons */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-neutral-700 tracking-tight">
                Select Your Campus Role <span className="text-campus-red">*</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { roleId: 'requester' as Role, label: 'Club Requester' },
                  { roleId: 'hod' as Role, label: 'HOD' },
                  { roleId: 'principal' as Role, label: 'Principal' },
                  { roleId: 'registrar' as Role, label: 'Registrar' },
                ].map((item) => {
                  const isSelected = role === item.roleId;
                  return (
                    <button
                      key={item.roleId}
                      type="button"
                      onClick={() => handleRoleChange(item.roleId)}
                      className={`flex items-center justify-center p-2.5 rounded-full text-xs transition-all outline-none focus-visible:ring-2 focus-visible:ring-campus-blue ${
                        isSelected
                          ? 'bg-campus-purple text-white shadow-sm font-semibold'
                          : 'bg-neutral-50 text-neutral-700 hover:bg-neutral-100 border border-neutral-200 font-medium'
                      }`}
                    >
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Role Required Fields Helper Tag */}
              <div className="text-[11px] bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 flex items-center justify-between text-neutral-600">
                <span>
                  Required fields for <strong className="text-neutral-900">{role === 'hod' ? 'HOD' : role.toUpperCase()}</strong>:
                </span>
                <span className="font-semibold text-neutral-900">
                  {role === 'hod' && 'Full name, email, password, ID proof, stream, subject'}
                  {role === 'principal' && 'Full name, email, password, ID proof'}
                  {role === 'registrar' && 'Full name, email, password, ID proof'}
                  {!isPrivilegedRole && 'Full name, email, password'}
                </span>
              </div>
            </div>

            {/* 2. Common Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label
                  htmlFor="signup-fullName"
                  className="block text-xs font-semibold text-neutral-700 tracking-tight"
                >
                  Full Name <span className="text-campus-red">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="signup-fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Dr. Rajesh Kulkarni"
                    required
                    disabled={isLoading}
                    className="w-full pl-10 pr-3.5 py-2 text-xs rounded-lg bg-neutral-50 border border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-campus-blue focus:border-campus-blue transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label
                  htmlFor="signup-email"
                  className="block text-xs font-semibold text-neutral-700 tracking-tight"
                >
                  Institutional Email <span className="text-campus-red">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="username@campus.edu"
                    required
                    disabled={isLoading}
                    className="w-full pl-10 pr-3.5 py-2 text-xs rounded-lg bg-neutral-50 border border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-campus-blue focus:border-campus-blue transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="signup-password"
                className="block text-xs font-semibold text-neutral-700 tracking-tight"
              >
                Password <span className="text-campus-red">* (minimum 6 characters)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  required
                  disabled={isLoading}
                  className="w-full pl-10 pr-10 py-2 text-xs rounded-lg bg-neutral-50 border border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-campus-blue focus:border-campus-blue transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-700 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 3. Role-specific HOD fields: Stream & Subject */}
            {role === 'hod' && (
              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-4 animate-in fade-in">
                <div className="flex items-center gap-2 text-neutral-900 text-xs font-bold">
                  <BookOpen className="w-4 h-4 text-campus-purple" />
                  <span>HOD Department Specialization Details</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Stream / Department */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="hod-stream"
                      className="block text-xs font-semibold text-neutral-700 tracking-tight"
                    >
                      Stream / Department <span className="text-campus-red">*</span>
                    </label>
                    <select
                      id="hod-stream"
                      value={selectedStream}
                      onChange={(e) => handleStreamChange(e.target.value)}
                      disabled={isLoading}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-campus-blue transition-all"
                    >
                      {INSTITUTIONAL_STREAMS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                      <option value="OTHER">Other (Enter Custom Department)</option>
                    </select>

                    {selectedStream === 'OTHER' && (
                      <input
                        type="text"
                        value={customStream}
                        onChange={(e) => setCustomStream(e.target.value)}
                        placeholder="Enter official department name"
                        required
                        disabled={isLoading}
                        className="w-full mt-2 px-3 py-1.5 rounded-lg bg-white border border-neutral-300 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-campus-blue"
                      />
                    )}
                  </div>

                  {/* Subject */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="hod-subject"
                      className="block text-xs font-semibold text-neutral-700 tracking-tight"
                    >
                      Primary Subject Discipline <span className="text-campus-red">*</span>
                    </label>
                    {availableSubjects.length > 0 && selectedStream !== 'OTHER' ? (
                      <select
                        id="hod-subject"
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        disabled={isLoading}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-campus-blue transition-all"
                      >
                        {availableSubjects.map((sub) => (
                          <option key={sub} value={sub}>
                            {sub}
                          </option>
                        ))}
                        <option value="OTHER">Other (Enter Custom Subject)</option>
                      </select>
                    ) : null}

                    {(selectedSubject === 'OTHER' || availableSubjects.length === 0 || selectedStream === 'OTHER') && (
                      <input
                        type="text"
                        value={customSubject}
                        onChange={(e) => setCustomSubject(e.target.value)}
                        placeholder="Enter course or research discipline"
                        required
                        disabled={isLoading}
                        className="w-full mt-2 px-3 py-1.5 rounded-lg bg-white border border-neutral-300 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-campus-blue"
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 4. ID Proof Upload Control for Principal, HOD, and Registrar */}
            {isPrivilegedRole && (
              <div className="animate-in fade-in">
                <IdProofUpload
                  onFileSelect={(file, err) => {
                    setIdFile(file);
                    setIdFileError(err);
                  }}
                  isRequired={true}
                  disabled={isLoading}
                  label={`${
                    role === 'principal' ? 'Principal' : role === 'registrar' ? 'Registrar' : 'HOD'
                  } Official ID Proof / Appointment Document`}
                  description="Upload scanned institutional staff ID, gazette appointment, or official order letter (PDF, JPG, PNG up to 5 MB)."
                />
              </div>
            )}

            {/* Note on Verification Queue */}
            {isPrivilegedRole && (
              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-700 text-xs flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-campus-blue flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-neutral-950">Account verification:</strong> Principal, HOD, and Registrar
                  accounts require administrative credential review.
                  Upon registration, your account status will show{' '}
                  <strong className="text-campus-purple">Account verification pending</strong> until verified.
                </span>
              </div>
            )}

            {/* Submit Button */}
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
                {isLoading
                  ? 'Submitting...'
                  : isPrivilegedRole
                  ? 'Submit for verification'
                  : 'Create account'}
              </BubbleButton>
            </div>
          </form>

          {/* Back to Login Link */}
          <div className="mt-6 pt-5 border-t border-neutral-200 text-center">
            <p className="text-xs text-neutral-600">
              Already have an institutional account?{' '}
              <Link
                href="/login"
                className="font-bold text-campus-blue hover:underline transition-colors focus:outline-none"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
