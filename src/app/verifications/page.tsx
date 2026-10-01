'use client';

import React, { useState } from 'react';
import { useCampusStore } from '@/lib/store';
import { BubbleButton } from '@/components/BubbleButton';
import { StaffApplicant } from '@/lib/types';
import {
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  FileText,
  ExternalLink,
  Check,
  X,
  Search,
  Building,
  BookOpen,
  Lock,
  Clock,
} from 'lucide-react';

export default function VerificationsPage() {
  const {
    currentRole,
    currentUser,
    applicants,
    approveApplicant,
    rejectApplicant,
    switchRole,
  } = useCampusStore();

  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [rejectingApp, setRejectingApp] = useState<StaffApplicant | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [viewingDoc, setViewingDoc] = useState<{
    applicantName: string;
    filename: string;
    url: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const isRegistrar = currentRole === 'registrar';

  const pendingList = applicants.filter((a) => a.verificationStatus === 'pending');
  const approvedList = applicants.filter((a) => a.verificationStatus === 'approved');
  const rejectedList = applicants.filter((a) => a.verificationStatus === 'rejected');

  const currentList =
    activeTab === 'pending'
      ? pendingList
      : activeTab === 'approved'
      ? approvedList
      : rejectedList;

  const filteredList = currentList.filter(
    (a) =>
      a.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.requestedRole.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.stream && a.stream.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleApprove = (app: StaffApplicant) => {
    const res = approveApplicant(app.id);
    if (res.success) {
      setSuccessToast(`Application for ${app.fullName} approved.`);
      setTimeout(() => setSuccessToast(null), 4000);
    } else {
      alert(res.error || 'Failed to approve application.');
    }
  };

  const handleConfirmReject = () => {
    if (!rejectingApp) return;
    if (!rejectionReason.trim()) {
      alert('Please provide a specific rejection reason for the applicant.');
      return;
    }

    const res = rejectApplicant(rejectingApp.id, rejectionReason.trim());
    if (res.success) {
      setSuccessToast(`Application for ${rejectingApp.fullName} rejected.`);
      setTimeout(() => setSuccessToast(null), 4000);
      setRejectingApp(null);
      setRejectionReason('');
    } else {
      alert(res.error || 'Failed to reject applicant.');
    }
  };

  const handleViewDocument = async (app: StaffApplicant) => {
    try {
      const res = await fetch(
        `/api/auth/document-url?path=${encodeURIComponent(
          app.idProofUrl || app.idProofFilename || 'document.pdf'
        )}&role=${currentRole}`
      );
      const data = await res.json();
      if (data.signedUrl) {
        setViewingDoc({
          applicantName: app.fullName,
          filename: app.idProofFilename || 'Institutional_ID_Document.pdf',
          url: data.signedUrl,
        });
      }
    } catch {
      alert('Could not generate secure temporary document view.');
    }
  };

  // If not Registrar, show access restriction
  if (!isRegistrar) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center py-10 px-4 animate-page-enter">
        <div className="bg-white rounded-2xl p-8 sm:p-10 border border-neutral-200 shadow-sm max-w-lg w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-campus-red/10 text-campus-red flex items-center justify-center mx-auto border border-campus-red/20">
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-neutral-950 tracking-tight">
              Reviewer Access Restricted
            </h1>
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
              Staff credential review is restricted to the{' '}
              <strong className="text-neutral-950">Campus Registrar</strong>. Currently signed in as:{' '}
              <strong className="text-campus-purple">{currentUser.name}</strong> ({currentUser.title}).
            </p>
          </div>

          <div className="pt-2">
            <BubbleButton
              variant="primary"
              size="md"
              onClick={() => switchRole('registrar')}
              icon={<ShieldCheck className="w-4 h-4" />}
            >
              Switch to Registrar Role
            </BubbleButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-page-enter">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-neutral-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-950 tracking-tight">
            Institutional credential review
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 mt-1">
            Review submitted staff ID cards and appointment documents.
          </p>
        </div>

        {/* Current Reviewer Card */}
        <div className="flex items-center gap-3 bg-neutral-50 p-3 rounded-xl border border-neutral-200 shadow-sm">
          <span className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-bold text-neutral-800">
            {currentUser.name.charAt(0)}
          </span>
          <div>
            <p className="text-xs font-bold text-neutral-950 leading-tight">
              {currentUser.name}
            </p>
            <p className="text-[11px] text-campus-purple font-medium">
              Campus Registrar
            </p>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {successToast && (
        <div className="p-3.5 rounded-xl bg-campus-blue/10 border border-campus-blue/20 text-xs text-campus-blue flex items-center gap-2 animate-dropdown-enter">
          <CheckCircle2 className="w-4 h-4 text-campus-blue flex-shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Queue Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => setActiveTab('pending')}
          className={`p-4 rounded-xl text-left border transition-all ${
            activeTab === 'pending'
              ? 'bg-neutral-50 border-campus-purple shadow-sm ring-1 ring-campus-purple'
              : 'bg-white border-neutral-200 hover:border-neutral-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-950">Pending Review</span>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-campus-purple text-white">
              {pendingList.length}
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">Awaiting ID proof verification</p>
        </button>

        <button
          onClick={() => setActiveTab('approved')}
          className={`p-4 rounded-xl text-left border transition-all ${
            activeTab === 'approved'
              ? 'bg-neutral-50 border-campus-blue shadow-sm ring-1 ring-campus-blue'
              : 'bg-white border-neutral-200 hover:border-neutral-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-950">Approved Staff</span>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-campus-blue text-white">
              {approvedList.length}
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">Active verified accounts</p>
        </button>

        <button
          onClick={() => setActiveTab('rejected')}
          className={`p-4 rounded-xl text-left border transition-all ${
            activeTab === 'rejected'
              ? 'bg-neutral-50 border-campus-red shadow-sm ring-1 ring-campus-red'
              : 'bg-white border-neutral-200 hover:border-neutral-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-950">Rejected</span>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-campus-red text-white">
              {rejectedList.length}
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">Awaiting resubmission with reason</p>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-neutral-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, stream, or requested role..."
            className="w-full pl-9 pr-3.5 py-1.5 rounded-lg bg-neutral-50 border border-neutral-300 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-campus-blue transition-all"
          />
        </div>

        <span className="text-xs text-neutral-500 font-medium">
          Showing {filteredList.length} {activeTab} {filteredList.length === 1 ? 'record' : 'records'}
        </span>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {filteredList.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center border border-neutral-200 shadow-sm space-y-2">
            <UserCheck className="w-10 h-10 text-neutral-300 mx-auto" />
            <h3 className="font-bold text-sm text-neutral-950">
              No {activeTab} applications found
            </h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              There are currently no staff applications in the {activeTab} queue.
            </p>
          </div>
        ) : (
          filteredList.map((app) => {
            const isHod = app.requestedRole === 'hod';
            const isPrincipal = app.requestedRole === 'principal';
            const isReg = app.requestedRole === 'registrar';

            return (
              <div
                key={app.id}
                className="bg-white rounded-xl p-5 sm:p-6 border border-neutral-200 shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-bold text-neutral-950">{app.fullName}</h2>
                      <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200">
                        {isHod
                          ? 'HOD APPLICANT'
                          : isPrincipal
                          ? 'PRINCIPAL APPLICANT'
                          : isReg
                          ? 'REGISTRAR APPLICANT'
                          : app.requestedRole.toUpperCase()}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${
                          app.verificationStatus === 'pending'
                            ? 'bg-campus-purple/10 text-campus-purple border-campus-purple/20'
                            : app.verificationStatus === 'approved'
                            ? 'bg-campus-blue/10 text-campus-blue border-campus-blue/20'
                            : 'bg-campus-red/10 text-campus-red border-campus-red/20'
                        }`}
                      >
                        {app.verificationStatus === 'pending' && <Clock className="w-2.5 h-2.5" />}
                        {app.verificationStatus === 'approved' && <Check className="w-2.5 h-2.5" />}
                        {app.verificationStatus === 'rejected' && <X className="w-2.5 h-2.5" />}
                        {app.verificationStatus.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-xs text-neutral-500 flex items-center gap-2">
                      <span>{app.email}</span>
                      <span>&bull;</span>
                      <span>Submitted: {new Date(app.createdAt).toLocaleDateString('en-IN')}</span>
                    </p>
                  </div>

                  {/* Document View Button */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewDocument(app)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-50 hover:bg-neutral-100 text-campus-blue text-xs font-semibold border border-neutral-200 transition-all focus:outline-none focus:ring-1 focus:ring-campus-blue"
                    >
                      <FileText className="w-3.5 h-3.5 text-campus-blue" />
                      <span>View Uploaded ID</span>
                      <ExternalLink className="w-3 h-3 text-neutral-400" />
                    </button>
                  </div>
                </div>

                {/* HOD Specific Stream and Subject */}
                {isHod && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-neutral-50 rounded-xl text-xs text-neutral-700 border border-neutral-200">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                      <span>
                        <strong className="text-neutral-950">Stream / Department:</strong> {app.stream || app.department || 'Computer Science & Engineering'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                      <span>
                        <strong className="text-neutral-950">Discipline / Subject:</strong> {app.subject || 'Advanced Computing'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Rejection Reason display if rejected */}
                {app.verificationStatus === 'rejected' && app.rejectionReason && (
                  <div className="p-3 bg-campus-red/10 rounded-xl text-xs text-campus-red border border-campus-red/20">
                    <strong className="text-campus-red">Rejection Reason Provided:</strong> {app.rejectionReason}
                  </div>
                )}

                {/* Reviewer Action Buttons */}
                {activeTab === 'pending' && (
                  <div className="pt-2 flex flex-wrap items-center justify-end gap-3 border-t border-neutral-200">
                    <BubbleButton
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        setRejectingApp(app);
                        setRejectionReason('');
                      }}
                      icon={<X className="w-3.5 h-3.5" />}
                    >
                      Reject Application
                    </BubbleButton>

                    <BubbleButton
                      variant="primary"
                      size="sm"
                      onClick={() => handleApprove(app)}
                      icon={<Check className="w-3.5 h-3.5" />}
                    >
                      Approve & Grant {isPrincipal ? 'Principal' : isReg ? 'Registrar' : 'HOD'} Role
                    </BubbleButton>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Reject Modal */}
      {rejectingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl p-6 sm:p-7 max-w-md w-full border border-neutral-200 shadow-xl space-y-4 animate-dialog-enter">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-neutral-950">
                Reject Application: {rejectingApp.fullName}
              </h2>
              <button
                onClick={() => setRejectingApp(null)}
                className="p-1 rounded-full text-neutral-400 hover:text-neutral-950"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-600">
              Provide a specific reason for why this credential or appointment document was rejected.
              The applicant will be prompted to resubmit.
            </p>

            <textarea
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Scanned staff ID is illegible or missing official seal. Please upload a clear color scan of your appointment notification."
              className="w-full p-2.5 rounded-lg bg-neutral-50 border border-neutral-300 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-campus-blue transition-all"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <BubbleButton
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setRejectingApp(null)}
              >
                Cancel
              </BubbleButton>
              <BubbleButton
                variant="danger"
                size="sm"
                onClick={handleConfirmReject}
                disabled={!rejectionReason.trim()}
              >
                Confirm Rejection
              </BubbleButton>
            </div>
          </div>
        </div>
      )}

      {/* Temporary Document Viewer Modal */}
      {viewingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl p-6 sm:p-7 max-w-lg w-full border border-neutral-200 shadow-xl space-y-4 animate-dialog-enter">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-neutral-950">
                  Document Preview: {viewingDoc.applicantName}
                </h2>
                <p className="text-xs text-neutral-500 font-mono truncate">{viewingDoc.filename}</p>
              </div>
              <button
                onClick={() => setViewingDoc(null)}
                className="p-1 rounded-full text-neutral-400 hover:text-neutral-950"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 rounded-xl bg-neutral-50 border border-dashed border-neutral-300 text-center space-y-3">
              <FileText className="w-10 h-10 text-campus-blue mx-auto" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-neutral-950">
                  Authorized Reviewer Document Stream
                </p>
                <p className="text-[11px] text-neutral-500">
                  Protected in private bucket. Temporary authorized link active for 300 seconds.
                </p>
              </div>
              <div className="inline-block text-[11px] font-mono text-campus-blue bg-campus-blue/10 px-3 py-1 rounded-full border border-campus-blue/20">
                Encrypted Access Token Active
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <BubbleButton variant="secondary" size="sm" onClick={() => setViewingDoc(null)}>
                Close Preview
              </BubbleButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
