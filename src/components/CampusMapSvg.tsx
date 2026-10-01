'use client';

import React, { useState } from 'react';
import { Facility, AvailabilityStatus } from '@/lib/types';
import { BUILDINGS } from '@/lib/seed-data';
import { useCampusStore } from '@/lib/store';
import { RoomDetailsModal } from './RoomDetailsModal';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Building as BuildingIcon,
  Layers,
  Users,
  CheckCircle2,
  Clock,
  Ban,
  Wrench,
  Search,
  ListFilter,
  Map,
} from 'lucide-react';

interface CampusMapSvgProps {
  selectedDate: string;
  selectedStartTime: string;
  selectedEndTime: string;
}

export function CampusMapSvg({
  selectedDate,
  selectedStartTime,
  selectedEndTime,
}: CampusMapSvgProps) {
  const { facilities, getFacilityAvailability } = useCampusStore();

  const [activeBuildingId, setActiveBuildingId] = useState<string>('tech_block');
  const [activeFloor, setActiveFloor] = useState<number>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [searchQuery, setSearchQuery] = useState('');

  const currentBuilding = BUILDINGS.find((b) => b.id === activeBuildingId) || BUILDINGS[0];

  // Facilities filtered by building and floor
  const floorFacilities = facilities.filter(
    (f) => f.buildingId === activeBuildingId && f.floor === activeFloor
  );

  // All facilities filtered by search query
  const searchedFacilities = facilities.filter((f) => {
    const q = searchQuery.toLowerCase();
    return (
      f.name.toLowerCase().includes(q) ||
      f.code.toLowerCase().includes(q) ||
      f.building.toLowerCase().includes(q) ||
      f.type.toLowerCase().includes(q)
    );
  });

  const getStatusColorConfig = (status: AvailabilityStatus) => {
    switch (status) {
      case 'available':
        return {
          fill: '#ECFDF5',
          stroke: '#10B981',
          text: '#065F46',
          badgeBg: 'bg-emerald-100',
          badgeText: 'text-emerald-800',
          icon: <CheckCircle2 className="w-3 h-3 text-emerald-600" />,
          label: 'Available',
        };
      case 'pending':
        return {
          fill: '#FFFBEB',
          stroke: '#F59E0B',
          text: '#92400E',
          badgeBg: 'bg-amber-100',
          badgeText: 'text-amber-800',
          icon: <Clock className="w-3 h-3 text-amber-600" />,
          label: 'Pending',
        };
      case 'approved':
        return {
          fill: '#FEF2F2',
          stroke: '#EF4444',
          text: '#991B1B',
          badgeBg: 'bg-rose-100',
          badgeText: 'text-rose-800',
          icon: <Ban className="w-3 h-3 text-rose-600" />,
          label: 'Reserved',
        };
      case 'maintenance':
        return {
          fill: '#F1F5F9',
          stroke: '#94A3B8',
          text: '#475569',
          badgeBg: 'bg-slate-100',
          badgeText: 'text-slate-700',
          icon: <Wrench className="w-3 h-3 text-slate-500" />,
          label: 'Maintenance',
        };
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft-card">
      {/* Top Controls: Building Selector & Floor Pills */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BuildingIcon className="w-5 h-5 text-violet-600" />
            Interactive Campus Architectural Blueprint
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Select building & floor to inspect spatial room layouts, equipment, and real-time interval availability.
          </p>
        </div>

        {/* View mode toggle (Map vs Accessible List) */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-full self-start lg:self-auto">
          <button
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              viewMode === 'map'
                ? 'bg-white text-violet-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            Blueprint Map
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              viewMode === 'list'
                ? 'bg-white text-violet-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            List View ({facilities.length})
          </button>
        </div>
      </div>

      {viewMode === 'map' ? (
        <>
          {/* Building & Floor Switcher Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 py-4">
            {/* Building Selection Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              {BUILDINGS.map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    setActiveBuildingId(b.id);
                    setActiveFloor(b.floors[0]);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    activeBuildingId === b.id
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {b.name}
                </button>
              ))}
            </div>

            {/* Floor Selection Pills */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 p-1 rounded-full">
              <span className="text-[11px] font-semibold text-slate-500 px-2 flex items-center gap-1">
                <Layers className="w-3 h-3 text-slate-400" />
                Floor:
              </span>
              {currentBuilding.floors.map((floorNum) => (
                <button
                  key={floorNum}
                  onClick={() => setActiveFloor(floorNum)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    activeFloor === floorNum
                      ? 'bg-white text-violet-900 shadow-sm border border-slate-200 font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {floorNum === 0 ? 'Ground (0)' : `Floor ${floorNum}`}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Map Container with Zoom/Pan Overlay */}
          <div className="relative border border-slate-200/80 rounded-2xl bg-gradient-to-br from-slate-50 to-[#FAF9F6] overflow-hidden">
            {/* Map Legend */}
            <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200/60 text-[11px] shadow-sm">
              <span className="flex items-center gap-1 text-emerald-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Available
              </span>
              <span className="flex items-center gap-1 text-amber-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Pending
              </span>
              <span className="flex items-center gap-1 text-rose-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> Reserved
              </span>
              <span className="flex items-center gap-1 text-slate-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-slate-400" /> Maintenance
              </span>
            </div>

            {/* Zoom Controls */}
            <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-white/90 backdrop-blur-md p-1 rounded-full border border-slate-200/60 shadow-sm">
              <button
                onClick={() => setZoomLevel((z) => Math.min(z + 0.2, 1.8))}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-700 transition-colors"
                title="Zoom in"
                aria-label="Zoom in"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoomLevel((z) => Math.max(z - 0.2, 0.8))}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-700 transition-colors"
                title="Zoom out"
                aria-label="Zoom out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-700 transition-colors"
                title="Reset zoom"
                aria-label="Reset zoom"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Interactive SVG Canvas */}
            <div className="w-full h-[440px] overflow-auto flex items-center justify-center p-4">
              <div
                style={{
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.2s ease-out',
                }}
              >
                <svg
                  viewBox="0 0 600 400"
                  className="w-[600px] h-[400px] select-none rounded-xl"
                  style={{
                    backgroundColor: '#F8FAFC',
                    backgroundImage:
                      'radial-gradient(circle, #E2E8F0 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                  }}
                >
                  {/* Outer Building Boundary */}
                  <rect
                    x="20"
                    y="20"
                    width="560"
                    height="360"
                    rx="18"
                    fill="#FFFFFF"
                    stroke="#CBD5E1"
                    strokeWidth="3"
                    strokeDasharray="6 3"
                  />

                  {/* Hallway / Corridors */}
                  <path
                    d="M 20 220 L 580 220"
                    stroke="#E2E8F0"
                    strokeWidth="24"
                    fill="none"
                  />
                  <text
                    x="280"
                    y="224"
                    fill="#94A3B8"
                    fontSize="10"
                    fontWeight="bold"
                    letterSpacing="2"
                    textAnchor="middle"
                  >
                    CENTRAL CAMPUS CONCOURSE &bull; {currentBuilding.code} FLOOR {activeFloor}
                  </text>

                  {/* Empty state if no rooms on this floor */}
                  {floorFacilities.length === 0 && (
                    <text
                      x="300"
                      y="180"
                      fill="#64748B"
                      fontSize="14"
                      textAnchor="middle"
                      fontWeight="bold"
                    >
                      No academic rooms configured on Floor {activeFloor}.
                    </text>
                  )}

                  {/* Interactive Rooms */}
                  {floorFacilities.map((fac) => {
                    const availability = getFacilityAvailability(
                      fac.id,
                      selectedDate,
                      selectedStartTime,
                      selectedEndTime
                    );
                    const config = getStatusColorConfig(availability);

                    return (
                      <g
                        key={fac.id}
                        onClick={() => setSelectedFacility(fac)}
                        className="cursor-pointer group"
                      >
                        {/* Room boundary */}
                        <rect
                          x={fac.coordinates.x}
                          y={fac.coordinates.y}
                          width={fac.coordinates.width}
                          height={fac.coordinates.height}
                          rx="12"
                          fill={config.fill}
                          stroke={config.stroke}
                          strokeWidth="2"
                          className="transition-all duration-200 group-hover:filter group-hover:brightness-95 group-hover:stroke-[3]"
                        />

                        {/* Room Code Badge */}
                        <rect
                          x={fac.coordinates.x + 8}
                          y={fac.coordinates.y + 8}
                          width="52"
                          height="18"
                          rx="6"
                          fill="#FFFFFF"
                          stroke={config.stroke}
                          strokeWidth="1"
                        />
                        <text
                          x={fac.coordinates.x + 34}
                          y={fac.coordinates.y + 20}
                          fill={config.text}
                          fontSize="9"
                          fontWeight="bold"
                          textAnchor="middle"
                          fontFamily="monospace"
                        >
                          {fac.code}
                        </text>

                        {/* Capacity Tag */}
                        <text
                          x={fac.coordinates.x + fac.coordinates.width - 10}
                          y={fac.coordinates.y + 21}
                          fill="#64748B"
                          fontSize="9"
                          fontWeight="600"
                          textAnchor="end"
                        >
                          👥 {fac.capacity}
                        </text>

                        {/* Room Name */}
                        <text
                          x={fac.coordinates.x + fac.coordinates.width / 2}
                          y={fac.coordinates.y + fac.coordinates.height / 2}
                          fill="#0F172A"
                          fontSize="11"
                          fontWeight="bold"
                          textAnchor="middle"
                          className="pointer-events-none"
                        >
                          {fac.name.length > 24
                            ? fac.name.substring(0, 22) + '...'
                            : fac.name}
                        </text>

                        {/* Status Label in room */}
                        <rect
                          x={fac.coordinates.x + fac.coordinates.width / 2 - 40}
                          y={fac.coordinates.y + fac.coordinates.height - 28}
                          width="80"
                          height="18"
                          rx="9"
                          fill="#FFFFFF"
                          stroke={config.stroke}
                          strokeWidth="1"
                        />
                        <text
                          x={fac.coordinates.x + fac.coordinates.width / 2}
                          y={fac.coordinates.y + fac.coordinates.height - 16}
                          fill={config.text}
                          fontSize="9"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          {config.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            <div className="bg-white/80 border-t border-slate-200/60 p-3 flex items-center justify-between text-xs text-slate-600">
              <span>
                Viewing <strong>{currentBuilding.name}</strong> &bull;{' '}
                <strong>Floor {activeFloor}</strong> ({floorFacilities.length} rooms)
              </span>
              <span className="text-[11px] text-slate-400">
                Click any room on the blueprint to inspect capacity, equipment & book
              </span>
            </div>
          </div>
        </>
      ) : (
        /* Accessible List View */
        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-2 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by facility name, code, or building..."
                className="w-full pl-9 pr-4 py-2 rounded-full border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 bg-slate-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {searchedFacilities.map((fac) => {
              const availability = getFacilityAvailability(
                fac.id,
                selectedDate,
                selectedStartTime,
                selectedEndTime
              );
              const config = getStatusColorConfig(availability);

              return (
                <div
                  key={fac.id}
                  onClick={() => setSelectedFacility(fac)}
                  className="p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-violet-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {fac.code}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${config.badgeBg} ${config.badgeText}`}
                      >
                        {config.icon}
                        {config.label}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 leading-snug">
                      {fac.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {fac.building} &bull; Floor {fac.floor}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <span className="flex items-center gap-1 font-medium">
                      <Users className="w-3.5 h-3.5 text-violet-600" />
                      {fac.capacity} seats
                    </span>
                    <span className="text-violet-600 font-semibold text-[11px]">
                      View Details &rarr;
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Room Details Modal / Drawer */}
      {selectedFacility && (
        <RoomDetailsModal
          facility={selectedFacility}
          availability={getFacilityAvailability(
            selectedFacility.id,
            selectedDate,
            selectedStartTime,
            selectedEndTime
          )}
          selectedDate={selectedDate}
          selectedStartTime={selectedStartTime}
          selectedEndTime={selectedEndTime}
          onClose={() => setSelectedFacility(null)}
        />
      )}
    </div>
  );
}
