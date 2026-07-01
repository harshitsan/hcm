# Companies — User Stories

_Derived from SatelliteHR Phase I BRD — module "Companies". 9 user stories._

---

## CMP-01: Create and provision companies

**User story:** As a Platform Admin (HRMS Administrator), I want to create and provision new tenant companies on the platform, so that subscribing organizations can begin using the HRMS.

**Acceptance criteria:**
- Given I hold the HRMS Administrator role, when I initiate creation of a new company, then a new tenant company record is created and provisioned on the platform.
- Given a company is provisioned, when provisioning completes, then the company becomes available for further configuration and onboarding.
- Given I do not hold the HRMS Administrator role, when I attempt to create a company, then the action is denied.

**Priority:** High
**Source:** FR 6.2.1

---

## CMP-02: Maintain business and legal details

**User story:** As a Company/HR Admin, I want to record and maintain my company's business and legal details, so that the platform holds accurate identifying and contact information.

**Acceptance criteria:**
- Given a company record, when I edit its profile, then I can capture legal name, trade name, and website.
- Given a company record, when I edit its profile, then I can capture registration identifiers including GSTN and EIN.
- Given a company record, when I edit its profile, then I can capture contact information.
- Given required business and legal fields are provided, when I save, then the details persist against the company.

**Priority:** High
**Source:** FR 6.2.2

---

## CMP-03: Operate across multiple jurisdictions

**User story:** As a Company/HR Admin, I want my company to operate across one or more jurisdictions, so that we can run operations wherever we do business.

**Acceptance criteria:**
- Given a company, when I configure jurisdictions, then the company can be associated with one or more jurisdictions.
- Given multiple jurisdictions are configured, when the company operates, then each jurisdiction is supported without requiring a separate tenant.

**Priority:** High
**Source:** FR 6.2.3

---

## CMP-04: Company-specific configuration

**User story:** As a Company/HR Admin, I want company-specific configuration of organizational structures, policies, security, workflows, and workforce data, so that our setup reflects our own operating model.

**Acceptance criteria:**
- Given a company, when I configure it, then organizational structures, policies, security settings, workflows, and workforce data can each be set specifically for that company.
- Given company-specific configuration exists, when another company is configured, then its settings remain independent and do not affect mine.

**Priority:** High
**Source:** FR 6.2.3

---

## CMP-05: Company-level data isolation

**User story:** As a Platform Admin, I want the system to preserve data isolation at the company level, so that each tenant's data remains private and secure from other tenants.

**Acceptance criteria:**
- Given multiple companies exist on the platform, when data is stored or accessed, then each company's data is isolated from other companies.
- Given a user is scoped to one company, when they access data, then they cannot access another company's data.

**Priority:** High
**Source:** FR 6.2.4

---

## CMP-06: Support standalone, group, and shared-services operating models

**User story:** As a Platform Admin, I want to support companies operating as standalone, within a group-company structure, or under an external shared services provider, so that the platform fits diverse ownership and management arrangements.

**Acceptance criteria:**
- Given a company, when I set its operating model, then it can be designated as an independent standalone company.
- Given a company, when I set its operating model, then it can be designated as part of a group-company structure.
- Given a company, when I set its operating model, then it can be designated as managed by an external shared services provider.
- Given any of these models is selected, when data is accessed, then company-level data isolation is still preserved.

**Priority:** Medium
**Source:** FR 6.2.4

---

## CMP-07: Commercial packaging and subscription models

**User story:** As a Platform Admin, I want commercial packaging and subscription models based on number of companies, number of employees, and subscribed modules, so that customers can be billed according to their usage and entitlements.

**Acceptance criteria:**
- Given a subscription, when it is configured, then packaging can be based on number of companies.
- Given a subscription, when it is configured, then packaging can be based on number of employees.
- Given a subscription, when it is configured, then packaging can be based on the set of subscribed modules.
- Given a subscription is defined, when a customer subscribes, then the applicable package and limits are applied.

**Priority:** Medium
**Source:** FR 6.2.5

---

## CMP-08: Company inactivation and data retention on closure

**User story:** As a Platform Admin, I want to mark companies inactive upon closure and retain their data per policy, so that closed or merged companies are handled compliantly.

**Acceptance criteria:**
- Given a company closes, when I process the closure, then the company is marked inactive.
- Given a company is closed or merged, when it is archived, then its data is preserved for 7 years subject to archival fees.
- Given a company is inactive, when the retention period applies, then data retention follows the defined policy.

**Priority:** Medium
**Source:** FR 6.2.6

---

## CMP-09: Export entire company data on platform exit

**User story:** As a Company/HR Admin of a customer leaving the platform, I want to export the entire company data, so that we retain our records when we discontinue the service.

**Acceptance criteria:**
- Given a customer is leaving the platform, when they request an export, then the entire company data can be exported.
- Given an export is generated, when it completes, then it contains the company's full dataset for handover.

**Priority:** Medium
**Source:** FR 6.2.6

---
