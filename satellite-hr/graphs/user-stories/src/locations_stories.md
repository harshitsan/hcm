# Locations — User Stories

## LOC-01: Create a physical location tied to a jurisdiction
- Role: Company Admin
- Story: As a Company Admin, I want to create a location that represents a physical office or operational site belonging to a single jurisdiction, so that the company's places of operation are accurately recorded against the correct legal jurisdiction.
- Priority: High
- Source: FR 6.5.1

## LOC-02: Scope locations to a specific company by default
- Role: Company Admin
- Story: As a Company Admin, I want locations to be company-specific by default and not shared across related companies unless explicitly configured, so that a company's operational sites are not unintentionally exposed to or used by other related companies.
- Priority: High
- Source: FR 6.5.2

## LOC-03: Maintain multiple locations within the same jurisdiction
- Role: Company Admin
- Story: As a Company Admin, I want to create and maintain multiple locations within the same jurisdiction, so that a company operating several sites in one jurisdiction can represent each of them.
- Priority: Medium
- Source: FR 6.5.3

## LOC-04: Share a location owned by one company with other group companies
- Role: Group Company Admin
- Story: As a Group Company Admin, I want to configure a location owned by one company to be referenced by other companies within the same group-company structure, so that group companies can reuse a shared physical site instead of duplicating it.
- Priority: High
- Source: FR 6.5.4 (Shared Locations Across Group Companies)

## LOC-05: Require explicit configuration to share a location
- Role: Group Company Admin
- Story: As a Group Company Admin, I want location sharing across group companies to require explicit configuration, so that no location is shared implicitly or by accident.
- Priority: High
- Source: FR 6.5.4 (explicit configuration)

## LOC-06: Maintain an audit trail for shared locations
- Role: Group Company Admin
- Story: As a Group Company Admin, I want every location-sharing configuration and change to be tracked with an audit trail, so that changes to cross-company location access are traceable and accountable.
- Priority: Medium
- Source: FR 6.5.4 (audit trail tracking)

## LOC-07: Prevent sharing of locations outside a group-company relationship
- Role: Platform Admin
- Story: As a Platform Admin, I want the platform to enforce that locations are never shared across related companies unless a group-company relationship is explicitly configured, so that data isolation between unrelated companies is preserved.
- Priority: High
- Source: FR 6.5.2, FR 6.5.4

## LOC-08: View and manage the company's location list
- Role: Company Admin
- Story: As a Company Admin, I want to view and manage all locations belonging to my company, so that I have an accurate, up-to-date record of the company's physical places of operation.
- Priority: Medium
- Source: FR 6.5.1, FR 6.5.2, FR 6.5.4

## LOC-09: Reference a shared group-company location within my company
- Role: Company Admin
- Story: As a Company Admin of a referencing company, I want to use a location that another company in my group-company structure has shared, so that I can operate from a shared physical site without duplicating the location record.
- Priority: Medium
- Source: FR 6.5.4

## LOC-10: View the location assigned to me
- Role: Employee (User)
- Story: As an Employee (User), I want to view the location I am associated with, so that I know which physical office or operational site and jurisdiction I belong to.
- Priority: Low
- Source: FR 6.5.1, FR 6.5.2

## LOC-11: Persist locations under tenant-scoped storage with row-level isolation
- Role: Platform Admin
- Story: As a Platform Admin, I want every location record to be persisted in tenant-scoped storage with row-level security keyed to its owning company, so that the company-specific default is enforced at the data layer and cannot be bypassed by the application or API.
- Priority: High
- Source: FR 6.5.2 (L1 data)

## LOC-12: Maintain referential integrity between shared references and their owned location
- Role: Platform Admin
- Story: As a Platform Admin, I want a shared location to be modeled as a single owned record referenced by other companies, with referential integrity and effective-dated history maintained, so that shared references always resolve to a valid owned source and every change is historically reconstructable.
- Priority: High
- Source: FR 6.5.4 (L1 data), FR 6.5.1

## LOC-13: Manage location sharing as governed
- Role: Group Company Admin
- Story:  versioned configuration
- Priority: Given I enable, change, or revoke a sharing relationship, when I save, then a new configuration version is created and effective-dated rather than overwriting the prior state.; Given the platform evaluates whether a company may reference a location, when it resolves access, then it reads the current governed sharing configuration as of the effective date.; Given a sharing configuration is changed, when I review its history, then prior versions remain retrievable and each version is tied to its audit-trail entry.; Given a sharing change is scheduled with a future effective date, when that date is reached, then the reference availability updates automatically without a code change.
- Source: Medium,FR 6.5.4 (L2 config)

## LOC-14: Search and filter the locations grid by jurisdiction and ownership
- Role: Company Admin
- Story: As a Company Admin, I want a metadata-driven locations grid where I can search and filter locations by jurisdiction and by owned-versus-referenced status, so that I can quickly find and manage the right site among many.
- Priority: Low
- Source: FR 6.5.3, FR 6.5.1 (L4)
