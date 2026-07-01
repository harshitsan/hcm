# Reporting and Analytics — User Stories

## RPT-01: Standard operational and management reports library
- Role: Company Admin
- Story: As a Company Admin, I want a library of standard reports covering workforce management, organization structure, leave and attendance, talent acquisition, lifecycle workflows, asset management, and policy compliance, so that I can meet routine operational, management, compliance, and analytical reporting needs without building reports from scratch.
- Priority: High
- Source: FR 6.23.1 (Standard Reports)

## RPT-02: Workforce management and organization structure reports
- Role: Company Admin
- Story: As a Company Admin, I want workforce management and organization structure reports, so that I can understand headcount, workforce composition, and the reporting hierarchy across the company.
- Priority: High
- Source: FR 6.23.1 (Standard Reports)

## RPT-03: Leave, attendance, and asset management reports
- Role: Company Admin
- Story: As a Company Admin, I want standard leave and attendance and asset management reports, so that I can monitor my team's time records and assigned assets.
- Priority: Medium
- Source: FR 6.23.1 (Standard Reports)

## RPT-04: Interactive dashboards with charts KPIs and drill-down
- Role: Company Admin
- Story: As a Company Admin, I want interactive dashboards with charts, KPIs, and drill-down capabilities, so that I can monitor key metrics visually and investigate details on demand.
- Priority: High
- Source: FR 6.23.2 (Dashboards)

## RPT-05: Role-based default dashboards
- Role: Platform Admin
- Story: As a Platform Admin, I want the system to present role-based default dashboards, so that each user sees metrics relevant to their role upon login.
- Priority: Medium
- Source: FR 6.23.2 (Dashboards)

## RPT-06: Ad hoc report builder with field selection
- Role: Company Admin
- Story: As a Company Admin, I want an ad hoc report builder where I can select fields, so that I can construct custom reports tailored to specific questions.
- Priority: Medium
- Source: FR 6.23.3 (Ad Hoc Reporting)

## RPT-07: Ad hoc filtering and grouping
- Role: Company Admin
- Story: As a Company Admin, I want to apply filtering and grouping in the ad hoc report builder, so that I can narrow and organize results meaningfully.
- Priority: Medium
- Source: FR 6.23.3 (Ad Hoc Reporting)

## RPT-08: Saved ad hoc report views
- Role: Company Admin
- Story: As a Company Admin, I want to save my ad hoc report configurations as views, so that I can reuse them without rebuilding.
- Priority: Medium
- Source: FR 6.23.3 (Ad Hoc Reporting)

## RPT-09: Scheduled report delivery via email
- Role: Company Admin
- Story: As a Company Admin, I want to schedule reports for delivery via email with configurable frequency options, so that stakeholders receive reports automatically without manual effort.
- Priority: Medium
- Source: FR 6.23.4 (Scheduled Reports)

## RPT-10: Statutory compliance reports and registers
- Role: Company Admin
- Story: As a Company Admin, I want compliance reports including PF/ESIC eligibility, attendance registers, leave registers, and wage register templates, so that I can satisfy statutory reporting obligations.
- Priority: High
- Source: FR 6.23.5 (Compliance Reports)

## RPT-11: Statutory data completeness reporting
- Role: Company Admin
- Story: As a Company Admin, I want statutory data completeness reports, so that I can identify missing required data before statutory filing.
- Priority: High
- Source: FR 6.23.5 (Compliance Reports)

## RPT-12: Company-scoped report security with cross-company access
- Role: Platform Admin
- Story: As a Platform Admin, I want reports filtered by company access while allowing cross-company reporting for authorized portfolio/group company users, so that data confidentiality is preserved while authorized users get consolidated views.
- Priority: High
- Source: FR 6.23.6 (Security)

## RPT-13: Talent acquisition lifecycle and policy compliance reports
- Role: Company Admin
- Story: As a Company Admin, I want standard talent acquisition, employee lifecycle workflow, and policy compliance reports, so that I can track recruitment progress, workflow status, and policy adherence.
- Priority: Medium
- Source: FR 6.23.1 (Standard Reports)

## RPT-14: Self-service dashboard for own data
- Role: Employee (User)
- Story: As an Employee (User), I want a self-service dashboard showing my own metrics, so that I can view my leave balances, attendance, and relevant personal information at a glance.
- Priority: Medium
- Source: FR 6.23.2 (Dashboards)

## RPT-15: Self-service reports on own records
- Role: Employee (User)
- Story: As an Employee (User), I want to run self-service reports limited to my own records, so that I can review my personal leave, attendance, and asset information without seeing others' data.
- Priority: Low
- Source: FR 6.23.6 (Security)

## RPT-16: Inclusion of non-user employees in registers and compliance reports
- Role: Employee (Non-User)
- Story: As an Employee (Non-User) whose data is maintained by HR, I want to be included in registers and compliance reports even though I have no login, so that statutory registers and completeness checks cover the entire workforce.
- Priority: Medium
- Source: FR 6.23.5 (Compliance Reports)

## RPT-17: Cross-company consolidated reporting for portfolio
- Role: Portfolio Admin
- Story: As a Portfolio Admin, I want cross-company reporting and consolidated dashboards spanning all companies in my portfolio, so that I can get an enterprise-wide view while still respecting authorization boundaries.
- Priority: High
- Source: FR 6.23.6 (Security)

## RPT-18: Cross-company reporting within group company
- Role: Group Company Admin
- Story: As a Group Company Admin, I want cross-company reporting and dashboards spanning the companies within my group company, so that I can produce consolidated group-level reports for authorized companies only.
- Priority: High
- Source: FR 6.23.6 (Security)

## RPT-19: Point-in-time and historical (as-of) reporting from bitemporal data
- Role: Company Admin
- Story: As a Company Admin, I want reports to draw on the bitemporal, effective-dated data model so that I can run point-in-time (as-of a chosen date) reports and see historically accurate values rather than only the current state.
- Priority: Medium
- Source: FR 6.23.1 (L1 domain/data)

## RPT-20: Tenant-scoped row-level data isolation underlying all report queries
- Role: Platform Admin
- Story: As a Platform Admin, I want every report query to execute against tenant-scoped, row-level-secured storage so that company-access filtering is enforced at the data layer regardless of how a report is built.
- Priority: High
- Source: FR 6.23.6 (L1 data / RLS)

## RPT-21: Governed versioned effective-dated statutory report and register templates
- Role: Platform Admin
- Story: As a Platform Admin, I want statutory register and report templates (wage register, attendance register, leave register, PF/ESIC formats) maintained as per-tenant governed config that is versioned and effective-dated, so that statutory format changes can be applied without code changes.
- Priority: High
- Source: FR 6.23.5 (L2 config)

## RPT-22: Configurable per-tenant role-based dashboard and report-catalog definitions
- Role: Platform Admin
- Story: As a Platform Admin, I want role-based default dashboards and the standard report catalog defined as per-tenant governed config, so that which dashboards and reports each role sees can be changed without code.
- Priority: Medium
- Source: FR 6.23.2 (L2 config)

## RPT-23: Metadata-driven field catalog including custom fields for the ad hoc builder
- Role: Company Admin
- Story: As a Company Admin, I want the ad hoc report builder's available fields to be driven by the tenant's field metadata schema, including custom/UDF fields, so that newly configured fields become reportable without code changes.
- Priority: Medium
- Source: FR 6.23.3 (L2 config)

## RPT-24: Notification engine executes scheduled report generation and email delivery
- Role: Platform Admin
- Story: As a Platform Admin, I want scheduled reports to be generated and delivered by the shared Notification/Template engine reading the schedule config, so that delivery, templating, and retries are handled consistently by the engine.
- Priority: Medium
- Source: FR 6.23.4 (L3 Notification/Template engine)

## RPT-25: Rules engine evaluates statutory eligibility via decision tables for compliance reports
- Role: Platform Admin
- Story: As a Platform Admin, I want PF/ESIC eligibility and statutory completeness in compliance reports to be evaluated by the shared Rules engine using configured decision tables, so that eligibility logic changes are config-driven and consistent.
- Priority: High
- Source: FR 6.23.5 (L3 Rules engine)
