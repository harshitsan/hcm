# Platform Security & Compliance Admin — User Stories

> The Platform Security & Compliance Admin is an HRMS-provider (platform-level) persona responsible for security, audit, and compliance governance across all tenants on SatelliteHR. They set the platform's security baselines (password rules, MFA standards), monitor security events and anomalies, oversee metadata-level audit trails across tenants, and coordinate compliance and data-subject-rights inquiries (ISO 27001 / SOC 2 / GDPR / DPDP) — without ever performing transactional HR work or reading tenant PII contents (BRD §5.2, §6.29, §8.6, §8.7).

## Scope & access

- **Authority level:** Platform-wide **security & compliance governance**. They are **read-only on tenant business/HR data** and **metadata-only on cross-tenant audit**, but they DO own the **configuration of platform security baselines** (password / MFA / session policy) and their own **security & compliance governance records** (security-incident tracking, data-subject-rights tracking). They never run tenant HR operations or read tenant PII contents (BRD §5.2, §8.6.3, §8.7.3).
- **What they CAN do:**
  - View audit logs and access/change-history records across tenants at **metadata level only** — entity type, record identifier, actor, action type, timestamp, success/failure (BRD §6.29.2, §8.6; FS §8.1). They see *that* a change occurred, *who* did it, and *when* — not the PII field contents.
  - Define and maintain platform-level **security policies, password rules, and MFA standards** that establish the baseline tenants inherit (BRD §6.12.5, §8.6.3; FS §3.1.4 COMP-FR-014).
  - Monitor **security events, anomalies, and incident signals** (failed logins, impersonation usage, cross-company access attempts, context-switch denials) (BRD §8.6.3; FS §7.2).
  - Support **compliance inquiries and audit readiness** for ISO 27001, SOC 2, GDPR, and DPDP, including evidence packs of audit metadata, retention configuration, and encryption posture (BRD §8.6.1, §8.7).
  - **Coordinate data-subject-rights (DSR)** requests (access, rectification, erasure) as a DPO-support function — tracking, SLA monitoring, and verification of execution — without personally performing the data edits or extracts (BRD §8.7.3).
  - Verify retention, anonymization, purge schedules, and legal-hold posture across tenants (BRD §8.7.1, §8.7.2).
- **Explicit BOUNDARIES (what they CANNOT do):**
  - **No modification of tenant business/HR data** — cannot create/edit/delete employees, leave, attendance, HR policies, documents, or any tenant HR records (BRD §5.2). *(Maintaining their own security & compliance governance records — security-incident tracking, DSR request tracking, and the platform security baselines — is within remit and is distinct from tenant business data.)*
  - **Cannot read tenant PII contents** — audit access is metadata-only; record-level previous/new *values* containing PII are out of bounds for this role (BRD §6.29.2, §8.6).
  - **Cannot provision, edit, suspend, activate, or delete companies** — that is Platform Super Administrator / Platform Operations authority (FS §7.1).
  - **Cannot create portfolios or group-company structures**, manage tenant memberships, or run HR operations (FS §7.1).
  - **Cannot assign tenant business roles or provision HR users**; their configuration authority is limited to platform security baselines, not tenant role catalogs.
  - **Cannot tamper with audit logs** — logs are immutable/tamper-resistant; this role consumes and attests to them, never alters them (BRD §6.29.5).

## User stories

### Audit log oversight (metadata-level)

- **US-PSEC-01** — As a Platform Security & Compliance Admin, I want to view audit trails across all tenants at metadata level (entity type, record id, actor, action type, timestamp), so that I can confirm critical actions are being captured platform-wide. (BRD §6.29.1, §6.29.2)
  - **Acceptance criteria:**
    - **Given** I am authenticated with the Platform Security & Compliance Admin role,
    - **When** I open the cross-tenant audit view,
    - **Then** I see audit entries from any tenant showing entity type, record identifier, actor, action type, timestamp, and success/failure — **and** the previous-value/new-value fields containing PII are masked or withheld.
- **US-PSEC-02** — As a Platform Security & Compliance Admin, I want to filter audit metadata by tenant, actor, action type, and date range, so that I can investigate a specific security or compliance question efficiently. (BRD §6.29.2)
- **US-PSEC-03** — As a Platform Security & Compliance Admin, I want to confirm that audit logs are immutable and tamper-resistant, so that I can attest to log integrity during certification audits. (BRD §6.29.5)
  - **Acceptance criteria:**
    - **Given** an audit record exists,
    - **When** I attempt any edit or delete on it (directly or via API),
    - **Then** the action is denied and the denial itself is recorded, demonstrating tamper resistance.
- **US-PSEC-04** — As a Platform Security & Compliance Admin, I want to verify that the mandatory audit entities (Company, Employee) log all create/update/delete/status-change actions, so that audit coverage meets the compliance baseline. (BRD §6.29.1)
- **US-PSEC-05** — As a Platform Security & Compliance Admin, I want to review impersonation ("login as user") events platform-wide, so that I can ensure every support impersonation is justified and fully logged. (BRD §6.12.4)
  - **Acceptance criteria:**
    - **Given** an authorized support user impersonated another user,
    - **When** I review the impersonation audit feed,
    - **Then** I see the impersonator, the impersonated identity, the company context, start/end time, and actions taken under impersonation — at metadata level.
- **US-PSEC-06** — As a Platform Security & Compliance Admin, I want to review cross-company access and context-switch events (including denials such as AUTH_002), so that I can confirm tenant isolation is holding across the platform. (FS §7.2, §8.1; BRD §6.12.6)

### Security policy & access-control governance

- **US-PSEC-07** — As a Platform Security & Compliance Admin, I want to define the platform-wide password policy baseline (complexity, rotation, reuse, lockout), so that every tenant inherits a compliant default. (BRD §6.12.5, §8.6.3; FS §3.1.4)
  - **Acceptance criteria:**
    - **Given** I set the platform password baseline,
    - **When** a new company is provisioned,
    - **Then** it inherits the baseline password policy as its default security configuration, and my change is recorded in the audit trail.
- **US-PSEC-08** — As a Platform Security & Compliance Admin, I want to define platform MFA standards (e.g., MFA required for privileged roles), so that authentication strength is governed consistently while tenants configure MFA at company level. (BRD §6.12.5; FS §3.1.4 COMP-FR-014)
- **US-PSEC-09** — As a Platform Security & Compliance Admin, I want to set session-timeout and session-security defaults at platform level, so that idle and stale sessions are bounded across all tenants. (FS §3.1.4)
- **US-PSEC-10** — As a Platform Security & Compliance Admin, I want my security-policy changes to be logged with previous and new values, so that there is a defensible record of every baseline change for auditors. (BRD §6.29.2, §8.6.3)
- **US-PSEC-11** — As a Platform Security & Compliance Admin, I want to review which authentication methods (SAML, AD, O365, Google, Local) are enabled across tenants, so that I can flag weak or non-compliant authentication configurations. (BRD §6.1.1; FS §3.1.4)
- **US-PSEC-12** — As a Platform Security & Compliance Admin, I want to review delegation configurations platform-wide at metadata level, so that I can ensure approval-authority delegation does not create segregation-of-duties risks. (BRD §6.12.3)

### Security monitoring & anomaly detection

- **US-PSEC-13** — As a Platform Security & Compliance Admin, I want a security-event monitoring view of authentication anomalies (repeated failed logins, unusual login geographies/times), so that I can detect potential account compromise early. (BRD §8.6.3)
  - **Acceptance criteria:**
    - **Given** authentication audit logs are being captured (BRD §6.1.6),
    - **When** failed-login attempts for an identity exceed a configured threshold,
    - **Then** the event surfaces in my security-event view as an anomaly with actor, tenant, and timestamp metadata.
- **US-PSEC-14** — As a Platform Security & Compliance Admin, I want to be alerted to anomalous cross-tenant or cross-company access patterns, so that I can investigate possible isolation breaches. (BRD §8.6.3; FS §7.2)
- **US-PSEC-15** — As a Platform Security & Compliance Admin, I want to track spikes in impersonation or bulk export/import activity, so that I can identify abuse of privileged support capabilities. (BRD §6.12.4, §6.24)
- **US-PSEC-16** — As a Platform Security & Compliance Admin, I want to record and track security incidents and their response status, so that incident-response procedures are documented for SOC 2 evidence. (BRD §8.6.3)
- **US-PSEC-17** — As a Platform Security & Compliance Admin, I want to verify the platform's encryption posture (AES-256 at rest, TLS 1.2+ in transit, encrypted backups), so that I can attest to encryption controls during certification. (BRD §8.6.2)

### Compliance & certification support

- **US-PSEC-18** — As a Platform Security & Compliance Admin, I want to assemble audit-metadata evidence packs for ISO 27001 and SOC 2 reviews, so that external auditors receive consistent, scoped evidence. (BRD §8.6.1)
  - **Acceptance criteria:**
    - **Given** an upcoming certification review,
    - **When** I generate an evidence pack for a defined scope and date range,
    - **Then** the pack contains audit metadata, security-policy configuration, encryption posture, and retention settings — with no raw tenant PII included.
- **US-PSEC-19** — As a Platform Security & Compliance Admin, I want to verify retention configuration against the platform retention rules (audit logs 1yr active + 6yr archived, completed workflows 7yr, etc.), so that data is retained and archived per policy. (BRD §8.7.1; FS §8.2)
- **US-PSEC-20** — As a Platform Security & Compliance Admin, I want to confirm anonymization and monthly purge jobs are running (including the 30-day post-termination anonymization rule), so that personal data is minimized per GDPR/DPDP. (BRD §8.7.2)
  - **Acceptance criteria:**
    - **Given** an employee was terminated more than 30 days ago,
    - **When** I review the anonymization/purge status for that tenant,
    - **Then** I can confirm (at metadata level) that the record was anonymized on schedule, without viewing the underlying PII.
- **US-PSEC-21** — As a Platform Security & Compliance Admin, I want to verify legal-hold suspension is applied where required, so that purge does not delete data under retention obligation. (BRD §8.7.2)
- **US-PSEC-22** — As a Platform Security & Compliance Admin, I want to confirm data-residency configuration (India data residency unless contractually agreed otherwise), so that residency commitments are demonstrably met. (BRD §8.5)
- **US-PSEC-23** — As a Platform Security & Compliance Admin, I want to respond to compliance inquiries with read-only, scoped reports, so that I can support audits without acquiring transactional capabilities. (BRD §5.2, §8.6.1)

### Data-subject-rights (DSR) coordination

- **US-PSEC-24** — As a Platform Security & Compliance Admin, I want to log, track, and SLA-monitor data-subject-rights requests (access, rectification, erasure), so that DPDP/GDPR responses are completed within the 30-day window. (BRD §8.7.3)
  - **Acceptance criteria:**
    - **Given** a data-subject-rights request is registered,
    - **When** I view the DSR tracker,
    - **Then** I see request type, identity-verification status, owning tenant, SLA clock, and current status — and I can escalate if the SLA is at risk.
- **US-PSEC-25** — As a Platform Security & Compliance Admin, I want to confirm identity verification was performed before a DSR is fulfilled, so that data is not disclosed or erased on an unverified request. (BRD §8.7.3)
- **US-PSEC-26** — As a Platform Security & Compliance Admin, I want to verify (at metadata level) that a Right-to-Erasure request resulted in deletion or anonymization with statutory exceptions honored, so that erasure obligations are met without losing legally required records. (BRD §8.7.3, §8.7.2)
- **US-PSEC-27** — As a Platform Security & Compliance Admin, I want to coordinate the DPO-support workflow (routing requests to the tenant data owner who performs the actual edit/extract), so that the data action is executed by an authorized operator and not by me. (BRD §8.7.3, §5.2)
- **US-PSEC-28** — As a Platform Security & Compliance Admin, I want a tamper-evident record of every DSR's lifecycle, so that we can demonstrate compliant handling to a regulator. (BRD §8.7.3, §6.29.5)

## Primary journeys

1. **Certification audit readiness (ISO 27001 / SOC 2).** Auditor requests evidence → Admin scopes a date range and control area → pulls audit metadata, security-policy baselines, encryption posture, and retention configuration → assembles a PII-free evidence pack → delivers to the auditor and records the evidence request in the audit trail.
2. **Security anomaly investigation.** Monitoring view flags repeated failed logins and an unusual cross-company access pattern → Admin drills into audit metadata filtered by actor, tenant, and time → correlates with impersonation events → opens a security-incident record, tracks response, and (if warranted) tightens the MFA/password baseline.
3. **Data-subject-rights request (erasure).** DSR registered → Admin confirms identity verification → routes the execution to the authorized tenant data owner → SLA-monitors the 30-day clock → verifies at metadata level that anonymization/deletion completed with statutory exceptions honored → closes the request with a tamper-evident lifecycle record.
4. **Security baseline hardening.** Admin reviews enabled auth methods and password/MFA settings across tenants → identifies a weak default → updates the platform password and MFA baseline → confirms new companies inherit it on provisioning → the change is logged with previous/new values for audit.

## Notes & Phase 2

- **Phase 2 deferrals (clearly marked):**
  - **India statutory compliance enablement** (PF/ESI/PT registers, eligibility, statutory dashboards/alerts) is Phase 2 (BRD §3.2; Phase II BRD §5). This role does *not* own statutory-filing or labor-law compliance in Phase 1 — note that Phase 1 reporting still ships PF/ESIC eligibility and statutory-register *templates* only (BRD §6.23.5).
  - **SOC 2 Type II** is a future phase; Phase 1 targets **SOC 2 Type I** (BRD §8.6.1). Plan evidence collection accordingly.
  - **The ESI statutory-forms list in the Phase II source is corrupted/placeholder** (~196 duplicate entries) and must be re-sourced from statute and validated by a compliance expert before any Phase 2 compliance build — flag, do not build from it (Roadmap Gap 1b / D1).
  - DSR **self-service portal** automation matures alongside the broader self-service and (Phase 2) mobile surfaces; Phase 1 DSR coordination is largely workflow- and tracker-driven (BRD §8.7.3).
- **Cross-cutting dependencies:**
  - **Audit & logging** (BRD §6.29) is the primary data source for this role — its metadata-only exposure, tamper resistance, and retention are foundational. PII masking on previous/new values is a hard prerequisite for this role's audit access.
  - **RBAC** (BRD §6.12) must enforce that this role is read-only on business data and metadata-only on audit, with zero write/transactional/provisioning capability.
  - **Tenant isolation** (BRD §4.5; FS §7.2) governs cross-tenant visibility — this role sees across tenants for governance, but only metadata, and every cross-company access is itself audited.
  - **Workflow engine** (BRD §6.25) underpins DSR routing, incident tracking, and escalation SLAs.
  - **Notifications** (BRD §6.27) deliver anomaly alerts, SLA reminders, and escalation alerts to this role.
