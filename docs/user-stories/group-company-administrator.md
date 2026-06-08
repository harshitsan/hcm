# Group Company Administrator — User Stories

> The Group Company Administrator governs a set of affiliated companies that genuinely belong together (a holding structure, sister concerns, or a joint venture). They define and maintain the group's relationships, manage shared constructs such as referenced locations and shared policy templates, and act as the explicit, audited gatekeeper for any cross-company sharing or consolidated visibility within their own group (BRD §4.3, §5.4, §6.3).

## Scope & access

- **Authority level: group.** Scope is exactly one group-company structure and its affiliated member companies. The role has no platform-wide and no portfolio-wide authority (FS §7.1; BRD §5.4).
- **CAN:**
  - View the member companies of their own group (`View Assigned Companies (Group)`) and edit group-level details within limits (`Edit Assigned Company (Limited)`) (FS §7.1).
  - Define and maintain the group structure: group name, group type (Holding | Sister | JointVenture), parent company (for Holding), and member companies (`Manage Group (Own)`, `Add/Remove Members (Own)`) (FS GROUP-FR-001..003, UC-GROUP-001).
  - Manage shared locations across the group when sharing is enabled — referencing a location requires explicit approval by the location owner, with a full audit trail (FS GROUP-FR-004; BRD §6.5.4).
  - Configure shared administrative constructs and shared policy templates that member companies can instantiate as their own (read-only templates; no automatic propagation) (FS GROUP-FR-005; BRD §6.3.2).
  - Oversee cross-company sharing approval — the explicit opt-in that turns group consolidation on, which is logged and audited (BRD §6.3.3, §6.3 "explicit authorization and auditability").
  - Enable opt-in consolidated reporting and cross-company directory visibility for the group (the data itself is consumed by the Group Reporting Viewer role) (FS GROUP-FR-006; BRD §6.3.3, §6.21.4).
  - Switch context only among the companies they are authorized for (`Switch to Authorized Companies`) (FS §7.1, UC-PORT-002).
- **BOUNDARIES (CANNOT):**
  - Cannot create, provision, suspend/activate, archive, or delete companies — those are Platform-level actions only (`Create Company`, `Suspend/Activate Company`, `Delete Company` = ❌) (FS §7.1; BRD §5.2).
  - Cannot create the group itself (`Create Group` is Platform Super Administrator only); the GCA governs a group that has been established (FS §7.1).
  - Cannot create or manage portfolios, nor perform any portfolio-level operation; group ≠ portfolio (FS §7.1; BRD §5.3).
  - Cannot reach across to companies outside their own group; a company belongs to at most one group, and at most one portfolio, at a time (BRD §4.5, Assumption 6).
  - Cannot enable cross-company sharing implicitly — it must be an explicit, authorized, audited opt-in; without it, tenant isolation and row-level security fully apply (BRD §4.5, §6.3.3).
  - Is not the owner of a referenced shared location — the owning company controls its details; the GCA/referencing companies only obtain approved, limited references (FS §3.3.2 shared-location permission table).
  - Holds no platform or portfolio admin rights and no company super-admin authority over a tenant's internal HR operations beyond the limited group-level edits granted (FS §7.1; BRD §5.4 vs §5.5).

## User stories

### Group structure governance (BRD §6.3, FS UC-GROUP-001)

- **US-GCA-01** — As a Group Company Administrator, I want to view the group structure I govern with its type and all member companies, so that I have a single, authoritative picture of the affiliated entities under my responsibility. (FS GROUP-FR-001)
- **US-GCA-02** — As a Group Company Administrator, I want to maintain the group's identifying details (group name, group type Holding | Sister | JointVenture, and the parent company for Holding structures), so that the group accurately reflects the real corporate relationship. (FS GROUP-FR-001, GROUP-FR-003)
  - **Acceptance criteria:**
    - **Given** my group is a Holding type, **When** I save the group without a parent company, **Then** the system blocks the save and requires a parent company.
    - **Given** I change the group name, **When** I save, **Then** uniqueness is enforced and the change is written to the audit trail with my identity and timestamp.
- **US-GCA-03** — As a Group Company Administrator, I want to add an active company as a member of my group, so that it participates in shared constructs and consolidated visibility. (FS GROUP-FR-001, GROUP-FR-002, UC-GROUP-001)
  - **Acceptance criteria:**
    - **Given** a candidate company is already a member of another group, **When** I try to add it, **Then** the system rejects it with GROUP_001 (company already in another group).
    - **Given** a candidate company is not in Active status, **When** I try to add it, **Then** the system prevents the addition.
    - **Given** the addition would create a circular ownership (A owns B, B owns A), **When** I save, **Then** the system rejects it with GROUP_002 (circular reference detected).
- **US-GCA-04** — As a Group Company Administrator, I want to remove a company from my group with confirmation, so that entities that no longer belong together stop sharing constructs and consolidated visibility. (FS GROUP-FR-001, UC-GROUP-001)
  - **Acceptance criteria:**
    - **Given** I confirm removal of a member company, **When** the removal completes, **Then** the company's group-derived access (shared references, consolidated reporting inclusion) is revoked and the action is recorded in the audit trail.
- **US-GCA-05** — As a Group Company Administrator, I want the system to enforce that a company can belong to only one group at a time, so that the affiliation hierarchy stays unambiguous and tenant boundaries are preserved. (FS GROUP-FR-002; BRD §4.5)
- **US-GCA-06** — As a Group Company Administrator, I want the system to prevent circular references in holding structures, so that parent-subsidiary relationships remain valid and acyclic. (FS GROUP-FR-002)

### Shared locations (BRD §6.5.4, FS GROUP-FR-004)

- **US-GCA-07** — As a Group Company Administrator, I want to enable location sharing across group companies, so that an office owned by one member can be referenced by others without duplicating master data. (FS GROUP-FR-004)
- **US-GCA-08** — As a Group Company Administrator, I want a member company to be able to reference a location owned by another member only after the owning company explicitly approves, so that the location owner always retains control. (FS GROUP-FR-004, FS §3.3.2 permission table)
  - **Acceptance criteria:**
    - **Given** a member company requests to reference a location owned by another member, **When** the owner has not approved, **Then** the reference is not active.
    - **Given** the owner approves the reference, **When** the approval is recorded, **Then** the referencing company can use the location for employee assignment and the approval is written to the audit trail.
    - **Given** I view a referenced location as a non-owner, **Then** I see only limited details (address, contact) and cannot edit them.
- **US-GCA-09** — As a Group Company Administrator, I want every shared-location reference (grant, use, and removal) to be captured in an audit trail, so that there is a defensible record of which company used whose location and when. (FS GROUP-FR-004; BRD §6.5.4)
- **US-GCA-10** — As a Group Company Administrator, I want a referencing company to be able to stop referencing a shared location, so that sharing can be wound down cleanly when an arrangement ends. (FS §3.3.2 permission table — "Remove Reference")

### Shared administrative constructs & policy templates (BRD §6.3.2, FS GROUP-FR-005)

- **US-GCA-11** — As a Group Company Administrator, I want to publish a shared policy template to the group as a read-only template, so that member companies start from a consistent baseline while keeping company-level control. (FS GROUP-FR-005)
  - **Acceptance criteria:**
    - **Given** I publish a shared policy template, **When** a member company adopts it, **Then** that company creates its own independent policy instance from the template.
    - **Given** I later change the shared template, **When** the change is saved, **Then** it does NOT propagate automatically to already-instantiated company policies.
- **US-GCA-12** — As a Group Company Administrator, I want member companies to be able to instantiate their own policy from a shared template, so that each tenant retains ownership and configurability of its live policy. (FS GROUP-FR-005; BRD §6.10.4)
- **US-GCA-13** — As a Group Company Administrator, I want to configure shared administrative constructs intended for reuse across the group, so that affiliated companies benefit from common setup patterns without losing company-level autonomy. (BRD §4.3, §5.4; FS GROUP-FR-005)
- **US-GCA-14** — As a Group Company Administrator, I want shared templates to be clearly marked read-only to consuming companies, so that no member can accidentally edit the group baseline in place. (FS GROUP-FR-005)

### Cross-company sharing approval & opt-in (BRD §6.3.3, §4.5)

- **US-GCA-15** — As a Group Company Administrator, I want cross-company sharing within my group to remain off by default and require an explicit opt-in, so that tenant isolation is the safe default and consolidation is a deliberate decision. (BRD §4.5, §6.3.3)
  - **Acceptance criteria:**
    - **Given** cross-company access has not been explicitly enabled, **When** any user attempts cross-company directory search or consolidated reporting in the group, **Then** the request is denied and row-level security keeps each company's data isolated.
    - **Given** I explicitly enable cross-company access for the group, **When** the change is saved, **Then** the opt-in event is recorded in the audit trail with my identity, the group, and the timestamp.
- **US-GCA-16** — As a Group Company Administrator, I want to authorize which companies and which kinds of data participate in cross-company sharing, so that consolidation is scoped to exactly what leadership has agreed to expose. (BRD §6.3.3)
- **US-GCA-17** — As a Group Company Administrator, I want every cross-company access attempt — successful or failed — to be logged, so that sharing across affiliated tenants is fully auditable. (BRD §6.3.3; FS §7.2)
- **US-GCA-18** — As a Group Company Administrator, I want to revoke cross-company sharing at any time, so that consolidation can be switched off when the business relationship or compliance posture changes. (BRD §6.3.3, §4.5)
  - **Acceptance criteria:**
    - **Given** cross-company sharing is currently enabled, **When** I revoke it, **Then** consolidated reporting and cross-company directory search for the group stop immediately and the revocation is audited.

### Consolidated reporting & directory enablement (BRD §6.3.3, §6.21.4, §6.23, FS GROUP-FR-006)

- **US-GCA-19** — As a Group Company Administrator, I want to enable opt-in consolidated reporting for the group once cross-company access and group-level roles are in place, so that group leadership can see aggregated headcount, leave/attendance, and an org view across affiliated companies. (FS GROUP-FR-006; BRD §6.3.3)
  - **Acceptance criteria:**
    - **Given** the companies are linked via the group construct AND cross-company access is enabled AND a user holds an explicit group-level role, **When** consolidated reporting is requested, **Then** the system returns aggregated results filtered by row-level security; otherwise it is denied.
- **US-GCA-20** — As a Group Company Administrator, I want to enable cross-company employee directory search for the group, so that authorized group users can find people across affiliated companies with the source company clearly identified. (BRD §6.21.4; FS GROUP-FR-006)
- **US-GCA-21** — As a Group Company Administrator, I want consolidated views to respect privacy controls and row-level security, so that enabling group visibility never bypasses a company's data-protection rules. (BRD §6.21.5, §6.3.3; FS §7.2)
- **US-GCA-22** — As a Group Company Administrator, I want to confirm that group-level roles (e.g., Group Reporting Viewer) are a precondition before consolidated data is exposed, so that visibility is granted through explicit roles rather than implied by group membership. (BRD §6.3.3, §5.4)

### Group context & oversight (BRD §6.12, FS UC-PORT-002)

- **US-GCA-23** — As a Group Company Administrator, I want to switch context only among the companies of my group that I am authorized for, without re-logging in, so that I can govern affiliated entities efficiently within my boundary. (FS §7.1 "Switch to Authorized Companies", UC-PORT-002)
  - **Acceptance criteria:**
    - **Given** I select a company outside my authorized group set, **When** I attempt to switch, **Then** the switch is refused with AUTH_002 (context switch not permitted).
    - **Given** I switch to an authorized member company, **When** the switch completes, **Then** a new token with the company context is issued and the switch is audited (from-company, to-company).
- **US-GCA-24** — As a Group Company Administrator, I want to view (and make limited edits to) group-level details of member companies, so that I can keep affiliation and shared-construct configuration accurate without overriding each tenant's internal HR operations. (FS §7.1 "View/Edit Assigned Company (Limited)")
- **US-GCA-25** — As a Group Company Administrator, I want a record-level change history for the group structure and shared constructs I manage, so that I can review who changed what and when for governance and audit. (BRD §6.29.4)
- **US-GCA-26** — As a Group Company Administrator, I want to receive notifications when shared-location references are requested or when a sharing/opt-in setting changes, so that I stay aware of cross-company activity requiring my oversight. (BRD §6.27.2; FS GROUP-FR-004)

## Primary journeys

1. **Establish and populate a group.** A Platform Super Administrator creates the group and assigns me as Group Company Administrator → I open the group, set its type (e.g., Holding with a parent company) → I add active member companies, with the system rejecting any company already in another group, any inactive company, and any circular reference → the structure is saved and every change is audited.
2. **Turn on shared locations across the group.** I enable location sharing → a member company requests to reference a head office owned by another member → the owning company approves → the referencing company can now assign employees to that location, seeing only limited details → the grant and subsequent use are captured in the audit trail; later, the referencing company removes the reference and that too is logged.
3. **Distribute a shared policy template.** I publish a baseline leave policy as a read-only shared template → each member company instantiates its own independent policy from it → I later revise the template and confirm the change does not retroactively alter the companies' live policy instances.
4. **Enable consolidated visibility deliberately.** With group-level roles in place, I explicitly opt the group into cross-company access → I authorize which companies and data participate → Group Reporting Viewers can now run consolidated headcount and cross-company directory search under row-level security → when the arrangement ends, I revoke the opt-in and consolidation stops immediately, with both the enable and revoke events audited.

## Notes & Phase 2

- **Phase 2 deferrals (out of this role's Phase 1 scope):**
  - Company replication/cloning and company merger workflows are Phase 2 (FS §2.2); the GCA governs existing companies but does not clone or merge them.
  - Vendors and contractors are Phase 2 (BRD §3.2); group-level governance here applies to employee/company constructs only, not contractor or vendor records.
  - Compliance enablement (India) and Payroll are Phase 2 (BRD §3.2); any group-level consolidation of statutory/payroll data is out of scope for Phase 1.
  - White-label / branding customization is Future (FS §2.2).
- **Cross-cutting dependencies:**
  - **RBAC & role model** — group-level roles (Group Company Administrator, Group Reporting Viewer) are distinct from platform, portfolio, and company roles; the GCA cannot assume Platform or Company Super Administrator authority (BRD §6.12; FS §7.1).
  - **Tenant isolation** — group constructs are the only sanctioned cross-company channel within a group, and only when explicitly enabled; default is full isolation with row-level security (BRD §4.5, §6.3.3; FS §7.2).
  - **Audit & logging** — group creation, member changes, shared-location references, sharing opt-in/revoke, and all cross-company access are audited as critical events (BRD §6.29; FS §8.1 GROUP_CREATED, CONTEXT_SWITCHED).
  - **Workflow engine** — shared-location reference approvals and sharing authorizations route through the configurable workflow/approval engine (BRD §6.25; FS GROUP-FR-004).
  - **Notifications** — sharing requests, approvals, and opt-in/revoke changes generate event-driven notifications (BRD §6.27).
  - **Reporting/analytics** — consolidated group reporting and cross-company directory search depend on the reporting module with strict company-access and row-level security filters; heavy consolidated reports are expected to run against a read replica/analytics store (BRD §6.23.6, §6.21.4; roadmap performance note).
- **Invariant respected throughout:** User ≠ Employee ≠ Contractor, and a company belongs to at most one group and at most one portfolio at a time (BRD §1, §4.5).
