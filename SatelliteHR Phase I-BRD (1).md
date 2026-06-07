# Business Requirements Document (BRD)

## SatelliteHR

## 1. Overview

`SatelliteHR` is a multi-tenant SaaS Human Resource Management System (HRMS) intended to support multiple companies on a shared platform while preserving tenant-level data isolation, security, configurability, and operational flexibility.

The platform is designed to serve organizations operating across multiple jurisdictions, locations, departments, and workforce types, including employees and contractors. It supports centralized administration by the HRMS provider, while allowing each subscribing company to manage its own organizational structure, workforce records, policies, workflows, and access controls. It also supports cross-company operating models in which portfolio managers or shared services teams administer multiple companies from a single login session and switch context between authorized companies without repeated login and logout actions.

A core design principle of `SatelliteHR` is the separation of:
- `User identity` for system access
- `Employee records` for workforce management
- `Contractor records` for contingent workforce management

This enables scenarios where:
- one user can access multiple companies
- an employee may exist without being a user
- a contractor may exist without being a user
- the same physical person may be an employee in one company and a contractor in another company through separate records

The system is intended to cover the full employee and contractor lifecycle, from talent acquisition and onboarding to leave, attendance, performance, exits, self-service, reporting, and data migration.

---

## 2. Business Objectives

The objectives of `SatelliteHR` are to:

1. Provide a secure multi-tenant HRMS platform for multiple client companies.
2. Support an operating hierarchy of `Platform > Portfolio > Group Company > Company`, while also supporting customers that operate only at the standalone company level.
3. Enable each company to maintain its own HR structure, master data, policies, and workforce records.
4. Support replication of company setup, master data, policies, and related configuration to new companies in order to accelerate onboarding and reduce repetitive manual setup.
5. Support shared operating models where multiple companies within a group can reuse common policies, structures, and setup patterns while still preserving company-level control where needed.
6. Enable shared services organizations providing HR services to multiple companies to manage all entities under their portfolio efficiently through a single platform.
7. Enable portfolio managers to administer multiple authorized companies through one user identity and one login session.
8. Support seamless switching of company context for authorized portfolio managers and other multi-company users without repeated login and logout.
9. Support a wide range of workforce models, including employees, vendors, and contractors.
10. Support operations across multiple jurisdictions with varying business, compliance, tax, and policy needs.
11. Provide configurable workflows for recruitment, onboarding, lifecycle events, self-service, and contractor management.
12. Allow users to operate across multiple companies when authorized.
13. Enable policy enforcement and security controls based on company, jurisdiction, location, department, group, and employment type.
14. Support imports and exports for migration, integration, and operational reporting.
15. Support commercial packaging and pricing based on number of companies, number of employees, and subscribed modules.
16. Provide a scalable foundation for future HR modules and advanced case management capabilities.

---

## 3. Scope

### 3.1 In Scope – Phase 1 Modules and Capabilities

Phase 1 of SatelliteHR includes the following modules and platform capabilities, grouped by functional domain.

#### A. Platform Access, Identity, and Security

- **User Authentication** - Authentication via SAML, Active Directory, Office 365, Google Apps, or local credentials; support for multi-company users and secure company-context switching.
- **Roles and Security (RBAC)** - Role-based access control across platform, portfolio, group-company, and company levels; delegation, impersonation (audited), and multi-factor authentication.
- **Audit and Logging** - Immutable audit trails for critical entities and actions, record-level change history, and compliance-grade audit retention.

#### B. Multi-Company Operating Model

- **Portfolio Management** - Administration of multiple companies under an authorized portfolio; portfolio-scoped roles, cross-company operational execution, context switching, and portfolio-level reporting subject to role-based constraints.
- **Group Company Management** - Definition and governance of affiliated companies; shared administrative constructs, shared or referenced locations, and opt-in consolidated reporting across group companies with explicit authorization and auditability.
- **Companies** - Tenant company provisioning, lifecycle management, commercial subscription configuration, archival, and export on exit.

#### C. Organizational and Master Data Management

- **Jurisdictions** - Configurable catalog of operational jurisdictions supporting policy applicability and statutory compliance enablement.
- **Locations** - Physical and logical operating locations, including shared location referencing across group companies where explicitly configured.
- **Groups** - Logical groupings for policy eligibility, access control, and reporting, including global and company-specific hierarchical groups.
- **Departments** - Organizational hierarchy with department heads, approval routing, and reporting applicability.
- **Positions** - Role positions mapped to departments, used across recruitment, onboarding, reporting, and lifecycle processes.

#### D. Workforce Management

- **Employees** - Employee master records, lifecycle tracking, and reporting.

#### E. Policy and Compliance Enablement

- **Policy Management** - Configurable HR and business policies with versioning, effective dating, and applicability by company, jurisdiction, location, department, group, and workforce type.
- **Policy Distribution and Acknowledgment** - Policy distribution to employees, acknowledgment tracking, reminders, escalations, and compliance reporting.

#### F. Workflow and Process Automation

- **Workflow Engine** - Configurable workflow engine supporting sequential and parallel approvals, conditional routing, SLA tracking, escalations, delegation, and full auditability across all applicable modules.

#### G. Talent, Lifecycle, and Workforce Operations

- **Talent Acquisition** - Job requisitions, candidate management, interview management with scorecards, offer workflows, and conversion to employee.
- **Employee Lifecycle Management** - Onboarding, probation confirmation, performance workflows, transfers, exits, and knowledge transfer.
- **Task/Checklist Management** - Reusable task templates for employee lifecycle events. See `SatelliteHR-TaskChecklist-BRD.md` for detailed specifications.
- **HR Letters and Certificates** - Generation and management of appointment letters, confirmation letters, transfer letters, experience certificates, and other HR correspondence.
- **Employee Self-Service** - Web-based self-service for employees (role- and policy-controlled).
- **Leave Management** - Configurable leave policies, statutory and non-statutory leave types, balances, approvals, overrides, calendar views, and reporting.
- **Time and Attendance** - Attendance capture, shifts and rosters, overtime tracking, exception workflows, and statutory working-hours compliance enablement.
- **Feedback and Grievance** - Structured submission, review, status tracking, and auditability for Phase 1 feedback and grievance needs.
- **Employee Asset Management** - Asset assignment, lifecycle tracking, acknowledgements, integration with onboarding and exit workflows, and reporting.
- **Employee Directory and Org Chart** - Centralized employee directory with organizational hierarchy visualization, advanced search capabilities, and cross-company directory search for group company structures.

#### H. Data, Documents, and Extensibility

- **Documents and Attachments** - Secure document storage and attachment management across supported entities, including metadata, expiry tracking, and role-based access.
- **Data Management (Import / Export)** - Bulk data migration, sandbox validation, rollback-safe imports, exports, and operational data exchange.
- **Data Model Extensibility (Custom Fields)** - Platform-level and company-level custom fields with validation, workflow, reporting, API, and import/export integration.

#### I. Reporting, Analytics, and Communications

- **Reporting and Analytics** - Standard operational and compliance reports, dashboards, ad-hoc reporting, scheduled reports, and consolidated reporting (portfolio and group-company) with strict security controls.
- **Notifications and Communications** - Event-driven and scheduled notifications via email (mandatory) and optional in-app channels, with templating, branding, escalation alerts, and user preferences.

---

### 3.2 Moved to Phase II

The following modules have been moved from Phase I to Phase II. Detailed specifications are documented in `SatelliteHR Phase II-BRD.md`.

- **Vendors and Contractors** - Vendor management, multiple contractor engagement models, contractor lifecycle workflows, and vendor assignment history.
- **Compliance Enablement (India)** - Statutory data capture, eligibility determination, policy configuration, workflow enablement, registers, compliance dashboards, alerts, and reporting for Indian labor laws.
- **Payroll Management** - Payroll computation, statutory deductions, disbursement, payslip generation, and payment processing.
- **Mobile Application** - Native mobile applications (iOS/Android) with mobile-specific features and push notifications.
- **Advanced Contractor and Vendor Roles** - Role specifications for contractor and vendor users.

---

### 3.3 Out of Scope for This Phase

The following capabilities are explicitly excluded from Phase 1:

**Modules:**
- Surveys
- Employee Case Management (beyond basic feedback/grievance)
- Travel Desk

**Capabilities:**
- External job board integrations (LinkedIn, Indeed, Naukri)
- Third-party recruitment agency integrations
- Resume parsing from external sources
- AI-powered candidate matching or ranking
- OCR (Optical Character Recognition) for documents
- E-signature functionality for documents
- Depreciation calculations and financial tracking for assets
- ITSM/MDM integrations for asset management
- External ERP/finance system integrations
- Social features (employee networking, activity feeds, kudos)
- Advanced analytics (predictive analytics, succession planning visualization)
- AI-powered search (natural language search, recommendations)
- Real-time collaboration (instant messaging, presence indicators)

**Labor Law Boundaries:**
- Statutory returns filing to government authorities (EPFO, ESIC, PT, etc.)
- Payroll computation, statutory deductions, and disbursement
- Legal interpretation and advice on state-specific labor law variations
- Automated statutory compliance verification or legal opinion
- Gratuity, bonus, or leave salary actual calculations
- Income tax computation and TDS processing

**Scope Creep Prevention:**
- Any capability, module, or functionality not explicitly listed in Section 3.1 is considered out of scope for Phase 1, regardless of conceptual similarity or future-phase intent.
- No design, development, or implementation work shall be undertaken for requirements not documented in this BRD.

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

## 6. Module-Wise Functional Requirements

### 6.1 User Authentication

#### Purpose
Provide secure access to the application through multiple authentication options while supporting multi-company access.

#### Functional Requirements

1. The system shall support authentication through: SAML, Active Directory, Office 365, Google Apps, and Email/Password login.

2. The system shall maintain a distinct `User` entity separate from `Employee` and `Contractor` records.

3. The system shall allow a single user to belong to multiple companies with different roles and permissions in each.

4. The system shall allow authorized multi-company users to switch company context within the same authenticated session without logging out.

5. The system shall support scenarios where:
   - a user is linked to an employee in one company
   - a user is not linked to any workforce record
   - an employee exists without a linked user account

6. The system shall support secure password management for local login users and maintain authentication audit logs.

---

### 6.2 Companies

#### Purpose
Manage tenant companies subscribing to the platform.

#### Functional Requirements

1. The HRMS Administrator shall be able to create and provision companies.

2. Each company shall maintain business and legal details including: legal name, trade name, website, registration identifiers (GSTN, EIN), and contact information.

3. A company shall be able to operate across one or more jurisdictions with company-specific configuration of organizational structures, policies, security, workflows, and workforce data.

4. The system shall preserve data isolation at the company level. A company may operate as an independent standalone company, as part of a group-company structure, or be managed by an external shared services provider.

5. The platform shall support commercial packaging and subscription models based on number of companies, number of employees, and subscribed modules.

6. **Company Lifecycle and Archival:**
   - Company data for closed or merged companies preserved for 7 years, subject to archival fees
   - Support export of entire company data for customers leaving the platform
   - Companies marked inactive upon closure with data retention according to policy

---

### 6.3 Group Companies

#### Purpose
Represent related companies such as subsidiaries, sister concerns, or affiliated entities.

#### Functional Requirements

1. The system shall support definition of group-company relationships with multiple related companies.

2. The group-company construct shall enable shared administrative scenarios and shared locations across related companies, subject to explicit authorization and auditability.

3. **Consolidated Reporting and Directory Access:**
   - Consolidated reporting and cross-company directory search enabled only when: companies are explicitly linked via Group-Company construct, cross-company access is explicitly enabled, and users have been granted explicit group-level roles.
   - Security constraints: Row-level security filters apply; audit trail maintained for all cross-company access.

---

### 6.4 Jurisdictions

#### Purpose
Maintain a supported catalog of jurisdictions relevant for operations, taxation, and policy applicability.

#### Functional Requirements

1. The system shall maintain a catalog of supported jurisdictions (countries, states, cities, or other operational regions) as catalog entries rather than mandatory geographic hierarchy.

2. Jurisdictions shall define tax and fee applicability where configured, and shall be usable as policy applicability criteria.

3. A company shall be able to operate in one or more jurisdictions.

---

### 6.5 Locations

#### Purpose
Represent physical places of operation for a company.

#### Functional Requirements

1. A location shall represent a physical office or operational site, belonging to one jurisdiction.

2. Locations shall be company-specific by default and shall not be shared across related companies unless explicitly configured through group-company relationships.

3. A company may maintain multiple locations within the same jurisdiction.

4. **Shared Locations Across Group Companies:**
   - Shared locations may be owned by one company and referenced by other companies within the same group-company structure
   - Location sharing shall be explicitly configured with audit trail tracking

---

### 6.6 Groups

#### Purpose
Provide logical grouping of employees and users for policy, eligibility, and security purposes.

#### Functional Requirements

1. The platform shall support global groups (created by HRMS Administrator) and company-specific groups.

2. Groups shall support hierarchical parent-child structures with n-level nesting.

3. Employees may belong to multiple groups; users may be associated with groups where required.

4. Groups shall be available as policy applicability criteria.

---

### 6.7 Departments

#### Purpose
Represent the organizational department structure within a company.

#### Functional Requirements

1. A company shall be able to define multiple departments with hierarchical parent-child structures (n-level nesting).

2. Each department shall have a designated department head.

3. Employees shall belong to at least one department and may belong to multiple departments.

4. Departments shall be usable in role assignment, reporting, approvals, and policy applicability.

---

### 6.8 Positions

#### Purpose
Represent company-specific job positions within departments.

#### Functional Requirements

1. A company shall be able to define multiple positions, each belonging to exactly one department.

2. Each employee shall be assigned one position.

3. Positions shall support use in recruitment, onboarding, reporting, and organizational setup.

---

### 6.9 Employees

#### Purpose
Manage employee workforce records for each company.

#### Functional Requirements

1. Employee records shall be company-specific. If the same physical person is an employee in more than one company, separate employee records shall be created.

2. An employee may exist without a linked user account, or may be linked to a user account if system access is required.

3. Each employee shall belong to: one company, one jurisdiction, at least one department (may belong to multiple), one position, zero or more groups, and may operate across one or more locations.

4. Employee records shall support lifecycle events including onboarding, probation, performance, transfers, and exit processes.

5. **Manager Hierarchy and Reporting Structure:**
   - **Primary Manager** - Each employee shall have exactly one primary reporting manager
   - **Dotted-Line Manager** - Employees may optionally have one or more functional/matrix managers
   - **Temporary/Acting Manager** - Support temporary manager assignments with automatic delegation
   - **Effective-Dated Changes** - All manager assignment changes shall be effective-dated with complete audit trail

6. **Duplicate Detection** - The system shall enforce uniqueness for government identification fields (Aadhar, Passport, PAN) with deduplication prompts.

7. **Statutory Workforce Data Capture (Indian Labor Law)** - The system shall support capture of: UAN, ESIC Number, ESI/PF Eligibility status, Professional Tax registration, LWF applicability, maternity benefit eligibility, gratuity eligibility tracking, and leave balances with statutory entitlements.

---

### 6.10 Policy Management

#### Purpose
Define and apply business and HR policies across the organization.

#### Functional Requirements

1. The system shall allow creation and maintenance of HR and business policies assignable based on: company, jurisdiction, location, department, group, and employment type.

2. Policies shall support versioning and effective dating, with different applicability for employees and contractors.

3. Policies shall integrate with modules such as: leave, attendance, onboarding, probation, performance, exit, and asset management.

4. Policy visibility and maintenance shall be role controlled.

---

### 6.11 Policy Distribution and Acknowledgment

#### Purpose
Enable HR teams to distribute policies to employees, track acknowledgment status, and ensure compliance with required policy sign-offs.

#### Functional Requirements

1. **Distribution Scope** - Support policy distribution based on: company, location, department, group, employment type, individual employees, or combinations using AND/OR logic.

2. **Distribution Methods** - Manual, scheduled, automatic (event-triggered), and bulk distribution.

3. **Acknowledgment Types** - Required (mandatory with enforcement), Optional (recommended), and Read-Only (information only).

4. **Due Date Configuration** - Support fixed dates, relative dates (days from distribution), hire-based dates, and periodic renewal.

5. **Reminders and Escalations** - Automated reminders at 50%, 75%, and 100% of SLA; escalation workflows for overdue acknowledgments based on policy criticality.

6. **Re-Acknowledgment** - Required when: policy content changes, periodic renewal expires, employee transfers, role changes, or regulatory updates.

7. **Employee Self-Service** - Policy inbox with pending acknowledgments, policy review interface, and acknowledgment confirmation with receipt.

8. **Reporting** - Acknowledgment status reports, pending/overdue reports, compliance dashboard, and 7-year audit trail retention.

9. **Integration** - Integration with employee lifecycle (onboarding, transfers), workflow engine (escalations), and task/checklist module.

---

### 6.12 Roles and Security

#### Purpose
Control access to data and system functions through role-based access control (RBAC).

#### Functional Requirements

1. The system shall implement Role-Based Access Control (RBAC) with roles defined at platform, portfolio, group-company, and company levels.

2. Users may have different roles in different companies. Security rules shall support access restrictions based on company, group, department, and workforce type.

3. **Delegation** - Users shall be able to delegate activities to another user within the same company; approvals visible to managers and appropriate hierarchy members.

4. **Impersonation** - Support "login as user" capability for authorized support users with full audit logging.

5. **Multi-Factor Authentication (MFA)** - Configurable at company level.

6. Company context switching by multi-company users shall be secure, explicit, auditable, and limited to authorized companies only.

---

### 6.13 Talent Acquisition

#### Purpose
Support comprehensive hiring workflows for employees, from requisition to onboarding.

#### Functional Requirements

1. **Job Requisitions** - Creation, approval workflows, status tracking, and assignment to recruiters and hiring managers.

2. **Talent Pool Management** - Candidate sourcing, application tracking, resume storage, and status tracking.

3. **Interview Management** - Interview panel definition, scheduling with calendar integration, and structured scorecards with configurable evaluation criteria.

4. **Reference Checks** - Tracking and documentation of reference feedback.

5. **Offer Management** - Configurable offer letter templates, approval workflows, acceptance/rejection tracking, and electronic distribution.

6. **Hiring Workflows** - Comprehensive workflows covering requisition, sourcing, screening, interviews, reference checks, offer, and conversion to employee.

7. **Candidate Conversion** - Seamless handoff to onboarding module upon conversion to employee.

---

### 6.14 Announcements

#### Purpose
Communicate organizational messages to relevant audiences.

#### Functional Requirements

1. Authorized users shall be able to publish announcements targeted based on: company, jurisdiction, location, department, group, and workforce type.

2. The system shall support scheduling and expiry of announcements.

3. Employees with system access shall be able to view relevant announcements.

---

### 6.15 Employee Lifecycle Management

#### Purpose
Manage core lifecycle events after hiring.

#### Functional Requirements

1. **Onboarding** - Task-driven workflows with mandatory stages: Offer Acceptance, Document Submission, Document Verification, Asset Assignment, and Induction Completion. See `SatelliteHR-TaskChecklist-BRD.md` for detailed task specifications.

2. **Probation Confirmation** - Decision workflow with evaluation criteria, approval hierarchy (Manager → Department Head → HR), and outcomes: Confirm, Extend, or Initiate Separation.

3. **Transfers** - Support for inter-department, inter-location, and inter-company transfers with approval workflows, effective dating, and downstream impact assessment (assets, leave balances, policies).

4. **Exit Management** - Request and approval workflows, notice period handling, clearance workflow (parallel by function), and exit completion tracking.

5. All lifecycle workflows shall be configurable, auditable, and reportable.

---

### 6.16 Employee Self-Service

#### Purpose
Enable workforce members to perform self-service transactions.

#### Functional Requirements

1. The system shall provide self-service through responsive web interface (mobile application is Phase II).

2. Employees shall be able to view and manage authorized personal and employment information.

3. Self-service shall include access to: profile information, leave, attendance, announcements, documents, and feedback-related functions.

4. Self-service access shall be role and policy controlled.

---

### 6.17 Leave Management

#### Purpose
Manage leave policies, requests, balances, and approvals.

#### Functional Requirements

1. The system shall support configurable leave policies with differentiation by: employee type, group, jurisdiction, company, department, or location.

2. **Leave Types** - Support for: Privileged/Annual Leave, Casual Leave, Sick/Medical Leave, Maternity Leave, Paternity Leave, Bereavement Leave, and Compensatory-off (Comp-off).

3. **Approval Workflows** - Sequential and parallel approvals with configurable levels, delegation, and escalation based on SLA.

4. **Administrative Override** - HR Administrators shall be able to override any leave rule or balance with mandatory reason and full audit trail.

5. **Leave Calendar Views** - Personal calendar for employees, team calendar for managers, and company-wide calendar for HR with coverage metrics.

6. Leave balances, rules, and entitlements shall be reportable.

---

### 6.18 Time and Attendance

#### Purpose
Manage attendance capture, review, and compliance.

#### Functional Requirements

1. **Attendance Capture Methods** - Manual entry, biometric device integration, API integration with third-party systems, and CSV/XLS file import.

2. **Shifts and Rosters** - Shift pattern definition, roster management, shift swapping with approval workflows.

3. **Holiday Calendars** - Company-specific and location-specific holiday configuration with optional holidays.

4. **Overtime Management** - Overtime calculation, categorization (normal, holiday, night shift), eligibility by worker category, and approval workflows.

5. **Attendance Exception Workflows** - Correction requests for missed punch, late arrival, early exit with approval flows and escalation rules.

6. **Statutory Working Hours** - Configuration aligned with Indian labor law: daily working hours, weekly off, maximum working hour limits.

7. **Administrative Override** - HR Administrators shall be able to override attendance records with mandatory reason and full audit trail.

---

### 6.19 Feedback and Grievance

#### Purpose
Provide a structured mechanism for feedback and grievance-related tracking.

#### Functional Requirements

1. The system shall support submission of feedback and grievance-related entries with role-based review.

2. Access to grievance-related information shall be restricted to authorized personnel.

3. The module shall support auditability and status tracking.

4. This module addresses Phase 1 feedback and grievance needs; broader case-management capabilities are planned for a future phase.

---

### 6.20 Employee Asset Management

#### Purpose
Track assets allocated to workforce members throughout their lifecycle.

#### Functional Requirements

1. **Asset Categories** - IT Equipment, Mobile Devices, Network Equipment, Peripherals, Furniture, Security & Access, Software Licenses, and Other Equipment.

2. **Asset Lifecycle States** - Available, Allocated, Issued, In Repair, Returned, Retired, Disposed.

3. **Asset Transactions** - Issue, Return, Transfer, and Recovery.

4. **Asset Acknowledgements** - Digital acknowledgement of asset receipt and return with condition assessment.

5. **Workflow Integration** - Integration with onboarding (asset issuance) and exit workflows (asset recovery).

6. **Reporting** - Asset assignment, inventory, pending acknowledgements, and overdue returns.

---

### 6.21 Employee Directory and Org Chart

#### Purpose
Provide a centralized employee directory with organizational hierarchy visualization and advanced search.

#### Functional Requirements

1. **Directory Views** - List view, card view, and compact view with employee information (name, photo, position, department, location, contact details).

2. **Organizational Chart** - Hierarchical tree view, department-based view, interactive navigation, and export options (PNG/PDF).

3. **Advanced Search** - Filter by name, ID, department, position, location, group, employment status, and custom fields; saved searches; export to Excel/CSV.

4. **Group Company Search** - Cross-company search for users with Group Company roles, with company identifier display and security constraints.

5. **Privacy Controls** - Contact information visibility based on role and privacy policies; sensitive information excluded from directory.

---

### 6.22 Documents and Attachments

#### Purpose
Provide document management capabilities for storing, organizing, and tracking files.

#### Functional Requirements

1. **Supported Entities** - Company, Employee, and Candidate (within Talent Acquisition).

2. **File Support** - PDF, JPG/JPEG, DOC/DOCX, XLS/XLSX, PNG, TXT formats with 2 MB maximum file size.

3. **Document Features** - Metadata (name, upload date, uploaded by, expiry date), expiration tracking, categorization, and role-based access.

4. **Security** - Encryption at rest, tenant isolation, and access controls.

---

### 6.23 Reporting and Analytics

#### Purpose
Provide operational, management, compliance, and analytical reporting.

#### Functional Requirements

1. **Standard Reports** - Workforce management, organization structure, leave and attendance, talent acquisition, lifecycle workflows, asset management, and policy compliance reports.

2. **Dashboards** - Interactive dashboards with charts, KPIs, and drill-down capabilities; role-based default dashboards.

3. **Ad Hoc Reporting** - Report builder with field selection, filtering, grouping, and saved views.

4. **Scheduled Reports** - Configurable delivery via email with multiple frequency options.

5. **Compliance Reports** - PF/ESIC eligibility, attendance registers, leave registers, wage register templates, and statutory data completeness reports.

6. **Security** - Reports filtered by company access; cross-company reporting for authorized portfolio/group company users.

---

### 6.24 Data Management

#### Purpose
Support migration, bulk maintenance, and operational data exchange.

#### Functional Requirements

1. **Import/Export Scope** - Master data (Company, Department, Location, Group, Employee) and transactional data (Leaves, Attendance).

2. **File Formats** - CSV, XLS, XLSX, JSON with 50 MB maximum file size and 10,000 records per batch.

3. **Import Sequencing** - Proper sequencing based on dependencies: Foundation Masters → Organizational Masters → Workforce Masters → Transactional Data.

4. **Validation and Error Reporting** - Pre-import validation, sandbox/staging mode, detailed error reporting with record-level success/failure.

5. **Rollback** - Transactional rollback for failed imports; atomic transactions where feasible.

6. **Status Visibility** - Real-time status tracking (Submitted, Validating, In-progress, Completed, Failed, Partially completed).

---

### 6.25 Workflow Engine

#### Purpose
Provide configurable workflow execution across modules.

#### Functional Requirements

1. **Capabilities** - Configurable workflows at company level with conditional routing based on company, jurisdiction, location, department, group, and transaction type.

2. **Approval Patterns** - Sequential approvals, parallel approvals (any-one-can-approve, all-must-approve), and mixed patterns.

3. **Escalation Strategies** - Manager escalation, role escalation, time-based reassignment, and multi-level escalation.

4. **SLA Management** - Configurable SLAs with business hours, reminder notifications at 50% and 75%, escalation at 100%, and real-time SLA tracking.

5. **Audit** - Complete audit trail of actions, approvals, escalations, and routing decisions.

---

### 6.26 Data Model Extensibility

#### Purpose
Allow customers to extend the platform data model with custom fields.

#### Functional Requirements

1. **Supported Entities** - Companies, Locations, Departments, Groups, Positions, and Employees.

2. **Scope Levels** - Platform-level fields (available across all companies) and Company-level fields (tenant-specific).

3. **Data Types** - Single-line text, multi-line text, number, decimal, currency, percentage, boolean, date, date-time, single/multi-select lists, lookup/reference, email, phone, URL, and file/attachment.

4. **Field Behaviors** - Required/optional configuration, field masks, and validation using regular expressions.

5. **Integration** - Custom fields searchable, available in workflow conditions, accessible via APIs, included in import/export, and available for reporting.

---

### 6.27 Notifications and Communications

#### Purpose
Provide configurable notification and communication mechanisms.

#### Functional Requirements

1. **Channels** - Email (mandatory), in-app notifications (optional), Microsoft Teams and WhatsApp via third-party connectors (optional).

2. **Events** - Approval notifications, escalation alerts, workflow status changes, reminders, and lifecycle events.

3. **Delivery Models** - Event-driven and scheduler-driven (digests, summaries).

4. **Templating** - Configurable templates with company branding, placeholders, and dynamic data insertion.

5. **User Preferences** - Channel preferences, event subscriptions, and frequency configuration.

---

### 6.28 HR Letters and Certificates

#### Purpose
Generate and manage post-hire employee documents.

#### Functional Requirements

1. **Templates** - Configurable templates for: Appointment Letter, Confirmation Letter, Transfer Letter, Promotion Letter, Relieving Letter, Experience Certificate, Address Proof, and Employment Verification.

2. **Merge Fields** - Dynamic data insertion from employee records, position details, company information, and custom fields.

3. **Generation** - Manual, automated (triggered by workflow events), and batch generation with PDF output.

4. **Workflow** - Configurable approval workflows and signing authority tracking.

5. **Distribution** - Email delivery, in-app access, and print options with delivery tracking.

6. **Versioning** - Complete version history, reissue capabilities, and 7-year retention.

---

### 6.29 Audit and Logging

#### Purpose
Provide comprehensive auditability and change tracking.

#### Functional Requirements

1. **Mandatory Audit Entities** - Company and Employee (all create, update, delete, status-change actions).

2. **Audit Data** - Entity type, record identifier, field/attribute, previous value, new value, timestamp, user/actor, and action type.

3. **Retention** - 1 year active retention (7 years total with archival).

4. **Record-Level History** - In-application utility for authorized users to view chronological change history for specific records.

5. **Security** - Tamper-resistant logs, role-based access, and tenant boundary enforcement.

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

---

## 9. Assumptions

1. Each subscribing company is treated as a tenant for data ownership and operational control.
2. Platform-level administration is performed by the HRMS provider.
3. The supported operating hierarchy is `Platform > Portfolio > Group Company > Company`, while standalone companies may operate without group-company or portfolio structures.
4. Company administrators are responsible for maintaining company-specific master and transactional data.
5. Jurisdictions are managed as a supported catalog, not as a mandatory country-state-city hierarchy.
6. A company may either operate independently or belong to one group-company structure, but not multiple.
7. A company may be managed internally or through an external shared services provider.
8. Portfolio managers may be granted access to multiple companies within explicitly authorized portfolio boundaries.
9. Data import/export is required across all major modules.
10. Broader employee case-management needs will be addressed in a future phase.

---

## 10. Open Questions

1. What are the exact mandatory and optional attributes for each core master entity (company, jurisdiction, location, group, department, position, employee)?

2. What are the specific data field requirements for employee statutory data (Indian labor law specific fields)?

3. What are the specific integration specifications for biometric devices and third-party attendance systems?

---

## 11. Phase Exclusions Summary

| Capability | Reason | Future Phase |
|------------|--------|--------------|
| Vendors and Contractors | Scope reduction | Phase II |
| Compliance Enablement (India) | Complexity | Phase II |
| Payroll Management | Scope reduction | Phase II |
| Mobile Application | Priority | Phase II |
| Surveys | Priority | Future |
| Employee Case Management | Complexity | Future |
| Travel Desk | Priority | Future |
| External Job Board Integrations | Priority | Future |
| AI-Powered Features | Priority | Future |

---

## 12. Summary

`SatelliteHR` is a configurable, secure, and scalable multi-tenant HRMS supporting diverse company structures, workforce models, and organizational policies. The Phase 1 scope establishes the foundational platform and core HR operations needed to manage companies, users, employees, policies, workflows, and reporting in a multi-company environment, including portfolio-based administration and seamless context switching for authorized multi-company users.

This BRD provides the business baseline for subsequent elaboration into:
- Detailed process flows
- User stories and acceptance criteria
- Data model and security model design
- Implementation roadmap
