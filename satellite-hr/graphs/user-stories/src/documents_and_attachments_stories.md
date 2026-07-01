# Documents and Attachments — User Stories

## DOC-01: Attach documents to a Company
- Role: Company Admin
- Story: As a Company Admin, I want to upload and store documents against a Company entity, so that company-level files are centrally organized and retrievable.
- Priority: High
- Source: FR 6.22.1 (Supported Entities — Company)

## DOC-02: Attach documents to an Employee
- Role: Company Admin
- Story: As a Company Admin, I want to upload and store documents against an Employee record, so that employee-specific files are kept with the correct person.
- Priority: High
- Source: FR 6.22.1 (Supported Entities — Employee)

## DOC-03: Attach documents to a Candidate
- Role: Company Admin
- Story: As a Company Admin, I want to upload and store documents against a Candidate within Talent Acquisition, so that candidate files stay tied to the applicant record.
- Priority: Medium
- Source: FR 6.22.1 (Supported Entities — Candidate within Talent Acquisition)

## DOC-04: Restrict uploads to supported file formats
- Role: Company Admin
- Story: As a Company Admin, I want the system to accept only PDF, JPG/JPEG, DOC/DOCX, XLS/XLSX, PNG, and TXT files, so that only usable document types are stored.
- Priority: High
- Source: FR 6.22.2 (File Support — supported formats)

## DOC-05: Enforce maximum file size
- Role: Company Admin
- Story: As a Company Admin, I want the system to enforce a 2 MB maximum file size, so that storage stays controlled and uploads remain performant.
- Priority: High
- Source: FR 6.22.2 (File Support — 2 MB maximum file size)

## DOC-06: Capture document metadata
- Role: Company Admin
- Story: As a Company Admin, I want each document to record metadata such as name, upload date, uploaded by, and expiry date, so that files can be identified and audited.
- Priority: High
- Source: FR 6.22.3 (Document Features — metadata)

## DOC-07: Track document expiration
- Role: Company Admin
- Story: As a Company Admin, I want to track document expiration, so that I can identify documents that have expired or are approaching expiry.
- Priority: Medium
- Source: FR 6.22.3 (Document Features — expiration tracking)

## DOC-08: Categorize documents
- Role: Company Admin
- Story: As a Company Admin, I want to categorize documents, so that files can be organized and located by type.
- Priority: Medium
- Source: FR 6.22.3 (Document Features — categorization)

## DOC-09: Enforce role-based access to documents
- Role: Company Admin
- Story: As a Company Admin, I want document access to be governed by role-based access controls, so that users only see documents they are authorized to view.
- Priority: High
- Source: FR 6.22.3 (Document Features — role-based access); FR 6.22.4 (Security — access controls)

## DOC-10: Secure documents with encryption and tenant isolation
- Role: Platform Admin
- Story: As a Platform Admin, I want documents encrypted at rest and isolated per tenant, so that stored files are protected and never exposed across tenants.
- Priority: High
- Source: FR 6.22.4 (Security — encryption at rest, tenant isolation, access controls)

## DOC-11: View own attached documents
- Role: Employee (User)
- Story: As an Employee (User), I want to view and download documents attached to my own Employee record, so that I can access my personal files when my role permits.
- Priority: Medium
- Source: FR 6.22.1 (Supported Entities — Employee); FR 6.22.3 (Document Features — role-based access)

## DOC-12: Upload documents to own record
- Role: Employee (User)
- Story: As an Employee (User), I want to upload supported documents to my own Employee record when permitted, so that I can submit personal files without admin assistance.
- Priority: Medium
- Source: FR 6.22.1; FR 6.22.2; FR 6.22.3 (role-based access)

## DOC-13: Receive alerts for expiring and expired documents
- Role: Company Admin
- Story: As a Company Admin, I want to be alerted about documents nearing or past their expiry date, so that I can renew or replace them before they lapse.
- Priority: Medium
- Source: FR 6.22.3 (Document Features — expiration tracking)

## DOC-14: Manage documents across companies in the group
- Role: Group Company Admin
- Story: As a Group Company Admin, I want to manage and review documents across the companies in my group, so that I have consolidated oversight of document compliance and expiry.
- Priority: Medium
- Source: FR 6.22.1; FR 6.22.3 (role-based access, expiration tracking); FR 6.22.4 (tenant isolation)

## DOC-15: Oversee document compliance across the portfolio
- Role: Portfolio Admin
- Story: As a Portfolio Admin, I want portfolio-wide visibility into stored documents and their status, so that I can monitor document management and compliance across all group companies in my portfolio.
- Priority: Low
- Source: FR 6.22.1; FR 6.22.3 (expiration tracking, role-based access); FR 6.22.4 (access controls, tenant isolation)

## DOC-16: Configure the document category taxonomy
- Role: Company Admin
- Story: As a Company Admin, I want to define and maintain the per-tenant list of document categories as governed configuration, so that document organization matches my company's document types without code changes.
- Priority: Medium
- Source: FR 6.22.3 (Document Features — categorization) (L2 config)

## DOC-17: Govern allowed formats and size limit as policy config
- Role: Platform Admin
- Story: As a Platform Admin, I want the supported file formats and maximum file size to be maintained as governed, versioned policy configuration, so that upload validation rules can be adjusted without redeploying code.
- Priority: Medium
- Source: FR 6.22.2 (File Support — supported formats, 2 MB maximum) (L2 config)

## DOC-18: Configure role-based access rules for documents
- Role: Company Admin
- Story: As a Company Admin, I want to configure which roles may view, download, and upload documents by category, so that access control reflects my company's policy as governed configuration.
- Priority: High
- Source: FR 6.22.3 (Document Features — role-based access) (L2 config)

## DOC-19: Configure expiry alert lead time
- Role: Company Admin
- Story: As a Company Admin, I want to configure how far in advance an expiring-document warning is raised, so that expiry alerts match my company's renewal lead time.
- Priority: Low
- Source: FR 6.22.3 (Document Features — expiration tracking) (L2 config)

## DOC-20: Automated expiry notifications via the notification engine
- Role: Company Admin
- Story: As a Company Admin, I want the notification engine to generate expiry alerts using configured templates and lead time, so that stakeholders are proactively informed as documents approach or pass expiry.
- Priority: Medium
- Source: FR 6.22.3 (Document Features — expiration tracking) (L3 Notification/Template engine)

## DOC-21: Engine-enforced upload validation from policy config
- Role: Company Admin
- Story: As a Company Admin, I want the upload validation engine to enforce format and size rules by evaluating the governed policy config, so that only compliant files are accepted consistently across all entities.
- Priority: High
- Source: FR 6.22.2 (File Support — supported formats, 2 MB maximum) (L3 Rules/Forms engine)

## DOC-22: Search and filter documents in a documents grid
- Role: Company Admin
- Story: As a Company Admin, I want a documents grid with search, filter, and sort, so that I can quickly locate files by name, category, entity, or expiry status.
- Priority: Medium
- Source: FR 6.22.3 (Document Features — metadata, categorization, expiration tracking) (L4 presentation)
