/**
 * Governed authentication configuration: available methods (FR 6.1.1),
 * tenant password policy as versioned effective-dated config (AUTH-17) and
 * notification templates rendered by the shared engine (AUTH-18).
 */

import { type AuthMethod } from './auth-users'

export interface AuthMethodConfig {
  method: AuthMethod
  enabled: boolean
  /** Provider connection endpoint — validated + stored securely (AUTH-10). */
  connectionUrl: string | null
  lastValidated: string | null
}

export const seedMethodConfigs: AuthMethodConfig[] = [
  { method: 'password', enabled: true, connectionUrl: null, lastValidated: null },
  { method: 'saml', enabled: true, connectionUrl: 'https://idp.aurorahold.example/sso/saml2', lastValidated: '2026-06-14' },
  { method: 'active-directory', enabled: true, connectionUrl: 'ldaps://ad.northwind.example:636', lastValidated: '2026-05-30' },
  { method: 'office365', enabled: true, connectionUrl: 'https://login.microsoftonline.com/northwind', lastValidated: '2026-06-22' },
  { method: 'google', enabled: false, connectionUrl: null, lastValidated: null },
]

export interface PasswordPolicyVersion {
  version: number
  minLength: number
  requireUppercase: boolean
  requireNumber: boolean
  requireSymbol: boolean
  expiryDays: number
  /** Number of previous passwords that cannot be reused. */
  historyCount: number
  lockoutThreshold: number
  effectiveFrom: string
  savedBy: string
}

export const seedPolicyVersions: PasswordPolicyVersion[] = [
  {
    version: 1,
    minLength: 8,
    requireUppercase: true,
    requireNumber: true,
    requireSymbol: false,
    expiryDays: 180,
    historyCount: 3,
    lockoutThreshold: 10,
    effectiveFrom: '2024-06-01',
    savedBy: 'Astrid Lindqvist',
  },
  {
    version: 2,
    minLength: 10,
    requireUppercase: true,
    requireNumber: true,
    requireSymbol: true,
    expiryDays: 120,
    historyCount: 5,
    lockoutThreshold: 8,
    effectiveFrom: '2025-04-15',
    savedBy: 'Priya Raman',
  },
  {
    version: 3,
    minLength: 12,
    requireUppercase: true,
    requireNumber: true,
    requireSymbol: true,
    expiryDays: 90,
    historyCount: 5,
    lockoutThreshold: 5,
    effectiveFrom: '2026-07-01',
    savedBy: 'Priya Raman',
  },
]

export interface NotificationTemplate {
  id: string
  name: string
  trigger: string
  channel: 'Email' | 'Email + In-app'
  subject: string
  /** True once a tenant has customized it away from the platform default. */
  customized: boolean
}

export const seedTemplates: NotificationTemplate[] = [
  {
    id: 'tpl-01',
    name: 'Password Reset',
    trigger: 'Password reset requested',
    channel: 'Email',
    subject: 'Reset your SatelliteHR password',
    customized: false,
  },
  {
    id: 'tpl-02',
    name: 'Password Changed',
    trigger: 'Password changed successfully',
    channel: 'Email + In-app',
    subject: 'Your password was changed',
    customized: true,
  },
  {
    id: 'tpl-03',
    name: 'Security Alert',
    trigger: 'Login from a new context',
    channel: 'Email + In-app',
    subject: 'New sign-in to your account',
    customized: false,
  },
  {
    id: 'tpl-04',
    name: 'Account Invitation',
    trigger: 'User account created',
    channel: 'Email',
    subject: 'You have been invited to SatelliteHR',
    customized: true,
  },
]
