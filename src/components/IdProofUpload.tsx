'use client';

import React, { useState, useRef } from 'react';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  X,
  FileCheck,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react';

interface IdProofUploadProps {
  onFileSelect: (file: File | null, error?: string) => void;
  initialFilename?: string;
  isRequired?: boolean;
  label?: string;
  description?: string;
  disabled?: boolean;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];

export function IdProofUpload({
  onFileSelect,
  initialFilename,
  isRequired = true,
  label = 'Institutional Staff ID / Appointment Document',
  description = 'Upload your official faculty ID card, gazette notification, or institutional appointment letter for administrative review.',
  disabled = false,
}: IdProofUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [existingFilename, setExistingFilename] = useState<string | undefined>(initialFilename);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const validateAndProcessFile = (file: File) => {
    setErrorMessage(null);

    // Validate size (5 MB limit)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const err = `File exceeds the 5 MB limit (Selected: ${formatFileSize(file.size)}). Please upload a smaller file.`;
      setErrorMessage(err);
      setSelectedFile(null);
      setUploadProgress(0);
      onFileSelect(null, err);
      return false;
    }

    // Validate extension / MIME type
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    const isValidType =
      ALLOWED_MIME_TYPES.includes(file.type.toLowerCase()) ||
      ALLOWED_EXTENSIONS.includes(fileExt);

    if (!isValidType) {
      const err = 'Invalid file format. Only official PDF, JPG, and PNG documents are accepted.';
      setErrorMessage(err);
      setSelectedFile(null);
      setUploadProgress(0);
      onFileSelect(null, err);
      return false;
    }

    // Valid file: simulate rapid client verification & progress
    setSelectedFile(file);
    setExistingFilename(undefined);
    setUploadProgress(25);

    const timer1 = setTimeout(() => setUploadProgress(75), 150);
    const timer2 = setTimeout(() => {
      setUploadProgress(100);
      onFileSelect(file);
    }, 300);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndProcessFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndProcessFile(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setExistingFilename(undefined);
    setErrorMessage(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onFileSelect(null);
  };

  const triggerFileInput = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const isPdf = selectedFile?.name.toLowerCase().endsWith('.pdf') || existingFilename?.toLowerCase().endsWith('.pdf');

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-neutral-900 tracking-tight">
          {label} {isRequired && <span className="text-campus-red">*</span>}
        </label>
        <span className="text-[11px] font-medium text-neutral-600 bg-neutral-100 px-2.5 py-0.5 rounded-full border border-neutral-200">
          Max 5 MB (PDF, JPG, PNG)
        </span>
      </div>

      <p className="text-[11px] text-neutral-500 leading-normal">{description}</p>

      {/* Upload Zone */}
      {!selectedFile && !existingFilename ? (
        <div
          onClick={triggerFileInput}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          role="button"
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              triggerFileInput();
            }
          }}
          className={`relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-campus-blue ${
            disabled ? 'opacity-50 cursor-not-allowed bg-neutral-100' : ''
          } ${
            isDragging
              ? 'border-campus-blue bg-blue-50/50'
              : 'border-neutral-300 hover:border-campus-blue bg-neutral-50 hover:bg-neutral-100/70'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            onChange={handleFileChange}
            disabled={disabled}
            className="hidden"
            aria-label={label}
          />

          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-campus-blue shadow-sm">
              <UploadCloud className="w-5 h-5" />
            </div>

            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-neutral-900">
                Click to browse or drag & drop document
              </p>
              <p className="text-[11px] text-neutral-500">
                Strictly validated for institutional staff verification
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-neutral-600 bg-white border border-neutral-200 px-2 py-0.5 rounded">
                <FileText className="w-3 h-3 text-campus-red" /> PDF
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-neutral-600 bg-white border border-neutral-200 px-2 py-0.5 rounded">
                <ImageIcon className="w-3 h-3 text-campus-blue" /> JPG / PNG
              </span>
              <span className="text-[10px] font-medium text-campus-blue bg-campus-blue/10 px-2 py-0.5 rounded border border-campus-blue/20">
                Encrypted in Private Bucket
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Selected / Verified File Card */
        <div className="rounded-xl border border-neutral-200 bg-white p-3.5 shadow-sm space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isPdf ? 'bg-campus-red/10 text-campus-red' : 'bg-campus-blue/10 text-campus-blue'
                }`}
              >
                {isPdf ? <FileText className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
              </div>

              <div className="min-w-0">
                <p className="text-xs font-bold text-neutral-900 truncate">
                  {selectedFile ? selectedFile.name : existingFilename}
                </p>
                <p className="text-[10px] text-neutral-500 flex items-center gap-1.5 mt-0.5">
                  {selectedFile && <span>{formatFileSize(selectedFile.size)}</span>}
                  {selectedFile && <span>&bull;</span>}
                  <span className="text-campus-blue font-medium flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3" /> Ready for verification
                  </span>
                </p>
              </div>
            </div>

            {/* Replace / Remove Action Controls */}
            {!disabled && (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                  onChange={handleFileChange}
                  disabled={disabled}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={triggerFileInput}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-campus-blue"
                  title="Replace document"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Replace</span>
                </button>

                <button
                  type="button"
                  onClick={handleRemove}
                  className="p-1 text-neutral-400 hover:text-campus-red hover:bg-campus-red/10 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-campus-red"
                  title="Remove document"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Upload Progress Bar */}
          {selectedFile && uploadProgress < 100 && (
            <div className="space-y-1">
              <div className="w-full bg-neutral-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-campus-blue h-1.5 rounded-full transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-[10px] text-neutral-500 text-right">
                Validating file: {uploadProgress}%
              </p>
            </div>
          )}

          {uploadProgress === 100 && (
            <div className="flex items-center justify-between text-[10px] bg-neutral-50 px-2.5 py-1 rounded-lg text-neutral-600 border border-neutral-200">
              <span className="flex items-center gap-1 text-campus-blue font-medium">
                <FileCheck className="w-3.5 h-3.5 text-campus-blue" />
                Stored in private reviewer bucket upon submission
              </span>
              <span className="font-mono text-neutral-500">5 MB max</span>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="flex items-start gap-1.5 p-2.5 rounded-xl bg-campus-red/10 border border-campus-red/20 text-campus-red text-xs animate-dialog-enter">
          <AlertCircle className="w-4 h-4 text-campus-red flex-shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
