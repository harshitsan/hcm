# Employee Self-Service — User Stories

## ESS-01: Responsive web self-service access
- Role: Employee (User)
- Story: As an Employee (User), I want to access self-service transactions through a responsive web interface, so that I can perform HR-related tasks from any device browser without needing a dedicated app.
- Priority: High
- Source: FR 6.16.1 (responsive web interface; mobile is Phase II)

## ESS-02: View authorized personal and employment information
- Role: Employee (User)
- Story: As an Employee (User), I want to view my authorized personal and employment information, so that I can confirm my records are accurate and up to date.
- Priority: High
- Source: FR 6.16.2, FR 6.16.4 (view authorized personal and employment information under role/policy control)

## ESS-03: Manage authorized personal and employment information
- Role: Employee (User)
- Story: As an Employee (User), I want to manage my authorized personal and employment information, so that I can keep my own records current without routing every change through HR.
- Priority: High
- Source: FR 6.16.2, FR 6.16.4 (manage authorized personal and employment information under role/policy control)

## ESS-04: Access profile information via self-service
- Role: Employee (User)
- Story: As an Employee (User), I want to access my profile information through self-service, so that I can review my details in one place.
- Priority: High
- Source: FR 6.16.3, FR 6.16.4 (self-service access to profile information)

## ESS-05: Access leave functions via self-service
- Role: Employee (User)
- Story: As an Employee (User), I want to access leave functions through self-service, so that I can review balances and act on my leave.
- Priority: High
- Source: FR 6.16.3, FR 6.16.4 (self-service access to leave)

## ESS-06: Access announcements via self-service
- Role: Employee (User)
- Story: As an Employee (User), I want to access announcements through self-service, so that I stay informed of organizational communications.
- Priority: Medium
- Source: FR 6.16.3 (self-service access to announcements)

## ESS-07: Access documents and feedback functions via self-service
- Role: Employee (User)
- Story: As an Employee (User), I want to access documents and feedback-related functions through self-service, so that I can retrieve my documents and participate in feedback activities.
- Priority: Medium
- Source: FR 6.16.3, FR 6.16.4 (self-service access to documents and feedback-related functions)

## ESS-08: Role and policy controlled self-service access
- Role: Company Admin
- Story: As a Company Admin, I want self-service access to be governed by role and policy, so that employees only see and act on functions permitted to them.
- Priority: High
- Source: FR 6.16.4 (role and policy controlled access)

## ESS-09: Access attendance functions via self-service
- Role: Employee (User)
- Story: As an Employee (User), I want to access attendance functions through self-service, so that I can review and act on my attendance information.
- Priority: High
- Source: FR 6.16.3, FR 6.16.4 (self-service access to attendance)

## ESS-10: Non-user employees excluded from self-service
- Role: Employee (Non-User)
- Story: As an Employee (Non-User), I want my HR records to be maintained on my behalf, so that I am covered by the system even though I have no self-service login.
- Priority: Medium
- Source: FR 6.16.2, FR 6.16.4 (self-service is user- and role/policy-scoped; non-users have no portal access)

## ESS-11: Configure self-service authorization scope
- Role: Company Admin
- Story: As a Company Admin, I want to configure which self-service functions and fields employees can view and manage, so that authorized scope aligns with organizational policy.
- Priority: High
- Source: FR 6.16.2, FR 6.16.4 (authorized information scope; role and policy controlled access)

## ESS-12: Persist self-service changes to the bitemporal canonical record
- Role: Platform Admin
- Story: As a Platform Admin, I want self-service changes to personal and employment information to be written to the canonical bitemporal data model, so that every change is effective-dated and its history is preserved.
- Priority: High
- Source: FR 6.16.2 (L1 domain/data: effective-dated, bitemporal persistence of self-service changes)

## ESS-13: Tenant-scoped self-service data isolation
- Role: Platform Admin
- Story: As a Platform Admin, I want self-service reads and writes to be confined to the employee's own record within their tenant, so that data is isolated and no cross-tenant or cross-employee access can occur.
- Priority: High
- Source: FR 6.16.2, FR 6.16.4 (L1 domain/data: tenant-scoped storage and row-level security)

## ESS-14: Configure profile fields and UDFs exposed to self-service
- Role: Company Admin
- Story: As a Company Admin, I want to define the profile and employment field schema, including custom fields (UDFs), that self-service exposes for view and edit, so that the portal reflects our field configuration without code changes.
- Priority: Medium
- Source: FR 6.16.2, FR 6.16.3 (L2 config/metadata: profile/UDF field schema and validation driving self-service)

## ESS-15: Self-service change requests routed through the approval engine
- Role: Employee (User)
- Story: As an Employee (User), I want my self-service changes that require approval to be routed through the workflow engine, so that they are reviewed and take effect only once approved.
- Priority: High
- Source: FR 6.16.2, FR 6.16.4 (L3 engine: Workflow/Approval engine executes self-service change approvals)

## ESS-16: Dynamic self-service forms rendered and validated by the forms engine
- Role: Employee (User)
- Story: As an Employee (User), I want self-service view and edit screens to be generated by the forms engine from field metadata, so that the fields, layout, and validation always match the current configuration.
- Priority: Medium
- Source: FR 6.16.2, FR 6.16.3 (L3 engine: Forms/Dynamic-Fields engine renders and validates self-service forms)

## ESS-17: Announcements delivered via the notification engine
- Role: Employee (User)
- Story: As an Employee (User), I want announcements to be delivered to me through the notification engine using configured templates and audience targeting, so that I receive the communications intended for me.
- Priority: Medium
- Source: FR 6.16.3 (L3 engine: Notification/Template engine delivers targeted announcements)
