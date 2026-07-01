# Audit and Logging — User Stories

_Derived from SatelliteHR Phase I BRD — module "Audit and Logging". 9 user stories._

---

## AUD-01: Audit all Company record actions

**User story:** As a System, I want to automatically record every create, update, delete, and status-change action performed on Company records, so that all changes to mandatory audit entities are traceable.

**Acceptance criteria:**
- Given a Company record is created, updated, deleted, or has its status changed, when the action is committed, then an audit entry is generated for that action.
- Given any Company-level change, when it occurs, then no such change is persisted without a corresponding audit entry.

**Priority:** High
**Source:** FR 6.29.1 (Mandatory Audit Entities — Company)

---

## AUD-02: Audit all Employee record actions

**User story:** As a System, I want to automatically record every create, update, delete, and status-change action performed on Employee records, so that changes to employee data are fully accountable.

**Acceptance criteria:**
- Given an Employee record is created, updated, deleted, or has its status changed, when the action is committed, then an audit entry is generated for that action.
- Given an Employee status change (e.g. active to inactive), when it occurs, then the action type is captured as a status-change in the audit trail.

**Priority:** High
**Source:** FR 6.29.1 (Mandatory Audit Entities — Employee)

---

## AUD-03: Capture complete audit data fields

**User story:** As a Company/HR Admin, I want each audit entry to capture the entity type, record identifier, and affected field/attribute, so that I can pinpoint exactly what was changed and where.

**Acceptance criteria:**
- Given an audited action occurs, when the audit entry is written, then it records the entity type, the record identifier, and the field/attribute affected.
- Given a change touches multiple fields, when the audit entry is written, then each changed field/attribute is represented.

**Priority:** High
**Source:** FR 6.29.2 (Audit Data)

---

## AUD-04: Capture before-and-after values

**User story:** As a Company/HR Admin, I want each audit entry to record the previous value and the new value for a changed field, so that I can see the exact transition that took place.

**Acceptance criteria:**
- Given a field value is updated, when the audit entry is written, then it stores both the previous value and the new value.
- Given a record is created, when the audit entry is written, then the previous value reflects that no prior value existed.

**Priority:** High
**Source:** FR 6.29.2 (Audit Data — previous/new value)

---

## AUD-05: Capture actor, timestamp, and action type

**User story:** As a Company/HR Admin, I want each audit entry to record the timestamp, the user/actor responsible, and the action type, so that I can attribute every change to a who, when, and what.

**Acceptance criteria:**
- Given an audited action occurs, when the audit entry is written, then it records the timestamp, the user/actor who performed it, and the action type (create, update, delete, status-change).
- Given an action performed by an automated process, when the audit entry is written, then the actor is still identifiable.

**Priority:** High
**Source:** FR 6.29.2 (Audit Data — timestamp, user/actor, action type)

---

## AUD-06: Active audit retention for one year

**User story:** As a Platform Admin, I want audit records retained in active storage for one year, so that recent change history is readily available for review.

**Acceptance criteria:**
- Given an audit entry is created, when one year has not yet elapsed, then the entry remains available in active retention.
- Given an audit entry, when it is queried within the active retention window, then it is returned without needing archival access.

**Priority:** Medium
**Source:** FR 6.29.3 (Retention — 1 year active)

---

## AUD-07: Archive audit records for seven years total

**User story:** As a Platform Admin, I want audit records archived so that the total retention reaches seven years, so that the platform meets long-term compliance and audit obligations.

**Acceptance criteria:**
- Given an audit entry has exceeded the one-year active window, when retention is processed, then the entry is moved to archival storage rather than deleted.
- Given an archived audit entry, when it is older than seven years total, then it becomes eligible for disposal.

**Priority:** Medium
**Source:** FR 6.29.3 (Retention — 7 years total with archival)

---

## AUD-08: View record-level change history

**User story:** As an authorized Company/HR Admin, I want an in-application utility to view the chronological change history for a specific record, so that I can review how that record evolved over time without leaving the application.

**Acceptance criteria:**
- Given I am an authorized user viewing a specific record, when I open the change-history utility, then I see its changes listed in chronological order.
- Given a record's history is displayed, when I inspect an entry, then I can see the field changed, previous and new values, timestamp, and actor.
- Given I am not authorized, when I attempt to view record-level history, then access is denied.

**Priority:** Medium
**Source:** FR 6.29.4 (Record-Level History)

---

## AUD-09: Secure, tamper-resistant, tenant-isolated logs

**User story:** As a Platform Admin, I want audit logs to be tamper-resistant with role-based access and tenant boundary enforcement, so that audit data remains trustworthy and isolated per tenant.

**Acceptance criteria:**
- Given an audit log entry exists, when any actor attempts to modify or delete it, then the log resists tampering and the attempt is prevented.
- Given a user requests audit data, when access is evaluated, then it is granted only per their role-based permissions.
- Given a user belongs to one tenant, when they query audit logs, then they can only access audit data within their own tenant boundary.

**Priority:** High
**Source:** FR 6.29.5 (Security — tamper-resistance, RBAC, tenant boundary)
