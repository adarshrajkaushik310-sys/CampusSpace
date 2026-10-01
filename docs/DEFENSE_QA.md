# CampusSpace: Technical Defense & Hackathon Q&A Dossier

> **Audience**: Technical Judges, Hackathon Reviewers, Campus Facility Directors, and Security Evaluators.  
> **System Architecture**: Next.js 15 App Router + PostgreSQL Range Exclusion (GiST) + Cryptographic QR Verification Gate.

---

## 1. Architectural Deep-Dive Q&A

### Q1: Why use PostgreSQL `EXCLUDE USING gist` instead of application-level `SELECT ... WHERE` queries?
**Technical Defense**:  
Conventional web apps perform booking conflict checks with:
```sql
SELECT COUNT(*) FROM bookings WHERE facility_id = $1 AND start_time < $end AND end_time > $start;
-- Application checks if count === 0, then:
INSERT INTO bookings (...) VALUES (...);
```
Under concurrent traffic (e.g. 50 clubs rushing to book auditoriums at 9:00 AM on registration day), this introduces a critical **Time-of-Check to Time-of-Use (TOCTOU)** race condition. Two web server threads can concurrently execute the `SELECT`, both observe `0` rows, and both proceed to execute `INSERT`, resulting in a catastrophic double-booking.

CampusSpace delegates the conflict invariant directly to the PostgreSQL storage engine via `btree_gist`:
```sql
ALTER TABLE bookings ADD CONSTRAINT prevent_overlapping_active_bookings
EXCLUDE USING gist (
  facility_id WITH =,
  tstzrange(start_time, end_time, '[)') WITH &&
) WHERE (status IN ('pending', 'approved'));
```
PostgreSQL's GiST index enforces mutual exclusion at the transaction lock boundary. One transaction commits; the other is atomically aborted with error code `23P01` (`exclusion_violation`), guaranteeing 100% ACID double-booking immunity under arbitrary concurrency.

---

### Q2: Why half-open intervals `[start, end)`?
**Technical Defense**:  
Closed intervals `[start, end]` erroneously flag adjacent bookings as conflicts. If Club A books `10:00 - 12:00` and Club B books `12:00 - 14:00`, a closed range considers `12:00` overlapping ($[10, 12] \cap [12, 14] = \{12\}$).  
Open intervals `(start, end)` allow adjacent bookings but fail to protect the boundary instants.  
Half-open intervals `[start, end)` &mdash; inclusive of start, exclusive of end &mdash; correctly model physical room usage ($[10, 12) \cap [12, 14) = \emptyset$), allowing immediate seamless back-to-back room utilization.

---

### Q3: How does the sequential 4-tier approval state machine prevent privilege escalation?
**Technical Defense**:  
The workflow advances strictly:
$$\text{Requester} \xrightarrow{\text{Submit}} \text{Secretary} \xrightarrow{\text{Verify}} \text{Faculty Advisor} \xrightarrow{\text{Approve}} \text{HOD} \xrightarrow{\text{Approve}} \text{Estate Manager} \xrightarrow{\text{Sanction}} \text{APPROVED}$$

- Every transition verifies that the session user possesses the exact role required for the current stage (`booking.currentStage`).
- A Head of Department cannot approve a request currently sitting at Secretary review.
- Skipping stages is blocked at the schema level.
- Any tier can reject with a mandatory rationale. Rejection immediately releases the facility interval so other clubs are not held hostage by blocked slots.

---

### Q4: How are digital hall passes protected against screenshot forgery and tampering?
**Technical Defense**:  
- The QR code does **NOT** encode raw event text or student credentials (which could easily be forged).
- Instead, the QR encodes an unguessable cryptographic token URL: `https://campusspace.edu/verify/vtok_8821_94j3k2a`.
- When campus security guards scan the QR code with their mobile phone or handheld scanner, the server queries the database in real-time.
- The gate evaluates:
  1. *Token existence and integrity*.
  2. *Current booking status* (if the booking was cancelled by the requester or revoked by administration, it immediately shows `CANCELLED / REVOKED`).
  3. *Temporal validity* (`NOT_YET_VALID` if scanned prior to event start, `VALID_ACTIVE` during authorized event, `EXPIRED` once ended).

---

### Q5: How does the Explainable Alternatives Engine work without LLM hallucinations?
**Technical Defense**:  
Instead of unpredictable generative text, CampusSpace employs a deterministic multi-variable ranking algorithm:
1. **Spatial & Temporal Candidate Search**:
   - Other operational facilities free during the *exact same interval* with $\text{Capacity} \ge \text{Requested Attendees}$.
   - The *same facility* shifted by $\pm 2$ or $\pm 3$ hours within campus operating hours (07:00 – 22:00 IST).
2. **Scoring Function**:
   $$\text{Score} = (\text{Equipment Match Rate} \times 60) + \left(\frac{40}{\max(1, \text{Capacity Delta Penalty})}\right)$$
3. **Actionable Explanations**: Generates concrete reasons ("Dennis Ritchie Software Lab is free 10:00–12:00 IST with 65 seats and 100% equipment match") and provides 1-click adoption.

---

## 2. Repeatable 3-to-5 Minute Demonstration Script

Follow this structured presentation flow for live judging:

```
[0:00 - 0:45] Discovery & Spatial Map:
- Open http://localhost:3000/map
- Filter by date, floor (Ground, 1st, 2nd) and facility type.
- Click "APJ Abdul Kalam Grand Auditorium" -> Show contextual details drawer with capacity (750) and fixed 4K projector.

[0:45 - 1:45] Guided Booking & Explainable Conflict:
- Click "Book This Space" -> Navigate to /book
- Fill Step 2 (Coding Club Keynote, 500 attendees).
- Pick tomorrow 10:00 - 13:00 IST -> Step 3 conflict check triggers!
- Point out Explainable Alternatives card: "Recommended: Dennis Ritchie Software Systems Lab or Shift Kalam Auditorium to 14:00".
- Click "Adopt Option" -> Form auto-adjusts cleanly!

[1:45 - 2:45] Live Concurrency Battle Demonstration:
- Return to Homepage -> Scroll to "Atomic Concurrency & Race Condition Simulator".
- Click "Dispatch Concurrent Race Condition".
- Watch live: Requester Alpha wins Lock (200 OK & CS-2026-XXXX); Requester Beta is safely blocked (409 Conflict) with GiST exclusion proof!

[2:45 - 3:45] Sequential 4-Stage Approval Journey:
- Switch Role in top banner to "Student Council Secretary" -> Open /approvals -> Click "Approve & Advance".
- Switch Role to "Faculty Advisor" -> Click "Approve & Advance".
- Switch Role to "HOD" -> Click "Approve & Advance".
- Switch Role to "Estate Manager" -> Click "Approve & Final Sanction".
- Show booking transition to APPROVED and instant issuance of Digital Hall Pass!

[3:45 - 4:45] Hall Pass & Gate Verification:
- Open /pass/[id] -> Show high-density cryptographic QR pass with printable styling.
- Click "Simulate Security Gate Scan" -> Opens /verify/[token].
- Show live green badge "VERIFIED ACTIVE ACCESS SANCTIONED".
- Switch back to /bookings -> Click "Cancel Booking" -> Re-verify token -> Instantly shows "CANCELLED & REVOKED"!

[4:45 - 5:00] Utilization Analytics & Wrap-Up:
- Open /analytics -> Show reserved utilization formula, peak days/hours, and pending-stage turnaround SLA.
```
