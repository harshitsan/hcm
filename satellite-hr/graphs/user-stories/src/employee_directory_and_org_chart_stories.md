# Employee Directory and Org Chart — User Stories

## DIR-01: Multiple directory display views
- Role: Employee (User)
- Story: As an Employee (User), I want to browse the employee directory in list view, card view, or compact view, so that I can find colleagues in the layout that best suits my current task.
- Priority: High
- Source: FR 6.21.1 (Directory Views)

## DIR-02: View employee contact details in the directory
- Role: Employee (User)
- Story: As an Employee (User), I want to see contact details alongside each directory entry, so that I can reach the right colleague quickly.
- Priority: Medium
- Source: FR 6.21.1 (Directory Views); FR 6.21.5 (Privacy Controls)

## DIR-03: Hierarchical organizational chart
- Role: Employee (User)
- Story: As an Employee (User), I want to view the organization as a hierarchical tree, so that I can understand reporting relationships.
- Priority: High
- Source: FR 6.21.2 (Organizational Chart)

## DIR-04: Department-based org chart view
- Role: Employee (User)
- Story: As an Employee (User), I want to view the org chart organized by department, so that I can see how a specific department is structured.
- Priority: Medium
- Source: FR 6.21.2 (Organizational Chart)

## DIR-05: Export the org chart
- Role: Company Admin
- Story: As a Company Admin, I want to export the organizational chart to PNG or PDF, so that I can share and archive the structure outside the system.
- Priority: Medium
- Source: FR 6.21.2 (Organizational Chart)

## DIR-06: Advanced search with multiple filters
- Role: Employee (User)
- Story: As an Employee (User), I want to filter the directory by multiple attributes, so that I can pinpoint specific employees.
- Priority: High
- Source: FR 6.21.3 (Advanced Search)

## DIR-07: Saved searches
- Role: Company Admin
- Story: As a Company Admin, I want to save frequently used search criteria, so that I can rerun common queries without reconfiguring filters.
- Priority: Medium
- Source: FR 6.21.3 (Advanced Search)

## DIR-08: Export search results
- Role: Company Admin
- Story: As a Company Admin, I want to export directory search results to Excel or CSV, so that I can use the data in external reports and workflows.
- Priority: Medium
- Source: FR 6.21.3 (Advanced Search); FR 6.21.5 (Privacy Controls)

## DIR-09: Cross-company group search
- Role: Group Company Admin
- Story: As a Group Company Admin, I want to search for users across companies in the group, so that I can locate people beyond my own company boundary.
- Priority: High
- Source: FR 6.21.4 (Group Company Search)

## DIR-10: Privacy controls on directory information
- Role: Company Admin
- Story: As a Company Admin, I want contact and sensitive information governed by role and privacy policies, so that the directory does not expose protected data.
- Priority: High
- Source: FR 6.21.5 (Privacy Controls)

## DIR-11: Configure directory field visibility and privacy defaults
- Role: Platform Admin
- Story: As a Platform Admin, I want to configure which directory fields are exposed and set default privacy policies platform-wide, so that contact and sensitive data are governed consistently across all tenants.
- Priority: Medium
- Source: FR 6.21.5 (Privacy Controls); FR 6.21.1 (Directory Views)

## DIR-12: Portfolio-wide directory and org chart oversight
- Role: Portfolio Admin
- Story: As a Portfolio Admin, I want to view the directory and organizational chart across the group companies in my portfolio, so that I can understand structure and staffing beyond a single company.
- Priority: High
- Source: FR 6.21.4 (Group Company Search); FR 6.21.2 (Organizational Chart)

## DIR-13: Non-user employees represented in directory and org chart
- Role: Employee (Non-User)
- Story: As an Employee (Non-User), I want to appear in the directory and organizational chart even though I do not log in, so that colleagues can find me and see my place in the reporting structure.
- Priority: Medium
- Source: FR 6.21.1 (Directory Views); FR 6.21.2 (Organizational Chart); FR 6.21.5 (Privacy Controls)

## DIR-14: Export the org chart as an employee
- Role: Employee (User)
- Story: As an Employee (User), I want to export the org chart I am viewing to PNG or PDF, so that I can save or share the reporting structure.
- Priority: Low
- Source: FR 6.21.2 (Organizational Chart)

## DIR-15: Group Company Search security constraints
- Role: Group Company Admin
- Story: As a Group Company Admin, I want cross-company search to enforce security and privacy constraints per company, so that group-level visibility never bypasses individual company protections.
- Priority: High
- Source: FR 6.21.4 (Group Company Search); FR 6.21.5 (Privacy Controls)

## DIR-16: Tenant-scoped storage and isolation for directory and cross-company search
- Role: Platform Admin
- Story: As a Platform Admin, I want directory and org-chart data to be stored under tenant-scoped, row-level-secured persistence, so that every read is constrained to the caller's authorized company and portfolio scope even when queries span the group.
- Priority: High
- Source: FR 6.21.4 (Group Company Search, L1 data); FR 6.21.5 (Privacy Controls, L1 data)

## DIR-17: Effective-dated org hierarchy from the bitemporal data model
- Role: Company Admin
- Story: As a Company Admin, I want the org chart to be derived from effective-dated reporting relationships in the canonical data model, so that I can view the organization as it stands today or as it stood on a past date.
- Priority: Medium
- Source: FR 6.21.2 (Organizational Chart, L1 data)

## DIR-18: Reporting-relationship integrity in the org data model
- Role: Platform Admin
- Story: As a Platform Admin, I want the reporting relationships underlying the org chart to enforce referential and structural integrity, so that the hierarchy is always renderable without cycles or dangling links.
- Priority: Medium
- Source: FR 6.21.2 (Organizational Chart, L1 data)

## DIR-19: Company-level override of directory privacy and field visibility config
- Role: Company Admin
- Story: As a Company Admin, I want to override the platform default privacy policy and field-visibility configuration for my company, so that directory exposure matches my company's policies without changing code.
- Priority: Medium
- Source: FR 6.21.5 (Privacy Controls, L2 config)

## DIR-20: Configure custom fields as directory and searchable attributes
- Role: Company Admin
- Story: As a Company Admin, I want to configure which custom fields (UDFs) appear in the directory and are available as search filters, so that company-specific attributes can be surfaced without code changes.
- Priority: Medium
- Source: FR 6.21.3 (Advanced Search, L2 config); FR 6.21.1 (Directory Views, L2 config)

## DIR-21: Rules engine evaluates directory privacy visibility
- Role: Employee (User)
- Story: As an Employee (User), I want the shared rules engine to decide which fields I can see by evaluating the configured privacy policy against my role, so that visibility is applied consistently across views, search, and export.
- Priority: High
- Source: FR 6.21.5 (Privacy Controls, L3 engine)

## DIR-22: Dynamic rendering of custom fields via the forms engine
- Role: Employee (User)
- Story: As an Employee (User), I want directory entries and search filters to render custom fields dynamically from the field schema, so that company-defined attributes appear correctly without bespoke screens.
- Priority: Medium
- Source: FR 6.21.3 (Advanced Search, L3 engine); FR 6.21.1 (Directory Views, L3 engine)
