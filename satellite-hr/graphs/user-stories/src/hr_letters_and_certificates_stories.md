# HR Letters and Certificates — User Stories

## HLC-01: Configure document templates
- Role: Company Admin
- Story: As a Company Admin, I want to configure templates for the standard HR document types, so that my organization can generate consistent, branded letters and certificates.
- Priority: High
- Source: FR 6.28.1 (Templates)

## HLC-02: Insert dynamic merge fields into templates
- Role: Company Admin
- Story: As a Company Admin, I want to embed merge fields in templates, so that document content is automatically populated from source data without manual re-entry.
- Priority: High
- Source: FR 6.28.2 (Merge Fields)

## HLC-03: Manually generate a document
- Role: Company Admin
- Story: As a Company Admin, I want to manually generate an HR document for an employee, so that I can produce letters and certificates on demand.
- Priority: High
- Source: FR 6.28.3 (Generation)

## HLC-04: Auto-generate documents on workflow events
- Role: Company Admin
- Story: As a Company Admin, I want documents to be generated automatically when workflow events occur, so that routine letters are produced without manual effort.
- Priority: Medium
- Source: FR 6.28.3 (Generation)

## HLC-05: Batch generate documents
- Role: Company Admin
- Story: As a Company Admin, I want to generate documents in batch, so that I can produce the same document type for many employees at once.
- Priority: Medium
- Source: FR 6.28.3 (Generation)

## HLC-06: Route documents through approval workflows
- Role: Company Admin
- Story: As a Company Admin, I want configurable approval workflows for generated documents, so that letters and certificates are reviewed before release.
- Priority: Medium
- Source: FR 6.28.4 (Workflow)

## HLC-07: Track signing authority
- Role: Company Admin
- Story: As a Company Admin, I want signing authority tracked on documents, so that each document records who is authorized to sign it.
- Priority: Medium
- Source: FR 6.28.4 (Workflow)

## HLC-08: Distribute documents to employees
- Role: Company Admin
- Story: As a Company Admin, I want to distribute finalized documents via email, in-app access, and print, so that employees receive their documents through the appropriate channel.
- Priority: High
- Source: FR 6.28.5 (Distribution)

## HLC-09: Track document delivery
- Role: Company Admin
- Story: As a Company Admin, I want delivery tracking for distributed documents, so that I can confirm whether documents reached their recipients.
- Priority: Medium
- Source: FR 6.28.5 (Distribution)

## HLC-10: Maintain version history and reissue documents
- Role: Company Admin
- Story: As a Company Admin, I want complete version history and reissue capabilities for documents, so that I can track changes and provide corrected or duplicate copies.
- Priority: Medium
- Source: FR 6.28.6 (Versioning)

## HLC-11: Retain documents for seven years
- Role: Company Admin
- Story: As a Company Admin, I want generated documents retained for 7 years, so that the organization meets record-keeping and compliance obligations.
- Priority: Medium
- Source: FR 6.28.6 (Versioning)

## HLC-12: View and download my HR documents in-app
- Role: Employee (User)
- Story: As an Employee (User), I want to view and download my finalized HR letters and certificates within the application, so that I can access my documents anytime without contacting HR.
- Priority: High
- Source: FR 6.28.5 (Distribution)

## HLC-13: Receive HR documents via email or print
- Role: Employee (Non-User)
- Story: As an Employee (Non-User) without application access, I want to receive my HR letters and certificates by email or printed copy, so that I still obtain my documents despite not having an in-app account.
- Priority: Medium
- Source: FR 6.28.5 (Distribution)

## HLC-14: Review and act on documents pending approval
- Role: Company Admin
- Story: As a Company Admin acting as an approver, I want to review documents pending approval and approve or reject them, so that only correct, authorized documents are finalized and distributed.
- Priority: Medium
- Source: FR 6.28.4 (Workflow)

## HLC-15: Standardize letter templates and policies across the group
- Role: Group Company Admin
- Story: As a Group Company Admin, I want to define or oversee document templates, approval workflows, and retention policies across the companies in my group, so that HR letters and certificates are consistent and compliant across all group companies.
- Priority: Low
- Source: FR 6.28.1, 6.28.4, 6.28.6

## HLC-16: Persist documents in a tenant-scoped canonical data model
- Role: Platform Admin
- Story: As a Platform Admin, I want generated documents and their metadata stored in a tenant-scoped canonical data model with row-level security, so that each company's letters and certificates are isolated and integrity-protected.
- Priority: High
- Source: FR 6.28.3, FR 6.28.6 (L1 domain/data)

## HLC-17: Store immutable effective-dated version history for every document
- Role: Platform Admin
- Story: As a Platform Admin, I want every document version stored immutably with full effective-dated temporal history, so that reissues and prior copies remain tamper-evident and auditable for the full retention period.
- Priority: Medium
- Source: FR 6.28.6 (L1 data)

## HLC-18: Version and effective-date template configuration
- Role: Company Admin
- Story: As a Company Admin, I want templates, merge-field mappings, and their approval and signing config to be versioned and effective-dated, so that generation always uses the correct template version and past documents remain reproducible.
- Priority: High
- Source: FR 6.28.1 (L2 config)

## HLC-19: Resolve merge fields via the forms/template render engine
- Role: Company Admin
- Story: As a Company Admin, I want the shared render engine to resolve merge fields and produce the PDF, so that generation reads template config and source data consistently regardless of document type.
- Priority: High
- Source: FR 6.28.2, FR 6.28.3 (L3 engine)

## HLC-20: Drive template, approval, and signing selection from decision tables
- Role: Company Admin
- Story: As a Company Admin, I want the rules engine to select the template, approval path, and signing authority from configurable decision tables, so that the correct process is applied per document type and context without hard-coded logic.
- Priority: Medium
- Source: FR 6.28.4 (L3 engine)

## HLC-21: Dispatch distribution and tracking via the notification engine
- Role: Company Admin
- Story: As a Company Admin, I want the notification/template engine to dispatch finalized documents and record delivery outcomes, so that email, in-app, and print distribution and their tracking are handled by shared runtime.
- Priority: Medium
- Source: FR 6.28.5 (L3 engine)

## HLC-22: Manage generated documents in a search and filter grid
- Role: Company Admin
- Story: As a Company Admin, I want a metadata-driven grid to search, filter, and navigate all generated documents, so that I can locate, review, and act on letters and certificates across the organization.
- Priority: Medium
- Source: FR 6.28.3, FR 6.28.6 (L4 presentation)
