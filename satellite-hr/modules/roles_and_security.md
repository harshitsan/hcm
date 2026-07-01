# 6.12 Roles and Security

## Purpose
Control access to data and system functions through role-based access control (RBAC).

## Functional Requirements

1. The system shall implement Role-Based Access Control (RBAC) with roles defined at platform, portfolio, group-company, and company levels.

2. Users may have different roles in different companies. Security rules shall support access restrictions based on company, group, department, and workforce type.

3. **Delegation** - Users shall be able to delegate activities to another user within the same company; approvals visible to managers and appropriate hierarchy members.

4. **Impersonation** - Support "login as user" capability for authorized support users with full audit logging.

5. **Multi-Factor Authentication (MFA)** - Configurable at company level.

6. Company context switching by multi-company users shall be secure, explicit, auditable, and limited to authorized companies only.
