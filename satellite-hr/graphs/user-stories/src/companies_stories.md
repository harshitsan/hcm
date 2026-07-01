# Companies — User Stories

## CMP-01: Create and provision companies
- Role: Platform Admin
- Story: As a Platform Admin, I want to create and provision new tenant companies on the platform, so that subscribing organizations can begin using the HRMS.
- Priority: High
- Source: FR 6.2.1

## CMP-02: Maintain business and legal details
- Role: Company Admin
- Story: As a Company Admin, I want to record and maintain my company's business and legal details, so that the platform holds accurate identifying, legal, and contact information.
- Priority: High
- Source: FR 6.2.2

## CMP-03: Operate across multiple jurisdictions
- Role: Company Admin
- Story: As a Company Admin, I want my company to operate across one or more jurisdictions, so that we can run operations wherever we do business under a single tenant.
- Priority: High
- Source: FR 6.2.3

## CMP-04: Company-specific configuration
- Role: Company Admin
- Story: As a Company Admin, I want company-specific configuration of organizational structures, policies, security, workflows, and workforce data, so that our setup reflects our own operating model.
- Priority: High
- Source: FR 6.2.3

## CMP-05: Company-level data isolation
- Role: Platform Admin
- Story: As a Platform Admin, I want the system to preserve data isolation at the company level, so that each tenant's data remains private and secure from other tenants.
- Priority: High
- Source: FR 6.2.4

## CMP-06: Support standalone, group, and shared-services operating models
- Role: Platform Admin
- Story: As a Platform Admin, I want to support companies operating as standalone, within a group-company structure, or under an external shared services provider, so that the platform fits diverse ownership and management arrangements.
- Priority: Medium
- Source: FR 6.2.4

## CMP-07: Commercial packaging and subscription models
- Role: Platform Admin
- Story: As a Platform Admin, I want commercial packaging and subscription models based on number of companies, number of employees, and subscribed modules, so that customers can be billed according to their usage and entitlements.
- Priority: Medium
- Source: FR 6.2.5

## CMP-08: Company inactivation and data retention on closure
- Role: Platform Admin
- Story: As a Platform Admin, I want to mark companies inactive upon closure and retain their data per policy, so that closed or merged companies are handled compliantly.
- Priority: Medium
- Source: FR 6.2.6

## CMP-09: Export entire company data on platform exit
- Role: Company Admin
- Story: As a Company Admin of a customer leaving the platform, I want to export the entire company data, so that we retain our records when we discontinue the service.
- Priority: Medium
- Source: FR 6.2.6

## CMP-10: Manage companies within a group-company structure
- Role: Group Company Admin
- Story: As a Group Company Admin, I want to manage the set of companies that belong to my group-company structure, so that related entities are administered together while remaining isolated.
- Priority: Medium
- Source: FR 6.2.4

## CMP-11: Manage companies as an external shared services provider
- Role: Portfolio Admin
- Story: As a Portfolio Admin acting as an external shared services provider, I want to manage the companies assigned to me, so that I can administer multiple client tenants on their behalf.
- Priority: Medium
- Source: FR 6.2.4

## CMP-12: Enforce subscription entitlements and limits
- Role: Platform Admin
- Story: As a Platform Admin, I want the platform to enforce the limits of each subscription package, so that usage stays within the customer's entitlements for companies, employees, and modules.
- Priority: Medium
- Source: FR 6.2.5

## CMP-13: Apply archival fees for retained closed-company data
- Role: Platform Admin
- Story: As a Platform Admin, I want to apply archival fees for the data of closed or merged companies retained for 7 years, so that long-term retention is billed according to policy.
- Priority: Low
- Source: FR 6.2.6

## CMP-14: Preserve and access data for closed or merged companies
- Role: Company Admin
- Story: As a Company Admin of a closed or merged company, I want our data preserved and accessible per the retention policy, so that we can meet compliance and record-keeping obligations after closure.
- Priority: Low
- Source: FR 6.2.6

## CMP-15: Enforce uniqueness and integrity of company registration identifiers
- Role: Platform Admin
- Story: As a Platform Admin, I want registration identifiers and legal identity validated for uniqueness and integrity at the data layer, so that no two companies collide on regulated identifiers and records stay trustworthy.
- Priority: Medium
- Source: FR 6.2.2 (L1)

## CMP-16: Maintain bitemporal history of company profile and lifecycle status
- Role: Company Admin
- Story: As a Company Admin, I want changes to my company's profile and lifecycle status to be effective-dated and historically preserved, so that we can see what was true at any point in time.
- Priority: Medium
- Source: FR 6.2.2, FR 6.2.6 (L1)

## CMP-17: Model group-company relationships in the data model
- Role: Group Company Admin
- Story: As a Group Company Admin, I want the parent-subsidiary relationships between companies in my group represented in the canonical data model, so that group structure is queryable while each company stays isolated.
- Priority: Medium
- Source: FR 6.2.4 (L1)

## CMP-18: Toggle subscribed modules via governed configuration
- Role: Company Admin
- Story: As a Company Admin, I want subscribed modules represented as per-tenant governed configuration, so that enabling or disabling modules changes system behavior without code.
- Priority: Medium
- Source: FR 6.2.5 (L2 config)

## CMP-19: Define subscription packages as governed versioned config
- Role: Platform Admin
- Story: As a Platform Admin, I want subscription packages and their limits defined as governed configuration, so that packaging by companies, employees, and modules can be changed and versioned without code.
- Priority: Medium
- Source: FR 6.2.5 (L2 config)

## CMP-20: Rules engine evaluates subscription entitlements from config
- Role: Platform Admin
- Story: As a Platform Admin, I want the shared Rules engine to evaluate subscription entitlements from configured package limits, so that entitlement decisions are consistent and driven by config rather than hard-coded logic.
- Priority: Medium
- Source: FR 6.2.5 (L3 engine)

## CMP-21: Company directory with search filter and navigation
- Role: Company Admin
- Story: As a Company Admin, I want a company directory screen with search, filter, and navigation, so that I can quickly find and open the companies I administer.
- Priority: Medium
- Source: FR 6.2.1, FR 6.2.2 (L4)

## CMP-22: Metadata-driven company profile screen
- Role: Company Admin
- Story: As a Company Admin, I want a metadata-driven company profile screen to view and edit business, legal, jurisdiction, and configuration details, so that I can self-serve company setup through the SPA.
- Priority: Medium
- Source: FR 6.2.2, FR 6.2.3 (L4)

## CMP-23: Guided six-step company creation wizard
- Role: Platform Admin
- Story: As a Platform Admin, I want a guided six-step wizard to create a new company, so that I can capture all required onboarding information in a structured flow.
- Priority: High
- Source: COMP-FR-001 (§3.1.1 creation wizard), §5.3 (creation wizard UI)

## CMP-24: Validate mandatory fields on company creation
- Role: Platform Admin
- Story: As a Platform Admin, I want mandatory company fields validated before creation, so that no company is created with missing critical data.
- Priority: High
- Source: COMP-FR-002 (§3.1.1 mandatory field validation), §9 (COMP_001)

## CMP-25: Support multiple registration identifier types
- Role: Company Admin
- Story: As a Company Admin, I want to record my company's registration identifier using the correct type for my jurisdiction, so that legal identity is captured accurately.
- Priority: Medium
- Source: COMP-FR-003 (§3.1.1 registration identifiers)

## CMP-26: Automatic tenant provisioning actions on company creation
- Role: Platform Admin
- Story: As a Platform Admin, I want the platform to automatically perform setup actions when a company is created, so that a new tenant is ready to operate immediately.
- Priority: High
- Source: COMP-FR-004 (§3.1.1 provisioning automation)

## CMP-27: Detect and warn on potential duplicate companies
- Role: Platform Admin
- Story: As a Platform Admin, I want to be warned about potential duplicate companies during creation, so that I do not create redundant tenants.
- Priority: High
- Source: COMP-FR-005 (§3.1.1 duplicate prevention), §9 (COMP_001, COMP_006)

## CMP-28: Auto-generate human-readable company code
- Role: Platform Admin
- Story: As a Platform Admin, I want each company assigned a unique human-readable code, so that companies can be referenced consistently.
- Priority: Medium
- Source: COMP-FR-007 (§3.1.2 company code), §4.2.1 (CompanyCode)

## CMP-29: Enforce field-level validation rules on company data
- Role: Company Admin
- Story: As a Company Admin, I want company fields validated against defined rules and formats, so that stored data is well-formed and compliant.
- Priority: Medium
- Source: COMP-FR-002, COMP-FR-006 (§3.1.2 validation rules), §4.2.1 (field constraints)

## CMP-30: Enforce editability constraints on company master data
- Role: Company Admin
- Story: As a Company Admin, I want editing rules enforced on company fields, so that immutable data is protected while editable data can be maintained.
- Priority: Medium
- Source: COMP-FR-008 (§3.1.2 edit constraints), §9 (COMP_004, COMP_005)

## CMP-31: Company lifecycle state machine with approval workflow
- Role: Platform Admin
- Story: As a Platform Admin, I want company status transitions governed by a defined state machine and approvals, so that lifecycle changes are controlled and valid.
- Priority: High
- Source: COMP-FR-010 (§3.1.3 lifecycle), §3.1.3 (company status states)

## CMP-32: Company suspension behavior and access control
- Role: Platform Admin
- Story: As a Platform Admin, I want defined behavior when a company is suspended, so that access is restricted while in-flight work is handled gracefully.
- Priority: High
- Source: COMP-FR-011 (§3.1.3 suspension), §9 (COMP_004)

## CMP-33: Company inactivation (closure) processing
- Role: Platform Admin
- Story: As a Platform Admin, I want a defined inactivation process on company closure, so that accounts, workflows, and data are handled correctly.
- Priority: Medium
- Source: COMP-FR-012 (§3.1.3 inactivation), §9 (COMP_005)

## CMP-34: Company archival with verified export and secure deletion
- Role: Platform Admin
- Story: As a Platform Admin, I want company archival to produce a verified export and then securely delete data, so that the terminal Archived state is reached with data integrity assured.
- Priority: Medium
- Source: COMP-FR-013 (§3.1.3 archival)

## CMP-35: Enforce data retention rules by data type
- Role: Platform Admin
- Story: As a Platform Admin, I want retention periods and post-retention actions enforced per data type, so that the platform stays compliant.
- Priority: Medium
- Source: COMP-FR-012, COMP-FR-013 (§3.1.3 data retention), §8.2 (retention)

## CMP-36: Company-level configuration settings
- Role: Company Admin
- Story: As a Company Admin, I want to configure authentication, security, localization, notification, and workflow defaults for my company, so that platform behavior matches our policies.
- Priority: High
- Source: COMP-FR-014 (§3.1.4 company configuration)

## CMP-37: Configuration inheritance and override
- Role: Company Admin
- Story: As a Company Admin, I want configuration to inherit from platform defaults and be overridable at company and department levels, so that we only override what we need.
- Priority: Medium
- Source: COMP-FR-015 (§3.1.4 configuration inheritance)

## CMP-38: Configuration change application semantics
- Role: Company Admin
- Story: As a Company Admin, I want configuration changes to apply consistently and be auditable, so that changes are predictable in Phase I.
- Priority: Medium
- Source: COMP-FR-016 (§3.1.4 configuration change rules)

## CMP-39: Company branding configuration
- Role: Company Admin
- Story: As a Company Admin, I want to configure my company's branding, so that our logo and color appear in the product.
- Priority: Low
- Source: COMP-FR-006 (§3.1.2 branding), §4.2.1 (LogoUrl, PrimaryColor)

## CMP-40: Platform company list view with filters and pagination
- Role: Platform Admin
- Story: As a Platform Admin, I want a company list view with filters, search, and pagination, so that I can browse and manage all tenant companies.
- Priority: Medium
- Source: §5.1 (company list view), §6.1.5 (list companies API)

## CMP-41: RBAC for company management actions
- Role: Platform Admin
- Story: As a Platform Admin, I want company-management permissions enforced by role, so that only authorized roles perform each action.
- Priority: High
- Source: §7.1 (RBAC - Company Management)

## CMP-42: Tenant isolation enforcement via context and session binding
- Role: Platform Admin
- Story: As a Platform Admin, I want tenant isolation enforced through query scoping and session binding, so that cross-tenant data leakage is impossible.
- Priority: High
- Source: §7.2 (tenant isolation), §9 (AUTH_001)

## CMP-43: Company management audit events
- Role: Platform Admin
- Story: As a Platform Admin, I want company lifecycle and data-access events audited, so that we have a complete compliance trail.
- Priority: Medium
- Source: §8.1 (audit events COMPANY_*), COMP-FR-009 (§3.1.2 version history)

## CMP-44: Standardized company error codes and responses
- Role: Platform Admin
- Story: As a Platform Admin, I want company operations to return standardized error codes, so that failures are consistent and actionable.
- Priority: Medium
- Source: §9 (error codes COMP_*, AUTH_*)
