# Jurisdictions — User Stories

_Derived from SatelliteHR Phase I BRD — module "Jurisdictions". 7 user stories._

---

## JUR-01: Maintain a catalog of supported jurisdictions

**User story:** As a Platform Admin, I want to maintain a catalog of supported jurisdictions such as countries, states, cities, or other operational regions, so that the platform has a governed, reusable set of regions relevant for operations, taxation, and policy applicability.

**Acceptance criteria:**
- Given I am on the jurisdictions catalog, when I add a new jurisdiction, then it is stored as a catalog entry available for use across the platform.
- Given the catalog exists, when I view it, then I can see all supported jurisdiction entries.
- Given a jurisdiction entry, when I edit or update it, then the changes are reflected wherever the jurisdiction is referenced.

**Priority:** High
**Source:** FR 6.4.1 (catalog of supported jurisdictions)

---

## JUR-02: Support multiple jurisdiction types as catalog entries

**User story:** As a Platform Admin, I want to record jurisdictions of different types — countries, states, cities, or other operational regions — as catalog entries, so that the catalog can represent whatever operational region granularity is needed.

**Acceptance criteria:**
- Given I am creating a jurisdiction, when I choose its type, then I can select country, state, city, or other operational region.
- Given jurisdictions of different types exist, when I browse the catalog, then each entry's type is identifiable.

**Priority:** Medium
**Source:** FR 6.4.1 (countries, states, cities, or other operational regions)

---

## JUR-03: Manage jurisdictions as flat catalog entries, not a mandatory hierarchy

**User story:** As a Platform Admin, I want jurisdictions to be managed as independent catalog entries rather than a mandatory geographic hierarchy, so that I can add regions flexibly without being forced to model parent-child geographic relationships.

**Acceptance criteria:**
- Given I create a jurisdiction entry, when I save it, then I am not required to attach it under a parent geographic node.
- Given the catalog, when I add a city or region, then it can exist independently without a mandated country/state chain.

**Priority:** Medium
**Source:** FR 6.4.1 (catalog entries rather than mandatory geographic hierarchy)

---

## JUR-04: Define tax and fee applicability on a jurisdiction

**User story:** As a Platform Admin, I want to define tax and fee applicability on a jurisdiction where configured, so that operations tied to that jurisdiction can reflect the correct taxes and fees.

**Acceptance criteria:**
- Given a jurisdiction entry, when I configure its tax and fee applicability, then those settings are saved against the jurisdiction.
- Given a jurisdiction with tax and fee applicability configured, when it is referenced in operations, then the configured tax and fee applicability is available for use.
- Given a jurisdiction without tax and fee configuration, when it is used, then the system treats tax and fee applicability as not configured.

**Priority:** High
**Source:** FR 6.4.2 (tax and fee applicability where configured)

---

## JUR-05: Use jurisdictions as policy applicability criteria

**User story:** As a Company/HR Admin, I want to use jurisdictions as applicability criteria when defining policies, so that policies apply correctly based on the jurisdiction they are relevant to.

**Acceptance criteria:**
- Given I am configuring a policy, when I set applicability criteria, then I can select one or more jurisdictions from the catalog.
- Given a policy scoped to a jurisdiction, when the policy is evaluated, then it applies according to the selected jurisdiction criteria.

**Priority:** High
**Source:** FR 6.4.2 (usable as policy applicability criteria)

---

## JUR-06: Assign one or more jurisdictions to a company

**User story:** As a Group Company Admin, I want a company to operate in one or more jurisdictions, so that the company's operations, taxation, and policies can span every region in which it is active.

**Acceptance criteria:**
- Given a company, when I assign jurisdictions to it, then I can add one or more jurisdictions from the catalog.
- Given a company operating in multiple jurisdictions, when I view its configuration, then all associated jurisdictions are listed.
- Given a company, when I remove a jurisdiction association, then the company no longer operates in that jurisdiction.

**Priority:** High
**Source:** FR 6.4.3 (a company may operate in one or more jurisdictions)

---

## JUR-07: Reference catalog jurisdictions consistently across modules

**User story:** As a Company/HR Admin, I want jurisdiction assignments and policy/tax references to draw from the single supported catalog, so that taxation and policy applicability stay consistent across the platform.

**Acceptance criteria:**
- Given the jurisdiction catalog, when I assign a jurisdiction to a company or policy, then I can only select from supported catalog entries.
- Given a jurisdiction is updated in the catalog, when it is referenced by a company, tax/fee setting, or policy, then the reference reflects the current catalog entry.

**Priority:** Medium
**Source:** FR 6.4.1–6.4.3 (single supported catalog underpinning company, tax, and policy usage)
