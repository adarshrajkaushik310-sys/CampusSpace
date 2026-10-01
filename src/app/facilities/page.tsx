'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCampusStore } from '@/lib/store';
import { BubbleButton } from '@/components/BubbleButton';
import {
  OPERATING_HOURS_TABLE,
  FacilityHoursKey,
  getOperatingHours,
  validateBookingFormAndHours,
} from '@/lib/operating-hours';
import { getTodayIst, addDaysToDate, formatIstDate, getCurrentIstTime } from '@/lib/date-utils';
import { Facility } from '@/lib/types';
import {
  getUserActiveBooking,
  FACILITY_UNAVAILABLE_MESSAGE,
  ACTIVE_REQUEST_BLOCKED_MESSAGE,
} from '@/lib/approval-matrix';
import {
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Clock,
  Calendar,
  Building,
  CheckCircle2,
  AlertCircle,
  Users,
  Monitor,
  FlaskConical,
  Atom,
  Trophy,
  Presentation,
  ShieldCheck,
  QrCode,
  FileText,
  MapPin,
  Check,
  BookmarkCheck,
} from 'lucide-react';

type TopCategory = 'auditorium' | 'seminar_hall' | 'smart_classroom' | 'labs' | 'sports_ground';
type LabSubcategory = 'computer_lab' | 'chemistry_lab' | 'physics_lab';

function FacilitiesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { facilities, bookings, currentRole, currentUser, createBooking, checkConflict } = useCampusStore();
  const activeBooking = getUserActiveBooking(bookings, currentUser?.id);
  const hasActiveRequest = Boolean(activeBooking);

  const today = getTodayIst();
  const tomorrow = addDaysToDate(today, 1);

  // Navigation / Selection State
  // Step 1: Category selection (5 bubbles)
  // Step 1.1: If 'labs' is picked, show 3 lab sub-categories
  // Step 2: Form & Venue Selection & Review & Submit
  const [selectedCategory, setSelectedCategory] = useState<TopCategory | null>(null);
  const [selectedLabType, setSelectedLabType] = useState<LabSubcategory | null>(null);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('');

  // Form Fields (Required by Club Requester)
  const [reason, setReason] = useState<string>('');
  const [date, setDate] = useState<string>(tomorrow);
  const [startTime, setStartTime] = useState<string>('10:00');
  const [endTime, setEndTime] = useState<string>('16:20');
  const [clubName, setClubName] = useState<string>(currentUser?.club || 'Coding Club');

  // UI / Validation State
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedBooking, setSubmittedBooking] = useState<{
    id: string;
    bookingRef: string;
    facilityName: string;
    date: string;
    startTime: string;
    endTime: string;
    status: string;
  } | null>(null);

  // Sync from URL params if arrived with ?facilityId=...
  useEffect(() => {
    const urlFacId = searchParams.get('facilityId');
    const urlDate = searchParams.get('date');
    const urlStart = searchParams.get('start');
    const urlEnd = searchParams.get('end');

    if (urlDate) setDate(urlDate);
    if (urlStart) setStartTime(urlStart);
    if (urlEnd) setEndTime(urlEnd);

    if (urlFacId) {
      const match = facilities.find((f) => f.id === urlFacId);
      if (match) {
        setSelectedFacilityId(match.id);
        if (match.type === 'auditorium') setSelectedCategory('auditorium');
        else if (match.type === 'seminar_hall') setSelectedCategory('seminar_hall');
        else if (match.type === 'smart_classroom') setSelectedCategory('smart_classroom');
        else if (match.type === 'sports_ground') setSelectedCategory('sports_ground');
        else if (match.type === 'computer_lab' || match.type === 'computing_lab') {
          setSelectedCategory('labs');
          setSelectedLabType('computer_lab');
        } else if (match.type === 'chemistry_lab') {
          setSelectedCategory('labs');
          setSelectedLabType('chemistry_lab');
        } else if (match.type === 'physics_lab') {
          setSelectedCategory('labs');
          setSelectedLabType('physics_lab');
        }
      }
    }
  }, [searchParams, facilities]);

  // Determine current active operating hours key
  const activeHoursKey: FacilityHoursKey = selectedCategory === 'labs'
    ? (selectedLabType || 'computer_lab')
    : (selectedCategory || 'auditorium');

  const operatingHours = OPERATING_HOURS_TABLE[activeHoursKey];

  // Facilities filtered by current selection
  const availableFacilities = facilities.filter((f) => {
    if (!selectedCategory) return false;
    if (selectedCategory === 'auditorium') return f.type === 'auditorium';
    if (selectedCategory === 'seminar_hall') return f.type === 'seminar_hall';
    if (selectedCategory === 'smart_classroom') return f.type === 'smart_classroom';
    if (selectedCategory === 'sports_ground') return f.type === 'sports_ground';
    if (selectedCategory === 'labs') {
      if (!selectedLabType) return false;
      if (selectedLabType === 'computer_lab') return f.type === 'computer_lab' || f.type === 'computing_lab';
      if (selectedLabType === 'chemistry_lab') return f.type === 'chemistry_lab';
      if (selectedLabType === 'physics_lab') return f.type === 'physics_lab';
    }
    return false;
  });

  // Ensure selected facility ID is valid for current category
  useEffect(() => {
    if (availableFacilities.length > 0) {
      if (!selectedFacilityId || !availableFacilities.some((f) => f.id === selectedFacilityId)) {
        setSelectedFacilityId(availableFacilities[0].id);
      }
    }
  }, [availableFacilities, selectedFacilityId]);

  const selectedFacility = facilities.find((f) => f.id === selectedFacilityId) || availableFacilities[0];

  // Helper for category label
  const getCategoryLabel = () => {
    if (!selectedCategory) return '';
    if (selectedCategory === 'auditorium') return 'Auditorium';
    if (selectedCategory === 'seminar_hall') return 'Seminar Hall';
    if (selectedCategory === 'smart_classroom') return 'Smart Projection Classroom';
    if (selectedCategory === 'sports_ground') return 'Sports Ground';
    if (selectedCategory === 'labs') {
      if (selectedLabType === 'computer_lab') return 'Labs • Computer Lab';
      if (selectedLabType === 'chemistry_lab') return 'Labs • Chemistry Lab';
      if (selectedLabType === 'physics_lab') return 'Labs • Physics Lab';
      return 'Labs';
    }
    return '';
  };

  // Back Button Handler
  const handleBack = () => {
    setFieldErrors({});
    setConflictError(null);
    if (submittedBooking) {
      setSubmittedBooking(null);
      return;
    }
    if (selectedCategory === 'labs' && selectedLabType) {
      setSelectedLabType(null);
      return;
    }
    if (selectedCategory) {
      setSelectedCategory(null);
      setSelectedLabType(null);
    }
  };

  // Submission Handler
  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setConflictError(null);

    if (!selectedFacility) {
      setFieldErrors({ general: 'Please select a specific facility venue.' });
      return;
    }

    // Role check: must be club requester
    if (currentRole !== 'requester') {
      setFieldErrors({
        general: 'Unauthorized: Only Club Requesters have authority to submit booking requests. Please switch to Club Requester role.',
      });
      return;
    }

    // Client-side validation using shared logic
    const validation = validateBookingFormAndHours({
      facilityTypeOrKey: activeHoursKey,
      facilityName: selectedFacility.name,
      reason,
      date,
      startTime,
      endTime,
    });

    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      return;
    }

    // 1 active request per person policy
    if (activeBooking) {
      setConflictError(ACTIVE_REQUEST_BLOCKED_MESSAGE);
      return;
    }

    // Check conflict (without exposing other clubs' private info)
    const conflict = checkConflict(selectedFacility.id, date, startTime, endTime);
    if (conflict.hasConflict) {
      setConflictError(FACILITY_UNAVAILABLE_MESSAGE);
      return;
    }

    setIsSubmitting(true);

    try {
      const res = createBooking({
        facilityId: selectedFacility.id,
        eventName: reason.trim().slice(0, 60),
        eventDescription: reason.trim(),
        clubName: clubName.trim() || 'Coding Club',
        department: currentUser?.department || 'Student Technical Clubs',
        attendeeCount: Math.min(selectedFacility.capacity, 50),
        requestedEquipment: selectedFacility.equipment || [],
        date,
        startTime,
        endTime,
      });

      if (res.success && res.booking) {
        setSubmittedBooking({
          id: res.booking.id,
          bookingRef: res.booking.bookingRef,
          facilityName: selectedFacility.name,
          date,
          startTime,
          endTime,
          status: 'secretary_review',
        });
      } else {
        setConflictError(res.error || 'Failed to submit booking reservation. Please try another time.');
      }
    } catch (err: any) {
      setConflictError(err.message || 'An unexpected error occurred during submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-page-enter">
      {/* 1. Header with Breadcrumbs & Back Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-medium text-neutral-500">
              Campus spaces
            </span>
            {selectedCategory && (
              <span className="text-xs font-medium text-neutral-500">
                / {getCategoryLabel()}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-950 tracking-tight">
            {!selectedCategory
              ? 'Campus facility booking'
              : selectedCategory === 'labs' && !selectedLabType
              ? 'Select laboratory type'
              : `Book ${getCategoryLabel()}`}
          </h1>
          <p className="text-sm text-neutral-600 mt-1">
            {!selectedCategory
              ? 'Choose a venue category to view available spaces and operating hours.'
              : selectedCategory === 'labs' && !selectedLabType
              ? 'Choose Computer Lab, Chemistry Lab, or Physics Lab to configure your request.'
              : 'Complete the required reservation details to enter the institutional approval sequence.'}
          </p>
        </div>

        {/* Back Button on any sub-screen */}
        {(selectedCategory || submittedBooking) && (
          <div>
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-50 hover:text-neutral-950 shadow-xs transition-colors focus:outline-none"
            >
              <ArrowLeft className="w-4 h-4 text-neutral-600" />
              <span>Back</span>
            </button>
          </div>
        )}
      </div>

      {/* Policy Banner: Single Active Request Guard */}
      {activeBooking && !submittedBooking && (
        <div className="p-4 sm:p-5 rounded-xl bg-purple-50 border border-purple-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-page-enter">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-white text-campus-purple border border-purple-200 flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
              <Clock className="w-5 h-5 text-campus-purple" />
            </div>
            <div>
              <p className="font-semibold text-neutral-950 text-sm">
                You already have an active request. You can submit another after it is rejected, cancelled, or completed.
              </p>
              <p className="text-xs text-neutral-600 mt-1">
                Active booking: <strong className="text-neutral-950">{activeBooking.bookingRef}</strong> &bull; {activeBooking.facilityName} &bull; {formatIstDate(activeBooking.date)} ({activeBooking.startTime} – {activeBooking.endTime}) &bull; Status: <span className="font-semibold uppercase text-campus-purple">{activeBooking.status}</span>
              </p>
            </div>
          </div>

          <BubbleButton
            href="/requests"
            variant="secondary"
            size="sm"
            className="self-start sm:self-auto flex-shrink-0"
            icon={<BookmarkCheck className="w-4 h-4 text-campus-purple" />}
          >
            View my request
          </BubbleButton>
        </div>
      )}

      {/* 2. SUCCESS CONFIRMATION VIEW */}
      {submittedBooking ? (
        <div className="bg-white rounded-xl p-6 sm:p-8 border border-neutral-200 shadow-sm space-y-6 animate-dialog-enter">
          <div className="text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-blue-50 text-campus-blue border border-blue-200 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7 text-campus-blue" />
            </div>
            <h2 className="text-2xl font-semibold text-neutral-950">
              Booking request submitted
            </h2>
            <p className="text-sm text-neutral-600 max-w-lg mx-auto">
              Your facility reservation request has passed conflict checking and is now in review.
            </p>
          </div>

          {/* Reference Card */}
          <div className="bg-neutral-50 rounded-xl p-5 border border-neutral-200 space-y-3 max-w-lg mx-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <span className="text-xs font-medium text-neutral-500">Booking reference</span>
              <span className="font-mono text-xs font-semibold text-neutral-950 bg-white px-2.5 py-1 rounded-md border border-neutral-200">
                {submittedBooking.bookingRef}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-neutral-500 block text-[11px]">Venue</span>
                <span className="font-medium text-neutral-900">{submittedBooking.facilityName}</span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[11px]">Date</span>
                <span className="font-medium text-neutral-900">{formatIstDate(submittedBooking.date)}</span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[11px]">Time window</span>
                <span className="font-medium text-neutral-900">
                  {submittedBooking.startTime} – {submittedBooking.endTime} IST
                </span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[11px]">Current status</span>
                <span className="inline-flex items-center gap-1 font-medium text-campus-purple">
                  <Clock className="w-3.5 h-3.5 text-campus-purple" />
                  Waiting for approval
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <BubbleButton
              href="/requests"
              variant="primary"
              size="md"
              icon={<FileText className="w-4 h-4" />}
            >
              View my requests
            </BubbleButton>
            <BubbleButton
              onClick={() => {
                setSubmittedBooking(null);
                setReason('');
                setSelectedCategory(null);
                setSelectedLabType(null);
              }}
              variant="secondary"
              size="md"
            >
              Book another facility
            </BubbleButton>
          </div>
        </div>
      ) : null}

      {/* 3. SCREEN 1: 5 BUBBLE-STYLE CATEGORY BUTTONS */}
      {!selectedCategory && !submittedBooking && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Category 1: Auditorium */}
            <button
              type="button"
              onClick={() => setSelectedCategory('auditorium')}
              className="group p-5 rounded-xl bg-white border border-neutral-200 hover:border-neutral-400 hover:shadow-sm text-left flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-neutral-100 text-neutral-800 flex items-center justify-center">
                    <Presentation className="w-5 h-5 text-neutral-800" />
                  </div>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200">
                    9:00 AM – 7:00 PM
                  </span>
                </div>
                <h3 className="font-semibold text-base text-neutral-950">
                  1. Auditorium
                </h3>
                <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                  Tiered lecture halls with stage lighting, laser projection, and acoustic seating.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs font-medium text-campus-blue">
                <span>Select auditorium &rarr;</span>
                <span className="text-neutral-500 font-normal">1 venue</span>
              </div>
            </button>

            {/* Category 2: Seminar Hall */}
            <button
              type="button"
              onClick={() => setSelectedCategory('seminar_hall')}
              className="group p-5 rounded-xl bg-white border border-neutral-200 hover:border-neutral-400 hover:shadow-sm text-left flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-neutral-100 text-neutral-800 flex items-center justify-center">
                    <Users className="w-5 h-5 text-neutral-800" />
                  </div>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200">
                    9:00 AM – 8:00 PM
                  </span>
                </div>
                <h3 className="font-semibold text-base text-neutral-950">
                  2. Seminar Hall
                </h3>
                <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                  Executive stepped halls and conference suites for symposiums and defenses.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs font-medium text-campus-blue">
                <span>Select seminar hall &rarr;</span>
                <span className="text-neutral-500 font-normal">1 venue</span>
              </div>
            </button>

            {/* Category 3: Smart Projection Classroom */}
            <button
              type="button"
              onClick={() => setSelectedCategory('smart_classroom')}
              className="group p-5 rounded-xl bg-white border border-neutral-200 hover:border-neutral-400 hover:shadow-sm text-left flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-neutral-100 text-neutral-800 flex items-center justify-center">
                    <Monitor className="w-5 h-5 text-neutral-800" />
                  </div>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200">
                    9:00 AM – 4:20 PM
                  </span>
                </div>
                <h3 className="font-semibold text-base text-neutral-950">
                  3. Smart Projection Classroom
                </h3>
                <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                  Interactive learning spaces with touchscreen displays and ceiling mics.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs font-medium text-campus-blue">
                <span>Select classroom &rarr;</span>
                <span className="text-neutral-500 font-normal">2 rooms</span>
              </div>
            </button>

            {/* Category 4: Labs */}
            <button
              type="button"
              onClick={() => setSelectedCategory('labs')}
              className="group p-5 rounded-xl bg-white border border-neutral-200 hover:border-neutral-400 hover:shadow-sm text-left flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-neutral-100 text-neutral-800 flex items-center justify-center">
                    <FlaskConical className="w-5 h-5 text-neutral-800" />
                  </div>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200">
                    9:00 AM – 4:20 PM
                  </span>
                </div>
                <h3 className="font-semibold text-base text-neutral-950">
                  4. Laboratories
                </h3>
                <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                  Specialized campus laboratories covering computer, chemistry, and physics.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs font-medium text-campus-purple">
                <span>Explore 3 lab types &rarr;</span>
                <span className="text-neutral-500 font-normal">Computer, Chem, Physics</span>
              </div>
            </button>

            {/* Category 5: Sports Ground */}
            <button
              type="button"
              onClick={() => setSelectedCategory('sports_ground')}
              className="group p-5 rounded-xl bg-white border border-neutral-200 hover:border-neutral-400 hover:shadow-sm text-left flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-neutral-100 text-neutral-800 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-neutral-800" />
                  </div>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200">
                    9:00 AM – 8:00 PM
                  </span>
                </div>
                <h3 className="font-semibold text-base text-neutral-950">
                  5. Sports Ground
                </h3>
                <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                  Outdoor athletic arena, indoor hardwood courts, and open-air amphitheater.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs font-medium text-campus-blue">
                <span>Select sports venue &rarr;</span>
                <span className="text-neutral-500 font-normal">3 venues</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* 4. SCREEN 1.1: LABS SUB-CATEGORY SELECTION (3 BUBBLE BUTTONS) */}
      {selectedCategory === 'labs' && !selectedLabType && !submittedBooking && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-between text-xs text-neutral-900">
            <span className="font-medium flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-campus-purple" />
              All laboratories operate from 9:00 AM – 4:20 PM IST
            </span>
            <span className="text-neutral-500">Select a discipline:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* 1. Computer Lab */}
            <button
              type="button"
              onClick={() => setSelectedLabType('computer_lab')}
              className="group p-5 rounded-xl bg-white border border-neutral-200 hover:border-neutral-400 hover:shadow-sm text-left flex flex-col justify-between transition-all"
            >
              <div>
                <div className="w-10 h-10 rounded-lg bg-neutral-100 text-neutral-800 flex items-center justify-center mb-3">
                  <Monitor className="w-5 h-5 text-neutral-800" />
                </div>
                <h3 className="font-semibold text-base text-neutral-950">
                  Computer Lab
                </h3>
                <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                  High-density workstation clusters, NVIDIA RTX GPUs, and developer environments.
                </p>
                <div className="mt-3 text-[11px] font-medium text-campus-purple bg-purple-50 px-2 py-0.5 rounded-md inline-block border border-purple-200">
                  9:00 AM – 4:20 PM
                </div>
              </div>
              <div className="mt-5 pt-3 border-t border-neutral-100 text-xs font-medium text-campus-purple flex items-center justify-between">
                <span>Select computer lab &rarr;</span>
                <span className="text-neutral-500 font-normal">2 venues</span>
              </div>
            </button>

            {/* 2. Chemistry Lab */}
            <button
              type="button"
              onClick={() => setSelectedLabType('chemistry_lab')}
              className="group p-5 rounded-xl bg-white border border-neutral-200 hover:border-neutral-400 hover:shadow-sm text-left flex flex-col justify-between transition-all"
            >
              <div>
                <div className="w-10 h-10 rounded-lg bg-neutral-100 text-neutral-800 flex items-center justify-center mb-3">
                  <FlaskConical className="w-5 h-5 text-neutral-800" />
                </div>
                <h3 className="font-semibold text-base text-neutral-950">
                  Chemistry Lab
                </h3>
                <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                  Wet chemistry benches, rotary evaporators, and fume hoods.
                </p>
                <div className="mt-3 text-[11px] font-medium text-campus-blue bg-blue-50 px-2 py-0.5 rounded-md inline-block border border-blue-200">
                  9:00 AM – 4:20 PM
                </div>
              </div>
              <div className="mt-5 pt-3 border-t border-neutral-100 text-xs font-medium text-campus-blue flex items-center justify-between">
                <span>Select chemistry lab &rarr;</span>
                <span className="text-neutral-500 font-normal">2 venues</span>
              </div>
            </button>

            {/* 3. Physics Lab */}
            <button
              type="button"
              onClick={() => setSelectedLabType('physics_lab')}
              className="group p-5 rounded-xl bg-white border border-neutral-200 hover:border-neutral-400 hover:shadow-sm text-left flex flex-col justify-between transition-all"
            >
              <div>
                <div className="w-10 h-10 rounded-lg bg-neutral-100 text-neutral-800 flex items-center justify-center mb-3">
                  <Atom className="w-5 h-5 text-neutral-800" />
                </div>
                <h3 className="font-semibold text-base text-neutral-950">
                  Physics Lab
                </h3>
                <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                  Dark-room optics benches, laser interferometers, and Hall effect rigs.
                </p>
                <div className="mt-3 text-[11px] font-medium text-campus-purple bg-purple-50 px-2 py-0.5 rounded-md inline-block border border-purple-200">
                  9:00 AM – 4:20 PM
                </div>
              </div>
              <div className="mt-5 pt-3 border-t border-neutral-100 text-xs font-medium text-campus-purple flex items-center justify-between">
                <span>Select physics lab &rarr;</span>
                <span className="text-neutral-500 font-normal">2 venues</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* 5. SCREEN 2 & 3: CATEGORY BOOKING FORM & VENUE SELECTION & REVIEW SUMMARY */}
      {selectedCategory && (selectedCategory !== 'labs' || selectedLabType) && !submittedBooking && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Form & Venue Selection */}
          <div className="lg:col-span-7 space-y-6">
            {/* Prominent Operating Hours Banner */}
            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-950 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-campus-purple flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-campus-purple" />
                  Operating hours rule
                </span>
                <p className="text-base font-bold text-neutral-950">
                  {operatingHours.display}
                </p>
                <p className="text-xs text-neutral-600">
                  Earliest start: {operatingHours.earliestDisplay} • Latest end: {operatingHours.latestDisplay} (Asia/Kolkata IST)
                </p>
              </div>
            </div>

            {/* Error Banners */}
            {conflictError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-neutral-950 flex items-start gap-2.5 animate-page-enter">
                <AlertCircle className="w-4 h-4 text-campus-red flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block text-campus-red">Scheduling conflict detected</span>
                  <span className="leading-snug text-neutral-700">{conflictError}</span>
                </div>
              </div>
            )}

            {fieldErrors.general && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-neutral-950 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-campus-red flex-shrink-0 mt-0.5" />
                <span className="text-neutral-700">{fieldErrors.general}</span>
              </div>
            )}

            {/* Main Booking Form Card */}
            <div className="bg-white rounded-xl p-5 sm:p-6 border border-neutral-200 shadow-sm space-y-5">
              <h2 className="text-base font-semibold text-neutral-950 flex items-center gap-2">
                <Building className="w-4 h-4 text-campus-purple" />
                Required booking information
              </h2>

              <form onSubmit={handleSubmitBooking} className="space-y-4" noValidate>
                {/* 1. Concrete Venue Selection (if multiple facilities in category) */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-neutral-900">
                    Specific room / venue <span className="text-campus-red">*</span>
                  </label>
                  <div className={`grid gap-2.5 ${availableFacilities.length === 1 ? 'grid-cols-1 sm:max-w-md' : 'grid-cols-1 sm:grid-cols-2'}`}>
                    {availableFacilities.map((fac) => {
                      const isSelected = selectedFacilityId === fac.id;
                      return (
                        <button
                          key={fac.id}
                          type="button"
                          onClick={() => {
                            setSelectedFacilityId(fac.id);
                            setConflictError(null);
                          }}
                          className={`p-3 rounded-lg text-left border transition-colors flex flex-col justify-between ${
                            isSelected
                              ? 'bg-blue-50/50 border-campus-blue text-neutral-950'
                              : 'bg-white border-neutral-200 hover:border-neutral-300 text-neutral-700'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className="text-xs font-semibold leading-tight">{fac.name}</span>
                            {isSelected && <Check className="w-4 h-4 text-campus-blue flex-shrink-0" />}
                          </div>
                          <div className="mt-2 text-[11px] text-neutral-500 flex items-center justify-between">
                            <span>{fac.building} • Fl {fac.floor}</span>
                            <span className="font-medium text-neutral-900">{fac.capacity} seats</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Reason / Purpose of Booking */}
                <div className="space-y-1.5">
                  <label htmlFor="booking-reason" className="block text-xs font-semibold text-neutral-900">
                    Reason / purpose of booking <span className="text-campus-red">*</span>
                  </label>
                  <textarea
                    id="booking-reason"
                    rows={3}
                    value={reason}
                    onChange={(e) => {
                      setReason(e.target.value);
                      if (fieldErrors.reason) setFieldErrors({ ...fieldErrors, reason: undefined });
                    }}
                    placeholder="Provide a clear, meaningful purpose for this reservation..."
                    className={`w-full p-2.5 rounded-lg bg-white border text-xs text-neutral-950 placeholder-neutral-400 focus:outline-none focus:ring-1 transition-colors ${
                      fieldErrors.reason
                        ? 'border-campus-red ring-1 ring-campus-red'
                        : 'border-neutral-300 focus:border-campus-blue focus:ring-campus-blue'
                    }`}
                  />
                  {fieldErrors.reason && (
                    <p className="text-[11px] text-campus-red font-medium">{fieldErrors.reason}</p>
                  )}
                </div>

                {/* 3. Date Selection */}
                <div className="space-y-1.5">
                  <label htmlFor="booking-date" className="block text-xs font-semibold text-neutral-900">
                    Reservation date <span className="text-campus-red">*</span>
                  </label>
                  <input
                    id="booking-date"
                    type="date"
                    min={today}
                    value={date}
                    onChange={(e) => {
                      setDate(e.target.value);
                      if (fieldErrors.date) setFieldErrors({ ...fieldErrors, date: undefined });
                      setConflictError(null);
                    }}
                    className={`w-full p-2 rounded-lg bg-white border text-xs text-neutral-950 focus:outline-none focus:ring-1 transition-colors ${
                      fieldErrors.date
                        ? 'border-campus-red ring-1 ring-campus-red'
                        : 'border-neutral-300 focus:border-campus-blue focus:ring-campus-blue'
                    }`}
                  />
                  {fieldErrors.date && (
                    <p className="text-[11px] text-campus-red font-medium">{fieldErrors.date}</p>
                  )}
                </div>

                {/* 4. Start Time & End Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Start Time */}
                  <div className="space-y-1.5">
                    <label htmlFor="booking-startTime" className="block text-xs font-semibold text-neutral-900">
                      Start time (IST) <span className="text-neutral-500 font-normal">(Min {operatingHours.earliestDisplay})</span>
                    </label>
                    <input
                      id="booking-startTime"
                      type="time"
                      step="60"
                      value={startTime}
                      onChange={(e) => {
                        setStartTime(e.target.value);
                        if (fieldErrors.startTime) setFieldErrors({ ...fieldErrors, startTime: undefined });
                        setConflictError(null);
                      }}
                      className={`w-full p-2 rounded-lg bg-white border text-xs text-neutral-950 focus:outline-none focus:ring-1 transition-colors ${
                        fieldErrors.startTime
                          ? 'border-campus-red ring-1 ring-campus-red'
                          : 'border-neutral-300 focus:border-campus-blue focus:ring-campus-blue'
                      }`}
                    />
                    {fieldErrors.startTime && (
                      <p className="text-[11px] text-campus-red font-medium">{fieldErrors.startTime}</p>
                    )}
                  </div>

                  {/* End Time */}
                  <div className="space-y-1.5">
                    <label htmlFor="booking-endTime" className="block text-xs font-semibold text-neutral-900">
                      End time (IST) <span className="text-neutral-500 font-normal">(Max {operatingHours.latestDisplay})</span>
                    </label>
                    <input
                      id="booking-endTime"
                      type="time"
                      step="60"
                      value={endTime}
                      onChange={(e) => {
                        setEndTime(e.target.value);
                        if (fieldErrors.endTime) setFieldErrors({ ...fieldErrors, endTime: undefined });
                        setConflictError(null);
                      }}
                      className={`w-full p-2 rounded-lg bg-white border text-xs text-neutral-950 focus:outline-none focus:ring-1 transition-colors ${
                        fieldErrors.endTime
                          ? 'border-campus-red ring-1 ring-campus-red'
                          : 'border-neutral-300 focus:border-campus-blue focus:ring-campus-blue'
                      }`}
                    />
                    {fieldErrors.endTime && (
                      <p className="text-[11px] text-campus-red font-medium">{fieldErrors.endTime}</p>
                    )}
                  </div>
                </div>

                {/* Operating hours error if out of bounds */}
                {fieldErrors.operatingHours && (
                  <p className="text-xs text-campus-red font-medium bg-red-50 p-2.5 rounded-lg border border-red-200">
                    {fieldErrors.operatingHours}
                  </p>
                )}

                {/* Requesting Club Name */}
                <div className="space-y-1.5 pt-1">
                  <label htmlFor="booking-club" className="block text-xs font-semibold text-neutral-900">
                    Requesting student organization / club
                  </label>
                  <input
                    id="booking-club"
                    type="text"
                    value={clubName}
                    onChange={(e) => setClubName(e.target.value)}
                    placeholder="e.g. Coding Club, Robotics Society"
                    className="w-full p-2 rounded-lg bg-white border border-neutral-300 text-xs text-neutral-950 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-campus-blue focus:border-campus-blue"
                  />
                </div>
              </form>
            </div>
          </div>

          {/* Right Column: Review Summary & Submit Button */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-xl p-5 border border-neutral-200 shadow-sm space-y-4 sticky top-20">
              <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
                <FileText className="w-4 h-4 text-campus-purple" />
                <h3 className="font-semibold text-sm text-neutral-950">
                  Request summary
                </h3>
              </div>

              {/* Review Summary Breakdown */}
              <div className="space-y-2.5 text-xs">
                <div className="flex items-start justify-between gap-2 py-1 border-b border-neutral-100">
                  <span className="text-neutral-500">Selected facility</span>
                  <span className="font-medium text-neutral-950 text-right">
                    {selectedFacility?.name || 'Not selected'}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-2 py-1 border-b border-neutral-100">
                  <span className="text-neutral-500">Category</span>
                  <span className="font-medium text-neutral-900 text-right">
                    {getCategoryLabel()}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-2 py-1 border-b border-neutral-100">
                  <span className="text-neutral-500">Requesting club</span>
                  <span className="font-medium text-neutral-950 text-right">
                    {clubName || 'Coding Club'}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-2 py-1 border-b border-neutral-100">
                  <span className="text-neutral-500">Date</span>
                  <span className="font-medium text-neutral-950 text-right">
                    {date ? formatIstDate(date) : 'Select date'}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-2 py-1 border-b border-neutral-100">
                  <span className="text-neutral-500">Time window</span>
                  <span className="font-medium text-neutral-950 text-right">
                    {startTime && endTime ? `${startTime} – ${endTime} IST` : 'Select time'}
                  </span>
                </div>

                <div className="py-1">
                  <span className="text-neutral-500 block mb-1">Reason / purpose</span>
                  <p className="text-neutral-800 bg-neutral-50 p-2 rounded-lg border border-neutral-200 text-xs leading-relaxed line-clamp-3">
                    {reason?.trim() || 'No reason specified yet.'}
                  </p>
                </div>
              </div>

              {/* Approval Sequence Note */}
              <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200 text-xs text-neutral-600 space-y-1">
                <span className="font-medium text-neutral-900 block">Approval routing:</span>
                <p className="text-[11px] leading-snug">
                  {selectedFacility?.category === 'labs'
                    ? 'Lab facilities: Assigned Department HOD only → QR Hall Pass'
                    : 'Non-lab facilities: Principal AND Registrar (both required) → QR Hall Pass'}
                </p>
              </div>

              {/* Submit Button & Active Request Notice */}
              <div className="pt-2 space-y-2">
                {hasActiveRequest ? (
                  <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg space-y-2">
                    <p className="text-xs text-neutral-600">
                      You already have an active request. You can submit another after it is rejected, cancelled, or completed.
                    </p>
                    <BubbleButton
                      onClick={() => router.push('/requests')}
                      variant="secondary"
                      size="sm"
                      className="w-full"
                    >
                      View my request
                    </BubbleButton>
                  </div>
                ) : (
                  <BubbleButton
                    onClick={handleSubmitBooking}
                    variant="primary"
                    size="md"
                    className="w-full"
                    isLoading={isSubmitting}
                    disabled={isSubmitting || hasActiveRequest}
                    icon={<ArrowRight className="w-4 h-4" />}
                    iconPosition="right"
                  >
                    {isSubmitting ? 'Submitting request...' : 'Submit request'}
                  </BubbleButton>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FacilitiesPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-500">Loading facilities...</div>}>
      <FacilitiesContent />
    </Suspense>
  );
}
