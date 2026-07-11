# SatelliteHR POC — Prototype Code/Feature Audit (2026-07-11)

> Companion document: [`prototype-ux-audit.md`](./prototype-ux-audit.md) covers the live-app UX audit (Playwright, 8 screen groups, 342 screenshots).

## 1. How this was produced

A multi-agent code/feature audit over the frontend-only mock HRMS: 32 per-module auditors graded every module against the Kensium HRMS feature docs, Phase I/II BRDs, user stories and `design/00-CONVENTIONS.md`, after a baseline pass captured the canonical page anatomy (workflows and leave are the de facto reference implementations — see the appendix). Scoring legend: 1-5 per axis — feature completeness, layout conformance to the canonical anatomy, config findability. A companion live-app UX audit was run in parallel (`prototype-ux-audit.md`); its findings are merged into the prioritized worklist below. Payroll is out of scope; RBAC fixes are deferred per direction.

## 2. Score matrix

Scores ≤2 in **bold**. F = feature completeness, L = layout conformance, C = config findability.

| Module | F | L | C | Biggest gap |
|---|---|---|---|---|
| employees | 4 | 4 | **2** | Three fully built suites (configuration, onboarding/exit, performance) are orphan routes with no nav link |
| workflows | 5 | 4 | 4 | No delegate-target user picker — delegation reuses escalation with a hardcoded reason (WFE-13) |
| lifecycle | 4 | 4 | 4 | Layoff List workflow missing — config already seeded, only the grid absent |
| self-service | 4 | 3 | 3 | Attendance/asset team functions (Mass Approval, OT/WFH review, Timesheet Utilization Summary) missing; 'Apply leave' is a toast excuse |
| recruitment | 5 | 4 | 4 | convertToEmployee never creates a real employee/onboarding record cross-module (use-offers.ts:452) |
| leave | 4 | 4 | 4 | Admins have no approve/reject path on Requests (no mass-approval, pending row-click only re-sorts); exports toast-only |
| attendance | 4 | 3 | 4 | My Timesheet Entry screen wholly missing (weekly grid, Copy/Import, Submit for Approval) |
| assets | 4 | 3 | 4 | Damaged/lost reporting and warranty/threshold alerts declared in registry (module-registry.ts:535-538) but no UI |
| companies | 5 | 4 | 3 | No approval workflow instance for company creation/lifecycle; ad-hoc admin pill nav |
| group-companies | 4 | 3 | 3 | No report/directory export or member-company multi-select filter (US-GRV-05/07/18); no catalog slice |
| portfolios | 4 | 3 | **2** | Outside the config model — no TARGET_MODULES entry or EngineArtifactsPanel; ?company= URL param ignored |
| jurisdictions | 4 | 3 | 3 | No catalog slice/EngineArtifactsPanel; jurisdiction-association audit trail missing (US-HR-03) |
| locations | 4 | 3 | 4 | Work Area config screen missing (catalog artifact targets Locations); no row-click detail sheet |
| departments | 4 | 4 | 3 | No bulk import/export via Import framework (BRD I §7.1); merge/restructure registry events have no UI |
| positions | 4 | 4 | 4 | No bulk position import; created/filled/vacated registry events never emitted |
| org-groups | 5 | 4 | 4 | runEligibilityEngine never mutates dynamic-group membership (use-org-groups.ts:560) |
| directory | 4 | 4 | 3 | Employee self-service 'Add Feedback/Grievance' form + My Feedback list missing — feedback is admin-triage only |
| policies | 4 | 4 | 4 | Module-integration toggles not backed by catalog artifacts (use-policies.ts:351); no row-click detail sheet |
| policy-distribution | 4 | 3 | 3 | Outside the config model entirely — no targetModule, zero events/entities, no EngineArtifactsPanel |
| announcements | 5 | 4 | 4 | 'Thought of the day' catalog artifact kx-084 has zero UI surface |
| notifications | 5 | 4 | 4 | Inbox 'Open item' and task Initiate are toast stubs, not deep links |
| hr-letters | 5 | 4 | 4 | No Reports tab; 'Certificate expiring' scheduler alerts declared but never surfaced |
| feedback | 4 | 4 | 4 | Survey responses die with the tab — never persisted to the useSurveys store (my-surveys-tab.tsx:70) |
| custom-fields | 4 | 4 | 4 | Import bypasses the sanctioned UploadModal staging/validate/dry-run flow (BRD 6.26.5) |
| data-management | 5 | 4 | 4 | Wizard limits/formats not bound to the published config version — governance demo falls flat |
| documents | 5 | 4 | 4 | Live Admin stores vs catalog artifacts bl-24/kx-072/kx-080 hold contradictory config truth |
| reports | 4 | 4 | 3 | Every report renders the same shared mock rows; RLS grants don't actually scope anything |
| roles-security | 4 | 4 | 3 | 'Group' missing as a scope-rule dimension (RSEC-03 High); password/MFA policy duplicated with Authentication |
| authentication | 4 | 4 | 4 | MFA entirely absent (BRD 6.12.5); lockout policy never enforced in use-login-session.ts |
| audit-logs | 4 | 4 | 4 | Live module mutations never reach the central trail — /audit-logs shows only seed data |
| platform-admin | 4 | 3 | 4 | Subscription tier/limits/module-entitlement enforcement missing (US-PA-42..44); Terminate fires with no confirm (critical) |
| dashboard | 5 | 3 | 3 | Hero stats hardcoded off-registry; POC-meta copy speaks to demo builders, not HR users; missing canonical chrome |

## 3. Cross-cutting findings

- Raw ui Table / hand-rolled <table> instead of shared DataTable — ~20 modules: lifecycle, self-service, recruitment, leave, attendance, assets, companies, group-companies, jurisdictions, locations, departments, policy-distribution, announcements, hr-letters, feedback, custom-fields, data-management, documents, reports, roles-security, platform-admin (MiniTable). Loses sorting, column search, selection and standard empty states everywhere.
- Local re-implementations of workflows/components/table-helpers.tsx (sortableHeader + select column) — 15+ modules: employees, self-service, directory, departments, org-groups, jurisdictions, policies, announcements, feedback, custom-fields, data-management, hr-letters, portfolios, locations, reports, policy-distribution, audit-logs, leave (request-columns.tsx:16). Byte-similar forks, zero shared imports.
- Non-canonical tab strip: TabsList 'bg-transparent p-0 h-auto' / 'mb-3' variants, no role-filtered TabDef[], no takeRequestedTab deep-linking — 22 of 32 modules including employees (index.tsx:160-168), lifecycle, companies, group-companies, portfolios, jurisdictions, locations, departments, positions, org-groups, directory, policies, policy-distribution, announcements, notifications, hr-letters, feedback, data-management, documents, assets, authentication, audit-logs, platform-admin.
- No onRowClick detail sheet; view/edit only via checkbox-selection + toolbar icon — locations, departments, positions, org-groups (Eye button), jurisdictions, policies, hr-letters (documents-tab.tsx:202), documents, feedback, custom-fields, authentication, platform-admin, portfolios, announcements, roles-security, attendance, self-service. Breaks the row-click-opens-FloatingSheetContent baseline and stalls demos.
- Hooks skip the canonical { append, actor, actorRole } audit contract; no Admin Activity log — employees (use-employees.ts:49), self-service, attendance, assets, companies (bare actor string), directory, departments, positions, announcements, notifications, hr-letters, documents, data-management, reports, locations, jurisdictions, platform-admin. Only workflows/leave/lifecycle comply; /audit-logs consequently shows only seed data.
- Toast-only exports/downloads — leave, attendance, assets, companies, portfolios, recruitment, directory (org-chart PNG/PDF), policy-distribution ('Export isn't available'), data-management (error CSV), reports (all exports), dashboard (billing), hr-letters (PDF), documents. Counter-proof the real thing is cheap: directory xlsx export, org-groups CSV, custom-fields CSV all produce actual files.
- Bulk import bypasses or omits the sanctioned UploadModal staging→validate→dry-run framework — simulated with hardcoded rows/filename inputs in attendance (use-attendance.ts:192), portfolios (operations-tab.tsx:157), org-groups (IMPORT_FILE_ROWS), policy-distribution (isBulk flag), custom-fields (toast stub), data-management's own wizard (filename text input); entirely absent in employees, positions, departments, companies, locations, assets, policies, lifecycle, platform-admin.
- Same setting configured in two+ unsynced places (live module store vs inert workflow-catalog artifact) — assets (categories x3), documents (bl-24/kx-072/kx-080), announcements (kx-068/069), custom-fields (bl-12), hr-letters (templates), notifications (templates), feedback (enable/receivers/templates), positions (4 setting artifacts), authentication (kx-124/kx-125), companies (bl-18), roles-security (ca-05/ca-14 dead-end toggles), employees (orphan config page vs kx-*), data-management ('Import Functions'), attendance (rules in Workflows classic admin AND module Admin).
- Seven modules have NO catalog slice at all — targetModule undefined, zero artifacts, no EngineArtifactsPanel: group-companies, portfolios, jurisdictions, directory, policy-distribution, audit-logs, reports (dashboard too, arguably fine). These break 'every module's config is the catalog filtered to it' outright.
- Missing per-module Reports tab despite conventions §8 — employees, workflows, self-service, companies, locations, policies, notifications, hr-letters, roles-security, org-groups, custom-fields, audit-logs. Recruitment and reports module show what good looks like.
- Badge variants outside the fixed vocabulary (qualified/disqualified/booked/overlay_open, semantic reuse of overdue) — employees, self-service, group-companies, org-groups, positions, feedback, data-management, authentication, roles-security, hr-letters, custom-fields.
- SummaryCards styling forks with drift — text-2xl instead of text-3xl (self-service, assets, platform-admin) and lg:grid-cols-5 instead of lg:grid-cols-4 (companies, departments, org-groups, announcements, feedback, data-management, authentication); leave/employees carry byte-identical copies. 12+ modules total.
- Nonexistent 'border-grey-200' class token — assets (35 uses), self-service, policy-distribution, announcements, audit-logs, platform-admin, org-groups. One-line codemod fixes all.
- Raw AlertDialog instead of shared ConfirmDialog for destructive confirms — jurisdictions, locations, departments, positions, policies, policy-distribution, announcements, documents, custom-fields, reports, roles-security, dashboard.
- Bespoke pagination instead of leave's usePager/PagerControls — locations, departments, positions (numbered pager), org-groups, policies (CatalogPagination), self-service, feedback, data-management, hr-letters; card lists in notifications/attendance/companies have no paging at all.
- Nested Tabs-within-Tabs or one-off segmented pill selectors inside a page — workflows (Browse/Governance), lifecycle (orientation), leave (team-tab ghost tabs), attendance (approvals/tracking + Review/Capture pills), self-service (admin sub-tabs + Time segmented control), departments (config-tab), assets (config sub-tabs), feedback (surveys sub-tab wizard), recruitment (SegmentedSelector), companies (admin pill nav), roles-security (segmented Admin strip).
- Registry drift: module-registry declares events/submodules with no UI counterpart or stale labels — assets (damaged/lost, warranty), positions (created/filled/vacated never emitted), locations (deactivated/head-assigned), departments (merge/restructure), leave (rollover), policies (ack events), hr-letters (certificate expiring), authentication (lockout), data-management (scheduled job), workflows (stale tab labels), employees/self-service (submodules omit real tabs), directory/policy-distribution/audit-logs (empty entries).
- Dead-end catalog artifacts with no consuming UI — announcements kx-084 Thought of the day, authentication kx-077 Login Page Images, locations Work Area (kensium-artifacts.ts:2538), roles-security ca-05/ca-14 toggles, assets module-enable kx (kensium-artifacts.ts:69).

### Scaffold spec

Extract a `src/components/module-page/` kit by PROMOTING what workflows and leave already do (they are the de facto reference implementations), not inventing anything new: (1) `ModulePage` — composes CommonHeader (title, bg-blue-150) + Main fluid bg-neutral-200 + single w-full body div; absorbs per-module chrome and fixes dashboard's missing tint/fluid. (2) `ModuleTabs` — takes TabDef[]{value,label,roles}, filters via useRole, key={role}, defaultValue = takeRequestedTab(route) ?? first visible, canonical TabsList 'mb-2 flex-wrap'; absorbs the 22 ad-hoc tab strips and hardcoded role branches. (3) Promote `SummaryCards` from workflows/components/summary-cards.tsx to shared; delete the 12 forks (leave, employees byte-identical; self-service/assets/platform-admin text-2xl drift; 7 modules grid-cols-5 drift). (4) Promote `SortableHeader`, `selectColumn()`, `SectionToolbar` from workflows/components/table-helpers.tsx into components/common/data-table/; delete 15+ local copies. (5) `TableToolbar` ('mb-3 flex flex-wrap items-center justify-between gap-2', FilterSelect h-7 secondary triggers, search Input h-7 w-[180px], right actions slot) + `CreateButton` (variant='red' bg-orange-1200 h-7 Plus size 10) — currently re-typed per module with h-8/default-variant drift. (6) Promote `usePager`/`PagerControls`/`RefreshButton` from leave/components/list-controls.tsx to shared; replaces 9+ bespoke pagers. (7) `makeStatusBadge(map)` factory constrained to the fixed variant vocabulary (badge_active/badge_inactive/open/pending/completed/overdue/dropped/live), modeled on leave/workflows badges.tsx; kills qualified/disqualified/booked drift in 11 modules. (8) `EmptyStateCard` / `BlockedStateCard` — Card border-gray-200 + CardContent py-10 text-center with title/body props; replaces ~13 ad-hoc p-6/py-12/dashed-div states. (9) `AdminSections` — stacked role-gated <section>s (h3 'text-paragraph-md text-neutral-1400 mb-3 font-semibold', Separator between, EngineArtifactsPanel slot rendered once at top); replaces nested admin Tabs (self-service, departments, assets, feedback) and pill navs (companies, roles-security). (10) `DetailSheet` — Sheet+FloatingSheetContent wrapper with SheetHeader, badge row, Separator sections, and optional decision footer (mandatory-comment Textarea + action Select), modeled on workflows RequestDetailSheet; standard target for the 17 modules missing onRowClick. (11) `exportCsv(rows, filename)` util generalizing directory's xlsx / custom-fields' CSV blob code; wired anywhere export exists. (12) `createAuditedStore` helper enforcing the { append, notify, actor, actorRole } contract plus a shared `ActivityLogSection`, so module mutations feed /audit-logs. Rollout: adopt in the six demo-path modules first (employees, workflows, lifecycle, leave, attendance, recruitment), long tail after.

### Config model findings

Configuration is scattered across four planes: (a) live module-local stores — SettingsWorkspace/ConfigTab in leave/attendance/recruitment/lifecycle (the good pattern), bespoke wizards elsewhere; (b) workflow-catalog artifacts (kx-*/bl-*) that duplicate the same settings but are inert — 14 modules have at least one setting existing in both places with no sync (worst: assets categories in three places; password policy in roles-security AND authentication AND kx-125; attendance rules in Workflows classic admin AND module Admin); (c) hardcoded data/*.ts constants with no editing surface (employees filter options, jurisdictions/timezones in locations, ROLE_COMPANY_ACCESS in reports, signing authorities in hr-letters); (d) orphan/buried surfaces — the nine-tab /employees/configuration page has no link anywhere, feedback survey config is three levels deep, locations' Group Admin can't reach the Admin tab at all. Seven modules (group-companies, portfolios, jurisdictions, directory, policy-distribution, audit-logs, reports) have targetModule undefined and no EngineArtifactsPanel — outside the model entirely — while companies/org-groups/policies technically comply but with 1-artifact slices that look empty. Two modules render EngineArtifactsPanel TWICE in one Admin tab (leave index.tsx:250 + settings-groups.tsx:45; attendance index.tsx:191 + settings-groups.tsx:447). The rule to apply is the conventions' rule with one refinement, because the plain 'module admin tab = filtered catalog slice' is demonstrably insufficient when slices are empty or duplicated: BIDIRECTIONAL SINGLE-STORE BINDING — every governed setting is registered as exactly one catalog artifact (targetModule set for all 32 modules); the module Admin tab renders EngineArtifactsPanel ONCE as the index, and each artifact row deep-links (module-nav/takeRequestedTab) to the module's live editor, which reads/writes the SAME store the catalog displays (version badge vN, updated-by shared). Concretely: kill the 5 dead-end artifacts or give them surfaces, delete the 2 double-renders, merge the 14 duplicate pairs, and promote hardcoded constant lists to 'setting' artifacts as they're touched.

## 4. Merged prioritized worklist

Features first; demo order employees → workflows → lifecycle/leave/attendance/recruitment → rest. Demo-unblocking quick wins pulled forward. Overlapping code/UX findings merged (source references in parentheses: code = this audit's synthesis worklist, UX = the companion `prototype-ux-audit.md` worklist). Payroll excluded; RBAC deferred to the tail.

1. [employees] (S) Link the three orphan routes — /employees/configuration, lifecycle (onboarding/exit), performance — via sidebar submodules and in-page links; turn the plain-text 'Employee Configuration' footnote (index.tsx:259-263) into a real link. Instantly unhides three fully built suites. (code worklist #1; quick win)
2. [employees] (M) Make mass-update field-grid categories actually mutate selected records (use-employees.ts:339-352) instead of toast-only. (code #2)
3. [employees] (M) My Profile: add a Save button + confirmation for the required 'Custom profile fields' (currently unsubmittable — ux-workforce-core-employees-user-profile-bottom.png) and persist values past component state (my-profile-tab.tsx:50); add anchor/sub-tab nav for the ~4,000px profile. (UX #4 + code partial)
4. [employees] (M) Add global name-search input and a Reports tab to the Directory toolbar. (code #3)
5. [workflows] (S) Delegate-target user picker in the approval inbox (approval-inbox.tsx:336, WFE-13/BRD 6.4.3) + sync stale registry submodule labels. (code #5; quick win)
6. [workflows] (S) Left-side status/type/company filters + search on the Requests instances table per canonical toolbar. (code #6)
7. [workflows] (M) Fix 'Find any setting' relevance ('leave' must surface leave-named settings); reconcile publish state (clear Draft badge, align toast version, dismiss stale toasts); add 'Showing X of Y' to Governance (renders 16 of '203'). (UX #17 + UX count-mismatch gap)
8. [workflows] (M) Add a Reports slice — approval cycle times, SLA breaches, volume by module. (code #8)
9. [lifecycle] (M) Build Layoff List workflow — bulk initiate, min-employee guard, location approvers; config already seeded (data/config.ts:280-401), only the grid is missing. (code #11)
10. [lifecycle] (M) Add New Joinees and Class Change lists as filtered views over onboarding/probation grids (Employee Management docs). (code #12)
11. [leave] (M) Give admins an approve/reject path: Approvals tab cloned from /attendance (inline Approve/Reject, SLA countdown) or an actionable pending-row detail sheet, plus mass-approval (selectColumn + bulk Approve/Reject) on the Requests grid. Core leave loop currently dead-ends. (UX #1 + code #10)
12. [leave] (S) Real CSV download on Reports/Employee Summary export via a shared exportCsv util (copy custom-fields' blob code) — seeds the pattern for 12 other toast-only modules. (code #9; quick win)
13. [leave] (M) Manager filter parity: 'Pending with me' status, employee-class filter, From/To range, Reset buttons (ETOR/EOHR/PTOA/ETOS). (code #13)
14. [attendance] (S) Inline 'Raise correction' action on flagged rows ('Missed punch', 'Late arrival') instead of requiring the My Requests tab switch. (UX #6)
15. [attendance] (L) Build My Timesheet Entry screen — weekly entry grid, type-of-work, Copy/Import, Submit for Approval (the one wholly missing Kensium screen). (code #14)
16. [self-service] (S) Wire 'Apply leave' to the real Leave apply dialog or deep-link to /leave; make 'My pending tasks' red chips navigate; reorder Overview so tasks/balances/quick actions sit above the fold. (UX #2 + #3 + code toast stubs)
17. [recruitment] (M) convertToEmployee creates a real employee + onboarding record cross-module (use-offers.ts:452) — the strongest missing demo beat. (code #16)
18. [recruitment] (M) Make pipeline funnel cards filter the candidate table; gate the 9 grey bulk actions behind row selection; fix Offers Actions overflowing the card; add Talent Pool doc-parity columns (contact, interview status, communication status). (UX #7 + code #17; quick-win columns)
19. [platform-admin] (S) Confirmation dialogs for Terminate and 'Revoke first membership', reusing the /custom-fields named-consequence confirm — the audit's only critical finding, and a live demo hazard. (UX #13)
20. [self-service] (L) Attendance/asset team functions: Mass Approval, OT/WFH review, pending change requests, Timesheet Utilization Summary (Kensium Team Functions docs). (code #18)
21. [leave] (M) Encashment request flow and year-rollover action matching registry-declared events. (code #20)
22. [shared] (L) Extract the module-page scaffold kit per scaffoldSpec (ModulePage, ModuleTabs, SummaryCards, table-helpers, TableToolbar, PagerControls, StatusBadge factory, EmptyStateCard, AdminSections, DetailSheet, exportCsv, createAuditedStore) and adopt it in the six demo-path modules first — employees, workflows, lifecycle, leave, attendance, recruitment — including DataTable migration of raw tables. (code #21 + #22)
23. [shared] (L) Roll out the /employees//companies row-click DetailSheet to /directory, /policies, /policy-distribution (ack drill-down), /audit-logs (prev/new values), /leave Requests and the six organization tables — kills the undocumented checkbox-then-icon ritual. (UX #5 + code cross-cutting #3)
24. [config] (M) Set targetModule, seed artifacts and embed EngineArtifactsPanel in the seven modules outside the config model: group-companies, portfolios, jurisdictions, directory, policy-distribution, audit-logs, reports. (code #23)
25. [config] (L) Bidirectional single-store binding for the 14 duplicated settings (assets categories ×3, documents taxonomy, hr-letters/notifications templates, feedback, authentication kx-124/125, announcements kx-068/069); delete the leave/attendance double EngineArtifactsPanel renders. (code #24)
26. [audit-logs] (M) Feed live module append stores (leave, employees, workflows) into the central trail so demo actions appear immediately in /audit-logs. (code #25)
27. [reports] (M) Distinct output rows per report id ('every report shows identical data' is the most demo-visible flaw); wire RLS grants to actual scoping instead of the ROLE_COMPANY_ACCESS constant. (code #26; quick-win rows)
28. [copy/jargon] (M) Plain-language rewrite, employee surfaces first: leave toast → 'Request submitted — pending with Rahul Menon'; remove 'tenant metadata' banner, 'UDF'/'Phase II', 'schema v3'/'tpl v3', SLA-% chips on the employee policy inbox; legend/tooltips for P/PF/G/C badges; expand 'LOP'; make /locations IP/CIDR optional. (UX #11)
29. [forms] (M) First-submit flags everything inline next to the field: leave 'Client Billing Code', documents File field; stop false 'Invalid input' on optional /positions fields; kill duplicate inline+toast on /companies; disable 'Distribute now' at 0 recipients; prefix look-like-values placeholders with 'e.g.' ('Asha Rao', 'Senior Backend Engineer', 'Q3 All-Hands on 10 July'). (UX #10)
30. [layout] (M) Fix 1512px right-edge clipping via a column-width audit on the shared table component: /directory + /employees Actions/Stage, /policies Owner, /announcements badges, /feedback SLA, /data-management timestamps, /roles-security names, /recruitment Offers. (UX #12)
31. [nav] (M) Navigation truthfulness: land 'Notifications' on its Notifications tab (or rename), default /assets to Requests and /authentication to its first tab, align 'Employee Lifecycle' label with its page title, merge/rename the two 'Directory' surfaces and two 'Groups', reflect detail sheets in the URL + add breadcrumbs. (UX #14)
32. [uniformity] (M) Chrome pass: one tab style (segmented pills per /leave//employees) across /lifecycle, /assets, /companies, /announcements, /directory, /platform-admin; one create verb ('New X'); one pagination pattern with 'Showing X of Y' (fixes 16-of-203 on /workflows, 7-of-10 on /recruitment); one role-context header label. (UX #8 + code #37 partial)
33. [uniformity] (M) Toolbar pass: instant-filter pattern (search + status filters + labeled actions) on /group-companies, /portfolios, /reports (62 reports unsearchable); drop /announcements' Search/Reset buttons; label every icon-only action with tooltip and show 'N selected' (org-groups, portfolios, policies, custom-fields, roles-security, assets). (UX #9)
34. [directory] (M) Employee self-service 'Add Feedback/Grievance' form + My Feedback status list — currently admin-triage only (Kensium doc parity). (code #27)
35. [announcements] (M) 'Thought of the day' surface consuming catalog artifact kx-084 (only documented capability with zero UI); row-click detail sheet with history + decision footer. (code #28)
36. [documents/hr-letters] (S) onRowClick detail sheets on the document grids — the hr-letters sheet already exists (documents-tab.tsx:202), current select-then-Eye flow stalls demos. (code #29; quick win)
37. [data-management] (M) Bind wizard limits/formats to the published config version so publishing visibly changes enforcement; generate a real record-level error CSV (index.tsx:163). (code #30)
38. [authentication] (M) Enforce lockout against policy threshold in use-login-session.ts (fire 'User locked out' audit events); add MFA enrollment/challenge step to the sign-in simulator (BRD 6.12.5). (code #32)
39. [group-companies] (M) Consolidated report/directory export, member-company multi-select filter, read-only profile sheet (US-GRV-05/07/16/18). (code #33)
40. [portfolios] (M) Honor ?company= on the /portfolios route (context-tab.tsx:43) so bookmarked URLs really switch context (PORT-FR-006); route bulk employee import through UploadModal. (code #34; quick-win param)
41. [platform-admin] (L) 6-step tenant wizard with duplicate detection, mandatory suspension reason/approval, and subscription tier/employee-limit/module-entitlement enforcement (US-PA-01/03/07, US-PA-42..44). (code #31)
42. [shared] (L) Route all simulated imports (attendance, org-groups, policy-distribution, custom-fields, portfolios) through the UploadModal staging → validate → dry-run flow. (code #35)
43. [mega-pages] (L) Break up Classic admin (~6,800px) into anchored sections, /custom-fields and /platform-admin Tenants into sub-tabs, split Exits from KT tasks on /lifecycle, paginate the Folders ~20,000px 203-card scroll. (UX #16)
44. [dashboard] (L) Replace POC-meta dashboards with role-relevant homes reusing existing widgets (pending approvals for admins; leave balance + tasks for employees); derive hero stats from module-registry; add bg-blue-150/Main-fluid chrome; expand sidebar groups by default. (UX #18 + code quick win #7)
45. [polish] (S) Global codemod: border-grey-200 → border-gray-200 (~41 uses, borders render wrong today), badge-vocabulary normalization, lucide → phosphor in org-groups/notifications/dashboard. (code #36; quick win)
46. [employees] (S) Move the 'Engine features for this module — 32 of 33 active' toggle panel off /employees into the Admin/Workflows area. (UX #15)

### Deferred (RBAC)

1. [roles-security] (M) Add 'group' as a real scope-rule dimension (type, overlay, ruleAllowsPerson, simulator — RSEC-03 High); role-matrix wiring; manager-role gating. (code #38)
2. [global] (L) Scope /employees for the Employee role (hide admin KPIs and delegation controls), fix the Platform-Admin default-role lockout of Leave/Attendance/Recruitment/Documents, hide rather than grey the 19 locked sidebar items. Note: merged-worklist items 1-3 and 16 deliver most of the employee-experience value without touching RBAC. (UX #19)

## 5. Quick wins (sub-1-hour)

1. employees: Add sidebar/in-page links to the three orphan routes (/employees/configuration, lifecycle, performance) — instantly unhides three fully built suites; also convert the plain-text 'Employee Configuration' footnote (index.tsx:259-263) into a link.
2. hr-letters: Add onRowClick={openSheet} to the documents DataTable (documents-tab.tsx:202) — the detail sheet already exists, current select-then-Eye flow stalls demos.
3. workflows: Delegate-target Select in the approval inbox and registry submodule label sync (Requests/Configure/Build/Classic admin) — two small edits, both demo-visible.
4. leave + attendance: Delete the duplicate EngineArtifactsPanel render in each Admin tab (leave index.tsx:250, attendance index.tsx:191) — one-line removals that end visible confusion.
5. Global codemod: border-grey-200 → border-gray-200 (~41 occurrences across assets, self-service, policy-distribution, announcements, audit-logs, platform-admin, org-groups) — nonexistent class means those borders render wrong today.
6. leave: Real CSV download on Reports export by copying custom-fields' existing CSV blob code — turns the most-clicked dead-end toast into a working artifact.
7. dashboard: Derive hero stats (module count, story count) from module-registry and add bg-blue-150 CommonHeader + Main fluid chrome (index.tsx:14,43-53).
8. portfolios: Honor ?company= search param on the /portfolios route (context-tab.tsx:43) — makes the bookmarkable-URL story real instead of a simulated button.
9. recruitment: Add the missing Talent Pool columns (contact number, interview status, communication status) for direct Kensium doc parity.
10. reports: Vary mock output rows per report id instead of shared per-category rows — 'every report shows identical data' is the most demo-visible flaw in the module.

## 6. Per-module detail

### employees (/employees)

**Scores:** feature 4/5 · layout 4/5 · config 2/5

**Implemented:** Role-scoped directory grid (company/group/portfolio) with five filters and column search; Create/edit employee sheet with zod validation and government-ID dedup block/allow logic; Auto vs manual employee code series driven by governed configuration; Detail sheet: overview, reporting audit trail, statutory eligibility, lifecycle timeline; Company Admin actions: suspend, reassign roles, link/unlink user account, lifecycle events; Rules/accrual engine stand-in recomputes eligibility and leave balances; Acting-manager delegations with effective-dated manager-change audit trail; Self-service profile: placement, reporting, statutory, dependants, life events, Kensium extras; Custom profile fields via CustomFieldsSection (employees.profile extensible form); Projects tab: bulk assignments, day-wise allocation, project master, task library; Mass update dialog; position/class/jurisdiction changes really mutate records; Summary cards scoped to role; EngineArtifactsPanel embedded for admin roles.

**Partial:**
- Mass-update field-grid categories are toast-only, records never mutate (use-employees.ts:339-352)
- Delegation reroutedApprovals is static seed data; no live workflow rerouting (use-employees.ts:243)
- Onboarding/exit suite fully built but unreachable — no nav link (routes/_authenticated/employees/lifecycle.tsx)
- Performance & Requests suite (appreciations, quadrant, salary, class changes) unreachable (routes/_authenticated/employees/performance.tsx)
- Custom profile field values live in local component state, never persisted (my-profile-tab.tsx:50)
- Hooks skip the { append, actor, actorRole } audit contract leave uses (use-employees.ts:49)

**Missing:**
- Reports tab / per-module reporting deliverable (conventions §8; Kensium list exports)
- Global employee-name search box on directory (Kensium Employee Master page text)
- Bank details capture despite 'Employee bank details changed' event (module-registry.ts:321)
- Bulk employee import via UploadModal/Import framework (conventions §7)
- Document expiry tracking backing 'Employee document expired' event (module-registry.ts:323)

**Layout deviations:**
- Tab strip not role-filtered TabDef[]; all four tabs always render, gating pushed inside panels (index.tsx:161-168)
- takeRequestedTab not used in Tabs defaultValue; module-nav.ts:25 maps Employees to null (index.tsx:160)
- DelegationsTab uses SimpleTable plus default-styled 'New delegation' button, not DataTable/orange create button (delegations-tab.tsx:181,188)
- Local FilterSelect trigger h-8 w-fit min-w-[130px] vs baseline h-7 w-[170-200px] (shared.tsx:90)
- Local sortableHeader and select column duplicate workflows table-helpers SortableHeader/selectColumn (employees-table-columns.tsx:22-62)
- StatusBadge maps to qualified/disqualified variants outside the fixed badge vocabulary (shared.tsx:19-20)
- No consolidated Admin tab; admin config split onto orphan /employees/configuration page (configuration-page.tsx:34)
- Sub-pages omit summary cards and EngineArtifactsPanel (lifecycle-page.tsx:30, performance-page.tsx:31, configuration-page.tsx:33)

**Config locations & issues:**
- Location: EngineArtifactsPanel module='Employees' inside admin RoleGate at src/features/employees/index.tsx:307-309
- Location: Workflow catalog: 32 Employees-targeted artifacts in src/features/workflows/data/kensium-artifacts.ts plus business-logic.ts:447
- Location: Standalone nine-tab page at /employees/configuration (configuration-page.tsx + data/configuration.ts + hooks/use-configuration.ts) — orphan route, no link anywhere
- Location: Hardcoded constants (COMPANIES, DEPARTMENTS, POSITIONS, JURISDICTIONS, LOCATIONS, EMPLOYEE_CLASSES, LIFECYCLE_STAGES) in src/features/employees/data/employees.ts
- Location: ADMIN_COMPANY_ID / ADMIN_GROUP persona constants hardcoded in src/features/employees/index.tsx:32-33
- Location: 'employees.profile' extensible form declared in src/config/module-registry.ts:328-335; fields authored in /custom-fields
- Issue: Richest config surface (nine-tab /employees/configuration) has no sidebar entry or in-app link — undiscoverable in a demo
- Issue: Directory footnote names 'Employee Configuration → Types & Directory' as plain text with no link (index.tsx:259-263)
- Issue: Dedup rules, lifecycle stages, notifications, approver chains duplicated between configuration-page store and workflow-catalog kx-* artifacts
- Issue: Directory filter options hardcoded in data/employees.ts despite the UI claiming they are metadata-driven
- Issue: Registry submodules omit lifecycle/performance/configuration, hiding them from nav and the workflows attach dialog

**Top fixes:**
1. Surface the three orphan pages (configuration, onboarding/exit, performance) via sidebar submodules or in-page links — major built features are invisible
2. Turn the 'Employee Configuration' footnote into a real link and reconcile its nine tabs with the EngineArtifactsPanel catalog slice
3. Make mass-update field-grid categories actually mutate selected records instead of toast-only (use-employees.ts:339-352)
4. Add a Reports tab and a global name-search input to the Directory toolbar
5. Wire delegation rerouting counts and store mutations into the { append } audit contract for demo credibility

### workflows (/workflows)

**Scores:** feature 5/5 · layout 4/5 · config 4/5

**Implemented:** Requests tab: instance monitoring, SLA health badges, routed initiation, live detail sheet; Approval engine: sequential, parallel-any, parallel-all, mixed patterns; rejection halts workflow (WFE-03..06); Escalation: manager/role/time-reassignment strategies; reminders at 50/75, escalation at 100 (WFE-07..10,14); Configure catalog: 174 Kensium + 18 seed artifacts, 8 types, versions, updated-by columns; Layered scope matrix (P/G/C) with effectively-active vs blocked-upstream pills (WFE-47); Browse view: module rail, type rail, folders with drag-drop, JSON bundle import/export; Build tab: canvas designer, undo/redo, run simulation, publish/version-bump into catalog (WFE-25); Classic admin: definitions, routing decision table, approver chains, SLAs, tenant toggles, audit; Approver chains for all 9 Kensium categories incl. exit-clearance, layoff thresholds (WFE-27..39); Guided Save & Next approver setup flow (WFE-42); Form/rule/checklist/template/alert/setting builders with per-type validation (WFE-44..46); Cross-surface 'Find any setting' search with deep navigation to any surface; Append-only audit trail store wired into every mutating hook (WFE-12,21); EngineArtifactsPanel consumed by ~28 modules as their config surface (WFE-49); Actionable approval inbox (approve/reject/delegate/remind) shared with Tasks & Notifications (WFE-13,26).

**Partial:**
- Delegation reuses escalateTask with fixed reason, no target-user picker (approval-inbox.tsx:336, BRD 6.4.3/WFE-13)
- Real-time SLA tracking is a manual 'Advance SLA clock +25%' simulation (instances-tab.tsx:255-263, WFE-11)
- Inbox search/filtering only via DataTable column search; no dedicated filter toolbar (approval-inbox.tsx:284-297, WFE-26)
- Catalog artifacts versioned but not effective-dated; only definitions carry effectiveFrom/To (data/business-logic.ts, WFE-22)
- Persistence: all stores in-memory, reset on reload; only designer library hits localStorage (designer/state/store.ts:98, WFE-19/21)

**Missing:**
- No Reports tab/surface; conventions (00-CONVENTIONS.md) require per-module reporting deliverable
- Requests table lacks the baseline left-side filters (status/type/company) prescribed by canonical toolbar anatomy
- No standalone WFE-28/36 story-ID tags, though comp-off and exit-clearance categories are implemented in data/approver-groups.ts

**Layout deviations:**
- instances-tab.tsx:227-230 ad-hoc green inline pill for flow-run status instead of StatusBadge/Badge variant vocabulary
- instances-tab.tsx:288 flow-runs card header uses 'text-paragraph-md text-neutral-1400 font-semibold', not canonical h2 'text-neutral-1600 font-medium'
- business-logic-tab.tsx:284-293 nested Tabs (Browse/Governance) inside the Configure tab — second tab strip outside baseline vocabulary
- designer/designer.css: 395 lines of bespoke classes ('wfd','app','main') bypassing shared components (justified for canvas, still one-off)
- instances-tab.tsx:252-274 Requests toolbar has actions only, no left-side FilterSelect/search per baseline toolbar anatomy

**Config locations & issues:**
- Location: Configure tab — THE workflow catalog: business-logic-tab.tsx (governance table + hub-catalog.tsx browse), artifact-builder-sheet.tsx
- Location: Classic admin tab (index.tsx:465-586): configuration hub, definitions, routing/attendance rules, approver chains, SLA calendars/policies, platform toggles, audit
- Location: Build tab (designer/designer-tab.tsx): canvas authoring; browser-local library in localStorage (designer/state/store.ts:98)
- Location: Hardcoded seeds: data/{definitions,routing,approver-groups,sla,attendance-config,platform,configuration,business-logic,kensium-artifacts}.ts
- Location: Registry entry module-registry.ts:698-713 (targetModule undefined — correct, module IS the catalog, no self EngineArtifactsPanel)
- Location: 'Find any setting…' EngineSearch (index.tsx:429) spans every surface with deep links
- Issue: Approver chains, SLAs and routing exist twice: classic admin screens AND catalog artifacts — labeled 'being absorbed' but two sources of truth
- Issue: Attendance rules configured inside Workflows classic admin rather than the Attendance module (routing-tab.tsx) — cross-module scatter
- Issue: Designer's browser-local workflows invisible to Configure/search until published — drafts live in a third place
- Issue: module-registry.ts:705-708 submodule labels (Instances/Business Logic/Designer/Admin) stale vs actual tabs (Requests/Configure/Build/Classic admin)

**Top fixes:**
1. Add delegate-target picker (choose a user) instead of reusing escalation with a hardcoded reason (WFE-13, BRD 6.4.3)
2. Add a Reports slice (approval cycle times, SLA breaches, volume by module) — conventions mandate per-module reporting
3. Add left-side filters + search to the Requests instance table (status/type/company) per canonical toolbar
4. Surface effective-from dates on catalog artifact versions to complete WFE-22 effective-dating story
5. Sync registry submodule labels with tab names and replace the ad-hoc flow-run pill with StatusBadge

### lifecycle (/lifecycle — Employee Lifecycle)  <sub>(Workforce)</sub>

**Scores:** feature 4/5 · layout 4/5 · config 4/5

**Implemented:** Onboarding case grid with staged checklist, versioned templates, detail sheet; Probation/confirmation with decision table, peer and periodic reviews, separation handoff; Transfers grid with approval flow, detail sheet, new-transfer overlay; Exits: Enable Exit, Record Exit, Terminate overlays, clearance, questionnaire, notice rules; Reassignment screen: roles/direct-reports/tasks handover via Dept→Position→Employee cascade; Disciplinary cases with location approvers and exit-coordinator referral into Exits; Orientation programs plus full config (setup, venues, question bank, templates); Knowledge Transfer: admin tasks, employee provided/received views, KT config; Performance review list plus setup section; Append-only audit log tab with module/company filters (DataTable); SettingsWorkspace with 7 groups incl. EngineArtifactsPanel and scope toggles; Employee self-service My Lifecycle: onboarding tasks, exit request, peer reviews, notifications; Role-specific tab sets for Company/Group/Platform admin and employees.

**Partial:**
- Layoff: config exists (data/config.ts:280-401 min-employees, location approvers) but no layoff initiation list/workflow (Layoff List.md)
- Letter templates configurable (settings-groups.tsx:267) but no letter generation from lifecycle events (BRD I §HR Letters)
- Exit status vocabulary diverges from Kensium Exit List.md (no Resignation-initiated/Withdrawn-vs-Revoked distinction); FFS statuses are payroll, ignored
- Reassignment target Dept/Position/Employee lists hardcoded (data/reassignment.ts REASSIGN_*), not org-data driven

**Missing:**
- New Joinees list/report (Employee Management/New Joinees.md)
- Class Change Employees List on confirmation (Employee Management/Class Change Employees List.md)
- Bulk/mass lifecycle updates via sanctioned UploadModal import framework (Mass update of Employee Data.md; conventions #7)
- Transfer downstream impact assessment — assets, leave balances, policies (BRD I §Transfers, line 597)

**Layout deviations:**
- index.tsx:197 TabsList uses ad-hoc 'bg-transparent p-0 h-auto justify-start rounded-none' instead of canonical 'mb-2 flex-wrap'
- reassignment-tab.tsx:174,336 raw ui Table grids instead of DataTable; headers 'text-sm font-semibold' not canonical h2
- exits-tab.tsx:60-71 disabled-module notice is rounded-[6px] p-6 text-xs, not canonical Card py-10 empty-state
- orientation-tab.tsx:17 nested Tabs inside the Admin tab section; baseline mandates stacked sections
- index.tsx:232 KT sub-heading 'text-paragraph-sm text-neutral-1000' instead of h3 'text-neutral-1400 font-semibold' idiom
- No ConfirmDialog usage anywhere for destructive actions (grep empty across components/)
- index.tsx:114-146 role tabs via hardcoded role equality branches, not the TabDef{roles}+useRole filter idiom

**Config locations & issues:**
- Location: Company Admin: Admin tab → 'Lifecycle Settings' → SettingsWorkspace 7 groups (index.tsx:272-277, components/config-tab.tsx, components/settings-groups.tsx)
- Location: Platform Admin: dedicated 'Settings' tab rendering same ConfigTab (index.tsx:323-325)
- Location: EngineArtifactsPanel: inside 'Engine features' settings group (settings-groups.tsx:49) and Group Admin Admin tab (index.tsx:305)
- Location: Workflow catalog: ~30 artifacts targetModule 'Employee Lifecycle' in src/features/workflows/data/kensium-artifacts.ts and business-logic.ts
- Location: Orientation config: separate Admin → Orientation section → Configuration sub-tab (components/orientation-config.tsx), outside SettingsWorkspace
- Location: Performance Review Setup: its own Admin section (index.tsx:265-270), outside SettingsWorkspace
- Location: Hardcoded: data/reassignment.ts REASSIGN_* cascades, data/config.ts seeds, data/shared.ts PERSONAS
- Issue: Orientation and Performance Review setup live outside the Lifecycle Settings workspace — three config surfaces in one Admin tab
- Issue: Company Admin reaches EngineArtifactsPanel only two levels deep (Admin → Settings → Engine features group)
- Issue: Reassignment department/position/employee cascades hardcoded, invisible to any settings surface
- Issue: Company Admin Admin tab is very long (5 stacked sections), slowing 30-second findability

**Top fixes:**
1. Build Layoff List workflow (bulk initiate, min-employee guard, location approvers) — config already seeded, only the grid is missing
2. Add New Joinees and Class Change lists, or filtered views over onboarding/probation grids, per Employee Management docs
3. Fold Orientation config and Performance Review Setup into SettingsWorkspace groups to end the three-surface config scatter
4. Wire bulk lifecycle updates through the shared UploadModal import framework (staging → validate → commit)
5. Normalize TabsList/empty-state classes and swap reassignment raw tables for DataTable

### self-service  <sub>(Workforce)</sub>

**Scores:** feature 4/5 · layout 3/5 · config 3/5

**Implemented:** Overview: policy-gated profile card, approval-routed field edits, change-request approve/reject; Announcements mark-read, authorized documents, feedback submission, leave balances; Cross-module pending-task rollup on Overview (ESS-39); Attendance requests (Out Time/Comp Off/Overtime/WFH): create, cancel, bulk-cancel, filters; My Shift Assignments and daily attendance details tables; Timesheets with entry overlay and submit-for-approval; Travel requests, expenses, advances: create/cancel with state; Team Travel review: approve/reject advances, confirm trips, assign coordinator; Learning requests, programs, certifications; team enrollment mass-approval; Learning admin 5-step wizard (setup, questionnaire, trainers, approvers, topics); Tax deductions/exemptions/LTA/salary tabs; tax-admin category masters CRUD; Assets requisitions, acknowledge receipt, confirm return, withdraw; Work: project allocation summaries and KT give/receive tables; My Timeline feed reusing directory timeline with comments; Admin: section access-policy matrix, field/UDF schema editor, bitemporal version log; Non-user employee blocked state and EngineArtifactsPanel embed.

**Partial:**
- Non-user conversion is toast-only, no state change — admin-tab.tsx:262
- Document download, apply-leave, exemption refresh are toast stubs — overview-tab.tsx:252,292; tax-tab.tsx:249
- Data & Tenancy sub-tab is static explanatory cards plus seeded version log — admin-tab.tsx:294-329
- Hooks lack canonical { append, actor, actorRole } audit wiring; no Activity log section — use-travel.ts:22
- Manager review surfaces gated to admin roles standing in for Manager/Coordinator (RBAC, deferred) — index.tsx:136

**Missing:**
- Attendance team functions: Mass Approval, employee OT/WFH/comp-off review, pending change requests (More/Attendance Tracking/Team Functions)
- Timesheet Utilization Summary team view (More/Time Management/Team Functions)
- Asset team functions: Employee Asset/Requisition lists, New Asset Arrival (More/Asset Tracking/Team Functions)
- Employee Arrear Details (More/Tax Planning/Team Functions)
- Policy acknowledgment inbox with receipt confirmation (Phase I BRD line 519, item 7)
- No Reports tab despite conventions' per-module reporting deliverable

**Layout deviations:**
- No onRowClick detail sheets anywhere; inline approve/reject buttons replace canonical decision footer with mandatory comment — travel-team-tab.tsx:268-275
- Local SummaryCards fork uses text-2xl not text-3xl and adds CardHeader — shared.tsx:34-56
- Ad-hoc FilterBar with h-8 bg-white inputs instead of h-7 secondary-variant toolbar row — shared.tsx:81-122
- Admin tab nests a second Tabs strip instead of stacked h3 sections with Separator — admin-tab.tsx:91-113
- Plain ui Table used for admin/policy/schema/version tables instead of DataTable — admin-tab.tsx:122,176,332
- Custom Pager duplicates leave's usePager/PagerControls — shared.tsx:182
- Local selectColumn duplicates workflows table-helpers — attendance-columns.tsx:11
- StatusBadge uses heuristic string matching and qualified/disqualified variants outside fixed vocabulary — status-badge.tsx:38-47
- One-off segmented button selector for Time group — index.tsx:246-261
- Non-user blocked state uses ad-hoc panel with misspelled border-grey-200 class — index.tsx:163

**Config locations & issues:**
- Location: Admin tab > EngineArtifactsPanel module='Self Service' — admin-tab.tsx:90; 6 catalog artifacts in /poc/src/features/workflows/data/kensium-artifacts.ts (kx-168 etc.)
- Location: Admin tab > Access Policy matrix (view/manage per section) — use-portal.ts + data/portal.ts seedSectionPolicies
- Location: Admin tab > Fields & custom fields (UDF schema, modes, approval flags) — use-profile.ts + data/profile.ts
- Location: Admin tab > Learning Management wizard — learning-admin-tab.tsx + data/learning-admin.ts
- Location: Admin tab > Tax Planning masters — tax-admin-tab.tsx + data/tax-admin.ts
- Location: Admin tab > Non-User Employees — hardcoded NON_USERS in admin-tab.tsx:54
- Location: Admin tab > Data & Tenancy (Platform Admin only) — admin-tab.tsx:292
- Location: Hardcoded: GROUPS/SECTION_LABEL tab policy in index.tsx:49-73; all data/*.ts seeds
- Issue: Six nested Admin sub-tabs bury config two levels deep; conventions want stacked role-gated sections
- Issue: Learning/Tax wizards are bespoke settings surfaces disconnected from the 6 Self Service catalog artifacts (e.g. kx-168 Expense Head) — duplication
- Issue: Access-policy matrix is flat on/off toggles, no layered global→entity scope badges per conventions
- Issue: Non-user roster hardcoded in component; conversion does not persist
- Issue: Module registry submodules (overview/timeline/admin) omit actual Time/Requests/Pay & Work tabs

**Top fixes:**
1. Add attendance team functions (Mass Approval, pending change requests) and Timesheet Utilization Summary per Kensium Team Functions docs
2. Add row-click detail sheets with mandatory-comment decision footers for requests, replacing inline approve/reject buttons
3. Wire toast-only stubs to state: non-user conversion, document download, apply-leave deep link into Leave module
4. Connect Learning/Tax admin wizards to their workflow-catalog artifacts (or flatten into EngineArtifactsPanel) to end config duplication
5. Replace local SummaryCards/Pager/selectColumn forks with shared components and add a Reports tab

### recruitment  <sub>(Workforce)</sub>

**Scores:** feature 5/5 · layout 4/5 · config 4/5

**Implemented:** Requisition lifecycle: create, approve, hold, withdraw; final approval spawns vacancy (index.tsx:74); Vacancy postings with channels, recruiter assignment method, posting-source approvers; Talent pool: folders, reviewed/not-reviewed views, search, duplicate detection, mailbox import, bulk resume upload; Hiring pipeline: stage board, stage-view filters with counts, mass interview scheduling, skip round; Interview scorecards per round with versioned criteria (scorecard-dialog.tsx); Reference checks with configurable questionnaire (reference-questions.ts); Offer lifecycle: generate, approve, release, accept, refuse, cancel, expiry flags; Joining and appointment letters plus document-gated offers (offers-tab.tsx:56-77); Candidate portal: search vacancies, apply, share, refer, track, respond to offers; Reports tab with date filters, PDF/XLS export actions, custodian report; On Hold and Cancelled candidate views matching Kensium (hiring-pipeline-tab.tsx:57); Admin tab: 7-group SettingsWorkspace, governance policies, shared engine execution log; Summary cards with live counts; EngineArtifactsPanel embedded in Admin.

**Partial:**
- convertToEmployee only marks app hired and req filled in-module; no employee record created cross-module (use-offers.ts:452, index.tsx:100)
- Mailbox sourcing is a one-click simulated poll, not interval-driven (talent-pool-tab.tsx:159)
- Resume/document uploads are filename text inputs, no file handling (portal-tab.tsx:327)
- Reports 'Add as widget' and exports are toast-only simulations (reports-tab.tsx ReportActions)

**Missing:**
- Talent Pool columns Contact number, Interview status, Communication status, Task absent (Talent Pool.md list view)
- BRD 6.13.6 conversion-to-employee handoff into Employee module not realized beyond in-module status change

**Layout deviations:**
- Raw ui Table instead of DataTable in hiring-pipeline-tab.tsx:208, offers-tab.tsx, talent-pool-tab.tsx:225, vacancies-tab.tsx — loses sorting/column-search/selectColumn idioms
- Custom one-off SegmentedSelector component for nested views (index.tsx:27-54) not in baseline anatomy
- Ad-hoc Checkbox selection column (hiring-pipeline-tab.tsx:234) duplicates shared selectColumn()
- Empty states are inline <p>/<TableCell> text (portal-tab.tsx:205, hiring-pipeline-tab.tsx:308) not the Card py-10 pattern
- Tabs hardcoded with role conditionals rather than TabDef[] filtered via useRole (index.tsx:178-199); styling matches sibling modules though
- Stage-view filters are Button pills (hiring-pipeline-tab.tsx:173) instead of FilterSelect; acceptable but nonstandard

**Config locations & issues:**
- Location: Admin tab > Settings: SettingsWorkspace with 7 groups (configuration-tab.tsx, settings-groups.tsx, config-setup/sourcing/assessment/hiring/approvals/compensation/onboarding.tsx)
- Location: Admin tab > Engine Features: EngineArtifactsPanel module='Recruitment' (index.tsx:299)
- Location: Admin tab > Company & Platform Policies: scope switches + shared engine log (governance-tab.tsx)
- Location: Workflow catalog: ~15 Kensium artifacts targetModule 'Recruitment' (workflows/data/kensium-artifacts.ts:1724+) and configuration.ts:128 Recruitment group
- Location: Hardcoded seeds: data/config.ts (1014 lines), data/reference-questions.ts fallback consumed at hiring-pipeline-tab.tsx:95
- Issue: Kensium catalog artifacts (posting channels, checklist questions, letter templates, expense heads, paygrade) duplicate the same concepts implemented natively in SettingsWorkspace groups
- Issue: Admin tab is dense: engine panel + 7 settings groups + governance stacked; finding one setting takes scanning
- Issue: reference-questions fallback seed bypasses config when prop omitted, a silent second source of truth

**Top fixes:**
1. Wire convertToEmployee to create an actual employee/onboarding record cross-module — the strongest missing demo beat (use-offers.ts:452)
2. Migrate pipeline/offers/talent-pool/vacancies raw Tables to shared DataTable for sorting, column search and standard selection
3. Add Talent Pool columns from Kensium doc (contact, interview status, communication status) for doc parity
4. Cross-link or dedupe Kensium catalog artifacts against native settings groups so config has one authoritative surface
5. Standardize empty states to the shared Card py-10 pattern and drop the one-off SegmentedSelector

### leave (/leave — Leave Management)  <sub>(Workforce)</sub>

**Scores:** feature 4/5 · layout 4/5 · config 4/5

**Implemented:** Apply Time Off: type, dates/times, tentative+reason, notify peers/emails, attachments, LOP warning (ATO-01..07); Holiday List with location/year filters, optional confirm and swap (HOL-01..05); My Time Off Summary grid with credits/taken/tentative/LOP columns (TOS-01/02); Requests desk: period/status/department/active-employee filters, default Pending (ETOR-01/02/05); Assign Time Off, record-on-behalf for non-users, admin overrides (ETOR-03, LVE-07/17/29); Employee Time Off Summary with taken drill-down dialog (ETOS-01..05); Team tab: approvals, conflict calendar, adjustments, optional-holiday reviews (PTOA, EOHR); Office closures with locations/departments in config + calendars (OC-01..04); Sequential/parallel workflow steps, delegation, manual SLA escalation (use-leave-requests.ts); Comp-off credits, document submissions with due chips, clarification loop; Append-only Activity log, module-disabled employee state (LVE-47); SettingsWorkspace admin hub: types, policies, approvers, calendars, shifts, general, global.

**Partial:**
- Report/summary Export is toast-only, no real CSV generated (reports-tab.tsx:143)
- Refresh buttons only fire toasts, no store re-fetch semantics (my-leave-tab.tsx:152, holidays HOL-04)
- Encashment: payout rules configurable (config-global.tsx:247) but no employee encashment request flow despite registry event
- 'Leave year rollover completed' event declared in module-registry.ts:463 but no rollover UI/action exists
- Requests status filter lacks 'Pending with me', 'Taken', 'Tentative' options (requests-tab.tsx:155-169, ETOR-02)

**Missing:**
- Reset-filters action absent on all manager grids (EOHR-05, ETOR-06, ETOS-06, PTOA-05)
- Employee-class filter missing on Requests desk; present only on adjustments/optional panels (ETOR-01)
- From/To date-range period filter — Requests uses single month select (EOHR-01)
- Mass-approval selection on Requests grid (conventions: Mass-Approval read-model grids)

**Layout deviations:**
- Hand-rolled <table> instead of DataTable in 5+ panels: my-leave-tab.tsx:159, reports-tab.tsx:154, employee-summary-tab.tsx:175, holidays-tab.tsx:79, optional-requests-panel.tsx:168
- request-columns.tsx:16 re-implements local sortableHeader instead of SortableHeader from workflows/table-helpers.tsx
- Nested ghost-variant Tabs inside Team tab (team-tab.tsx:49) — baseline has one role-gated strip per page
- Admin sections lack <Separator /> dividers; EngineArtifactsPanel sits outside the gap-6 stack (index.tsx:250-280)
- Ad-hoc colored document chips bypass Badge variant vocabulary (my-leave-tab.tsx:110-127)
- No selectColumn/selection on any DataTable despite baseline selection idiom (requests-tab.tsx:223)

**Config locations & issues:**
- Location: Admin tab → Settings → SettingsWorkspace, 7 groups (types/policies, approvals, calendars, shifts, general, global, engine) — config-tab.tsx + settings-groups.tsx
- Location: EngineArtifactsPanel at Admin tab top (index.tsx:250) AND again inside 'Engine features' group (settings-groups.tsx:45)
- Location: Workflows catalog: Leave artifacts across src/features/workflows/data/*.ts (definitions, configuration, routing, business-logic, kensium-artifacts)
- Location: Platform Admin-only sections: Platform (platform-tab.tsx) and Shared services (engines-tab.tsx) inside the same Admin tab
- Location: Hardcoded constants: data/shared.ts (EMPLOYEES/DEPARTMENTS/LOCATIONS), data/holidays.ts MAX_OPTIONAL_HOLIDAYS, hardcoded year options 2025-2027 in tabs
- Location: Registry entry: module-registry.ts:436-476 (9 submodules, 10 events, leave.apply form)
- Issue: EngineArtifactsPanel rendered twice in one Admin tab — top-level and inside Engine features group; confusing duplication
- Issue: Platform config split: 'Global & platform' SettingsWorkspace group vs separate Platform and Shared services admin sections
- Issue: Shifts configured inside Leave settings though Time & Attendance owns shifts — cross-module scatter
- Issue: Optional-holiday cap and year filter options hardcoded in data files, not surfaced in any settings group

**Top fixes:**
1. Make Export produce a real downloadable CSV on Reports and Employee Summary instead of a success toast
2. Add mass-approval: selectColumn + bulk Approve/Reject on the Requests grid per workflow-engine conventions
3. Complete manager filter parity: 'Pending with me' status, employee-class filter, From/To period, Reset buttons (ETOR/EOHR/PTOA/ETOS)
4. Add encashment request and year-rollover actions to match the registry's declared events
5. De-duplicate EngineArtifactsPanel in Admin tab and migrate hand-rolled tables to DataTable

### attendance (/attendance — Time & Attendance)  <sub>(Workforce)</sub>

**Scores:** feature 4/5 · layout 3/5 · config 4/5

**Implemented:** Multi-source capture: manual entry, biometric/API ingestion sims, CSV import (stateful); Unmatched-punch resolution, duplicate reconciliation, admin overrides with per-record audit trail; Correction requests with payroll-cutoff L2 routing, SLA escalation, apply-on-approve; Overtime submit/approve with supervisor-cap routing; comp-off, out-time, WFH with policy blocks; Shifts: patterns, roster assignment, swap requests and approvals (interactive); Mass approval, manual attendance sheet, pending change requests (team functions); My Attendance details, shift assignments, holiday opt-in (interactive checkboxes); My Timesheet details with refresh; Timesheet Utilization Summary; Versioned effective-dated config: statutory hours, workflows, templates, audit, RulePillBuilder; Group oversight compliance view; Platform tenant enablement + bitemporal point-in-time demo; Non-user employee records view managed by HR.

**Partial:**
- File import simulated with hardcoded rows; bypasses sanctioned UploadModal staging/dry-run framework (use-attendance.ts:192-235)
- Exports (attendance register, group report) are toast-only, no file/report surface (review-tab.tsx:103, oversight-tab.tsx:50)
- Timesheet approval only simulated via Refresh flipping statuses (my-timesheet-tab.tsx:38-46); registry declares 'Timesheet approved' event
- Hooks omit canonical { append, notify, actorRole } audit wiring; no module Activity log (use-attendance.ts:25, use-requests.ts:46)

**Missing:**
- My Timesheet Entry screen — weekly entry grid, Copy/Import, Submit for Approval (More/Time Management/My Timesheet Entry.md)
- Timesheet Settings / Short Time / Type Of Work editors exist only as catalog rows (Configuration/HRMS/Time Management/*.md)

**Layout deviations:**
- Raw <table> markup in ~20 components instead of shared DataTable (my-attendance-tab.tsx:135, shifts-tab.tsx:100, my-timesheet-tab.tsx:90); only review-tab.tsx:177 conforms
- Custom ad-hoc segmented Review/Capture pill control instead of standard Tabs (index.tsx:146-156)
- Nested Tabs-within-Tabs in Approvals and Tracking (approvals-tab.tsx:49, tracking-tab.tsx:22) vs stacked-sections convention
- Section headers use h3 'text-sm font-medium' not canonical h2 'text-paragraph-md' (my-attendance-tab.tsx:103, oversight-tab.tsx:44)
- No row-click detail sheet on most tables; review table uses selection + button instead of onRowClick (review-tab.tsx:177-183)
- Card lists/tables lack usePager/PagerControls pagination everywhere
- Inline empty states as table rows (my-attendance-tab.tsx:167-173) instead of canonical empty-state Card

**Config locations & issues:**
- Location: Admin tab SettingsWorkspace with 6 groups (config-tab.tsx, settings-groups.tsx): policies/limits, holidays, workflows, templates, audit, engine features
- Location: EngineArtifactsPanel twice in Admin: index.tsx:191 and settings-groups.tsx:447 (Engine features group)
- Location: Workflows page parallel store: workflows/components/attendance-rules-section.tsx + workflows/hooks/use-attendance-config.ts + workflows/data/attendance-config.ts
- Location: Workflow catalog data targeting 'Time & Attendance': workflows/data/business-logic.ts, kensium-artifacts.ts, configuration.ts
- Location: Capture view (Attendance tab > Capture): tracking device + tracking mode setup (capture-tab.tsx:51-68)
- Location: Platform Admin surface inside Admin tab: tenant enablement + integrations (platform-tab.tsx)
- Location: Hardcoded fallbacks in index.tsx:96-104 (supervisor cap 4h, WFH 4/month, cutoff day 25)
- Issue: Attendance rules and auditor groups configurable in two unsynced stores: Workflows page section vs module Admin audit group
- Issue: EngineArtifactsPanel rendered twice inside the same Admin tab — confusing duplication
- Issue: Tracking device/mode setup hidden under Attendance > Capture, not discoverable from Admin settings
- Issue: Module-level mutable attendanceSessionRules cache in settings-groups.tsx persists rules outside React state

**Top fixes:**
1. Build My Timesheet Entry screen (weekly grid, type-of-work, Submit for Approval) — the one wholly missing Kensium screen
2. Migrate raw <table> lists to shared DataTable for sorting, column search and uniform empty states
3. Unify duplicated attendance rules/auditor config: point Workflows-page section and module Admin at one store
4. Route CSV import through UploadModal staging/validate/dry-run flow and give exports a real downloadable artifact
5. Drop the duplicate EngineArtifactsPanel at Admin tab top; keep only the Engine features settings group

### assets (/assets — Asset Management)  <sub>(Workforce)</sub>

**Scores:** feature 4/5 · layout 3/5 · config 4/5

**Implemented:** My Asset List with Kensium statuses, period filter, overdue dates, notifications (my-assets-tab.tsx); Employee self-service receipt/return acknowledgements via versioned condition questionnaire (ack-dialog, use-assets.ts); Requisitions: raise/withdraw/approve/reject/assign, Pending-with-me, on-behalf, partial issuance (requisitions-tab.tsx); Inventory register/edit with tenant-unique tag validation and full filter set (inventory-tab.tsx); Lifecycle transactions gated by decision table with denial reasons (use-assets.ts:181-233); Append-only per-asset history with rule ids (asset-history-overlay.tsx); New Asset Arrival approval admitting units to inventory (movements-tab, admitArrival); Outbound asset list with security pass + approval (movement-form-dialogs.tsx); Onboarding issuance / exit recovery workflow tasks auto-completed by transactions (workflows-tab.tsx); Five interactive reports incl. employee asset valuation summary (reports-tab.tsx); Setup wizard (enable module, ack policy, routing) with Save & Next (config-tab.tsx); Category taxonomy CRUD with code, maintain-ids, life-months, pagination (config-categories.tsx); Oversight roles get read-only multi-company scoped views (org.ts visibleCompanies); Module-disabled and Non-User blocked states (index.tsx:64-119).

**Partial:**
- Report export is a toast simulation, no file produced (reports-tab.tsx DownloadSimple button)
- Requisition form declared extensible (module-registry.ts:542-546 fieldTarget UDF) but requisition-form-overlay.tsx renders no engine/UDF fields
- Notifications are locally derived cards; asset email/notification templates (kensium-artifacts.ts:4020,4263) not consumed by the module
- Audit: per-asset history only; hooks lack { append, actor, actorRole } wiring and no module Activity/audit log (use-assets.ts:70)

**Missing:**
- Damaged/lost reporting — events declared (module-registry.ts:535-536) but no UI or transaction
- Warranty-expiring and inventory-below-threshold scheduler alerts (module-registry.ts:537-538; conventions engine 6)
- Bulk import of assets via sanctioned UploadModal framework (conventions item 7); no import flow anywhere
- Standard asset reports listed in BRD I 6.20.6 lack acknowledgement-ageing/reminder scheduling despite reminderEveryDays setting

**Layout deviations:**
- index.tsx:78 TabsList 'mb-3 bg-transparent p-0' with variant='primary' triggers, not baseline 'mb-2 flex-wrap' TabDef pattern
- my-assets-tab.tsx:279, movements-tab.tsx, workflows-tab.tsx, config-*.tsx use raw ui Table instead of shared DataTable
- summary-cards.tsx:28 local fork uses text-2xl values vs canonical text-3xl SummaryCards
- 35 uses of nonexistent 'border-grey-200' class (e.g. inventory-tab.tsx:141) vs baseline border-gray-200 rounded-[8px]
- Filter panels are labeled-input cards (requisitions-tab.tsx:162) instead of baseline compact toolbar with FilterSelect/SectionToolbar
- index.tsx:138-148 custom segmented pill control for All assets/Reports instead of tabs; Reports buried under Inventory
- No row-click detail sheet; actions via checkbox selection + disabled toolbar buttons (inventory-tab.tsx:120-125)
- Empty states use custom px-6 py-12 flex blocks (my-assets-tab.tsx:256) vs baseline CardContent py-10
- Role gating via raw role === string comparisons, no hasRole/RoleGate (index.tsx:33-38)
- config-tab.tsx:80 nests a second Tabs level inside the Admin tab plus a step wizard — three UI levels deep

**Config locations & issues:**
- Location: Admin tab in-module: ConfigTab with Setup & Policy wizard, Categories, Condition Form, Governance (src/features/assets/components/config-tab.tsx)
- Location: EngineArtifactsPanel module='Asset Management' at top of Admin tab (config-tab.tsx:78)
- Location: Workflow catalog artifacts: business-logic.ts:625 and :772 (Asset Categories, twice), kensium-artifacts.ts:69 (module enable), :2682, :4020/:4263 (asset templates)
- Location: Hardcoded: TRANSITION_RULES decision table (data/config.ts), routing/approver seeds and org constants (data/org.ts)
- Location: module-nav.ts:22 deep-links 'Asset Management' catalog rows to the config tab
- Issue: Asset Categories exist in three places: module Admin editor plus two catalog artifacts (business-logic.ts:625, 772), none synchronized
- Issue: Module-enable setting duplicated: setup wizard step 1 and catalog artifact kensium-artifacts.ts:69
- Issue: Approval routing edited in the module wizard, not as versioned engine approver-chain artifacts per conventions
- Issue: Lifecycle decision table is view-only hardcoded constants — a dead-end config surface (config-tab.tsx:360-394)
- Issue: Config tab hides behind Admin > sub-tabs > wizard steps; policy fields need three clicks to reach

**Top fixes:**
1. Add damaged/lost reporting transactions and warranty/threshold alert surfaces — registry declares these events but nothing renders them
2. Render the extensible requisition UDF fields from the engine form (assets.requisition) so the forms-engine story demos
3. Swap raw ui Tables (My Assets, Movements, config lists) to shared DataTable for sorting/search/empty-state parity
4. Fix the 35 'border-grey-200' typo classes and align cards/toolbars/tabs to baseline styling
5. Deduplicate config: make Categories and module-enable single-sourced through the workflow catalog, and promote Reports to a top-level tab

### companies  <sub>(Organization)</sub>

**Scores:** feature 5/5 · layout 4/5 · config 3/5

**Implemented:** Role-scoped tenant directory with search, status/jurisdiction filters, selection, detail sheet; Multi-step company creation wizard with draft save and rules-engine entitlement check; Lifecycle transitions (activate/suspend/inactivate/archive) with reason dialog and audit; 7-year retention view: archival fees, retention rules table, full-export with checksum; Group-company structures: effective-dated parent/subsidiary memberships, add/end membership; Shared-services portfolios: assign/revoke companies to providers, isolation messaging; Versioned subscription packages with history, new-version publishing, entitlement usage bars; Interactive rules simulator evaluating create-company/add-employee/access-module decisions; Company detail sheet: profile edit, jurisdictions CRUD, config with inheritance, history; Append-only audit trail with type filter and cross-tenant access simulation; Kensium org config: HR budget setup, login images, thought-of-the-day, vendors CRUD; EngineArtifactsPanel embedded in Admin tab (index.tsx:87).

**Partial:**
- Export is toast + checksum only, no downloadable file — use-companies.ts:390 exportCompany just logs audit
- Login image upload takes typed metadata, no real file Browse per Kensium doc — login-images-tab.tsx:56-72
- Localization settings duplicated: detail configuration-tab.tsx:65-97 and catalog artifact bl-18 (business-logic.ts:687), not linked
- Suspension behavior is a static explanatory card, not enforced UI — lifecycle-tab.tsx:56-66

**Missing:**
- No approval workflow instance for company creation/lifecycle; conventions make workflow engine record for approvals
- No 'Subscription renewal due' scheduler alert despite registry event (module-registry.ts:124; conventions engine 6)
- No Reports tab; conventions require per-module reporting deliverable
- No bulk company import via sanctioned UploadModal Import framework (conventions bullet 7)

**Layout deviations:**
- index.tsx:88-105 admin sub-nav is custom pill buttons, not canonical stacked h3 sections with Separator
- index.tsx:58 TabsList uses ad-hoc 'bg-transparent p-0 h-auto' classes instead of 'mb-2 flex-wrap'
- index.tsx:57-71 tabs not role-filtered TabDef[]; Admin/Groups tabs render for Employee roles
- companies-summary.tsx:32 grid lg:grid-cols-5 vs canonical lg:grid-cols-4
- Cards use rounded-[6px] not rounded-[8px] (groups-tab.tsx:93, lifecycle-tab.tsx:56, audit-tab.tsx:55)
- directory-tab.tsx:233-243 role-blocked state is custom div, not Card + CardContent py-10 pattern
- directory-tab.tsx:252-286 toolbar controls h-8 vs canonical h-7 heights
- Hand-rolled grid tables for retention rules and error codes (lifecycle-tab.tsx:149, audit-tab.tsx:141) instead of SimpleTable
- Groups/subscriptions/audit card lists lack usePager + PagerControls pagination
- use-companies.ts:41 hook takes bare actor string, not canonical { append, notify, actor, actorRole } contract

**Config locations & issues:**
- Location: Admin tab with EngineArtifactsPanel module='Companies' — /poc/src/features/companies/index.tsx:87
- Location: Admin sub-tabs (budget setup, login images, thoughts, vendors) backed by /poc/src/features/companies/data/org-config.ts
- Location: Per-company Configuration tab in detail sheet — /poc/src/features/companies/components/detail/configuration-tab.tsx
- Location: Workflow catalog: single artifact bl-18 'Localization Settings' targeting Companies — /poc/src/features/workflows/data/business-logic.ts:687
- Location: Subscription package definitions edited in Subscriptions tab — /poc/src/features/companies/components/subscriptions-tab.tsx
- Location: Hardcoded: SETTINGS options (configuration-tab.tsx:47), TIER_TO_PACKAGE (directory-tab.tsx:45), RETENTION_RULES/ERROR_CODES (data/records.ts)
- Issue: Only 1 of 29 catalog artifacts targets Companies — EngineArtifactsPanel Admin slice is nearly empty
- Issue: Localization config exists twice (detail sheet + bl-18 artifact) with no linkage or version badge
- Issue: Org-config settings (budget, images, thoughts, vendors) live outside the engine catalog, contradicting catalog-is-config convention
- Issue: Subscription packaging (versioned config) sits in a non-Admin tab; demo users may not find it as configuration
- Issue: Setting option lists and tier-to-package mapping hardcoded in components

**Top fixes:**
1. Author Companies-targeted catalog artifacts (creation approval flow, renewal alert, retention setting) so the Admin engine slice isn't one item
2. Route lifecycle transitions through a workflow instance with decision footer instead of direct commit with reason dialog
3. Replace ad-hoc admin pill nav with canonical stacked role-gated sections (h3 + Separator) and role-filter the top tab strip
4. Link detail-sheet Localization/Workflow-default settings to their catalog artifact with vN badge to kill duplication
5. Make export produce a real downloadable JSON file instead of toast-only checksum

### group-companies  <sub>(Organization)</sub>

**Scores:** feature 4/5 · layout 3/5 · config 3/5

**Implemented:** Construct CRUD with GROUP_001/002 validation, auto GroupCode, zod form (new-group-overlay.tsx); Effective-dated memberships with as-of query and preserved history (members-panel.tsx); Shared-scenario toggles as versioned, effective-dated config with version-history table (sharing-tab.tsx); Cross-company admin actions gated by authorization and audited (sharing-tab.tsx); Shared locations: share/withdraw, reference request/approve/deny/remove, owner permission matrix (locations-tab.tsx); Policy templates: share, adopt independent instance, version drift badges (policies-tab.tsx); Rules-engine-gated consolidated report and cross-company directory search with RLS (reporting-tab.tsx); Hash-chained audit trail with category filter and chain verification (audit-tab.tsx, use-audit.ts); Group-level role grants (Group Reporting Viewer) via group-roles-card.tsx; Circular-reference detection for Holding parents (use-group-companies.ts:104); Portfolio-governance and Company-Admin consent views, all interactive with state.

**Partial:**
- US-GRV-09 group dashboard: summary cards + report table exist, but no per-company drill-down KPIs (group-summary.tsx, reporting-tab.tsx)
- US-GCA-26 notifications: only ephemeral sonner toasts; no notification/alert artifacts (locations-tab.tsx, sharing-tab.tsx)
- US-GRV-03 leave/attendance consolidation: static headcount/onLeaveToday/attendancePct seed fields only (data/group-companies.ts)

**Missing:**
- Consolidated report export to Excel/PDF (US-GRV-07, group-reporting-viewer.md)
- Member-company multi-select filter on consolidated report (US-GRV-05)
- Directory filters by department/position/location/status and result export (US-GRV-14/18)
- Read-only directory profile sheet on result click (US-GRV-16)
- Cross-company org chart spanning member companies (US-GRV-04, BRD §6.21.2)
- Company context switching within the group without re-login (US-GCA-23)
- Excluded-company disclosure on partial consolidated reports (US-GRV-11)

**Layout deviations:**
- index.tsx:51 — nonstandard TabsList ('bg-transparent p-0 h-auto rounded-none', TabsTrigger variant='primary') vs canonical 'mb-2 flex-wrap'
- index.tsx:50-61 — tabs not a role-filtered TabDef[]; employees still see Admin tab, only defaultTab differs
- index.tsx:69-87 — Admin tab lacks EngineArtifactsPanel; every other module embeds it as config surface
- constructs-tab.tsx:103-116 — selection-checkbox drives inline MembersPanel card; no row-click FloatingSheetContent detail sheet
- members-panel.tsx:100, sharing-tab.tsx:227, audit-tab.tsx:104 — plain ui Table instead of DataTable/SimpleTable idiom
- reporting-tab.tsx:169, locations-tab.tsx:105 — badge variants 'qualified'/'disqualified' outside canonical vocabulary; no per-feature StatusBadge wrapper for them
- audit-tab.tsx — unbounded audit table; no usePager/PagerControls pagination
- constructs-tab.tsx:76 — toolbar missing flex-wrap and canonical SectionToolbar/table-helpers reuse; no takeRequestedTab deep-linking

**Config locations & issues:**
- Location: Module Admin tab: Sharing & Roles toggles + version history, Shared Locations, Policy Templates, Activity Log (src/features/group-companies/index.tsx:69-87)
- Location: Registry entry: src/config/module-registry.ts:131-145 — submodules only; targetModule undefined, entities/events/forms all empty
- Location: Hardcoded seeds/constants: data/group-companies.ts (PERSONAS, GROUP_TYPES, ADMIN_CANDIDATES), data/sharing.ts (ADMIN_ACTIONS, seedDirectory, seed locations/policies)
- Location: Workflow catalog: NO artifacts target this module (grep of src/features/workflows/data/ finds only 'Group Company Admin' role scoping, no Group Companies artifacts)
- Issue: No EngineArtifactsPanel and no workflow-catalog slice — module owns bespoke settings, breaking the module-admin-is-a-catalog-slice pattern
- Issue: Rules-engine prerequisites are hardcoded in reporting-tab.tsx:66-81, not versioned CEL rule artifacts in the catalog
- Issue: Registry declares no entities/events/forms; targetModule undefined makes the module invisible to catalog filtering
- Issue: Naming overlap with /org-groups ('Groups') risks demo users looking for group config in the wrong module

**Top fixes:**
1. Add report/directory export (Excel/PDF/CSV) and member-company multi-select filter — most-cited GRV stories missing (US-GRV-05/07/18)
2. Embed EngineArtifactsPanel in Admin tab, set targetModule, and seed catalog artifacts (rules, notifications) so config matches every other module
3. Add directory result filters and a read-only profile FloatingSheetContent with company identifier (US-GRV-14/16)
4. Surface a cross-company org chart or drill-down group dashboard for the consolidated view (US-GRV-04/09)
5. Standardize tabs to role-gated TabDef[] with canonical TabsList, paginate the audit table, and map badges to the fixed variant vocabulary

### portfolios  <sub>(Organization)</sub>

**Scores:** feature 4/5 · layout 3/5 · config 2/5

**Implemented:** Portfolio create/edit with PORT_001 unique-name and PORT_002 one-portfolio-per-company enforcement, PORT-YYYY-NNN codes (use-portfolios.ts); Manage companies add/remove with min-one-company rule and AlertDialog confirm; Header company-context switcher; AUTH_002 (403) denial for unauthorized targets, audited; New mock JWT per switch plus loaded company config, permissions, API response view; Per-company unsaved drafts preserved across context switches (PORT-15); Consolidated report with company multi-select, row-level security, withheld-count badge, totals row; Excel/PDF export and cross-company employee search, both audit-logged; Bulk import, policy deployment with per-company outcomes, portfolio-wide announcements (all stateful); Filterable 7-year audit trail including failed AUTH_002 switch attempts; Summary cards row and role-gated tab strip with Admin consolidation.

**Partial:**
- Bookmarkable company URLs (PORT-FR-006/PORT-17) simulated by an in-tab button; route ignores ?company= param (context-tab.tsx:43, routes/_authenticated/portfolios/index.tsx)
- Bulk import (PORT-21) is a filename text input + fake outcome, bypassing the sanctioned UploadModal staging/validate/dry-run flow (operations-tab.tsx:157-170)
- Report export (PORT-20) only writes a toast/audit entry — no file produced (use-portfolio-ops.ts exportReport)
- API reference dialog is static documentation, not interactive (api-reference-dialog.tsx)

**Missing:**
- Drill-down from consolidated report into a single company's read-only detail (US-PAUD-12, portfolio-read-only-auditor.md)
- Consolidated portfolio dashboard view for oversight personas (US-PAUD-01, portfolio-read-only-auditor.md); reporting tab hidden from non-admin roles
- Add/remove-company confirmation on Manage Companies covers remove only; add lacks confirmation (US-PA-18, platform-super-administrator.md)

**Layout deviations:**
- index.tsx:73 TabsList 'mb-3 bg-transparent p-0' with variant='primary' triggers instead of canonical TabDef[] + 'mb-2 flex-wrap' pattern
- index.tsx:55 no takeRequestedTab('/portfolios') — module unreachable via cross-module tab deep-linking
- reporting-tab.tsx:233 and audit-tab.tsx:103 use raw ui Table with ad-hoc empty rows instead of shared DataTable
- portfolios-table-columns.tsx:32 hand-rolls a Checkbox select column and inline ArrowUpDown headers, duplicating shared selectColumn()/SortableHeader
- portfolios-tab.tsx:113-151 view/edit via selection-gated toolbar icons; no onRowClick detail sheet per canonical row-click idiom
- reporting-tab.tsx:86 and operations-tab.tsx:84 role-blocked states are slim 'py-3' cards, not canonical 'py-10 text-center' blocked-state card
- context-tab.tsx:48 cards use 'gap-2 border-gray-200 py-3' + CardHeader px-4 instead of canonical 'rounded-[8px] border bg-white p-4' content card

**Config locations & issues:**
- Location: Module Admin tab (Bulk changes + Activity log sections) — src/features/portfolios/index.tsx:107-118; operational, not settings
- Location: Hardcoded constants: COMPANIES, PERSONAS, ROLE_PERMISSIONS, STANDARD_POLICIES in src/features/portfolios/data/portfolios.ts; seed audit in data/audit.ts
- Location: Registry entry src/config/module-registry.ts:146-162 — targetModule: undefined, empty entities/events/forms
- Location: Workflow catalog: zero artifacts target Portfolios ('Portfolios' absent from TARGET_MODULES in src/features/workflows/data/business-logic.ts)
- Issue: No EngineArtifactsPanel anywhere in the module — breaks the module-admin-is-a-catalog-slice pattern every module must follow
- Issue: Portfolios is not a TargetModule, so no engine artifact can ever attach to it; registry declares no entities/events/forms
- Issue: Standard policy list, personas, and company authorization maps are hardcoded in data/portfolios.ts with no editing surface
- Issue: Admin tab contains only bulk ops + audit log; a demo user finds no actual portfolio settings there

**Top fixes:**
1. Wire ?company= search param on the /portfolios route so bookmarked URLs really switch context (PORT-FR-006) instead of the simulated button
2. Add 'Portfolios' to TARGET_MODULES, seed a few artifacts, and embed EngineArtifactsPanel in the Admin tab as the config surface
3. Route bulk employee import through the shared UploadModal staging/validate/dry-run flow instead of a filename text input
4. Replace raw ui Tables in Reporting and Audit with shared DataTable for sorting, column search, and standard empty states
5. Open a read-only portfolio detail sheet on row click and adopt shared selectColumn()/SortableHeader in portfolios-table-columns.tsx

### jurisdictions  <sub>(Organization)</sub>

**Scores:** feature 4/5 · layout 3/5 · config 3/5

**Implemented:** Governed catalog CRUD with duplicate guard, type filter, searchable sortable DataTable; Effective-dated version history per catalog entry (history dialog); Reference-guarded delete: referenced entries deactivate instead, references preserved; Tax/fee applicability rows on catalog entries (create/edit sheet); Company-to-jurisdiction assignments with minimum-one enforcement, primary flag; Portfolio coverage read-only oversight view per role; Policy jurisdiction applicability criteria editing via picker dialog; Per-employee 'What applies to me' resolution, incl. non-login employees; Versioned rule-packs with publish/supersede/revert and mandatory change note; Rules engine simulator: company/employee/as-of-date applicability evaluation; Role-scoped visibility (Company/Group/Portfolio/Platform Admin) throughout.

**Partial:**
- US-HR-03 says removal with assigned employees must be BLOCKED; use-assignments.ts:62-85 allows it with a warning toast
- Audit trail: only catalog entries get history; assignment/policy changes emit toasts only, hooks lack { append, actor } wiring (use-assignments.ts)
- US-PA-20 acceptance 'selectable during company creation' has no tie-in; companies are static seeds (data/assignments.ts)

**Missing:**
- Company audit-trail entry with user id/timestamp on jurisdiction association change (US-HR-03 AC, BRD §6.29)
- Jurisdiction-specific reporting formats/templates surface (Phase II BRD §5.4) — no Reports section
- Locale/format configuration at jurisdiction level (Phase I BRD 6.30.2) not represented

**Layout deviations:**
- Assignments, Policies, Rule-packs tabs use raw ui Table, not DataTable/SimpleTable: assignments-tab.tsx:89, policies-tab.tsx:52, rule-packs-tab.tsx:90
- Cards use rounded-md instead of canonical rounded-[8px]: assignments-tab.tsx:88,166; applicability-tab.tsx:76; rules-simulator.tsx:58
- catalog-tab.tsx:209 uses raw AlertDialog instead of shared ConfirmDialog for destructive confirm
- jurisdictions-table-columns.tsx:32-55 hand-rolls select column duplicating shared selectColumn() from table-helpers
- index.tsx:35,54 hand-rolled isAdmin tab gating, no TabDef[]/useRole filter, no takeRequestedTab deep-linking, no key={role}
- Catalog rows have no onRowClick detail sheet; edit/history only via selection-gated icon buttons (catalog-tab.tsx:130-161)
- Toolbar catalog-tab.tsx:110 omits flex-wrap and hand-rolls SectionToolbar title-with-count idiom
- No EngineArtifactsPanel anywhere in the module (index.tsx admin tab)

**Config locations & issues:**
- Location: Admin tab inside module: Policies criteria + Rule-packs sections (src/features/jurisdictions/index.tsx:94-113)
- Location: Catalog itself (Regions tab) is Platform Admin config: src/features/jurisdictions/components/catalog-tab.tsx
- Location: Hardcoded constants: JURISDICTION_TYPES, TAX_FEE_SCOPES, seeds in src/features/jurisdictions/data/jurisdictions.ts, assignments.ts, rule-packs.ts
- Location: Workflow catalog: NO Jurisdictions slice — targetModule undefined in src/config/module-registry.ts:169; no EngineArtifactsPanel embedded
- Location: Parallel hardcoded JURISDICTIONS string list in src/features/workflows/data/shared.ts:18 used by routing conditions
- Issue: Module owns bespoke Admin config instead of embedding EngineArtifactsPanel; violates catalog-slice convention, rule-packs invisible from Workflows Configure
- Issue: Workflows routing keys on hardcoded jurisdiction name strings (shared.ts:18), duplicating and diverging from the governed catalog ids
- Issue: Rule-pack publish rights live only behind Platform Admin RoleGates in-table; no discoverable settings entry point
- Issue: Jurisdiction types and tax scopes hardcoded, not editable lookup/ref_code values

**Top fixes:**
1. Embed EngineArtifactsPanel in the Admin tab and set targetModule in module-registry.ts:169 so Workflows Configure covers Jurisdictions
2. Block (not warn) removing a company jurisdiction that has assigned employees, per US-HR-03 (use-assignments.ts:62-85)
3. Wire assignment and policy-criteria mutations into an audit/Activity log; extend history beyond catalog entries
4. Unify workflows/data/shared.ts:18 JURISDICTIONS strings with the catalog so routing conditions consume governed entries
5. Swap raw Tables for DataTable and AlertDialog for ConfirmDialog in assignments/policies/rule-packs tabs

### locations  <sub>(Organization)</sub>

**Scores:** feature 4/5 · layout 3/5 · config 4/5

**Implemented:** Locations grid: sortable/searchable columns, filters, selection, pagination, refresh (locations-tab.tsx); Create/edit location sheet with zod validation, jurisdiction, IP/CIDR, pin-code format (location-overlay.tsx); Delete owned locations with confirm; referenced rows blocked (locations-tab.tsx:146-157); Explicit versioned effective-dated group sharing: enable, edit, revoke, history dialog (sharing-tab.tsx); Sharing audit trail with actor/date entries (sharing-tab.tsx:176-206, use-locations.ts:78); Employee read-only My Location view (my-location-tab.tsx); Head Office stepper: profile, payroll, address, branding, compliance documents CRUD (organization-tab.tsx, use-organization.ts); Localization settings form with live preview; date/pin formats applied module-wide (localization-tab.tsx); Platform Admin governance: RLS query simulator, referential-integrity inspector (governance-tab.tsx); Group guardrail: sharing outside group blocked with error (use-locations.ts:147-151).

**Partial:**
- Audit trail only covers sharing; location create/update/delete never call logAudit (use-locations.ts:95-129) despite registry events
- Location grid omits full Address column Kensium lists; only city/state shown (locations-table-columns.tsx:104-123)
- Store does not take { append, actor, actorRole }; audit is a local array, not wired to global audit (use-locations.ts:26)
- Registry events 'Location deactivated/head assigned/capacity threshold/employee location changed' have no UI; only flat active/inactive status field

**Missing:**
- Work Area configuration screen (kensiumhr-features/Configuration/HRMS/Organization/Work Area.md; catalog artifact kensium-artifacts.ts:2538 targets Locations)
- Location head assignment (module-registry.ts:198 declares the event)
- Jurisdiction catalog management UI (BRD Phase I FR 6.4) — jurisdictions hardcoded
- Bulk import of locations via UploadModal framework (conventions item 7)
- Reports tab (conventions item 8: reporting is per-module deliverable)

**Layout deviations:**
- No onRowClick detail sheet on the grid; edit only via selection + pencil icon (locations-tab.tsx:238-244) — breaks canonical row-click anatomy
- Hand-rolled pagination footer instead of usePager/PagerControls (locations-tab.tsx:246-274)
- AlertDialog used for destructive confirms instead of shared ConfirmDialog (locations-tab.tsx:287, sharing-tab.tsx:229)
- Sharing list uses plain ui Table, not DataTable/SimpleTable (sharing-tab.tsx:81)
- Cards use 'gap-2 border-none bg-white py-3' not canonical 'rounded-[8px] border border-gray-200 bg-white p-4' (sharing-tab.tsx:55, governance-tab.tsx:77, my-location-tab.tsx:67)
- LocationsSummary duplicates SummaryCards instead of reusing it (locations-summary.tsx:25-52)
- Select column hand-rolled instead of selectColumn() helper (locations-table-columns.tsx:26-49)
- TabsList overrides canonical 'mb-2 flex-wrap' with custom transparent styling (index.tsx:73)
- My Location no-assignment empty state lacks canonical py-10 centered card style (my-location-tab.tsx:25-33)

**Config locations & issues:**
- Location: Admin tab inside module: Company profile stepper, Regional settings, Data quality sections (src/features/locations/index.tsx:96-119)
- Location: EngineArtifactsPanel module='Locations' at top of Admin tab (index.tsx:98); 3 catalog artifacts target Locations (workflows/data/kensium-artifacts.ts:2230,2258,2538)
- Location: Workflows Configure catalog lists Locations module (workflows/data/configuration.ts:59)
- Location: Sharing configuration lives in its own top-level Sharing tab, Group/Platform Admin only (index.tsx:91-95)
- Location: Hardcoded constants: JURISDICTIONS, TIMEZONES, COMPANIES, EMPLOYEE_PROFILE (data/locations.ts); CURRENCIES, PIN_CODE_FORMATS (data/organization.ts)
- Issue: Group Company Admin gets no Admin tab (index.tsx:40-52), so EngineArtifactsPanel and module config are unreachable for that role
- Issue: Work Area artifact exists in catalog but has no owning surface in the module — dead-end from Configure
- Issue: Jurisdiction and timezone catalogs hardcoded with no admin surface (data/locations.ts:16-32)
- Issue: Catalog 'Location'/'Head Office' setting artifacts duplicate the module's own admin sections without cross-links

**Top fixes:**
1. Add row-click FloatingSheetContent detail sheet showing full address, timezone, shares and history — restores canonical anatomy and Kensium Address column
2. Wire location create/update/delete into the audit trail and add deactivate/head-assignment actions matching registry events (module-registry.ts:195-201)
3. Give Group Company Admin the Admin tab (or move EngineArtifactsPanel outside it) so its config surface is reachable
4. Implement or link the Work Area setting so its catalog artifact is not a dead end
5. Swap ad-hoc pager, AlertDialogs, plain Table and summary fork for PagerControls, ConfirmDialog, DataTable, SummaryCards

### departments  <sub>(Organization)</sub>

**Scores:** feature 4/5 · layout 4/5 · config 3/5

**Implemented:** Department CRUD with parent hierarchy, acronym, description, head (DEPT-01/03/04); Tabular list with all key columns, sortable, status filter (DEPT-02); Pagination and refresh on directory list (DEPT-05); Guided setup stepper mirrors Kensium 'Next' flow (DEPT-06); Collapsible n-level org tree with search and detail panel; Multi-company oversight tree for group/portfolio/platform admins; Membership management: multi-department, at-least-one-department rule enforced; Cycle-guarded reparenting and blocker-checked delete with config-dependency flagging; Per-department shifts, default shift, weekly offs, work areas; Headcount roll-up report, approval-routing preview, policy applicability check; Bitemporal audit history with as-of date and tenant scoping; Employee self-service My Departments view with resolved approval path; Versioned custom fields, approver graphs, scope rules, notification templates; EngineArtifactsPanel embedded in Admin tab.

**Partial:**
- Refresh buttons only toast; no data reload occurs (use-departments.ts:285-287, 355-357)
- Guided setup stepper advances and toasts but persists nothing (use-department-config.ts:326-339)
- Weekly-off overrides in Shifts tab are unsaved local demo state (shifts-tab.tsx:41 offsOverride)
- Notifications simulated as toasts, not routed through engine templates (use-departments.ts:125,149,237)
- Audit log lacks actor/actorRole; hooks skip the { append, actor } contract (use-departments.ts:29-43)

**Missing:**
- Bulk import/export of Department master data via Import framework (BRD I §7.1, line 768/808)
- Department merge/restructure flows, despite registry events 'Department merged'/'restructured' (module-registry.ts:223-225)
- Column search in directory table (SearchableHeader) per canonical DataTable idiom

**Layout deviations:**
- departments-table-columns.tsx:28-69 hand-rolls sortableHeader and select column, duplicating workflows/components/table-helpers.tsx SortableHeader/selectColumn (no column search)
- directory-tab.tsx:223-229 no onRowClick detail sheet; edit only via selection + toolbar icon, breaking row-click-opens-sheet convention
- directory-tab.tsx:232-260 custom caret pagination instead of usePager + PagerControls
- directory-tab.tsx:276-320 AlertDialog for destructive confirm instead of shared ConfirmDialog
- members-tab.tsx:141 and governance-tab.tsx:115,284 use raw ui Table instead of DataTable
- config-tab.tsx:29-46 nested Tabs inside Admin tab instead of stacked Separator-divided sections
- index.tsx:78 TabsList 'bg-transparent p-0 h-auto...' deviates from canonical 'mb-2 flex-wrap'
- departments-summary.tsx:34 lg:grid-cols-5 local fork of SummaryCards (canonical grid is lg:grid-cols-4)

**Config locations & issues:**
- Location: Admin tab > Settings section: ConfigTab with 5 sub-tabs (setup, custom fields, rules, questions/notifications, shift definitions) — src/features/departments/components/config-tab.tsx via index.tsx:111-114
- Location: Admin tab > EngineArtifactsPanel module='Departments' — index.tsx:108; catalog holds only kx-057 'Department' setting (workflows/data/kensium-artifacts.ts:1696) and module toggle (workflows/data/configuration.ts:69)
- Location: Shifts & Sites tab: per-department shift assignment, weekly offs, roster visibility — components/shifts-tab.tsx (operational config outside Admin)
- Location: Hardcoded constants: LOCATIONS/WORK_AREAS/SHIFTS/WEEK_DAYS in data/org-config.ts; COMPANIES/CURRENT_COMPANY_ID in data/departments.ts; seeds in data/governance.ts
- Issue: Shift config split: definitions in Admin > Shift definitions, assignment/weekly-offs in separate Shifts & Sites tab
- Issue: Bespoke settings (rules, templates, custom fields) duplicate engine-catalog remit; only one catalog artifact targets Departments
- Issue: Interview questions and rating sets (recruitment config) live inside Departments admin — misplaced
- Issue: Locations and work areas are hardcoded constants, not editable anywhere
- Issue: Weekly-off overrides are dead-end local state — edits vanish on tab switch

**Top fixes:**
1. Add row-click department detail sheet (FloatingSheetContent) on Directory — canonical pattern, biggest demo-feel gap
2. Add bulk import/export via UploadModal for Department master data (BRD §7.1 lists Departments)
3. Make refresh, setup stepper, and weekly-off overrides actually mutate/persist state instead of toast-only simulation
4. Unify shift definitions and shift assignment into one surface; register bespoke config panels as catalog artifacts
5. Replace hand-rolled table header/select/pagination with shared SortableHeader, selectColumn, usePager/PagerControls

### positions  <sub>(Organization)</sub>

**Scores:** feature 4/5 · layout 4/5 · config 4/5

**Implemented:** Position catalogue: create/edit/delete, dept filter, column search, paging, refresh (POS-01/02/07/14/23); Delete-integrity guard: occupied positions block delete, offer deactivate instead (POS-08); Task-action menu per row: edit, toggle status, delete, history (POS-22); Employee assignments: position, classification, project role, provision login (POS-03/28/32); Recruitment pipeline: requisition, offer with pay-band validation, hire creates employee (POS-04/18/37); Guided 6-step org-setup Config with Save & Next (POS-34); Config panels: custom fields, pay grades, series, project types/roles, classifications (POS-13/20/24-27/35/36); As-of-date org report replayed from effective-dated history (POS-05/12); Multi-tenant governance: group/portfolio/platform scoping, standardization seeding (POS-09/16/33/45); Bitemporal history sheet and platform RLS panel (POS-15); My Position self-service, non-user representation (POS-10/17/46); Numbering series generate Position IDs and employee codes (POS-21/35); Duplicate name+dept+level flagged; cross-dept name reuse allowed (POS-19/43); Project-role appraisal scoring with evaluation questions (POS-27/41); EngineArtifactsPanel embedded in Admin tab.

**Partial:**
- Refresh is cosmetic — resets page and toasts only, no data reload (catalogue-tab.tsx:170-176) vs Kensium POS-04
- Workflow-engine consumption (POS-18) simulated with local state + footnote; no workflow instance ids referenced (recruitment-tab.tsx:229-233)
- Registry events (Position created/filled/vacated) never emitted; hooks lack { append, actor } audit wiring (use-positions.ts, module-registry.ts:248-256)
- Kensium 444-record paging emulated with ~small mock dataset; pager renders every page button (catalogue-tab.tsx:217-226)

**Missing:**
- Bulk import of Positions via Import framework — BRD Phase I line 808 lists Positions as supported entity; no UploadModal usage
- Export of position/org reports (BRD Phase I §6.10 export expectations); Reports tab has no export action
- 'Position made redundant' and 'Reporting line changed' events declared in module-registry.ts have no UI counterpart

**Layout deviations:**
- index.tsx:117 TabsList uses custom 'bg-transparent p-0 h-auto justify-start gap-2 rounded-none' instead of canonical 'mb-2 flex-wrap'
- catalogue-tab.tsx:201-237 bespoke numbered pager instead of shared usePager/PagerControls
- catalogue-tab.tsx:272-315 raw AlertDialog for destructive delete instead of shared ConfirmDialog
- No onRowClick detail sheet on catalogue/assignment tables; detail only via task-action dropdown (catalogue-tab.tsx:193-198)
- badges.tsx:28-30 uses 'booked'/'overdue' variants for employee type — off the fixed status-vocabulary semantics
- index.tsx:78-94 role gating via ad-hoc booleans, not the TabDef.roles + useRole filter idiom
- hooks/use-positions.ts keeps local history but omits the { append, notify, actor, actorRole } store contract

**Config locations & issues:**
- Location: Admin tab > Settings: guided 6-step ConfigTab (custom fields, paygrade, series, project types/roles, classifications) — src/features/positions/components/config-tab.tsx + components/config/*
- Location: Admin tab > EngineArtifactsPanel module='Positions' — index.tsx:175; 4 'setting' artifacts in src/features/workflows/data/kensium-artifacts.ts (lines 2174, 2314, 2342, 2980)
- Location: Hardcoded constants: COMPANIES, DEPARTMENTS, CURRENT_* in src/features/positions/data/positions.ts; seed config in data/org-config.ts
- Issue: Duplication: Project Types/Roles, PayGrade, Classification exist both as live ConfigTab panels and as separate catalog 'setting' artifacts — no cross-link
- Issue: Catalog artifacts for these settings are dead-ends relative to the editable panels sitting below them in the same tab
- Issue: Custom fields and numbering series exist only in ConfigTab, not represented in the workflow catalog slice
- Issue: Guided stepper hides later steps behind Save & Next; direct jump works but step completion is purely cosmetic

**Top fixes:**
1. Add bulk position import via shared UploadModal (staging→validate→commit) — BRD lists Positions as a supported import entity
2. Emit declared registry events and wire stores with { append, actor } so Admin shows an Activity log
3. Add report export (CSV) to the Reports tab per per-module reporting deliverable
4. Cross-link the four catalog 'setting' artifacts to their live ConfigTab panels to remove the dual config surface
5. Swap bespoke pager/AlertDialog for shared PagerControls/ConfirmDialog and canonical TabsList styling

### org-groups (/org-groups, "Groups")  <sub>(Organization)</sub>

**Scores:** feature 5/5 · layout 4/5 · config 4/5

**Implemented:** Group CRUD with per-scope name/acronym uniqueness validation (GRP-01/02); Paginated, searchable, status-filtered group register with Kensium-style item count (GRP-03/04); N-level hierarchy tree: search, collapse, cycle/scope-safe reparenting; Global vs group-company vs company scoped groups with scope-gated permissions; Policy applicability criteria editor plus live rules-engine resolution preview; Effective-dated memberships: bulk add/remove, as-of date, history retained; Approval-controlled membership requests with approve/reject-with-reason queue; Clone, merge (retire source), activate/deactivate, delete with dependency blocks; Versioned effective-dated config history, audit trail, governance usage matrix; Employee self-service My Groups (user and non-user personas) with notifications; CSV export of group list; bulk transfer between groups; EngineArtifactsPanel embedded in Admin tab; summary cards row.

**Partial:**
- OrgSetupStrip 'Save & Next'/Work Area/Role buttons only fire toasts, no navigation — groups-list-footer.tsx:54-89 (Kensium Group.md Next/Cancel)
- File import simulated from hardcoded IMPORT_FILE_ROWS, bypassing sanctioned UploadModal staging/validate/dry-run framework — use-org-groups.ts:504-537
- runEligibilityEngine only counts existing rule-derived members and toasts; never recomputes dynamic membership — use-org-groups.ts:560-576
- GRP-05..44 story ids cited in code comments have no source in kensiumhr-features or docs/user-stories

**Missing:**
- No Reports surface, though conventions make per-module reporting a deliverable (design/00-CONVENTIONS.md, reporting clause)
- No layered P/G/C enablement toggles (pending = blocked-upstream) for the module itself (00-CONVENTIONS scope layering)

**Layout deviations:**
- TabsList uses custom 'bg-transparent p-0 h-auto justify-start gap-2 rounded-none' instead of canonical 'mb-2 flex-wrap' — index.tsx:72
- Local GroupsPager duplicates shared usePager/PagerControls — groups-list-footer.tsx:15-51
- Local sortableHeader + hand-rolled select column duplicate table-helpers SortableHeader/selectColumn — groups-table-columns.tsx:25-72
- Detail opens via Eye icon button, not DataTable onRowClick — groups-list-tab.tsx:206-212, groups-table-columns.tsx
- Badge variants outside fixed vocabulary: 'booked', 'qualified', 'disqualified' — group-badges.tsx:32,47-53
- Content cards use rounded-[6px] border-grey-200 px-3 py-2 instead of rounded-[8px] border-gray-200 p-4 — approvals-tab.tsx:48, my-groups-tab.tsx:67
- Section headings h3 'text-sm font-medium' instead of h2 'text-paragraph-md' — policies-tab.tsx:80, governance-tab.tsx:53
- lucide-react icons throughout instead of phosphor — groups-list-toolbar.tsx:1-10, hierarchy-tab.tsx:2
- Empty states are inline <p>, not Card py-10 pattern — hierarchy-tab.tsx:217-219
- Governance usage matrix is a hand-rolled CSS-grid table, not DataTable/SimpleTable — governance-tab.tsx:56-98
- Summary grid lg:grid-cols-5 vs baseline lg:grid-cols-4 — groups-summary.tsx:53

**Config locations & issues:**
- Location: Admin tab in-module: EngineArtifactsPanel module='Groups' + Policies + Governance sections — src/features/org-groups/index.tsx:88-104
- Location: Workflow catalog: exactly one artifact targetModule 'Groups' — src/features/workflows/data/kensium-artifacts.ts:2202; module listed in business-logic.ts:69
- Location: Hierarchy tab: per-node inheritance-rule Select (Portfolio/Platform Admin) — components/hierarchy-tab.tsx:155-182
- Location: Group form: per-group requiresApproval, type/eligibilityRule, class/payroll/wage settings — components/group-form-overlay.tsx:54-110
- Location: Hardcoded constants: APPLICABILITY_OPTIONS, CLASS_TYPES, PAYROLL_FREQUENCIES, WAGE_TYPES, INHERITANCE_RULES, IMPORT_FILE_ROWS — data/groups.ts
- Location: Registry entry with submodules/entities/events — src/config/module-registry.ts:259-283
- Issue: Inheritance-rule configuration lives in Hierarchy tab, not the Admin tab — split config surface
- Issue: Only one catalog artifact targets Groups, so EngineArtifactsPanel looks nearly empty as the config surface
- Issue: Applicability/class/payroll/wage option lists hardcoded in data/groups.ts, not surfaced anywhere editable
- Issue: Non-governance admins get PoliciesTab in Admin without a section heading (index.tsx:102) — inconsistent Admin anatomy
- Issue: OrgSetupStrip advertises Work Area/Role setup steps that go nowhere (toast-only)

**Top fixes:**
1. Wire OrgSetupStrip Save & Next / Work Area / Role to real destinations instead of toasts (groups-list-footer.tsx:54)
2. Make runEligibilityEngine actually add/remove rule-derived members so dynamic groups visibly change in demos (use-org-groups.ts:560)
3. Route membership import through the shared UploadModal staging/validate/dry-run flow instead of IMPORT_FILE_ROWS (use-org-groups.ts:504)
4. Add more Groups-targeted artifacts (membership approval chain, eligibility rules) to the workflow catalog so the Admin panel demos well
5. Swap local pager/sortable-header/select-column for shared usePager/PagerControls and table-helpers, and normalize badge variants

### directory (/directory — Directory & Org Chart)  <sub>(Organization)</sub>

**Scores:** feature 4/5 · layout 4/5 · config 3/5

**Implemented:** List/card/compact views with persisted choice (localStorage); Advanced search with custom-field filters and company scoping; Saved searches: full CRUD, interactive state; Real privacy-filtered Excel/CSV export via xlsx; Interactive react-d3-tree org chart: pan, zoom, collapse, fullscreen; Department-grouped org view with zoom and filter; As-of date historical org rendering (admin-gated); Cross-company/group/portfolio scoping with company identifiers; Privacy rules: platform defaults, versioned company overrides, custom fields; Employee timeline sheet with public/private comments; Vacancies board: keyword + experience range filters, register interest; Admin feedback/grievance worklist with status triage flow; Integrity validator: reporting cycles, deactivated managers (governance).

**Partial:**
- Org chart PNG/PDF export is toast-only, no file produced (org-chart-tab.tsx:166-171 handleExport)
- Feedback exists only as admin worklist (index.tsx:47 gates tab to admins); no employee submission
- No audit wiring: hooks omit { append, actor, actorRole } (use-directory.ts, use-directory-config.ts); no Activity log section
- Vacancies has no Closed status/toggle; only Open/Closing Soon/On Hold (data/vacancies.ts)

**Missing:**
- Employee 'Add new Feedback / Grievance' self-service form and My Feedback list (Kensium Organization/My Feedback - Grievance.md)
- Vacancies dedicated Location select and Open/Closed vacancies toggle (Kensium Organization/Vacancies.md)
- Hierarchy Chart 'View by Employee' generation with reporting-manager picker (Kensium Organization/Hierarchy Chart.md)

**Layout deviations:**
- index.tsx:71 TabsList uses custom 'bg-transparent p-0 h-auto justify-start gap-2 rounded-none' instead of canonical 'mb-2 flex-wrap'
- index.tsx:70 defaultValue='directory' hardcoded; no takeRequestedTab deep-linking support
- vacancies-tab.tsx:22 and feedback-worklist-tab.tsx:58 duplicate local sortableHeader instead of SortableHeader from workflows/components/table-helpers.tsx
- vacancies-tab.tsx:13 and feedback-worklist-tab.tsx:28 inline badge-variant maps rather than StatusBadge components in directory-badges.tsx
- directory-tab.tsx:271-277 selection via onSelectionChange but no selectColumn() checkbox column
- org-chart-tab.tsx:494-497 empty state is a bare <p>, not the canonical Card py-10 empty state
- No EngineArtifactsPanel anywhere in the module (grep confirms zero usage)

**Config locations & issues:**
- Location: Admin tab (single consolidated surface): PrivacyConfigTab — platform defaults, versioned company overrides, custom fields, rules trace (index.tsx:98-115, components/config/*)
- Location: Admin tab: TimelineSettingsCard per-event-type enable/visibility (components/timeline-settings-card.tsx)
- Location: Hardcoded: COMPANY_FIELD_RESTRICTIONS + seeds in data/directory-config.ts; scopedCompanies role-to-company grants in utils/org.ts
- Location: localStorage: view-mode key 'satellitehr-directory-view' (hooks/use-directory.ts:9)
- Location: Workflow catalog: NOTHING targets Directory — module-registry.ts:285-299 has targetModule: undefined, empty entities/events/forms; only 'Manage Active Directory' (Security, unrelated) in kensium-artifacts.ts:3702
- Issue: Module bypasses the catalog pattern entirely: no EngineArtifactsPanel, no workflow artifacts, breaking 'every module's config is the catalog filtered to it'
- Issue: Registry declares no entities/events/forms for /directory, so nothing directory-related is authorable in the engine (module-registry.ts:285-299)
- Issue: Per-company field restrictions (COMPANY_FIELD_RESTRICTIONS) are hardcoded constants not editable from the override panel UI
- Issue: Timeline settings and privacy config are bespoke local stores; changes are invisible from the central Workflows Configure tab

**Top fixes:**
1. Add employee self-service 'Add new Feedback / Grievance' form + My Feedback status list; today feedback is admin-triage only (Kensium doc parity)
2. Register Directory entities/events/forms in module-registry.ts and embed EngineArtifactsPanel in the Admin tab so config follows the catalog pattern
3. Make org chart PNG/PDF export produce a real file (directory export already does via xlsx) instead of a toast
4. Add Vacancies Location filter and Open/Closed toggle to match the Kensium Vacancies screen
5. Adopt shared SortableHeader/StatusBadge and takeRequestedTab; standardize TabsList to 'mb-2 flex-wrap'

### policies (/policies — Policy Management)  <sub>(Policies & Comms)</sub>

**Scores:** feature 4/5 · layout 4/5 · config 4/5

**Implemented:** Policy catalog: search, Active/Inactive filter, reset, refresh, pagination with counts (POL-01–04, 21/22/28/29); 5-step authoring wizard: details, applicability, exclusions, effective dating, file validation, review; Versioning with overlap rejection, auto-close of open-ended versions, prior editions preserved; Draft/publish lifecycle with preview dialog and publish-from-preview; Retire with confirm; history retained; multi-select retire; Rules-engine applicability resolver: any worker + as-of date, specificity override, non-user workers; Employee self-service library: only in-force in-scope policies, keyword/category search; Scope-filtered publish notifications listed per worker and in governance log; Role permission matrix (maintain/view) with denied attempts blocked, toasted and audited; Version history sheet, scope-config version history, effective-status summary cards; Full stateful in-memory store — interactive, not static mock (use-policies.ts).

**Partial:**
- Module integration toggles (BRD 6.10.3) are cosmetic — toggle only fires a toast, nothing consumes them (use-policies.ts:351-361)
- Attachment upload validated and stored as metadata only; document itself never viewable in preview (policy-preview-dialog.tsx:104)
- Registry events 'Policy acknowledgement overdue'/'Policy review due' declared (module-registry.ts) but no scheduler/alert surface in module
- Role permission matrix is module-local state, disconnected from global role-context RBAC (use-policies.ts:52-60)

**Missing:**
- No Reports tab — conventions require per-module reporting deliverable (00-CONVENTIONS.md); BRD 6.11.8 reporting sits in /policy-distribution
- Acknowledgment tracking absent here — BRD 6.11 — intentionally split to /policy-distribution, but /policies declares 'Policy acknowledged' event
- No bulk import of policies via the sanctioned Upload/Import framework (conventions item 7)

**Layout deviations:**
- Custom CatalogPagination (numbered buttons, Previous/Last) instead of shared usePager/PagerControls — catalog-controls.tsx:79-125
- Hand-rolled select column duplicates shared selectColumn() from workflows/table-helpers — policies-table-columns.tsx:53-77
- Inline sort-header buttons duplicate shared SortableHeader — policies-table-columns.tsx:80-90 and repeats
- No row-click detail sheet (no onRowClick/FloatingSheetContent); actions only via selection + icon toolbar — catalog-tab.tsx:259-265
- Retire uses AlertDialog instead of shared ConfirmDialog — catalog-tab.tsx:309-332
- Tabs built with manual isAdmin conditionals, not the TabDef[]+useRole filter idiom; TabsList lacks flex-wrap — index.tsx:48-55
- Filter controls h-8 (not h-7) and split from the actions row into a separate row — catalog-controls.tsx:35-65
- Library empty state uses dashed-border div, not the canonical Card py-10 pattern — library-tab.tsx:121-125

**Config locations & issues:**
- Location: Admin tab in-module: EngineArtifactsPanel module='Policy Management' + applicability resolver + governance sections — src/features/policies/index.tsx:67-80
- Location: Workflow catalog: single artifact bl-16 'Policy Document' template targets Policy Management — src/features/workflows/data/business-logic.ts:646-663
- Location: Bespoke module-local settings: role permission matrix + module integration switches in GovernanceTab — src/features/policies/components/governance-tab.tsx:28-110, state in hooks/use-policies.ts:130-134
- Location: Hardcoded constants: POLICY_CATEGORIES, LINKED_MODULES, OWNER_LEVELS, TENANT, seed workers — src/features/policies/data/policies.ts, data/workers.ts
- Location: Sibling module scatter: acknowledgment/distribution config lives in /policy-distribution 'Config' tab — module-registry.ts:577-590
- Issue: Role permissions and integration switches are bespoke in-module settings, contradicting the catalog-slice pattern; not versioned/scoped/effective-dated artifacts
- Issue: Only one catalog artifact targets Policy Management despite 7 declared events — no alert/notification/rule artifacts for review-due or acknowledgment reminders
- Issue: Policy categories and linked-module list hardcoded in data/policies.ts, not editable anywhere
- Issue: Acknowledgment config split into /policy-distribution while /policies declares the acknowledgment events — ownership unclear in a demo

**Top fixes:**
1. Make module-integration toggles real: back them with workflow-catalog setting artifacts so toggling visibly affects linked modules (use-policies.ts:351)
2. Add row-click FloatingSheetContent detail sheet for policies (content, applicability, versions) instead of selection-only icon actions
3. Surface scheduler alerts for 'Policy review due' and acknowledgment-overdue events, or add those artifacts to the Policy Management catalog slice
4. Replace custom pagination and select column with shared PagerControls/selectColumn/SortableHeader; use ConfirmDialog for retire
5. Render/download the uploaded attachment in the preview dialog so the document upload flow feels complete

### policy-distribution  <sub>(Policies & Comms)</sub>

**Scores:** feature 4/5 · layout 3/5 · config 3/5

**Implemented:** AND/OR audience targeting across all six BRD scope fields (utils/audience.ts); Manual/Scheduled/Event-triggered methods with edit/cancel before send; Required/Optional/Read-Only ack types with enforcement differences; All four due-date rules: fixed, relative, hire-based, periodic renewal; Milestone reminders (50/75/100%), overdue marking, escalations via SLA sweep; Re-ack triggers: content change, renewal, transfer, role change, regulatory; Employee inbox with review dialog, receipts, required/optional/read-only sections; Proxy acknowledgment with evidence for non-portal employees; Compliance dashboard: per-policy report, pending/overdue filter, tenant rollups; Bitemporal 7-year audit trail with valid/txn time and retain-until; Governance tab: reminder rules, escalation paths, versioned templates, decision table; Lifecycle-event simulation arming event-triggered distributions and re-acks; Interactive with state throughout — real in-memory stores, not static mocks.

**Partial:**
- Report export is a stub toast 'Export isn't available in this demo' (compliance-tab.tsx:180)
- Scheduled/armed distributions never auto-fire; require manual 'Send now' or lifecycle simulation (use-policy-distribution.ts:226)
- Bulk distribution is an isBulk>=8 flag, not the sanctioned Import framework/UploadModal (use-policy-distribution.ts:151)
- Checklist-task integration is a badge label only, no link to Notifications tasks (inbox-tab.tsx:66-69)
- Escalation 'routed via workflow engine' is narrative audit text, no workflow instance reference (use-policy-distribution.ts:531)

**Missing:**
- No EngineArtifactsPanel / workflow-catalog config surface; conventions say every module embeds it
- Registry entry declares zero events, entities, forms; targetModule undefined (module-registry.ts:582-591) — engine cannot target module
- No workflow catalog artifacts target Policy Distribution (business-logic.ts only targets 'Policy Management')
- No dedicated Reports tab per conventions §8; reporting folded into Compliance (BRD I §6.11.8 arguably satisfied)

**Layout deviations:**
- index.tsx:57 TabsList 'mb-3 bg-transparent p-0' with variant='primary' triggers; no TabDef[]/takeRequestedTab, so no cross-module tab deep-linking
- compliance-tab.tsx:95-111 summary card omits CardTitle header; tile uses 'flex flex-col gap-4' vs canonical 'flex items-center'
- Raw ui Table instead of DataTable for per-policy report, per-employee report, audit trail (compliance-tab.tsx:119,187; audit-trail.tsx:41) — no sorting/search
- Cards use 'border-grey-200' (typo token) and rounded-[6px] vs canonical border-gray-200 rounded-[8px] (inbox-tab.tsx:39, config-tab.tsx:83,121)
- distributions-table-columns.tsx:34-56 hand-rolls select checkbox column duplicating selectColumn() from workflows/table-helpers
- distributions-tab.tsx:256 uses AlertDialog instead of shared ConfirmDialog for destructive cancel
- Section headings 'text-sm font-semibold' with no Separator between Admin sections vs canonical 'text-paragraph-md text-neutral-1400 mb-3 font-semibold' (config-tab.tsx:59,72)
- Inbox empty state is inline paragraph (inbox-tab.tsx:149) not the canonical Card py-10 empty-state; card list has no usePager/PagerControls

**Config locations & issues:**
- Location: Module Admin tab (Config): src/features/policy-distribution/components/config-tab.tsx — reminders, escalations, templates, decision table, integrations (Platform/Company Admin only)
- Location: Hardcoded seeds: src/features/policy-distribution/data/config.ts, policies.ts, employees.ts (CURRENT_EMPLOYEE_ID, seed rules/templates)
- Location: Workflow catalog: NONE target this module; related 'Acknowledgement Terms' artifact sits under Policy Management in src/features/workflows/data/configuration.ts:89 and kensium-artifacts.ts:993
- Location: No EngineArtifactsPanel anywhere in the feature (grep confirms zero usage)
- Issue: Bespoke usePolicyConfig settings surface instead of the catalog-slice pattern; templates/rules versioned locally, invisible on Workflows Configure tab
- Issue: Acknowledgement-terms config duplicated under Policy Management in workflow catalog — two modules, two places, no cross-link
- Issue: targetModule undefined in registry means Workflows page can never filter artifacts to this module
- Issue: Escalation routes and reminder milestones editable here but the SLA sweep only runs via a hidden icon button in Distributions

**Top fixes:**
1. Set targetModule + events in module-registry.ts and embed EngineArtifactsPanel in the Admin tab so config joins the workflow catalog
2. Make Export produce a real CSV download instead of the 'not available' toast — dead-end button in the compliance demo
3. Auto-fire scheduled distributions when scheduledFor passes (or show a countdown), instead of relying on the manual Send-now action
4. Convert per-employee report and audit trail to DataTable for sorting/column search and canonical empty states
5. Adopt canonical tab strip (TabDef[] + takeRequestedTab) and fix border-grey-200/rounded-[6px] card tokens

### announcements  <sub>(Policies & Comms)</sub>

**Scores:** feature 5/5 · layout 4/5 · config 4/5

**Implemented:** Manage list with Kensium columns, period/status search + reset, Pending-with-me filter; Compose/edit overlay: zod-validated, event basis, recurrence pattern/days, expiry, templates, links, attachments; Full approval lifecycle: submit/approve/reject/withdraw/hold/resume/publish/unpublish/cancel-schedule with history; Seven-dimension audience targeting resolved against seed employees; tenant row-level scoping by role; Scheduling engine: idempotent Scheduled→Published→Recently Completed→Completed transitions, manual trigger; Employee feed: expand/collapse, read markers, search, expired hidden, templates rendered per employee; Vacancy apply / Event enroll and timeline comments from the announcement window; Review tab: reviewable list, edit, review-due reminders, simulated email notification log; Milestone image library CRUD mapped to event types (Images tab); Platform Admin governance: versioned effective-dated module toggle, governed targeting deprecation; Coordinators role assignment card; module-disabled empty state; non-user access-denied state; Delete with confirm, hide/unhide, bulk row selection (ANN/RAN stories all interactive with state).

**Partial:**
- Recurring series config lives only inside compose overlay (compose-overlay.tsx recurrenceDays); Kensium 'Configure Series' has no dedicated surface or Su–Sa/Task list columns
- Review tab only offers Edit (review-tab.tsx:166); Kensium Review screen also had inline Hide/Delete (they live on Manage instead)
- Email notify is toast + in-store log only (use-announcements.ts:61) — no Notification-engine artifact linkage

**Missing:**
- 'Thought of the day' — catalog artifact kx-084 targets Announcements (kensium-artifacts.ts:2482) but no UI surface exists
- Weekday (Su/Mo…Sa) and Task columns from Kensium Configuration/Announcement list view are absent from the Manage table

**Layout deviations:**
- TabsList 'mb-3 bg-transparent p-0' with variant='primary' triggers instead of canonical 'mb-2 flex-wrap' TabDef pattern — index.tsx:60
- Review tab and email log use raw ui Table, not DataTable/SimpleTable — review-tab.tsx:115,192
- Local sortableHeader and select column duplicate shared SortableHeader/selectColumn from workflows table-helpers — announcements-table-columns.tsx:21,41
- Delete confirm uses AlertDialog instead of shared ConfirmDialog — manage-tab.tsx:222
- No onRowClick detail sheet; workflow actions via toolbar dropdown without mandatory decision comment — manage-tab.tsx:124,196
- Empty/disabled states use ad-hoc 'border-grey-200 … py-12' div (typo grey) vs Card CardContent py-10 — index.tsx:82, feed-tab.tsx:74,136
- Filters are a bordered white panel with labeled date inputs, not the canonical inline toolbar row — announcement-filters.tsx:52
- Summary grid lg:grid-cols-5 vs canonical lg:grid-cols-4 — announcements-summary.tsx:33
- Store hooks omit the { append, notify, actor, actorRole } audit contract; history is bespoke per-record — use-announcements.ts:56

**Config locations & issues:**
- Location: Module Admin tab: EngineArtifactsPanel module='Announcements' — index.tsx:113
- Location: Admin tab Settings section (Platform Admin only): versioned module toggle + governed targeting deprecation — components/config-tab.tsx
- Location: Admin tab Coordinators section — components/coordinators-card.tsx; Images section — components/images-tab.tsx
- Location: Workflows catalog artifacts targeting Announcements: kx-068 Announcement Images, kx-069 Announcement, kx-084 Thought of the day — workflows/data/kensium-artifacts.ts:2034,2062,2482
- Location: Hardcoded seeds: data/org.ts (org config, coordinators, dimensions), data/announcements.ts (statuses, types, config versions)
- Issue: Two enablement sources: local versioned moduleEnabled toggle vs inert catalog setting kx-069 — catalog toggles don't affect the module
- Issue: Catalog 'Announcement Images' setting (kx-068) duplicates the Images section with no linkage
- Issue: Settings section (module toggle, targeting governance) visible only to Platform Admin; other admins cannot find it — index.tsx:115
- Issue: kx-084 Thought of the day is a dead-end setting: enabled in catalog, no UI consumes it

**Top fixes:**
1. Add a 'Thought of the day' surface consuming catalog artifact kx-084 (only documented capability with zero UI)
2. Wire module enablement/images settings to the catalog artifacts (kx-068/069) or remove them — one source of truth
3. Add row-click detail sheet (FloatingSheetContent) with history timeline and decision footer with mandatory comment, replacing toolbar-only workflow dropdown
4. Surface series weekday/Task columns and inline Hide/Delete on Review to match the Kensium list and Review screens
5. Swap local sortableHeader/select column/AlertDialog for shared SortableHeader, selectColumn, ConfirmDialog; fix 'border-grey-200' empty-state styling

### notifications (/notifications — Tasks, Notifications & Messages)  <sub>(Policies & Comms)</sub>

**Scores:** feature 5/5 · layout 4/5 · config 4/5

**Implemented:** Tasks tab: filters, sort, overdue-red, Initiate redirect, Mark Complete with comment, Reopen (stateful); Task Assigned by Me: full CRUD + reassign with Kensium field set (escalation, confidential, invoke-on); Notification inbox: search, category filter, bulk mark-read, team view, simulate-event, unread counts; Messages: compose to single/multiple/all, read/unread/archive/delete, bulk action + Submit; My Preferences: channels, subscriptions, frequency; effective-dated version history; Admin: channel toggles with mandatory email, Teams/WhatsApp connectors with test delivery; Event-driven vs digest delivery models, digest schedule + run-digest simulation; Templates: DataTable, editor sheet, placeholders/branding, versioned saves, company override, restore default; Delivery log DataTable with retry, fallback-to-email, dead-letter resolution; Embedded workflow ApprovalInbox sharing engine + audit stores; EngineArtifactsPanel embedded in Admin tab; Summary cards (unread/approvals/delivered/dead-letter) on Notifications tab; Non-user fallback panels explaining mandatory email channel.

**Partial:**
- Inbox 'Open item' is a toast stub, no real record navigation (inbox-tab.tsx:130-133)
- Task Initiate for linkedModule 'other' is toast-only demo navigation (tasks-tab.tsx:92-96)
- No Reports tab despite conventions naming reporting a per-module deliverable (only delivery-log analytics)
- Module mutations (tasks/messages/templates) skip the audit trail — hooks take a notify callback, not { append, actor, actorRole } (use-tasks.ts:1-40, use-templates.ts)

**Missing:**
- No dedicated Kensium doc covers Tasks/Messages/Notifications inbox; nothing material missing vs BRD §6.27 — all five FR groups (channels, events, delivery models, templating, preferences) are represented

**Layout deviations:**
- index.tsx:119 TabsList uses custom 'bg-transparent p-0 h-auto justify-start gap-2 rounded-none' instead of baseline 'mb-2 flex-wrap'
- index.tsx:119-139 tabs not role-gated TabDef[] pattern; all six tabs incl. Admin render for every role (fallbacks live inside tabs)
- assigned-by-me-tab.tsx:122-127, messages-tab.tsx:181-183: create buttons use default variant, not canonical variant='red' bg-orange-1200 Plus pattern
- lucide-react icons throughout (tasks-tab.tsx:3-9, inbox-tab.tsx:2) instead of phosphor icons used by baseline modules
- inbox-tab.tsx:147,296,305: cards use 'border-none bg-white' instead of canonical 'rounded-[8px] border border-gray-200'
- Task/notification/message card lists have no usePager/PagerControls pagination (tasks-tab.tsx:160, inbox-tab.tsx:294, messages-tab.tsx)
- Message details and task completion open Dialogs, not the canonical FloatingSheetContent detail sheet (messages-tab.tsx, tasks-tab.tsx:261)
- No Activity log/History section in the Admin tab; audit wiring exists only for the embedded workflow ApprovalInbox (index.tsx:50-55)

**Config locations & issues:**
- Location: Admin tab in-module: EngineArtifactsPanel + Templates/Channels/Alerts/Delivery History sections (src/features/notifications/index.tsx:205-239)
- Location: My Preferences tab: per-user channel/subscription/frequency config with version history (components/preferences-tab.tsx)
- Location: Workflow catalog: many artifacts with targetModule 'Notifications' (src/features/workflows/data/kensium-artifacts.ts:41,4022+; business-logic.ts:585,935)
- Location: Hardcoded seeds: data/settings.ts (channels, connectors, digest, alerts), data/templates.ts, data/org.ts, data/notifications.ts (EVENT_TYPES)
- Location: Module registry entry with submodules/events (src/config/module-registry.ts:617-641)
- Issue: Templates exist twice: Admin-tab TemplatesTab store and Notifications-targeted template artifacts in the workflow catalog — unlinked parallel surfaces
- Issue: Admin tab is always visible to every role; sections gate internally, so employees see a mostly-empty Admin surface
- Issue: Alert toggles (data/settings.ts seedAlertsConfig) duplicate scheduler-alert artifact territory owned by the engine catalog

**Top fixes:**
1. Wire inbox 'Open item' and task Initiate to real deep-links (module-nav takeRequestedTab) instead of toast stubs
2. Cross-link or dedupe Admin Templates store with the Notifications template artifacts in the workflow catalog — one template source of truth
3. Add an Activity log section to Admin and pass { append, actor, actorRole } into task/message/template/settings hooks
4. Adopt canonical create-button (variant='red' bg-orange-1200) and phosphor icons; restore baseline TabsList styling
5. Add usePager/PagerControls to the notification, task and message card lists (seed data already exceeds one screen)

### hr-letters (/hr-letters — HR Letters & Certificates)  <sub>(Policies & Comms)</sub>

**Scores:** feature 5/5 · layout 4/5 · config 4/5

**Implemented:** All 8 BRD template types, versioned, with New/Edit/Preview (templates-tab.tsx); Merge-field rendering with blank/flagged missing-value behavior (data/hr-letters.ts renderBody); Manual, batch, and simulated event-driven generation with per-employee failure handling (use-hr-documents.ts); Approval queue with approve/reject-with-reason and audit trail (approvals-tab.tsx); Distribution via email/in-app/print/handover with delivery outcomes, CC, failures (distribute-dialog.tsx); Reissue creates new version, prior versions retained (use-hr-documents.ts reissue); 7-year retention setting, end-of-retention policy, per-row retained-until date; Employee self-service view/download + agreement acknowledgment with certification questionnaire (my-documents-tab.tsx); Non-User employee delivery-record view (my-documents-tab.tsx); Domain email/notification catalogs with Template Type IDs, paging, routing panels (catalogs-tab.tsx); Decision tables, auto-trigger toggles, notification-engine settings (config-tab.tsx); Group governance enforce-standard and Platform tenant data-model views (config-governance/platform); Summary cards, filterable DataTable grid, detail sheet with versions/audit.

**Partial:**
- PDF output/download is a toast, no rendered PDF preview beyond text <pre> (my-documents-tab.tsx:149)
- Audit is per-document local array; stores ignore the canonical { append, actor, actorRole } contract, actors hardcoded (approvals-tab.tsx:88)
- 'Certificate expiring' event declared in module-registry.ts:664 but no expiry alert/scheduler surface anywhere in the module

**Missing:**
- No Reports tab — conventions require per-module reporting deliverable (00-CONVENTIONS.md); BRD 6.28 itself is fully covered

**Layout deviations:**
- documents-tab.tsx:202 DataTable lacks onRowClick; detail sheet opens only via select-row + Eye button, breaking row-click-opens-sheet baseline
- index.tsx:74 TabsList className='mb-3 bg-transparent p-0' instead of canonical 'mb-2 flex-wrap'
- index.tsx:126-155 Admin sections not divided by <Separator /> as baseline requires
- templates-tab.tsx:97-135 hand-rolled ui Table + custom Previous/Next paging instead of DataTable or usePager/PagerControls
- documents-table-columns.tsx:24-47 re-implements select column and sortable headers instead of selectColumn()/SortableHeader from table-helpers.tsx
- config-tab.tsx:53,81,156,211 cards use rounded-[6px] not the baseline rounded-[8px] non-table card
- my-documents-tab.tsx:112 and approvals-tab.tsx:62 empty states use ad-hoc p-6 div, not Card CardContent py-10 pattern
- status-badges.tsx:13,45 semantic drift: 'overdue' variant reused for pending-approval status and handover channel

**Config locations & issues:**
- Location: Admin tab in-module: Letter Templates, Email & Notifications catalogs, Agreements, Settings sections (index.tsx:123-156)
- Location: EngineArtifactsPanel module='HR Letters & Certificates' at top of Admin tab (index.tsx:125); artifact in workflows/data/kensium-artifacts.ts:12-25
- Location: Settings store: hooks/use-letter-config.ts (auto-triggers, channels, retention, decision rules, governance)
- Location: Hardcoded constants: data/hr-letters.ts (SIGNING_AUTHORITIES, MERGE_FIELDS, EVENT_DOC_TYPE, COMPANY_*) and data/catalogs.ts seeds
- Issue: Letter templates authored in module Admin AND exist as engine catalog artifact — two sources of truth, unclear which wins
- Issue: Decision tables pick approval workflows from local APPROVAL_WORKFLOWS strings instead of referencing workflow catalog artifacts by id
- Issue: Signing authorities and merge fields hardcoded in data/hr-letters.ts, not editable anywhere
- Issue: ConfigTab silently swaps content by role (Platform/Group/Company see different panels at same heading), which can confuse demos

**Top fixes:**
1. Add onRowClick to documents grid so rows open the detail sheet directly — current select-then-Eye flow stalls demos
2. Surface 'Certificate expiring' scheduler alerts (registry declares the event) — an expiries card or alert list on Documents tab
3. Add a Reports section (issued-by-type, delivery outcomes, pending acks) to meet the per-module reporting convention
4. Reconcile template duplication: link module Templates section to the engine catalog artifact or mark one read-only
5. Adopt shared selectColumn/SortableHeader and usePager/PagerControls in documents/templates tables to remove one-off forks

### feedback (/feedback — Feedback & Grievance + Surveys)  <sub>(Policies & Comms)</sub>

**Scores:** feature 4/5 · layout 4/5 · config 4/5

**Implemented:** My Feedback: submit, status filter, search, reset, refresh (MFG-01..05); Reviewer worklist scoped per role, search/status/type filters, reset (EFG-01..04); Anonymous submission with reference tracking, config-gated (EFG-06, FGR-02); On-behalf submission for non-user employees by admin/coordinator; Entry detail sheet with status decisions, escalation, response, audit trail; Config wizard: Setup, Receivers dual-list, Coordinator, Email Templates (FGS/FGR); SLA reminder days + Run SLA engine escalating to coordinator (FGR-06/07); Survey admin: list, add, filters, view, refresh, pagination (SVL-01..07); Survey Setup + location-approver mappings + email templates (SET, SAP); My Surveys: period/status filters, reset, respond dialog (SUR-01..04); Governance tab: scope statement, per-company provisioning toggles; Module-disabled and anonymous-disabled empty states, versioned config saves.

**Partial:**
- Survey responses live in component state (my-surveys-tab.tsx:70), lost on tab switch, invisible to admin
- Worklist lacks explicit Refresh / 'Action required by me' view (EFG-07); only SLA engine button
- My Feedback columns omit 'Sent to' from Kensium list view (entries-table-columns.tsx; doc My Feedback - Grievance.md)
- Email/notification templates editable locally (config-templates-step.tsx) but disconnected from catalog artifacts at kensium-artifacts.ts:4047/4290

**Missing:**
- EFG-05: Active/Inactive employee and Raised-by dropdown filters on reviewer worklist (Employee Feedback - Grievance_stories.csv)
- MFG columns 'Task' action column per Kensium list view (My Feedback - Grievance.md)

**Layout deviations:**
- TabsList uses 'mb-3 bg-transparent p-0' not baseline 'mb-2 flex-wrap' (index.tsx:96)
- Local selectColumn + sortableSearchHeader duplicate workflows/table-helpers SortableHeader/selectColumn (entries-table-columns.tsx:44,69)
- MySurveysTab and SurveyListPanel use raw ui Table with hand-rolled pagination instead of DataTable/usePager+PagerControls (my-surveys-tab.tsx:214, survey-list-panel.tsx:181,262)
- No onRowClick to open detail sheet; Eye button gated on single selection instead (my-entries-tab.tsx:166, worklist-tab.tsx:218)
- Empty/disabled states use custom 'px-6 py-12' panel, not Card+CardContent py-10 baseline (index.tsx:71,120; my-surveys-tab.tsx:132)
- Badge variants outside fixed vocabulary: qualified/booked/disqualified (status-badges.tsx:9,23; my-surveys-tab.tsx:250)
- FeedbackSummary is another SummaryCards styling fork, grid-cols-5 vs baseline lg:grid-cols-4 (feedback-summary.tsx:24)
- Config wizard stepper is a bespoke one-off duplicated twice (config-tab.tsx:27, surveys-tab.tsx:46)

**Config locations & issues:**
- Location: Module Admin tab > Feedback & Grievance section: EngineArtifactsPanel module='Feedback & Grievance' (index.tsx:166)
- Location: Module Admin tab > ConfigTab wizard: Setup/Receivers/Coordinator/Email Templates (components/config-tab.tsx, backed by hooks/use-feedback-config.ts + data/config.ts seed)
- Location: Module Admin tab > GovernanceTab per-company provisioning switches (components/governance-tab.tsx)
- Location: Module Admin tab > Surveys section > Configuration sub-tab wizard (components/surveys-tab.tsx, data/surveys.ts seeds)
- Location: Workflow catalog artifacts targeting 'Feedback & Grievance': kensium-artifacts.ts:1638-1669 (receivers, module enable), 3760/3788/3826, 4047/4290 (email/notification templates); business-logic.ts:911
- Location: Hardcoded constants: REVIEWER_ROLES (index.tsx:20), companiesForRole/CURRENT_* personas (data/entries.ts), org roles (data/org.ts)
- Issue: Module enable, receivers, and templates exist twice: ConfigTab local store vs catalog artifacts in EngineArtifactsPanel — edits do not sync
- Issue: Survey configuration is three levels deep: Admin tab > Surveys > Configuration sub-tab > wizard step — hard to find in 30 seconds
- Issue: Feedback module-disabled state driven only by local ConfigTab toggle; catalog 'Setup' artifact toggle has no effect
- Issue: Governance provisioning toggles duplicate scope-enablement that the catalog scope badges already model

**Top fixes:**
1. Persist survey responses in useSurveys store so admin Survey List shows response counts; state currently dies with the tab (my-surveys-tab.tsx:70)
2. Add EFG-05 worklist filters (Active/Inactive employees, Raised by) plus a Refresh button (EFG-07) to the Review Queue
3. Wire ConfigTab enable/receivers/templates to the same source the EngineArtifactsPanel artifacts read, removing the duplicated disconnected config
4. Flatten survey configuration: surface the Setup/Approvers/Templates wizard directly as an Admin section instead of a nested sub-tab
5. Swap raw Table + manual pagination in survey lists for DataTable / usePager+PagerControls and reuse shared SortableHeader/selectColumn

### custom-fields  <sub>(Platform)</sub>

**Scores:** feature 4/5 · layout 4/5 · config 4/5

**Implemented:** Field definitions CRUD via 4-step wizard (Basics/Type/Behaviors/Permissions), fully stateful; All 18 BRD data types rendered generically by DynamicFieldControl; Six supported entities plus Leave Request / Asset Requisition form targets; Per-audience HR/Manager/Employee View-Edit matrix, enforced on records and grids; Required/mask/regex validation blocking saves (field-engine.ts validateFieldValue); Fields Order dialog, Is Default toggle, Refresh — matches Kensium UDF screen; Scope layering Platform/Group/Company with lock icon and edit rights per admin role; Versioned, effective-dated definition history with Scheduled/Effective status; Bitemporal value history with as-of date query (GovernanceTab); Metadata-driven grid, per-field search filter, real CSV export; Workflow conditions on custom fields with live evaluate and safe missing-field skip; CustomFieldsSection reused by leave, assets, employees forms via shared external store; Portfolio oversight and tenant-isolation panels for higher admin roles.

**Partial:**
- Import is a toast stub only (integration-tab.tsx:141-153) — no UploadModal, staging, or validation run despite the enforcing claim
- API access panel is read-only JSON preview + fake 422 toast (integration-tab.tsx:126-131, 253-295); no writable demo path
- 'Enable field on form' extras are session-local state (records-tab.tsx:56, 88-94), never persisted to the definition's isDefault
- deleteField/toggleDefault skip governance logging (use-custom-fields.ts:135-157), so History misses deletions and default toggles
- Value-history 'correction' kind seeded only; UI save path always writes 'update' entries (use-entity-records.ts)

**Missing:**
- Import through the sanctioned staging/validate/dry-run UploadModal framework — BRD 6.26.5 'included in import/export' (conventions item 7)
- Reporting surface: 'available for reporting' (BRD 6.26.5) exists only as a footnote sentence, no Reports tab or report columns demo

**Layout deviations:**
- definitions-tab uses hand-rolled AlertDialog for delete (definitions-tab.tsx:197-225) instead of shared ConfirmDialog
- fields-table-columns.tsx:24-47 reimplements the selection column instead of selectColumn() from workflows/table-helpers
- Admin sections use gap-8 without <Separator /> between sections (index.tsx:71), baseline is gap-6 + Separator
- IntegrationTab and GovernanceTab render raw ui Table (integration-tab.tsx:212, governance-tab.tsx:73,155) instead of DataTable/SimpleTable
- Refresh is a bespoke icon2 button (definitions-tab.tsx:124-131) duplicating shared RefreshButton
- No row-click detail sheet on the definitions table; edit only via checkbox selection + pencil (definitions-tab.tsx:82-93)
- Governance 'Scheduled' status reuses overdue badge variant (governance-tab.tsx:107), outside the pill vocabulary's meaning

**Config locations & issues:**
- Location: Module Admin tab (index.tsx:70-89): Engine Features (EngineArtifactsPanel module='Custom Fields'), Manage Fields (DefinitionsTab), History (GovernanceTab)
- Location: Workflow catalog: /poc/src/features/workflows/data/business-logic.ts:557-580 (bl-12 'User Defined Fields' custom-form, targetModule 'Custom Fields')
- Location: Hardcoded seeds/constants: /poc/src/features/custom-fields/data/custom-fields.ts (seed definitions, TENANTS, FORM_TARGETS, scopes) and field-wizard.tsx:118-123 (owner mapping)
- Location: Registry entry: /poc/src/config/module-registry.ts:715-733 (submodules, 4 events, targetModule 'Custom Fields')
- Issue: Catalog artifact bl-12 'User Defined Fields' (business-logic.ts:557) duplicates the module's own field-definitions store — two disjoint UDF sources of truth
- Issue: Owner/tenant mapping hardcoded in field-wizard.tsx:118-123 and TENANTS/FORM_TARGETS constants in data/custom-fields.ts — not editable anywhere in UI
- Issue: toggleDefault and deleteField mutate config without writing governance/version entries, so History under-reports changes (use-custom-fields.ts:135-157)

**Top fixes:**
1. Wire Import into the shared UploadModal staging → validate → dry-run → commit flow; BRD 6.26.5 explicitly requires import integration
2. Log governance/version entries for deleteField and toggleDefault so the History tab reflects every definition change
3. Reconcile catalog artifact bl-12 with the live field store (or link it) — currently two contradictory UDF configurations exist
4. Add a minimal reporting demo (custom fields as report columns) instead of the footnote claim
5. Swap bespoke AlertDialog/selection column/refresh button for shared ConfirmDialog, selectColumn(), RefreshButton and add Separators in Admin

### data-management  <sub>(Platform)</sub>

**Scores:** feature 5/5 · layout 4/5 · config 4/5

**Implemented:** 5-step import wizard: module/function routing, file, options, mapping, review (IMP-01..07); File type Excel/Flat/Xml with delimiter, text qualifier, header format, sample XML download; Saved mapping templates: create in wizard, reuse, delete (Saved Mappings tab); Duplicate handling + atomic/all-valid process types drive simulated outcomes; Staging validate-only mode with record-level success/failed/skipped preview; Live job status progression Submitted→Validating→In-progress→terminal with toasts; Transactional rollback and corrected-records re-import, both interactive; Import Data Log tab: Module/Function/date/by/counts, refresh, full pagination (IMPL-01..05); Export overlay creating live export jobs; Tenant-scoped row-level visibility of jobs by role; Admin tab: versioned formats/limits config, tier classification, function catalog, tenant overrides, notification templates; EngineArtifactsPanel embedded in Admin tab; Summary cards row with live counts.

**Partial:**
- File upload is a filename text input, no Browse/parse; columns derived from catalog not file (wizard/step-file.tsx:242)
- Error report download is toast-only, no actual CSV generated (index.tsx:163-172)
- Validation outcomes are deterministic simulation (fixed 6% failure), not tied to mapping choices (use-data-jobs.ts:60-100)

**Missing:**
- Scheduled/recurring import-export jobs — registry declares 'Scheduled job failed' event (module-registry.ts:751) but no scheduling UI
- Full-company data export for customers leaving platform (Phase I BRD line 351)
- No RBAC-deferred note needed beyond: audit-append wiring ({ append, actor }) absent from stores per conventions

**Layout deviations:**
- TabsList uses className='bg-transparent p-0' + variant='primary' triggers, not canonical 'mb-2 flex-wrap' (index.tsx:126)
- Import History uses raw ui Table with custom numbered pager instead of DataTable or usePager/PagerControls (import-log-tab.tsx:74-176)
- Badge variants 'qualified' and 'overlay_open' fall outside fixed vocabulary (components/badges.tsx:12,17-18)
- Select column hand-rolled instead of selectColumn() from workflows/table-helpers (jobs-table-columns.tsx:22-45, mappings-tab.tsx:23-46)
- Role-blocked state uses Alert component, not canonical Card py-10 empty-state pattern (index.tsx:97-115)
- Summary grid lg:grid-cols-5 vs canonical lg:grid-cols-4 (jobs-summary.tsx:38)
- Hooks omit { append, notify, actor, actorRole } audit signature; no Activity log section in Admin tab (hooks/use-data-jobs.ts:107, hooks/use-data-config.ts:31)

**Config locations & issues:**
- Location: Module Admin tab (Platform Admin gated): components/config-tab.tsx → config-governance.tsx (versions/limits/tiers), config-catalog.tsx (function toggles + tenant hides), config-notifications.tsx (templates + overrides)
- Location: EngineArtifactsPanel module='Data Management' inside Admin tab (config-tab.tsx:38)
- Location: Workflow catalog artifacts: 'Import Functions' setting (workflows/data/business-logic.ts:660-675); kx-028 'Import Data' and kx-029 'Import Data Log' (workflows/data/kensium-artifacts.ts:825-870)
- Location: Hardcoded constants: MAX_FILE_SIZE_MB/MAX_BATCH_RECORDS/formats/entities/functions in data/catalog.ts; seeds in data/config.ts
- Location: Deep-link default tab 'config' in workflows/data/module-nav.ts:23
- Issue: Wizard enforces hardcoded catalog.ts limits and static 'config v2' text; publishing a new config version changes nothing downstream (step-file.tsx:26-28,300)
- Issue: Function enablement duplicated: module Admin toggles vs 'Import Functions' catalog artifact — two unsynced sources (business-logic.ts:667)
- Issue: Formats checkbox list edits local state until Publish, but wizard format dropdown ignores the governed format set
- Issue: Registry entities: [] despite comment saying entities come from data-management/data/catalog.ts (module-registry.ts:744)

**Top fixes:**
1. Wire wizard limits/formats to configStore.currentConfig so publishing a config version visibly changes enforcement — best governance demo moment
2. Generate a real record-level error CSV blob on download instead of toast (index.tsx:163)
3. Add scheduled export jobs UI to back the declared 'Scheduled job failed' event and BRD operational data exchange
4. Rebuild Import History on DataTable (or usePager/PagerControls) to match canonical table anatomy
5. Add audit Activity log to Admin tab and { append, actor } wiring per conventions §5

### documents  <sub>(Platform)</sub>

**Scores:** feature 5/5 · layout 4/5 · config 4/5

**Implemented:** Documents grid: category/entity/expiry filters, sortable searchable columns, selection (DOC-22); Upload/edit sheet with real file format+size validation against governed policy (DOC-04/05/21); Company/Employee/Candidate entity attachment with full metadata (DOC-01/02/03/06); Expiry tracking badges, summary cards, configurable lead time (DOC-07/13/19); Live role-based access matrix gating view/download/upload per category (DOC-09/18); Employee self-service My Documents with self-upload and hidden-count notice (DOC-11/12); Notification engine generating templated expiry alerts, de-duped per renewal (DOC-20); Versioned effective-dated config: taxonomy, upload policy, access matrix, lead time (DOC-16/17); Tenant scoping per role: group manage, portfolio read-only oversight (DOC-14/15); Kensium Document Types and Required Certificates masters with add/edit; Kensium Document Custodian mappings with 4-way filters and coverage gaps; Custodian Desk receipts/returns/acknowledge lifecycle with reminders; Policy documents with effective windows, applicability, employee preview; EngineArtifactsPanel embedded in Admin tab.

**Partial:**
- DOC-10 encryption/tenant isolation simulated via toast copy only (documents-tab.tsx:110,264) — inherent to frontend mock
- DOC-20 engine is a manual 'Run notification engine' button (config-tab.tsx:127), not scheduler-driven
- Download is toast-only, no file served (my-documents-tab.tsx:185)
- DOC-03 Candidate docs stored as entityType only; no linkage into Recruitment module UI

**Missing:**
- No documented DOC-01..22 story is absent; only mock-inherent gaps remain (satellite-hr documents_and_attachments_stories.md)

**Layout deviations:**
- my-documents-tab.tsx:129, custodian-desk-tab, policies-tab, types/certificates/custodians tabs use raw ui Table, not shared DataTable
- No row-click detail sheet on documents grid (documents-tab.tsx:239) — actions only via selection toolbar icons
- AlertDialog used for destructive confirm instead of shared ConfirmDialog (documents-tab.tsx:271)
- TabsList 'mb-3 bg-transparent p-0' at index.tsx:87 vs canonical 'mb-2 flex-wrap'
- Admin sections use gap-8 without <Separator /> dividers (index.tsx:145) vs canonical gap-6 + Separator
- documents-summary.tsx:36 is another local SummaryCards styling fork
- Role gating via string equality (index.tsx:41-50) instead of hasRole/RoleGate idiom

**Config locations & issues:**
- Location: Admin tab > Settings: taxonomy, access matrix, lead time, notification template, platform upload policy (src/features/documents/components/config-tab.tsx, config-taxonomy.tsx, config-platform.tsx)
- Location: Admin tab > Document Types / Required Certificates / Custodians masters (types-tab.tsx, certificates-tab.tsx, custodians-tab.tsx via hooks/use-masters.ts)
- Location: Admin tab > EngineArtifactsPanel module='Documents' (index.tsx:148)
- Location: Workflow catalog artifacts: bl-24 Document Categories (workflows/data/business-logic.ts:826), kx-072 Document Types, kx-080 Required Certificates (workflows/data/kensium-artifacts.ts:2143,2367)
- Location: Hardcoded: DEFAULT_CATEGORIES/default access/30-day default (hooks/use-document-settings.ts:38-99), org scope + personas (data/org.ts)
- Issue: Category taxonomy exists twice: live ConfigTaxonomy store and static catalog artifact bl-24 — edits never sync
- Issue: Document Types and Required Certificates duplicated between Admin masters and catalog kx-072/kx-080
- Issue: Policies tab overlaps the separate /policies Policy Management module
- Issue: Settings is the 4th stacked section at the bottom of a long Admin tab — slow to find
- Issue: Group Company Admin sees Custodians but no Settings section (index.tsx:49)

**Top fixes:**
1. Reconcile live Admin stores with catalog artifacts bl-24/kx-072/kx-080 so taxonomy/types/certificates show one truth in EngineArtifactsPanel
2. Add row-click document detail sheet (FloatingSheetContent) with metadata, expiry, access, custody history
3. Migrate My Documents, Custodian Desk, Policies, and Admin masters to shared DataTable
4. Surface expiry alerts outside Admin (grid banner/badge) and tie engine to a Scheduler/Alert artifact instead of manual Run button
5. Add audit wiring ({ append, actor, actorRole }) and an Activity log section in Admin per conventions

### reports (/reports — Reports & Analytics)  <sub>(Platform)</sub>

**Scores:** feature 4/5 · layout 4/5 · config 3/5

**Implemented:** Category-grouped standard catalog (62 reports) with search/filter (RPT-01..05); Parameterised run sheet: period, dept, as-of bitemporal mode, export toast; Role-based dashboards with KPIs, bar charts, drill-down dialogs (BRD 6.23.2); Employee self dashboard and self-service My Reports scoped to own records; Ad hoc builder: field pick, filters, grouping/subtotals, saved views CRUD; Scheduled email deliveries: create/edit/pause/cancel/run-now + delivery log with retry; Compliance registers: PF/ESIC eligibility, completeness flags, attendance/leave/wage registers; Effective-dated statutory template versions with publish flow; RLS grant table, role-dashboard mapping, tenant catalog/field toggles (interactive); Employee Current Status screen with location/dept/project/name filters, search, reset (ECS-01..05); Non-user employee 'My Data' inclusion panel.

**Partial:**
- Report outputs are shared per-category mock rows (run-report-sheet.tsx:73 categoryRows[report.category]) — every report in a category shows identical data
- Exports are toast-only, no file generated (builder-tab.tsx:240, run-report-sheet.tsx:234, compliance-tab.tsx:127)
- RLS grant revoke only mutates display; actual scoping uses hardcoded ROLE_COMPANY_ACCESS (governance.ts:9), toast claims false effect
- Catalog covers ~62 of ~120 Kensium reports; Induction/Benefit/KT categories thinned into others (Reports.md)
- No audit/activity log for config mutations — hooks lack { append, actor, actorRole } wiring (use-report-config.ts, conventions #5)

**Missing:**
- Several Kensium report families absent: Benefit Management, KT Tasks, Induction, TDS reports (kensiumhr-features/Organization/Reports.md)
- Phase II statutory reports: Gratuity, Bonus, Maternity Benefit, Minimum Wage, PT/LWF applicability (Phase II BRD §9.2)
- Compliance dashboards with exception reports (Phase II BRD line 479)
- Module registry declares no entities/events/forms for /reports (module-registry.ts:801-803)

**Layout deviations:**
- Raw HTML <table> instead of DataTable/SimpleTable: schedules-tab.tsx:157, compliance-tab.tsx:151/205/259, governance-platform.tsx:76/139/184
- schedule-columns.tsx:10-32 hand-rolls selection column duplicating shared selectColumn(); plain string headers, no SortableHeader
- SchedulesTab uses AlertDialog (schedules-tab.tsx:217) instead of shared ConfirmDialog for destructive cancel
- Admin tab sections lack <Separator /> between them (index.tsx:206 uses gap-8 only)
- Tabs defaultValue skips takeRequestedTab cross-module deep-linking (index.tsx:167)
- Catalog empty state is bare <p> (catalog-tab.tsx:158), not the Card/CardContent py-10 pattern
- Dashboards hand-roll bar charts and KpiCard (dashboards-tab.tsx:273-332) instead of shared chart.tsx/metric-item

**Config locations & issues:**
- Location: Admin tab > 'Access & Settings' (governance-tab.tsx + governance-platform.tsx): catalog toggles, role-dashboard defaults, builder field catalog, RLS grants, template versions — Platform Admin only
- Location: Admin tab > 'Scheduled Emails' (schedules-tab.tsx): schedule CRUD, engine delivery log — Company/Platform Admin
- Location: Workflow catalog: ZERO artifacts target Reports; no EngineArtifactsPanel anywhere in the module; registry targetModule: undefined (module-registry.ts:792)
- Location: Hardcoded: ROLE_COMPANY_ACCESS scoping (data/governance.ts:9), PF/ESIC decision thresholds (data/compliance.ts), REGISTERS list (compliance-tab.tsx:27), TODAY constant (use-report-config.ts:14)
- Issue: Module owns bespoke governance panels instead of the EngineArtifactsPanel catalog slice every other module embeds — breaks the canonical pattern
- Issue: RLS grants UI is a dead end: revoking never changes real scoping, which lives in a hardcoded constant
- Issue: Company Admin sees Admin tab but not catalog/field config (Platform Admin only) — cannot find tenant catalog toggles
- Issue: Rules-engine decision tables shown read-only in two places (compliance-tab footnote, governance panel) with no edit path
- Issue: Config changes (toggles, publishes, grant edits) leave no audit trail despite mandatory-audit convention

**Top fixes:**
1. Wire RLS grants to actual report scoping (replace ROLE_COMPANY_ACCESS lookup) so the revoke demo visibly removes rows
2. Give each report distinct output rows instead of shared per-category mock data — 'every report shows same data' is demo-visible
3. Embed EngineArtifactsPanel in the Admin tab and register Reports artifacts (templates, schedules, decision tables) in the workflow catalog
4. Replace raw HTML tables (delivery log, registers, grants, templates) with DataTable/SimpleTable + SortableHeader and shared selectColumn
5. Add an Activity log section auditing config mutations (catalog toggles, template publishes, grant changes) per conventions

### roles-security  <sub>(Platform)</sub>

**Scores:** feature 4/5 · layout 4/5 · config 3/5

**Implemented:** Role catalog: create/edit/search/reset, admin flag, versioned history sheet (RSEC-35, RSEC-18); Effective-dated assignments with as-of date reconstruction and end-assignment (RSEC-15, RSEC-02); Authority-scoped assignment visibility per persona (RSEC-11) via data/authority.ts; Scope rules CRUD with versioning and live record simulator (RSEC-03, RSEC-19, RSEC-16); Delegations: create/revoke, engine-routed approvals, admin oversight trail (RSEC-04/05/21); Impersonation: start/end sessions, per-company authorizations, flagged action log (RSEC-06/07/14); Company context switching with confirm dialog and audit of denials (RSEC-09/10); MFA per company plus employee enroll/challenge simulator (RSEC-08, RSEC-12); Password policy with live tester incl. length/complexity/history (RSEC-24..29); Active Directory config with position shuttle and mandatory flags (RSEC-30..32); Assign Roles screen matrix with module filter and Save & Continue (RSEC-33/34); Scheduled jobs incl. Acumatica, recipients, Reset IIS; support teams (RSEC-37..39); Append-only audit store with category filter and rejected edit/delete (RSEC-17); Notification feed for sensitive security events (RSEC-22); Non-user employee RBAC panel and access-engine evaluator (RSEC-13, RSEC-20); Project roles catalog with types and questions (RSEC-36); All stores interactive with state, audit append and toasts — not static mocks.

**Partial:**
- Scope rules omit the 'group' dimension — only company/department/workforceType in ScopeRule (data/scope-rules.ts:17-33); RSEC-03/RSEC-19 require group
- Group scoping approximated by rule names ('Tech group') selecting companies, not a real dimension (data/scope-rules.ts:87)
- Roles/assignments DataTables have no onRowClick detail sheet; edits require checkbox select + icon (roles-tab.tsx:103-109)

**Missing:**
- No Reports tab despite conventions declaring reporting a per-module deliverable (design/00-CONVENTIONS.md conventionsSummary item 8)
- No per-level scope badges (P/G/C layered enablement) on config artifacts, per conventions item 1

**Layout deviations:**
- Admin tab uses custom segmented button strip instead of stacked role-gated AdminSection sections with Separator (index.tsx:246-261)
- Raw HTML <table> instead of DataTable/SimpleTable in delegations-tab.tsx:56, impersonation-tab.tsx:161, audit-tab.tsx:59, scope/jobs panels
- Section h3s use 'text-sm font-medium' not canonical 'text-paragraph-md text-neutral-1400 mb-3 font-semibold' (delegations-tab.tsx:45, context-tab.tsx:52)
- Create actions use plain Button (delegations-tab.tsx:52 'New Delegation', scope-tab.tsx:58) instead of orange Plus create-button pattern
- AlertDialog used for destructive confirm instead of shared ConfirmDialog (assignments-tab.tsx:134, context-tab.tsx:4)
- SecurityBadge maps to 'disqualified' variant, outside the fixed badge vocabulary (components/badges.tsx:10,23)
- Footnotes use text-xs instead of 'text-paragraph-sm text-neutral-1000' (roles-tab.tsx:111, assignments-tab.tsx:119)

**Config locations & issues:**
- Location: Admin tab > EngineArtifactsPanel module='Roles & Security' (src/features/roles-security/index.tsx:240) — 3 catalog artifacts: Assign Roles, Role, Password Policy (workflows/data/kensium-artifacts.ts:2090,2398,3732)
- Location: Admin sub-tabs inside module: Screen Access, Data Access, Company Switching, Act as User, Sign-in Settings, Jobs & Support, Activity & Alerts (index.tsx:79-107)
- Location: Workflows Configure catalog toggles ca-05 'Roles' and ca-14 'Roles & Permissions' (workflows/data/configuration.ts:80,170)
- Location: Standalone Authentication module duplicates password/MFA policy (src/features/authentication/components/policy-panel.tsx:55,111)
- Location: Hardcoded seeds: data/security-config.ts, data/roles.ts, data/scope-rules.ts, data/authority.ts, data/impersonation.ts
- Issue: Password policy and MFA configurable in both roles-security Sign-in Settings and the Authentication module — duplication, no cross-link
- Issue: Workflows catalog toggles ca-05/ca-14 are dead-ends: enabling/disabling them changes nothing in the module
- Issue: Sign-in Settings buried three levels deep (module > Admin tab > segmented sub-tab), hard to find in 30 seconds
- Issue: Catalog slice holds only 3 artifacts while 7 bespoke admin surfaces exist — config mostly lives outside the catalog pattern
- Issue: Authority/company mappings hardcoded in data/authority.ts with no admin surface

**Top fixes:**
1. Add 'group' as a real scope-rule dimension (type, overlay, ruleAllowsPerson, simulator) — RSEC-03 High requires all four dimensions
2. Unify or cross-link password/MFA policy between roles-security Sign-in Settings and the Authentication module to kill duplicate config
3. Wire workflows catalog entries ca-05/ca-14 to deep-link into the module's Admin tab so catalog toggles are not dead-ends
4. Replace raw HTML tables (delegations, impersonation, audit, jobs) with DataTable/SimpleTable plus row-click detail sheets
5. Convert the custom segmented Admin selector to canonical stacked AdminSection sections with Separators and standard h3 styling

### authentication  <sub>(Platform)</sub>

**Scores:** feature 4/5 · layout 4/5 · config 4/5

**Implemented:** Interactive email/password login simulator with generic errors, audited attempts (BRD 6.1.1/6.1.6); SSO simulation for SAML/AD/O365/Google incl. IdP-rejection path, config-driven method visibility; Multi-company session with context switcher, per-company roles, no re-authentication (BRD 6.1.3/6.1.4); Distinct User entity table with create/edit, unique-email constraint (BRD 6.1.2); Membership editor: add/revoke (effective-dated), per-company roles, employee link/unlink (BRD 6.1.5); Provision-login flow for workforce-only employees; Password reset dialog validating current versioned policy; Method enable/disable with min-one guard and SSO connection validation; Versioned effective-dated password policy with retained history; Notification templates: tenant customize + audited test send; Append-only, tenant-scoped audit log with actor/event/company/outcome filters; Summary cards row and embedded EngineArtifactsPanel.

**Partial:**
- Lockout: policy lockoutThreshold stored (policy-panel.tsx) but use-login-session.ts never counts failures or locks accounts; registry events unfired
- Password expiry/history: configured in policy but never enforced at sign-in (use-login-session.ts:71-97)
- Disabling Email/Password hides it silently; local-only users not flagged (use-auth-config.ts:41-65) per US-CIT-12 AC
- Registry declares 'User deactivated'/'Failed login threshold exceeded' events; only manual status edit exists, no lockout event

**Missing:**
- MFA configuration/enrollment — registry event 'MFA enrolled' and BRD Phase I 6.12.5, US-CIT stories; absent entirely
- Session timeout setting (company-it-security-admin.md, BRD 6.12.5)
- Login Page Images setting (catalog kx-077 targets Authentication) has no module surface

**Layout deviations:**
- index.tsx:47 TabsList uses ad-hoc 'bg-transparent p-0 h-auto justify-start gap-2 rounded-none' instead of canonical 'mb-2 flex-wrap'
- Tabs not role-filtered via TabDef[]/useRole; all three tabs render for every role (index.tsx:47-57)
- Cards use rounded-[6px] not canonical rounded-[8px]: sign-in-tab.tsx:122,199; users-tab.tsx:138,178; session-panel.tsx:44; method-config-panel.tsx:37
- Users table has no onRowClick detail sheet; edit only via selection + icon button (users-tab.tsx:129-135)
- Role-blocked state in audit-tab.tsx:78 is a bespoke div p-6, not Card/CardContent py-10 pattern
- templates-panel.tsx:52 Badge variant 'qualified' outside the fixed badge vocabulary
- Admin tab sections lack <Separator /> between them (index.tsx:76-85)
- Summary grid lg:grid-cols-5 vs canonical lg:grid-cols-4 (auth-summary.tsx:44)

**Config locations & issues:**
- Location: Admin tab > 'Sign-in settings' section: ConfigTab (methods, password policy, templates) — src/features/authentication/components/config-tab.tsx via index.tsx:74-80
- Location: EngineArtifactsPanel module='Authentication' at top of Admin tab (index.tsx:75); catalog artifacts kx-077 Login Page Images, kx-124 Manage Active Directory (workflows/data/kensium-artifacts.ts:2286,3704)
- Location: Related kx-125 Password Policy artifact targets 'Roles & Security', not Authentication (kensium-artifacts.ts:~3730)
- Location: Hardcoded: DEMO_PASSWORD in hooks/use-login-session.ts:13; seed configs/policies/templates in data/auth-config.ts, data/companies.ts
- Issue: Active Directory enablement lives in both MethodConfigPanel and catalog artifact kx-124 with no linkage — two toggles, no source of truth
- Issue: Password policy duplicated: module PolicyPanel vs catalog kx-125 filed under Roles & Security — a demo user finds two conflicting policies
- Issue: kx-077 Login Page Images artifact targets Authentication but nothing in the module reflects it — dead-end setting
- Issue: ConfigTab panels are bespoke settings, not versioned catalog artifacts, diverging from config-is-a-catalog convention (mitigated by embedded panel)

**Top fixes:**
1. Enforce lockout: count consecutive failures in use-login-session.ts against policy lockoutThreshold, lock the user, fire 'User locked out' audit events
2. Add an MFA enrollment/challenge step to the sign-in simulator and an MFA toggle in ConfigTab (BRD 6.12.5, registry 'MFA enrolled')
3. Unify AD/method enablement with catalog artifact kx-124 (and kx-125 policy) so module panel and workflow catalog show one state
4. Flag local-only users when Email/Password is disabled instead of silently hiding the form (US-CIT-12 acceptance criterion)
5. Layout polish: canonical TabsList classes, rounded-[8px] cards, Separators between admin sections, row-click user detail sheet

### audit-logs (/audit-logs — Audit & Logging)  <sub>(Platform)</sub>

**Scores:** feature 4/5 · layout 4/5 · config 4/5

**Implemented:** Audit trail table: filters, sort, selection, detail sheet (interactive state); Full FR 6.29.2 audit data: entity, record, field, prev/new, actor, timestamp; Tamper-resistance demo: blocked edit/delete recorded as security events; Record-level chronological history timeline with per-record picker (FR 6.29.4); Versioned, effective-dated retention policy with archival sweep + disposal (FR 6.29.3); Mandatory entity/field scope config with mandatory-entity guard (FR 6.29.1); Role-based access matrix with live toggles and tenant-boundary scoping (FR 6.29.5); Committed vs rolled-back change simulation writing real entries; Summary cards scoped to active role.

**Partial:**
- Trail is page-local seed data; other modules' append stores (e.g. leave use-leave-config.ts append) never feed use-audit-log.ts
- Non-user employee records only flagged via seed nonUserRecord badge (audit-entry-sheet.tsx:47); no live pseudonymous flow
- Security events card is admin-only static list; not filterable or linked from summary tile (audit-trail-tab.tsx:176-208)

**Missing:**
- Export / compliance reports: Employee Master Change Log, User Access Audit (Phase II BRD 9.2); no Reports tab
- Authentication/impersonation audit log surfacing (Phase I BRD 3.28.6, 5.40) absent from trail
- Archived-log retrieval beyond in-page filter — no archive browse/restore UX (Phase I BRD 8, retention table)

**Layout deviations:**
- index.tsx:65 TabsList uses ad-hoc 'bg-transparent p-0 h-auto justify-start gap-2 rounded-none' instead of canonical 'mb-2 flex-wrap'
- index.tsx:64 hardcoded defaultValue='trail'; no takeRequestedTab deep-link, no TabDef[]+useRole role-filtered tab strip
- audit-log-columns.tsx:12-53 hand-rolls select column and sort headers instead of selectColumn()/SortableHeader from workflows/table-helpers.tsx
- 'border-grey-200' token throughout (retention-tab.tsx:83, audit-trail-tab.tsx:177) vs baseline 'border-gray-200'
- access-denied-panel.tsx:17-32 custom py-12 icon-circle empty state instead of canonical CardContent 'py-10 text-center' pattern
- No EngineArtifactsPanel anywhere in the module (grep confirms zero references)

**Config locations & issues:**
- Location: Admin tab (Platform Admin only) inside module: Data Retention + Scope & Access sections — index.tsx:97-127 (retention-tab.tsx, governance-tab.tsx)
- Location: Hardcoded seeds: src/features/audit-logs/data/audit-config.ts (retention versions, scope entities, access rules)
- Location: Workflow catalog: zero artifacts target this module; no 'Audit' in any targetModule across src/features/workflows/data/
- Location: module-registry.ts:858-872: targetModule undefined, entities/events/forms all empty
- Issue: Breaks catalog-slice pattern: bespoke Admin tab config, no EngineArtifactsPanel, module invisible to workflow catalog (targetModule undefined)
- Issue: Parallel unlinked audit surface: workflows/data/audit.ts keeps its own engine audit trail; two audit trails, no cross-link
- Issue: Registry declares no events despite tamper/archival/policy-change events existing in code
- Issue: Retention sweep/disposal are manual buttons; not represented as Scheduler/Alert artifacts per conventions

**Top fixes:**
1. Feed real cross-module mutations (leave, employees append stores) into the central audit trail so demo actions appear live in /audit-logs
2. Add a Reports/Export surface: CSV export + Employee Master Change Log and User Access Audit reports (Phase II BRD 9.2)
3. Set targetModule + events in module-registry.ts and embed EngineArtifactsPanel in the Admin tab; model retention sweep as a Scheduler artifact
4. Cross-link or merge the workflow engine audit trail (workflows/data/audit.ts) with this module to remove the duplicate audit surface
5. Normalize TabsList to canonical style, add takeRequestedTab, and reuse selectColumn/SortableHeader helpers

### platform-admin  <sub>(Platform)</sub>

**Scores:** feature 4/5 · layout 3/5 · config 4/5

**Implemented:** Tenant provisioning, edit, suspend/reactivate with activity log (stateful); Single-login company context switcher with denial logging; Jurisdiction catalog, portfolios, groups, cross-company sharing approvals; Auth provider platform/tenant toggles (SAML, AD, O365, Google); System users with multi-company memberships, revoke, person-record mapping; Roles/permission-sets card and access-audit runner; Versioned effective-dated config registry with publish-new-version; Per-tenant custom fields (UDF) creation dialog; Locale format configuration (date/number/currency/address); Webhooks and workflow-engine cards, security password policy editor; Immutable audit trail with cross-tenant read simulation; Data retention, terminated-record lifecycle, legal holds, monthly purge; Self-service DSR portal with SLA tracking and export; Maintenance window scheduler with Sunday/7-day/4-hour validation; Org Model sub-page: company details, structures, placement; My Workspace sub-page: tenant-aware search, self-service, interview panels.

**Partial:**
- Tenant creation is one flat sheet, not the 6-step wizard with duplicate detection (US-PA-01/03) — tenant-overlay.tsx:32
- Suspension lacks mandatory reason + approval (US-PA-07) — tenants-tab.tsx:118 sets status directly
- Report/bulk-import/export are toast-only stubs, no UploadModal staging flow (US-PA-10/11) — pages/org-model.tsx:46-76
- Company list has no status/jurisdiction filter selects (US-PA-12) — tenants-tab.tsx:96-165 toolbar has actions only
- Master-data version history absent; only config entries carry versions (US-PA-06) — use-tenants.ts:76
- OpenAPI spec button is a toast stub — config-tab.tsx:222

**Missing:**
- Commercial subscription: tier, employee limit, module entitlements enforcement (US-PA-42..44)
- 'Login as' support impersonation with audit (US-PA-28, BRD §6.12.4)
- Delegation of pending activities to another user (US-SYS-27, BRD §6.12.3)
- Notification defaults/templates and Teams/WhatsApp connectors (US-PA-39, US-PA-46)
- Company archive after 7-year retention with checksum export (US-PA-10)
- Bookmarkable company-specific URLs for context (US-SYS-22)

**Layout deviations:**
- Custom MiniTable (shared.tsx:103) used for all lists except tenants, bypassing canonical DataTable/SortableHeader/selection/empty states
- No row-click detail sheets; tenants edit via toolbar selection only — tenants-tab.tsx:158-164 lacks onRowClick
- Tabs not role-gated TabDef[]; static TAB_LABELS shown to every role — index.tsx:24-29,92
- TabsList uses 'mb-3 flex-wrap bg-transparent p-0' + variant='primary' triggers, not baseline 'mb-2 flex-wrap' — index.tsx:91
- SectionCard forks card style: 'border-grey-200' (typo) rounded-[6px] vs canonical rounded-[8px] border-gray-200 — shared.tsx:60
- SummaryCards local fork uses text-2xl value instead of canonical text-3xl — shared.tsx:30
- Hooks skip the { append, notify, actor, actorRole } audit contract; local platformLog/auditRecords instead — use-tenants.ts:28, use-security.ts:20

**Config locations & issues:**
- Location: Settings tab in module: EngineArtifactsPanel + Configuration/Security/Data-rules sections — src/features/platform-admin/index.tsx:112-130
- Location: Workflow catalog: 4 settings artifacts target 'Platform Admin' (kx-061, kx-071, kx-082, kx-083) — src/features/workflows/data/kensium-artifacts.ts:1818,2118,2426,2454
- Location: Org Model sub-page (company setup, jurisdictions) reachable only via header button — src/features/platform-admin/pages/org-model.tsx
- Location: Bespoke governed-config registry + locale + UDFs — src/features/platform-admin/data/config.ts, hooks/use-governed-config.ts
- Location: Hardcoded constants: security posture (data/security.ts), ops targets (data/operations.ts), roles (data/roles.ts)
- Issue: Bespoke configEntries registry duplicates the engine catalog concept; two 'versioned config' surfaces sit stacked in one Settings tab
- Issue: Org Model company settings live off-tab behind a small header button — easy to miss in a demo
- Issue: Security/compliance posture and ops targets are hardcoded display-only constants, not editable artifacts
- Issue: Registry submodule 'settings' maps fine, but security and governance are buried as sections without deep-link tabs

**Top fixes:**
1. Upgrade tenant creation to the 6-step wizard with duplicate detection and mandatory suspension reason/approval (US-PA-01/03/07)
2. Add commercial subscription card: tier, employee limit, subscribed modules with enforcement (US-PA-42..44)
3. Replace toast-stub bulk import/export/report with the sanctioned UploadModal staging→validate→commit flow
4. Add 'login as' impersonation and notification defaults/templates cards (US-PA-28, US-PA-39/46)
5. Migrate MiniTable lists (system users, config entries, DSR) to DataTable with row-click detail sheets

### dashboard (/)

**Scores:** feature 5/5 · layout 3/5 · config 3/5

**Implemented:** Home landing page after login with role-aware content (HOME-02); Announcements feed on Home with category filter, pinning, unread badges (HOME-01); Admin post/edit/pin/delete announcements via validated dialog, stateful in-memory store, toasts; Mark read / mark-all-read per-viewer unread tracking; Module launcher grid: all modules listed, role-locked cards show required roles; Zero-access role notice card for locked-out personas; Dedicated Platform Admin dashboard: KPIs, MRR trend, plan mix, revenue rollups; Collapsible tenant hierarchy, tenant growth, module adoption, activity feed panels.

**Partial:**
- Export billing summary is toast-only mock, no CSV produced (platform-admin-dashboard.tsx:50-62)
- Hero stats hardcoded: '1,174 stories', TOTAL_MODULES=31 constant — can silently drift (index.tsx:14,43-48)
- Announcement scheduling/expiry/targeting (BRD I 6.14) absent here; explicitly delegated to Announcements module (home-announcements.tsx:88-93)

**Missing:**
- None — Home_stories.csv HOME-01 and HOME-02 are both fully satisfied; BRD has no further dashboard-specific requirements

**Layout deviations:**
- CommonHeader missing className='bg-blue-150' on both variants (index.tsx:52, platform-admin-dashboard.tsx:33)
- Main lacks fluid + bg-neutral-200; body is 'flex flex-col gap-6 pb-10' not single w-full div (index.tsx:53-54)
- Stat cards use custom border-t-orbit-500 Card style instead of canonical SummaryCards tile pattern (index.tsx:83-97)
- Delete confirm uses raw AlertDialog instead of shared ConfirmDialog (home-announcements.tsx:394-421)
- lucide-react icons throughout instead of phosphor (index.tsx:2, home-announcements.tsx:5)
- PlatformPanel is a local one-off card header duplicating the non-table content card idiom, h3 font-semibold vs h2 font-medium (platform-panel.tsx:17-33)
- No role-gated tab strip; role branching is a hard component swap for Platform Admin (index.tsx:28-30) — acceptable for a landing page

**Config locations & issues:**
- Location: module-registry.ts:91-101 — Dashboard entry declares zero submodules/entities/events/forms (targetModule undefined)
- Location: No workflow catalog artifacts target Dashboard/Home (grep of src/features/workflows/data/ returns nothing); no EngineArtifactsPanel embedded
- Location: Hardcoded: MANAGER_ROLES posting rights (home-announcements.tsx:57-62), HOME_ANNOUNCEMENT_CATEGORIES (data/home-announcements.ts:1-7)
- Location: Hardcoded: hero stats + TOTAL_MODULES (index.tsx:14,43-48); platform billing/tenant seed data (data/platform-metrics.ts)
- Location: Real announcement lifecycle config lives in the separate Announcements module, linked via 'Open module' (home-announcements.tsx:190-197)
- Issue: Who may post Home announcements and the category list are invisible constants — no admin surface exposes or explains them
- Issue: No EngineArtifactsPanel slice, so Dashboard is the only module without the catalog-as-config pattern (arguably acceptable for a landing page)
- Issue: Hero metrics ('1,174 user stories', 31 modules) are dead-end hardcoded numbers a demo user cannot verify or update

**Top fixes:**
1. Make 'Export billing summary' generate a real CSV download instead of a toast-only mock (platform-admin-dashboard.tsx:50-62)
2. Derive hero stats (module count, story count) from module-registry instead of hardcoded constants to prevent demo drift (index.tsx:14,43-48)
3. Add bg-blue-150 header tint and Main fluid/bg-neutral-200 so Home matches every other module's chrome (index.tsx:52-53)
4. Restyle stat cards to the canonical SummaryCards tile pattern (index.tsx:83-97)
5. Swap raw AlertDialog for shared ConfirmDialog on announcement delete (home-announcements.tsx:394-421)

## 7. Appendix: canonical anatomy baseline

Grading baseline captured from the reference implementations (workflows, leave). Implementers of the scaffold kit (§3) grade against this.

### Anatomy

- Feature folder contract: src/features/<module>/index.tsx (exports the page component) + components/ + data/ (mock stores/constants) + hooks/ (use-*.ts stores that accept { append, notify, actor, actorRole } for audit wiring)
- Page header: <CommonHeader title='<Module Name>' className='bg-blue-150' /> (fixed Header, h1 is 'text-h3 text-neutral-1600 font-medium'; optional backButton/endComponent) — from /poc/src/components/layout/common-header.tsx
- Page body: <Main fluid className='bg-neutral-200'> wrapping a single <div className='w-full'> — from /poc/src/components/layout/main.tsx (px-4 py-6)
- Summary cards row (top of page or top of a tab): Card 'bg-blue-150 mb-4 w-full gap-2 border-none py-2', CardTitle 'text-paragraph-sm text-neutral-1600 font-medium', grid 'grid grid-cols-2 gap-3 lg:grid-cols-4', each tile 'flex items-center rounded-[6px] border border-gray-200 bg-white px-3 py-1.5' with label 'text-paragraph-sm font-medium text-black' and value 'text-3xl font-medium text-black' (SummaryCards in workflows; leave/employees carry local copies of the identical pattern)
- Role-gated tab strip: TabDef[] = { value, label, roles: Role[] } filtered via useRole(); <Tabs defaultValue={takeRequestedTab('/route') ?? visibleTabs[0]?.value} key={role}> with <TabsList className='mb-2 flex-wrap'>; controlled value only when cross-navigation/search needs it (workflows). First visible tab is the role's default, ordered task-first (self-service first for employees, admin last)
- Admin consolidation: all admin surfaces fold into ONE last 'Admin' (or 'Classic admin') tab rendered as stacked <section>s inside 'flex flex-col gap-6', each headed by h3 'text-paragraph-md text-neutral-1400 mb-3 font-semibold' (+ optional AdminSection caption 'text-neutral-1000 mb-3 text-xs'), sections individually role-gated, separated by <Separator />
- Tab body root: <div className='w-full'>; sections inside stack with mb-4 / space-y-6
- Toolbar above a table: 'mb-3 flex flex-wrap items-center justify-between gap-2' — filters LEFT (FilterSelect / Select with SelectTrigger variant='secondary' className='h-7 w-[170px..200px]', search Input 'h-7 w-[180px]'), actions RIGHT in 'flex items-center gap-3'; alternative titled form: SectionToolbar with h2 'text-neutral-1600 text-paragraph-md font-medium' title including count e.g. 'Workflow catalog (12)'
- Primary create action (right end of toolbar): Button variant='red' className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!' with <Plus size={10} weight='bold' /> + 'New <Thing>'; secondary icon actions: Button variant='icon2' className='text-neutral-1900 h-7 w-7' with phosphor icon size 16; outline utility buttons 'h-7 gap-1' (e.g. RefreshButton)
- Table: DataTable from /poc/src/components/common/data-table/table.tsx with variant='no-status', column headers via SortableHeader (SearchableHeader + Button variant='header' + ArrowUpDown 'text-neutral-2100 size-3.5'), selection via selectColumn() + onSelectionChange/resetSelectionKey, row click opens detail sheet (onRowClick), two-line cells: primary 'text-neutral-1600 font-medium' (LongText) over 'text-paragraph-sm text-neutral-1000 truncate' secondary; empty state handled by DataTable itself (NO_DATA_AVAILABLE)
- Status pills: ui Badge with the fixed variant vocabulary badge_active / badge_inactive / open / pending / completed / overdue / dropped / live, wrapped in a per-feature StatusBadge map (leave/components/badges.tsx, workflows/components/badges.tsx pattern)
- Non-table content card: 'rounded-[8px] border border-gray-200 bg-white p-4' (p-5 for notices) with internal header row 'mb-3 flex items-center justify-between' and h2 'text-neutral-1600 text-paragraph-md font-medium'; card lists paginate with usePager + PagerControls (page indicator 'text-neutral-1000 text-xs', h-6 outline Back/Next buttons)
- Detail sheet (row click): Sheet + FloatingSheetContent (/poc/src/components/ui/floating-sheet-content.tsx) with SheetHeader/SheetTitle, badge row, Separator-divided sections, decision footer with mandatory comment Textarea + action Select (RequestDetailSheet, ArtifactDetailSheet, EmployeeDetailSheet); create/edit uses a builder sheet or Dialog kept OUTSIDE the Tabs at the end of the page component; destructive confirms via ConfirmDialog; feedback via sonner toast
- Empty / role-blocked / module-disabled states: Card className='border-gray-200' + CardContent 'py-10 text-center' with 'text-neutral-1600 text-paragraph-md font-medium' title and 'text-neutral-1000 mt-1 text-sm' body; or inline notice 'flex items-start gap-3 rounded-[8px] border border-gray-200 bg-white p-5' with phosphor icon size 20 weight='bold'; RoleGate fallback panels use 'rounded-md border border-gray-200 bg-white px-4 py-6'
- Engine integration: <EngineArtifactsPanel module='<Module>' /> (from /poc/src/features/workflows/components/engine-artifacts-panel.tsx) rendered inside the Admin tab (leave) or at the bottom for admin roles inside a RoleGate + 'mt-4' (employees) — every module's configuration is the workflow catalog filtered to it
- Helper footnote under tables/sections: 'text-paragraph-sm text-neutral-1000 mt-2' (or pt-1) explanatory paragraph
- Role gating idioms: useRole()/hasRole(...) from @/context/role-context for logic, <RoleGate roles={[...]} fallback={...}> for markup; named ACTORS record maps Role -> persona for audit entries

### Shared components

- /Users/harshitsan/Documents/heliverse/hcm/poc/src/components/layout/common-header.tsx — CommonHeader (page title bar, bg-blue-150)
- /Users/harshitsan/Documents/heliverse/hcm/poc/src/components/layout/main.tsx — Main (fluid page container, bg-neutral-200)
- /Users/harshitsan/Documents/heliverse/hcm/poc/src/components/common/data-table/table.tsx — DataTable (sorting, column search, selection, virtualization, loading/error/empty states); plus searchable-header.tsx, simple-table.tsx, column-search.tsx, highlighted-cell.tsx in the same dir
- /Users/harshitsan/Documents/heliverse/hcm/poc/src/features/workflows/components/table-helpers.tsx — SortableHeader, selectColumn, SectionToolbar (canonical table toolbar/header idioms; cross-feature reuse expected)
- /Users/harshitsan/Documents/heliverse/hcm/poc/src/features/workflows/components/summary-cards.tsx — SummaryCards (canonical count-cards row; leave/leave-summary-cards.tsx and employees/employees-summary.tsx are byte-identical styling forks — audit modules against this style)
- /Users/harshitsan/Documents/heliverse/hcm/poc/src/features/workflows/components/engine-artifacts-panel.tsx — EngineArtifactsPanel (per-module engine catalog panel every module should embed)
- /Users/harshitsan/Documents/heliverse/hcm/poc/src/features/workflows/data/module-nav.ts — takeRequestedTab (one-shot cross-module tab deep-linking)
- /Users/harshitsan/Documents/heliverse/hcm/poc/src/features/leave/components/list-controls.tsx — RefreshButton, usePager, PagerControls (pagination for card lists)
- /Users/harshitsan/Documents/heliverse/hcm/poc/src/features/leave/components/badges.tsx and /Users/harshitsan/Documents/heliverse/hcm/poc/src/features/workflows/components/badges.tsx — StatusBadge pattern (fixed Badge variant vocabulary)
- /Users/harshitsan/Documents/heliverse/hcm/poc/src/components/common/long-text.tsx — LongText (truncating primary cell text)
- /Users/harshitsan/Documents/heliverse/hcm/poc/src/components/common/confirm-dialog.tsx — ConfirmDialog (destructive confirms)
- /Users/harshitsan/Documents/heliverse/hcm/poc/src/components/common/settings/ — SettingsWorkspace, SettingsGroupCard, ToggleTile, ApproverChainEditor, RulePillBuilder, ScopeChip, CalendarPreview, AdvancedSection (config/settings surfaces)
- /Users/harshitsan/Documents/heliverse/hcm/poc/src/components/common/upload-modal/ — UploadModal + details table (bulk import flows)
- /Users/harshitsan/Documents/heliverse/hcm/poc/src/components/skeletons/table-skeleton.tsx — TableSkeleton (used internally by DataTable)
- /Users/harshitsan/Documents/heliverse/hcm/poc/src/components/ui/ — Tabs/TabsList/TabsTrigger/TabsContent, Badge, Button (variants: red, outline, ghost, icon2, header), Card, Sheet + floating-sheet-content.tsx (FloatingSheetContent), Dialog, Select (SelectTrigger variant='secondary'), Input, Separator, Switch, Textarea, Label, sonner toast
- /Users/harshitsan/Documents/heliverse/hcm/poc/src/context/role-context — useRole, hasRole, RoleGate, Role type (role-gated tabs and actions)
- /Users/harshitsan/Documents/heliverse/hcm/poc/src/components/common/ misc — coming-soon.tsx, status-card.tsx, metric-item.tsx, summary-stats.tsx, chart.tsx, page-loader.tsx, error-boundary.tsx

### Conventions summary

design/00-CONVENTIONS.md is the single source of truth and supersedes all other design docs; it is backend-canonical but sets constructs the UI must mirror. (1) Scope layering: configuration resolves global → industry → tenant → legal_entity; the POC renders this as per-level scope badges (P/G/C, badge_active = effectively active, pending = enabled-but-blocked-upstream, badge_inactive = disabled) and per-role toggle rights — modules must show layered enablement, not flat on/off. (2) Workflow engine is the system of record for approvals: modules reference workflow instances by opaque id; inbox / Pending / Mass-Approval grids are read-model projections — hence the canonical Requests tab (inbox + running requests) and decision footers with mandatory comments. (3) Configuration is a catalog of versioned, scoped, effective-dated artifacts (approver chains, rules, forms, checklists, templates, alerts, settings, flows) authored once in the engine (Build), governed in Configure, and consumed by modules — every module embeds EngineArtifactsPanel as its config surface instead of owning bespoke settings. (4) Six engines: Workflow/Approval, Rules (CEL everywhere), Forms/UDF, Notification, Accrual/Balance/Time, Scheduler/Alert (time-driven reminders: expiries, probation, SLAs). (5) Audit is append-only and mandatory — every mutating store takes { append, actor, actorRole } and admin tabs expose an Activity log / History section; even anonymous submissions keep a (pseudonymous) audit row. (6) One lookup API (ref_code), approvers resolved by id as-of a date (never display strings). (7) Bulk operations go through the sanctioned Import framework (staging → validate → dry-run → commit + immutable log) — the upload-modal flows. (8) Reporting is a per-module deliverable (Reports tab). Naming: tenant_id everywhere, effective-dated versions surfaced as version badges (vN) with updated-at/updated-by columns.
