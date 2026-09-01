# User manual

## Staff sign-in

Open the web application and use the seeded administrator credentials shown in the README. The reference environment contains synthetic records only. Select **Request a patient appointment** to inspect the separate public intake surface.

## Daily operations

1. **Overview** shows today's volume, confirmation rate, pending decisions, no-show risk and the seven-day schedule.
2. **Appointments** lists bookings and their explainable risk score. Use **New appointment** to select an existing patient, service, time, duration and clinician.
3. **Patients** lists contact and record-created information. The global search filters patient and appointment views.
4. **Approvals** is the human decision gate. Review the summary before approving or rejecting; resolved decisions cannot be replayed as pending.
5. **AI assistant** answers only from approved clinic knowledge. Medical, private, unsafe or unsupported questions are escalated rather than improvised.
6. **Audit trail** is administrator-only and records authentication, agent, approval and workflow activity.

## Public intake

Patients provide contact details, service, preferred date, a message and explicit consent. Submission creates a patient and intake record, not a confirmed appointment. Administrative urgency rules may open a human escalation workflow. For emergencies, the form must not replace emergency services.

## Important boundaries

- The no-show score prioritizes follow-up; it does not deny care or cancel appointments.
- An assistant response is operational information, not medical advice.
- Notification delivery is dry-run by default.
- All included names, contacts and scenarios are fictional.
