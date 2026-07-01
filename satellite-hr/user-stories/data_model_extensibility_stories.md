# Data Model Extensibility — User Stories

_Derived from SatelliteHR Phase I BRD — module "Data Model Extensibility". 10 user stories._

---

## DMX-01: Extend supported entities with custom fields

**User story:** As a Company/HR Admin, I want to add custom fields to core entities such as Companies, Locations, Departments, Groups, Positions, and Employees, so that I can capture data unique to my organization without waiting for platform changes.

**Acceptance criteria:**
- Given I am configuring the data model, when I select an entity, then only the supported entities (Companies, Locations, Departments, Groups, Positions, Employees) are available for extension.
- Given I add a custom field to a supported entity, when I save it, then the field appears on records of that entity type.
- Given an entity is not in the supported list, when I attempt to extend it, then the option is unavailable.

**Priority:** High
**Source:** FR 6.26.1 (Supported Entities)

---

## DMX-02: Define platform-level custom fields

**User story:** As a Platform Admin, I want to define platform-level custom fields, so that the same field is available consistently across all companies on the platform.

**Acceptance criteria:**
- Given I create a field with platform-level scope, when I save it, then the field is available across all companies.
- Given a platform-level field exists, when a company views the entity, then the field is present without company-specific reconfiguration.

**Priority:** High
**Source:** FR 6.26.2 (Scope Levels)

---

## DMX-03: Define company-level (tenant-specific) custom fields

**User story:** As a Company/HR Admin, I want to define company-level custom fields, so that I can capture tenant-specific data without affecting other companies.

**Acceptance criteria:**
- Given I create a field with company-level scope, when I save it, then the field is available only within my company (tenant).
- Given a company-level field exists in one tenant, when another tenant views the same entity, then that field is not present.

**Priority:** High
**Source:** FR 6.26.2 (Scope Levels)

---

## DMX-04: Choose from a rich set of field data types

**User story:** As a Company/HR Admin, I want to choose an appropriate data type when creating a custom field, so that captured data is stored and validated according to its nature.

**Acceptance criteria:**
- Given I am creating a custom field, when I select its data type, then I can choose from single-line text, multi-line text, number, decimal, currency, percentage, boolean, date, date-time, single/multi-select lists, lookup/reference, email, phone, URL, and file/attachment.
- Given I select a data type, when data is entered into the field, then input is stored and displayed consistent with that type.

**Priority:** High
**Source:** FR 6.26.3 (Data Types)

---

## DMX-05: Configure single- and multi-select list fields

**User story:** As a Company/HR Admin, I want to configure list fields as single-select or multi-select with defined options, so that users choose from controlled values.

**Acceptance criteria:**
- Given I create a single-select list field, when a user edits a record, then they can select exactly one option.
- Given I create a multi-select list field, when a user edits a record, then they can select one or more options.

**Priority:** Medium
**Source:** FR 6.26.3 (Data Types)

---

## DMX-06: Configure lookup/reference fields

**User story:** As a Company/HR Admin, I want to create lookup/reference fields, so that a custom field can reference another entity or record rather than storing a free-form value.

**Acceptance criteria:**
- Given I create a lookup/reference field, when a user edits a record, then they can select a referenced record instead of typing a value.
- Given a referenced record exists, when the field is displayed, then it resolves to the referenced record.

**Priority:** Medium
**Source:** FR 6.26.3 (Data Types)

---

## DMX-07: Mark custom fields as required or optional

**User story:** As a Company/HR Admin, I want to configure whether a custom field is required or optional, so that mandatory data is always captured while optional data stays flexible.

**Acceptance criteria:**
- Given a custom field is marked required, when a user saves a record without a value, then the save is blocked with a validation message.
- Given a custom field is marked optional, when a user saves a record without a value, then the save succeeds.

**Priority:** High
**Source:** FR 6.26.4 (Field Behaviors)

---

## DMX-08: Apply field masks and regex validation

**User story:** As a Company/HR Admin, I want to apply field masks and regular-expression validation to custom fields, so that entered data conforms to the required format.

**Acceptance criteria:**
- Given a custom field has a field mask defined, when a user enters data, then input is formatted according to the mask.
- Given a custom field has a regex validation rule, when a user enters a value that fails the rule, then the value is rejected with a validation error.
- Given a value matches the regex rule, when the user saves, then the record is accepted.

**Priority:** High
**Source:** FR 6.26.4 (Field Behaviors)

---

## DMX-09: Search, report, and import/export on custom fields

**User story:** As a Company/HR Admin, I want custom fields to be searchable, included in import/export, and available for reporting, so that custom data is as usable as standard data.

**Acceptance criteria:**
- Given custom fields exist, when I run a search, then I can search by those fields.
- Given custom fields exist, when I import or export records, then the custom field values are included.
- Given custom fields exist, when I build a report, then the fields are available as reportable data.

**Priority:** High
**Source:** FR 6.26.5 (Integration)

---

## DMX-10: Use custom fields in workflows and APIs

**User story:** As a Company/HR Admin, I want custom fields to be available in workflow conditions and accessible via APIs, so that automation and integrations can act on custom data.

**Acceptance criteria:**
- Given custom fields exist, when I configure a workflow condition, then the custom fields are selectable as condition inputs.
- Given custom fields exist, when an integration calls the API, then the custom field values are accessible via the API.

**Priority:** Medium
**Source:** FR 6.26.5 (Integration)
