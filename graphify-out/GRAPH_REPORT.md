# Graph Report - .  (2026-06-08)

## Corpus Check
- Corpus is ~16,795 words - fits in a single context window. You may not need a graph.

## Summary
- 106 nodes · 126 edges · 20 communities (10 shown, 10 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.81)
- Token cost: 104,689 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Company & Portfolio Hierarchy|Company & Portfolio Hierarchy]]
- [[_COMMUNITY_Self-Service & External Workforce|Self-Service & External Workforce]]
- [[_COMMUNITY_Policy & Workflow Engine|Policy & Workflow Engine]]
- [[_COMMUNITY_Employee Lifecycle & Talent|Employee Lifecycle & Talent]]
- [[_COMMUNITY_India Statutory Compliance|India Statutory Compliance]]
- [[_COMMUNITY_Identity, RBAC & Multi-Tenancy|Identity, RBAC & Multi-Tenancy]]
- [[_COMMUNITY_Org Structure & Employee Data|Org Structure & Employee Data]]
- [[_COMMUNITY_Group Company & Locations|Group Company & Locations]]
- [[_COMMUNITY_Company Lifecycle & Governance|Company Lifecycle & Governance]]
- [[_COMMUNITY_Source Documents & Platform|Source Documents & Platform]]
- [[_COMMUNITY_FinanceCompliance Viewer Role|Finance/Compliance Viewer Role]]
- [[_COMMUNITY_ITSecurity Admin Role|IT/Security Admin Role]]
- [[_COMMUNITY_Limited-Access Employee Role|Limited-Access Employee Role]]
- [[_COMMUNITY_Feedback & Grievance|Feedback & Grievance]]
- [[_COMMUNITY_FunctionalProject Manager Role|Functional/Project Manager Role]]
- [[_COMMUNITY_Group Reporting Viewer Role|Group Reporting Viewer Role]]
- [[_COMMUNITY_Non-Functional Requirements|Non-Functional Requirements]]
- [[_COMMUNITY_Platform Security Admin Role|Platform Security Admin Role]]
- [[_COMMUNITY_Portfolio HR Ops Role|Portfolio HR Ops Role]]
- [[_COMMUNITY_Portfolio Auditor Role|Portfolio Auditor Role]]

## God Nodes (most connected - your core abstractions)
1. `Employees` - 16 edges
2. `Compliance Enablement (India)` - 12 edges
3. `Companies` - 8 edges
4. `Contractor` - 8 edges
5. `Portfolio Management` - 6 edges
6. `Policy Management` - 6 edges
7. `Group Company Management` - 5 edges
8. `Jurisdictions` - 5 edges
9. `Employee Lifecycle Management` - 5 edges
10. `Leave Management` - 5 edges

## Surprising Connections (you probably didn't know these)
- `Contractor` --semantically_similar_to--> `Employees`  [INFERRED] [semantically similar]
  SatelliteHR Phase II-BRD (1).md → SatelliteHR Phase I-BRD (1).md
- `Contractor - Standard` --semantically_similar_to--> `Employee - Standard`  [INFERRED] [semantically similar]
  SatelliteHR Phase II-BRD (1).md → SatelliteHR Phase I-BRD (1).md
- `Separation of User Identity from Workforce Records` --conceptually_related_to--> `Contractor`  [EXTRACTED]
  SatelliteHR Phase I-BRD (1).md → SatelliteHR Phase II-BRD (1).md
- `Audit and Logging` --references--> `Company Lifecycle Management`  [INFERRED]
  SatelliteHR Phase I-BRD (1).md → SatelliteHR-FunctionalSpec-CompanyManagement (2).md
- `Multi-Company Context Switching` --implements--> `Portfolio Management`  [EXTRACTED]
  SatelliteHR-FunctionalSpec-CompanyManagement (2).md → SatelliteHR Phase I-BRD (1).md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Multi-Level Administration Roles** — hcm_satellitehr_phase_i_brd_1_platform_super_administrator, hcm_satellitehr_phase_i_brd_1_portfolio_manager, hcm_satellitehr_phase_i_brd_1_group_company_administrator, hcm_satellitehr_phase_i_brd_1_company_super_administrator [EXTRACTED 1.00]
- **Employee Onboarding Flow** — hcm_satellitehr_phase_i_brd_1_talent_acquisition, hcm_satellitehr_phase_i_brd_1_onboarding, hcm_satellitehr_phase_i_brd_1_task_checklist_management, hcm_satellitehr_phase_i_brd_1_employee_asset_management [EXTRACTED 1.00]
- **Indian Statutory Compliance Acts** — hcm_satellitehr_phase_ii_brd_1_epf_act, hcm_satellitehr_phase_ii_brd_1_esi_act, hcm_satellitehr_phase_ii_brd_1_gratuity_act, hcm_satellitehr_phase_ii_brd_1_bonus_act, hcm_satellitehr_phase_ii_brd_1_maternity_benefit_act [EXTRACTED 1.00]

## Communities (20 total, 10 thin omitted)

### Community 0 - "Company & Portfolio Hierarchy"
Cohesion: 0.17
Nodes (16): Company Code Generation (COMP-YYYY-NNNN), Company Configuration Inheritance, Company Entity (Data Model), Company Management Module, Company Creation and Provisioning, Portfolio Entity (Data Model), Companies, Jurisdictions (+8 more)

### Community 1 - "Self-Service & External Workforce"
Cohesion: 0.20
Nodes (12): Employee Self-Service, Employee - Standard, Leave Management, Contractor, Contractor Engagement Models, Contractor - Restricted, Contractor - Standard, Mobile Application (+4 more)

### Community 2 - "Policy & Workflow Engine"
Cohesion: 0.18
Nodes (11): Shared Policy Templates, Announcements, Groups, Notifications and Communications, Policy Distribution and Acknowledgment, Policy Management, Task/Checklist Management, Time and Attendance (+3 more)

### Community 3 - "Employee Lifecycle & Talent"
Cohesion: 0.20
Nodes (11): Candidate, Company HR Administrator, Employee Asset Management, Employee Lifecycle Management, Exit Management, Interview Panel Member, Onboarding, Probation Confirmation (+3 more)

### Community 4 - "India Statutory Compliance"
Cohesion: 0.18
Nodes (11): Statutory Workforce Data Capture (Indian Labor Law), Payment of Bonus Act 1965, Compliance Dashboards and Alerts, Compliance Enablement (India), Employees' Provident Fund (EPF) Act 1952, Employees' State Insurance (ESI) Act 1948, Payment of Gratuity Act 1972, Labour Welfare Fund (State Specific) (+3 more)

### Community 5 - "Identity, RBAC & Multi-Tenancy"
Cohesion: 0.22
Nodes (10): Company and Portfolio APIs, Multi-Company Context Switching, Company Super Administrator, Cross-Module Business Rules, Separation of User Identity from Workforce Records, Integrations and APIs, Roles and Security (RBAC), Tenant Isolation (+2 more)

### Community 6 - "Org Structure & Employee Data"
Cohesion: 0.28
Nodes (9): Data Management (Import/Export), Data Model Extensibility (Custom Fields), Department Head / People Manager, Departments, Documents and Attachments, Employees, HR Letters and Certificates, Manager Hierarchy and Reporting Structure (+1 more)

### Community 7 - "Group Company & Locations"
Cohesion: 0.33
Nodes (7): GroupCompany Entity (Data Model), Group Types (Holding/Sister/Joint Venture), Shared Locations Across Group Companies, Employee Directory and Org Chart, Group Company Administrator, Group Company Management, Locations

### Community 8 - "Company Lifecycle & Governance"
Cohesion: 0.40
Nodes (5): Company Lifecycle Management, Company Status States (Draft/Active/Suspended/Inactive/Archived), Audit and Logging, Data Governance and Retention, Security, Compliance and Statutory Coverage

### Community 9 - "Source Documents & Platform"
Cohesion: 0.67
Nodes (4): SatelliteHR Functional Spec - Company Management (Document), SatelliteHR Phase I BRD (Document), SatelliteHR Platform, SatelliteHR Phase II BRD (Document)

## Knowledge Gaps
- **42 isolated node(s):** `Probation Confirmation`, `Transfers`, `Feedback and Grievance`, `Documents and Attachments`, `Data Management (Import/Export)` (+37 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Employees` connect `Org Structure & Employee Data` to `Self-Service & External Workforce`, `Policy & Workflow Engine`, `Employee Lifecycle & Talent`, `India Statutory Compliance`, `Identity, RBAC & Multi-Tenancy`, `Group Company & Locations`, `Company Lifecycle & Governance`?**
  _High betweenness centrality (0.427) - this node is a cross-community bridge._
- **Why does `Companies` connect `Company & Portfolio Hierarchy` to `Company Lifecycle & Governance`, `Group Company & Locations`?**
  _High betweenness centrality (0.202) - this node is a cross-community bridge._
- **Why does `Audit and Logging` connect `Company Lifecycle & Governance` to `Company & Portfolio Hierarchy`, `Org Structure & Employee Data`?**
  _High betweenness centrality (0.163) - this node is a cross-community bridge._
- **What connects `Probation Confirmation`, `Transfers`, `Feedback and Grievance` to the rest of the system?**
  _42 weakly-connected nodes found - possible documentation gaps or missing edges._