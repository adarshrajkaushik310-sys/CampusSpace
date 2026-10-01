-- =====================================================================
-- CampusSpace Consolidated Database Seed Data
-- =====================================================================

-- 1. Initial Buildings
INSERT INTO buildings (id, code, name, floors_count) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'TB', 'Alan Turing Technology Complex', 4),
  ('b0000000-0000-0000-0000-000000000002', 'AC', 'Aryabhata Academic Centre', 3),
  ('b0000000-0000-0000-0000-000000000003', 'SH', 'Student Activity & Sports Hub', 1)
ON CONFLICT (code) DO NOTHING;

-- 2. Initial Dedicated Facilities (Including Single Dedicated AUDITORIUM and SEMINAR HALL)
INSERT INTO facilities (id, code, name, facility_type, capacity, dimensions, is_operational, operating_hours_start, operating_hours_end) VALUES
  ('fac_auditorium', 'AC-AUD-01', 'AUDITORIUM', 'auditorium', 850, '42m × 28m', true, '08:00:00', '22:00:00'),
  ('fac_seminar', 'AC-SEM-01', 'SEMINAR HALL', 'seminar_hall', 180, '20m × 15m', true, '08:00:00', '20:00:00'),
  ('fac_cse_lab', 'TB-CSE-201', 'Turing Advanced Computing Lab', 'computing_lab', 60, '18m × 14m', true, '08:30:00', '19:30:00'),
  ('fac_chem_lab', 'TB-CHM-101', 'Curie Chemistry Research Lab', 'science_lab', 40, '16m × 12m', true, '09:00:00', '18:00:00'),
  ('fac_smart_class', 'TB-CLS-102', 'Turing Interactive Classroom 102', 'smart_classroom', 75, '12m × 10m', true, '08:00:00', '20:00:00'),
  ('fac_sports_complex', 'SH-SPT-01', 'Major Dhyan Chand Sports Complex', 'sports_ground', 600, '50m × 32m', true, '06:00:00', '21:00:00')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  capacity = EXCLUDED.capacity;
