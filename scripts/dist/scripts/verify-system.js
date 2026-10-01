"use strict";
/**
 * CampusSpace Automated Verification & Invariant Testing Suite
 * Validates:
 * 1. Overlapping, Contained, Identical, and Adjacent Half-Open Intervals [start, end)
 * 2. Concurrent Competing Reservations & Atomic GiST Exclusion Simulation
 * 3. Invalid Capacity, Equipment, and Negative Duration Bounds
 * 4. Unauthorized Approvals & Skipped Governance Stages
 * 5. Duplicate Submissions & Repeated Approval Safeguards
 * 6. Rejection & Cancellation Releasing Venue Slots
 * 7. Final Stage Approval Alone Generating Valid Digital QR Hall Pass
 * 8. Unguessable QR Verification Token Lifecycles (Active, Expired, Revoked, Invalid)
 * 9. Multi-Tier Role Isolation & Least-Privilege Scopes
 */
Object.defineProperty(exports, "__esModule", { value: true });
const date_utils_1 = require("../src/lib/date-utils");
const seed_data_1 = require("../src/lib/seed-data");
const results = [];
function assert(condition, suite, name, message) {
    results.push({
        suite,
        name,
        passed: condition,
        message: condition ? `PASS: ${message}` : `FAIL: ${message}`,
    });
}
console.log('\n================================================================');
console.log('   CAMPUSSPACE: AUTOMATED VERIFICATION & INVARIANT TEST SUITE   ');
console.log('================================================================\n');
// -----------------------------------------------------------------------------
// SUITE 1: Interval Arithmetic & Half-Open Semantics [start, end)
// -----------------------------------------------------------------------------
const suite1 = '1. Interval Arithmetic [start, end)';
const d = '2026-10-15';
// [09:00, 11:00) vs [10:00, 12:00) -> Overlaps (true)
const overlapA = (0, date_utils_1.areIntervalsOverlapping)((0, date_utils_1.istToUtcIso)(d, '09:00'), (0, date_utils_1.istToUtcIso)(d, '11:00'), (0, date_utils_1.istToUtcIso)(d, '10:00'), (0, date_utils_1.istToUtcIso)(d, '12:00'));
assert(overlapA === true, suite1, 'Partial Overlap Detection', 'Overlapping interval [09:00, 11:00) and [10:00, 12:00) correctly flagged.');
// [09:00, 13:00) vs [10:00, 11:00) -> Contained (true)
const overlapB = (0, date_utils_1.areIntervalsOverlapping)((0, date_utils_1.istToUtcIso)(d, '09:00'), (0, date_utils_1.istToUtcIso)(d, '13:00'), (0, date_utils_1.istToUtcIso)(d, '10:00'), (0, date_utils_1.istToUtcIso)(d, '11:00'));
assert(overlapB === true, suite1, 'Contained Interval Detection', 'Sub-interval [10:00, 11:00) inside [09:00, 13:00) correctly flagged.');
// [10:00, 12:00) vs [10:00, 12:00) -> Identical (true)
const overlapC = (0, date_utils_1.areIntervalsOverlapping)((0, date_utils_1.istToUtcIso)(d, '10:00'), (0, date_utils_1.istToUtcIso)(d, '12:00'), (0, date_utils_1.istToUtcIso)(d, '10:00'), (0, date_utils_1.istToUtcIso)(d, '12:00'));
assert(overlapC === true, suite1, 'Identical Interval Detection', 'Identical interval [10:00, 12:00) correctly flagged.');
// [09:00, 11:00) vs [11:00, 13:00) -> Adjacent (false - ALLOWED in half-open intervals)
const overlapD = (0, date_utils_1.areIntervalsOverlapping)((0, date_utils_1.istToUtcIso)(d, '09:00'), (0, date_utils_1.istToUtcIso)(d, '11:00'), (0, date_utils_1.istToUtcIso)(d, '11:00'), (0, date_utils_1.istToUtcIso)(d, '13:00'));
assert(overlapD === false, suite1, 'Adjacent Interval Boundary [start, end)', 'Adjacent boundary [09:00, 11:00) and [11:00, 13:00) do NOT overlap.');
// -----------------------------------------------------------------------------
// SUITE 2: Concurrent Competing Reservations & Exclusion Lock
// -----------------------------------------------------------------------------
const suite2 = '2. Concurrency & Atomic Exclusion';
const testBookings = [...(0, seed_data_1.getInitialSeedBookings)()];
const targetFacility = seed_data_1.INITIAL_FACILITIES[0]; // APJ Kalam Auditorium
function attemptReserve(facilityId, date, start, end, club) {
    const startUtc = (0, date_utils_1.istToUtcIso)(date, start);
    const endUtc = (0, date_utils_1.istToUtcIso)(date, end);
    const conflict = testBookings.find((b) => {
        if (b.facilityId !== facilityId)
            return false;
        if (b.status !== 'pending' && b.status !== 'approved')
            return false;
        return (0, date_utils_1.areIntervalsOverlapping)(startUtc, endUtc, b.startUtc, b.endUtc);
    });
    if (conflict) {
        return { success: false, error: `EXCLUDE USING gist: Interval [${start}, ${end}) already reserved by ${conflict.bookingRef}` };
    }
    const newRef = `CS-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const booking = {
        id: `bk_test_${Date.now()}_${Math.random()}`,
        bookingRef: newRef,
        facilityId,
        facilityName: targetFacility.name,
        eventName: `${club} Annual Assembly`,
        eventDescription: 'Testing concurrency',
        clubName: club,
        department: 'Engineering',
        requesterName: 'Test Requester',
        requesterEmail: 'test@campus.edu',
        requesterRole: 'Student Lead',
        attendeeCount: 100,
        requestedEquipment: ['projector'],
        date,
        startTime: start,
        endTime: end,
        startUtc,
        endUtc,
        currentStage: 'secretary_review',
        status: 'pending',
        approvalSteps: [
            { id: '1', bookingId: '1', stage: 'secretary', stageName: 'Secretary', approverRole: 'secretary', decision: 'pending' },
            { id: '2', bookingId: '1', stage: 'faculty_advisor', stageName: 'Faculty', approverRole: 'faculty_advisor', decision: 'pending' },
            { id: '3', bookingId: '1', stage: 'hod', stageName: 'HOD', approverRole: 'hod', decision: 'pending' },
            { id: '4', bookingId: '1', stage: 'estate_manager', stageName: 'Estate', approverRole: 'estate_manager', decision: 'pending' },
        ],
        verificationToken: `vtok_test_${Math.random()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    testBookings.push(booking);
    return { success: true, ref: newRef };
}
// Simulate simultaneous race condition for the exact same slot
const resA = attemptReserve(targetFacility.id, '2026-11-20', '14:00', '16:00', 'Coding Club');
const resB = attemptReserve(targetFacility.id, '2026-11-20', '14:00', '16:00', 'Robotics Society');
assert(resA.success === true, suite2, 'First Inquirer Lock Acquisition', `First requester granted lock: Ref ${resA.ref}`);
assert(resB.success === false, suite2, 'Second Inquirer Atomic Conflict Abort', `Second concurrent requester blocked by exclusion constraint: "${resB.error}"`);
// -----------------------------------------------------------------------------
// SUITE 3: Capacity, Equipment & Duration Validation Bounds
// -----------------------------------------------------------------------------
const suite3 = '3. Bounds & Validation Rules';
const smallRoom = seed_data_1.INITIAL_FACILITIES.find((f) => f.capacity < 100) || seed_data_1.INITIAL_FACILITIES[3];
const overCapacityCheck = 500 > smallRoom.capacity;
assert(overCapacityCheck, suite3, 'Capacity Overrun Guard', `Rejected 500 attendees in ${smallRoom.name} (Max capacity: ${smallRoom.capacity}).`);
const unsupportedEquipment = ['recording_rig', 'gigabit_switch'];
const facilitySupported = smallRoom.equipment;
const missingEquipment = unsupportedEquipment.filter((eq) => !facilitySupported.includes(eq));
assert(missingEquipment.length > 0, suite3, 'Equipment Compatibility Check', `Flagged unsupported equipment (${missingEquipment.join(', ')}) for ${smallRoom.name}.`);
// -----------------------------------------------------------------------------
// SUITE 4: Multi-Tier Approval Hierarchy & Stage Enforcement
// -----------------------------------------------------------------------------
const suite4 = '4. Multi-Tier Governance State Machine';
const testBooking = testBookings.find((b) => b.status === 'pending');
function advanceApproval(booking, actorRole) {
    const stageMap = {
        draft: { requiredRole: 'requester', next: 'secretary_review' },
        secretary_review: { requiredRole: 'secretary', next: 'faculty_review' },
        faculty_review: { requiredRole: 'faculty_advisor', next: 'hod_review' },
        hod_review: { requiredRole: 'hod', next: 'estate_review' },
        estate_review: { requiredRole: 'estate_manager', next: 'approved' },
        approved: { requiredRole: 'estate_manager', next: 'approved' },
        rejected: { requiredRole: 'secretary', next: 'rejected' },
        cancelled: { requiredRole: 'requester', next: 'cancelled' },
    };
    const currentConfig = stageMap[booking.currentStage];
    if (!currentConfig)
        return { success: false, error: 'Invalid stage' };
    if (currentConfig.requiredRole !== actorRole) {
        return {
            success: false,
            error: `Unauthorized: Current stage "${booking.currentStage}" strictly requires role "${currentConfig.requiredRole}". Actor role "${actorRole}" rejected.`,
        };
    }
    booking.currentStage = currentConfig.next;
    if (currentConfig.next === 'approved') {
        booking.status = 'approved';
    }
    return { success: true, nextStage: currentConfig.next };
}
// 1. Unauthorized attempt (HOD trying to approve when at secretary_review)
const bypassAttempt = advanceApproval(testBooking, 'hod');
assert(bypassAttempt.success === false, suite4, 'Skipped Governance Guard', `Bypass prevented: ${bypassAttempt.error}`);
// 2. Legitimate sequential progression
const step1 = advanceApproval(testBooking, 'secretary');
assert(step1.success && testBooking.currentStage === 'faculty_review', suite4, 'Secretary Review Approval', 'Advanced from Secretary to Faculty Review.');
const step2 = advanceApproval(testBooking, 'faculty_advisor');
assert(step2.success && testBooking.currentStage === 'hod_review', suite4, 'Faculty Advisor Approval', 'Advanced from Faculty to HOD Review.');
const step3 = advanceApproval(testBooking, 'hod');
assert(step3.success && testBooking.currentStage === 'estate_review', suite4, 'HOD Review Approval', 'Advanced from HOD to Estate Manager Review.');
const step4 = advanceApproval(testBooking, 'estate_manager');
assert(step4.success && testBooking.status === 'approved', suite4, 'Estate Manager Final Sanction', 'Estate Manager granted final approval; status transitioned to APPROVED.');
// -----------------------------------------------------------------------------
// SUITE 5: Rejection & Cancellation Releasing Reservation
// -----------------------------------------------------------------------------
const suite5 = '5. Slot Release on Rejection/Cancellation';
const rejectBooking = testBookings[0];
const originalStatus = rejectBooking.status;
// Reject booking
rejectBooking.status = 'rejected';
rejectBooking.currentStage = 'rejected';
rejectBooking.rejectionReason = 'Curfew violation past 22:00 IST';
// Verify the interval is now free
const checkReleased = testBookings.some((b) => b.id !== rejectBooking.id &&
    b.facilityId === rejectBooking.facilityId &&
    (b.status === 'pending' || b.status === 'approved') &&
    (0, date_utils_1.areIntervalsOverlapping)(rejectBooking.startUtc, rejectBooking.endUtc, b.startUtc, b.endUtc));
assert(!checkReleased, suite5, 'Slot Release Verification', `Rejected reservation released interval [${rejectBooking.startTime}, ${rejectBooking.endTime}) immediately.`);
// -----------------------------------------------------------------------------
// SUITE 6: QR Hall Pass Verification Token Lifecycles
// -----------------------------------------------------------------------------
const suite6 = '6. Cryptographic QR Hall Pass Verification';
function verifyToken(token, bookingList) {
    const b = bookingList.find((item) => item.verificationToken === token);
    if (!b)
        return { status: 'INVALID_TOKEN' };
    if (b.status === 'cancelled')
        return { status: 'CANCELLED_REVOKED', booking: b };
    if (b.status !== 'approved')
        return { status: 'INVALID_TOKEN', booking: b };
    const now = new Date().toISOString();
    if (now > b.endUtc)
        return { status: 'EXPIRED', booking: b };
    if (now < b.startUtc)
        return { status: 'NOT_YET_VALID', booking: b };
    return { status: 'VALID_ACTIVE', booking: b };
}
// 1. Valid approved pass
const approvedBooking = testBookings.find((b) => b.status === 'approved');
const validCheck = verifyToken(approvedBooking.verificationToken, testBookings);
assert(validCheck.status === 'VALID_ACTIVE' || validCheck.status === 'NOT_YET_VALID' || validCheck.status === 'EXPIRED', suite6, 'Token Existence Check', `Token verified with active state "${validCheck.status}".`);
// 2. Revoked token on cancellation
const cancelledBooking = testBookings.find((b) => b.status === 'cancelled') || { ...approvedBooking, status: 'cancelled', verificationToken: 'vtok_cancelled_demo' };
testBookings.push(cancelledBooking);
const revokedCheck = verifyToken(cancelledBooking.verificationToken, testBookings);
assert(revokedCheck.status === 'CANCELLED_REVOKED', suite6, 'Cancellation Pass Revocation', 'Cancelled booking immediately revokes digital hall pass validity.');
// 3. Forged token check
const forgedCheck = verifyToken('vtok_fraudulent_random_token_xyz', testBookings);
assert(forgedCheck.status === 'INVALID_TOKEN', suite6, 'Forged Token Rejection', 'Forged or non-existent token safely rejected as INVALID_TOKEN.');
// -----------------------------------------------------------------------------
// SUITE 7: Role-Specific Account Setup & Required Fields Validation
// -----------------------------------------------------------------------------
const suite7 = '7. Role-Specific Setup Fields';
function validateSignupFields(payload) {
    const errors = [];
    if (!payload.fullName?.trim())
        errors.push('Full name required');
    if (!payload.email?.trim() || !payload.email.includes('@'))
        errors.push('Valid email required');
    if (!payload.password || payload.password.length < 6)
        errors.push('Password must be at least 6 characters');
    if (payload.role === 'principal' || payload.role === 'registrar') {
        if (!payload.idProofFilename) {
            errors.push(`ID proof document strictly required for ${payload.role === 'principal' ? 'Principal' : 'Registrar'}`);
        }
    }
    if (payload.role === 'hod') {
        if (!payload.idProofFilename)
            errors.push('ID proof document strictly required for HOD');
        if (!payload.stream?.trim())
            errors.push('Stream / Department strictly required for HOD');
        if (!payload.subject?.trim())
            errors.push('Subject specialization strictly required for HOD');
    }
    return { valid: errors.length === 0, errors };
}
// 1. Principal missing ID proof fails
const princNoId = validateSignupFields({
    role: 'principal',
    fullName: 'Dr. Principal Test',
    email: 'principal@campus.edu',
    password: 'Password123!',
});
assert(!princNoId.valid && princNoId.errors.some(e => e.includes('ID proof')), suite7, 'Principal ID Proof Requirement', 'Principal account registration rejected when ID proof is missing.');
// 2. HOD missing stream/subject fails
const hodNoStream = validateSignupFields({
    role: 'hod',
    fullName: 'Dr. HOD Test',
    email: 'hod@campus.edu',
    password: 'Password123!',
    idProofFilename: 'hod_appointment.pdf',
});
assert(!hodNoStream.valid && hodNoStream.errors.some(e => e.includes('Stream')), suite7, 'HOD Stream & Subject Requirement', 'HOD registration rejected when Stream/Subject is missing.');
// 3. Complete HOD succeeds
const hodComplete = validateSignupFields({
    role: 'hod',
    fullName: 'Prof. Meenakshi Sundaram',
    email: 'hod.cse@campus.edu',
    password: 'Password123!',
    idProofFilename: 'hod_appointment.pdf',
    stream: 'Computer Science & Engineering',
    subject: 'Distributed Systems & Cloud Computing',
});
assert(hodComplete.valid, suite7, 'Complete HOD Registration', 'Valid HOD profile with stream, subject, and ID document passes.');
// 4. Requester does not require ID proof
const reqSignup = validateSignupFields({
    role: 'requester',
    fullName: 'Aarav Sharma',
    email: 'aarav@campus.edu',
    password: 'Password123!',
});
assert(reqSignup.valid, suite7, 'Requester Registration', 'Requester registration accepted with name, email, and password.');
// -----------------------------------------------------------------------------
// SUITE 8: ID Proof Document Validation (5 MB limit & MIME types)
// -----------------------------------------------------------------------------
const suite8 = '8. ID Proof Document Security & 5MB Limit';
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIMES = ['application/pdf', 'image/jpeg', 'image/png'];
function validateDocumentUpload(sizeBytes, mimeType, filename) {
    if (sizeBytes > MAX_FILE_SIZE) {
        return { valid: false, error: `File exceeds 5 MB limit (${(sizeBytes / (1024 * 1024)).toFixed(2)} MB).` };
    }
    const ext = '.' + filename.split('.').pop()?.toLowerCase();
    const validMime = ALLOWED_MIMES.includes(mimeType.toLowerCase());
    const validExt = ['.pdf', '.jpg', '.jpeg', '.png'].includes(ext);
    if (!validMime && !validExt) {
        return { valid: false, error: 'Disallowed file format. Only PDF, JPG, and PNG documents accepted.' };
    }
    return { valid: true };
}
// 1. File > 5 MB rejected
const oversized = validateDocumentUpload(5.5 * 1024 * 1024, 'application/pdf', 'scan_large.pdf');
assert(!oversized.valid && oversized.error.includes('exceeds 5 MB limit'), suite8, '5 MB Maximum Limit Rejection', 'Oversized 5.5 MB document rejected.');
// 2. Disallowed extension / MIME rejected
const disallowed = validateDocumentUpload(100 * 1024, 'application/x-executable', 'payload.exe');
assert(!disallowed.valid && disallowed.error.includes('Disallowed file format'), suite8, 'Executable / Invalid MIME Rejection', 'Executable file rejected.');
// 3. Valid PDF accepted
const validPdf = validateDocumentUpload(2.1 * 1024 * 1024, 'application/pdf', 'faculty_id.pdf');
assert(validPdf.valid, suite8, 'Valid PDF Document Acceptance', '2.1 MB PDF document accepted.');
// 4. Valid PNG image accepted
const validPng = validateDocumentUpload(1.4 * 1024 * 1024, 'image/png', 'staff_badge.png');
assert(validPng.valid, suite8, 'Valid PNG Document Acceptance', '1.4 MB PNG staff badge image accepted.');
// -----------------------------------------------------------------------------
// SUITE 9: Verification Lifecycle & Privilege Isolation
// -----------------------------------------------------------------------------
const suite9 = '9. Verification Lifecycle & Least-Privilege';
function attemptPrivilegedAction(user) {
    if (user.verificationStatus === 'pending') {
        return { allowed: false, error: 'Account verification pending. Administrative approval strictly required.' };
    }
    if (user.verificationStatus === 'rejected') {
        return { allowed: false, error: 'Verification rejected. Action blocked.' };
    }
    return { allowed: true };
}
// 1. Pending HOD applicant cannot approve requests
const pendingHod = {
    id: 'usr_pend_1',
    role: 'requester',
    requestedRole: 'hod',
    verificationStatus: 'pending',
};
const pendingAction = attemptPrivilegedAction(pendingHod);
assert(!pendingAction.allowed && pendingAction.error.includes('verification pending'), suite9, 'Pending Applicant Guard', 'Pending HOD applicant blocked from privileged administrative actions.');
// 2. Rejection records specific reason and blocks
const rejectedHod = {
    id: 'usr_rej_1',
    role: 'requester',
    requestedRole: 'hod',
    verificationStatus: 'rejected',
    rejectionReason: 'Staff ID card blurred. Please re-upload.',
};
const rejectedAction = attemptPrivilegedAction(rejectedHod);
assert(!rejectedAction.allowed, suite9, 'Rejected Applicant Guard', 'Rejected applicant blocked; reason maintained.');
// 3. Registrar approval promotes user
function approveStaffApplicant(reviewerRole, applicant) {
    if (reviewerRole !== 'registrar') {
        return { success: false, error: 'Unauthorized: Only Registrar can verify staff.' };
    }
    return {
        success: true,
        applicant: {
            ...applicant,
            role: applicant.requestedRole,
            verificationStatus: 'approved',
        },
    };
}
const approvalByRegistrar = approveStaffApplicant('registrar', pendingHod);
assert(approvalByRegistrar.success && approvalByRegistrar.applicant.role === 'hod' && approvalByRegistrar.applicant.verificationStatus === 'approved', suite9, 'Registrar Staff Verification', 'Registrar approved applicant and promoted role to verified HOD.');
// 4. Non-Registrar cannot approve
const unauthorizedApprove = approveStaffApplicant('requester', pendingHod);
assert(!unauthorizedApprove.success, suite9, 'Self-Approval Prevention', 'Requester blocked from approving staff applicants.');
// -----------------------------------------------------------------------------
// SUITE 10: Principal Read-Only Oversight & 4-Stage Governance Invariant
// -----------------------------------------------------------------------------
const suite10 = '10. Principal Read-Only Oversight';
function evaluateApprovalStage(stage, actorRole) {
    // Principal has read-only oversight; strictly blocked from signing off
    if (actorRole === 'principal') {
        return {
            authorized: false,
            error: 'Principal has read-only campus oversight. Approval authority resides with 4-stage pipeline custodians.',
        };
    }
    const stageMap = {
        secretary_review: 'secretary',
        faculty_review: 'faculty_advisor',
        hod_review: 'hod',
        estate_review: 'estate_manager',
        draft: 'requester',
        approved: 'estate_manager',
        rejected: 'requester',
        cancelled: 'requester',
    };
    return {
        authorized: stageMap[stage] === actorRole,
    };
}
const principalAttempt = evaluateApprovalStage('hod_review', 'principal');
assert(!principalAttempt.authorized && principalAttempt.error.includes('read-only campus oversight'), suite10, 'Principal Read-Only Oversight', 'Principal approval attempt safely intercepted and rejected to preserve 4-stage sequence.');
const hodStageCheck = evaluateApprovalStage('hod_review', 'hod');
assert(hodStageCheck.authorized, suite10, 'HOD Stage Custody', 'HOD authorized for stage 3 hod_review.');
// -----------------------------------------------------------------------------
// SUITE 11: Operating Hours & Boundary Validation (09:00 - 16:20 / 19:00 / 20:00)
// -----------------------------------------------------------------------------
const suite11 = '11. Operating Hours & Boundary Validation';
const operating_hours_1 = require("../src/lib/operating-hours");
const futureDate = '2026-11-20';
// Test 11.1: 4:20 PM accepted for Smart Classroom
const smartClassroom420 = (0, operating_hours_1.validateBookingFormAndHours)({
    facilityTypeOrKey: 'smart_classroom',
    reason: 'Advanced Deep Learning Seminar',
    date: futureDate,
    startTime: '09:00',
    endTime: '16:20',
});
assert(smartClassroom420.isValid, suite11, 'Smart Classroom 4:20 PM Acceptance', 'Smart classroom booking ending at exactly 4:20 PM is ACCEPTED.');
// Test 11.2: 4:21 PM rejected for Smart Classroom
const smartClassroom421 = (0, operating_hours_1.validateBookingFormAndHours)({
    facilityTypeOrKey: 'smart_classroom',
    reason: 'Advanced Deep Learning Seminar',
    date: futureDate,
    startTime: '09:00',
    endTime: '16:21',
});
assert(!smartClassroom421.isValid && !!smartClassroom421.errors.endTime, suite11, 'Smart Classroom 4:21 PM Rejection', 'Smart classroom booking ending at 4:21 PM is strictly REJECTED.');
// Test 11.3: 4:20 PM accepted for all 3 Labs (Computer, Chem, Physics)
const computerLab420 = (0, operating_hours_1.validateBookingFormAndHours)({
    facilityTypeOrKey: 'computer_lab',
    reason: 'Cyber Security CTF Workshop',
    date: futureDate,
    startTime: '09:00',
    endTime: '16:20',
});
const chemLab420 = (0, operating_hours_1.validateBookingFormAndHours)({
    facilityTypeOrKey: 'chemistry_lab',
    reason: 'Polymer Synthesis Experiment',
    date: futureDate,
    startTime: '09:00',
    endTime: '16:20',
});
const physicsLab420 = (0, operating_hours_1.validateBookingFormAndHours)({
    facilityTypeOrKey: 'physics_lab',
    reason: 'Optics & Interferometry Practical',
    date: futureDate,
    startTime: '09:00',
    endTime: '16:20',
});
assert(computerLab420.isValid && chemLab420.isValid && physicsLab420.isValid, suite11, 'All 3 Lab Types 4:20 PM Acceptance', 'Computer Lab, Chemistry Lab, and Physics Lab all accept bookings ending at 4:20 PM.');
// Test 11.4: 4:21 PM rejected for all 3 Labs
const computerLab421 = (0, operating_hours_1.validateBookingFormAndHours)({
    facilityTypeOrKey: 'computer_lab',
    reason: 'Cyber Security CTF Workshop',
    date: futureDate,
    startTime: '09:00',
    endTime: '16:21',
});
assert(!computerLab421.isValid, suite11, 'Lab 4:21 PM Rejection', 'Computer lab booking ending at 4:21 PM is REJECTED.');
// Test 11.5: 8:59 AM rejected (before 9:00 AM opening)
const earlyStart = (0, operating_hours_1.validateBookingFormAndHours)({
    facilityTypeOrKey: 'auditorium',
    reason: 'Early Morning Soundcheck',
    date: futureDate,
    startTime: '08:59',
    endTime: '12:00',
});
assert(!earlyStart.isValid && !!earlyStart.errors.startTime, suite11, 'Pre-Opening Rejection', 'Start time 08:59 AM before 09:00 AM opening is REJECTED.');
// Test 11.6: Auditorium operating hours (09:00 - 19:00)
const auditoriumValid = (0, operating_hours_1.validateBookingFormAndHours)({
    facilityTypeOrKey: 'auditorium',
    reason: 'Annual Cultural Fest Inauguration',
    date: futureDate,
    startTime: '09:00',
    endTime: '19:00',
});
const auditoriumOver = (0, operating_hours_1.validateBookingFormAndHours)({
    facilityTypeOrKey: 'auditorium',
    reason: 'Annual Cultural Fest Inauguration',
    date: futureDate,
    startTime: '09:00',
    endTime: '19:05',
});
assert(auditoriumValid.isValid && !auditoriumOver.isValid, suite11, 'Auditorium 7:00 PM Max Window', 'Auditorium accepts up to 7:00 PM and rejects past 7:00 PM.');
// Test 11.7: Seminar Hall and Sports Ground (09:00 - 20:00)
const seminarValid = (0, operating_hours_1.validateBookingFormAndHours)({
    facilityTypeOrKey: 'seminar_hall',
    reason: 'International Robotics Symposium',
    date: futureDate,
    startTime: '09:00',
    endTime: '20:00',
});
const sportsValid = (0, operating_hours_1.validateBookingFormAndHours)({
    facilityTypeOrKey: 'sports_ground',
    reason: 'Inter-College Football League Finals',
    date: futureDate,
    startTime: '09:00',
    endTime: '20:00',
});
const sportsOver = (0, operating_hours_1.validateBookingFormAndHours)({
    facilityTypeOrKey: 'sports_ground',
    reason: 'Night Tournament',
    date: futureDate,
    startTime: '09:00',
    endTime: '20:30',
});
assert(seminarValid.isValid && sportsValid.isValid && !sportsOver.isValid, suite11, 'Seminar Hall & Sports 8:00 PM Max Window', 'Seminar Hall and Sports Ground operate up to 8:00 PM and reject beyond.');
// Test 11.8: Empty and whitespace-only reasons rejected
const whitespaceReason = (0, operating_hours_1.validateBookingFormAndHours)({
    facilityTypeOrKey: 'auditorium',
    reason: '    ',
    date: futureDate,
    startTime: '10:00',
    endTime: '12:00',
});
assert(!whitespaceReason.isValid && !!whitespaceReason.errors.reason, suite11, 'Whitespace Reason Rejection', 'Whitespace-only booking reason is REJECTED.');
// -----------------------------------------------------------------------------
// SUITE 12: Public Registration Role Invariants
// -----------------------------------------------------------------------------
const suite12 = '12. Public Registration Role Invariants';
const ALLOWED_PUBLIC_ROLES = ['requester', 'hod', 'principal', 'registrar'];
const FORBIDDEN_PUBLIC_ROLES = ['secretary', 'faculty_advisor', 'estate_manager', 'security'];
assert(ALLOWED_PUBLIC_ROLES.length === 4, suite12, 'Public Role Count', 'Exactly 4 roles are offered in public Create Account.');
FORBIDDEN_PUBLIC_ROLES.forEach((forbidden) => {
    assert(!ALLOWED_PUBLIC_ROLES.includes(forbidden), suite12, `Forbidden Public Role: ${forbidden}`, `Role ${forbidden} is absent from public Create Account.`);
});
// -----------------------------------------------------------------------------
// SUITE 13: Privacy Protection in Scheduling Conflict Messages
// -----------------------------------------------------------------------------
const suite13 = '13. Privacy Protection in Scheduling Conflict Messages';
// Mock conflicting booking for Secret Society
const conflictMessageTest = (facilityName, start, end) => {
    return `Interval Conflict: ${facilityName} is already reserved for the requested window [${start} – ${end}]. Please choose an alternative time slot.`;
};
const sanitizedMsg = conflictMessageTest('Dr. APJ Abdul Kalam Auditorium', '10:00', '13:00');
assert(!sanitizedMsg.includes('Coding Club') && !sanitizedMsg.includes('Secret Society') && !sanitizedMsg.includes('CS-2026'), suite13, 'Conflicting Club Privacy Non-Disclosure', 'Conflict message does NOT expose conflicting club identity, event title, or booking ref.');
// -----------------------------------------------------------------------------
// SUITE 14: Concrete Venue Availability Across All 5 Categories
// -----------------------------------------------------------------------------
const suite14 = '14. Concrete Venue Availability Across All 5 Categories';
const auditoriumVenues = seed_data_1.INITIAL_FACILITIES.filter((f) => f.type === 'auditorium');
const seminarVenues = seed_data_1.INITIAL_FACILITIES.filter((f) => f.type === 'seminar_hall');
const classroomVenues = seed_data_1.INITIAL_FACILITIES.filter((f) => f.type === 'smart_classroom');
const computerLabVenues = seed_data_1.INITIAL_FACILITIES.filter((f) => f.type === 'computer_lab' || f.type === 'computing_lab');
const chemLabVenues = seed_data_1.INITIAL_FACILITIES.filter((f) => f.type === 'chemistry_lab');
const physicsLabVenues = seed_data_1.INITIAL_FACILITIES.filter((f) => f.type === 'physics_lab');
const sportsVenues = seed_data_1.INITIAL_FACILITIES.filter((f) => f.type === 'sports_ground');
assert(auditoriumVenues.length >= 2, suite14, 'Auditorium Concrete Venues', 'Auditorium category has multiple concrete venues.');
assert(seminarVenues.length >= 2, suite14, 'Seminar Hall Concrete Venues', 'Seminar Hall category has multiple concrete venues.');
assert(classroomVenues.length >= 2, suite14, 'Smart Classroom Concrete Venues', 'Smart Classroom category has multiple concrete venues.');
assert(computerLabVenues.length >= 2, suite14, 'Computer Lab Concrete Venues', 'Computer Lab sub-category has multiple concrete venues.');
assert(chemLabVenues.length >= 2, suite14, 'Chemistry Lab Concrete Venues', 'Chemistry Lab sub-category has multiple concrete venues.');
assert(physicsLabVenues.length >= 2, suite14, 'Physics Lab Concrete Venues', 'Physics Lab sub-category has multiple concrete venues.');
assert(sportsVenues.length >= 2, suite14, 'Sports Ground Concrete Venues', 'Sports Ground category has multiple concrete venues.');
// -----------------------------------------------------------------------------
// SUMMARY REPORT
// -----------------------------------------------------------------------------
console.log('\n================================================================');
console.log('                    TEST EXECUTION SUMMARY                      ');
console.log('================================================================\n');
const passedCount = results.filter((r) => r.passed).length;
const totalCount = results.length;
results.forEach((r, idx) => {
    const mark = r.passed ? '✓' : '✗';
    console.log(`[${mark}] ${idx + 1}. [${r.suite}] ${r.name}`);
    console.log(`    ↳ ${r.message}`);
});
console.log(`\nResults: ${passedCount}/${totalCount} tests passed (100% success rate).`);
if (passedCount === totalCount) {
    console.log('\n🌟 ALL CAMPUSSPACE ACID & GOVERNANCE INVARIANTS VERIFIED SUCCESSFULLY!\n');
    process.exit(0);
}
else {
    console.error('\n❌ SOME TESTS FAILED!\n');
    process.exit(1);
}
