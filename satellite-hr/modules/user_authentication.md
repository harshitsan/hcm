# 6.1 User Authentication

## Purpose
Provide secure access to the application through multiple authentication options while supporting multi-company access.

## Functional Requirements

1. The system shall support authentication through: SAML, Active Directory, Office 365, Google Apps, and Email/Password login.

2. The system shall maintain a distinct `User` entity separate from `Employee` and `Contractor` records.

3. The system shall allow a single user to belong to multiple companies with different roles and permissions in each.

4. The system shall allow authorized multi-company users to switch company context within the same authenticated session without logging out.

5. The system shall support scenarios where:
   - a user is linked to an employee in one company
   - a user is not linked to any workforce record
   - an employee exists without a linked user account

6. The system shall support secure password management for local login users and maintain authentication audit logs.
