import { Facility, Equipment, Booking, DemoUser, StaffApplicant } from './types';
import { getTodayIst, addDaysToDate, istToUtcIso } from './date-utils';

export const EQUIPMENT_LIST: Equipment[] = [
  { id: 'projector', name: '4K Laser Projector', icon: 'Projector', category: 'av' },
  { id: 'microphone', name: 'Wireless Collar & Podium Mics', icon: 'Mic', category: 'av' },
  { id: 'ac', name: 'Central Air Conditioning', icon: 'AirVent', category: 'climate' },
  { id: 'computers', name: 'High-Performance Workstations', icon: 'Monitor', category: 'computing' },
  { id: 'sound_system', name: 'Stage PA & Surround Audio', icon: 'Volume2', category: 'av' },
  { id: 'podium', name: 'Smart Touchscreen Podium', icon: 'Presentation', category: 'av' },
];

export const INSTITUTIONAL_STREAMS = [
  'Computer Science & Engineering',
  'Electronics & Communication Engineering',
  'Mechanical & Mechatronics Engineering',
  'Civil & Environmental Engineering',
  'Information Technology & Data Science',
  'Electrical & Electronics Engineering',
  'Biotechnology & Biochemical Engineering',
  'Management & Humanities',
];

export const INSTITUTIONAL_SUBJECTS: Record<string, string[]> = {
  'Computer Science & Engineering': [
    'Advanced Algorithms & Data Structures',
    'Distributed Systems & Cloud Computing',
    'Artificial Intelligence & Deep Learning',
    'Database Engineering & Operating Systems',
    'Computer Networks & Cyber Security',
  ],
  'Electronics & Communication Engineering': [
    'VLSI & Embedded Systems Design',
    'Digital Signal Processing & Wireless Comms',
    'Microprocessors & Microcontrollers',
    'Robotics & Automation Systems',
  ],
  'Mechanical & Mechatronics Engineering': [
    'Applied Thermodynamics & Heat Transfer',
    'Mechatronics & Cyber-Physical Systems',
    'Finite Element Analysis & CAD/CAM',
    'Fluid Mechanics & Turbo Machinery',
  ],
  'Civil & Environmental Engineering': [
    'Structural Analysis & Concrete Technology',
    'Geotechnical & Foundation Engineering',
    'Hydrology & Water Resources Engineering',
  ],
  'Information Technology & Data Science': [
    'Big Data Analytics & Pipeline Architecture',
    'Applied Machine Learning & NLP',
    'Web Engineering & Cloud-Native Systems',
  ],
  'Electrical & Electronics Engineering': [
    'Power Systems & Smart Grid Technology',
    'Control Systems & Instrumentation',
    'Electric Vehicles & Battery Management',
  ],
};

export const INITIAL_STAFF_APPLICANTS: StaffApplicant[] = [
  {
    id: 'app_1',
    fullName: 'Dr. Ananya Roy',
    email: 'ananya.roy@campus.edu',
    role: 'requester',
    requestedRole: 'hod',
    verificationStatus: 'pending',
    department: 'Electronics & Communication Engineering',
    stream: 'Electronics & Communication Engineering',
    subject: 'VLSI & Embedded Systems Design',
    idProofUrl: 'mock_storage/app_1/ece_hod_appointment.pdf',
    idProofFilename: 'ece_hod_appointment.pdf',
    idProofUploadedAt: '2026-09-28T10:15:00Z',
    createdAt: '2026-09-28T10:15:00Z',
  },
  {
    id: 'app_2',
    fullName: 'Prof. Ramesh Chandra',
    email: 'ramesh.chandra@campus.edu',
    role: 'requester',
    requestedRole: 'principal',
    verificationStatus: 'pending',
    department: 'Office of the Principal',
    idProofUrl: 'mock_storage/app_2/principal_credentials.pdf',
    idProofFilename: 'principal_credentials.pdf',
    idProofUploadedAt: '2026-09-29T14:30:00Z',
    createdAt: '2026-09-29T14:30:00Z',
  },
  {
    id: 'app_3',
    fullName: 'Dr. Bhaskar Sen',
    email: 'bhaskar.sen@campus.edu',
    role: 'requester',
    requestedRole: 'registrar',
    verificationStatus: 'pending',
    department: 'Campus Administration',
    idProofUrl: 'mock_storage/app_3/registrar_appointment.pdf',
    idProofFilename: 'registrar_appointment.pdf',
    idProofUploadedAt: '2026-09-30T09:00:00Z',
    createdAt: '2026-09-30T09:00:00Z',
  },
];

export const DEMO_USERS: DemoUser[] = [
  {
    id: 'user_requester',
    role: 'requester',
    name: 'Aarav Sharma',
    title: 'Lead Convener, Coding Club',
    email: 'aarav.sharma@campus.edu',
    club: 'Coding Club',
    department: 'Computer Science & Engineering',
    avatar: '👨‍💻',
    verificationStatus: 'approved',
  },
  {
    id: 'user_secretary',
    role: 'secretary',
    name: 'Priya Nair',
    title: 'General Secretary, Student Council',
    email: 'secretary@campus.edu',
    department: 'Gymkhana & Student Affairs',
    avatar: '👩‍💼',
    verificationStatus: 'approved',
  },
  {
    id: 'user_faculty',
    role: 'faculty_advisor',
    name: 'Dr. Rajesh Kulkarni',
    title: 'Associate Professor & Faculty Advisor',
    email: 'rajesh.kulkarni@campus.edu',
    club: 'Coding Club',
    department: 'Computer Science & Engineering',
    avatar: '👨‍🏫',
    verificationStatus: 'approved',
  },
  {
    id: 'user_hod',
    role: 'hod',
    name: 'Prof. Meenakshi Sundaram',
    title: 'Head of Department, CSE',
    email: 'hod.cse@campus.edu',
    department: 'Computer Science & Engineering',
    stream: 'Computer Science & Engineering',
    subject: 'Distributed Systems & Cloud Computing',
    idProofFilename: 'hod_appointment_cse.pdf',
    avatar: '👩‍🔬',
    verificationStatus: 'approved',
  },
  {
    id: 'user_hod_chem',
    role: 'hod',
    name: 'Dr. Savita Ramanathan',
    title: 'Head of Department, Chemistry',
    email: 'hod.chem@campus.edu',
    department: 'Chemistry & Chemical Sciences',
    stream: 'Chemistry & Chemical Sciences',
    subject: 'Organic Synthesis & Analytical Chemistry',
    idProofFilename: 'hod_appointment_chem.pdf',
    avatar: '🧪',
    verificationStatus: 'approved',
  },
  {
    id: 'user_hod_physics',
    role: 'hod',
    name: 'Dr. Harish Chandra',
    title: 'Head of Department, Physics',
    email: 'hod.physics@campus.edu',
    department: 'Physics & Applied Sciences',
    stream: 'Physics & Applied Sciences',
    subject: 'Quantum Mechanics & Optics',
    idProofFilename: 'hod_appointment_physics.pdf',
    avatar: '🔬',
    verificationStatus: 'approved',
  },
  {
    id: 'user_estate',
    role: 'estate_manager',
    name: 'Col. Sandeep Varma (Retd.)',
    title: 'Chief Estate & Facility Officer',
    email: 'estate.officer@campus.edu',
    department: 'Campus Infrastructure & Works',
    avatar: '🏛️',
    verificationStatus: 'approved',
  },
  {
    id: 'user_security',
    role: 'security',
    name: 'Inspector Vikram Singh',
    title: 'Chief Security Supervisor',
    email: 'security.gate@campus.edu',
    department: 'Campus Security & Gate Access',
    avatar: '👮‍♂️',
    verificationStatus: 'approved',
  },
  {
    id: 'user_principal',
    role: 'principal',
    name: 'Dr. S. Radhakrishnan',
    title: 'Principal & Campus Executive Oversight',
    email: 'principal@campus.edu',
    department: 'Office of the Principal',
    avatar: '🎓',
    idProofFilename: 'principal_gazette_notification.pdf',
    verificationStatus: 'approved',
  },
  {
    id: 'user_registrar',
    role: 'registrar',
    name: 'Prof. K. Narayanan',
    title: 'Registrar & Staff Credential Reviewer',
    email: 'registrar@campus.edu',
    department: 'Campus Administration & Registrar Office',
    avatar: '📜',
    idProofFilename: 'registrar_appointment_letter.pdf',
    verificationStatus: 'approved',
  },
];

export const BUILDINGS = [
  { id: 'tech_block', name: 'Alan Turing Technology Complex', code: 'TB', floors: [1, 2, 3] },
  { id: 'main_academic', name: 'Aryabhata Academic Centre', code: 'AC', floors: [0, 1, 2] },
  { id: 'sports_grounds', name: 'Student Activity & Sports Hub', code: 'SH', floors: [0] },
];

export const INITIAL_FACILITIES: Facility[] = [
  // 1. Auditorium
  {
    id: 'fac_auditorium',
    code: 'AC-G01',
    name: 'AUDITORIUM',
    building: 'Aryabhata Academic Centre',
    buildingId: 'main_academic',
    floor: 0,
    type: 'auditorium',
    category: 'auditorium',
    capacity: 850,
    description: 'Premier grand auditorium with multi-tiered acoustic seating, professional theatrical lighting, and dual 300-inch laser projections.',
    equipment: ['projector', 'microphone', 'ac', 'sound_system', 'podium'],
    status: 'operational',
    dimensions: '42m × 28m',
    coordinates: { x: 50, y: 70, width: 220, height: 160 },
  },
  // 2. Seminar Hall
  {
    id: 'fac_seminar',
    code: 'AC-102',
    name: 'SEMINAR HALL',
    building: 'Aryabhata Academic Centre',
    buildingId: 'main_academic',
    floor: 1,
    type: 'seminar_hall',
    category: 'seminar_hall',
    capacity: 180,
    description: 'Executive stepped hall tailored for symposiums, distinguished guest talks, and academic thesis defenses.',
    equipment: ['projector', 'microphone', 'ac', 'podium'],
    status: 'operational',
    dimensions: '20m × 15m',
    coordinates: { x: 300, y: 70, width: 170, height: 120 },
  },
  // 3. Turing Smart Classroom 101
  {
    id: 'fac_smart_101',
    code: 'TB-101',
    name: 'Turing Smart Classroom 101',
    building: 'Alan Turing Technology Complex',
    buildingId: 'tech_block',
    floor: 1,
    type: 'smart_classroom',
    category: 'smart_classroom',
    capacity: 75,
    description: 'Modern hybrid-ready interactive classroom featuring 86-inch 4K touchscreen interactive display and ceiling beamforming mics.',
    equipment: ['projector', 'microphone', 'ac'],
    status: 'operational',
    dimensions: '12m × 10m',
    coordinates: { x: 50, y: 260, width: 130, height: 110 },
  },
  // 4. Turing Smart Classroom 102
  {
    id: 'fac_smart_102',
    code: 'TB-102',
    name: 'Turing Smart Classroom 102',
    building: 'Alan Turing Technology Complex',
    buildingId: 'tech_block',
    floor: 1,
    type: 'smart_classroom',
    category: 'smart_classroom',
    capacity: 75,
    description: 'Modular classroom with movable collaborative group tables, automated PTZ lecture capture camera, and acoustic baffles.',
    equipment: ['projector', 'microphone', 'ac'],
    status: 'operational',
    dimensions: '12m × 10m',
    coordinates: { x: 200, y: 260, width: 130, height: 110 },
  },
  // 5. Ada Lovelace AI & Supercomputing Lab
  {
    id: 'fac_ai_lab',
    code: 'TB-201',
    name: 'Ada Lovelace AI & Supercomputing Lab',
    building: 'Alan Turing Technology Complex',
    buildingId: 'tech_block',
    floor: 2,
    type: 'computer_lab',
    category: 'labs',
    labType: 'computer_lab',
    department: 'Computer Science & Engineering',
    capacity: 60,
    description: 'High-density computational research facility equipped with 60 NVIDIA RTX AI workstations, 10Gbps local cluster interconnect, and isolated server racks.',
    equipment: ['computers', 'projector', 'ac', 'sound_system'],
    status: 'operational',
    dimensions: '18m × 14m',
    coordinates: { x: 50, y: 70, width: 200, height: 150 },
  },
  // 6. Grace Hopper Software Engineering Lab
  {
    id: 'fac_soft_lab',
    code: 'TB-202',
    name: 'Grace Hopper Software Eng. Lab',
    building: 'Alan Turing Technology Complex',
    buildingId: 'tech_block',
    floor: 2,
    type: 'computer_lab',
    category: 'labs',
    labType: 'computer_lab',
    department: 'Computer Science & Engineering',
    capacity: 50,
    description: 'Collaborative development space with dual-monitor developer stations, whiteboard walls, and continuous integration testing mirrors.',
    equipment: ['computers', 'projector', 'ac'],
    status: 'operational',
    dimensions: '16m × 12m',
    coordinates: { x: 280, y: 70, width: 190, height: 150 },
  },
  // 7. Vikram Sarabhai Innovation & Robotics Hub
  {
    id: 'fac_robotics',
    code: 'TB-301',
    name: 'Vikram Sarabhai Innovation & Robotics Hub',
    building: 'Alan Turing Technology Complex',
    buildingId: 'tech_block',
    floor: 3,
    type: 'computer_lab',
    category: 'labs',
    labType: 'computer_lab',
    department: 'Computer Science & Engineering',
    capacity: 45,
    description: 'Hardware prototyping arena with rapid 3D printing stations, high-precision soldering desks, drone test cage, and safety ventilation.',
    equipment: ['computers', 'projector', 'ac', 'microphone'],
    status: 'operational',
    dimensions: '22m × 14m',
    coordinates: { x: 50, y: 70, width: 220, height: 160 },
  },
  // 8. Kalpana Chawla Aerospace Sim Lab (Maintenance)
  {
    id: 'fac_aero_sim',
    code: 'TB-302',
    name: 'Kalpana Chawla Aerospace Simulation Lab',
    building: 'Alan Turing Technology Complex',
    buildingId: 'tech_block',
    floor: 3,
    type: 'computer_lab',
    category: 'labs',
    labType: 'computer_lab',
    department: 'Computer Science & Engineering',
    capacity: 30,
    description: 'Specialized aerospace computing room with cockpit simulation hardware. Currently undergoing scheduled pneumatic sensor maintenance.',
    equipment: ['computers', 'ac', 'projector'],
    status: 'maintenance',
    dimensions: '14m × 10m',
    coordinates: { x: 300, y: 70, width: 170, height: 160 },
  },

  // 11. Tagore Open Air Amphitheatre
  {
    id: 'fac_amphitheatre',
    code: 'SH-OAT',
    name: 'Rabindranath Tagore Open Air Amphitheatre',
    building: 'Student Activity & Sports Hub',
    buildingId: 'sports_grounds',
    floor: 0,
    type: 'sports_ground',
    category: 'sports_ground',
    capacity: 1200,
    description: 'Sprawling outdoor natural stone amphitheatre surrounded by campus greenery, ideal for cultural festivals, hackathon closing ceremonies, and concerts.',
    equipment: ['sound_system', 'microphone'],
    status: 'operational',
    dimensions: '60m × 45m',
    coordinates: { x: 50, y: 70, width: 240, height: 180 },
  },
  // 12. Major Dhyan Chand Indoor Sports Complex
  {
    id: 'fac_sports_arena',
    code: 'SH-01',
    name: 'Major Dhyan Chand Multi-Sport Complex',
    building: 'Student Activity & Sports Hub',
    buildingId: 'sports_grounds',
    floor: 0,
    type: 'sports_ground',
    category: 'sports_ground',
    capacity: 600,
    description: 'Maple hardwood multi-purpose indoor court equipped with electronic scoreboard, mobile spectator bleachers, and high-intensity sports lighting.',
    equipment: ['sound_system', 'microphone'],
    status: 'operational',
    dimensions: '50m × 32m',
    coordinates: { x: 320, y: 70, width: 200, height: 180 },
  },
  // 13. Campus Central Athletics & Cricket Ground
  {
    id: 'fac_central_ground',
    code: 'SH-FIELD',
    name: 'Campus Central Sports & Athletics Ground',
    building: 'Student Activity & Sports Hub',
    buildingId: 'sports_grounds',
    floor: 0,
    type: 'sports_ground',
    category: 'sports_ground',
    capacity: 2500,
    description: 'Full-size outdoor athletic arena with floodlights, running track, and spectator pavilion for institutional tournaments.',
    equipment: ['sound_system'],
    status: 'operational',
    dimensions: '140m × 120m',
    coordinates: { x: 50, y: 270, width: 300, height: 180 },
  },
  // 14. Marie Curie Chemistry Research Lab
  {
    id: 'fac_chem_lab',
    code: 'AC-301',
    name: 'Marie Curie Chemistry Research Lab',
    building: 'Aryabhata Academic Centre',
    buildingId: 'main_academic',
    floor: 2,
    type: 'chemistry_lab',
    category: 'labs',
    labType: 'chemistry_lab',
    department: 'Chemistry & Chemical Sciences',
    capacity: 45,
    description: 'Advanced chemistry laboratory fitted with fume hoods, analytical balances, rotary evaporators, and chemical eyewash safety stations.',
    equipment: ['ac', 'projector'],
    status: 'operational',
    dimensions: '18m × 12m',
    coordinates: { x: 50, y: 70, width: 200, height: 140 },
  },
  // 15. P.C. Ray Chemical Synthesis Lab
  {
    id: 'fac_chem_lab_2',
    code: 'AC-302',
    name: 'P.C. Ray Chemical Synthesis Lab',
    building: 'Aryabhata Academic Centre',
    buildingId: 'main_academic',
    floor: 2,
    type: 'chemistry_lab',
    category: 'labs',
    labType: 'chemistry_lab',
    department: 'Chemistry & Chemical Sciences',
    capacity: 40,
    description: 'Undergraduate and postgraduate chemical synthesis lab equipped with temperature baths, spectroscopy rigs, and individual reagent lockers.',
    equipment: ['ac', 'projector'],
    status: 'operational',
    dimensions: '16m × 12m',
    coordinates: { x: 260, y: 70, width: 200, height: 140 },
  },
  // 16. C.V. Raman Physics & Optics Lab
  {
    id: 'fac_physics_lab',
    code: 'AC-202',
    name: 'C.V. Raman Physics & Optics Lab',
    building: 'Aryabhata Academic Centre',
    buildingId: 'main_academic',
    floor: 1,
    type: 'physics_lab',
    category: 'labs',
    labType: 'physics_lab',
    department: 'Physics & Applied Sciences',
    capacity: 50,
    description: 'Dark-room capable optics and quantum mechanics laboratory featuring optical benches, laser interferometers, and precision spectrometers.',
    equipment: ['ac', 'projector'],
    status: 'operational',
    dimensions: '18m × 14m',
    coordinates: { x: 50, y: 220, width: 200, height: 140 },
  },
  // 17. Homi Bhabha Condensed Matter Lab
  {
    id: 'fac_physics_lab_2',
    code: 'AC-203',
    name: 'Homi Bhabha Condensed Matter Physics Lab',
    building: 'Aryabhata Academic Centre',
    buildingId: 'main_academic',
    floor: 1,
    type: 'physics_lab',
    category: 'labs',
    labType: 'physics_lab',
    department: 'Physics & Applied Sciences',
    capacity: 40,
    description: 'Advanced solid state physics lab with Hall effect setups, cryocooler apparatus, and precision digital gaussmeters.',
    equipment: ['ac', 'projector'],
    status: 'operational',
    dimensions: '16m × 12m',
    coordinates: { x: 260, y: 220, width: 200, height: 140 },
  },
];

export function getInitialSeedBookings(): Booking[] {
  const today = getTodayIst();
  const tomorrow = addDaysToDate(today, 1);
  const dayAfter = addDaysToDate(today, 2);
  const in3Days = addDaysToDate(today, 3);
  const in4Days = addDaysToDate(today, 4);
  const in5Days = addDaysToDate(today, 5);

  return [
    // 1. Fully Approved with valid QR Hall Pass (Auditorium: Approved by Principal AND Registrar)
    {
      id: 'book_approved_01',
      bookingRef: 'CS-2026-9012',
      facilityId: 'fac_auditorium',
      facilityName: 'AUDITORIUM',
      facilityCategory: 'auditorium',
      eventName: 'National Hackathon 2026: Grand Keynote & Inauguration',
      eventDescription: 'Inaugural ceremony of 36-hour hackathon with 600 student developers and industry judges.',
      clubName: 'Coding Club',
      department: 'Computer Science & Engineering',
      requesterId: 'user_requester',
      requesterName: 'Aarav Sharma',
      requesterEmail: 'aarav.sharma@campus.edu',
      requesterRole: 'Lead Convener, Coding Club',
      attendeeCount: 650,
      requestedEquipment: ['projector', 'microphone', 'ac', 'sound_system', 'podium'],
      date: tomorrow,
      startTime: '09:00',
      endTime: '13:00',
      startUtc: istToUtcIso(tomorrow, '09:00'),
      endUtc: istToUtcIso(tomorrow, '13:00'),
      currentStage: 'approved',
      status: 'approved',
      verificationToken: 'vtok_hackathon_9012_active',
      approvalSteps: [
        {
          id: 'step_1_princ',
          bookingId: 'book_approved_01',
          stage: 'principal',
          stageName: 'Principal',
          approverRole: 'principal',
          approverName: 'Dr. S. Radhakrishnan',
          decision: 'approved',
          comments: 'Institutional flagship event sanctioned.',
          decidedAt: istToUtcIso(today, '09:00'),
        },
        {
          id: 'step_2_reg',
          bookingId: 'book_approved_01',
          stage: 'registrar',
          stageName: 'Registrar',
          approverRole: 'registrar',
          approverName: 'Prof. K. Narayanan',
          decision: 'approved',
          comments: 'Auditorium facility cleared. Final QR Hall Pass generated.',
          decidedAt: istToUtcIso(today, '11:30'),
        },
      ],
      createdAt: istToUtcIso(today, '07:30'),
      updatedAt: istToUtcIso(today, '11:30'),
    },

    // 2. Pending at Principal & Registrar Review (Smart Classroom: Non-lab)
    {
      id: 'book_pending_sec',
      bookingRef: 'CS-2026-9015',
      facilityId: 'fac_smart_101',
      facilityName: 'Turing Smart Classroom 101',
      facilityCategory: 'smart_classroom',
      eventName: 'Fullstack Rust & WebAssembly Workshop',
      eventDescription: 'Hands-on practical code lab for 60 students on building fast browser runtimes.',
      clubName: 'Web Developers Guild',
      department: 'Computer Science & Engineering',
      requesterId: 'user_devansh',
      requesterName: 'Devansh Roy',
      requesterEmail: 'devansh.roy@campus.edu',
      requesterRole: 'Technical Lead',
      attendeeCount: 60,
      requestedEquipment: ['projector', 'microphone', 'ac'],
      date: dayAfter,
      startTime: '14:00',
      endTime: '16:20',
      startUtc: istToUtcIso(dayAfter, '14:00'),
      endUtc: istToUtcIso(dayAfter, '16:20'),
      currentStage: 'secretary_review',
      status: 'pending',
      verificationToken: 'vtok_rust_wasm_9015_pend',
      approvalSteps: [
        {
          id: 'step_sec_p',
          bookingId: 'book_pending_sec',
          stage: 'principal',
          stageName: 'Principal',
          approverRole: 'principal',
          decision: 'pending',
        },
        {
          id: 'step_sec_r',
          bookingId: 'book_pending_sec',
          stage: 'registrar',
          stageName: 'Registrar',
          approverRole: 'registrar',
          decision: 'pending',
        },
      ],
      createdAt: istToUtcIso(today, '10:00'),
      updatedAt: istToUtcIso(today, '10:00'),
    },

    // 3. One Approval Done: Principal Approved, Registrar Pending (Seminar Hall)
    {
      id: 'book_pending_fac',
      bookingRef: 'CS-2026-9018',
      facilityId: 'fac_seminar',
      facilityName: 'SEMINAR HALL',
      facilityCategory: 'seminar_hall',
      eventName: 'Competitive Programming Masterclass',
      eventDescription: 'Advanced graph algorithms & dynamic programming session for ICPC regional qualifiers.',
      clubName: 'Algorithms Society',
      department: 'Computer Science & Engineering',
      requesterId: 'user_kunal',
      requesterName: 'Kunal Verma',
      requesterEmail: 'kunal.v@campus.edu',
      requesterRole: 'President, Algorithms Society',
      attendeeCount: 140,
      requestedEquipment: ['projector', 'microphone', 'ac', 'podium'],
      date: in3Days,
      startTime: '10:00',
      endTime: '13:00',
      startUtc: istToUtcIso(in3Days, '10:00'),
      endUtc: istToUtcIso(in3Days, '13:00'),
      currentStage: 'faculty_review',
      status: 'pending',
      verificationToken: 'vtok_cp_master_9018_pend',
      approvalSteps: [
        {
          id: 'step_fac_p',
          bookingId: 'book_pending_fac',
          stage: 'principal',
          stageName: 'Principal',
          approverRole: 'principal',
          approverName: 'Dr. S. Radhakrishnan',
          decision: 'approved',
          comments: 'Academic excellence workshop endorsed.',
          decidedAt: istToUtcIso(today, '10:15'),
        },
        {
          id: 'step_fac_r',
          bookingId: 'book_pending_fac',
          stage: 'registrar',
          stageName: 'Registrar',
          approverRole: 'registrar',
          decision: 'pending',
        },
      ],
      createdAt: istToUtcIso(today, '09:45'),
      updatedAt: istToUtcIso(today, '10:15'),
    },

    // 4. Lab Request: Pending at Assigned HOD (Computer Lab -> CSE HOD only)
    {
      id: 'book_pending_hod',
      bookingRef: 'CS-2026-9022',
      facilityId: 'fac_ai_lab',
      facilityName: 'Ada Lovelace AI & Supercomputing Lab',
      facilityCategory: 'labs',
      labType: 'computer_lab',
      eventName: 'Deep Learning Model Optimization Bootcamp',
      eventDescription: 'GPU accelerated workshop on model fine-tuning with open weights.',
      clubName: 'AI Research Group',
      department: 'Computer Science & Engineering',
      requesterId: 'user_ananya',
      requesterName: 'Dr. Ananya Roy',
      requesterEmail: 'ananya.roy@campus.edu',
      requesterRole: 'Faculty Organizer',
      attendeeCount: 55,
      requestedEquipment: ['computers', 'projector', 'ac'],
      date: in4Days,
      startTime: '13:30',
      endTime: '16:20',
      startUtc: istToUtcIso(in4Days, '13:30'),
      endUtc: istToUtcIso(in4Days, '16:20'),
      currentStage: 'hod_review',
      status: 'pending',
      verificationToken: 'vtok_ai_deep_9022_pend',
      approvalSteps: [
        {
          id: 'step_lab_hod',
          bookingId: 'book_pending_hod',
          stage: 'hod',
          stageName: 'Head of Department (Computer Science & Engineering)',
          approverRole: 'hod',
          approverName: 'Prof. Meenakshi Sundaram',
          approverDepartment: 'Computer Science & Engineering',
          decision: 'pending',
        },
      ],
      createdAt: istToUtcIso(today, '08:00'),
      updatedAt: istToUtcIso(today, '09:00'),
    },

    // 5. Rejected Booking with Reason (Principal approved, Registrar rejected)
    {
      id: 'book_rejected_01',
      bookingRef: 'CS-2026-8991',
      facilityId: 'fac_smart_102',
      facilityName: 'Turing Smart Classroom 102',
      facilityCategory: 'smart_classroom',
      eventName: 'Late Night LAN Gaming League',
      eventDescription: 'Student club multiplayer gaming tournament.',
      clubName: 'Gaming Society',
      department: 'Student Affairs',
      requesterId: 'user_kunal',
      requesterName: 'Kunal Verma',
      requesterEmail: 'kunal.v@campus.edu',
      requesterRole: 'Vice President, Gaming Society',
      attendeeCount: 60,
      requestedEquipment: ['projector', 'ac', 'computers'],
      date: tomorrow,
      startTime: '14:00',
      endTime: '16:00',
      startUtc: istToUtcIso(tomorrow, '14:00'),
      endUtc: istToUtcIso(tomorrow, '16:00'),
      currentStage: 'rejected',
      status: 'rejected',
      rejectedByRole: 'registrar',
      rejectionReason: 'Event proposal conflicts with departmental scheduled maintenance protocols.',
      verificationToken: 'vtok_rejected_8991',
      approvalSteps: [
        {
          id: 'step_rej_p',
          bookingId: 'book_rejected_01',
          stage: 'principal',
          stageName: 'Principal',
          approverRole: 'principal',
          approverName: 'Dr. S. Radhakrishnan',
          decision: 'approved',
          decidedAt: istToUtcIso(today, '07:00'),
        },
        {
          id: 'step_rej_r',
          bookingId: 'book_rejected_01',
          stage: 'registrar',
          stageName: 'Registrar',
          approverRole: 'registrar',
          approverName: 'Prof. K. Narayanan',
          decision: 'rejected',
          comments: 'Event proposal conflicts with departmental scheduled maintenance protocols.',
          decidedAt: istToUtcIso(today, '09:00'),
        },
      ],
      createdAt: istToUtcIso(today, '05:30'),
      updatedAt: istToUtcIso(today, '09:00'),
    },

    // 6. Cancelled Booking
    {
      id: 'book_cancelled_01',
      bookingRef: 'CS-2026-8980',
      facilityId: 'fac_seminar',
      facilityName: 'SEMINAR HALL',
      facilityCategory: 'seminar_hall',
      eventName: 'Mobile App Idea Pitchfest',
      eventDescription: 'Cancelled by requester due to overlap with university semester exams.',
      clubName: 'Coding Club',
      department: 'Computer Science & Engineering',
      requesterId: 'user_requester',
      requesterName: 'Aarav Sharma',
      requesterEmail: 'aarav.sharma@campus.edu',
      requesterRole: 'Lead Convener, Coding Club',
      attendeeCount: 100,
      requestedEquipment: ['projector', 'microphone', 'ac'],
      date: addDaysToDate(today, 7),
      startTime: '10:00',
      endTime: '12:00',
      startUtc: istToUtcIso(addDaysToDate(today, 7), '10:00'),
      endUtc: istToUtcIso(addDaysToDate(today, 7), '12:00'),
      currentStage: 'cancelled',
      status: 'cancelled',
      cancellationReason: 'Rescheduling following mid-term examination calendar announcement.',
      verificationToken: 'vtok_cancelled_8980',
      approvalSteps: [],
      createdAt: istToUtcIso(today, '04:00'),
      updatedAt: istToUtcIso(today, '07:00'),
    },
  ];
}

/**
 * Anomaly Detection & Reporting Utility
 * Implements Requirement 8:
 * "If existing data contains multiple active requests from one person or overlapping reservations,
 * report them for resolution. Do not silently delete or cancel records to make a migration pass."
 */
export function detectExistingDataAnomalies(bookings: Booking[]): {
  multipleActiveRequesters: {
    requesterId: string;
    requesterName: string;
    activeCount: number;
    bookingRefs: string[];
  }[];
  overlappingReservations: {
    facilityId: string;
    facilityName: string;
    bookingA: string;
    bookingB: string;
    intervalA: string;
    intervalB: string;
  }[];
} {
  const nowMs = Date.now();
  const requesterActiveMap: Record<string, Booking[]> = {};

  bookings.forEach((b) => {
    const isAct =
      b.status === 'pending' ||
      (b.status === 'approved' && new Date(b.endUtc).getTime() > nowMs);

    if (isAct) {
      if (!requesterActiveMap[b.requesterId]) {
        requesterActiveMap[b.requesterId] = [];
      }
      requesterActiveMap[b.requesterId].push(b);
    }
  });

  const multipleActiveRequesters = Object.entries(requesterActiveMap)
    .filter(([_, list]) => list.length > 1)
    .map(([requesterId, list]) => ({
      requesterId,
      requesterName: list[0].requesterName || requesterId,
      activeCount: list.length,
      bookingRefs: list.map((b) => b.bookingRef),
    }));

  const overlappingReservations: {
    facilityId: string;
    facilityName: string;
    bookingA: string;
    bookingB: string;
    intervalA: string;
    intervalB: string;
  }[] = [];

  for (let i = 0; i < bookings.length; i++) {
    for (let j = i + 1; j < bookings.length; j++) {
      const b1 = bookings[i];
      const b2 = bookings[j];

      if (b1.facilityId === b2.facilityId) {
        const b1Active = b1.status === 'pending' || b1.status === 'approved';
        const b2Active = b2.status === 'pending' || b2.status === 'approved';

        if (b1Active && b2Active) {
          const overlaps =
            new Date(b1.startUtc).getTime() < new Date(b2.endUtc).getTime() &&
            new Date(b1.endUtc).getTime() > new Date(b2.startUtc).getTime();

          if (overlaps) {
            overlappingReservations.push({
              facilityId: b1.facilityId,
              facilityName: b1.facilityName,
              bookingA: b1.bookingRef,
              bookingB: b2.bookingRef,
              intervalA: `${b1.date} ${b1.startTime}-${b1.endTime}`,
              intervalB: `${b2.date} ${b2.startTime}-${b2.endTime}`,
            });
          }
        }
      }
    }
  }

  return { multipleActiveRequesters, overlappingReservations };
}

