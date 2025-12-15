# TIERs EMR – Implementation Proposal

## Executive summary
TIERs EMR is a modern, modular electronic medical records platform designed to securely manage client data, streamline appointments, and digitize clinical workflows across HTS, PrEP, STI, mental health, and pharmacy/medication dispensing. The system emphasizes robust security, actionable reporting, user-friendly design, and teleconsultation readiness. A working mock website (Next.js on Vercel) demonstrates the intended UX, information architecture, and reporting style for stakeholder review and presentations.

This proposal outlines scope, architecture, security and compliance, integrations, delivery plan, and acceptance criteria to move from the current mock to a production-ready MVP—while keeping flexibility for future expansion.

## Goals and success criteria
- Security by design: encrypted data, role-based access, and auditability for all access/events.
- Provider efficiency: reduce time-to-document encounter by ≥25% compared to current process.
- Client access: frictionless appointment booking and reminders with ≥95% successful delivery.
- Data quality: ≥98% required-field completeness across clinical modules.
- Reporting speed: key indicators and exports generated in <10 seconds for standard date ranges.
- Reliability and performance: ≥99.9% uptime target; p95 page load < 2.5s on 3G fast.

## Scope of work
- Patient registry and demographics (search, merge, unique identifiers).
- Appointments and scheduling (calendar views, reminders via SMS/email, triage queue).
- Clinical modules:
  - HTS (screening, results, linkage to care)
  - PrEP (eligibility, initiation, follow-up, adherence)
  - STI (syndromic management, lab results)
  - Mental health (screeners, notes, care plans)
  - Medication dispensing/pharmacy (dispense, stock, refills)
- Reporting and dashboards (KPIs, cohort trends, exports: CSV/Excel/PDF).
- Administration and RBAC (roles, permissions, user management).
- Audit logging (read/write actions, sensitive field access).
- Notifications (SMS/email/WhatsApp-ready templates; configurable schedules).
- Teleconsultation readiness (secure video, chat, file sharing; provider/patient flows).
- Mobile-first responsive UI and accessibility (WCAG 2.1 AA aims).

## Product and technical architecture
- Frontend
  - Next.js 15 (App Router), React 19, Tailwind CSS v4.
  - SSR/SSG where appropriate; page transitions; responsive UI.
  - Deployed on Vercel (production and preview environments).
- Backend (recommended)
  - Node.js (NestJS) or Python (Django/DRF) service layer.
  - REST/GraphQL APIs; OpenAPI schema; server-side validation.
  - HL7 FHIR R4-aligned resources for interoperability (Patient, Encounter, Observation, Condition, QuestionnaireResponse, Medication, MedicationRequest/Dispense, ServiceRequest).
- Data
  - PostgreSQL (primary OLTP), Prisma/TypeORM/SQLAlchemy ORM.
  - Redis (caching, rate limiting, background jobs).
  - Object storage (S3-compatible) for documents/uploads.
- Teleconsultation
  - Option A: Managed (Twilio Programmable Video / Daily.co) with TURN/STUN.
  - Option B: Self-hosted (Janus/mediasoup) for cost control; secure signaling service.
- Reporting and analytics
  - Operational dashboards in-app; scheduled exports.
  - Optional: Metabase/Superset connected to read replica for self-service analytics.
- Observability and ops
  - Centralized logging (JSON logs), metrics, tracing; alerting (pagers/slack/email).
  - Blue/green deployments; feature flags; infrastructure as code (Terraform) when moving to a dedicated cloud.

## Security, privacy, and compliance
- Encryption: TLS 1.2+ in transit; AES‑256 at rest (DB, backups, object storage).
- RBAC and least privilege with fine-grained scopes per module.
- Secrets handling via managed secrets (Vercel/Cloud provider secrets manager).
- Audit logging: immutable event trail for auth, access, reads/writes, exports.
- Data protection: data minimization, consent tracking, purpose binding, retention policies.
- Backup & DR: automated encrypted backups; tested restore procedures; RPO ≤ 24h, RTO ≤ 4h.
- Compliance: HIPAA/GDPR/NDPR-ready controls; DPA and BAA with vendors where applicable.

## Interoperability and integrations
- FHIR R4 resources for patient/clinical data exchange; SMART-on-FHIR optional for app launch.
- Health messaging bridges (HL7 v2/CSV) for lab/LIS and DHIS2/aggregations when needed.
- Identity: SSO/OIDC (e.g., Keycloak/Azure AD/Auth0) with MFA and account policies.
- Messaging: SMS/email gateways (e.g., Twilio, SendGrid) with delivery status tracking.

## User experience and accessibility
- Clean, high-contrast theme (deep purple primary; orange accents).
- Mobile-first layouts; keyboard navigation; ARIA roles; color contrast checks.
- Performance budgets; lazy-loading and code-splitting; p95 < 2.5s on mid-tier devices.

## Implementation plan and timeline (indicative)
- Phase 0 – Discovery & design (1–2 weeks)
  - Workshops, detailed requirements, data dictionary, wireframes.
- Phase 1 – Core platform (2 weeks)
  - Auth/RBAC, patient registry, appointments, audit logging, notifications scaffold.
- Phase 2 – Clinical modules (3–4 weeks)
  - HTS, PrEP, STI, mental health, dispensing; validations and workflows.
- Phase 3 – Reporting (1–2 weeks)
  - KPIs, dashboards, exports; basic analytics integration.
- Phase 4 – Teleconsultation & integrations (1–2 weeks)
  - Video visits MVP, chat, attachments; SMS/email; FHIR endpoints.
- Phase 5 – UAT, training, and launch (1 week)
  - Test scenarios, fixes, training, cutover plan.

Total MVP: ~8–11 weeks depending on integrations and scope finalization.

## Deliverables
- Production-ready EMR MVP deployed to managed cloud.
- Source code repositories; CI/CD pipelines; environment configs.
- Technical documentation (API specs, ERD, runbooks) and admin manuals.
- Test artifacts (test plan, UAT scripts, coverage summary).
- Training materials (quick-start guides, short videos).
- Data migration plan (if required) and go-live playbook.

## Environments
- Development (feature branches), Preview (per PR), Staging (UAT), Production.
- Role-segregated access; masked data in non-prod; separate credentials.

## Risks and mitigations
- Scope creep → formal change control; feature flags; iterative releases.
- Integration delays → mock adapters; parallel test beds; clear API contracts.
- Data privacy incidents → strict RBAC, encryption, DLP checks, audit alerts.
- Adoption risk → user co-design, training, staged rollouts, feedback loops.
- Connectivity constraints → offline-first patterns for selected workflows (queued sync).

## Assumptions and dependencies
- Stakeholder availability for discovery/UAT.
- Access to SMS/email gateways (credentials, sender IDs).
- Chosen identity provider for SSO/MFA (or local auth initially).
- Hosting for backend/data tier (if not fully managed by vendor).
- Regulatory requirements clarified for target deployment regions.

## Commercials (indicative, to be finalized)
- Time & materials or fixed-scope bid for MVP; licensing is open-source where possible.
- Third-party costs (e.g., SMS, video API, email) billed at provider rates.
- Support and SLA options post go-live (business hours or 24/7 tiers).

## Acceptance criteria
- All MVP features in Scope of work available and verified in Staging and Production.
- Role-based access enforced; audit events captured for all sensitive operations.
- Key KPIs reachable via dashboards; exports function reliably.
- p95 page load < 2.5s on reference device/network; uptime ≥ 99.9% target.
- Security review completed (vulnerability scan + basic penetration test remediation).

## Next steps
1) Confirm scope and module priorities; approve timeline.
2) Select backend stack option and hosting approach.
3) Kick off discovery workshops and finalize UI flows.
4) Execute Phase 0 and update delivery plan with exact dates.

—
Prepared for: TIERs
Prepared by: Implementation Team
Contact: ezekielorogbesan@gmail.com
