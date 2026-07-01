# Portfolio Management — User Stories

## PORT-01: Create portfolio with core attributes
- Role: Platform Admin
- Story: As a Platform Admin, I want to create a portfolio capturing name, description, manager, and associated companies so that shared-services teams can administer multiple companies together.
- Priority: High
- Source: PORT-FR-001 (§3.2.1), §7.1 RBAC Create Portfolio, §4.2.2 Portfolio Entity

## PORT-02: Validate portfolio name and description fields
- Role: Platform Admin
- Story: As a Platform Admin, I want portfolio name and description validated so that portfolio records stay consistent and unique.
- Priority: High
- Source: PORT-FR-001 (§3.2.1), §4.2.2 Portfolio Entity, PORT_001 (§9)

## PORT-03: Enforce one-portfolio-per-company constraint
- Role: Platform Admin
- Story: As a Platform Admin, I want the system to prevent a company from belonging to more than one portfolio so that portfolio ownership stays unambiguous.
- Priority: High
- Source: PORT-FR-002 (§3.2.1), PORT_002 (§9), §4.2.3 PortfolioCompany

## PORT-04: Enforce portfolio manager role requirement
- Role: Platform Admin
- Story: As a Platform Admin, I want the assigned portfolio manager to hold the Portfolio Manager role so that only authorized users manage a portfolio.
- Priority: High
- Source: PORT-FR-002 (§3.2.1), §4.2.2 Portfolio Entity

## PORT-05: Enforce minimum one company per portfolio
- Role: Platform Admin
- Story: As a Platform Admin, I want a portfolio to contain at least one company after creation so that portfolios are never left empty in operation.
- Priority: Medium
- Source: PORT-FR-002 (§3.2.1)

## PORT-06: Add companies to an existing portfolio
- Role: Platform Admin
- Story: As a Platform Admin, I want to add companies to an existing portfolio so that the shared-services team can expand its scope.
- Priority: High
- Source: PORT-FR-003 (§3.2.1), §4.2.3 PortfolioCompany, PORT_002 (§9)

## PORT-07: Remove companies from a portfolio with confirmation
- Role: Portfolio Admin
- Story: As a Portfolio Admin, I want to remove a company from my portfolio with a confirmation step so that I do not accidentally detach a company.
- Priority: Medium
- Source: PORT-FR-003 (§3.2.1), §7.1 RBAC Add/Remove Companies

## PORT-08: Change portfolio manager
- Role: Platform Admin
- Story: As a Platform Admin, I want to change the manager assigned to a portfolio so that management responsibility can be reassigned.
- Priority: Medium
- Source: PORT-FR-003 (§3.2.1), §8 PORTFOLIO_MODIFIED

## PORT-09: Update portfolio description
- Role: Portfolio Admin
- Story: As a Portfolio Admin, I want to update my portfolio's description so that its purpose stays accurate.
- Priority: Low
- Source: PORT-FR-003 (§3.2.1), §8 PORTFOLIO_MODIFIED

## PORT-10: View portfolios list
- Role: Platform Admin
- Story: As a Platform Admin, I want to view the list of portfolios with manager and company summary so that I can oversee shared-services structures.
- Priority: Medium
- Source: §5.4 Portfolio Management UI, §7.1 RBAC

## PORT-11: Create portfolio via API
- Role: Platform Admin
- Story: As a Platform Admin integrator, I want to create a portfolio via the API so that portfolios can be provisioned programmatically.
- Priority: High
- Source: §6.2.1 Create Portfolio API, PORT-FR-001, PORT_001/PORT_002 (§9)

## PORT-12: Company context switcher dropdown
- Role: Group Company Admin
- Story: As a multi-company user, I want a company context selector in the header so that I can switch the company I am working in.
- Priority: High
- Source: PORT-FR-004 (§3.2.2), §5.5 Company Context Switcher

## PORT-13: Validate authorization on context switch
- Role: Group Company Admin
- Story: As a user, I want the system to validate my authorization before switching company context so that I cannot access unauthorized companies.
- Priority: High
- Source: PORT-FR-005 (§3.2.2), AUTH_002 (§9), §7.1 RBAC Context Switching

## PORT-14: Load target company configuration and security on switch
- Role: Group Company Admin
- Story: As a user, I want the target company's configuration and security policies applied when I switch context so that I operate under the correct company settings.
- Priority: High
- Source: PORT-FR-005 (§3.2.2), §6.2.2 Switch Company Context API, §7.2 Session Binding

## PORT-15: Maintain session state across context switch
- Role: Group Company Admin
- Story: As a user, I want my in-progress HR actions preserved when I switch company context so that I do not lose unsaved work.
- Priority: Medium
- Source: PORT-FR-005 (§3.2.2)

## PORT-16: Switch company context via API
- Role: Group Company Admin
- Story: As an integrator, I want a switch-company API so that context can be changed programmatically.
- Priority: High
- Source: §6.2.2 Switch Company Context API, PORT-FR-005, AUTH_002 (§9)

## PORT-17: Bookmarkable company-context URLs
- Role: Group Company Admin
- Story: As a user, I want bookmarkable URLs that carry the company context so that I can return directly to a specific company.
- Priority: Medium
- Source: PORT-FR-006 (§3.2.2)

## PORT-18: Display company context indicator
- Role: Group Company Admin
- Story: As a user, I want a clear company context indicator so that I always know which company I am operating in.
- Priority: Medium
- Source: PORT-FR-007 (§3.2.2), §5.5 Company Context Switcher

## PORT-19: Portfolio-level reporting with company filter and consolidated metrics
- Role: Portfolio Admin
- Story: As a Portfolio Admin, I want portfolio-level reports with a company filter and consolidated metrics so that I can analyze performance across my portfolio.
- Priority: High
- Source: PORT-FR-008 (§3.2.3)

## PORT-20: Export portfolio reports
- Role: Portfolio Admin
- Story: As a Portfolio Admin, I want to export portfolio reports so that I can share consolidated data outside the system.
- Priority: Medium
- Source: PORT-FR-008 (§3.2.3)

## PORT-21: Per-company bulk employee import
- Role: Portfolio Admin
- Story: As a Portfolio Admin, I want to run bulk employee imports per company within my portfolio so that I can onboard employees efficiently.
- Priority: Medium
- Source: PORT-FR-009 (§3.2.3), PORT-FR-010 (§3.2.3)

## PORT-22: Cross-company employee search and view
- Role: Portfolio Admin
- Story: As a Portfolio Admin, I want to search and view employees across companies in my portfolio so that I can locate people quickly.
- Priority: Medium
- Source: PORT-FR-009 (§3.2.3), §7.2 Tenant Isolation, §8 audit

## PORT-23: Standardized policy deployment across companies
- Role: Portfolio Admin
- Story: As a Portfolio Admin, I want to deploy a standardized policy to multiple companies in my portfolio so that policies stay consistent.
- Priority: Medium
- Source: PORT-FR-009 (§3.2.3), PORT-FR-010 (§3.2.3)

## PORT-24: Portfolio-wide announcements
- Role: Portfolio Admin
- Story: As a Portfolio Admin, I want to broadcast announcements portfolio-wide so that all companies in the portfolio receive consistent communication.
- Priority: Low
- Source: PORT-FR-009 (§3.2.3), PORT-FR-010 (§3.2.3)

## PORT-25: Audit trail for portfolio-level operations
- Role: Platform Admin
- Story: As a Platform Admin, I want every portfolio-level operation captured in an audit trail so that cross-company actions are traceable and compliant.
- Priority: High
- Source: PORT-FR-010 (§3.2.3), §8 PORTFOLIO_CREATED/PORTFOLIO_MODIFIED/CONTEXT_SWITCHED, §8.2 Retention

## PORT-26: Record CONTEXT_SWITCHED audit event
- Role: Platform Admin
- Story: As a Platform Admin, I want each company context switch logged so that cross-company access is fully auditable.
- Priority: High
- Source: §8 CONTEXT_SWITCHED, PORT-FR-005, §7.2 Audit Logging, AUTH_002 (§9)

## PORT-27: Portfolio status lifecycle
- Role: Platform Admin
- Story: As a Platform Admin, I want a portfolio to carry a status so that inactive portfolios can be distinguished from active ones.
- Priority: Low
- Source: §4.2.2 Portfolio Entity, §8 PORTFOLIO_MODIFIED
