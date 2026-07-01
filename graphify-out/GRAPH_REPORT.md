# Graph Report - .  (2026-06-09)

## Corpus Check
- 85 files · ~172,945 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 922 nodes · 2192 edges · 83 communities (57 shown, 26 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 118 edges (avg confidence: 0.81)
- Token cost: 392,770 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Execution Architecture & ADRs|Execution Architecture & ADRs]]
- [[_COMMUNITY_Org & Master Data (UI)|Org & Master Data (UI)]]
- [[_COMMUNITY_Dependencies|Dependencies]]
- [[_COMMUNITY_ImportExport & RBAC|Import/Export & RBAC]]
- [[_COMMUNITY_UI Primitives|UI Primitives]]
- [[_COMMUNITY_App Shell Hooks & Pages|App Shell Hooks & Pages]]
- [[_COMMUNITY_Per-Company Data Generator|Per-Company Data Generator]]
- [[_COMMUNITY_Announcements Screen|Announcements Screen]]
- [[_COMMUNITY_Interviews & Recruitment|Interviews & Recruitment]]
- [[_COMMUNITY_HR Letters Screen|HR Letters Screen]]
- [[_COMMUNITY_Inbox & Stat Primitives|Inbox & Stat Primitives]]
- [[_COMMUNITY_Feedback & Grievance|Feedback & Grievance]]
- [[_COMMUNITY_Performance & Probation|Performance & Probation]]
- [[_COMMUNITY_Custom Fields & Roles|Custom Fields & Roles]]
- [[_COMMUNITY_Leave & Form Primitives|Leave & Form Primitives]]
- [[_COMMUNITY_Companies & Tenancy|Companies & Tenancy]]
- [[_COMMUNITY_Profile (ESS) Screen|Profile (ESS) Screen]]
- [[_COMMUNITY_TS App Config|TS App Config]]
- [[_COMMUNITY_TS Node Config|TS Node Config]]
- [[_COMMUNITY_Asset Lifecycle|Asset Lifecycle]]
- [[_COMMUNITY_Candidates Pipeline|Candidates Pipeline]]
- [[_COMMUNITY_HR Lifecycle Concepts|HR Lifecycle Concepts]]
- [[_COMMUNITY_Notifications Center|Notifications Center]]
- [[_COMMUNITY_Tenancy ADRs & Gaps|Tenancy ADRs & Gaps]]
- [[_COMMUNITY_UI Tokens & Avatars|UI Tokens & Avatars]]
- [[_COMMUNITY_Company Setup Wizard|Company Setup Wizard]]
- [[_COMMUNITY_BRD PlatformPortfolio Model|BRD Platform/Portfolio Model]]
- [[_COMMUNITY_Workflow Builder|Workflow Builder]]
- [[_COMMUNITY_ESS & Phase 2 (Contractors)|ESS & Phase 2 (Contractors)]]
- [[_COMMUNITY_App Shell  Nav|App Shell / Nav]]
- [[_COMMUNITY_App State & Identity Model|App State & Identity Model]]
- [[_COMMUNITY_Compute & Stack ADRs|Compute & Stack ADRs]]
- [[_COMMUNITY_WorkflowTimePolicy (R2)|Workflow/Time/Policy (R2)]]
- [[_COMMUNITY_India Statutory Compliance|India Statutory Compliance]]
- [[_COMMUNITY_Notifications Provider|Notifications Provider]]
- [[_COMMUNITY_Transfers & Exit|Transfers & Exit]]
- [[_COMMUNITY_Identity, RBAC & Phase 2|Identity, RBAC & Phase 2]]
- [[_COMMUNITY_Role-Scoped Nav Config|Role-Scoped Nav Config]]
- [[_COMMUNITY_Org Master Data & Lifecycle|Org Master Data & Lifecycle]]
- [[_COMMUNITY_Cross-Module Rules & Identity|Cross-Module Rules & Identity]]
- [[_COMMUNITY_tailwind.config.js|tailwind.config.js]]
- [[_COMMUNITY_generate (per-company seeded dat|generate (per-company seeded dat]]
- [[_COMMUNITY_ADR-009 Backend Language = TypeS|ADR-009 Backend Language = TypeS]]
- [[_COMMUNITY_navConfig|navConfig]]
- [[_COMMUNITY_store.tsx|store.tsx]]
- [[_COMMUNITY_Groups|Groups]]
- [[_COMMUNITY_Avatar Placeholder System (Avata|Avatar Placeholder System (Avata]]
- [[_COMMUNITY_getDepartment()|getDepartment()]]
- [[_COMMUNITY_ADR-006 Audit & Temporal (hash-c|ADR-006 Audit & Temporal (hash-c]]
- [[_COMMUNITY_acmeData()|acmeData()]]
- [[_COMMUNITY_ADR-012 Data Residency = India-o|ADR-012 Data Residency = India-o]]
- [[_COMMUNITY_Data Model Extensibility (Custom|Data Model Extensibility (Custom]]
- [[_COMMUNITY_tsconfig.json|tsconfig.json]]
- [[_COMMUNITY_6-Step Company Creation Wizard|6-Step Company Creation Wizard]]
- [[_COMMUNITY_Candidates Screen|Candidates Screen]]
- [[_COMMUNITY_Audit Trail & Change Logging|Audit Trail & Change Logging]]
- [[_COMMUNITY_permissionMatrix|permissionMatrix]]
- [[_COMMUNITY_ADR-013 Edge = Cloudflare  Clou|ADR-013 Edge = Cloudflare / Clou]]
- [[_COMMUNITY_Paved-Road Platform Foundation (|Paved-Road Platform Foundation (]]
- [[_COMMUNITY_Data Governance and Retention|Data Governance and Retention]]
- [[_COMMUNITY_Companies Screen|Companies Screen]]
- [[_COMMUNITY_People Directory Screen|People Directory Screen]]
- [[_COMMUNITY_Documents Screen|Documents Screen]]
- [[_COMMUNITY_cn (class-name combiner)|cn (class-name combiner)]]
- [[_COMMUNITY_Employee Self-Service (ESS)|Employee Self-Service (ESS)]]
- [[_COMMUNITY_Company Finance  Compliance Vie|Company Finance / Compliance Vie]]
- [[_COMMUNITY_Company IT  Security Admin|Company IT / Security Admin]]
- [[_COMMUNITY_Employee - Limited Access|Employee - Limited Access]]
- [[_COMMUNITY_Feedback and Grievance|Feedback and Grievance]]
- [[_COMMUNITY_Functional Manager  Project Man|Functional Manager / Project Man]]
- [[_COMMUNITY_Group Reporting Viewer|Group Reporting Viewer]]
- [[_COMMUNITY_Non-Functional Requirements|Non-Functional Requirements]]
- [[_COMMUNITY_Platform Operations Admin|Platform Operations Admin]]
- [[_COMMUNITY_Platform Security & Compliance A|Platform Security & Compliance A]]
- [[_COMMUNITY_Portfolio HR Operations User|Portfolio HR Operations User]]
- [[_COMMUNITY_Portfolio Read-Only  Auditor|Portfolio Read-Only / Auditor]]
- [[_COMMUNITY_Attendance Screen|Attendance Screen]]
- [[_COMMUNITY_Custom Fields Screen|Custom Fields Screen]]
- [[_COMMUNITY_Org Chart Screen|Org Chart Screen]]
- [[_COMMUNITY_SatelliteHR Favicon Brand Mark|SatelliteHR Favicon Brand Mark]]

## God Nodes (most connected - your core abstractions)
1. `useApp()` - 75 edges
2. `useToast()` - 65 edges
3. `cn()` - 63 edges
4. `useCompanyData()` - 52 edges
5. `Badge()` - 34 edges
6. `Button()` - 32 edges
7. `Company HR Administrator` - 32 edges
8. `Card()` - 31 edges
9. `PageHeader()` - 31 edges
10. `CardBody()` - 28 edges

## Surprising Connections (you probably didn't know these)
- `Employee - Limited Access` --references--> `Feedback & Grievance Management`  [EXTRACTED]
  /Users/harshitsan/Documents/heliverse/hcm/docs/user-stories/employee-limited-access.md → app/src/pages/Feedback.tsx
- `companies` --implements--> `Multi-tenant portfolio/group/company model`  [INFERRED]
  app/src/data/mock.ts → /Users/harshitsan/Documents/heliverse/hcm/app/src/data/mock.ts
- `Audit Log Screen` --conceptually_related_to--> `RBAC and Permission Model`  [INFERRED]
  /Users/harshitsan/Documents/heliverse/hcm/app/src/pages/Audit.tsx → /Users/harshitsan/Documents/heliverse/hcm/docs/user-stories/candidate.md
- `Employee - Limited Access` --semantically_similar_to--> `Employee – Standard`  [INFERRED] [semantically similar]
  /Users/harshitsan/Documents/heliverse/hcm/docs/user-stories/employee-limited-access.md → docs/user-stories/employee-standard.md
- `Functional Manager / Project Manager` --semantically_similar_to--> `Department Head / People Manager`  [INFERRED] [semantically similar]
  /Users/harshitsan/Documents/heliverse/hcm/docs/user-stories/functional-project-manager.md → docs/user-stories/department-head-people-manager.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Company context switch data flow** — shell_companyswitcher, store_appstate, companydata_usecompanydata, companydata_getcompanydata [INFERRED 0.75]
- **Employee Onboarding Flow** — hcm_satellitehr_phase_i_brd_1_talent_acquisition, hcm_satellitehr_phase_i_brd_1_onboarding, hcm_satellitehr_phase_i_brd_1_task_checklist_management, hcm_satellitehr_phase_i_brd_1_employee_asset_management [EXTRACTED 1.00]
- **Indian Statutory Compliance Acts** — hcm_satellitehr_phase_ii_brd_1_epf_act, hcm_satellitehr_phase_ii_brd_1_esi_act, hcm_satellitehr_phase_ii_brd_1_gratuity_act, hcm_satellitehr_phase_ii_brd_1_bonus_act, hcm_satellitehr_phase_ii_brd_1_maternity_benefit_act [EXTRACTED 1.00]
- **Product Release Roadmap R0-R4** — hcm_release_r0, hcm_design_partner_ga, hcm_release_r2, hcm_release_r3, hcm_release_r4 [EXTRACTED 1.00]
- **Tech Stack ADRs (language, framework, compute, data, residency)** — hcm_adr_009_typescript, hcm_adr_014_framework, hcm_adr_010_compute, hcm_adr_011_data_tier, hcm_adr_012_residency [EXTRACTED 1.00]
- **Company-tier roles (single-tenant authority)** — role_company_super_administrator, role_company_hr_administrator, role_company_it_security_admin, role_company_finance_compliance_viewer [EXTRACTED 1.00]
- **Read-only consolidated cross-company reporting with RLS** — role_group_reporting_viewer, role_portfolio_read_only_auditor, concept_reporting_analytics [INFERRED 0.75]
- **Portfolio-tier roles** — role_portfolio_manager, role_portfolio_hr_operations_user, role_portfolio_read_only_auditor [INFERRED 0.85]
- **Tenancy Isolation Decision (D2 → ADR-001 → RLS)** — hcm_gap_d2_isolation_contradiction, hcm_adr_001_tenancy, hcm_tenant_isolation_rls, hcm_set_local_company_id [EXTRACTED 1.00]
- **Shared Notification Store: Provider feeds Bell + Notifications page; read state syncs** — app_notifications_provider, components_shell_bellmenu, app_notifications_usenotifications [EXTRACTED 1.00]
- **Role-Scoped Navigation: navForRole filters navConfig, AppShell renders sidebar + command palette** — app_nav_navconfig, app_nav_navforrole, components_shell_appshell [EXTRACTED 0.85]
- **Orbit Design System realized via tokens, primitives, and shell layout** — designsystem_orbit, app_tailwind_config, components_ui_primitives [INFERRED 0.85]
- **Approval-chain / multi-step workflow screens** — pages_performance, pages_feedback, pages_letters, pages_home, pages_interviews [INFERRED 0.75]
- **Role-gated dual-view (employee self-service vs admin) screens** — pages_announcements, pages_assets, pages_feedback, pages_letters, pages_performance, pages_dataporting [INFERRED 0.75]
- **Screens sharing useCompanyData / useApp tenant context** — pages_announcements, pages_assets, pages_orgdata, pages_performance, pages_profile, pages_reports [EXTRACTED 1.00]
- **Company-scoped administration tier** — role_company_super_administrator, role_company_hr_administrator, role_company_it_security_admin [EXTRACTED 1.00]
- **Platform (cross-tenant) governance tier** — role_platform_super_administrator, role_platform_operations_admin, role_platform_security_compliance_admin [EXTRACTED 1.00]
- **Roles depending on the Workflow Engine** — role_company_hr_administrator, role_company_super_administrator, role_department_head_people_manager, role_employee_standard, role_platform_super_administrator [EXTRACTED 1.00]

## Communities (83 total, 26 thin omitted)

### Community 0 - "Execution Architecture & ADRs"
Cohesion: 0.09
Nodes (75): Approach A — Modular Monolith on Serverless Containers, Data-Driven Workflow Engine (product feature, not infra orchestration), SatelliteHR Execution Architecture (small-team edition), Reporting on Read Replica / Analytics Store, Tenant Isolation Invariant (PostgreSQL RLS), Announcements, Audit and Logging, Audit and Logging (+67 more)

### Community 1 - "Org & Master Data (UI)"
Cohesion: 0.05
Nodes (37): Org Structure & Master Data Management, Cross-Company Portfolio Management, ADD_LABEL, DEPARTMENTS, DeptNode, DeptRow(), flattenDepts(), flattenGroups() (+29 more)

### Community 2 - "Dependencies"
Cohesion: 0.06
Nodes (35): dependencies, clsx, dagre, lucide-react, react, react-dom, react-router-dom, recharts (+27 more)

### Community 3 - "Import/Export & RBAC"
Cohesion: 0.06
Nodes (29): Bulk Data Import / Export & Portability, Role-Based Access Control / Role Gating, savedReports, DONUT_COLORS, ENTITIES, EntityDef, Format, FORMATS (+21 more)

### Community 4 - "UI Primitives"
Cohesion: 0.09
Nodes (22): Button(), Drawer(), EmptyState(), Segmented(), Select(), Td(), Th(), CompanyData (+14 more)

### Community 5 - "App Shell Hooks & Pages"
Cohesion: 0.16
Nodes (32): useApp(), CompanySwitcher(), SidebarContent(), useToast(), useCompanyData(), Announcements(), Assets(), Attendance() (+24 more)

### Community 6 - "Per-Company Data Generator"
Cohesion: 0.10
Nodes (25): cache, CITY_BY_STATE, DEPT_NAMES, DEPT_SHORT, FIRST, IC_TITLES, LAST, attendanceMix (+17 more)

### Community 7 - "Announcements Screen"
Cohesion: 0.09
Nodes (22): AckType, AdminView(), Announcement, Audience, CATEGORY_TONE, daysFromToday(), DIM_ICON, DIM_TONE (+14 more)

### Community 8 - "Interviews & Recruitment"
Cohesion: 0.08
Nodes (22): Recruitment & Interview Management, CARD_STATUS_LABEL, CARD_STATUS_TONE, CardStatus, Criterion, Interview, JOURNEY, JOURNEY_DOT (+14 more)

### Community 9 - "HR Letters Screen"
Cohesion: 0.08
Nodes (20): axisStyle, CHANNEL_ICON, CHANNEL_MIX, DeliveryChannel, DeliveryStatus, DISTRIBUTION, DistributionRow, FLOW_COLUMNS (+12 more)

### Community 10 - "Inbox & Stat Primitives"
Cohesion: 0.12
Nodes (18): Avatar(), Card(), CardTitle(), hashStr(), PageHeader(), StatCard(), Unified Approval Inbox / Dashboard, Employee (+10 more)

### Community 11 - "Feedback & Grievance"
Cohesion: 0.09
Nodes (18): Feedback & Grievance Management, axisTooltip, CATEGORIES, Category, Kind, kindIcon, KINDS, kindTile (+10 more)

### Community 12 - "Performance & Probation"
Cohesion: 0.09
Nodes (17): Performance, Probation & Lifecycle Milestones, ApprovalState, axisStyle, CHAIN_STATE_TONE, ChainStep, Cycle, CYCLE_TREND, CycleStage (+9 more)

### Community 13 - "Custom Fields & Roles"
Cohesion: 0.10
Nodes (17): CardBody(), Tooltip(), CustomField, customFields, RoleDef, roleDefs, ENTITIES, Entity (+9 more)

### Community 14 - "Leave & Form Primitives"
Cohesion: 0.14
Nodes (12): Field(), ProgressBar(), Tabs(), Textarea(), Tr(), LeaveRequest, Policy, cn() (+4 more)

### Community 15 - "Companies & Tenancy"
Cohesion: 0.12
Nodes (15): Table(), Authentication & Multi-Tenant Persona Hierarchy, groups, portfolios, Companies(), lifecycle, lifecycleStep(), StatusFilter (+7 more)

### Community 16 - "Profile (ESS) Screen"
Cohesion: 0.10
Nodes (17): HR Letters & Document Issuance, ASSET_TONE, AssetState, CHANGE_REQUESTS, ChangeRequest, ChangeStatus, EditableField, EditableKey (+9 more)

### Community 17 - "TS App Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 18 - "TS Node Config"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+9 more)

### Community 19 - "Asset Lifecycle"
Cohesion: 0.12
Nodes (17): AvatarStack(), Asset Lifecycle Management, Digital Acknowledgement / Receipt, AssetRow, CATEGORIES, Category, CATEGORY_ICON, daysUntil() (+9 more)

### Community 20 - "Candidates Pipeline"
Cohesion: 0.12
Nodes (13): Badge(), Input(), Candidate, Stage, stageAccent, STAGES, stageTone, EData (+5 more)

### Community 21 - "HR Lifecycle Concepts"
Cohesion: 0.12
Nodes (18): Announcements, Candidate, Company HR Administrator, Employee Asset Management, Employee Lifecycle Management, Exit Management, Interview Panel Member, Notifications and Communications (+10 more)

### Community 22 - "Notifications Center"
Cohesion: 0.12
Nodes (15): Announcements & Broadcast Communication, axisStyle, Channel, Digest, FilterTab, KIND_META, NotifKind, NotifRow() (+7 more)

### Community 23 - "Tenancy ADRs & Gaps"
Cohesion: 0.15
Nodes (16): ADR-001 Tenancy (shared-schema + RLS), AI-Augmented SDLC, Company Lifecycle State Machine, Company Management Module, Multi-Company Context Switching, Data Management (Import / Export), Design-Partner GA (R1 / Core HR MVP / Phase I Core GA), Gap D2 — Contradictory Data-Isolation Model (+8 more)

### Community 24 - "UI Tokens & Avatars"
Cohesion: 0.14
Nodes (12): AV_SIZE, avatarTints, btnSizes, btnVariants, ButtonSize, ButtonVariant, FEMALE_NAMES, IconBtnVariant (+4 more)

### Community 25 - "Company Setup Wizard"
Cohesion: 0.14
Nodes (11): setupSteps, currencies, defaults, Form, indianStates, languages, regTypes, stepHints (+3 more)

### Community 26 - "BRD Platform/Portfolio Model"
Cohesion: 0.16
Nodes (14): Audit and Logging, SatelliteHR Phase I BRD (Document), Companies, Employee Directory and Org Chart, Group Company Administrator, Group Company Management, Multi-Tenant SaaS Model, Operating Hierarchy (Platform > Portfolio > Group Company > Company) (+6 more)

### Community 27 - "Workflow Builder"
Cohesion: 0.17
Nodes (9): Stepper(), Switch(), approverRoles, workflowTemplates, Mode, modeOptions, SEED, Step (+1 more)

### Community 28 - "ESS & Phase 2 (Contractors)"
Cohesion: 0.20
Nodes (12): Employee Self-Service, Employee - Standard, Leave Management, Contractor, Contractor Engagement Models, Contractor - Restricted, Contractor - Standard, Mobile Application (+4 more)

### Community 29 - "App Shell / Nav"
Cohesion: 0.27
Nodes (10): navForRole(), AppShell(), CommandPalette(), CreateMenu(), HelpModal(), MenuItem, TopBar(), IconButton() (+2 more)

### Community 30 - "App State & Identity Model"
Cohesion: 0.22
Nodes (11): acmeData (Kensium c1 rich dataset), getCompanyData, Per-company data layer, useCompanyData, companies, employees, personas (login-as), User != Employee link (+3 more)

### Community 31 - "Compute & Stack ADRs"
Cohesion: 0.22
Nodes (11): ADR-002 Modularity (FaaS handlers, revised to monolith), ADR-010 Compute = Pure FaaS on AWS Lambda, ADR-011 Data Tier = Aurora Serverless v2 + Data API + RLS, Aurora Serverless v2 PostgreSQL + Data API + RLS, Fargate / App Runner (serverless containers), Modular Monolith on Serverless Containers, NestJS framework, NFR Program (sub-2s, 99.99% uptime, RTO 4h/RPO 15min) (+3 more)

### Community 32 - "Workflow/Time/Policy (R2)"
Cohesion: 0.20
Nodes (11): ADR-004 Workflow Engine (build, durable execution), Gap D3 — Open Requirements Unanswered, Leave Management, Notifications & Communications, Policy Management & Distribution/Acknowledgment, R2 Time and Policy, Reporting & Analytics, Reporting on Read Replica / Analytics Store (+3 more)

### Community 33 - "India Statutory Compliance"
Cohesion: 0.18
Nodes (11): Statutory Workforce Data Capture (Indian Labor Law), Payment of Bonus Act 1965, Compliance Dashboards and Alerts, Compliance Enablement (India), Employees' Provident Fund (EPF) Act 1952, Employees' State Insurance (ESI) Act 1948, Payment of Gratuity Act 1972, Labour Welfare Fund (State Specific) (+3 more)

### Community 34 - "Notifications Provider"
Cohesion: 0.22
Nodes (8): ADMIN_NOTIFS, Ctx, Notif, NotificationsProvider(), NotifKind, NotifState, SEED_NOTIFS, AppProvider()

### Community 35 - "Transfers & Exit"
Cohesion: 0.20
Nodes (9): CardHeader(), ClearanceFn, ClearanceItem, fnIcon, seedClearance, seedTransfers, statusTone, TransferRecord (+1 more)

### Community 36 - "Identity, RBAC & Phase 2"
Cohesion: 0.20
Nodes (10): ADR-003 Identity Model (User/Employee/Contractor aggregates), ADR-005 AuthN/AuthZ (OIDC + policy-as-code OPA/Cedar), Gap D1 — Corrupted ESI Statutory Form List, Identity Invariant (User != Employee != Contractor), India Statutory Compliance Enablement (tracker, not filer), Mobile App (Phase 2), Payroll Management, Role-Based Access Control (RBAC) (+2 more)

### Community 37 - "Role-Scoped Nav Config"
Cohesion: 0.22
Nodes (8): ADMINS, ALL, HRPLUS, NavGroup, NavItem, PORTFOLIO, STAFFPLUS, Role

### Community 38 - "Org Master Data & Lifecycle"
Cohesion: 0.28
Nodes (9): Data Management (Import/Export), Data Model Extensibility (Custom Fields), Department Head / People Manager, Departments, Documents and Attachments, Employees, HR Letters and Certificates, Manager Hierarchy and Reporting Structure (+1 more)

### Community 39 - "Cross-Module Rules & Identity"
Cohesion: 0.25
Nodes (8): Company Super Administrator, Cross-Module Business Rules, Separation of User Identity from Workforce Records, Integrations and APIs, Roles and Security (RBAC), Tenant Isolation, User Authentication, User (System User) Entity

### Community 40 - "tailwind.config.js"
Cohesion: 0.38
Nodes (6): UI Primitives Library, ToastProvider(), Orbit Design System (Build Contract), Orbit Page Skeleton Pattern, Orbit Primitive Catalog, Orbit CSS Color Tokens

### Community 41 - "generate (per-company seeded dat"
Cohesion: 0.29
Nodes (7): generate (per-company seeded data), mulberry32 (seeded RNG), Mock data (single source of truth), Multi-tenant portfolio/group/company model, Frontend-only no-backend prototype, SatelliteHR UI Prototype, Unified inbox concept

### Community 42 - "ADR-009 Backend Language = TypeS"
Cohesion: 0.29
Nodes (7): ADR-009 Backend Language = TypeScript (supersedes .NET), ADR-014 Framework = Hono + zod + managed Node, BRD §8.10.2 .NET Default Stack, Bun (dev tooling + container batch), Hono framework, AWS-managed Node.js Lambda runtime, TypeScript (backend language)

### Community 43 - "navConfig"
Cohesion: 0.40
Nodes (6): navConfig, NotificationsProvider (Shared Store), SEED_NOTIFS / ADMIN_NOTIFS, useNotifications(), BellMenu(), 5-Role Persona Gating Pattern

### Community 44 - "store.tsx"
Cohesion: 0.33
Nodes (5): AppState, Ctx, Company, Persona, personas

### Community 45 - "Groups"
Cohesion: 0.33
Nodes (6): Groups, Jurisdictions, Locations, Policy Management, Labor Law Policy Configuration, Multi-Jurisdiction Support (Future)

### Community 46 - "Avatar Placeholder System (Avata"
Cohesion: 0.60
Nodes (5): Avatar Placeholder System (Avatar Component), Business Man Illustration (AI Generative) - Male Avatar Placeholder, Confident Businessman in Formal Suit - Male Avatar Placeholder, Female Avatar Placeholder (Businesswoman in Blazer), Male Avatar Placeholder (Businessman in Suit and Tie)

### Community 47 - "getDepartment()"
Cohesion: 0.40
Nodes (5): getDepartment(), getEmployee(), reportsOf(), Directory(), formatJoin()

### Community 48 - "ADR-006 Audit & Temporal (hash-c"
Cohesion: 0.40
Nodes (5): ADR-006 Audit & Temporal (hash-chained, bitemporal), Audit & Logging (immutable, hash-chained), Authentication & SSO (SAML/AD/O365/Google), Gap D4 — Inconsistent Effective-Dating Rules, R0 Foundation

### Community 49 - "acmeData()"
Cohesion: 0.50
Nodes (4): acmeData(), generate(), getCompanyData(), mulberry32()

### Community 50 - "ADR-012 Data Residency = India-o"
Cohesion: 0.50
Nodes (4): ADR-012 Data Residency = India-only plane, AWS (ap-south-1 Mumbai / ap-south-2 Hyderabad), India Data Residency (data + compute plane), DPDP Act 2023 / Aadhaar UIDAI rules

### Community 51 - "Data Model Extensibility (Custom"
Cohesion: 0.50
Nodes (4): Data Model Extensibility (Custom Fields), Employee Lifecycle Management, R3 Talent and Lifecycle, Talent Acquisition

### Community 53 - "6-Step Company Creation Wizard"
Cohesion: 0.67
Nodes (3): 6-Step Company Creation Wizard, Configuration, not Customization, Progressive Disclosure (UX principle)

### Community 54 - "Candidates Screen"
Cohesion: 0.67
Nodes (3): Candidates Screen, Onboarding Screen, Requisitions Screen

## Ambiguous Edges - Review These
- `tailwind.config.js` → `Orbit Design System (Build Contract)`  [AMBIGUOUS]
  app/DESIGN-SYSTEM.md · relation: conceptually_related_to
- `Orbit Design System (Build Contract)` → `Orbit CSS Color Tokens`  [AMBIGUOUS]
  app/DESIGN-SYSTEM.md · relation: rationale_for

## Knowledge Gaps
- **471 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+466 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **26 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `tailwind.config.js` and `Orbit Design System (Build Contract)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Orbit Design System (Build Contract)` and `Orbit CSS Color Tokens`?**
  _Edge tagged AMBIGUOUS (relation: rationale_for) - confidence is low._
- **Why does `useApp()` connect `App Shell Hooks & Pages` to `Org & Master Data (UI)`, `Import/Export & RBAC`, `UI Primitives`, `Per-Company Data Generator`, `Announcements Screen`, `Interviews & Recruitment`, `HR Letters Screen`, `Inbox & Stat Primitives`, `Feedback & Grievance`, `Performance & Probation`, `Custom Fields & Roles`, `Leave & Form Primitives`, `Companies & Tenancy`, `Profile (ESS) Screen`, `Asset Lifecycle`, `Candidates Pipeline`, `Notifications Center`, `Company Setup Wizard`, `Workflow Builder`, `App Shell / Nav`, `Notifications Provider`, `Transfers & Exit`, `store.tsx`, `getDepartment()`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Why does `Notifications and Communications` connect `Execution Architecture & ADRs` to `Profile (ESS) Screen`, `Notifications Center`, `Announcements Screen`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Why does `Employee Self-Service (ESS)` connect `Execution Architecture & ADRs` to `Import/Export & RBAC`, `Announcements Screen`, `HR Letters Screen`, `Feedback & Grievance`, `Performance & Probation`, `Profile (ESS) Screen`, `Asset Lifecycle`, `Notifications Center`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _473 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Execution Architecture & ADRs` be split into smaller, more focused modules?**
  _Cohesion score 0.09009009009009009 - nodes in this community are weakly interconnected._