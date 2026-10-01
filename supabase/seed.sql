-- =====================================================================
-- CampusSpace - Database Seed Data
-- =====================================================================

-- Equipment Catalog
INSERT INTO equipment (id, name, category) VALUES
  ('projector', '4K Laser Projector', 'av'),
  ('microphone', 'Wireless Collar & Podium Mics', 'av'),
  ('ac', 'Central Air Conditioning', 'climate'),
  ('computers', 'High-Performance Workstations', 'computing'),
  ('sound_system', 'Stage PA & Surround Audio', 'av'),
  ('podium', 'Smart Touchscreen Podium', 'av')
ON CONFLICT (id) DO NOTHING;

-- Buildings
INSERT INTO buildings (id, code, name, floors_count) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'TB', 'Alan Turing Technology Complex', 4),
  ('b0000000-0000-0000-0000-000000000002', 'AC', 'Aryabhata Academic Centre', 3),
  ('b0000000-0000-0000-0000-000000000003', 'SH', 'Student Activity & Sports Hub', 1)
ON CONFLICT (code) DO NOTHING;

-- Facilities (12 Realistic Spaces)
INSERT INTO facilities (id, building_id, code, name, floor, facility_type, capacity, description, is_operational, dimensions) VALUES
  ('f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'AC-G01', 'Dr. APJ Abdul Kalam Auditorium', 0, 'auditorium', 850, 'Premier grand auditorium with multi-tiered acoustic seating and theatrical stage lighting.', true, '42m × 28m'),
  ('f0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'AC-102', 'Ramanujan Seminar Hall', 1, 'seminar_hall', 180, 'Executive stepped hall tailored for symposiums and distinguished guest talks.', true, '20m × 15m'),
  ('f0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'TB-101', 'Turing Smart Classroom 101', 1, 'smart_classroom', 75, 'Modern hybrid-ready interactive classroom with 4K touch display.', true, '12m × 10m'),
  ('f0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'TB-102', 'Turing Smart Classroom 102', 1, 'smart_classroom', 75, 'Collaborative modular classroom with PTZ lecture recording camera.', true, '12m × 10m'),
  ('f0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001', 'TB-201', 'Ada Lovelace AI & Supercomputing Lab', 2, 'computing_lab', 60, 'High-density computational research facility with 60 RTX GPU stations.', true, '18m × 14m'),
  ('f0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000001', 'TB-202', 'Grace Hopper Software Eng. Lab', 2, 'computing_lab', 50, 'Collaborative development space with dual-monitor developer stations.', true, '16m × 12m'),
  ('f0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000001', 'TB-301', 'Vikram Sarabhai Innovation & Robotics Hub', 3, 'innovation_hub', 45, 'Hardware prototyping arena with rapid 3D printing and drone testing cage.', true, '22m × 14m'),
  ('f0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000001', 'TB-302', 'Kalpana Chawla Aerospace Sim Lab', 3, 'computing_lab', 30, 'Aerospace computing room undergoing scheduled sensor maintenance.', false, '14m × 10m'),
  ('f0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000002', 'AC-201', 'Aryabhata Tiered Lecture Theatre', 2, 'auditorium', 250, 'Steep amphitheatre-style tiered hall optimized for inter-departmental lectures.', true, '24m × 18m'),
  ('f0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000002', 'AC-101', 'Homi Bhabha Executive Suite', 1, 'seminar_hall', 35, 'Boardroom style suite with U-shaped mahogany seating and teleconference link.', true, '12m × 8m'),
  ('f0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000003', 'SH-OAT', 'Rabindranath Tagore Open Air Amphitheatre', 0, 'sports_ground', 1200, 'Natural stone outdoor amphitheatre surrounded by campus greenery.', true, '60m × 45m'),
  ('f0000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000003', 'SH-01', 'Major Dhyan Chand Multi-Sport Complex', 0, 'sports_ground', 600, 'Maple hardwood multi-purpose indoor court equipped with electronic scoreboard.', true, '50m × 32m')
ON CONFLICT (code) DO NOTHING;
