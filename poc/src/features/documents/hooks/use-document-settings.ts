import {
  useCallback,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react'
import { toast } from 'sonner'
import { type Role } from '@/context/role-context'
import {
  ALL_FORMATS,
  DEFAULT_CATEGORIES,
  type DocumentFormat,
} from '../data/documents'
import { CURRENT_ADMIN, todayIso } from '../data/org'

export interface CategoryConfig {
  name: string
  retired: boolean
}

export type PermissionKind = 'view' | 'download' | 'upload'

export type CategoryAccess = Record<PermissionKind, Role[]>

export interface ConfigVersion {
  version: number
  effectiveFrom: string
  changedBy: string
  note: string
}

export interface UploadPolicy {
  allowedFormats: DocumentFormat[]
  maxSizeMb: number
}

const ADMIN_ROLES: Role[] = [
  'Platform Admin',
  'Portfolio Admin',
  'Group Company Admin',
  'Company Admin',
]

const SELF_UPLOAD_CATEGORIES = ['Identity Proof', 'General']

function defaultAccess(category: string): CategoryAccess {
  if (category === 'Financial') {
    return {
      view: [...ADMIN_ROLES],
      download: [...ADMIN_ROLES],
      upload: ['Company Admin', 'Group Company Admin'],
    }
  }
  const upload: Role[] = ['Company Admin', 'Group Company Admin']
  if (SELF_UPLOAD_CATEGORIES.includes(category)) upload.push('Employee (User)')
  return {
    view: [...ADMIN_ROLES, 'Employee (User)'],
    download: [...ADMIN_ROLES, 'Employee (User)'],
    upload,
  }
}

const initialVersion = (note: string): ConfigVersion[] => [
  { version: 1, effectiveFrom: '2026-01-01', changedBy: 'System', note },
]

/**
 * Governed, versioned, effective-dated configuration for the Documents
 * module: category taxonomy (DOC-16), platform upload policy (DOC-17),
 * role-based access matrix (DOC-18), and expiry alert lead time (DOC-19).
 * Every change bumps a version with an effective date — in-memory only.
 */
export function useDocumentSettings() {
  const [categories, setCategories] = useState<CategoryConfig[]>(
    DEFAULT_CATEGORIES.map((name) => ({ name, retired: false }))
  )
  const [categoryVersions, setCategoryVersions] = useState<ConfigVersion[]>(
    initialVersion('Default taxonomy seeded')
  )

  const [access, setAccess] = useState<Record<string, CategoryAccess>>(() =>
    Object.fromEntries(DEFAULT_CATEGORIES.map((c) => [c, defaultAccess(c)]))
  )
  const [accessVersions, setAccessVersions] = useState<ConfigVersion[]>(
    initialVersion('Default access matrix seeded')
  )

  const [policy, setPolicy] = useState<UploadPolicy>({
    allowedFormats: [...ALL_FORMATS],
    maxSizeMb: 2,
  })
  const [policyVersions, setPolicyVersions] = useState<ConfigVersion[]>(
    initialVersion('Platform default: all 9 formats, 2 MB max')
  )

  const [leadTimeDays, setLeadTimeDaysState] = useState(30)
  const [leadTimeVersions, setLeadTimeVersions] = useState<ConfigVersion[]>(
    initialVersion('Platform default window: 30 days')
  )

  const [notificationTemplate, setNotificationTemplate] = useState(
    'Document "{document}" ({status}) — expiry date {date}. Please renew or replace it.'
  )

  const bump = useCallback(
    (setter: Dispatch<SetStateAction<ConfigVersion[]>>, note: string) => {
      setter((prev) => [
        ...prev,
        {
          version: prev.length + 1,
          effectiveFrom: todayIso(),
          changedBy: CURRENT_ADMIN,
          note,
        },
      ])
    },
    []
  )

  const addCategory = useCallback(
    (name: string) => {
      setCategories((prev) => [...prev, { name, retired: false }])
      setAccess((prev) => ({ ...prev, [name]: defaultAccess(name) }))
      bump(setCategoryVersions, `Added category "${name}"`)
      toast.success(`Category "${name}" added to the taxonomy`)
    },
    [bump]
  )

  const renameCategory = useCallback(
    (oldName: string, newName: string) => {
      setCategories((prev) =>
        prev.map((c) => (c.name === oldName ? { ...c, name: newName } : c))
      )
      setAccess((prev) => {
        const next = { ...prev }
        if (next[oldName]) {
          next[newName] = next[oldName]
          delete next[oldName]
        }
        return next
      })
      bump(setCategoryVersions, `Renamed "${oldName}" to "${newName}"`)
      toast.success(`Category renamed to "${newName}"`)
    },
    [bump]
  )

  const toggleRetired = useCallback(
    (name: string) => {
      setCategories((prev) =>
        prev.map((c) => (c.name === name ? { ...c, retired: !c.retired } : c))
      )
      bump(setCategoryVersions, `Toggled retirement of "${name}"`)
      toast.success(
        `Category "${name}" updated — existing documents keep their historical category`
      )
    },
    [bump]
  )

  const moveCategory = useCallback(
    (name: string, direction: -1 | 1) => {
      setCategories((prev) => {
        const index = prev.findIndex((c) => c.name === name)
        const target = index + direction
        if (index < 0 || target < 0 || target >= prev.length) return prev
        const next = [...prev]
        ;[next[index], next[target]] = [next[target], next[index]]
        return next
      })
      bump(setCategoryVersions, `Reordered "${name}"`)
    },
    [bump]
  )

  const togglePermission = useCallback(
    (category: string, kind: PermissionKind, role: Role) => {
      setAccess((prev) => {
        const current = prev[category] ?? defaultAccess(category)
        const roles = current[kind].includes(role)
          ? current[kind].filter((r) => r !== role)
          : [...current[kind], role]
        return { ...prev, [category]: { ...current, [kind]: roles } }
      })
      bump(setAccessVersions, `${category}: ${kind} toggled for ${role}`)
    },
    [bump]
  )

  const updatePolicy = useCallback(
    (allowedFormats: DocumentFormat[], maxSizeMb: number) => {
      setPolicy({ allowedFormats, maxSizeMb })
      bump(
        setPolicyVersions,
        `${allowedFormats.length} formats allowed, max ${maxSizeMb} MB`
      )
      toast.success(
        'Upload policy saved — the validation engine applies it to subsequent uploads'
      )
    },
    [bump]
  )

  const setLeadTimeDays = useCallback(
    (days: number) => {
      setLeadTimeDaysState(days)
      bump(setLeadTimeVersions, `Warning lead time set to ${days} days`)
      toast.success(`Expiry alert lead time set to ${days} days`)
    },
    [bump]
  )

  const activeCategories = useMemo(
    () => categories.filter((c) => !c.retired).map((c) => c.name),
    [categories]
  )

  const permsFor = useCallback(
    (category: string): CategoryAccess =>
      access[category] ?? defaultAccess(category),
    [access]
  )

  const canView = useCallback(
    (role: Role, category: string) => permsFor(category).view.includes(role),
    [permsFor]
  )
  const canDownload = useCallback(
    (role: Role, category: string) =>
      permsFor(category).download.includes(role),
    [permsFor]
  )
  const canUpload = useCallback(
    (role: Role, category: string) => permsFor(category).upload.includes(role),
    [permsFor]
  )

  return {
    categories,
    activeCategories,
    categoryVersions,
    addCategory,
    renameCategory,
    toggleRetired,
    moveCategory,
    access,
    accessVersions,
    permsFor,
    togglePermission,
    canView,
    canDownload,
    canUpload,
    policy,
    policyVersions,
    updatePolicy,
    leadTimeDays,
    leadTimeVersions,
    setLeadTimeDays,
    notificationTemplate,
    setNotificationTemplate,
  }
}

export type DocumentSettingsStore = ReturnType<typeof useDocumentSettings>
