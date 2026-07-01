# Graph Report - satellite-hr/requirements  (2026-07-02)

## Corpus Check
- Corpus is ~12,458 words - fits in a single context window. You may not need a graph.

## Summary
- 117 nodes · 153 edges · 11 communities
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]

## God Nodes (most connected - your core abstractions)
1. `SatelliteHR Phase I BRD` - 42 edges
2. `Company Management (Module)` - 14 edges
3. `Portfolio Management (FunSpec)` - 13 edges
4. `Group Company Management (FunSpec)` - 9 edges
5. `Roles and Security (RBAC)` - 7 edges
6. `Companies` - 6 edges
7. `Company Lifecycle Management (FunSpec)` - 6 edges
8. `Group Companies` - 5 edges
9. `Audit and Logging` - 5 edges
10. `Tenant Isolation` - 5 edges

## Surprising Connections (you probably didn't know these)
- `Company Management (Module)` --semantically_similar_to--> `Companies`  [INFERRED] [semantically similar]
  src/SatelliteHR-FunctionalSpec-CompanyManagement.md → src/SatelliteHR-Phase-I-BRD.md
- `COMP-FR-003 Registration Identifiers` --semantically_similar_to--> `Jurisdictions`  [INFERRED] [semantically similar]
  src/SatelliteHR-FunctionalSpec-CompanyManagement.md → src/SatelliteHR-Phase-I-BRD.md
- `Audit Events` --semantically_similar_to--> `Audit and Logging`  [INFERRED] [semantically similar]
  src/SatelliteHR-FunctionalSpec-CompanyManagement.md → src/SatelliteHR-Phase-I-BRD.md
- `Tenant Isolation Rules` --semantically_similar_to--> `Tenant Isolation`  [INFERRED] [semantically similar]
  src/SatelliteHR-FunctionalSpec-CompanyManagement.md → src/SatelliteHR-Phase-I-BRD.md
- `Audit Events` --semantically_similar_to--> `Audit Trail`  [INFERRED] [semantically similar]
  src/SatelliteHR-FunctionalSpec-CompanyManagement.md → src/SatelliteHR-Phase-I-BRD.md

## Import Cycles
- None detected.

## Communities (11 total, 0 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.08
Nodes (24): SatelliteHR Phase I BRD, Announcements, Cross-Module Business Rules, Data Model Extensibility (Custom Fields), Departments, Documents and Attachments, Employee Asset Management, Feedback and Grievance (+16 more)

### Community 1 - "Community 1"
Cohesion: 0.15
Nodes (16): Context Switching, PORT-FR-001 Create Portfolio, PORT-FR-002 Portfolio Constraints, PORT-FR-003 Portfolio Modification, PORT-FR-004 Company Context Switching Selector, PORT-FR-005 Context Switch Behavior, PORT-FR-006 Bookmarkable Company URLs, PORT-FR-007 Company Context Indicator (+8 more)

### Community 2 - "Community 2"
Cohesion: 0.14
Nodes (15): Audit Events, COMP-FR-002 Mandatory Field Validation, COMP-FR-003 Registration Identifiers, COMP-FR-004 Automatic Tenant Initialization, COMP-FR-005 Duplicate Company Prevention, COMP-FR-006 Company Information Categories, COMP-FR-007 Company Code Generation, COMP-FR-008 Company Detail Editing Constraints (+7 more)

### Community 3 - "Community 3"
Cohesion: 0.21
Nodes (13): Group Company Management (FunSpec), GROUP-FR-001 Create Group Company Structure, GROUP-FR-002 Group Company Constraints, GROUP-FR-003 Group Types, GROUP-FR-004 Shared Locations, GROUP-FR-005 Shared Policy Templates, GROUP-FR-006 Consolidated Group Reporting, Group Types (Holding/Sister/Joint Venture) (+5 more)

### Community 4 - "Community 4"
Cohesion: 0.24
Nodes (11): Company Management Functional Spec, COMP-FR-010 Status Transitions Workflow, COMP-FR-011 Company Suspension Behavior, COMP-FR-012 Company Inactivation Behavior, Company Lifecycle Management (FunSpec), Company Lifecycle States (Draft/Active/Suspended/Inactive/Archived), Companies, Company Lifecycle and Archival (+3 more)

### Community 5 - "Community 5"
Cohesion: 0.18
Nodes (11): Leave Accrual and Balances, Company HR Administrator, Company IT / Security Admin, Department Head / People Manager, Employee Lifecycle Management, Employees, Leave Management, Portfolio HR Operations User (+3 more)

### Community 6 - "Community 6"
Cohesion: 0.20
Nodes (10): COMP-FR-013 Company Archival, Data Retention Rules, Audit and Logging, Audit Trail, Data Anonymization, Data Retention, Data Subject Rights (DPDP/GDPR), NFR: Data Governance and Retention (+2 more)

### Community 7 - "Community 7"
Cohesion: 0.33
Nodes (6): Company Super Administrator, Delegation, Impersonation (Login as User), Multi-Factor Authentication, Role-Based Access Control, Roles and Security (RBAC)

### Community 8 - "Community 8"
Cohesion: 0.40
Nodes (5): COMP-FR-001 Company Creation Wizard, Data Management (Import/Export), Jurisdictions, Platform Operations Admin, Platform Super Administrator

### Community 9 - "Community 9"
Cohesion: 0.67
Nodes (3): Candidate, Interview Panel Member, Talent Acquisition

### Community 10 - "Community 10"
Cohesion: 0.67
Nodes (3): Employee - Limited Access, Employee Self-Service, Employee - Standard

## Knowledge Gaps
- **58 isolated node(s):** `Departments`, `Positions`, `Policy Management`, `Policy Distribution and Acknowledgment`, `Announcements` (+53 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `SatelliteHR Phase I BRD` connect `Community 0` to `Community 1`, `Community 3`, `Community 4`, `Community 5`, `Community 6`, `Community 7`, `Community 8`, `Community 9`, `Community 10`?**
  _High betweenness centrality (0.730) - this node is a cross-community bridge._
- **Why does `Company Management (Module)` connect `Community 2` to `Community 8`, `Community 4`?**
  _High betweenness centrality (0.177) - this node is a cross-community bridge._
- **Why does `Companies` connect `Community 4` to `Community 0`, `Community 8`, `Community 2`?**
  _High betweenness centrality (0.172) - this node is a cross-community bridge._
- **What connects `Departments`, `Positions`, `Policy Management` to the rest of the system?**
  _58 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._