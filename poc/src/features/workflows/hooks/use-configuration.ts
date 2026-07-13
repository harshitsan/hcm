import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  seedAlertRules,
  seedConfigAreas,
  seedHeadOffices,
  seedIntegrations,
  seedLocalizations,
  type AlertRule,
  type ConfigArea,
  type HeadOffice,
  type IntegrationConnection,
  type LocalizationSetting,
} from '../data/configuration'
import { type AppendAudit } from './use-audit-trail'

export type ConfigAreaDraft = Omit<ConfigArea, 'id' | 'updatedBy' | 'updatedAt'>
export type LocalizationDraft = Omit<
  LocalizationSetting,
  'id' | 'isDefault' | 'updatedBy' | 'updatedAt'
>
export type HeadOfficeDraft = Omit<
  HeadOffice,
  'id' | 'isPrimary' | 'updatedBy' | 'updatedAt'
>
export type IntegrationDraft = Omit<
  IntegrationConnection,
  'id' | 'lastSyncAt' | 'updatedBy' | 'updatedAt'
>
export type AlertRuleDraft = Omit<AlertRule, 'id' | 'updatedBy' | 'updatedAt'>

function today() {
  return new Date().toISOString().slice(0, 10)
}

function nowStamp() {
  const d = new Date()
  return `${d.toISOString().slice(0, 10)} ${d.toTimeString().slice(0, 5)}`
}

/**
 * Central Configuration hub store (CFG-01, CFG-02, CFG-08): the setup-area
 * registry, organization settings (localization packs, head offices) and
 * integration/alert connections. Every change lands in the audit trail.
 */
export function useConfiguration({
  append,
  actor,
  actorRole,
}: {
  append: AppendAudit
  actor: string
  actorRole: string
}) {
  const [areas, setAreas] = useState<ConfigArea[]>(seedConfigAreas)
  const [localizations, setLocalizations] =
    useState<LocalizationSetting[]>(seedLocalizations)
  const [headOffices, setHeadOffices] = useState<HeadOffice[]>(seedHeadOffices)
  const [integrations, setIntegrations] =
    useState<IntegrationConnection[]>(seedIntegrations)
  const [alertRules, setAlertRules] = useState<AlertRule[]>(seedAlertRules)

  const log = useCallback(
    (summary: string, detail: string, refId: string) => {
      append({
        actor,
        actorRole,
        company: 'Aurora Foods',
        category: 'config',
        summary,
        detail,
        refId,
      })
    },
    [append, actor, actorRole]
  )

  /* ------------------------------ Hub areas ------------------------------ */

  const saveArea = useCallback(
    (draft: ConfigAreaDraft, id?: string) => {
      if (id) {
        setAreas((prev) =>
          prev.map((a) =>
            a.id === id
              ? { ...a, ...draft, updatedBy: actor, updatedAt: today() }
              : a
          )
        )
        log(
          `Updated configuration area — ${draft.name}`,
          `Group: ${draft.group} · owner: ${draft.owner}.`,
          id
        )
        toast.success('Configuration area updated')
      } else {
        const area: ConfigArea = {
          ...draft,
          id: `ca-${crypto.randomUUID().slice(0, 6)}`,
          updatedBy: actor,
          updatedAt: today(),
        }
        setAreas((prev) => [area, ...prev])
        log(
          `Added configuration area — ${draft.name}`,
          `Group: ${draft.group} · owner: ${draft.owner}.`,
          area.id
        )
        toast.success('Configuration area added to the hub')
      }
    },
    [actor, log]
  )

  const deleteArea = useCallback(
    (id: string) => {
      const area = areas.find((a) => a.id === id)
      setAreas((prev) => prev.filter((a) => a.id !== id))
      if (area)
        log(
          `Removed configuration area — ${area.name}`,
          'The setup area no longer appears in the Configuration hub.',
          id
        )
      toast.success('Configuration area removed')
    },
    [areas, log]
  )

  const toggleArea = useCallback(
    (id: string) => {
      setAreas((prev) =>
        prev.map((a) =>
          a.id === id
            ? { ...a, enabled: !a.enabled, updatedBy: actor, updatedAt: today() }
            : a
        )
      )
      const area = areas.find((a) => a.id === id)
      if (area) {
        log(
          `${area.enabled ? 'Disabled' : 'Enabled'} configuration area — ${area.name}`,
          `Group: ${area.group}.`,
          id
        )
        toast.success(`${area.name} ${area.enabled ? 'disabled' : 'enabled'}`)
      }
    },
    [areas, actor, log]
  )

  /* ---------------------------- Localizations ---------------------------- */

  const saveLocalization = useCallback(
    (draft: LocalizationDraft, id?: string) => {
      if (id) {
        setLocalizations((prev) =>
          prev.map((l) =>
            l.id === id
              ? { ...l, ...draft, updatedBy: actor, updatedAt: today() }
              : l
          )
        )
        log(
          `Updated localization — ${draft.name}`,
          `${draft.language} · ${draft.timezone} · ${draft.currency} · ${draft.dateFormat} · FY starts ${draft.fiscalYearStart}.`,
          id
        )
        toast.success('Localization updated')
      } else {
        const loc: LocalizationSetting = {
          ...draft,
          id: `loc-${crypto.randomUUID().slice(0, 6)}`,
          isDefault: false,
          updatedBy: actor,
          updatedAt: today(),
        }
        setLocalizations((prev) => [loc, ...prev])
        log(
          `Added localization — ${draft.name}`,
          `${draft.language} · ${draft.timezone} · ${draft.currency} · FY starts ${draft.fiscalYearStart}.`,
          loc.id
        )
        toast.success('Localization added')
      }
    },
    [actor, log]
  )

  const deleteLocalization = useCallback(
    (id: string) => {
      const loc = localizations.find((l) => l.id === id)
      if (loc?.isDefault) {
        toast.error('The default localization cannot be removed — set another default first')
        return
      }
      setLocalizations((prev) => prev.filter((l) => l.id !== id))
      if (loc) log(`Removed localization — ${loc.name}`, `${loc.language}.`, id)
      toast.success('Localization removed')
    },
    [localizations, log]
  )

  const setDefaultLocalization = useCallback(
    (id: string) => {
      setLocalizations((prev) =>
        prev.map((l) => ({ ...l, isDefault: l.id === id }))
      )
      const loc = localizations.find((l) => l.id === id)
      if (loc) {
        log(
          `Set default localization — ${loc.name}`,
          'New employees and companies inherit this localization pack.',
          id
        )
        toast.success(`${loc.name} is now the default localization`)
      }
    },
    [localizations, log]
  )

  /* ----------------------------- Head offices ---------------------------- */

  const saveHeadOffice = useCallback(
    (draft: HeadOfficeDraft, id?: string) => {
      if (id) {
        setHeadOffices((prev) =>
          prev.map((h) =>
            h.id === id
              ? { ...h, ...draft, updatedBy: actor, updatedAt: today() }
              : h
          )
        )
        log(
          `Updated head office — ${draft.name}`,
          `${draft.type} · ${draft.industry} · ${draft.location}.`,
          id
        )
        toast.success('Office record updated')
      } else {
        const office: HeadOffice = {
          ...draft,
          id: `ho-${crypto.randomUUID().slice(0, 6)}`,
          isPrimary: false,
          updatedBy: actor,
          updatedAt: today(),
        }
        setHeadOffices((prev) => [office, ...prev])
        log(
          `Added office — ${draft.name}`,
          `${draft.type} · ${draft.industry} · ${draft.location}.`,
          office.id
        )
        toast.success('Office record added')
      }
    },
    [actor, log]
  )

  const deleteHeadOffice = useCallback(
    (id: string) => {
      const office = headOffices.find((h) => h.id === id)
      if (office?.isPrimary) {
        toast.error('The primary head office cannot be removed — set another primary first')
        return
      }
      setHeadOffices((prev) => prev.filter((h) => h.id !== id))
      if (office) log(`Removed office — ${office.name}`, `${office.type}.`, id)
      toast.success('Office record removed')
    },
    [headOffices, log]
  )

  const setPrimaryHeadOffice = useCallback(
    (id: string) => {
      setHeadOffices((prev) =>
        prev.map((h) => ({ ...h, isPrimary: h.id === id }))
      )
      const office = headOffices.find((h) => h.id === id)
      if (office) {
        log(
          `Set primary head office — ${office.name}`,
          'Statutory documents and letterheads use this office.',
          id
        )
        toast.success(`${office.name} is now the primary head office`)
      }
    },
    [headOffices, log]
  )

  /* ----------------------------- Integrations ---------------------------- */

  const saveIntegration = useCallback(
    (draft: IntegrationDraft, id?: string) => {
      if (id) {
        setIntegrations((prev) =>
          prev.map((i) =>
            i.id === id
              ? { ...i, ...draft, updatedBy: actor, updatedAt: today() }
              : i
          )
        )
        log(
          `Updated integration — ${draft.name}`,
          `${draft.system} · ${draft.syncFrequency} · ${draft.syncEntities}.`,
          id
        )
        toast.success('Integration updated')
      } else {
        const connection: IntegrationConnection = {
          ...draft,
          id: `int-${crypto.randomUUID().slice(0, 6)}`,
          lastSyncAt: 'Never',
          updatedBy: actor,
          updatedAt: today(),
        }
        setIntegrations((prev) => [connection, ...prev])
        log(
          `Added integration — ${draft.name}`,
          `${draft.system} · ${draft.endpoint}.`,
          connection.id
        )
        toast.success('Integration connection added')
      }
    },
    [actor, log]
  )

  const deleteIntegration = useCallback(
    (id: string) => {
      const connection = integrations.find((i) => i.id === id)
      setIntegrations((prev) => prev.filter((i) => i.id !== id))
      if (connection)
        log(
          `Removed integration — ${connection.name}`,
          'Scheduled syncs for this connection stop immediately.',
          id
        )
      toast.success('Integration connection removed')
    },
    [integrations, log]
  )

  const toggleIntegration = useCallback(
    (id: string) => {
      setIntegrations((prev) =>
        prev.map((i) =>
          i.id === id
            ? { ...i, enabled: !i.enabled, updatedBy: actor, updatedAt: today() }
            : i
        )
      )
      const connection = integrations.find((i) => i.id === id)
      if (connection) {
        log(
          `${connection.enabled ? 'Disabled' : 'Enabled'} integration — ${connection.name}`,
          `${connection.system} module ${connection.enabled ? 'switched off' : 'switched on'}.`,
          id
        )
        toast.success(
          `${connection.name} ${connection.enabled ? 'disabled' : 'enabled'}`
        )
      }
    },
    [integrations, actor, log]
  )

  const syncNow = useCallback(
    (id: string) => {
      const connection = integrations.find((i) => i.id === id)
      if (!connection) return
      if (!connection.enabled) {
        toast.error(`${connection.name} is disabled — enable it before syncing`)
        return
      }
      setIntegrations((prev) =>
        prev.map((i) => (i.id === id ? { ...i, lastSyncAt: nowStamp() } : i))
      )
      log(
        `Manual sync triggered — ${connection.name}`,
        `Entities: ${connection.syncEntities}.`,
        id
      )
      toast.success(`${connection.name} sync completed`)
    },
    [integrations, log]
  )

  /* ------------------------------ Alert rules ---------------------------- */

  const saveAlertRule = useCallback(
    (draft: AlertRuleDraft, id?: string) => {
      if (id) {
        setAlertRules((prev) =>
          prev.map((r) =>
            r.id === id
              ? { ...r, ...draft, updatedBy: actor, updatedAt: today() }
              : r
          )
        )
        log(
          `Updated alert rule — ${draft.name}`,
          `On "${draft.event}" via ${draft.channels.join(', ')} → ${draft.recipients}.`,
          id
        )
        toast.success('Alert rule updated')
      } else {
        const rule: AlertRule = {
          ...draft,
          id: `al-${crypto.randomUUID().slice(0, 6)}`,
          updatedBy: actor,
          updatedAt: today(),
        }
        setAlertRules((prev) => [rule, ...prev])
        log(
          `Added alert rule — ${draft.name}`,
          `On "${draft.event}" via ${draft.channels.join(', ')} → ${draft.recipients}.`,
          rule.id
        )
        toast.success('Alert rule added')
      }
    },
    [actor, log]
  )

  const deleteAlertRule = useCallback(
    (id: string) => {
      const rule = alertRules.find((r) => r.id === id)
      setAlertRules((prev) => prev.filter((r) => r.id !== id))
      if (rule)
        log(`Removed alert rule — ${rule.name}`, `Event: ${rule.event}.`, id)
      toast.success('Alert rule removed')
    },
    [alertRules, log]
  )

  const toggleAlertRule = useCallback(
    (id: string) => {
      setAlertRules((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, enabled: !r.enabled, updatedBy: actor, updatedAt: today() }
            : r
        )
      )
      const rule = alertRules.find((r) => r.id === id)
      if (rule) {
        log(
          `${rule.enabled ? 'Muted' : 'Activated'} alert rule — ${rule.name}`,
          `Event: ${rule.event}.`,
          id
        )
        toast.success(`${rule.name} ${rule.enabled ? 'muted' : 'activated'}`)
      }
    },
    [alertRules, actor, log]
  )

  return {
    areas,
    saveArea,
    deleteArea,
    toggleArea,
    localizations,
    saveLocalization,
    deleteLocalization,
    setDefaultLocalization,
    headOffices,
    saveHeadOffice,
    deleteHeadOffice,
    setPrimaryHeadOffice,
    integrations,
    saveIntegration,
    deleteIntegration,
    toggleIntegration,
    syncNow,
    alertRules,
    saveAlertRule,
    deleteAlertRule,
    toggleAlertRule,
  }
}

export type ConfigurationStore = ReturnType<typeof useConfiguration>
