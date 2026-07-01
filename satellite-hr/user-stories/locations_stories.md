# Locations — User Stories

_Derived from SatelliteHR Phase I BRD — module "Locations". 7 user stories._

---

## LOC-01: Create a physical location tied to a jurisdiction

**User story:** As a Company/HR Admin, I want to create a location that represents a physical office or operational site belonging to a single jurisdiction, so that the company's places of operation are accurately recorded against the correct legal jurisdiction.

**Acceptance criteria:**
- Given I am creating a new location, when I save it, then it must be associated with exactly one jurisdiction.
- Given a location has been created, when I view its details, then it is presented as a physical office or operational site with its jurisdiction shown.
- Given I attempt to save a location without a jurisdiction, then the system prevents the save and prompts me to select one.

**Priority:** High
**Source:** FR 6.5.1

---

## LOC-02: Scope locations to a specific company by default

**User story:** As a Company/HR Admin, I want locations to be company-specific by default, so that a company's operational sites are not unintentionally exposed to or used by other related companies.

**Acceptance criteria:**
- Given I create a location, when it is saved, then it is owned by and scoped to my company by default.
- Given a location is company-specific, when a user from another related company browses locations, then that location is not visible or selectable unless explicitly shared.

**Priority:** High
**Source:** FR 6.5.2

---

## LOC-03: Maintain multiple locations within the same jurisdiction

**User story:** As a Company/HR Admin, I want to create and maintain multiple locations within the same jurisdiction, so that a company operating several sites in one jurisdiction can represent each of them.

**Acceptance criteria:**
- Given a jurisdiction already has one or more locations for my company, when I add another location in that jurisdiction, then the system allows it without conflict.
- Given multiple locations exist in the same jurisdiction, when I view the company's locations, then all of them are listed.

**Priority:** Medium
**Source:** FR 6.5.3

---

## LOC-04: Share a location owned by one company with other group companies

**User story:** As a Group Company Admin, I want to configure a location owned by one company to be referenced by other companies within the same group-company structure, so that group companies can reuse a shared physical site instead of duplicating it.

**Acceptance criteria:**
- Given a location owned by one company, when I configure sharing within the group-company structure, then other companies in the same group can reference that location.
- Given a location is shared, when a referencing company uses it, then the ownership remains with the originating company.
- Given companies are not part of the same group-company structure, when I attempt to share a location between them, then the system does not allow the reference.

**Priority:** High
**Source:** FR 6.5.4 (Shared Locations Across Group Companies)

---

## LOC-05: Require explicit configuration to share a location

**User story:** As a Group Company Admin, I want location sharing across group companies to require explicit configuration, so that no location is shared implicitly or by accident.

**Acceptance criteria:**
- Given a company-specific location, when no sharing has been explicitly configured, then it remains scoped to its owning company only.
- Given I want another group company to reference a location, when I explicitly enable sharing, then the reference becomes available only after that configuration is confirmed.

**Priority:** High
**Source:** FR 6.5.4 (explicit configuration)

---

## LOC-06: Maintain an audit trail for shared locations

**User story:** As a Group Company Admin, I want every location-sharing configuration to be tracked with an audit trail, so that changes to cross-company location access are traceable and accountable.

**Acceptance criteria:**
- Given I configure or change location sharing across group companies, when the change is saved, then an audit trail entry is recorded.
- Given a shared location has an audit trail, when I review it, then I can see the sharing configuration changes that were made.

**Priority:** Medium
**Source:** FR 6.5.4 (audit trail tracking)

---

## LOC-07: Prevent sharing of locations outside a group-company relationship

**User story:** As a System, I want to enforce that locations are never shared across related companies unless a group-company relationship is explicitly configured, so that data isolation between unrelated companies is preserved.

**Acceptance criteria:**
- Given two companies without a configured group-company relationship, when either attempts to reference the other's location, then the System blocks the reference.
- Given a group-company relationship exists, when sharing is explicitly configured, then the System permits referencing only within that group structure.

**Priority:** High
**Source:** FR 6.5.2, FR 6.5.4

---
