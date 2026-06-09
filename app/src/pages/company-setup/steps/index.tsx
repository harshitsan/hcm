/**
 * Single source of truth for step ordering, labels, icons and phase grouping.
 * The rail, the progress bar, and the step body all derive from this array —
 * adding or reordering a step is one edit here.
 */
import {
  Building2, MapPin, Network, CalendarDays, SlidersHorizontal, ShieldCheck,
  FileText, GitBranch, FileSignature, Package, Users, KeyRound, Send, Rocket,
  type LucideIcon,
} from 'lucide-react'
import type { StepProps } from '../shared'
import { CompanyProfileStep, LocationsStep, OrgStructureStep, CalendarsStep, CustomFieldsStep } from './foundation'
import { AccessModelStep, PoliciesStep, WorkflowsStep, TemplatesStep, AssetsStep } from './configuration'
import { PeopleStep, ProvisionStep, DistributeStep, GoLiveStep } from './rollout'

export type Phase = 'Foundation' | 'Configuration' | 'Rollout'

export type StepDef = {
  key: string
  label: string
  icon: LucideIcon
  phase: Phase
  hint: string
  Component: (props: StepProps) => React.ReactNode
}

export const STEPS: StepDef[] = [
  { key: 'profile', label: 'Company profile', icon: Building2, phase: 'Foundation', hint: 'Name, registration IDs, and the jurisdictions you operate in.', Component: CompanyProfileStep },
  { key: 'locations', label: 'Locations', icon: MapPin, phase: 'Foundation', hint: 'Your offices, plants, stores and remote hubs.', Component: LocationsStep },
  { key: 'org', label: 'Org structure', icon: Network, phase: 'Foundation', hint: 'Departments (with heads) → positions → groups.', Component: OrgStructureStep },
  { key: 'calendars', label: 'Calendars', icon: CalendarDays, phase: 'Foundation', hint: 'Holiday calendars and work shifts.', Component: CalendarsStep },
  { key: 'fields', label: 'Custom fields', icon: SlidersHorizontal, phase: 'Foundation', hint: 'Extra data fields to capture before importing people.', Component: CustomFieldsStep },

  { key: 'access', label: 'Access model', icon: ShieldCheck, phase: 'Configuration', hint: 'Define and confirm roles and who gets what.', Component: AccessModelStep },
  { key: 'policies', label: 'Policies', icon: FileText, phase: 'Configuration', hint: 'Leave types & rules, attendance rules, and applicability.', Component: PoliciesStep },
  { key: 'workflows', label: 'Workflows', icon: GitBranch, phase: 'Configuration', hint: 'Approval chains, SLAs and escalations.', Component: WorkflowsStep },
  { key: 'templates', label: 'Templates', icon: FileSignature, phase: 'Configuration', hint: 'Letter and notification templates.', Component: TemplatesStep },
  { key: 'assets', label: 'Asset categories', icon: Package, phase: 'Configuration', hint: 'Categories — if you track assets.', Component: AssetsStep },

  { key: 'people', label: 'Bring in people', icon: Users, phase: 'Rollout', hint: 'Bulk-import or create employees; set the manager hierarchy.', Component: PeopleStep },
  { key: 'provision', label: 'Provision access', icon: KeyRound, phase: 'Rollout', hint: 'Assign roles and trigger onboarding checklists.', Component: ProvisionStep },
  { key: 'distribute', label: 'Distribute policies', icon: Send, phase: 'Rollout', hint: 'Push policies out for acknowledgment.', Component: DistributeStep },
  { key: 'golive', label: 'Go live', icon: Rocket, phase: 'Rollout', hint: 'Review, then bring the company online.', Component: GoLiveStep },
]

export const PHASES: Phase[] = ['Foundation', 'Configuration', 'Rollout']

export type { StepProps }
