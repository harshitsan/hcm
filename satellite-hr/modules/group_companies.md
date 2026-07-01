# 6.3 Group Companies

## Purpose
Represent related companies such as subsidiaries, sister concerns, or affiliated entities.

## Functional Requirements

1. The system shall support definition of group-company relationships with multiple related companies.

2. The group-company construct shall enable shared administrative scenarios and shared locations across related companies, subject to explicit authorization and auditability.

3. **Consolidated Reporting and Directory Access:**
   - Consolidated reporting and cross-company directory search enabled only when: companies are explicitly linked via Group-Company construct, cross-company access is explicitly enabled, and users have been granted explicit group-level roles.
   - Security constraints: Row-level security filters apply; audit trail maintained for all cross-company access.
