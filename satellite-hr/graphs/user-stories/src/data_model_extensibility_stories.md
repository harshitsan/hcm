# Data Model Extensibility — User Stories

## DMX-01: Extend supported entities with custom fields
- Role: Company Admin
- Story: As a Company Admin, I want to add custom fields to the core entities Companies, Locations, Departments, Groups, Positions, and Employees, so that I can capture data unique to my organization without waiting for platform changes.
- Priority: High
- Source: FR 6.26.1 (Supported Entities)

## DMX-02: Define platform-level custom fields available across all companies
- Role: Platform Admin
- Story: As a Platform Admin, I want to define platform-level custom fields, so that the same field is available consistently across all companies (tenants) on the platform.
- Priority: High
- Source: FR 6.26.2 (Scope Levels)

## DMX-03: Define company-level (tenant-specific) custom fields
- Role: Company Admin
- Story: As a Company Admin, I want to define company-level custom fields, so that I can capture tenant-specific data without affecting other companies.
- Priority: High
- Source: FR 6.26.2 (Scope Levels)

## DMX-04: Choose from a rich set of field data types
- Role: Company Admin
- Story: As a Company Admin, I want to choose an appropriate data type when creating a custom field, so that captured data is stored, validated, and displayed according to its nature.
- Priority: High
- Source: FR 6.26.3 (Data Types)

## DMX-05: Configure single- and multi-select list fields
- Role: Company Admin
- Story: As a Company Admin, I want to configure list fields as single-select or multi-select with a defined set of options, so that users choose from controlled values.
- Priority: Medium
- Source: FR 6.26.3 (Data Types)

## DMX-06: Configure lookup/reference fields
- Role: Company Admin
- Story: As a Company Admin, I want to create lookup/reference fields, so that a custom field can reference another entity or record rather than storing a free-form value.
- Priority: Medium
- Source: FR 6.26.3 (Data Types)

## DMX-07: Mark custom fields as required or optional
- Role: Company Admin
- Story: As a Company Admin, I want to configure whether a custom field is required or optional, so that mandatory data is always captured while optional data stays flexible.
- Priority: High
- Source: FR 6.26.4 (Field Behaviors)

## DMX-08: Apply field masks and regex validation
- Role: Company Admin
- Story: As a Company Admin, I want to apply field masks and regular-expression validation to custom fields, so that entered data conforms to the required format.
- Priority: High
- Source: FR 6.26.4 (Field Behaviors)

## DMX-09: Search, report, and import/export on custom fields
- Role: Company Admin
- Story: As a Company Admin, I want custom fields to be searchable, included in import/export, and available for reporting, so that custom data is as usable as standard data.
- Priority: High
- Source: FR 6.26.5 (Integration)

## DMX-10: Use custom fields in workflows and APIs
- Role: Company Admin
- Story: As a Company Admin, I want custom fields to be available in workflow conditions and accessible via APIs, so that automation and integrations can act on custom data.
- Priority: Medium
- Source: FR 6.26.5 (Integration)

## DMX-11: Configure file/attachment custom fields
- Role: Company Admin
- Story: As a Company Admin, I want to create file/attachment custom fields, so that users can attach supporting documents directly to records.
- Priority: Medium
- Source: FR 6.26.3 (Data Types)

## DMX-12: Enter and view custom field data on records
- Role: Employee (User)
- Story: As an Employee (User), I want to view and populate the custom fields configured on the records I access, so that I can provide and see the organization-specific data required of me.
- Priority: Medium
- Source: FR 6.26.3, FR 6.26.4 (Data Types & Field Behaviors)

## DMX-13: Custom fields captured on non-user employee records
- Role: Employee (Non-User)
- Story: As an Employee (Non-User), I want custom fields on my employee record to be captured and maintained by an administrator, so that my organization-specific data is complete even though I do not log in.
- Priority: Low
- Source: FR 6.26.1, FR 6.26.5 (Supported Entities & Integration)

## DMX-14: Manage custom fields across group companies
- Role: Group Company Admin
- Story: As a Group Company Admin, I want to define and manage custom fields for the companies within my group, so that grouped tenants share consistent organization-specific data structures.
- Priority: Medium
- Source: FR 6.26.1, FR 6.26.2 (Supported Entities & Scope Levels)

## DMX-15: Oversee custom field definitions across the portfolio
- Role: Portfolio Admin
- Story: As a Portfolio Admin, I want visibility and governance over custom field definitions across the companies in my portfolio, so that data model extensions remain consistent and compliant.
- Priority: Low
- Source: FR 6.26.2, FR 6.26.5 (Scope Levels & Integration)

## DMX-16: Persist custom field values in tenant-scoped storage with row-level isolation
- Role: Platform Admin
- Story: As a Platform Admin, I want custom field values to be persisted in the canonical data model with tenant-scoped, row-level-secured storage, so that one company's custom data can never be read or written by another tenant.
- Priority: High
- Source: FR 6.26.2 (L1 persistence / RLS)

## DMX-17: Track effective-dated history of custom field values
- Role: Company Admin
- Story: As a Company Admin, I want changes to custom field values to be captured with the platform's bitemporal history, so that I can see what a custom value was as of any point in time and audit who changed it.
- Priority: Medium
- Source: FR 6.26.1 (L1 bitemporal history)

## DMX-18: Version and effective-date custom field definitions as governed config
- Role: Platform Admin
- Story: As a Platform Admin, I want custom field definitions (type, options, mask, regex, required flag, scope) to be versioned and effective-dated as governed metadata, so that schema changes are auditable and take effect without code deployment.
- Priority: Medium
- Source: FR 6.26.4, FR 6.26.2 (L2 config versioning)

## DMX-19: Forms/Dynamic-Fields engine renders and validates custom fields generically from schema
- Role: Company Admin
- Story: As a Company Admin, I want the shared Forms/Dynamic-Fields engine to render and validate every custom field purely from its metadata definition, so that new fields work everywhere immediately without bespoke code per field.
- Priority: High
- Source: FR 6.26.3, FR 6.26.4 (L3 Forms/Dynamic-Fields engine)

## DMX-20: Rules and Workflow engines evaluate custom fields at runtime
- Role: Company Admin
- Story: As a Company Admin, I want the shared Rules and Workflow engines to read custom field values as first-class inputs when evaluating decision tables and approval conditions, so that automation reacts to organization-specific data.
- Priority: Medium
- Source: FR 6.26.5 (L3 Rules/Workflow engines)

## DMX-21: Metadata-driven SPA surfaces custom fields on forms, grids, and search
- Role: Employee (User)
- Story: As an Employee (User), I want the metadata-driven UI to surface custom fields automatically in the forms, list grids, and search filters I use, so that custom data is a seamless part of the experience without waiting for a UI release.
- Priority: Medium
- Source: FR 6.26.5 (L4 presentation)
