# Departments — User Stories

## DEPT-01: Create multiple departments within a company
- Role: Company Admin
- Story: As a Company Admin, I want to define multiple departments within my company, so that the organizational department structure is represented in the HRMS.
- Priority: High
- Source: FR 6.7.1 (define multiple departments)

## DEPT-02: Build hierarchical parent-child department structures
- Role: Company Admin
- Story: As a Company Admin, I want to organize departments into parent-child hierarchies, so that reporting lines reflect the real organizational structure.
- Priority: High
- Source: FR 6.7.1 (hierarchical parent-child structures)

## DEPT-03: Support n-level department nesting
- Role: Company Admin
- Story: As a Company Admin, I want to nest departments to any number of levels, so that even deep organizational structures can be modeled accurately.
- Priority: Medium
- Source: FR 6.7.1 (n-level nesting)

## DEPT-04: Assign a department head
- Role: Company Admin
- Story: As a Company Admin, I want to designate a department head for each department, so that each department has a clearly accountable leader.
- Priority: High
- Source: FR 6.7.2 (designated department head)

## DEPT-05: Assign employees to at least one department
- Role: Company Admin
- Story: As a Company Admin, I want every employee to belong to at least one department, so that all employees are accounted for in the organizational structure.
- Priority: High
- Source: FR 6.7.3 (employees belong to at least one department)

## DEPT-06: Assign employees to multiple departments
- Role: Company Admin
- Story: As a Company Admin, I want to assign an employee to multiple departments, so that staff who work across teams are represented correctly.
- Priority: Medium
- Source: FR 6.7.3 (may belong to multiple departments)

## DEPT-07: Use departments in role assignment and policy applicability
- Role: Company Admin
- Story: As a Company Admin, I want to use departments as a basis for role assignment and policy applicability, so that access and policies can be scoped to organizational units.
- Priority: Medium
- Source: FR 6.7.4 (role assignment, policy applicability)

## DEPT-08: Use departments in reporting and approvals
- Role: Company Admin
- Story: As a Company Admin, I want departments to drive reporting and approval flows, so that reports and approvals follow the organizational structure.
- Priority: Medium
- Source: FR 6.7.4 (reporting, approvals)

## DEPT-09: Edit and delete departments
- Role: Company Admin
- Story: As a Company Admin, I want to rename, reorganize, and delete departments, so that the department structure stays accurate as the company evolves.
- Priority: Medium
- Source: FR 6.7.1, FR 6.7.3, FR 6.7.4 (lifecycle management of departments)

## DEPT-10: Oversee department structures across companies in the group
- Role: Group Company Admin
- Story: As a Group Company Admin, I want to view and govern the department structures of all companies in my group, so that organizational structures are consistent across the group.
- Priority: Medium
- Source: FR 6.7.1, FR 6.7.2 (multi-company oversight of department structure)

## DEPT-11: View my own department membership and department head
- Role: Employee (User)
- Story: As an Employee (User), I want to see which department(s) I belong to and who my department head is, so that I understand my place in the organizational structure and know my reporting line.
- Priority: Low
- Source: FR 6.7.2, FR 6.7.3 (employee visibility of department membership and head)

## DEPT-12: Be represented in a department without portal access
- Role: Employee (Non-User)
- Story: As an HR/Company Admin managing an Employee (Non-User), I want non-portal employees to still be assigned to at least one department, so that they are fully represented in the organizational structure, reporting, and policy applicability despite having no login.
- Priority: Low
- Source: FR 6.7.3 (department membership for non-user employees)

## DEPT-13: Tenant-scoped bitemporal department records with effective-dated history
- Role: Platform Admin
- Story: As a Platform Admin, I want department records and their memberships stored as tenant-scoped, effective-dated, bitemporal data, so that every structural change is auditable and the correct hierarchy can be reconstructed for any past date without leaking across tenants.
- Priority: Medium
- Source: FR 6.7.1 (L1 domain/data: bitemporal history, effective-dating, RLS tenant isolation)

## DEPT-14: Configure custom fields and metadata schema for departments
- Role: Company Admin
- Story: As a Company Admin, I want to define custom fields (UDFs) and metadata on the department entity through governed config, so that departments capture company-specific attributes without any code change.
- Priority: Medium
- Source: FR 6.7.1 (L2 config: UDF/custom-field schema for departments)

## DEPT-15: Configure department-keyed approver graphs and policy applicability rules
- Role: Company Admin
- Story: As a Company Admin, I want to configure approver graphs and policy applicability decision tables keyed on department (and its hierarchy) through governed, versioned config, so that the shared engines route and apply rules correctly without code changes.
- Priority: Medium
- Source: FR 6.7.4 (L2 config: department-keyed approver graphs, policy applicability decision tables)

## DEPT-16: Approval routing resolved by the workflow engine using the department hierarchy
- Role: Employee (User)
- Story: As an Employee (User) submitting a request, I want the workflow engine to resolve my approval path from my department and its hierarchy, so that my request reaches the right approvers automatically.
- Priority: Medium
- Source: FR 6.7.4 (L3 engine: workflow/approval routing over department hierarchy)

## DEPT-17: Rules engine evaluates department-scoped policy applicability
- Role: Company Admin
- Story: As a Company Admin, I want the rules engine to evaluate policy applicability against an employee's department and its ancestors, so that department-scoped policies apply consistently and automatically.
- Priority: Medium
- Source: FR 6.7.4 (L3 engine: rules/decision-table evaluation of department-scoped applicability)

## DEPT-18: Navigate and search the metadata-driven department org tree
- Role: Company Admin
- Story: As a Company Admin, I want a metadata-driven department tree UI with search and navigation, so that I can find, inspect, and manage departments quickly in deep hierarchies.
- Priority: Low
- Source: FR 6.7.1 (L4 presentation: metadata-driven department tree, search, navigation)

## DEPT-19: Oversee department structures across the portfolio
- Role: Portfolio Admin
- Story: As a Portfolio Admin, I want to view and govern the department structures of all group companies and companies within my portfolio, so that organizational structures remain consistent and compliant across the portfolio.
- Priority: Medium
- Source: FR 6.7.1, FR 6.7.2 (portfolio-wide oversight of department structure; multi-tenant governance)

## DEPT-20: Notify stakeholders of department changes and approval routing via the notification engine
- Role: Company Admin
- Story: As a Company Admin, I want the notification engine to send templated notifications for department-related events and approval routing, so that department heads and affected employees are informed of structural changes and pending actions.
- Priority: Low
- Source: FR 6.7.2, FR 6.7.4 (L3 engine: notification/template for department head changes and approval routing)
