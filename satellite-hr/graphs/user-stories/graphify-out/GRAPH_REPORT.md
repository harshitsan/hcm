# Graph Report - satellite-hr/user-stories  (2026-07-02)

## Corpus Check
- Corpus is ~43,410 words - fits in a single context window. You may not need a graph.

## Summary
- 205 nodes · 613 edges · 9 communities
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 40 edges (avg confidence: 0.74)
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

## God Nodes (most connected - your core abstractions)
1. `System Module` - 30 edges
2. `Policy Distribution and Acknowledgment` - 25 edges
3. `Roles and Security` - 25 edges
4. `Leave Management` - 24 edges
5. `Talent Acquisition` - 23 edges
6. `Time and Attendance` - 23 edges
7. `User Authentication` - 23 edges
8. `Workflow Engine` - 22 edges
9. `Employees` - 21 edges
10. `Reporting and Analytics` - 21 edges

## Surprising Connections (you probably didn't know these)
- `Role-Based Access Control` --semantically_similar_to--> `Tenant Isolation (RLS)`  [INFERRED] [semantically similar]
  src/ → src/  _Bridges community 1 → community 2_
- `Tenant Isolation (RLS)` --semantically_similar_to--> `Data Governance and Retention`  [INFERRED] [semantically similar]
  src/ → None  _Bridges community 1 → community 5_
- `Subscription / Entitlement` --semantically_similar_to--> `Governed Versioned Config`  [INFERRED] [semantically similar]
  src/ → src/  _Bridges community 0 → community 6_
- `Targeted Communication / Announcements` --semantically_similar_to--> `Employee Self-Service`  [INFERRED] [semantically similar]
  src/ → src/  _Bridges community 4 → community 6_
- `Announcements` --references--> `Metadata-Driven UI / SPA`  [EXTRACTED]
  src/announcements_stories.md → src/  _Bridges community 0 → community 4_

## Import Cycles
- None detected.

## Communities (9 total, 0 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.14
Nodes (46): Cross-Company / Portfolio Scoping, Custom Fields (UDF), Document Management, Duplicate Detection, Effective-Dated Bitemporal History, Forms / Dynamic-Fields Engine, Governed Versioned Config, Group-Company Relationship (+38 more)

### Community 1 - "Community 1"
Cohesion: 0.09
Nodes (33): Policy Acknowledgment, Audit Trail, Bitemporal / Effective-Dated Data, Jurisdiction Catalog, Policy Applicability, Shared Locations Across Group Companies, Tax and Fee Applicability, Tenant Isolation (RLS) (+25 more)

### Community 2 - "Community 2"
Cohesion: 0.07
Nodes (33): Authentication, Company Context Switching, Directory Privacy Controls, Impersonation / Login-As-User, Multi-Factor Authentication, Role-Based Access Control, Single Sign-On / Identity Integration, AUTH_002 (+25 more)

### Community 3 - "Community 3"
Cohesion: 0.13
Nodes (25): Accrual / Balance Engine, Approval Workflow, Time and Attendance, Delegation, Leave Management, Rules Engine, SLA and Escalation, Workflow / Approval Engine (+17 more)

### Community 4 - "Community 4"
Cohesion: 0.11
Nodes (21): Dashboards and Analytics, Forms / Dynamic-Fields Engine, Metadata-Driven UI / SPA, Reporting, Employee Self-Service, Talent Acquisition, FR 6.13.1, FR 6.13.2 (+13 more)

### Community 5 - "Community 5"
Cohesion: 0.12
Nodes (16): API-First / Webhook Integration, Data Governance and Retention, Positions / Org Structure, FR 4.1, FR 4.2, FR 4.3, FR 4.4, FR 4.5 (+8 more)

### Community 6 - "Community 6"
Cohesion: 0.20
Nodes (11): Asset Lifecycle, Company Lifecycle, Data Retention & Archival, Employee Lifecycle, Expiry Tracking, Subscription / Entitlement, Targeted Communication / Announcements, COMP-FR-001 (Company Creation Wizard) (+3 more)

### Community 7 - "Community 7"
Cohesion: 0.24
Nodes (10): Multi-Channel Delivery, Notification / Template Engine, Notification Templates, Scheduling Engine, FR 6.27.1, FR 6.27.2, FR 6.27.3, FR 6.27.4 (+2 more)

### Community 8 - "Community 8"
Cohesion: 0.20
Nodes (10): FR 6.11.1, FR 6.11.2, FR 6.11.3, FR 6.11.4, FR 6.11.5, FR 6.11.6, FR 6.11.7, FR 6.11.8 (+2 more)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `System Module` connect `Community 5` to `Community 0`, `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 7`?**
  _High betweenness centrality (0.135) - this node is a cross-community bridge._
- **Why does `Portfolio Management` connect `Community 2` to `Community 0`, `Community 1`, `Community 4`?**
  _High betweenness centrality (0.109) - this node is a cross-community bridge._
- **Why does `Policy Distribution and Acknowledgment` connect `Community 8` to `Community 0`, `Community 1`, `Community 3`, `Community 4`, `Community 7`?**
  _High betweenness centrality (0.100) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `Tenant Isolation (RLS)` (e.g. with `Role-Based Access Control` and `Shared Locations Across Group Companies`) actually correct?**
  _`Tenant Isolation (RLS)` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.14492753623188406 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.07386363636363637 - nodes in this community are weakly interconnected._