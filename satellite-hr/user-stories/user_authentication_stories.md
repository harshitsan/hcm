# User Authentication — User Stories

_Derived from SatelliteHR Phase I BRD — module "User Authentication". 9 user stories._

---

## AUTH-01: Log in with email and password

**User story:** As an Employee, I want to log in using my email address and password, so that I can securely access the application without depending on an external identity provider.

**Acceptance criteria:**
- Given I have a valid local account, when I enter the correct email and password, then I am authenticated and granted access to the application.
- Given I enter incorrect credentials, when I submit the login form, then access is denied and I am prompted to try again.

**Priority:** High
**Source:** FR 6.1.1 (Email/Password login option)

---

## AUTH-02: Log in via enterprise single sign-on

**User story:** As an Employee, I want to authenticate through my organization's identity provider (SAML, Active Directory, Office 365, or Google Apps), so that I can access the application using my existing corporate credentials.

**Acceptance criteria:**
- Given my company has configured SAML, Active Directory, Office 365, or Google Apps, when I choose that provider on the login screen, then I am redirected to the provider and, on successful authentication, signed into the application.
- Given the identity provider rejects my authentication, when I return to the application, then I am not granted access.

**Priority:** High
**Source:** FR 6.1.1 (SAML, Active Directory, Office 365, Google Apps authentication)

---

## AUTH-03: Maintain User as a distinct entity

**User story:** As a Platform Admin, I want the system to maintain a `User` entity that is distinct from `Employee` and `Contractor` records, so that authentication and identity are managed independently of workforce data.

**Acceptance criteria:**
- Given a person needs application access, when a `User` record is created, then it is stored separately from any `Employee` or `Contractor` record.
- Given changes are made to an `Employee` or `Contractor` record, when those changes are saved, then the associated `User` entity remains a separate, independently managed record.

**Priority:** High
**Source:** FR 6.1.2 (Distinct User entity separate from Employee and Contractor)

---

## AUTH-04: Belong to multiple companies with per-company roles

**User story:** As a User, I want to belong to multiple companies with different roles and permissions in each, so that a single account can serve all the organizations I work with.

**Acceptance criteria:**
- Given my account is linked to more than one company, when an admin assigns roles and permissions, then those roles and permissions can differ per company.
- Given I am authenticated, when I access a given company, then the permissions applied are those defined for me in that specific company.

**Priority:** High
**Source:** FR 6.1.3 (Single user across multiple companies with distinct roles/permissions)

---

## AUTH-05: Switch company context within a session

**User story:** As a multi-company User, I want to switch my active company context within the same authenticated session, so that I can move between organizations without logging out and back in.

**Acceptance criteria:**
- Given I am authenticated and authorized for multiple companies, when I switch to a different company, then my active context updates to that company without requiring re-authentication.
- Given I switch company context, when the new context loads, then the roles and permissions applied reflect the selected company.

**Priority:** High
**Source:** FR 6.1.4 (Company context switching within a session)

---

## AUTH-06: Support user linked to an employee

**User story:** As a Company/HR Admin, I want a user account to be linked to an employee record in a company, so that a workforce member can access the application under their own identity.

**Acceptance criteria:**
- Given an employee needs access, when their user account is linked to their employee record, then the linkage is stored and the user can authenticate against it.
- Given a user is linked to an employee, when they access that company, then their employee context is available to the application.

**Priority:** Medium
**Source:** FR 6.1.5 (User linked to an employee in a company)

---

## AUTH-07: Support user without a workforce record

**User story:** As a Platform Admin, I want to create a user who is not linked to any workforce record, so that non-workforce actors (such as administrators) can be granted access without an employee or contractor profile.

**Acceptance criteria:**
- Given a user does not correspond to an employee or contractor, when the user account is created, then it is valid and usable without any linked workforce record.
- Given such a user authenticates, when they access the application, then access is granted based on assigned roles despite the absence of a workforce record.

**Priority:** Medium
**Source:** FR 6.1.5 (User not linked to any workforce record)

---

## AUTH-08: Support employee without a linked user account

**User story:** As a Company/HR Admin, I want an employee to exist without a linked user account, so that workforce records can be maintained for people who do not require application access.

**Acceptance criteria:**
- Given an employee does not need application access, when the employee record is created, then it can exist with no associated user account.
- Given an employee has no linked user account, when they are added or updated, then the record remains valid and no login credentials are required.

**Priority:** Medium
**Source:** FR 6.1.5 (Employee exists without a linked user account)

---

## AUTH-09: Secure password management and authentication audit logs

**User story:** As a Platform Admin, I want secure password management for local login users and authentication activity captured in audit logs, so that credentials are protected and access can be reviewed for security and compliance.

**Acceptance criteria:**
- Given a local login user manages their password, when they set or change it, then the credential is handled securely.
- Given authentication events occur, when a user logs in or attempts to log in, then the event is recorded in the authentication audit log for later review.

**Priority:** High
**Source:** FR 6.1.6 (Secure password management and authentication audit logs)
