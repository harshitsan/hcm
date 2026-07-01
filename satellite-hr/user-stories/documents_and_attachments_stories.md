# Documents and Attachments — User Stories

_Derived from SatelliteHR Phase I BRD — module "Documents and Attachments". 10 user stories._

---

## DOC-01: Attach documents to a Company

**User story:** As a Company/HR Admin, I want to upload and store documents against a Company entity, so that company-level files are centrally organized and retrievable.

**Acceptance criteria:**
- Given I am viewing a Company record, when I upload a file, then the document is stored and associated with that Company.
- Given a document is attached to a Company, when I open the Company's documents area, then the file is listed and downloadable.

**Priority:** High
**Source:** FR 6.22.1 (Supported Entities — Company)

---

## DOC-02: Attach documents to an Employee

**User story:** As a Company/HR Admin, I want to upload and store documents against an Employee record, so that employee-specific files are kept with the correct person.

**Acceptance criteria:**
- Given I am viewing an Employee record, when I upload a file, then the document is stored and associated with that Employee.
- Given documents exist for an Employee, when I view their profile, then all attached documents are listed.

**Priority:** High
**Source:** FR 6.22.1 (Supported Entities — Employee)

---

## DOC-03: Attach documents to a Candidate

**User story:** As a Company/HR Admin, I want to upload and store documents against a Candidate within Talent Acquisition, so that candidate files stay tied to the applicant record.

**Acceptance criteria:**
- Given I am viewing a Candidate within Talent Acquisition, when I upload a file, then the document is stored and associated with that Candidate.
- Given documents exist for a Candidate, when I open their record, then the attached files are listed and accessible.

**Priority:** Medium
**Source:** FR 6.22.1 (Supported Entities — Candidate within Talent Acquisition)

---

## DOC-04: Restrict uploads to supported file formats

**User story:** As a Company/HR Admin, I want the system to accept only PDF, JPG/JPEG, DOC/DOCX, XLS/XLSX, PNG, and TXT files, so that only usable document types are stored.

**Acceptance criteria:**
- Given I select a file in a supported format, when I upload it, then the upload succeeds.
- Given I select a file in an unsupported format, when I attempt to upload it, then the upload is rejected with a clear error indicating allowed formats.

**Priority:** High
**Source:** FR 6.22.2 (File Support — supported formats)

---

## DOC-05: Enforce maximum file size

**User story:** As a Company/HR Admin, I want the system to enforce a 2 MB maximum file size, so that storage stays controlled and uploads remain performant.

**Acceptance criteria:**
- Given a file is 2 MB or smaller, when I upload it, then the upload is accepted.
- Given a file exceeds 2 MB, when I attempt to upload it, then the upload is rejected with a message stating the 2 MB limit.

**Priority:** High
**Source:** FR 6.22.2 (File Support — 2 MB maximum file size)

---

## DOC-06: Capture document metadata

**User story:** As a Company/HR Admin, I want each document to record metadata such as name, upload date, uploaded by, and expiry date, so that files can be identified and audited.

**Acceptance criteria:**
- Given I upload a document, when it is saved, then the name, upload date, and uploaded-by user are recorded automatically.
- Given a document has an expiry date, when I view the document, then the expiry date is displayed alongside its other metadata.

**Priority:** High
**Source:** FR 6.22.3 (Document Features — metadata)

---

## DOC-07: Track document expiration

**User story:** As a Company/HR Admin, I want to track document expiration, so that I can identify documents that have expired or are approaching expiry.

**Acceptance criteria:**
- Given a document has an expiry date, when that date passes, then the document is flagged as expired.
- Given I review stored documents, when I filter or view by expiry, then expired and upcoming-expiry documents are identifiable.

**Priority:** Medium
**Source:** FR 6.22.3 (Document Features — expiration tracking)

---

## DOC-08: Categorize documents

**User story:** As a Company/HR Admin, I want to categorize documents, so that files can be organized and located by type.

**Acceptance criteria:**
- Given I upload or edit a document, when I assign a category, then the category is saved with the document.
- Given documents are categorized, when I browse documents, then I can view or filter them by category.

**Priority:** Medium
**Source:** FR 6.22.3 (Document Features — categorization)

---

## DOC-09: Enforce role-based access to documents

**User story:** As a Company/HR Admin, I want document access to be governed by role-based access controls, so that users only see documents they are authorized to view.

**Acceptance criteria:**
- Given a user has a role permitting access to a document, when they open the entity, then the document is visible and accessible to them.
- Given a user's role does not permit access, when they view the entity, then the restricted document is not shown or downloadable.

**Priority:** High
**Source:** FR 6.22.3 (Document Features — role-based access); FR 6.22.4 (Security — access controls)

---

## DOC-10: Secure documents with encryption and tenant isolation

**User story:** As a Platform Admin, I want documents encrypted at rest and isolated per tenant, so that stored files are protected and never exposed across tenants.

**Acceptance criteria:**
- Given a document is stored, when it resides at rest, then it is encrypted.
- Given documents belong to a specific tenant, when any user accesses documents, then only that tenant's documents are retrievable, with no cross-tenant leakage.

**Priority:** High
**Source:** FR 6.22.4 (Security — encryption at rest, tenant isolation)

---
