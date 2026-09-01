# Product contract

## Scenario

NovaSmile is a fictional two-clinician dental practice with one manager and two reception staff. The clinic needs one operational view for incoming requests, appointments, reminders, risk follow-up, approval decisions and basic performance indicators.

## Users

| User                 | Responsibilities                       | Access                                      |
| -------------------- | -------------------------------------- | ------------------------------------------- |
| Clinic administrator | Operations, approvals, audit review    | Full operational access                     |
| Receptionist         | Intake, patients, appointments         | No approval resolution or full audit access |
| Dentist              | Schedule and approved clinical context | No system administration                    |
| Prospective patient  | Submit consented intake                | Public intake only                          |

## Business problems

1. Patient requests arrive without consistent required fields.
2. Urgent language can sit unnoticed in a general inbox.
3. Appointment reminders and follow-up may be duplicated.
4. Managers cannot see confirmation and no-show risk in one place.
5. Generic chatbots may invent policies or cross clinical boundaries.
6. Automated actions lack accountable approval and audit evidence.

## Acceptance criteria

- A valid intake is persisted and returns a traceable identifier.
- Missing consent or invalid contact data is rejected.
- emergency-language signals create a pending human review.
- Dashboard metrics are calculated from persisted database records.
- Appointment risk is deterministic, capped, banded and explainable.
- Approved questions cite approved knowledge; unsupported questions escalate.
- Prompt injection and medical-decision requests are refused safely.
- Reminder workflows are idempotent and persist failed state.
- Receptionists cannot perform administrator-only approval or audit actions.
- Mobile, tablet and desktop layouts do not clip critical content.
- The repository builds and tests with one documented command sequence.

## Explicit exclusions

- Diagnosis, triage as a medical device, prescribing or treatment recommendation
- EHR integration, insurance adjudication or real patient data
- Production SMS/email delivery (outbox defaults to dry-run)
- Claims of regulatory certification
- Autonomous appointment cancellation or financial approval

## Success indicators for a real pilot

These are proposed measurements, not claimed results: median response time, intake completion rate, confirmation rate, no-show rate, duplicate notification rate, approval turnaround time, and staff time spent per booking.
