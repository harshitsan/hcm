# 6.26 Data Model Extensibility

## Purpose
Allow customers to extend the platform data model with custom fields.

## Functional Requirements

1. **Supported Entities** - Companies, Locations, Departments, Groups, Positions, and Employees.

2. **Scope Levels** - Platform-level fields (available across all companies) and Company-level fields (tenant-specific).

3. **Data Types** - Single-line text, multi-line text, number, decimal, currency, percentage, boolean, date, date-time, single/multi-select lists, lookup/reference, email, phone, URL, and file/attachment.

4. **Field Behaviors** - Required/optional configuration, field masks, and validation using regular expressions.

5. **Integration** - Custom fields searchable, available in workflow conditions, accessible via APIs, included in import/export, and available for reporting.
