# Employee Directory and Org Chart — User Stories

_Derived from SatelliteHR Phase I BRD — module "Employee Directory and Org Chart". 10 user stories._

---

## DIR-01: Multiple directory display views

**User story:** As an Employee, I want to browse the employee directory in list, card, or compact views, so that I can find colleagues in the layout that suits my current task.

**Acceptance criteria:**
- Given I open the employee directory, when I choose a display mode, then I can switch between list view, card view, and compact view.
- Given any view is active, when employees are displayed, then each entry shows name, photo, position, department, and location.
- Given I select a view mode, when I return to the directory later, then the directory continues to present employee information consistently across the chosen view.

**Priority:** High
**Source:** FR 6.21.1 (Directory Views)

---

## DIR-02: View employee contact details in the directory

**User story:** As an Employee, I want to see contact details alongside each directory entry, so that I can reach the right colleague quickly.

**Acceptance criteria:**
- Given I view an employee entry, when the entry renders, then contact details are displayed together with name, photo, position, department, and location.
- Given contact details are shown, when I read an entry, then the information presented is limited to what the directory is configured to expose.

**Priority:** Medium
**Source:** FR 6.21.1 (Directory Views)

---

## DIR-03: Hierarchical organizational chart

**User story:** As an Employee, I want to view the organization as a hierarchical tree, so that I can understand reporting relationships.

**Acceptance criteria:**
- Given I open the org chart, when the tree view loads, then it displays the organizational hierarchy as a tree.
- Given the tree is displayed, when I expand or collapse nodes, then I can interactively navigate through the hierarchy.

**Priority:** High
**Source:** FR 6.21.2 (Organizational Chart)

---

## DIR-04: Department-based org chart view

**User story:** As a Manager, I want to view the org chart organized by department, so that I can see how a specific department is structured.

**Acceptance criteria:**
- Given I am viewing the org chart, when I switch to the department-based view, then the chart groups employees by department.
- Given the department-based view is active, when I navigate the chart, then interactive navigation remains available.

**Priority:** Medium
**Source:** FR 6.21.2 (Organizational Chart)

---

## DIR-05: Export the org chart

**User story:** As a Company/HR Admin, I want to export the organizational chart to PNG or PDF, so that I can share and archive the structure outside the system.

**Acceptance criteria:**
- Given an org chart is displayed, when I choose to export, then I can export it as PNG or PDF.
- Given I select an export format, when the export completes, then the generated file reflects the currently displayed chart.

**Priority:** Medium
**Source:** FR 6.21.2 (Organizational Chart)

---

## DIR-06: Advanced search with multiple filters

**User story:** As an Employee, I want to filter the directory by multiple attributes, so that I can pinpoint specific employees.

**Acceptance criteria:**
- Given I use advanced search, when I apply filters, then I can filter by name, ID, department, position, location, group, employment status, and custom fields.
- Given I apply multiple filters, when the search runs, then the results reflect all applied criteria.

**Priority:** High
**Source:** FR 6.21.3 (Advanced Search)

---

## DIR-07: Saved searches

**User story:** As a Company/HR Admin, I want to save frequently used search criteria, so that I can rerun common queries without reconfiguring filters.

**Acceptance criteria:**
- Given I have configured search filters, when I save the search, then it is stored as a saved search.
- Given I have saved searches, when I select one, then the directory reapplies its filter criteria.

**Priority:** Medium
**Source:** FR 6.21.3 (Advanced Search)

---

## DIR-08: Export search results

**User story:** As a Company/HR Admin, I want to export directory search results to Excel or CSV, so that I can use the data in external reports and workflows.

**Acceptance criteria:**
- Given I have a set of search results, when I choose to export, then I can export them to Excel or CSV.
- Given I export results, when the file is generated, then it contains the employees matching the current search.

**Priority:** Medium
**Source:** FR 6.21.3 (Advanced Search)

---

## DIR-09: Cross-company group search

**User story:** As a Group Company Admin, I want to search for users across companies in the group, so that I can locate people beyond my own company boundary.

**Acceptance criteria:**
- Given I hold a Group Company role, when I perform a search, then I can search across companies in the group.
- Given cross-company results are returned, when they display, then each result shows a company identifier.
- Given I do not hold a Group Company role, when I search, then cross-company results are withheld in line with security constraints.

**Priority:** High
**Source:** FR 6.21.4 (Group Company Search)

---

## DIR-10: Privacy controls on directory information

**User story:** As a Company/HR Admin, I want contact and sensitive information governed by role and privacy policies, so that the directory does not expose protected data.

**Acceptance criteria:**
- Given a user views the directory, when contact information is rendered, then its visibility is determined by the user's role and applicable privacy policies.
- Given sensitive information exists on an employee record, when the directory is displayed, then that sensitive information is excluded from the directory.

**Priority:** High
**Source:** FR 6.21.5 (Privacy Controls)
