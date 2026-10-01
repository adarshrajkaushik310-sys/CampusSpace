'use client';

import React, { useState } from 'react';
import { BubbleButton } from './BubbleButton';
import { AlertTriangle, X } from 'lucide-react';

interface RejectModalProps {
  isOpen: boolean;
  bookingRef: string;
  eventName: string;
  onClose: () => void;
  onConfirmReject: (reason: string) => void;
}

export function RejectModal({
  isOpen,
  bookingRef,
  eventName,
  onClose,
  onConfirmReject,
}: RejectModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('A comprehensive justification is required before rejecting this booking request.');
      return;
    }
    onConfirmReject(reason.trim());
    setReason('');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full shadow-xl border border-neutral-200 overflow-hidden animate-dialog-enter">
        <div className="bg-neutral-50 p-4 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-red-50 text-campus-red border border-red-200">
              <AlertTriangle className="w-4 h-4 text-campus-red" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-950">Reject request</h3>
              <p className="text-xs text-neutral-500">Ref: {bookingRef}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-neutral-200/60 text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <p className="text-xs text-neutral-600 leading-relaxed mb-3">
              You are about to reject the booking request for{' '}
              <strong className="text-neutral-950">&ldquo;{eventName}&rdquo;</strong>. This action
              will terminate the approval pipeline and release the reserved facility window.
            </p>

            <label className="block text-xs font-semibold text-neutral-900 mb-1.5">
              Reason for rejection <span className="text-campus-red">*</span>
            </label>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError('');
              }}
              placeholder="Specify the reason (e.g. scheduling policy violation, maintenance conflict, safety concern)..."
              className="w-full p-2.5 rounded-lg border border-neutral-300 text-xs focus:outline-none focus:ring-1 focus:ring-campus-red focus:border-campus-red bg-white text-neutral-950 placeholder-neutral-400 resize-none"
              required
            />
            {error && <p className="text-[11px] text-campus-red mt-1 font-medium">{error}</p>}
          </div>

          <div className="pt-2 border-t border-neutral-200 flex items-center justify-end gap-2.5">
            <BubbleButton variant="secondary" size="md" type="button" onClick={onClose}>
              Cancel
            </BubbleButton>
            <BubbleButton variant="danger" size="md" type="submit">
              Confirm rejection
            </BubbleButton>
          </div>
        </form>
      </div>
    </div>
  );
}
