'use client';

import React from 'react';
import { Facility, AvailabilityStatus } from '@/lib/types';
import { EQUIPMENT_LIST } from '@/lib/seed-data';
import { BubbleButton } from './BubbleButton';
import {
  X,
  Users,
  Sparkles,
  CalendarPlus,
  CheckCircle2,
  Clock,
  Ban,
  Wrench,
  Maximize2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface RoomDetailsModalProps {
  facility: Facility | null;
  availability: AvailabilityStatus;
  selectedDate: string;
  selectedStartTime: string;
  selectedEndTime: string;
  onClose: () => void;
}

export function RoomDetailsModal({
  facility,
  availability,
  selectedDate,
  selectedStartTime,
  selectedEndTime,
  onClose,
}: RoomDetailsModalProps) {
  const router = useRouter();

  if (!facility) return null;

  const equipmentItems = EQUIPMENT_LIST.filter((eq) =>
    facility.equipment.includes(eq.id)
  );

  const getStatusBadge = () => {
    switch (availability) {
      case 'available':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-campus-blue border border-blue-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-campus-blue" />
            Available now
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-campus-purple border border-purple-200">
            <Clock className="w-3.5 h-3.5 text-campus-purple" />
            Waiting for approval
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-campus-red border border-red-200">
            <Ban className="w-3.5 h-3.5 text-campus-red" />
            Reserved
          </span>
        );
      case 'maintenance':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600 border border-neutral-300">
            <Wrench className="w-3.5 h-3.5 text-neutral-600" />
            Maintenance
          </span>
        );
    }
  };

  const handleBookNow = () => {
    router.push(
      `/facilities?facilityId=${facility.id}&date=${selectedDate}&start=${selectedStartTime}&end=${selectedEndTime}`
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="relative bg-white rounded-xl max-w-lg w-full shadow-lg border border-neutral-200 overflow-hidden animate-dialog-enter">
        {/* Header Banner */}
        <div className="bg-neutral-50 p-5 text-neutral-900 border-b border-neutral-200 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 border border-neutral-200 transition-colors focus:outline-none"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-neutral-200 text-neutral-800 font-semibold">
              {facility.code}
            </span>
            <span className="text-xs text-neutral-500 uppercase font-medium">
              {facility.type.replace('_', ' ')}
            </span>
          </div>

          <h3 className="text-xl font-semibold tracking-tight text-neutral-950 leading-snug">
            {facility.name}
          </h3>
          <p className="text-xs text-neutral-600 mt-1 flex items-center gap-2">
            <span>{facility.building}</span> &bull; <span>Floor {facility.floor}</span>
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Status & Capacity Grid */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-neutral-50 border border-neutral-200">
            <div>
              <p className="text-[11px] font-medium text-neutral-500">
                Availability ({selectedStartTime} - {selectedEndTime})
              </p>
              <div className="mt-1">{getStatusBadge()}</div>
            </div>

            <div className="flex items-center gap-4 text-xs text-neutral-600">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-neutral-700" />
                <div>
                  <span className="font-semibold text-neutral-950">{facility.capacity}</span>
                  <span className="text-neutral-500 block text-[10px]">Capacity</span>
                </div>
              </div>

              {facility.dimensions && (
                <div className="flex items-center gap-1.5 border-l border-neutral-200 pl-3">
                  <Maximize2 className="w-4 h-4 text-neutral-700" />
                  <div>
                    <span className="font-semibold text-neutral-950">{facility.dimensions}</span>
                    <span className="text-neutral-500 block text-[10px]">Floor area</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
              About this space
            </h4>
            <p className="text-xs text-neutral-600 leading-relaxed">
              {facility.description}
            </p>
          </div>

          {/* Installed Equipment */}
          <div>
            <h4 className="text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2">
              Equipment and amenities
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {equipmentItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-neutral-50 border border-neutral-200 text-xs text-neutral-700"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-campus-blue flex-shrink-0" />
                  <span className="truncate">{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Bar */}
          <div className="pt-3 border-t border-neutral-200 flex items-center justify-end gap-2.5">
            <BubbleButton variant="secondary" size="md" onClick={onClose}>
              Close
            </BubbleButton>
            <BubbleButton
              variant="primary"
              size="md"
              onClick={handleBookNow}
              disabled={availability === 'maintenance'}
              icon={<CalendarPlus className="w-4 h-4" />}
            >
              {availability === 'approved' ? 'Request alternative time' : 'Book this space'}
            </BubbleButton>
          </div>
        </div>
      </div>
    </div>
  );
}
