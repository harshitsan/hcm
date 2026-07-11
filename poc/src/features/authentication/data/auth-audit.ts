/**
 * Authentication audit log (FR 6.1.6). Records are append-only and read-only
 * from the review UI (AUTH-15); every login, logout, failure, password event,
 * linkage change and configuration change lands here.
 */

import { type AuthMethod } from './auth-users'

export const AUTH_EVENT_TYPES = [
  'login-success',
  'login-failure',
  'logout',
  'sso-login',
  'sso-rejected',
  'password-change',
  'password-reset-request',
  'password-reset-complete',
  'account-locked',
  'account-unlocked',
  'mfa-enrolled',
  'mfa-challenge',
  'context-switch',
  'membership-change',
  'link-change',
  'config-change',
  'notification-sent',
] as const

export type AuthEventType = (typeof AUTH_EVENT_TYPES)[number]

export const AUTH_EVENT_LABELS: Record<AuthEventType, string> = {
  'login-success': 'Login success',
  'login-failure': 'Login failure',
  logout: 'Logout',
  'sso-login': 'SSO login',
  'sso-rejected': 'SSO rejected',
  'password-change': 'Password change',
  'password-reset-request': 'Reset requested',
  'password-reset-complete': 'Reset completed',
  'account-locked': 'User locked out',
  'account-unlocked': 'Account unlocked',
  'mfa-enrolled': 'MFA enrolled',
  'mfa-challenge': 'MFA challenge',
  'context-switch': 'Context switch',
  'membership-change': 'Membership change',
  'link-change': 'Employee link change',
  'config-change': 'Config change',
  'notification-sent': 'Notification sent',
}

export type AuditOutcome = 'success' | 'failure' | 'info'

export interface AuthAuditEvent {
  id: string
  timestamp: string
  /** Who performed / experienced the event. */
  actor: string
  eventType: AuthEventType
  method: AuthMethod | null
  /** Tenant scope of the event, or null for platform-level events. */
  companyId: string | null
  outcome: AuditOutcome
  detail: string
}

export const seedAuditEvents: AuthAuditEvent[] = [
  {
    id: 'evt-9001',
    timestamp: '2026-07-01T14:05:12Z',
    actor: 'grace.okonkwo@northwind.example',
    eventType: 'sso-login',
    method: 'office365',
    companyId: 'co-01',
    outcome: 'success',
    detail: 'Federated identity resolved to User au-02; session bound to Northwind Retail roles.',
  },
  {
    id: 'evt-9002',
    timestamp: '2026-07-01T09:58:44Z',
    actor: 'meiling.chen@aurorahold.example',
    eventType: 'sso-login',
    method: 'saml',
    companyId: 'co-04',
    outcome: 'success',
    detail: 'SAML assertion accepted from idp.aurorahold.example.',
  },
  {
    id: 'evt-9003',
    timestamp: '2026-07-01T09:12:03Z',
    actor: 'unknown@northwind.example',
    eventType: 'login-failure',
    method: 'password',
    companyId: null,
    outcome: 'failure',
    detail: 'Invalid credentials. Generic error returned; field-level cause not disclosed.',
  },
  {
    id: 'evt-9004',
    timestamp: '2026-07-01T07:30:26Z',
    actor: 'astrid.lindqvist@satellitehr.example',
    eventType: 'login-success',
    method: 'password',
    companyId: 'co-06',
    outcome: 'success',
    detail: 'Local credential verified against bcrypt hash. Plain text never stored.',
  },
  {
    id: 'evt-9005',
    timestamp: '2026-06-30T16:47:51Z',
    actor: 'kofi.mensah@aurorahold.example',
    eventType: 'sso-login',
    method: 'google',
    companyId: 'co-04',
    outcome: 'success',
    detail: 'Google Apps OAuth flow completed.',
  },
  {
    id: 'evt-9006',
    timestamp: '2026-06-30T09:15:40Z',
    actor: 'priya.raman@northwind.example',
    eventType: 'context-switch',
    method: null,
    companyId: 'co-02',
    outcome: 'info',
    detail: 'Active company switched Northwind Retail → Northwind Logistics without re-authentication.',
  },
  {
    id: 'evt-9007',
    timestamp: '2026-06-29T18:22:10Z',
    actor: 'ravi.subramanian@aurorahold.example',
    eventType: 'login-failure',
    method: 'password',
    companyId: null,
    outcome: 'failure',
    detail: 'Account suspended; access denied. 3rd consecutive failure — lockout threshold at 5.',
  },
  {
    id: 'evt-9008',
    timestamp: '2026-06-28T06:15:02Z',
    actor: 'daniel.mercer@northwind.example',
    eventType: 'sso-login',
    method: 'active-directory',
    companyId: 'co-02',
    outcome: 'success',
    detail: 'Kerberos ticket validated via AD connector.',
  },
  {
    id: 'evt-9009',
    timestamp: '2026-06-27T11:41:33Z',
    actor: 'system',
    eventType: 'config-change',
    method: null,
    companyId: null,
    outcome: 'info',
    detail: 'Astrid Lindqvist enabled Google Apps authentication for the platform.',
  },
  {
    id: 'evt-9010',
    timestamp: '2026-06-26T15:38:29Z',
    actor: 'nadia.kowalczyk@meridianhealth.example',
    eventType: 'login-success',
    method: 'password',
    companyId: 'co-06',
    outcome: 'success',
    detail: 'Local credential verified; single-company user, Meridian Health set as active context.',
  },
  {
    id: 'evt-9011',
    timestamp: '2026-06-25T08:04:17Z',
    actor: 'leila.haddad@northwind.example',
    eventType: 'password-reset-request',
    method: 'password',
    companyId: null,
    outcome: 'info',
    detail: 'Secure reset link issued via notification engine (template: Password Reset).',
  },
  {
    id: 'evt-9012',
    timestamp: '2026-06-25T08:09:52Z',
    actor: 'leila.haddad@northwind.example',
    eventType: 'password-reset-complete',
    method: 'password',
    companyId: null,
    outcome: 'success',
    detail: 'New password accepted under policy v3 and stored hashed.',
  },
  {
    id: 'evt-9013',
    timestamp: '2026-06-24T13:55:08Z',
    actor: 'priya.raman@northwind.example',
    eventType: 'membership-change',
    method: null,
    companyId: 'co-03',
    outcome: 'info',
    detail: 'Payroll Admin role revoked for Leila Haddad in Northwind Foods (effective-dated, prior state retained).',
  },
  {
    id: 'evt-9014',
    timestamp: '2026-06-23T10:30:44Z',
    actor: 'grace.okonkwo@northwind.example',
    eventType: 'link-change',
    method: null,
    companyId: 'co-01',
    outcome: 'info',
    detail: 'User au-05 linked to employee record emp-103 (Leila Haddad). User and Employee remain distinct.',
  },
  {
    id: 'evt-9015',
    timestamp: '2026-06-22T16:12:36Z',
    actor: 'jonas.weber@meridianhealth.example',
    eventType: 'sso-rejected',
    method: 'office365',
    companyId: null,
    outcome: 'failure',
    detail: 'Identity provider rejected authentication; no application session created.',
  },
  {
    id: 'evt-9016',
    timestamp: '2026-06-21T09:47:19Z',
    actor: 'system',
    eventType: 'notification-sent',
    method: null,
    companyId: 'co-01',
    outcome: 'info',
    detail: 'New-context login alert delivered to grace.okonkwo@northwind.example (template: Security Alert).',
  },
  {
    id: 'evt-9017',
    timestamp: '2026-06-20T12:26:55Z',
    actor: 'system',
    eventType: 'config-change',
    method: null,
    companyId: 'co-01',
    outcome: 'info',
    detail: 'Password policy v3 saved by Priya Raman: min length 12, lockout at 5 attempts. Effective 2026-07-01.',
  },
  {
    id: 'evt-9018',
    timestamp: '2026-06-19T17:03:12Z',
    actor: 'astrid.lindqvist@satellitehr.example',
    eventType: 'logout',
    method: null,
    companyId: 'co-06',
    outcome: 'info',
    detail: 'Session terminated by user.',
  },
]
