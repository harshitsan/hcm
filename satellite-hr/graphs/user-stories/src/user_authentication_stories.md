# User Authentication — User Stories

## AUTH-01: Log in with email and password
- Role: Employee (User)
- Story: As an Employee (User), I want to log in using my email address and password, so that I can securely access the application without depending on an external identity provider.
- Priority: High
- Source: FR 6.1.1 (Email/Password login option); FR 6.1.6

## AUTH-02: Log in via enterprise single sign-on
- Role: Employee (User)
- Story: As an Employee (User), I want to authenticate through my organization's identity provider (SAML, Active Directory, Office 365, or Google Apps), so that I can access the application using my existing corporate credentials.
- Priority: High
- Source: FR 6.1.1 (SAML, Active Directory, Office 365, Google Apps authentication); FR 6.1.6

## AUTH-03: Maintain User as a distinct entity
- Role: Platform Admin
- Story: As a Platform Admin, I want the system to maintain a `User` entity that is distinct from `Employee` and `Contractor` records, so that authentication and identity are managed independently of workforce data.
- Priority: High
- Source: FR 6.1.2 (Distinct User entity separate from Employee and Contractor)

## AUTH-04: Belong to multiple companies with per-company roles
- Role: Portfolio Admin
- Story: As a Portfolio Admin, I want a single account to belong to multiple companies with different roles and permissions in each, so that one identity can serve all the organizations I work with.
- Priority: High
- Source: FR 6.1.3 (Single user across multiple companies with distinct roles/permissions)

## AUTH-05: Switch company context within a session
- Role: Portfolio Admin
- Story: As a Portfolio Admin, I want to switch my active company context within the same authenticated session, so that I can move between organizations without logging out and back in.
- Priority: High
- Source: FR 6.1.4 (Company context switching within a session)

## AUTH-06: Support user linked to an employee
- Role: Company Admin
- Story: As a Company Admin, I want a user account to be linked to an employee record in a company, so that a workforce member can access the application under their own identity.
- Priority: Medium
- Source: FR 6.1.5 (User linked to an employee in a company)

## AUTH-07: Support user without a workforce record
- Role: Platform Admin
- Story: As a Platform Admin, I want to create a user who is not linked to any workforce record, so that non-workforce actors (such as administrators) can be granted access without an employee or contractor profile.
- Priority: Medium
- Source: FR 6.1.5 (User not linked to any workforce record)

## AUTH-08: Support employee without a linked user account
- Role: Company Admin
- Story: As a Company Admin, I want an employee to exist without a linked user account, so that workforce records can be maintained for people who do not require application access.
- Priority: Medium
- Source: FR 6.1.5 (Employee exists without a linked user account)

## AUTH-09: Secure password management and authentication audit logs
- Role: Platform Admin
- Story: As a Platform Admin, I want secure password management for local login users and authentication activity captured in audit logs, so that credentials are protected and access can be reviewed for security and compliance.
- Priority: High
- Source: FR 6.1.6 (Secure password management and authentication audit logs)

## AUTH-10: Configure available authentication methods
- Role: Platform Admin
- Story: As a Platform Admin, I want to configure which authentication methods (SAML, Active Directory, Office 365, Google Apps, and Email/Password) are available, so that access aligns with each organization's security requirements.
- Priority: High
- Source: FR 6.1.1 (SAML, Active Directory, Office 365, Google Apps, Email/Password); FR 6.1.6

## AUTH-11: Reset or recover my password
- Role: Employee (User)
- Story: As an Employee (User) with a local account, I want to securely reset or recover my password, so that I can regain access if I forget my credentials.
- Priority: Medium
- Source: FR 6.1.6 (Secure password management)

## AUTH-12: Manage user access across group companies
- Role: Group Company Admin
- Story: As a Group Company Admin, I want to manage a single user's membership and per-company roles across the companies in my group, so that shared personnel have appropriate, independent access in each company.
- Priority: Medium
- Source: FR 6.1.3 (Single user across multiple companies with distinct roles/permissions); FR 6.1.4

## AUTH-13: Assign per-company roles and permissions to a user
- Role: Company Admin
- Story: As a Company Admin, I want to assign and revoke roles and permissions for users within my company, so that each user has exactly the access appropriate to their responsibilities in my company.
- Priority: Medium
- Source: FR 6.1.3 (Distinct roles/permissions per company)

## AUTH-14: Link or unlink a user to an employee record
- Role: Company Admin
- Story: As a Company Admin, I want to link an existing user to an employee record, or unlink them, so that I can control which workforce members have application access under their own identity.
- Priority: Medium
- Source: FR 6.1.5 (User-Employee linkage scenarios); FR 6.1.2

## AUTH-15: Review authentication audit logs
- Role: Platform Admin
- Story: As a Platform Admin, I want to review the authentication audit log, so that I can investigate access issues and demonstrate security and compliance.
- Priority: Medium
- Source: FR 6.1.6 (Authentication audit logs)

## AUTH-16: Enforce unique user identity and tenant-scoped data isolation
- Role: Platform Admin
- Story: As a Platform Admin, I want each User to have a unique login identity while memberships, roles, and audit records are stored under tenant-scoped isolation, so that identities cannot collide and one company's data is never exposed to another.
- Priority: High
- Source: FR 6.1.2 (L1 data); FR 6.1.3 (L1 data)

## AUTH-17: Configure the tenant password policy as governed config
- Role: Company Admin
- Story: As a Company Admin, I want to configure my company's password policy (complexity, length, expiry, reuse, lockout thresholds) as versioned, effective-dated configuration, so that credential rules match our security requirements without code changes.
- Priority: Medium
- Source: FR 6.1.6 (L2 config)

## AUTH-18: Receive password-reset and security notifications via the notification engine
- Role: Employee (User)
- Story: As an Employee (User), I want password-reset links and security-event alerts delivered through the shared notification/template engine, so that I receive timely, consistently formatted messages when my authentication state changes.
- Priority: Medium
- Source: FR 6.1.6 (L3 Notification engine)

## AUTH-19: Use a metadata-driven login screen and company switcher
- Role: Employee (User)
- Story: As an Employee (User), I want a login screen that shows only the authentication methods enabled for my organization plus a company switcher once signed in, so that I can sign in and move between my companies through a clear, self-service interface.
- Priority: Medium
- Source: FR 6.1.1 (L4 presentation); FR 6.1.4

## AUTH-20: Exist as a workforce record without a login account
- Role: Employee (Non-User)
- Story: As an Employee (Non-User), I want my workforce record to be maintained without any linked user account or login credentials, so that my HR data is tracked even though I do not need to access the application.
- Priority: Medium
- Source: FR 6.1.5 (Employee exists without a linked user account); FR 6.1.2
