/**
 * Module Registry — single source of truth for all 29 SatelliteHR modules.
 *
 * Later tasks import MODULE_REGISTRY, moduleByRoute, moduleByTarget,
 * submodulesFor, eventsForModule, and the types ModuleDef, SubmoduleDef,
 * ModuleFormDef, SidebarGroup from this file.
 *
 * Content sources:
 *  - routes / names / icons / groups  → sidebar-data.ts
 *  - submodules                        → each module's TabsTrigger values
 *  - events                            → designer MODULE_EVENT_MAP + A7 addition
 *  - entities                          → data-management/data/catalog.ts
 *  - forms                             → brief specification (minimum set)
 */

import type { LucideIcon } from 'lucide-react'
import {
  BadgeCheck,
  BellRing,
  BookText,
  BookUser,
  Boxes,
  Briefcase,
  Building,
  Building2,
  CalendarClock,
  CalendarDays,
  ChartColumnBig,
  DatabaseZap,
  FileCheck,
  FileSignature,
  FolderOpen,
  IdCard,
  KeyRound,
  Landmark,
  LayoutDashboard,
  MapPin,
  Megaphone,
  MessagesSquare,
  Milestone,
  Network,
  Package,
  Puzzle,
  ScrollText,
  ServerCog,
  ShieldCheck,
  SlidersHorizontal,
  UserCog,
  UserPlus,
  Workflow,
} from 'lucide-react'
import type { TargetModule } from '@/features/workflows/data/business-logic'

export type SidebarGroup =
  | 'Home'
  | 'Organization'
  | 'Workforce'
  | 'Policies & Comms'
  | 'Platform'
  | 'Administration'

export interface SubmoduleDef {
  id: string   // Tabs `value` inside the module page, e.g. 'config', 'requests'
  label: string
}

export interface ModuleFormDef {
  id: string          // '<moduleKey>.<form>', e.g. 'leave.apply'
  label: string
  extensible: boolean // FIXED = hand-built schema only; EXTENSIBLE = renders CustomFieldsSection
  fieldTarget?: string    // custom-field target (only when extensible) — typed FieldTarget after A6
  submitEvent?: string    // designer trigger event fired on submit (must exist in `events`)
}

export interface ModuleDef {
  id: string              // route key, matches MODULE_ACCESS keys, e.g. '/leave'
  name: string            // sidebar title, e.g. 'Leave Management'
  route: string
  icon: LucideIcon
  group: SidebarGroup
  targetModule?: TargetModule   // engine catalog name; undefined = no engine surface
  submodules: SubmoduleDef[]
  entities: string[]      // names from data-management/data/catalog.ts
  events: string[]        // absorbs designer MODULE_EVENT_MAP
  forms: ModuleFormDef[]
}

export const MODULE_REGISTRY: readonly ModuleDef[] = [
  // ─── Home ──────────────────────────────────────────────────────────────────
  {
    id: '/',
    name: 'Dashboard',
    route: '/',
    icon: LayoutDashboard,
    group: 'Home',
    targetModule: undefined,
    submodules: [],
    entities: [],
    events: [],
    forms: [],
  },

  // ─── Organization ──────────────────────────────────────────────────────────
  {
    id: '/companies',
    name: 'Companies',
    route: '/companies',
    icon: Building2,
    group: 'Organization',
    targetModule: 'Companies',
    submodules: [
      { id: 'directory', label: 'Directory' },
      { id: 'groups', label: 'Groups' },
      { id: 'subscriptions', label: 'Subscriptions' },
      { id: 'admin', label: 'Admin' },
    ],
    entities: ['Company'],
    events: ['Company created', 'Localization settings changed'],
    forms: [],
  },
  {
    id: '/group-companies',
    name: 'Group Companies',
    route: '/group-companies',
    icon: Building,
    group: 'Organization',
    targetModule: undefined,
    submodules: [
      { id: 'groups', label: 'Groups' },
      { id: 'reporting', label: 'Reporting' },
      { id: 'admin', label: 'Admin' },
    ],
    entities: [],
    events: [],
    forms: [],
  },
  {
    id: '/portfolios',
    name: 'Portfolios',
    route: '/portfolios',
    icon: Briefcase,
    group: 'Organization',
    targetModule: undefined,
    submodules: [
      { id: 'portfolios', label: 'Portfolios' },
      { id: 'context', label: 'Context' },
      { id: 'reporting', label: 'Reporting' },
      { id: 'admin', label: 'Admin' },
    ],
    entities: [],
    events: [],
    forms: [],
  },
  {
    id: '/jurisdictions',
    name: 'Jurisdictions',
    route: '/jurisdictions',
    icon: Landmark,
    group: 'Organization',
    targetModule: undefined,
    submodules: [
      { id: 'applicability', label: 'Applicability' },
      { id: 'catalog', label: 'Regions' },
      { id: 'assignments', label: 'Assignments' },
      { id: 'admin', label: 'Admin' },
    ],
    entities: [],
    events: [],
    forms: [],
  },
  {
    id: '/locations',
    name: 'Locations',
    route: '/locations',
    icon: MapPin,
    group: 'Organization',
    targetModule: 'Locations',
    submodules: [
      { id: 'my', label: 'My Location' },
      { id: 'locations', label: 'Locations' },
      { id: 'sharing', label: 'Sharing' },
      { id: 'admin', label: 'Admin' },
    ],
    entities: ['Location'],
    events: [],
    forms: [],
  },
  {
    id: '/departments',
    name: 'Departments',
    route: '/departments',
    icon: Network,
    group: 'Organization',
    targetModule: 'Departments',
    submodules: [
      { id: 'directory', label: 'Directory' },
      { id: 'tree', label: 'Tree' },
      { id: 'members', label: 'Members' },
      { id: 'shifts', label: 'Shifts' },
      { id: 'admin', label: 'Admin' },
      { id: 'my', label: 'My Department' },
    ],
    entities: ['Department'],
    events: [],
    forms: [],
  },
  {
    id: '/positions',
    name: 'Positions',
    route: '/positions',
    icon: BadgeCheck,
    group: 'Organization',
    targetModule: 'Positions',
    submodules: [
      { id: 'catalogue', label: 'Catalogue' },
      { id: 'assignments', label: 'Assignments' },
      { id: 'recruitment', label: 'Recruitment' },
      { id: 'reports', label: 'Reports' },
      { id: 'admin', label: 'Admin' },
      { id: 'my', label: 'My Position' },
    ],
    entities: [],
    events: [],
    forms: [],
  },
  {
    id: '/org-groups',
    name: 'Groups',
    route: '/org-groups',
    icon: Boxes,
    group: 'Organization',
    targetModule: 'Groups',
    submodules: [
      { id: 'groups', label: 'Groups' },
      { id: 'hierarchy', label: 'Hierarchy' },
      { id: 'admin', label: 'Admin' },
      { id: 'approvals', label: 'Approvals' },
      { id: 'my', label: 'My Groups' },
    ],
    entities: ['Group'],
    events: [],
    forms: [],
  },
  {
    id: '/directory',
    name: 'Directory & Org Chart',
    route: '/directory',
    icon: BookUser,
    group: 'Organization',
    targetModule: undefined,
    submodules: [
      { id: 'directory', label: 'Directory' },
      { id: 'org-chart', label: 'Org Chart' },
      { id: 'vacancies', label: 'Vacancies' },
      { id: 'feedback', label: 'Feedback' },
      { id: 'admin', label: 'Admin' },
    ],
    entities: [],
    events: [],
    forms: [],
  },

  // ─── Workforce ─────────────────────────────────────────────────────────────
  {
    id: '/employees',
    name: 'Employees',
    route: '/employees',
    icon: IdCard,
    group: 'Workforce',
    targetModule: 'Employees',
    submodules: [
      { id: 'profile', label: 'My Profile' },
      { id: 'directory', label: 'Directory' },
      { id: 'delegations', label: 'Delegations' },
      { id: 'projects', label: 'Projects' },
    ],
    entities: ['Employee'],
    events: [
      'New employee joined',
      'Employee profile updated',
      'Employee document expired',
    ],
    forms: [
      {
        id: 'employees.profile',
        label: 'Employee profile',
        extensible: false,
      },
    ],
  },
  {
    id: '/lifecycle',
    name: 'Employee Lifecycle',
    route: '/lifecycle',
    icon: Milestone,
    group: 'Workforce',
    targetModule: 'Employee Lifecycle',
    submodules: [
      { id: 'onboarding', label: 'Onboarding' },
      { id: 'probation', label: 'Probation' },
      { id: 'transfers', label: 'Transfers' },
      { id: 'exits', label: 'Exits' },
      { id: 'reassignment', label: 'Reassignment' },
      { id: 'disciplinary', label: 'Disciplinary' },
      { id: 'admin', label: 'Admin' },
      { id: 'config', label: 'Settings' },
      { id: 'platform', label: 'Data & History' },
      { id: 'audit', label: 'Audit & Reports' },
      { id: 'my', label: 'My Lifecycle' },
      { id: 'kt', label: 'Knowledge Transfer' },
    ],
    entities: [],
    events: [
      'Probation ending in 15 days',
      'Exit initiated',
      'Confirmation due',
      'Transfer requested',
      'Layoff initiated',
    ],
    forms: [],
  },
  {
    id: '/self-service',
    name: 'Self Service',
    route: '/self-service',
    icon: UserCog,
    group: 'Workforce',
    targetModule: 'Self Service',
    submodules: [
      { id: 'overview', label: 'Overview' },
      { id: 'timeline', label: 'Timeline' },
      { id: 'admin', label: 'Admin' },
    ],
    entities: [],
    events: [],
    forms: [],
  },
  {
    id: '/recruitment',
    name: 'Recruitment',
    route: '/recruitment',
    icon: UserPlus,
    group: 'Workforce',
    targetModule: 'Recruitment',
    submodules: [
      { id: 'portal', label: 'Portal' },
      { id: 'openings', label: 'Openings' },
      { id: 'candidates', label: 'Candidates' },
      { id: 'offers', label: 'Offers' },
      { id: 'reports', label: 'Reports' },
      { id: 'admin', label: 'Admin' },
    ],
    entities: [],
    events: [
      'Offer approved',
      'Candidate shortlisted',
      'Interview scheduled',
      'Offer accepted',
      'Requisition opened',
    ],
    forms: [
      {
        id: 'recruitment.requisition',
        label: 'Job requisition',
        extensible: true,
      },
    ],
  },
  {
    id: '/leave',
    name: 'Leave Management',
    route: '/leave',
    icon: CalendarDays,
    group: 'Workforce',
    targetModule: 'Leave Management',
    submodules: [
      { id: 'my-leave', label: 'My Leave' },
      { id: 'holidays', label: 'Holiday List' },
      { id: 'team', label: 'Team' },
      { id: 'records', label: 'My Records' },
      { id: 'requests', label: 'Requests' },
      { id: 'summary', label: 'Employee Summary' },
      { id: 'calendar', label: 'Company Calendar' },
      { id: 'reports', label: 'Reports' },
      { id: 'admin', label: 'Admin' },
    ],
    entities: ['Leaves'],
    events: [
      'Leave request submitted',
      'Leave request cancelled',
      'Leave balance below threshold',
      'Holiday calendar updated',
      'Time-off adjustment requested',
    ],
    forms: [
      {
        id: 'leave.apply',
        label: 'Leave application',
        extensible: false,
        submitEvent: 'Leave request submitted',
      },
    ],
  },
  {
    id: '/attendance',
    name: 'Time & Attendance',
    route: '/attendance',
    icon: CalendarClock,
    group: 'Workforce',
    targetModule: 'Time & Attendance',
    submodules: [
      { id: 'my', label: 'My Attendance' },
      { id: 'my-requests', label: 'My Requests' },
      { id: 'my-timesheet', label: 'My Timesheet' },
      { id: 'records', label: 'Records' },
      { id: 'attendance', label: 'Attendance' },
      { id: 'shifts', label: 'Shifts' },
      { id: 'overtime', label: 'Overtime' },
      { id: 'tracking', label: 'Tracking' },
      { id: 'team', label: 'Team' },
      { id: 'group', label: 'Group' },
      { id: 'admin', label: 'Admin' },
    ],
    entities: ['Attendance'],
    events: [
      'Attendance shortfall detected',
      'Overtime request submitted',
      'Comp-off request submitted',
      'Missed punch detected',
      'Work-from-home request submitted',
      'Shift change requested',
    ],
    forms: [],
  },
  {
    id: '/assets',
    name: 'Asset Management',
    route: '/assets',
    icon: Package,
    group: 'Workforce',
    targetModule: 'Asset Management',
    submodules: [
      { id: 'my-assets', label: 'My Assets' },
      { id: 'requisitions', label: 'Requisitions' },
      { id: 'inventory', label: 'Inventory' },
      { id: 'activity', label: 'Activity' },
      { id: 'config', label: 'Config' },
    ],
    entities: [],
    events: [
      'Asset assigned',
      'Asset return due',
      'Asset reported damaged',
      'Asset requisition submitted',
    ],
    forms: [
      {
        id: 'assets.requisition',
        label: 'Asset requisition',
        extensible: false,
        submitEvent: 'Asset requisition submitted',
      },
    ],
  },

  // ─── Policies & Comms ──────────────────────────────────────────────────────
  {
    id: '/policies',
    name: 'Policy Management',
    route: '/policies',
    icon: BookText,
    group: 'Policies & Comms',
    targetModule: 'Policy Management',
    submodules: [
      { id: 'library', label: 'Policy Library' },
      { id: 'documents', label: 'All Policies' },
      { id: 'admin', label: 'Admin' },
    ],
    entities: [],
    events: ['Policy published', 'Policy acknowledgement overdue'],
    forms: [],
  },
  {
    id: '/policy-distribution',
    name: 'Policy Distribution',
    route: '/policy-distribution',
    icon: FileCheck,
    group: 'Policies & Comms',
    targetModule: undefined,
    submodules: [
      { id: 'inbox', label: 'Inbox' },
      { id: 'distributions', label: 'Distributions' },
      { id: 'compliance', label: 'Compliance' },
      { id: 'config', label: 'Config' },
    ],
    entities: [],
    events: [],
    forms: [],
  },
  {
    id: '/announcements',
    name: 'Announcements',
    route: '/announcements',
    icon: Megaphone,
    group: 'Policies & Comms',
    targetModule: 'Announcements',
    submodules: [
      { id: 'manage', label: 'Manage' },
      { id: 'review', label: 'Review' },
      { id: 'feed', label: 'Feed' },
      { id: 'admin', label: 'Admin' },
    ],
    entities: [],
    events: [],
    forms: [],
  },
  {
    id: '/notifications',
    name: 'Notifications',
    route: '/notifications',
    icon: BellRing,
    group: 'Policies & Comms',
    targetModule: 'Notifications',
    submodules: [
      { id: 'tasks', label: 'Tasks' },
      { id: 'assigned', label: 'Assigned' },
      { id: 'notifications', label: 'Notifications' },
      { id: 'messages', label: 'Messages' },
      { id: 'preferences', label: 'Preferences' },
      { id: 'admin', label: 'Admin' },
    ],
    entities: [],
    events: ['Announcement published', 'Alert rule triggered'],
    forms: [],
  },
  {
    id: '/hr-letters',
    name: 'HR Letters',
    route: '/hr-letters',
    icon: FileSignature,
    group: 'Policies & Comms',
    targetModule: 'HR Letters & Certificates',
    submodules: [
      { id: 'mine', label: 'Mine' },
      { id: 'documents', label: 'Documents' },
      { id: 'approvals', label: 'Approvals' },
      { id: 'admin', label: 'Admin' },
    ],
    entities: [],
    events: ['Letter requested', 'Certificate expiring'],
    forms: [],
  },
  {
    id: '/feedback',
    name: 'Feedback & Grievance',
    route: '/feedback',
    icon: MessagesSquare,
    group: 'Policies & Comms',
    targetModule: 'Feedback & Grievance',
    submodules: [
      { id: 'worklist', label: 'Worklist' },
      { id: 'my', label: 'My Feedback' },
      { id: 'anonymous', label: 'Anonymous' },
      { id: 'surveys', label: 'Surveys' },
      { id: 'admin', label: 'Admin' },
    ],
    entities: [],
    events: [],
    forms: [],
  },

  // ─── Platform ──────────────────────────────────────────────────────────────
  {
    id: '/engines',
    name: 'Engines Hub',
    route: '/engines',
    icon: SlidersHorizontal,
    group: 'Platform',
    targetModule: undefined,
    submodules: [],
    entities: [],
    events: [],
    forms: [],
  },
  {
    id: '/workflows',
    name: 'Workflow Engine',
    route: '/workflows',
    icon: Workflow,
    group: 'Platform',
    targetModule: undefined,
    submodules: [
      { id: 'instances', label: 'Instances' },
      { id: 'business-logic', label: 'Business Logic' },
      { id: 'designer', label: 'Designer' },
      { id: 'admin', label: 'Admin' },
    ],
    entities: [],
    events: [],
    forms: [],
  },
  {
    id: '/custom-fields',
    name: 'Custom Fields',
    route: '/custom-fields',
    icon: Puzzle,
    group: 'Platform',
    targetModule: 'Custom Fields',
    submodules: [
      { id: 'records', label: 'Records & Forms' },
      { id: 'integration', label: 'Data & Automation' },
      { id: 'admin', label: 'Admin' },
    ],
    entities: [],
    events: ['Custom field value changed'],
    forms: [],
  },
  {
    id: '/data-management',
    name: 'Data Management',
    route: '/data-management',
    icon: DatabaseZap,
    group: 'Platform',
    targetModule: 'Data Management',
    submodules: [
      { id: 'jobs', label: 'Jobs' },
      { id: 'log', label: 'Log' },
      { id: 'mappings', label: 'Mappings' },
      { id: 'config', label: 'Config' },
    ],
    entities: [],
    events: [
      'Import file uploaded',
      'Import completed with errors',
      'Export requested',
    ],
    forms: [],
  },
  {
    id: '/documents',
    name: 'Documents',
    route: '/documents',
    icon: FolderOpen,
    group: 'Platform',
    targetModule: 'Documents',
    submodules: [
      { id: 'mine', label: 'Mine' },
      { id: 'grid', label: 'Grid' },
      { id: 'custodian', label: 'Custodian' },
      { id: 'policies', label: 'Policies' },
      { id: 'admin', label: 'Admin' },
    ],
    entities: [],
    events: [],
    forms: [],
  },
  {
    id: '/reports',
    name: 'Reports & Analytics',
    route: '/reports',
    icon: ChartColumnBig,
    group: 'Platform',
    targetModule: undefined,
    submodules: [
      { id: 'dashboards', label: 'Dashboards' },
      { id: 'catalog', label: 'Catalog' },
      { id: 'my-reports', label: 'My Reports' },
      { id: 'builder', label: 'Builder' },
      { id: 'admin', label: 'Admin' },
      { id: 'my-data', label: 'My Data' },
    ],
    entities: [],
    events: [],
    forms: [],
  },

  // ─── Administration ────────────────────────────────────────────────────────
  {
    id: '/roles-security',
    name: 'Roles & Security',
    route: '/roles-security',
    icon: ShieldCheck,
    group: 'Administration',
    targetModule: 'Roles & Security',
    submodules: [
      { id: 'access', label: 'Access' },
      { id: 'delegations', label: 'Delegations' },
      { id: 'roles', label: 'Roles' },
      { id: 'assignments', label: 'Assignments' },
      { id: 'admin', label: 'Admin' },
    ],
    entities: [],
    events: [],
    forms: [],
  },
  {
    id: '/authentication',
    name: 'Authentication',
    route: '/authentication',
    icon: KeyRound,
    group: 'Administration',
    targetModule: 'Authentication',
    submodules: [
      { id: 'sign-in', label: 'Sign-in' },
      { id: 'users', label: 'Users' },
      { id: 'admin', label: 'Admin' },
    ],
    entities: [],
    events: [],
    forms: [],
  },
  {
    id: '/audit-logs',
    name: 'Audit & Logging',
    route: '/audit-logs',
    icon: ScrollText,
    group: 'Administration',
    targetModule: undefined,
    submodules: [
      { id: 'trail', label: 'Trail' },
      { id: 'history', label: 'History' },
      { id: 'admin', label: 'Admin' },
    ],
    entities: [],
    events: [],
    forms: [],
  },
  {
    id: '/platform-admin',
    name: 'Platform Admin',
    route: '/platform-admin',
    icon: ServerCog,
    group: 'Administration',
    targetModule: 'Platform Admin',
    submodules: [
      { id: 'tenants', label: 'Tenants' },
      { id: 'identity', label: 'Identity' },
      { id: 'operations', label: 'Operations' },
      { id: 'settings', label: 'Settings' },
    ],
    entities: [],
    events: [],
    forms: [],
  },
]

// ─── Helper functions ─────────────────────────────────────────────────────────

export function moduleByRoute(route: string): ModuleDef | undefined {
  return MODULE_REGISTRY.find((m) => m.route === route)
}

export function moduleByTarget(target: TargetModule): ModuleDef | undefined {
  return MODULE_REGISTRY.find((m) => m.targetModule === target)
}

export function submodulesFor(target: TargetModule): SubmoduleDef[] {
  return moduleByTarget(target)?.submodules ?? []
}

export function eventsForModule(target: string): string[] {
  return MODULE_REGISTRY.find((m) => m.targetModule === target)?.events ?? []
}

