# Jurisdictions — User Stories

## JUR-01: Maintain a catalog of supported jurisdictions
- Role: Platform Admin
- Story: As a Platform Admin, I want to maintain a catalog of supported jurisdictions such as countries, states, cities, or other operational regions, so that the platform has a governed, reusable set of regions relevant for operations, taxation, and policy applicability.
- Priority: High
- Source: FR 6.4.1 (catalog of supported jurisdictions)

## JUR-02: Support multiple jurisdiction types as catalog entries
- Role: Platform Admin
- Story: As a Platform Admin, I want to record jurisdictions of different types — countries, states, cities, or other operational regions — as catalog entries, so that the catalog can represent whatever operational region granularity is needed.
- Priority: Medium
- Source: FR 6.4.1 (countries, states, cities, or other operational regions)

## JUR-03: Manage jurisdictions as flat catalog entries, not a mandatory hierarchy
- Role: Platform Admin
- Story: As a Platform Admin, I want jurisdictions to be managed as independent catalog entries rather than a mandatory geographic hierarchy, so that I can add regions flexibly without being forced to model parent-child geographic relationships.
- Priority: Medium
- Source: FR 6.4.1 (catalog entries rather than mandatory geographic hierarchy)

## JUR-04: Define tax and fee applicability on a jurisdiction
- Role: Platform Admin
- Story: As a Platform Admin, I want to define tax and fee applicability on a jurisdiction where configured, so that operations tied to that jurisdiction can reflect the correct taxes and fees.
- Priority: High
- Source: FR 6.4.2 (tax and fee applicability where configured)

## JUR-05: Use jurisdictions as policy applicability criteria
- Role: Company Admin
- Story: As a Company Admin, I want to use jurisdictions as applicability criteria when defining policies, so that policies apply correctly based on the jurisdiction they are relevant to.
- Priority: High
- Source: FR 6.4.2 (usable as policy applicability criteria)

## JUR-06: Assign one or more jurisdictions to a company
- Role: Company Admin
- Story: As a Company Admin, I want my company to operate in one or more jurisdictions, so that the company's operations, taxation, and policies can span every region in which it is active.
- Priority: High
- Source: FR 6.4.3 (a company may operate in one or more jurisdictions)

## JUR-07: Reference catalog jurisdictions consistently across modules
- Role: Company Admin
- Story: As a Company Admin, I want jurisdiction assignments and policy/tax references to draw from the single supported catalog, so that taxation and policy applicability stay consistent across the platform.
- Priority: Medium
- Source: FR 6.4.1–6.4.3 (single supported catalog underpinning company, tax, and policy usage)

## JUR-08: Oversee jurisdiction usage across the portfolio
- Role: Portfolio Admin
- Story: As a Portfolio Admin, I want to view which jurisdictions the companies across my portfolio operate in, so that I can oversee cross-company operational, tax, and policy coverage from the supported catalog.
- Priority: Medium
- Source: FR 6.4.1, FR 6.4.3 (portfolio oversight of catalog-driven company jurisdictions)

## JUR-09: Assign jurisdictions across companies in a group
- Role: Group Company Admin
- Story: As a Group Company Admin, I want to assign and review the jurisdictions in which the companies of my group operate, so that group-wide operations, taxation, and policy applicability are aligned to the supported catalog.
- Priority: Medium
- Source: FR 6.4.1, FR 6.4.3 (group-level assignment of company jurisdictions from the catalog)

## JUR-10: See jurisdiction-driven policies and taxes applied to me
- Role: Employee (User)
- Story: As an Employee (User), I want the policies and tax/fee treatment that apply to me to reflect the jurisdiction(s) I operate under, so that my policy applicability and taxation are correct for my region.
- Priority: Medium
- Source: FR 6.4.2 (jurisdiction-driven policy and tax applicability for employees)

## JUR-11: Ensure a company operates in at least one jurisdiction
- Role: Company Admin
- Story: As a Company Admin, I want each company to be associated with at least one jurisdiction from the catalog, so that its operations, taxation, and policy applicability always resolve to a valid supported region.
- Priority: Medium
- Source: FR 6.4.3 (a company operates in one or more jurisdictions)

## JUR-12: Persist jurisdictions as effective-dated catalog records with history
- Role: Platform Admin
- Story: As a Platform Admin, I want each jurisdiction catalog entry and its tax/fee applicability to be stored as effective-dated records with full change history, so that operations, taxation, and policy applicability resolve correctly as of any point in time and past decisions remain auditable.
- Priority: High
- Source: FR 6.4.1 (L1 domain/data: catalog entries as effective-dated records with history & integrity)

## JUR-13: Govern jurisdiction tax/fee and policy rule-packs as versioned effective-dated config
- Role: Platform Admin
- Story: As a Platform Admin, I want jurisdiction tax/fee applicability and policy-applicability criteria to be defined as versioned, effective-dated rule-packs that the engines read, so that regional rules can be changed and rolled forward without code changes.
- Priority: High
- Source: FR 6.4.2 (L2 config/metadata: versioned effective-dated jurisdiction rule-packs)

## JUR-14: Have the Rules engine evaluate jurisdiction as applicability criteria
- Role: Company Admin
- Story: As a Company Admin, I want the shared Rules engine to evaluate jurisdiction as a decision-table input when determining tax/fee and policy applicability, so that the correct outcome is produced consistently wherever jurisdiction drives a decision.
- Priority: High
- Source: FR 6.4.2 (L3 engines: Rules engine evaluating jurisdiction decision criteria)

## JUR-15: Manage the jurisdiction catalog through a metadata-driven screen
- Role: Platform Admin
- Story: As a Platform Admin, I want a metadata-driven catalog screen with search, filtering, and navigation for jurisdictions, so that I can efficiently find, add, and maintain supported jurisdictions and their tax/fee settings.
- Priority: Medium
- Source: FR 6.4.1, FR 6.4.2 (L4 presentation: metadata-driven catalog screen with search/navigation)

## JUR-16: Have jurisdiction-driven policies and taxes resolved on my behalf
- Role: Employee (Non-User)
- Story: As an Employee (Non-User), I want the policies and tax/fee treatment that apply to me to be resolved from the jurisdiction(s) my company operates me under, even though I do not log in, so that my policy applicability and taxation are correct for my region.
- Priority: Medium
- Source: FR 6.4.2, FR 6.4.3 (jurisdiction-driven policy and tax applicability for non-user employees)
