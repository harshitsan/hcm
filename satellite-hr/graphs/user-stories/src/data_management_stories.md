# Data Management — User Stories

## DM-01: Import and export master data
- Role: Company Admin
- Story: As a Company Admin, I want to import and export master data such as Company, Department, Location, Group, and Employee records, so that I can migrate and bulk-maintain organizational reference data instead of entering it manually.
- Priority: High
- Source: FR 6.24.1 (Import/Export Scope — master data)

## DM-02: Import and export transactional data
- Role: Company Admin
- Story: As a Company Admin, I want to import and export transactional data such as Leaves and Attendance, so that I can load historical operational data in bulk and exchange it with external systems.
- Priority: High
- Source: FR 6.24.1 (Import/Export Scope — transactional data); FR 6.24.3

## DM-03: Support multiple file formats
- Role: Company Admin
- Story: As a Company Admin, I want to import and export data in CSV, XLS, XLSX, and JSON formats, so that I can work with the file type that best fits my source systems and tools.
- Priority: Medium
- Source: FR 6.24.2 (File Formats)

## DM-04: Enforce file size and batch limits
- Role: Company Admin
- Story: As a Company Admin, I want the system to enforce a 50 MB maximum file size and 10,000 records per batch, so that imports stay within safe processing limits and do not overload the platform.
- Priority: Medium
- Source: FR 6.24.2 (File Formats — 50 MB / 10,000-record limits)

## DM-05: Sequence imports by dependency
- Role: Company Admin
- Story: As a Company Admin, I want imports to follow the correct dependency sequence — Foundation Masters, then Organizational Masters, then Workforce Masters, then Transactional Data — so that dependent records are only loaded after their prerequisites exist.
- Priority: High
- Source: FR 6.24.3 (Import Sequencing)

## DM-06: Pre-import validation with staging mode
- Role: Company Admin
- Story: As a Company Admin, I want to run pre-import validation in a sandbox/staging mode, so that I can verify my data is correct before it is committed to production.
- Priority: High
- Source: FR 6.24.4 (Validation and Error Reporting — pre-import validation / staging mode)

## DM-07: Record-level error reporting
- Role: Company Admin
- Story: As a Company Admin, I want detailed error reporting with record-level success and failure results, so that I can pinpoint and fix exactly which records failed.
- Priority: High
- Source: FR 6.24.4 (Validation and Error Reporting — record-level reporting)

## DM-08: Transactional rollback for failed imports
- Role: Company Admin
- Story: As a Company Admin, I want failed imports to roll back transactionally with atomic transactions where feasible, so that a partial or failed import does not leave data in an inconsistent state.
- Priority: High
- Source: FR 6.24.5 (Rollback — transactional rollback / atomic transactions)

## DM-09: Real-time import status tracking
- Role: Company Admin
- Story: As a Company Admin, I want real-time status tracking for my imports, so that I always know whether a job is submitted, validating, running, completed, or failed.
- Priority: Medium
- Source: FR 6.24.6 (Status Visibility)

## DM-10: Bulk import and export across group companies
- Role: Group Company Admin
- Story: As a Group Company Admin, I want to import and export master and transactional data for the companies within my group, so that I can migrate and maintain data consistently across the group's entities in one place.
- Priority: High
- Source: FR 6.24.1; FR 6.24.3; FR 6.24.4 (Import/Export Scope — group-level administration)

## DM-11: Bulk import and export across the portfolio
- Role: Portfolio Admin
- Story: As a Portfolio Admin, I want to import and export master and transactional data across the companies in my portfolio, so that I can perform large-scale migration and bulk maintenance spanning multiple companies.
- Priority: High
- Source: FR 6.24.1; FR 6.24.2; FR 6.24.5 (Import/Export Scope — portfolio-level administration)

## DM-12: Oversee platform-wide data migration
- Role: Platform Admin
- Story: As a Platform Admin, I want to configure and oversee data import/export and migration across the entire platform, so that onboarding, bulk maintenance, and operational data exchange run reliably for all tenants.
- Priority: High
- Source: FR 6.24.1–6.24.6 (Purpose — platform-wide migration/oversight)

## DM-13: Download error report and re-import corrected records
- Role: Company Admin
- Story: As a Company Admin, I want to download the detailed error report and re-import only the corrected records after a partial or failed import, so that I can efficiently complete an import without re-processing already-succeeded records.
- Priority: Medium
- Source: FR 6.24.4; FR 6.24.6 (Error Reporting / Partially completed handling)

## DM-14: Enforce uniqueness and referential integrity on import
- Role: Company Admin
- Story: As a Company Admin, I want imported records to be matched, deduplicated, and integrity-checked against the canonical data model, so that bulk loads never create duplicate masters or orphaned references.
- Priority: High
- Source: FR 6.24.3; FR 6.24.4 (L1 domain — uniqueness/referential integrity)

## DM-15: Preserve effective-dating and history for imported records
- Role: Company Admin
- Story: As a Company Admin, I want historical transactional and master records to be stored with their correct effective dates in the bitemporal data model, so that migrated history is queryable as-of any past date and later corrections do not overwrite the past.
- Priority: High
- Source: FR 6.24.1; FR 6.24.3 (L1 domain — effective-dating/bitemporal history)

## DM-16: Tenant-scoped isolation of import and export
- Role: Platform Admin
- Story: As a Platform Admin, I want every import and export to be strictly tenant-scoped by row-level security, so that no bulk operation can read or write another tenant's data.
- Priority: High
- Source: FR 6.24.1 (Purpose — multi-tenant); FR 6.24.5 (L1 domain — tenant-scoped storage / RLS)

## DM-17: Govern import/export config as versioned metadata
- Role: Platform Admin
- Story: As a Platform Admin, I want the supported formats, size/batch limits, and entity-to-tier classification to be governed as versioned, effective-dated configuration, so that the import engine's behavior can change without code and stay consistent across tenants.
- Priority: Medium
- Source: FR 6.24.2; FR 6.24.3 (L2 config — governed formats/limits/tier classification)

## DM-18: Guided import wizard and live job monitoring dashboard
- Role: Company Admin
- Story: As a Company Admin, I want a metadata-driven import/export wizard and a live job-monitoring dashboard, so that I can self-serve bulk data operations and track them without technical help.
- Priority: Medium
- Source: FR 6.24.4; FR 6.24.6 (L4 presentation — self-service import UX / job dashboard)

## DM-19: Notify submitter on import/export job completion and failure
- Role: Company Admin
- Story: As a Company Admin, I want to be notified through the platform notification engine when a long-running import or export job finishes, fails, or completes partially, so that I do not have to keep watching the dashboard for asynchronous batch jobs.
- Priority: Medium
- Source: FR 6.24.6 (L3 Notification/Template — async job completion/failure notifications)

## DM-20: Map source columns to entity fields including custom fields
- Role: Company Admin
- Story: As a Company Admin, I want to map the columns in my import file to the target entity fields — including dynamic/custom fields — and save reusable mapping templates, so that files whose headers do not exactly match the canonical schema still import correctly.
- Priority: Medium
- Source: FR 6.24.4; FR 6.24.2 (L3 Forms/Dynamic-Fields — source column-to-field mapping incl. custom fields)
