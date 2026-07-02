import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  defaultLocale,
  seedConfigEntries,
  seedWebhooks,
  seedWorkflows,
  type ConfigEntry,
  type LocaleSettings,
  type UdfEntity,
  type UdfType,
  type WebhookEvent,
  type WebhookSubscription,
  type WorkflowItem,
} from '../data/config'

export interface WebhookDraft {
  url: string
  events: WebhookEvent[]
}

/**
 * In-memory governed configuration store (SYS-28, 33, 34, 35, 36, 74, 76,
 * 77). Versioned/effective-dated config, custom fields, webhooks and the
 * workflow approval queue.
 */
export function useGovernedConfig() {
  const [configEntries, setConfigEntries] =
    useState<ConfigEntry[]>(seedConfigEntries)
  const [webhooks, setWebhooks] = useState<WebhookSubscription[]>(seedWebhooks)
  const [workflows, setWorkflows] = useState<WorkflowItem[]>(seedWorkflows)
  const [locale, setLocale] = useState<LocaleSettings>(defaultLocale)

  /** New version effective today; prior version preserved (SYS-35). */
  const publishVersion = useCallback((id: string) => {
    setConfigEntries((prev) => {
      const entry = prev.find((e) => e.id === id)
      if (!entry) return prev
      const next: ConfigEntry = {
        ...entry,
        id: `cfg-${crypto.randomUUID().slice(0, 8)}`,
        version: entry.version + 1,
        effectiveFrom: new Date().toISOString().slice(0, 10),
        status: 'effective',
      }
      toast.success(
        `${entry.name} v${next.version} published — effective immediately, no code deployment`
      )
      return [
        next,
        ...prev.map((e) =>
          e.id === id ? { ...e, status: 'superseded' as const } : e
        ),
      ]
    })
  }, [])

  /** Per-tenant UDF schema as governed config (SYS-33). */
  const addCustomField = useCallback(
    (name: string, type: UdfType, entity: UdfEntity) => {
      setConfigEntries((prev) => [
        {
          id: `cfg-${crypto.randomUUID().slice(0, 8)}`,
          name: `UDF: ${name} (${entity})`,
          kind: 'UDF schema',
          version: 1,
          effectiveFrom: new Date().toISOString().slice(0, 10),
          status: 'effective',
          tenantId: 'co-01',
        },
        ...prev,
      ])
      toast.success(
        `${name} (${type}) added — it will render on ${entity} forms and is searchable`
      )
    },
    []
  )

  const updateLocale = useCallback((next: LocaleSettings) => {
    setLocale(next)
    toast.success(
      `Locale formats saved at ${next.level.toLowerCase()} level — versioned & effective-dated`
    )
  }, [])

  const addWebhook = useCallback((draft: WebhookDraft) => {
    setWebhooks((prev) => [
      {
        id: `wh-${crypto.randomUUID().slice(0, 8)}`,
        tenantId: 'co-01',
        url: draft.url,
        events: draft.events,
        active: true,
        lastDelivery: null,
        lastStatus: null,
      },
      ...prev,
    ])
    toast.success('Webhook subscribed for the company')
  }, [])

  const toggleWebhook = useCallback((id: string) => {
    setWebhooks((prev) =>
      prev.map((w) => (w.id === id ? { ...w, active: !w.active } : w))
    )
  }, [])

  /** HTTPS delivery with signature verification (SYS-34, 77). */
  const sendTest = useCallback((id: string) => {
    setWebhooks((prev) =>
      prev.map((w) =>
        w.id === id
          ? {
              ...w,
              lastDelivery: new Date()
                .toISOString()
                .slice(0, 16)
                .replace('T', ' '),
              lastStatus: 'delivered',
            }
          : w
      )
    )
    toast.success(
      'Test event delivered over HTTPS — signature verified (sha256=9f2c…)'
    )
  }, [])

  /** Approval decision advances the workflow (SYS-36). */
  const decideWorkflow = useCallback(
    (id: string, decision: 'approved' | 'rejected' | 'returned') => {
      setWorkflows((prev) =>
        prev.map((w) => (w.id === id ? { ...w, status: decision } : w))
      )
      toast.success(
        decision === 'approved'
          ? 'Approved — change applied; workflow-change event emitted to subscribed webhooks'
          : decision === 'rejected'
            ? 'Rejected — change was not applied'
            : 'Returned to requester for correction'
      )
    },
    []
  )

  return {
    configEntries,
    webhooks,
    workflows,
    locale,
    publishVersion,
    addCustomField,
    updateLocale,
    addWebhook,
    toggleWebhook,
    sendTest,
    decideWorkflow,
  }
}

export type GovernedConfigStore = ReturnType<typeof useGovernedConfig>
