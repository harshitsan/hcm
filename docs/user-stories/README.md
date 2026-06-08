# SatelliteHR — User Stories by Role

One file per **named role** from the BRD's role catalog (§5), written as user stories
(`As a <role>, I want <capability>, so that <benefit>`) grouped by functional area, with
acceptance criteria on the key stories and traceability tags back to the BRD / Functional
Spec sections.

## Role design principles (BRD §5.1)
- **Roles ≠ permission sets.** Roles represent *personas*; permissions are composable
  capabilities. The same permission set can back multiple roles.
- **Contextual role assignment.** One *User* (login) may hold **different roles in different
  companies** — see [System User](system-user.md).
- **Workforce-type boundaries.** Employees and contractors have **distinct role catalogs**
  (contractor/vendor roles are Phase 2).
- The platform rests on **User ≠ Employee ≠ Contractor**: access (a User) is separate from a
  workforce record (an Employee/Contractor).

Story IDs follow `US-<CODE>-NN` (the per-role code is shown below).

## The role catalog

### Platform tier (the SatelliteHR provider)
| Role | File | Code | Purpose |
|------|------|------|---------|
| Platform Super Administrator | [platform-super-administrator.md](platform-super-administrator.md) | `PA` | Full control of the platform; provision/suspend companies, jurisdictions, global config, SSO, health/logs. |
| Platform Operations Admin | [platform-operations-admin.md](platform-operations-admin.md) | `POPS` | Operational support without super-admin rights; onboarding help, troubleshooting, logs, assisted imports. |
| Platform Security & Compliance Admin | [platform-security-compliance-admin.md](platform-security-compliance-admin.md) | `PSEC` | Security/audit/compliance governance; cross-tenant audit **metadata only**, no data modification. |

### Portfolio tier (multi-company access)
| Role | File | Code | Purpose |
|------|------|------|---------|
| Portfolio Manager | [portfolio-manager.md](portfolio-manager.md) | `PORT` | Manage many companies from one login; context switch, cross-company reports, standardization. |
| Portfolio HR Operations User | [portfolio-hr-operations-user.md](portfolio-hr-operations-user.md) | `PHRO` | Centralized HR **execution** across assigned companies; no structural master-data ownership by default. |
| Portfolio Read-Only / Auditor | [portfolio-read-only-auditor.md](portfolio-read-only-auditor.md) | `PAUD` | Read-only oversight/audit across portfolio companies; no transactional actions. |

### Group Company tier (affiliated entities)
| Role | File | Code | Purpose |
|------|------|------|---------|
| Group Company Administrator | [group-company-administrator.md](group-company-administrator.md) | `GCA` | Define group relationships, shared locations/policy templates, **explicit + audited** cross-company sharing. |
| Group Reporting Viewer | [group-reporting-viewer.md](group-reporting-viewer.md) | `GRV` | Read-only consolidated reports + cross-company directory search for the group. |

### Company tier (tenant core)
| Role | File | Code | Purpose |
|------|------|------|---------|
| Company Super Administrator | [company-super-administrator.md](company-super-administrator.md) | `CSA` | Ultimate authority in one tenant; config, org structure, role/permission assignment, user provisioning. |
| Company HR Administrator | [company-hr-administrator.md](company-hr-administrator.md) | `HR` | HR ownership without tenant-wide technical control; people, policies, leave/attendance, lifecycle, reports. |
| Company IT / Security Admin | [company-it-security-admin.md](company-it-security-admin.md) | `CIT` | Identity/access/security at company level; user-role assignment, SSO, access audits. |
| Company Finance / Compliance Viewer | [company-finance-compliance-viewer.md](company-finance-compliance-viewer.md) | `CFV` | Read-only view of employee/attendance/leave + compliance/export reports; no HR operations. |

### Managerial (people management)
| Role | File | Code | Purpose |
|------|------|------|---------|
| Department Head / People Manager | [department-head-people-manager.md](department-head-people-manager.md) | `MGR` | Line management of an assigned team; approvals, lifecycle actions, team views. |
| Functional Manager / Project Manager | [functional-project-manager.md](functional-project-manager.md) | `FPM` | Matrix reporting; view functional-group members, approvals limited to scope. |

### Employee
| Role | File | Code | Purpose |
|------|------|------|---------|
| Employee – Standard | [employee-standard.md](employee-standard.md) | `EMP` | Default self-service; profile, leave, attendance, policies, announcements, documents, feedback. |
| Employee – Limited Access | [employee-limited-access.md](employee-limited-access.md) | `EMPL` | Restricted/read-only workers; limited transactions gated by policy. |

### Talent acquisition (pre-hire participants)
| Role | File | Code | Purpose |
|------|------|------|---------|
| Candidate | [candidate.md](candidate.md) | `CAND` | A prospective hire managed in Talent Acquisition before conversion to an employee. |
| Interview Panel Member | [interview-panel-member.md](interview-panel-member.md) | `PANEL` | Participates in hiring; interview scheduling and structured scorecard feedback. |

### Identity layer
| Role | File | Code | Purpose |
|------|------|------|---------|
| System User | [system-user.md](system-user.md) | `SYS` | The generic authenticated identity — auth, multi-company membership, contextual roles, context switching. |

## Personas vs. named roles
The product roadmap collapses this catalog into **7 "personas"** for the prototype UI
(Platform/Provider Admin, Portfolio Manager, Company HR Admin, People Manager, Employee,
Candidate, Interview Panel Member). Those personas are a friendly subset; the files above are
the **full named-role catalog** the personas are built from.

## Phase 2 (not yet authored)
Per BRD §3.2 / Phase II BRD, the **contractor and vendor** role catalog arrives in Phase 2 and
is intentionally **not** included here:
- Contractor – Standard, Contractor – Restricted
- Vendor Administrator, Vendor User / Representative

Other Phase-2 surfaces called out inside the role files where relevant: Payroll, India
statutory compliance enablement (beyond field capture + report templates), and the mobile app.
