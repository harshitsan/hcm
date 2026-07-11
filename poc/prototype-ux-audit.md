# SatelliteHR POC — Live-App UX Audit (2026-07-11)

> Companion document: [`prototype-audit.md`](./prototype-audit.md) covers the code/feature audit (32 modules graded against the Kensium docs/BRDs/conventions) and carries the merged prioritized worklist.

## 1. How this was produced

A Playwright-driven heuristic review of the running app: 8 screen-group auditors covered every module screen across Platform Admin, Company Admin and Employee (User) roles, capturing 342 screenshots. Every finding is severity-tagged — **critical** (data-destructive or demo-breaking), **major** (blocks or seriously degrades a core task), **minor** (polish/consistency) — with a category and screenshot evidence. Screen groups: workforce-core, leave-attendance-assets, workflows-engine, organization, policies-comms, platform-admin-suite, recruitment-selfservice, global-nav-ia.

**Totals: 1 critical · 55 major · 76 minor (132 findings).** The one critical finding: /platform-admin Terminate executes instantly with no confirmation.

## 2. Cross-cutting UX gaps

- Dead row-clicks where a detail view is expected (6/8 groups). Rows open nothing on /directory, /leave admin Requests (click only re-sorts), /group-companies (footer literally says 'Select a construct to view…'), /portfolios, /jurisdictions, /departments, /positions, /org-groups, /policies, /policy-distribution (ack counts like '2 overdue · 1 failed' are dead ends), /audit-logs (rows promise 'prev/new value' but open nothing), and /self-service pending-task rows. Meanwhile /employees grid and /companies DO open detail sheets on row click — the app trains users to click rows and then punishes them everywhere else.
- Icon-only, unlabeled, silently-disabled toolbar actions gated on an invisible checkbox-selection pattern (6/8 groups): /org-groups (6 icons), /portfolios (3, pencil disabled with no hint), /jurisdictions (greyed history/pencil/trash), /policies (5 icons incl. Preview — the ONLY path to detail), /custom-fields (edit/delete with no '1 selected' feedback), /roles-security (version history behind an unlabeled clock icon explained only in a footnote), /assets admin (history/pencil icons), /recruitment (9 grey bulk actions with nothing selected), /self-service (10+ pencil buttons with empty accessible names).
- Internal engine/system jargon leaking to end users (8/8 groups): employee-facing leave toast 'Flow "Leave Approval — Standard" started — see Workflow Engine → Requests'; 'These screens render from tenant metadata' banner on /attendance; 'schema v3'/'tpl v3'/'Run SLA engine' on /feedback and /hr-letters; 'Reminded · 55%'/'At risk · 80%' SLA chips on /notifications and employee /policy-distribution; 'bitemporal'/'row-level security' on /custom-fields; 'Entity → dependency-tier classification' on /data-management; required IPv4/CIDR field on /locations; 'UDF'/'Phase II' on /self-service; P/PF/G/C badges with no legend and 'engine → scope → consume' copy on /workflows; 'Engine features for this module — 32 of 33 active' panel appended under /employees tabs; POC-meta dashboard hero ('USER STORIES IMPLEMENTED 1,174').
- Right-edge clipping/truncation at the default 1512px viewport (6/8 groups): Actions column clipped to 'Actio…' on /directory (admin and employee) and Stage 'Probati…' on /employees; Owner column and 'Group Leave Pol…' names on /policies; 'Pending approva…' badges on /announcements; SLA/status columns on /feedback; Submitted timestamps '26 Jun 2026, 14…' on /data-management; 'Platform Suppor…' on /roles-security despite free whitespace; 'Meridian Techno…' on /companies; Offers Actions buttons overflowing the card frame on /recruitment.
- Count/state mismatches with no pagination or 'showing X of Y' indicator (4 groups): 'Workflow catalog (203)' renders 16 rows and Folders renders all 203 cards in a ~20,000px scroll (/workflows); 'Total policies 16' vs 'Policy Documents (15)' (/policies); 'Job Requisitions (10)' shows 7 rows (/recruitment); /audit-logs date chip 'Jul 11 - Jul 11' over entries spanning Nov 2025–Jul 2026; 62-report catalog with no search (/reports).
- First-submit validation that misses or mis-flags fields (4 groups): 'Client Billing Code' error only surfaces after core fields pass, via a bottom-left toast (/leave employee); Document upload flags name/entity/type but not the File field (/documents); optional Work Mode/Cost Center flagged 'Invalid input' (/positions); duplicated inline+toast errors (/companies); 'Distribute now' enabled with 0 recipients and no policy (/policy-distribution).
- Placeholders that read as filled values, producing contradictory 'required' errors (3 groups): 'Asha Rao' in New Employee (/employees), 'Senior Backend Engineer' in New requisition (/recruitment), 'Q3 All-Hands on 10 July' in Announcements create (/announcements) — in each case the field visibly 'contains' text while erroring 'X is required'.
- Mega-pages stacking unrelated modules with no anchors/progressive disclosure (4 groups): My Profile ~4,000px with 12+ sections and no anchor nav (/employees employee view); Classic admin ~6,800px with 7+ sections (/workflows); /custom-fields ~3,300px stacking 7 blocks; /platform-admin Tenants tab stacking 7 blocks (~2,300px); Exits tab embedding a second full KT-tasks module (/lifecycle).
- Nav label / landing-tab mismatches (4 groups): sidebar 'Notifications' lands on a Tasks approval inbox (/notifications); /assets lands on Inventory while Requests (first tab, 8 pending) awaits action; /authentication lands on the middle 'Users & access' tab; sidebar 'Employee Lifecycle' opens 'Employees — Onboarding & Exit' with no breadcrumb anywhere in the app.
- Toast misuse for state that needs stronger treatment (4 groups): Terminate executes instantly with only a toast and no confirm (/platform-admin — the one critical finding); publish toast contradicts a persisting 'Draft' badge and survives two tab switches (/workflows Build); 'Apply leave' button's entire behavior is a toast excuse (/self-service); success/error toasts anchored bottom-left, far from the dialog that triggered them (/leave employee, /companies).

### Consistency matrix

ELEMENT → WHERE IT DIVERGES → REFERENCE PATTERN (already live in the app)

1. TABS: Three coexisting styles — segmented pills (/leave, /attendance, /workflows, /employees, /reports, /jurisdictions), underlined text-links (/lifecycle, /companies, /assets, /announcements, /directory, /platform-admin, /portfolios, /departments), plus /lifecycle Probation nesting a second pill row under text tabs and employee /policy-distribution dropping the tab bar entirely. REFERENCE: segmented pill tabs as on /leave and /employees — the majority pattern in the highest-traffic modules.

2. ROW → DETAIL: /employees grid and /companies open a detail sheet on row click; /directory, /leave Requests, /policies, /policy-distribution, /audit-logs, /group-companies, /portfolios, /jurisdictions, /departments, /positions, /org-groups do nothing on row click (policies requires checkbox + icon-only Preview instead). REFERENCE: the /employees row-click detail sheet (e.g. the onboarding sheet with stage chips + document checklist) applied to every list.

3. LIST TOOLBAR: /companies has search + jurisdiction/status filters + export; /group-companies and /portfolios have neither; /announcements requires explicit Search/Reset buttons while /employees, /leave, /directory filter instantly; /workflows hides search as top-right 'Find any setting…'. REFERENCE: the /employees / /directory instant-filter toolbar (search box + status filter chips + labeled actions), with /directory's 'Clear filters (1)' chip moved into the empty state.

4. ROW ACTIONS: /attendance Approvals shows labeled inline Approve/Reject with SLA countdown; /notifications shows 28+ Approve/Reject/Delegate buttons on every row at once; /positions alone uses a per-row kebab; /policies, /custom-fields, /org-groups gate actions behind checkbox-then-icon-toolbar; /recruitment shows 9 ungated grey bulk actions. REFERENCE: /attendance Approvals — labeled inline actions on the row, one primary per row.

5. CREATE BUTTON: verb alternates 'Create Company'/'Create Portfolio' vs 'New Group'/'New Jurisdiction'/'New Location'/'New Department'/'New Position'/'New Requisition'. REFERENCE: the already-consistent orange '+ New X' top-right (cited as a strength in global-nav-ia and organization) — rename the two 'Create *' outliers.

6. PAGINATION / RESULT COUNT: /departments and /positions show blank square buttons, /locations chevrons, /org-groups text 'Previous/Next'; /workflows governance (16 of 203), /recruitment (7 of 10) and Folders (20,000px scroll) show nothing. REFERENCE: none is complete today — standardize on org-groups' text 'Previous/Next' plus an explicit 'Showing X of Y' on every table and card list.

7. DESTRUCTIVE ACTIONS: /custom-fields and /documents deletes confirm with record name + consequences; /platform-admin Terminate and 'Revoke first membership' execute instantly with only a toast; workflows card '×' chip looks destructive and is unexplained. REFERENCE: the /custom-fields//documents named-consequence confirm dialog.

8. VALIDATION FEEDBACK: inline red errors under each field (/employees New Employee, /recruitment requisition, /announcements, all organization create dialogs) vs late bottom-left toasts (/leave Client Billing Code), inline+toast duplicates (/companies), missing errors (/documents File field), false errors (/positions 'Invalid input' on optional fields). REFERENCE: the New Employee dialog's per-field inline errors, all required fields flagged on first submit.

9. ROLE/CONTEXT HEADER: /companies says 'Acting as Platform Admin', /platform-admin says 'Viewing as Platform Admin', /portfolios shows a 'Meridian Technologies' company dropdown, most modules show nothing; 'Platform Admin' is simultaneously a role and a sidebar module. REFERENCE: the role switcher's 'Viewing role — tap to switch' label, rendered identically in every module header; rename the module to 'Platform Administration'.

10. EMPTY/NO-RESULT STATES: bare 'No data available' (/directory), 'No workflows match this filter.' and 'No matching configuration.' with no next action (/workflows). REFERENCE: none exists — adopt message + inline 'Clear search/filters' action, reusing directory's existing Clear-filters chip inside the empty row.

11. NAMING COLLISIONS: two 'Directory' surfaces (/employees Directory tab: 5 rows, 4 filters vs sidebar /directory: 16 people, 7 filters); two 'Groups' with identical 'New Group' buttons (/group-companies vs /org-groups). REFERENCE: single canonical /directory; rename /org-groups to 'Work Groups' or merge.

### Layman barriers (first-session walkthrough)

1. Minute 0 — default role is a dead end: the app opens as Platform Admin with 13 of 31 modules locked including Leave, Attendance, Recruitment and Documents; a layman hits 'Access restricted' on their first click and doesn't know the role switcher exists (global-nav-ia, ux-global-nav-ia-pa-leave.png).
2. Minute 0 — sidebar is opaque: all 5 nav groups collapsed on first load (only group names + Dashboard visible), and once expanded all 31 modules show for every role — an Employee scans past 19 greyed lock icons to find 12 usable items (ux-global-nav-ia-dashboard-platform-admin.png, ux-global-nav-ia-sidebar-full-employee-user-.png).
3. Minute 1 — the dashboard speaks to demo builders, not HR: hero copy 'user stories implemented as frontend capability with mock data', stat cards 'USER STORIES IMPLEMENTED 1,174' and 'BACKEND Mocked in-memory'; the Employee home has zero personal data (no leave balance, no tasks) — a layman cannot tell what this product does for them (ux-global-nav-ia-dashboard-company-admin.png).
4. Minutes 1–5 — naming collisions defeat orientation: two 'Directory' surfaces with different data (Employees tab: 5 rows/4 filters vs sidebar: 16 people/7 filters), two 'Groups' modules both with a 'New Group' button, 'Platform Admin' meaning both a role and a place, sidebar 'Employee Lifecycle' opening 'Employees — Onboarding & Exit', with no breadcrumbs anywhere to recover.
5. First real task fails — an employee's #1 action, applying leave from /self-service, is a toast excuse ('Leave application opens in the Leave module of this POC'); the pending-task red chips look like buttons but are static; the page's above-fold is a read-only profile form, so nothing on the daily landing page actually does anything (ux-recruitment-selfservice-selfservice-action.png).
6. Completing forms requires insider knowledge: leave submit hides the required 'Client Billing Code' until a second pass and reports it via a far-away bottom-left toast; asset requisitions demand a 'Cost Center Approval Ref'; New Location makes 'IPv4 address or CIDR range' mandatory; My Profile's required custom fields have no Save button at all — a layman literally cannot finish (ux-workforce-core-employees-user-profile-bottom.png).
7. Success messages are unreadable: after applying leave the confirmation reads 'Flow "Leave Approval — Standard" started — see Workflow Engine → Requests', pointing an employee at an admin surface; status chips like 'Reminded · 55%', 'LOP 2 days', 'schema v3', 'P/PF/G/C' badges carry no legend or tooltip anywhere.
8. Clicking rows teaches learned helplessness: after /employees rewards a row click with a rich detail sheet, the same click silently does nothing on /directory, /policies, /policy-distribution, /audit-logs, /leave Requests and all six organization tables — a layman concludes detail views don't exist (which also hides the only way to see who acknowledged a policy or what an audit entry changed).
9. Key actions hide behind an undocumented checkbox-then-icon ritual: previewing a policy, editing a portfolio, seeing role version history (unlabeled clock icon) all require selecting a row checkbox to un-grey unlabeled icons — no tooltip, no '1 selected' feedback, no disabled-state explanation ('Record Leave' faded with no hint that 'Record on behalf of…' must be chosen first).
10. Admin work loops dead-end for non-experts: a Leave admin has no Approve/Reject anywhere on the Requests tab (clicking a pending row just re-sorts); flagged attendance rows ('Missed punch') offer no inline fix — you must know to switch tabs and pick 'Correction'; recruitment funnel cards don't filter; the Terminate button fires instantly with no confirmation.
11. Endurance scrolling replaces navigation: My Profile is ~4,000px of 12+ unanchored sections, Classic admin ~6,800px, workflow Folders ~20,000px of 203 cards, /custom-fields ~3,300px — finding anything means blind scrolling, and tables that claim 203 or 10 items silently render 16 or 7.

## 3. UX-prioritized worklist

As produced by the UX synthesis (the feature-first merged ordering lives in `prototype-audit.md` §4).

1. [Leave — M] Give admins an approve/reject path: add an Approvals tab to /leave cloned from /attendance Approvals (inline Approve/Reject, SLA countdown, original-vs-requested) or make pending rows open an actionable detail sheet. The core leave feature loop currently dead-ends.
2. [Self-Service — S] Make /self-service functional: wire 'Apply leave' to the real Leave apply dialog (or deep-link to /leave) instead of a toast; make the 'My pending tasks' red chips navigate to their target screens.
3. [Self-Service — S] Reorder /self-service Overview: pending tasks, leave balances and quick actions above the fold; push the read-only profile form down.
4. [Employees/My Profile — M] Add a Save button + confirmation for the required 'Custom profile fields' (currently unsubmittable) and anchor/sub-tab navigation for the ~4,000px profile page.
5. [All list modules — L] Roll out the /employees//companies row-click detail sheet to /directory, /policies, /policy-distribution (ack drill-down), /audit-logs (prev/new values), /leave Requests, and the six organization tables — one shared sheet component, killing the checkbox+icon-Preview ritual.
6. [Attendance — S] Inline 'Raise correction' action on flagged rows ('Missed punch', 'Late arrival') instead of requiring the My Requests tab switch.
7. [Recruitment — M] Make pipeline funnel cards act as filters on the candidate table (and reconcile them with the duplicate chip row); gate the 9 grey bulk actions behind row selection with one primary 'New Requisition'; fix Offers Actions overflowing the card.
8. [Uniformity pass A: chrome — M] One tab style (segmented pills per /leave//employees) across /lifecycle, /assets, /companies, /announcements, /directory, /platform-admin; one create verb ('New X'); one pagination pattern with 'Showing X of Y' everywhere (fixes 16-of-203 on /workflows, 7-of-10 on /recruitment); one role-context header label.
9. [Uniformity pass B: toolbars — M] Standardize list toolbars on the instant-filter pattern (search + status filters + labeled actions): add search to /group-companies, /portfolios, /reports (62 reports unsearchable); drop /announcements' Search/Reset buttons; label every icon-only action with text/tooltip and show 'N selected' (org-groups 6 icons, portfolios 3, policies 5, custom-fields, roles-security clock, assets).
10. [Forms/validation — M] First-submit flags everything inline next to the field: leave 'Client Billing Code', documents File field, stop false 'Invalid input' on optional /positions fields, kill duplicate inline+toast on /companies, disable 'Distribute now' at 0 recipients, prefix placeholders with 'e.g.' ('Asha Rao', 'Senior Backend Engineer', 'Q3 All-Hands on 10 July').
11. [Copy/jargon — M] Plain-language rewrite, employee surfaces first: leave toast → 'Request submitted — pending with Rahul Menon'; remove 'tenant metadata' banner, 'UDF'/'Phase II', 'schema v3'/'tpl v3', SLA-% chips on employee policy inbox, 'template v2' in receipts; then admin: legend/tooltips for P/PF/G/C, retire 'engine/scope/consume/bound', CFG-xx codes, make /locations IP/CIDR optional, expand 'LOP'.
12. [Layout right-edge — M] Fix 1512px clipping across tables: /directory + /employees Actions/Stage, /policies Owner, /announcements status badges, /feedback SLA columns, /data-management timestamps, /roles-security names, /recruitment Offers — column-width audit on the shared table component.
13. [Platform Admin — S] Confirmation dialogs for Terminate and 'Revoke first membership', reusing the /custom-fields//documents named-consequence confirm (the audit's only critical finding).
14. [Navigation truthfulness — M] Land 'Notifications' on the Notifications tab (or rename the sidebar item), default /assets admin to Requests, /authentication to its first tab, align 'Employee Lifecycle' label with its page title, merge/rename the two 'Directory' surfaces and the two 'Groups', reflect detail sheets in the URL + add breadcrumbs.
15. [Employees — S] Move the 'Engine features for this module — 32 of 33 active' toggle panel off /employees (and its Platform-Admin variant) into the Admin/Workflows area.
16. [Mega-page splits — L] Break up Classic admin (~6,800px) into anchored sections, /custom-fields and /platform-admin Tenants tab into sub-tabs, split Exits from KT tasks on /lifecycle, and paginate the Folders 'All workflows' 20,000px scroll.
17. [Workflows — M] Fix 'Find any setting' relevance ('leave' must surface leave-named settings), reconcile publish state (clear Draft badge, align toast version, dismiss stale toasts on tab switch), make governance row-click match its 'scopes, versions & history' promise.
18. [Dashboard — L] Replace the POC-meta dashboards with role-relevant homes reusing existing widgets (pending approvals for admins; leave balance + tasks from /self-service for employees); expand sidebar groups by default.
19. [DEFERRED (RBAC) — L] Scope /employees for the Employee role (hide admin KPIs, delegation controls), fix the Platform-Admin default-role lockout of core HR modules, hide rather than grey the 19 locked sidebar items — parked per the RBAC-deferred directive, but note items 1–3 deliver most of the employee-experience value without touching RBAC.

## 4. Findings by module

Module order matches the code audit's score matrix. Each bullet: severity (category) screen: issue — evidence.

### employees

- **major** (layout-consistency) /employees (Employee (User)): Employee role sees the identical admin workspace: company-wide KPI cards ('Without user account 1'), full Directory grid, and Managers & Delegation with 'New delegation' and 'End & revert' controls — self-service is not distinct. — evidence: ux-workforce-core-employees-user-tab2-ManagersDelegation.png
- **major** (forms) /employees (Employee (User)): My Profile 'Custom profile fields' form has required fields (Badge ID, Emergency Contact Phone, Bus Facility) but the page ends with no visible Save/Submit button or feedback path. — evidence: ux-workforce-core-employees-user-profile-bottom.png
- **major** (visual-hierarchy) /employees (Employee (User)): My Profile is one ~4000px scroll mixing 12+ sections (statutory, dependants, education, skills, client feedback, custom fields) with no anchor nav or sub-tabs; finding a section requires blind scrolling. — evidence: ux-workforce-core-employees-user-landing.png
- **major** (navigation) /employees + /directory (Company Admin): Two different 'Directory' surfaces: Employees page has a Directory tab (5 rows, 4 filters) while sidebar 'Directory & Org Chart' shows 16 people with 7 filters — no cue which is canonical. — evidence: ux-workforce-core-employees-admin-landing.png vs ux-workforce-core-directory-admin-landing.png
- **major** (copy-jargon) /employees (Company Admin): 'Engine features for this module — 32 of 33 active' panel with toggle rows (Client Master, Deductions, 'Setting v1', 'governed workflows… consumed here') is appended under every tab, burying employee data in platform jargon. — evidence: ux-workforce-core-employees-admin-landing.png
- **major** (visual-hierarchy) /employees (Platform Admin): Below the employee directory table sits an unrelated 'Engine features for this module — 32 of 33 active' admin section with dozens of workflow toggles (Client Master, Deductions…), doubling page length and confusing the screen's purpose. — evidence: ux-global-nav-ia-pa-employees.png
- **minor** (forms) /employees (Company Admin): New Employee dialog uses realistic names as placeholders ('Asha Rao'); on empty submit the field visibly contains a name yet errors 'Employee name is required' — placeholder reads as a filled value. — evidence: ux-workforce-core-employees-admin-create-validation.png
- **minor** (layout-consistency) /announcements vs /employees (Company Admin): Filter models differ: Announcements needs explicit Search/Reset buttons; Employees, Leave and Directory filters apply instantly; Workflows hides search top-right as 'Find any setting…'. — evidence: ux-global-nav-ia-ca-announcements.png
- **minor** (navigation) /employees detail sheet (Platform Admin): Row click opens a detail sheet but URL stays /employees — no deep link, and browser Back exits the list instead of closing the sheet. — evidence: ux-global-nav-ia-pa-employees-row-click.png; URL observed unchanged
- **minor** (navigation) /employees/lifecycle (Platform Admin): Sidebar item 'Employee Lifecycle' lands on page titled 'Employees — Onboarding & Exit'; no breadcrumb anywhere in the app to confirm location or path back. — evidence: ux-global-nav-ia-pa-employees-lifecycle.png

### workflows

- **major** (copy-jargon) /workflows Configure (Platform Admin): Header explainer 'Authored once in the engine → enabled per scope level by each admin → consumed by the target module' is dense engineer-speak; a layman cannot parse engine/scope/consume. — evidence: ux-workflows-engine-pa-landing.png
- **major** (discoverability) /workflows Configure Governance table (Platform Admin): Header says 'Workflow catalog (203)' but only 16 rows render, with no pagination, load-more, or 'showing X of Y' — remaining 187 reachable only via search/filters. — evidence: row count via interaction; ux-workflows-engine-pa-governance-bottom.png
- **major** (copy-jargon) /workflows Configure Governance table (Platform Admin): 'Effective scopes' column is bare letter badges P / PF / G / C with no legend; hovering shows no tooltip — meaning is undiscoverable. — evidence: ux-workflows-engine-pa-scope-tooltip.png (hover produced nothing)
- **major** (navigation) /workflows Configure Governance table (Platform Admin): Stepper promises Configure = 'scopes, versions & history', but clicking a row opens a full-screen canvas editor ('Save v4') showing a 'Draft' badge for a workflow the table lists as v3 active. — evidence: ux-workflows-engine-pa-governance-rowclick.png
- **major** (layout-consistency) /workflows Configure Browse — Folders (Platform Admin): 'Folders' rail is just the module list again plus 'Ungrouped', duplicating 'By module'; default 'All workflows' renders all 203 cards in one ~20,000px scroll with no pagination. — evidence: ux-workflows-engine-pa-configure-folders.png, ux-workflows-engine-pa-folders-viewport.png
- **major** (discoverability) /workflows Find any setting (Platform Admin): Searching 'leave' returns Email Templates, Employee Classification and Notification Templates as top results — nothing leave-named visible; relevance ranking undermines the flagship search. — evidence: ux-workflows-engine-pa-findsetting-leave.png
- **major** (feedback) /workflows Build (Platform Admin): After 'Publish to catalog', toast says 'created — v1' but header still shows 'Draft' badge and button flips to 'Publish v2' — three conflicting state signals about whether the flow is live. — evidence: ux-workflows-engine-pa-build-publish.png
- **major** (copy-jargon) /workflows Build (Platform Admin): Node inspector dumps developer payload ('input.request.type OBJECT/STRING', 'PAYLOAD (trigger sample)') at HR admins; unlabeled 'Extended' toggle and icon-only toolbar give no clue what they do. — evidence: ux-workflows-engine-pa-build-node-selected.png
- **major** (copy-jargon) /workflows Requests — New Request (Company Admin): Dialog subtitle 'The engine evaluates the routing decision table in priority order and binds the request to the definition version effective today' plus 'matches rule rt-03 (priority 3)' is engineer-speak for a layman starting a leave request. — evidence: ux-workflows-engine-ca-new-request.png
- **major** (layout-consistency) /workflows Classic admin (Platform Admin): Single ~6,800px page stacks 7+ unrelated sections (config hub, localization tables, integrations, alert rules, definitions, routing rules, tenant settings, audit log) with no section nav or anchors. — evidence: ux-workflows-engine-pa-classic-landing.png (fullPage)
- **major** (copy-jargon) /workflows (Platform Admin): 'One engine — every configuration screen', 'Authored once in the engine → enabled per scope level → consumed by the target module' — unexplained jargon, plus three stacked tab rows (Configure/Build/Classic admin → Browse/Governance table → By module/By type/Folders). — evidence: ux-global-nav-ia-pa-workflows.png
- **minor** (copy-jargon) /workflows Classic admin (Platform Admin): 'Configuration hub' heading appears twice back-to-back, and internal spec codes '(CFG-01)', '(CFG-02)', '(CFG-08)' leak into user-facing copy. — evidence: ux-workflows-engine-pa-classic-top.png
- **minor** (forms) /workflows Classic admin (Platform Admin): 'Filter areas…' filters only the areas grid; Localization, Integrations and other tables below stay untouched, so filter scope is misleading. — evidence: ux-workflows-engine-pa-classic-filter-leave.png
- **minor** (visual-hierarchy) /workflows Configure Browse (Platform Admin): Every card repeats four controls (Active toggle, module dropdown, Attach…, Export) plus an unlabeled overflow icon; toolbar Export and per-row Export compete, and no single primary action stands out. — evidence: ux-workflows-engine-pa-landing.png
- **minor** (copy-jargon) /workflows Configure Browse (Platform Admin): KPI labels 'Active at your scope' and 'Workflow kinds in use' use unexplained terms (scope, kinds); each card carries a cryptic 'Companies ↗ ×' chip whose × looks destructive but is unexplained. — evidence: ux-workflows-engine-pa-landing.png
- **minor** (feedback) /workflows Configure Browse (Platform Admin): Import button silently opens the native file picker (verified filechooser event, zero on-screen dialog) — no explanation of expected file format or what will happen. — evidence: ux-workflows-engine-pa-import-check.png + filechooser interaction
- **minor** (empty-states) /workflows Configure Browse (Platform Admin): No-match search shows bare 'No workflows match this filter.' with no clear-search action; 'Find any setting' empty state 'No matching configuration.' likewise offers nothing to do next. — evidence: ux-workflows-engine-pa-browse-search-noresults.png, ux-workflows-engine-pa-findsetting-noresults.png
- **minor** (visual-hierarchy) /workflows Requests (Company Admin): Demo simulation control 'Advance SLA clock +25%' sits beside 'New Request' with near-equal prominence; one click mutated SLA data (7 reminders, 4 escalations) with no undo. — evidence: ux-workflows-engine-ca-sla-advanced.png
- **minor** (copy-jargon) /workflows Requests (Company Admin): Column header 'Definition (bound)' and request detail 'Bound definition… stays on this version through completion' use binding jargon; request titles truncate to 'Annual leave — …' at default width. — evidence: ux-workflows-engine-ca-requests.png, ux-workflows-engine-ca-request-detail.png
- **minor** (feedback) /workflows Build (Platform Admin): Publish toast persisted across two subsequent tab switches (still visible on Classic admin screens), so stale success messages float over unrelated content. — evidence: ux-workflows-engine-pa-classic-top.png (publish toast visible on Classic tab)

### lifecycle  <sub>(Workforce)</sub>

- **major** (visual-hierarchy) /lifecycle (Company Admin): Exits tab stacks three header actions (Enable Exit, Terminate, red Record Exit) plus a second full module (KT tasks with its own 5 filters, Search/Reset/Refresh, Add New KT Task, Exit KT Task) on one screen. — evidence: ux-workforce-core-lifecycle-admin-tab3-Exits.png
- **minor** (layout-consistency) /lifecycle (Company Admin): Lifecycle uses underlined text tabs while Employees and Directory use pill tabs; Probation adds a second pill-tab row beneath the text tabs — three tab styles across sibling screens. — evidence: ux-workforce-core-lifecycle-admin-tab1-Probation.png
- **minor** (layout-consistency) /lifecycle (Company Admin): Reassignment tab abandons the list pattern entirely: it is a single-employee editor driven by an 'Exiting employee' dropdown, with no table or count like every other lifecycle tab. — evidence: ux-workforce-core-lifecycle-admin-tab4-Reassignment.png

### self-service  <sub>(Workforce)</sub>

- **major** (visual-hierarchy) /self-service (Employee (User)): Above the fold is entirely a read-only profile form; pending tasks, leave balances and Apply leave all sit below the fold on the daily landing page. — evidence: ux-recruitment-selfservice-selfservice-abovefold.png
- **major** (feedback) /self-service (Employee (User)): 'Apply leave' button does not apply or navigate — it only shows a toast 'Leave application opens in the Leave module of this POC', a dead end. — evidence: ux-recruitment-selfservice-selfservice-action.png
- **major** (discoverability) /self-service (Employee (User)): 'My pending tasks' red chips (Acknowledge settlement, Submit for approval…) look like buttons but are static badges; clicking a task row does nothing. — evidence: ux-recruitment-selfservice-selfservice-task-click.png
- **minor** (copy-jargon) /self-service (Employee (User)): Employee-facing jargon: 'UDF' badges, '2 fields outside your authorized scope are not shown', and banner about 'Phase I / deferred to Phase II' — internal project language. — evidence: ux-recruitment-selfservice-selfservice-abovefold.png
- **minor** (layout-consistency) /self-service Requests (Employee (User)): Travel/Learning/Assets tables reserve large fixed-height blank areas below the last row, leaving big dead white space mid-page. — evidence: ux-recruitment-selfservice-selfservice-requests.png
- **minor** (accessibility) /self-service (Employee (User)): Profile edit controls are icon-only pencil buttons with no accessible name (about 10 buttons expose empty labels to assistive tech). — evidence: getByRole('button').allInnerTexts() returned 10+ empty strings on /self-service

### recruitment  <sub>(Workforce)</sub>

- **major** (visual-hierarchy) /recruitment (Company Admin): Job Requests toolbar shows 9 grey bulk actions (History, Submit for approval, Approve, Reject, Assign, Withdraw, Resubmit, Delete, pencil) at once with no selection; unclear which apply. — evidence: ux-recruitment-selfservice-recruitment-landing.png
- **major** (navigation) /recruitment (Company Admin): Hiring Pipeline funnel cards (Applied 1, Screening 1…) are display-only; clicking a stage does not filter the candidate table — the chip row below duplicates them with different buckets (In-Review 4). — evidence: ux-recruitment-selfservice-recruitment-funnel-click.png
- **major** (navigation) /leave, /attendance, /recruitment, /documents (Platform Admin): Default role (Platform Admin) has 13 of 31 sidebar modules locked, including all core HR (Leave, Attendance, Recruitment). First-time user hits 'Access restricted' unless they discover the role switcher. — evidence: ux-global-nav-ia-pa-leave.png
- **minor** (layout-consistency) /recruitment (Company Admin): Offers table Actions column overflows the card boundary into the page gutter; buttons (Accept, Convert to employee) render outside the table frame. — evidence: ux-recruitment-selfservice-recruitment-offers.png
- **minor** (forms) /recruitment (Company Admin): New requisition dialog: Position title placeholder reads like a real value ('Senior Backend Engineer', no 'e.g.'), yet field shows 'Position title is required' — looks filled but errored. — evidence: ux-recruitment-selfservice-recruitment-new-req-validation.png
- **minor** (copy-jargon) /recruitment (Company Admin): Mixed status vocabulary and casing on one screen: 'needs-clarification' lowercase-hyphenated chip next to 'Pending Approval', 'Non-budgeted'; Offers filter chips named after actions ('Cancel Offer (2)'). — evidence: ux-recruitment-selfservice-recruitment-landing.png
- **minor** (layout-consistency) /recruitment (Company Admin): Header reads 'Job Requisitions (10)' but only 7 rows render with no visible scroll affordance or pagination cue. — evidence: ux-recruitment-selfservice-recruitment-landing.png
- **minor** (navigation) /recruitment (Company Admin): First tab for an admin is 'Candidate Portal' simulating being 'signed in as Kiran Rao' — persona switch inside an admin screen is disorienting in a demo without the explainer line. — evidence: ux-recruitment-selfservice-recruitment-candidate-portal.png

### leave  <sub>(Workforce)</sub>

- **major** (feedback) /leave (Company Admin): Requests tab has no Approve/Reject actions and rows are not clickable to a detail — clicking a pending row only re-sorted the table. Approval loop cannot be completed here. — evidence: ux-leave-attendance-assets-leave-admin-detail.png (same table, reordered, no detail sheet)
- **major** (copy-jargon) /leave (Employee (User)): Success toast after submitting leave reads 'Flow "Leave Approval — Standard" started — see Workflow Engine → Requests' — engine jargon pointing employees to an admin surface. — evidence: ux-leave-attendance-assets-leave-emp-request-detail.png
- **major** (forms) /leave (Employee (User)): Required 'Client Billing Code' not flagged on first empty submit; error surfaces only after core fields pass, via a toast at bottom-left far from the dialog. — evidence: ux-leave-attendance-assets-leave-emp-after-submit.png vs -apply-empty-submit.png
- **major** (navigation) /leave, /attendance, /recruitment, /documents (Platform Admin): Default role (Platform Admin) has 13 of 31 sidebar modules locked, including all core HR (Leave, Attendance, Recruitment). First-time user hits 'Access restricted' unless they discover the role switcher. — evidence: ux-global-nav-ia-pa-leave.png
- **major** (visual-hierarchy) /leave (Company Admin): Toolbar shows 4 competing actions (Assign Time Off, Override…, Record on behalf of…, Record Leave); the primary-styled 'Record Leave' is disabled with no explanation why. — evidence: ux-global-nav-ia-pa-leave-restricted.png
- **minor** (copy-jargon) /leave (Employee (User)): Summary card 'Available (all paid types) 110' sums day-based and hour-based balances (88 hours + days) into one meaningless number. — evidence: ux-leave-attendance-assets-leave-emp-landing.png
- **minor** (feedback) /leave (Company Admin): 'Record Leave' button rendered faded/disabled with no tooltip explaining that 'Record on behalf of…' must be chosen first. — evidence: ux-leave-attendance-assets-leave-admin-landing.png
- **minor** (copy-jargon) /leave (Employee (User)): Grammar: request amounts read '1 days' in My Requests table. — evidence: ux-leave-attendance-assets-leave-emp-landing.png
- **minor** (copy-jargon) /leave Employee Summary (Company Admin): Unexplained abbreviations in headers and badges: 'Pending LOP', 'Approved LOP', 'LOP 2 days', 'Escalated (SLA breach)', 'Ananya Sharma (L1)'. — evidence: ux-global-nav-ia-ca-leave-tab2.png

### attendance  <sub>(Workforce)</sub>

- **major** (discoverability) /attendance (Employee (User)): Flagged rows ('Missed punch', 'Late arrival') offer no inline fix action; user must know to switch to My Requests tab and pick 'Correction'. No check-in/punch action anywhere. — evidence: ux-leave-attendance-assets-attendance-emp-landing.png
- **major** (navigation) /leave, /attendance, /recruitment, /documents (Platform Admin): Default role (Platform Admin) has 13 of 31 sidebar modules locked, including all core HR (Leave, Attendance, Recruitment). First-time user hits 'Access restricted' unless they discover the role switcher. — evidence: ux-global-nav-ia-pa-leave.png
- **minor** (copy-jargon) /attendance (Employee (User)): Developer-facing banner visible to employees: 'These screens render from tenant metadata: fields, validations, labels…'. — evidence: ux-leave-attendance-assets-attendance-emp-landing.png
- **minor** (copy-jargon) /attendance (Company Admin): Breaks column shows cryptic values like '3 · 70m' (70 minutes not normalized, count·duration format unexplained); 'Override…' button also unexplained. — evidence: ux-leave-attendance-assets-attendance-admin-landing.png

### assets  <sub>(Workforce)</sub>

- **minor** (navigation) /assets (Company Admin): Module lands on Inventory although Requests is the first tab and 8 requisitions (several pending) await action. — evidence: ux-leave-attendance-assets-assets-admin-landing.png
- **minor** (layout-consistency) /assets (Company Admin & Employee): Assets uses plain text-link tabs while Leave and Attendance use pill/segmented tabs — sibling modules look like different apps. — evidence: ux-leave-attendance-assets-assets-admin-landing.png vs -leave-admin-landing.png
- **minor** (visual-hierarchy) /assets (Company Admin): Two unlabeled icon-only buttons (history, pencil) sit beside the Transaction dropdown with no text or visible tooltip. — evidence: ux-leave-attendance-assets-assets-admin-landing.png
- **minor** (discoverability) /assets (Employee (User)): 'New Requisition' button exists only on the Requests tab; the My Assets landing tab offers no way to request an asset. — evidence: ux-leave-attendance-assets-assets-emp-landing.png vs -assets-emp-requests-tab.png
- **minor** (copy-jargon) /assets (Employee (User)): Requisition requires 'Cost Center Approval Ref'; receipt dialog cites 'template v2 (effective 2026-04-01)' — internal terminology exposed to employees. — evidence: ux-leave-attendance-assets-assets-emp-req-dialog.png, -assets-emp-ack-dialog.png

### companies  <sub>(Organization)</sub>

- **major** (layout-consistency) /companies (Platform Admin): Companies is the only screen with a search box, export button and jurisdiction/status filters; Group Companies and Portfolios have no search or filters at all — toolbar pattern differs on every sibling screen. — evidence: ux-organization-companies.png vs ux-organization-group-companies.png, ux-organization-portfolios.png
- **minor** (layout-consistency) /companies (Platform Admin): Create-button labels alternate between 'Create Company'/'Create Portfolio' and 'New Group'/'New Jurisdiction'/'New Location'/'New Department'/'New Position' — verb inconsistent across the 8 screens. — evidence: landing screenshots of all 8 routes
- **minor** (visual-hierarchy) /companies (Platform Admin): Legal name column truncates aggressively ('Meridian Techno…') even with free horizontal space; same on Group Companies ('Harbor–Northwin…') with no tooltip. — evidence: ux-organization-companies.png, ux-organization-group-companies.png
- **minor** (feedback) /companies (Platform Admin): Empty submit fires two messages at once: inline field error plus a bottom-left toast about drafts ('A legal name (3-100 characters) is required to save a draft') — duplicated, slightly contradictory feedback. — evidence: ux-organization-companies-create-submit-empty.png
- **minor** (layout-consistency) /companies vs /platform-admin (Platform Admin): Role context label inconsistent: Companies header says 'Acting as Platform Admin', Platform Administration says 'Viewing as Platform Admin', most other modules show nothing. — evidence: ux-global-nav-ia-pa-companies.png

### group-companies  <sub>(Organization)</sub>

- **major** (feedback) /group-companies (Platform Admin): Footer says 'Select a construct to view its effective-dated membership' but clicking a row or the group code opens nothing — no detail view, no feedback. — evidence: ux-organization-group-companies-row.png, ux-organization-group-companies-code-click.png
- **minor** (copy-jargon) /group-companies (Platform Admin): Footer copy 'effective-dated membership, history and as-of queries' and dialog note 'GroupCode is auto-generated as GROUP-YYYY-NNN on save' are database jargon for an admin audience. — evidence: ux-organization-group-companies.png, ux-organization-group-companies-create.png

### portfolios  <sub>(Organization)</sub>

- **major** (layout-consistency) /portfolios (Platform Admin): Clicking a portfolio row or its code does nothing; Companies opens a detail sheet on row click. Same divergence on jurisdictions, departments, positions, org-groups. — evidence: ux-organization-portfolios-row.png, ux-organization-portfolios-code-click.png
- **major** (discoverability) /portfolios (Platform Admin): Three unlabeled icon-only toolbar buttons (code brackets, eye, pencil); pencil stays disabled with no hint that a row checkbox must be selected first. — evidence: ux-organization-portfolios.png
- **minor** (layout-consistency) /portfolios (Platform Admin): Header shows a company-context dropdown 'Meridian Technologies' top-right; sibling Platform Admin screens show 'Acting as Platform Admin' text instead — context indicator differs. — evidence: ux-organization-portfolios.png vs ux-organization-companies.png

### jurisdictions  <sub>(Organization)</sub>

- **minor** (layout-consistency) /jurisdictions (Platform Admin): Uses pill/segmented tabs ('What applies to me', 'Regions'...) while Companies, Portfolios, Departments use plain underlined text tabs. — evidence: ux-organization-jurisdictions.png
- **minor** (discoverability) /jurisdictions (Platform Admin): History/pencil/trash icon buttons sit greyed-out with no labels; 'Referenced by' column header is rendered grey like a disabled control. — evidence: ux-organization-jurisdictions.png
- **minor** (copy-jargon) /jurisdictions (Platform Admin): Dialog helper text 'Catalog entries are flat — no parent country/state chain is required' and 'Saving an edit records a new effective-dated version' unexplained for laymen. — evidence: ux-organization-jurisdictions-create.png

### locations  <sub>(Organization)</sub>

- **major** (copy-jargon) /locations (Company Admin): New Location makes 'IP address / range' mandatory; empty-submit error 'Enter an IPv4 address or CIDR range (e.g. 10.10.1.0/24)' is networking jargon HR admins won't understand. — evidence: ux-organization-locations-create2-submit-empty.png

### departments  <sub>(Organization)</sub>

- **minor** (layout-consistency) /departments (Company Admin): Pagination differs per screen: departments/positions show blank square buttons with no icons, locations shows chevrons, org-groups uses text 'Previous/Next' buttons. — evidence: ux-organization-departments.png, ux-organization-positions.png, ux-organization-org-groups.png

### positions  <sub>(Organization)</sub>

- **major** (forms) /positions (Company Admin): Empty submit shows 'Invalid input' under Work Mode and Cost Center although both are custom fields never marked required; error copy explains nothing. — evidence: ux-organization-positions-create-submit-empty.png
- **minor** (layout-consistency) /positions (Company Admin): Only Positions table has a 'Task' column with per-row kebab (…) menu; no other table offers row actions this way. — evidence: ux-organization-positions.png

### org-groups  <sub>(Organization)</sub>

- **major** (navigation) /org-groups (Company Admin): Persistent bottom bar 'Organization setup — step 3 of 5: Group → Work Area → Role' with Save & Next sits under a plain CRUD table; unclear what saving does or how to exit the wizard. — evidence: ux-organization-org-groups.png
- **major** (discoverability) /org-groups (Company Admin): Toolbar has 6 icon-only buttons (refresh, download, copy, power, split, trash) with no labels or visible tooltips; bulk actions undiscoverable. — evidence: ux-organization-org-groups.png
- **major** (copy-jargon) /org-groups (Company Admin): Page is titled 'Groups' and its button 'New Group' — identical to Group Companies' 'New Group' button; two different 'group' concepts collide with no explanation. — evidence: ux-organization-org-groups.png vs ux-organization-group-companies.png

### directory  <sub>(Organization)</sub>

- **major** (layout-consistency) /directory (Company Admin): Clicking a directory row opens nothing (0 dialogs), unlike the Employees grid where row click opens a detail sheet; person detail is only reachable via the clipped Actions column or org-chart nodes. — evidence: row-click interaction observed; ux-workforce-core-directory-admin-detail.png
- **major** (navigation) /employees + /directory (Company Admin): Two different 'Directory' surfaces: Employees page has a Directory tab (5 rows, 4 filters) while sidebar 'Directory & Org Chart' shows 16 people with 7 filters — no cue which is canonical. — evidence: ux-workforce-core-employees-admin-landing.png vs ux-workforce-core-directory-admin-landing.png
- **minor** (layout-consistency) /directory (Company Admin): Actions column is clipped at the right viewport edge ('Actio…', cut icons) at 1512px with no horizontal-scroll affordance; same clipping hits the Stage badge ('Probati…') on the Employees grid. — evidence: ux-workforce-core-directory-admin-landing.png; ux-workforce-core-employees-admin-landing.png
- **minor** (empty-states) /directory (Company Admin): No-results search renders a bare 'No data available' row in the table; no suggestion or inline clear-search action (the small 'Clear filters (1)' chip sits up beside the search box). — evidence: ux-workforce-core-directory-admin-search-noresults.png
- **minor** (layout-consistency) /directory (Employee (User)): 7 filter dropdowns plus full-width search always visible for a 16-person directory; Actions column clipped at right viewport edge (header truncated to 'Actio…'). — evidence: ux-global-nav-ia-emp-directory.png

### policies  <sub>(Policies & Comms)</sub>

- **major** (discoverability) /policies (Company Admin): Clicking a policy row does nothing; viewing details requires selecting a checkbox then an icon-only Preview button in the toolbar. — evidence: ux-policies-comms-policies-detail.png (identical to landing after row click)
- **minor** (visual-hierarchy) /policies (Company Admin): Five toolbar actions (Refresh, Preview, Version history, New version, Retire) are unlabeled icons; most render disabled with no explanation until a row is selected. — evidence: ux-policies-comms-policies-landing.png
- **minor** (layout-consistency) /policies (Company Admin): Table truncates policy names ('Group Leave Pol…') and cuts off the Owner column at 1512px; horizontal scroll needed. — evidence: ux-policies-comms-policies-landing.png
- **minor** (copy-jargon) /policies (Company Admin): Summary card says 'Total policies 16' but list header says 'Policy Documents (15)' — mismatched counts invite doubt during a demo. — evidence: ux-policies-comms-policies-landing.png
- **minor** (forms) /policies (Company Admin): Add-policy wizard step labels ('Effective dating & document', 'Review & save') are tiny, low-contrast, and non-clickable-looking; hard to see progress across 5 steps. — evidence: ux-policies-comms-policies-create.png

### policy-distribution  <sub>(Policies & Comms)</sub>

- **major** (discoverability) /policy-distribution (Company Admin): Clicking a distribution row does nothing — no detail view of who acknowledged/failed; acknowledgment counts ('2 overdue · 1 failed') are dead-ends with no drill-down. — evidence: ux-policies-comms-policy-distribution-admin-detail.png (identical to landing after row click)
- **minor** (copy-jargon) /policy-distribution (Company Admin): Summary cards mix units: 'Distributions 7' counts campaigns while 'Acknowledged 7 / Pending 8 / Overdue 2' count people — no labels clarify this. — evidence: ux-policies-comms-policy-distribution-admin.png
- **minor** (feedback) /policy-distribution (Company Admin): New distribution dialog allows 'Distribute now' while recipient preview shows '0 recipients' and no policy selected — button not disabled against an empty audience. — evidence: ux-policies-comms-policy-distribution-admin-create.png
- **minor** (copy-jargon) /policy-distribution (Employee (User)): Employee inbox items show admin-facing chips 'Reminders at 50%, 75% SLA' and 'Checklist task open' with no explanation of what the employee must do about them. — evidence: ux-policies-comms-policy-distribution-employee.png
- **minor** (navigation) /policy-distribution (Employee (User)): Employee view drops the admin tab bar entirely (only 'My Policy Inbox' text remains), so the same route renders two very different layouts with no tab affordance. — evidence: ux-policies-comms-policy-distribution-employee.png

### announcements  <sub>(Policies & Comms)</sub>

- **major** (forms) /announcements create dialog (Company Admin): Title placeholder 'Q3 All-Hands on 10 July' looks like a prefilled value; after empty submit the field still shows that text while error says 'Title is required' — contradictory. — evidence: ux-global-nav-ia-ca-announcement-empty-submit.png
- **minor** (layout-consistency) /announcements (Company Admin): Status column badges clipped ('Pending approva…') and title column truncates heavily while Event based column is an empty dash for all 20 rows. — evidence: ux-policies-comms-announcements-landing.png
- **minor** (visual-hierarchy) /announcements (Company Admin): Create dialog offers 4 footer actions (Cancel, Save draft, Submit for approval, Publish) with equal-looking weight; unclear which path a new admin should take. — evidence: ux-policies-comms-announcements-create.png
- **minor** (layout-consistency) /announcements vs /employees (Company Admin): Filter models differ: Announcements needs explicit Search/Reset buttons; Employees, Leave and Directory filters apply instantly; Workflows hides search top-right as 'Find any setting…'. — evidence: ux-global-nav-ia-ca-announcements.png

### notifications  <sub>(Policies & Comms)</sub>

- **major** (navigation) /notifications (Company Admin): Sidebar link says 'Notifications' but the page is 'Tasks, Notifications & Messages' and lands on the Tasks tab — notifications are a secondary tab, not the landing content. — evidence: ux-policies-comms-notifications-landing.png
- **minor** (copy-jargon) /notifications (Company Admin): Approval inbox uses unexplained jargon chips: 'Parallel — any one', 'Reminded · 55%', 'At risk · 80%', 'Escalates · 2 levels' — a layman cannot decode SLA percentages. — evidence: ux-policies-comms-notifications-landing.png
- **minor** (visual-hierarchy) /notifications (Company Admin): Every row shows Approve/Reject/Delegate plus a bell icon simultaneously (28+ buttons on screen); no single primary action and heavy visual load. — evidence: ux-policies-comms-notifications-landing.png

### hr-letters  <sub>(Policies & Comms)</sub>

- **minor** (forms) /hr-letters (Company Admin): Generate dialog employee list is a plain scroll of checkboxes with no search/filter — fine for 10 demo employees, painful at real scale. — evidence: ux-policies-comms-hr-letters-create.png
- **minor** (copy-jargon) /hr-letters (Company Admin): Version chips like 'v1 · tpl v3' and delivery values 'auto · Hire', 'batch · Hire' are unexplained shorthand in the documents table. — evidence: ux-policies-comms-hr-letters-landing.png

### feedback  <sub>(Policies & Comms)</sub>

- **minor** (copy-jargon) /feedback (Company Admin): Every worklist entry shows 'schema v3'/'schema v2' under its reference number, and toolbar has a 'Run SLA engine' button — internal system language exposed to reviewers. — evidence: ux-policies-comms-feedback-landing.png
- **minor** (layout-consistency) /feedback (Company Admin): Review Queue table clips its rightmost SLA/status columns at 1512px; 'Breaching SLA 5' card exists but breach info per row is cut off. — evidence: ux-policies-comms-feedback-landing.png

### custom-fields  <sub>(Platform)</sub>

- **major** (visual-hierarchy) /custom-fields (Platform Admin): Landing stacks summary cards, engine features, fields table, version history, value history, portfolio oversight and storage tables into one ~3300px page with no progressive disclosure. — evidence: ux-platform-admin-suite-custom-fields-landing.png
- **major** (copy-jargon) /custom-fields (Platform Admin): Unexplained jargon throughout: 'bitemporal — corrections never destroy earlier versions', 'governed config — no code deployment', 'Tenant-scoped storage & row-level security', permission codes 'HR V/E', 'RM V'. — evidence: ux-platform-admin-suite-custom-fields-landing.png
- **minor** (discoverability) /custom-fields (Platform Admin): Toolbar edit/delete are unlabeled icon-only buttons; selecting a row gives no '1 selected' feedback, so their dependence on selection is invisible. — evidence: ux-platform-admin-suite-custom-fields-row-selected.png

### data-management  <sub>(Platform)</sub>

- **major** (copy-jargon) /data-management (Platform Admin): Admin tab leads with 'Entity → dependency-tier classification' and 'Foundation → Organizational → Workforce → Transactional' sequencing copy a layman admin cannot parse. — evidence: ux-platform-admin-suite-data-management-admin.png
- **minor** (layout-consistency) /data-management (Platform Admin): Jobs table clips at the right edge — Submitted timestamps cut off ('26 Jun 2026, 14…') at the default 1512px viewport. — evidence: ux-platform-admin-suite-data-management-landing.png

### documents  <sub>(Platform)</sub>

- **major** (forms) /documents (Company Admin): Empty upload submit flags Document name, Company entity and Document type, but the File field — the primary requirement — shows no error. — evidence: ux-platform-admin-suite-documents-upload-empty-submit.png
- **major** (navigation) /leave, /attendance, /recruitment, /documents (Platform Admin): Default role (Platform Admin) has 13 of 31 sidebar modules locked, including all core HR (Leave, Attendance, Recruitment). First-time user hits 'Access restricted' unless they discover the role switcher. — evidence: ux-global-nav-ia-pa-leave.png
- **minor** (copy-jargon) /documents (Company Admin): Upload dialog asks for both 'Category' and 'Document type (Organization module)' — overlapping concepts with an unexplained module reference. — evidence: ux-platform-admin-suite-documents-upload-dialog.png

### reports  <sub>(Platform)</sub>

- **major** (discoverability) /reports (Platform Admin): All Reports catalog lists 62 reports in one long scroll grouped by category with no search or filter box to find a report by name. — evidence: ux-platform-admin-suite-reports-run-result.png
- **minor** (feedback) /reports (Platform Admin): Drill down opens a plain text list modal with no export/copy action and only a close button — a dead end compared to report modals. — evidence: ux-platform-admin-suite-reports-drilldown.png

### roles-security  <sub>(Platform)</sub>

- **minor** (discoverability) /roles-security (Platform Admin): Version history is only reachable via an unlabeled clock icon, explained solely in small footnote text ('inspect history via the clock action'). — evidence: ux-platform-admin-suite-roles-security-landing.png
- **minor** (layout-consistency) /roles-security (Platform Admin): Role and Scope names truncate ('Platform Suppor…', 'Company · Auror…') despite ample whitespace to the right of the table. — evidence: ux-platform-admin-suite-roles-security-landing.png

### authentication  <sub>(Platform)</sub>

- **minor** (layout-consistency) /authentication (Platform Admin): Route lands on the middle tab 'Users & access' while sibling admin screens (Audit, Data Management) default to their first tab; 'Sign in & sessions' is skipped. — evidence: ux-platform-admin-suite-authentication-landing.png

### audit-logs  <sub>(Platform)</sub>

- **major** (forms) /audit-logs (Platform Admin): Date filter chip reads 'Jul 11 - Jul 11' (today) while the table shows 18 entries spanning Nov 2025–Jul 2026 — filter state contradicts results. — evidence: ux-platform-admin-suite-audit-logs-landing.png
- **major** (discoverability) /audit-logs (Platform Admin): Rows promise 'each with prev/new value' but clicking a row opens nothing; seeing values requires knowing to switch to Record History and pick a company. — evidence: row click timed out in driving; ux-platform-admin-suite-audit-logs-record-history.png

### platform-admin  <sub>(Platform)</sub>

- **critical** (feedback) /platform-admin (Platform Admin): Clicking Terminate on an engagement executes instantly with only a toast — no confirmation dialog, unlike delete flows on Custom Fields and Documents. — evidence: ux-platform-admin-suite-platform-admin-terminate.png (toast 'Engagement terminated — 1 other engagement(s) unaffected' with no confirm step)
- **major** (visual-hierarchy) /platform-admin (Platform Admin): Tenants & companies tab stacks 7 unrelated blocks (companies table, jurisdictions catalog, portfolios, group structures, sharing approvals, health log) on one endless page. — evidence: ux-platform-admin-suite-platform-admin-landing.png (2300px tall single tab)
- **major** (visual-hierarchy) /platform-admin (Platform Admin): 'Tenants & companies' tab crams 6 unrelated sections (companies table, jurisdictions catalog, portfolios, group structures, sharing approvals, health log) into one very long scroll; the 'Active company context' switcher is buried mid-page. — evidence: ux-global-nav-ia-pa-platform-admin.png
- **minor** (copy-jargon) /platform-admin (Platform Admin): Button 'Revoke first membership' is ambiguous — which membership is 'first' is not shown, and revoke happens per-row with no target named. — evidence: ux-platform-admin-suite-platform-admin-users.png
- **minor** (layout-consistency) /companies vs /platform-admin (Platform Admin): Role context label inconsistent: Companies header says 'Acting as Platform Admin', Platform Administration says 'Viewing as Platform Admin', most other modules show nothing. — evidence: ux-global-nav-ia-pa-companies.png

### dashboard (/)

- **major** (copy-jargon) / (Company Admin): Dashboard hero is POC meta copy — 'user stories implemented as frontend capability with mock data', stat cards 'USER STORIES IMPLEMENTED 1,174', 'BACKEND Mocked in-memory'. Speaks to demo builders, not HR admins. — evidence: ux-global-nav-ia-dashboard-company-admin.png
- **major** (visual-hierarchy) / (Employee (User)): Employee home shows no personal data (leave balance, pending tasks live only in /self-service); landing is announcements plus a grid where 19 of 31 module cards are locked/greyed. — evidence: ux-global-nav-ia-dashboard-employee.png
- **major** (discoverability) / (all roles) sidebar: All 5 nav groups collapsed by default — first load shows only group names plus Dashboard; user must expand each group to discover the 31 modules. — evidence: ux-global-nav-ia-dashboard-platform-admin.png
- **minor** (discoverability) / (Employee (User)) sidebar: Sidebar lists all 31 modules for every role; Employee scans past 19 greyed lock-icon items to find their 12 usable ones. — evidence: ux-global-nav-ia-sidebar-full-employee-user-.png

### Cross-app (navigation / IA, not tied to one module)

- **minor** (layout-consistency) 6+ modules compared (all roles): Two competing tab styles across sibling modules: segmented pills (Leave, Workflows, Employees, Lifecycle, Reports) vs plain text-link tabs (Companies, Announcements, Self Service, Directory, Platform Admin). — evidence: ux-global-nav-ia-ca-leave.png vs ux-global-nav-ia-pa-companies.png
- **minor** (copy-jargon) sidebar bottom group (all roles): 'Platform Admin' appears twice with different meanings — the active role in the switcher and a module item in the Administration group — first-time users can't tell role from place. — evidence: ux-global-nav-ia-sidebar-full-platform-admin-bottom.png
- **minor** (navigation) /definitely-not-a-route (Company Admin): 404 page drops the entire app shell — no sidebar or header, just a sign on white; user loses all navigation context (Go Back / Back to Home buttons do exist). — evidence: ux-global-nav-ia-unknown-route.png

## 5. Strengths by screen group

### workforce-core

Screens audited: /employees (Company Admin); /employees (Employee (User)); /lifecycle (Company Admin); /lifecycle (Employee (User)); /directory (Company Admin).

- Consistent 4-card KPI summary row across Employees, Lifecycle and Directory
- Onboarding detail sheet: stage chips plus per-document checklist with Submitted/Missing states
- Employee 'My Lifecycle' view is genuinely distinct — task-focused cards, peer reviews, notifications
- New Employee dialog shows red inline errors directly beneath each required field
- Explanatory microcopy: delegation auto-revert note, 'acting as Deepa Raghavan' proxy banner

Top UX fixes for this group:
1. Scope the Employees page for Employee (User): hide admin KPI cards and delegation admin controls; show only My Profile and read-only Directory.
2. Add a Save button and confirmation for My Profile custom fields, plus section anchor navigation on the long profile page.
3. Make /directory rows open the same detail sheet as the Employees grid, and fix clipped Actions/Stage columns.
4. Merge or clearly rename the two 'Directory' surfaces so admins know which is canonical.
5. Move the 'Engine features' toggle panel to the Admin area and split Exits from Knowledge Transfer into separate sub-tabs.

### leave-attendance-assets

Screens audited: /leave (Company Admin); /leave Employee Summary tab (Company Admin); /attendance (Company Admin); /attendance Approvals tab (Company Admin); /assets Inventory (Company Admin); /assets Requests tab (Company Admin); /leave (Employee (User)); /leave Apply Time Off dialog + validation + submit (Employee (User)); /attendance (Employee (User)); /attendance My Requests tab (Employee (User)); /assets My Assets (Employee (User)); /assets Requests tab + New Requisition dialog + Receipt acknowledgement dialog (Employee (User)).

- Every pending request shows its holder: 'Pending with <name> (L1)' across all three modules
- Inline field-level validation with red highlights and messages next to inputs
- Attendance Approvals tab: inline Approve/Reject, SLA countdown, original-vs-requested comparison
- Apply dialog shows live balance, computed 'Requested: 2 days', and View policy link
- Asset notifications carry direct 'Complete now' / 'Acknowledge' CTAs on rows
- Requisition dialog explains submit outcome up front (number generated, starts Pending Approval)
- Post-submit state updates everywhere: counters, new row, status chip

Top UX fixes for this group:
1. Give Leave admins an approve/reject path (Approvals tab or clickable request detail) — the leave loop currently dead-ends on the Requests list.
2. Rewrite the leave submit toast in plain language ('Request submitted — pending with Rahul Menon') and anchor it near the dialog; drop 'Workflow Engine' jargon.
3. Validate all required fields (Client Billing Code, Cost Center Ref) in the first submit pass with inline errors.
4. Add inline 'Raise correction' on flagged attendance rows instead of requiring a tab switch to My Requests.
5. Unify tab styling across modules, default Assets admin to Requests, and stop summing day+hour leave balances into one number.

### workflows-engine

Screens audited: /workflows Configure — Browse by-module (Platform Admin); /workflows Configure — Browse by-type (Platform Admin); /workflows Configure — Browse folders (Platform Admin); /workflows Configure — Governance table (Platform Admin); /workflows Configure — Find any setting dialog (Platform Admin); /workflows Build — canvas designer (Platform Admin); /workflows Classic admin (Platform Admin); /workflows Requests + detail sheet + New Request (Company Admin); /workflows Configure (Company Admin); /workflows Build (Company Admin); /workflows Classic admin (Company Admin).

- Author → Govern → Consume stepper orients users across Build and Configure tabs
- Consistent toast feedback for export, toggle, publish and SLA actions
- New Request dialog: sensible defaults, live routing preview, inline 'Describe the request' validation
- Request detail sheet packs status, stages, SLA and audit history in one readable panel
- Scope toggles update KPI counters instantly with scope-explaining toasts
- Build Test mode animates node-by-node execution with a visible Stop control

Top UX fixes for this group:
1. Rewrite jargon copy in plain language (engine/scope/consume/bound/routing decision table) and add a legend or tooltips for the P/PF/G/C scope badges.
2. Fix 'Find any setting' relevance so 'leave' surfaces leave-named settings first — it is the flagship orientation feature and currently misleads.
3. Add pagination or 'showing X of 203' to the Governance table and Folders 'All workflows' list; 16-of-203 rows with no indicator hides the catalog.
4. Reconcile publish state signals: after Publish, clear the Draft badge and align toast version with the catalog; make governance row click match its 'scopes, versions & history' promise.
5. Break Classic admin into anchored sub-sections (or accordion) instead of one 6,800px scroll; remove duplicate heading and CFG-xx codes.

### organization

Screens audited: /companies (Platform Admin); /group-companies (Platform Admin); /portfolios (Platform Admin); /jurisdictions (Platform Admin); /locations (Company Admin); /departments (Company Admin); /positions (Company Admin); /org-groups (Company Admin).

- Consistent KPI summary-card strip at the top of all 8 screens
- Inline validation appears next to fields with clear red styling in every create dialog
- Single prominent orange create button top-right on every screen
- Companies 6-step create wizard shows progress, auto-generated code, and per-field helper text
- Group create dialog explains ineligibility inline ('Suspended — ineligible', 'Draft — ineligible')

Top UX fixes for this group:
1. Make row click open a detail sheet on all 8 tables (only Companies has one); Group Companies even instructs users to select a construct.
2. Standardize the toolbar: search box + status filter + labeled actions on every list; today each screen invents its own mix.
3. Label or tooltip every icon-only toolbar button (org-groups has 6, portfolios 3, jurisdictions 3) and explain the checkbox-to-enable pattern.
4. Fix Positions create: don't flag optional Work Mode/Cost Center as 'Invalid input' on empty submit.
5. Rename or merge the two 'Groups' concepts — 'Group Companies' and 'Groups' both use a 'New Group' button; make Location's required IP/CIDR field optional or plain-language.

### policies-comms

Screens audited: /policies (Company Admin); /announcements (Company Admin); /notifications (Company Admin); /hr-letters (Company Admin); /feedback (Company Admin); /policy-distribution (Company Admin); /policy-distribution (Employee (User)).

- Announcement, HR-letter and feedback forms show inline red errors directly under each invalid field
- Employee acknowledgement flow: confirm checkbox gates the button, toast + receipt on success
- Acknowledged policies move to a 'receipts available' section with View receipt — clear closure
- Consistent summary-card strip (counts) at the top of every screen in the group
- HR Letters approval queue shows the actual letter text inline before Approve/Reject
- Live 'Recipient preview (de-duplicated)' count while building a distribution audience

Top UX fixes for this group:
1. Make table rows clickable to open a detail sheet on /policies and /policy-distribution — checkbox + icon-only toolbar is undiscoverable
2. Align the Notifications nav label and landing tab: sidebar 'Notifications' currently lands on a Tasks approval inbox
3. Add text labels or tooltips to icon-only toolbar buttons (Preview, Version history, Retire, edit/delete) across the group
4. Replace internal jargon visible to end users: 'schema v3', 'tpl v2', 'Run SLA engine', 'Reminded · 55%', 'Parallel — any one'
5. Disable 'Distribute now' until a policy is selected and recipient preview is above 0, mirroring validation elsewhere

### platform-admin-suite

Screens audited: /custom-fields (Platform Admin); /data-management (Platform Admin); /reports (Platform Admin); /roles-security (Platform Admin); /authentication (Platform Admin); /audit-logs (Platform Admin); /platform-admin (Platform Admin); /documents (Company Admin).

- Delete confirmations name the record and spell out consequences (Custom Fields, Documents)
- Inline validation appears beside every field on empty submit, consistently red-highlighted
- Actions acknowledge with toasts and live counter updates (audit simulate 18→19)
- Consistent summary-card row + tab pattern across all admin screens
- 5-step import wizard with progress bar and per-step validation
- Report modal offers Schedule delivery and Export right where results appear

Top UX fixes for this group:
1. Add a confirmation dialog to Terminate and Revoke on /platform-admin, matching the Delete pattern used elsewhere.
2. Split mega-pages (/custom-fields, /platform-admin tenants tab) into sub-tabs or collapsed sections — one job per view.
3. Fix /audit-logs date chip showing today's range while displaying all-time entries; make row click open prev/new values.
4. Add a search box to the 62-report catalog on /reports.
5. Label icon-only toolbar actions with tooltips and show a 'selected' count; flag the missing-File error in document upload.

### recruitment-selfservice

Screens audited: /recruitment — Job Openings tab (Company Admin); /recruitment — Candidates / Hiring Pipeline tab (Company Admin); /recruitment — candidate detail sheet + stage moves (Company Admin); /recruitment — New job requisition dialog + empty-submit validation (Company Admin); /recruitment — Candidate Portal tab (Company Admin); /recruitment — Offers tab (Company Admin); /recruitment — Reports tab (Company Admin); /self-service — Overview (Employee (User)); /self-service — My Timeline (Employee (User)); /self-service — Time / Attendance requests (Employee (User)); /self-service — Requests (Travel, Learning, Assets) (Employee (User)); /self-service — Pay & Work (Employee (User)).

- Stage moves give instant toast + live funnel/summary count updates (e.g. 'Kiran Rao moved to hired')
- Candidate detail sheet is rich: stage actions, panel scorecards side-by-side, reference checks
- Hired stage immediately surfaces a pre-onboarding checklist in the same sheet
- Requisition form validation: red labels, inline errors under each field
- Consistent summary-cards + filter chips + table pattern across recruitment tabs
- Self-service Time/Requests tables show clear status pills and per-row task buttons

Top UX fixes for this group:
1. Reorder /self-service Overview: put pending tasks, leave balances and quick actions above the fold; move the profile form down.
2. Make 'Apply leave' actually open the leave request flow (or deep-link to Leave Management) instead of a toast excuse.
3. Make pending-task chips real buttons that open the relevant screen; they currently look clickable but do nothing.
4. Hide or disable-with-tooltip the 9 requisition bulk-action buttons until rows are selected; keep one primary 'New Requisition'.
5. Make pipeline funnel stage cards clickable filters and fix the Offers table Actions column overflowing its card.

### global-nav-ia

Screens audited: / (Platform Admin); / (Company Admin); / (Employee (User)); role switcher menu (Platform Admin); sidebar expanded (Platform Admin); sidebar expanded (Company Admin); sidebar expanded (Employee (User)); /companies (Platform Admin); /employees (Platform Admin); /employees detail sheet (Platform Admin); /employees/lifecycle (Platform Admin); /leave (Platform Admin — access restricted); /attendance (Platform Admin — access restricted); /recruitment (Platform Admin — access restricted); /documents (Platform Admin — access restricted); /workflows (Platform Admin); /reports (Platform Admin); /roles-security (Platform Admin); /platform-admin (Platform Admin); /employees (Company Admin); /leave + Employee Summary tab (Company Admin); /announcements + create dialog + empty-submit (Company Admin); /self-service (Employee (User)); /directory (Employee (User)); /feedback (Employee (User)); /definitely-not-a-route (404).

- Consistent page scaffold everywhere: title, summary stat cards, tabs, filters, table
- Role switcher self-labels 'Viewing role — tap to switch' with active-role checkmark
- Access-restricted page names your role, lists roles with access, offers Back to Dashboard
- Dashboard module grid with lock icons maps the whole product per role
- Create dialogs show inline validation errors directly under each field
- Orange '+ New X' primary button consistently placed top-right across modules
- Platform Admin dashboard is a genuinely rich, scannable mission-control view

Top UX fixes for this group:
1. Replace CA/Employee POC-meta dashboards with role-relevant homes (pending approvals, leave balances, my tasks) — reuse Self Service widgets.
2. Fix the default-role dead end: default demo role should reach core HR modules, or auto-suggest switching when 13 items are locked.
3. Standardize one tab style and one filter pattern (instant vs Search/Reset) across all modules.
4. Rewrite engine/scope jargon in plain language and move 'Engine features' toggles off the Employees directory into its Admin tab.
5. Reflect detail sheets and sub-pages in the URL and add breadcrumbs; align sidebar labels with page titles (Employee Lifecycle vs 'Onboarding & Exit').
