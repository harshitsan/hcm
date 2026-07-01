# SatelliteHR — System, Roles & Cross-Cutting Requirements

_System-specific and role-specific requirements shared across all functional modules (from the SatelliteHR Phase I BRD): multi-tenant model, actor/role definitions, cross-module business rules, and non-functional requirements._

---

## 4. Product Context: Multi-Tenant SaaS Model

`SatelliteHR` operates as a shared SaaS platform serving multiple client companies. The system distinguishes between:

### 4.1 Platform-Level Administration

Managed by the HRMS provider, including:
- provisioning companies
- managing supported jurisdictions
- defining global groups where applicable
- managing platform-wide configurations
- enabling authentication methods and identity integrations
- monitoring tenant onboarding and support

### 4.2 Portfolio-Level Administration

Managed by authorized portfolio managers or shared services teams, including:
- administering multiple companies within an assigned portfolio
- switching operational context between authorized companies without repeated authentication
- reusing common setup patterns, policies, and administrative processes across managed companies
- overseeing cross-company administration and reporting subject to security controls

### 4.3 Group-Company Administration

Managed by authorized group-company administrators for affiliated entities, including:
- defining and maintaining group-company relationships
- overseeing related companies within an approved group structure
- enabling consolidated visibility and governance across affiliated companies subject to authorization

### 4.4 Company-Level Administration

Managed by authorized company administrators and HR teams, including:
- maintaining company details
- defining departments, positions, groups, and locations
- managing employees
- applying policies and workflows
- assigning roles and permissions
- running reports and bulk data operations

### 4.5 Tenant Isolation

Each company's business data must be logically isolated from others, except where explicitly enabled through:
- multi-company user access
- portfolio-based administration
- group-company relationships

A company may either:
- operate independently as a standalone company
- belong to a group-company structure of related parties
- be managed by an external provider through a portfolio construct

A company shall not belong to more than one portfolio or more than one group-company structure at the same time.

---

## 5. Actor and Role Definitions

### 5.1 Role Design Principles

1. **Separate Roles from Permission Sets** - Roles represent personas; permissions represent composable capabilities. The same permission set can be assigned to multiple roles.

2. **Support Contextual Role Assignment** - A single user may hold different roles in different companies.

3. **Enforce Workforce-Type Boundaries** - Employees and contractors have distinct role catalogs.

---

### 5.2 Platform-Level Roles (HRMS Provider)

| Role | Purpose | Key Capabilities |
|------|---------|------------------|
| **Platform Super Administrator** | Full control of the SatelliteHR platform | Create, provision, suspend companies; define jurisdictions catalog; platform-wide configurations; manage global groups; configure SSO providers; view platform health and logs |
| **Platform Operations Admin** | Operational support without full super-admin rights | Tenant onboarding support; configuration troubleshooting; view logs and audit trails; assist with data imports under approval |
| **Platform Security & Compliance Admin** | Security, audit, and compliance governance | View audit logs across tenants (metadata-level only); manage security policies and password rules; support compliance inquiries; no transactional data modification |

---

### 5.3 Portfolio-Level Roles (Multi-Company Access)

| Role | Purpose | Key Capabilities |
|------|---------|------------------|
| **Portfolio Manager** | Primary role for shared services teams managing multiple companies | Access multiple authorized companies; switch company context without re-login; perform company-level admin tasks (as permitted); run cross-company portfolio reports; enforce standardization across portfolio companies |
| **Portfolio HR Operations User** | Centralized HR execution role | Employee lifecycle execution across companies; leave, onboarding, exits; operational reporting across assigned companies; no structural master data ownership unless granted |
| **Portfolio Read-Only / Auditor** | Oversight, audit, or leadership visibility | Read-only reporting across portfolio companies; view policy alignment and compliance status; no transactional actions |

---

### 5.4 Group Company Roles (Affiliated Entity Management)

| Role | Purpose | Key Capabilities |
|------|---------|------------------|
| **Group Company Administrator** | Governance of affiliated companies | Define group-company relationships; manage shared locations (if enabled); configure shared administrative constructs; oversee cross-company sharing approval |
| **Group Reporting Viewer** | Consolidated visibility for group leadership | View consolidated reports across group companies; cross-company employee directory search; no transactional or configuration rights |

---

### 5.5 Company-Level Roles (Tenant Core Roles)

| Role | Purpose | Key Capabilities |
|------|---------|------------------|
| **Company Super Administrator** | Ultimate authority within a tenant | Company setup and configuration; organizational structures; role and permission assignment; policy configuration; user provisioning; reporting and data operations |
| **Company HR Administrator** | HR ownership without tenant-wide technical control | Employee management; policy administration; lifecycle workflows; leave and attendance administration; HR reporting |
| **Company IT / Security Admin** | Identity, access, and security at company level | User-role assignment; SSO and authentication configuration; access audits |
| **Company Finance / Compliance Viewer** | Audit, compliance, statutory reporting | View employee, attendance, leave data; compliance and export reports; no HR operations access |

---

### 5.6 Managerial Roles (People Management)

| Role | Purpose | Key Capabilities |
|------|---------|------------------|
| **Department Head / People Manager** | Line management responsibilities | View assigned team members; approve leave, attendance, onboarding steps; participate in performance workflows; initiate lifecycle actions |
| **Functional Manager / Project Manager** | Matrix reporting scenarios | View employees in assigned functional groups; approval rights limited to scope |

---

### 5.7 Employee Roles

| Role | Purpose | Key Capabilities |
|------|---------|------------------|
| **Employee – Standard** | Default employee self-service | View and update personal profile; submit leave requests; view attendance; access announcements and documents; participate in feedback workflows |
| **Employee – Limited Access** | Workers with restricted access | Read-only access; limited transactions based on policy |

---

### 5.8 Candidate

A prospective employee managed through the talent acquisition module prior to conversion.

### 5.9 Interview Panel Member

A user participating in the talent acquisition process through panel membership, interview scheduling, and feedback submission.

### 5.10 System User

A generic authenticated identity in the platform. A user may:
- belong to one or more companies
- be mapped to an employee, both across separate companies, or neither
- hold different roles in different companies

---

## 7. Cross-Module Business Rules

1. `User`, `Employee`, and `Contractor` are distinct concepts.
2. A user may belong to multiple companies.
3. Authorized portfolio managers may administer multiple companies through a single login and switch company context without repeated authentication.
4. An employee record is always company-specific.
5. If the same physical person works in multiple companies as an employee, separate employee records must exist in each company.
6. The same physical person may be an employee in one company and a contractor in another company at the same time.
7. An employee or contractor may exist without being a user.
8. An employee must belong to at least one department and has one position.
9. A position belongs to one department.
10. An employee belongs to one jurisdiction and may operate across one or more locations.
11. A company may operate across multiple jurisdictions.
12. Locations are company-specific by default; shared locations allowed among related companies through group-company relationships.
13. Groups and Departments support n-level hierarchy.
14. Policies may apply to one, multiple, or all supported applicability dimensions.
15. Data access must always respect tenant boundaries and authorized cross-company access rules.

---

## 8. Non-Functional Requirements

### 8.1 Performance

1. **Response Times** - Sub 2-second response for standard user interactions (page loads, forms, searches, navigation).

2. **Large Tenant Benchmark** - Up to 1000 employees with sub 2-second response times.

3. **Report Generation** - Standard reports within 30 seconds (up to 1000 records); large reports within 2 minutes (1000-10,000 records).

4. **Import/Export** - Files up to 1000 records within 1 minute; files up to 10,000 records within 5 minutes.

5. **Concurrency** - Up to 20% of total employee count during peak hours; burst traffic up to 2x normal load.

---

### 8.2 Scalability

1. The system shall support companies with thousands of users.
2. No defined platform limit on users per company or companies per portfolio.

---

### 8.3 Availability and Uptime

1. **Availability Targets** - 99.99% uptime for critical services; 99.95% for standard services; 99.9% for background services.

2. **Multi-Region Architecture** - Active-Passive with rapid failover (within 5 minutes); asynchronous cross-region replication.

3. **Maintenance Windows** - Maximum once per month, 4 hours duration, Sunday 2:00-6:00 AM IST, with 7 days advance notice.

---

### 8.4 Disaster Recovery and Backup

1. **RTO** - 4 hours for critical services; 8 hours for standard services.

2. **RPO** - 15 minutes for critical data; 1 hour for standard data.

3. **Backup Strategy** - Continuous transaction log streaming, hourly incremental backups, daily full backups (30 days retention), weekly system backups (90 days), monthly archival (7 years).

4. **DR Testing** - Quarterly tabletop exercises, bi-annual failover tests, monthly automated backup restoration tests.

---

### 8.5 Data Residency

1. For primary target customers in India, customer data shall reside in India unless otherwise contractually agreed.

---

### 8.6 Security, Compliance and Statutory Coverage

#### 8.6.1 Compliance Certifications

1. **ISO 27001** - Platform designed to support compliance.
2. **SOC 2** - Type I for Phase 1; Type II for future phase.
3. **GDPR and DPDP** - GDPR ready; support for India's Digital Personal Data Protection Act obligations.

#### 8.6.2 Data Encryption

1. **Encryption at Rest** - All sensitive data (PII, credentials, audit logs) encrypted using AES-256.
2. **Encryption in Transit** - TLS 1.2 or higher for all data transmission.
3. **Backup Encryption** - All backups encrypted.

#### 8.6.3 Secure Development

1. **Secure SDLC** - Security requirements in design, secure coding practices, security-focused code reviews.
2. **Vulnerability Management** - Regular assessments, timely patching, disclosure and remediation processes.
3. **Penetration Testing** - Application, infrastructure, and API testing with prioritized remediation.
4. **Security Monitoring** - Event monitoring, anomaly detection, and incident response procedures.

---

### 8.7 Data Governance and Retention

#### 8.7.1 Retention Rules

| Data Type | Retention Period |
|-----------|------------------|
| Employee/Contractor (Active) | Duration of employment + 7 years |
| Audit Logs | 1 year active + 6 years archived |
| Completed Workflows | 7 years |
| Notifications | 1 year |
| Candidates (Rejected) | 1 year |
| Candidates (Inactive) | 6 months |

#### 8.7.2 Deletion and Anonymization

1. **Terminated Employees** - User account disabled immediately; record active for 30 days (exit processing); anonymized after 30 days; permanent deletion after 7 years.

2. **Anonymization Standards** - Direct identifiers replaced with pseudonyms; indirect identifiers retained for reporting; one-way hashing for unique identifiers.

3. **Data Purge** - Automated monthly purge with legal hold suspension capability.

#### 8.7.3 Data Subject Rights (DPDP/GDPR)

1. **Right to Access** - Complete data copy in machine-readable format within 30 days.
2. **Right to Rectification** - Self-service for non-sensitive fields; workflow-based for sensitive fields.
3. **Right to Erasure** - Deletion or anonymization with statutory exception handling.
4. **Operational Support** - Self-service portal, identity verification, request tracking, SLA monitoring, and DPO support.

---

### 8.8 Search and Usability

1. **Global Search** - Across Employees, Candidates, and Document names (respecting tenant boundaries).

2. **User Experience** - Recently viewed records (default 10); custom fields included in search.

---

### 8.9 Localization

1. **Language** - English only for Phase 1.

2. **Locale Formats** - Configurable date, number, currency, and address formats at company or jurisdiction level.

---

### 8.10 Integrations and APIs

#### 8.10.1 Integration Scope

1. **External Integrations** - Authentication providers (SAML, AD, Office 365, Google Apps) only for Phase 1.

2. **API-First Architecture** - React frontend, .NET Core backend, PostgreSQL database; all UI functionality exposed via RESTful APIs with OAuth 2.0/JWT authentication; OpenAPI/Swagger documentation.

3. **Webhooks** - Configurable at company level for events: employee lifecycle, leave requests, attendance exceptions, workflow changes, document uploads; with signature verification and HTTPS requirements.
