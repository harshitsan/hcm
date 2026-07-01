# Business Requirements Document (BRD)

## SatelliteHR

_This BRD has been split into per-module files. This index carries the document-level context; system/role/cross-cutting requirements live in `system_module.md`._

## Files

- [system_module.md](system_module.md) — multi-tenant model, roles, cross-module rules, NFRs
- [6.1 User Authentication](user_authentication.md)
- [6.2 Companies](companies.md)
- [6.3 Group Companies](group_companies.md)
- [6.4 Jurisdictions](jurisdictions.md)
- [6.5 Locations](locations.md)
- [6.6 Groups](groups.md)
- [6.7 Departments](departments.md)
- [6.8 Positions](positions.md)
- [6.9 Employees](employees.md)
- [6.10 Policy Management](policy_management.md)
- [6.11 Policy Distribution and Acknowledgment](policy_distribution_and_acknowledgment.md)
- [6.12 Roles and Security](roles_and_security.md)
- [6.13 Talent Acquisition](talent_acquisition.md)
- [6.14 Announcements](announcements.md)
- [6.15 Employee Lifecycle Management](employee_lifecycle_management.md)
- [6.16 Employee Self-Service](employee_self_service.md)
- [6.17 Leave Management](leave_management.md)
- [6.18 Time and Attendance](time_and_attendance.md)
- [6.19 Feedback and Grievance](feedback_and_grievance.md)
- [6.20 Employee Asset Management](employee_asset_management.md)
- [6.21 Employee Directory and Org Chart](employee_directory_and_org_chart.md)
- [6.22 Documents and Attachments](documents_and_attachments.md)
- [6.23 Reporting and Analytics](reporting_and_analytics.md)
- [6.24 Data Management](data_management.md)
- [6.25 Workflow Engine](workflow_engine.md)
- [6.26 Data Model Extensibility](data_model_extensibility.md)
- [6.27 Notifications and Communications](notifications_and_communications.md)
- [6.28 HR Letters and Certificates](hr_letters_and_certificates.md)
- [6.29 Audit and Logging](audit_and_logging.md)

---

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
