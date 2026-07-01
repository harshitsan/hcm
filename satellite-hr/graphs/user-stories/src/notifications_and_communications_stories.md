# Notifications and Communications — User Stories

## NTF-01: Mandatory email notification channel
- Role: Company Admin
- Story: As a Company Admin, I want email to be available as a mandatory, always-on notification channel, so that all critical HRMS communications reliably reach every recipient regardless of other channel availability.
- Priority: High
- Source: FR 6.27.1 (Channels — Email mandatory)

## NTF-02: Optional in-app notifications
- Role: Employee (User)
- Story: As an Employee (User), I want to receive in-app notifications within the HRMS when the company enables them, so that I can see relevant updates without leaving the application.
- Priority: Medium
- Source: FR 6.27.1 (Channels — in-app optional)

## NTF-03: Microsoft Teams and WhatsApp connectors
- Role: Company Admin
- Story: As a Company Admin, I want to optionally enable Microsoft Teams and WhatsApp delivery via third-party connectors, so that employees can receive notifications on the messaging tools they already use.
- Priority: Low
- Source: FR 6.27.1 (Channels — Teams/WhatsApp via connectors, optional)

## NTF-04: Approval notifications
- Role: Company Admin
- Story: As a Company Admin, I want to receive approval notifications, so that I am promptly informed when items require my approval and can act without delay.
- Priority: High
- Source: FR 6.27.2 (Events — approval notifications)

## NTF-05: Escalation alerts
- Role: Company Admin
- Story: As a Company Admin, I want to receive escalation alerts, so that overdue or unattended items are surfaced to the right person before they are missed.
- Priority: High
- Source: FR 6.27.2 (Events — escalation alerts)

## NTF-06: Workflow status change notifications
- Role: Employee (User)
- Story: As an Employee (User), I want to be notified when the status of a workflow I am involved in changes, so that I stay aware of progress and outcomes.
- Priority: Medium
- Source: FR 6.27.2 (Events — workflow status changes)

## NTF-07: Reminders and lifecycle event notifications
- Role: Employee (User)
- Story: As an Employee (User), I want to receive reminders and lifecycle event notifications, so that I do not miss pending actions or key employment events.
- Priority: Medium
- Source: FR 6.27.2 (Events — reminders and lifecycle events)

## NTF-08: Event-driven delivery
- Role: Platform Admin
- Story: As a Platform Admin, I want the platform to deliver notifications in an event-driven manner, so that recipients are informed in real time as events occur.
- Priority: High
- Source: FR 6.27.3 (Delivery Models — event-driven)

## NTF-09: Scheduler-driven digests and summaries
- Role: Employee (User)
- Story: As an Employee (User), I want to receive scheduler-driven digests and summaries, so that I can consolidate multiple updates instead of receiving them individually.
- Priority: Medium
- Source: FR 6.27.3 (Delivery Models — scheduler-driven digests/summaries)

## NTF-10: Configurable branded templates
- Role: Company Admin
- Story: As a Company Admin, I want configurable notification templates with company branding, so that communications present a consistent, professional identity.
- Priority: Medium
- Source: FR 6.27.4 (Templating — configurable templates with branding)

## NTF-11: Template placeholders and dynamic data insertion
- Role: Company Admin
- Story: As a Company Admin, I want templates to support placeholders and dynamic data insertion, so that each notification is populated with the correct context-specific details.
- Priority: Medium
- Source: FR 6.27.4 (Templating — placeholders and dynamic data insertion)

## NTF-12: User notification preferences
- Role: Employee (User)
- Story: As an Employee (User), I want to configure my channel preferences, event subscriptions, and delivery frequency, so that I receive notifications the way I prefer.
- Priority: Medium
- Source: FR 6.27.5 (User Preferences — channels, subscriptions, frequency)

## NTF-13: Configure third-party notification connectors
- Role: Platform Admin
- Story: As a Platform Admin, I want to provision and manage the Microsoft Teams and WhatsApp third-party connectors, so that these optional messaging channels can be made available for companies to use.
- Priority: Low
- Source: FR 6.27.1 (Channels — Teams/WhatsApp via connectors, optional)

## NTF-14: Email notifications for non-user employees
- Role: Employee (Non-User)
- Story: As an Employee (Non-User), I want to receive lifecycle and event notifications by email, so that I stay informed about my employment events even though I do not have HRMS application access.
- Priority: Medium
- Source: FR 6.27.1, FR 6.27.2 (Channels/Events — email delivery for non-user employees)

## NTF-15: Group-level branded templates and notification configuration
- Role: Group Company Admin
- Story: As a Group Company Admin, I want to configure branded notification templates and channel settings across the companies in my group, so that communications are consistent within the group while allowing company-level specialization.
- Priority: Medium
- Source: FR 6.27.4, FR 6.27.1 (Templating/Channels — group-level configuration)

## NTF-16: Portfolio-wide notification oversight and defaults
- Role: Portfolio Admin
- Story: As a Portfolio Admin, I want to set default notification channels, templates, and event configurations across my portfolio, so that all group companies start from consistent communication standards.
- Priority: Low
- Source: FR 6.27.1, FR 6.27.4, FR 6.27.5 (Portfolio-level notification defaults and oversight)

## NTF-17: Configure digest schedules and event delivery models
- Role: Company Admin
- Story: As a Company Admin, I want to configure which events are event-driven versus batched into scheduler-driven digests and set the digest schedules, so that employees receive the right balance of real-time and consolidated communications.
- Priority: Medium
- Source: FR 6.27.3, FR 6.27.2 (Delivery Models — event-driven vs scheduler-driven configuration)

## NTF-18: Persist notification and per-channel delivery records
- Role: Platform Admin
- Story: As a Platform Admin, I want every generated notification and its per-channel delivery outcome persisted as auditable records, so that delivery can be traced, retried, and reported on.
- Priority: High
- Source: FR 6.27.2, FR 6.27.3 (L1 data — notification and delivery records)

## NTF-19: Tenant-scoped isolation of notification data
- Role: Platform Admin
- Story: As a Platform Admin, I want notification records, templates, and user preferences stored under tenant-scoped isolation (RLS), so that no company can access another company's communications or configuration.
- Priority: High
- Source: FR 6.27.1 (L1 data — tenant-scoped storage / RLS)

## NTF-20: Versioned and effective-dated templates and preferences
- Role: Company Admin
- Story: As a Company Admin, I want templates and notification preferences stored as versioned, effective-dated records, so that changes are tracked and the correct version applies at send time.
- Priority: Medium
- Source: FR 6.27.4, FR 6.27.5 (L1 data — versioned/effective-dated config records)

## NTF-21: Notification engine resolves recipients channels and templates at dispatch
- Role: Platform Admin
- Story: As a Platform Admin, I want the shared Notification/Template engine to interpret per-tenant config at dispatch — resolving recipients, channels, and templates — so that notifications are produced consistently across all modules.
- Priority: High
- Source: FR 6.27.1, FR 6.27.4 (L3 engine — Notification/Template engine)

## NTF-22: Engine delivery guarantee with retry fallback and dead-letter
- Role: Platform Admin
- Story: As a Platform Admin, I want the notification engine to guarantee delivery through retry, email fallback, and dead-letter handling, so that notifications are not silently lost.
- Priority: High
- Source: FR 6.27.3 (L3 engine — delivery guarantee / retry / dead-letter)

## NTF-23: In-app notification center screen
- Role: Employee (User)
- Story: As an Employee (User), I want an in-app notification center in the SPA where I can view, filter, and manage my notifications, so that I can track and act on updates from one place.
- Priority: Medium
- Source: FR 6.27.1, FR 6.27.2 (L4 presentation — in-app notification center)

## NTF-24: Template editor screen with live preview
- Role: Company Admin
- Story: As a Company Admin, I want a template editor screen in the SPA with branding controls, placeholder insertion, and live preview, so that I can author notification templates without technical help.
- Priority: Medium
- Source: FR 6.27.4 (L4 presentation — template editor UX)
