import { useCallback, useSyncExternalStore } from 'react'
import { toast } from 'sonner'
import { publishAuditEvent } from '@/features/audit-logs/data/live-trail'
import { useRole } from '@/context/role-context'
import { ACTORS } from '@/features/workflows/data/shared'
import {
  CHANNEL_LABELS,
  type Channel,
  type EventTypeId,
} from '../data/notifications'
import {
  seedAlertsConfig,
  seedChannelSettings,
  seedConnectors,
  seedDigestSchedule,
  seedEventDelivery,
  seedPreferenceVersions,
  type AlertsConfig,
  type ChannelSetting,
  type Connector,
  type DeliveryModel,
  type DigestSchedule,
  type EventDeliverySetting,
  type GroupSubscription,
  type PreferenceVersion,
  type QuietHours,
} from '../data/settings'

/**
 * Module-level external store (the use-business-logic.ts idiom) for channels,
 * connectors, delivery models, Kensium alert toggles and effective-dated user
 * preferences (FR 6.27.1/3/5). Shared across every consumer via
 * useSyncExternalStore so config changes reflect everywhere instantly.
 * Seeds: email on, in-app on, Teams connected, WhatsApp not connected.
 */
interface SettingsState {
  channels: ChannelSetting[]
  connectors: Connector[]
  eventDelivery: EventDeliverySetting[]
  digestSchedule: DigestSchedule
  alerts: AlertsConfig
  preferenceVersions: PreferenceVersion[]
}

let settingsState: SettingsState = {
  channels: seedChannelSettings,
  connectors: seedConnectors,
  eventDelivery: seedEventDelivery,
  digestSchedule: seedDigestSchedule,
  alerts: seedAlertsConfig,
  preferenceVersions: seedPreferenceVersions,
}

const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

function mutate(updater: (prev: SettingsState) => SettingsState) {
  settingsState = updater(settingsState)
  emit()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot() {
  return settingsState
}

export function useNotificationSettings() {
  const state = useSyncExternalStore(subscribe, getSnapshot)
  const { role } = useRole()
  const actor = ACTORS[role]

  const audit = useCallback(
    (action: string, recordName: string) => {
      publishAuditEvent({
        module: 'Notifications',
        action,
        actor,
        actorRole: role,
        actionType: 'update',
        recordName,
      })
    },
    [actor, role]
  )

  const toggleChannel = useCallback(
    (channel: Channel, enabled: boolean) => {
      if (channel === 'email') {
        toast.error('Email is the mandatory baseline channel and stays on.')
        return
      }
      const connector = settingsState.connectors.find((c) => c.id === channel)
      if (enabled && connector && !connector.connected) {
        toast.error(
          `${CHANNEL_LABELS[channel]} is not connected yet. Connect it first from the connector row.`
        )
        return
      }
      mutate((prev) => ({
        ...prev,
        channels: prev.channels.map((c) =>
          c.channel === channel ? { ...c, enabled } : c
        ),
      }))
      toast.success(
        `${CHANNEL_LABELS[channel]} channel ${enabled ? 'enabled' : 'disabled'}. Email remains enforced as fallback.`
      )
      audit(
        `${CHANNEL_LABELS[channel]} channel ${enabled ? 'enabled' : 'disabled'}`,
        'Notification channels'
      )
    },
    [audit]
  )

  /** Connect a Teams/WhatsApp connector (mock) — status flips to Connected. */
  const connectConnector = useCallback(
    (id: Connector['id'], target: string) => {
      const now = new Date().toISOString().slice(0, 19)
      mutate((prev) => ({
        ...prev,
        connectors: prev.connectors.map((c) =>
          c.id === id
            ? { ...c, connected: true, target, connectedAt: now }
            : c
        ),
      }))
      toast.success(
        `${CHANNEL_LABELS[id]} connected — the channel can now be switched on for delivery.`
      )
      audit(`${CHANNEL_LABELS[id]} connector connected (${target})`, 'Connectors')
    },
    [audit]
  )

  /** Disconnect a connector; the dependent channel is switched off too. */
  const disconnectConnector = useCallback(
    (id: Connector['id']) => {
      mutate((prev) => ({
        ...prev,
        connectors: prev.connectors.map((c) =>
          c.id === id
            ? {
                ...c,
                connected: false,
                target: '',
                connectedAt: null,
                lastTest: null,
                lastTestResult: null,
              }
            : c
        ),
        channels: prev.channels.map((c) =>
          c.channel === id ? { ...c, enabled: false } : c
        ),
      }))
      toast.success(
        `${CHANNEL_LABELS[id]} disconnected. Messages for this channel fall back to email.`
      )
      audit(`${CHANNEL_LABELS[id]} connector disconnected`, 'Connectors')
    },
    [audit]
  )

  const testConnector = useCallback((id: Connector['id']) => {
    const now = new Date().toISOString().slice(0, 19)
    mutate((prev) => ({
      ...prev,
      connectors: prev.connectors.map((c) => {
        if (c.id !== id) return c
        if (c.connected) {
          toast.success(`${c.name} test delivery succeeded.`)
        } else {
          toast.error(
            `${c.name} test delivery failed (not connected) — the engine would fall back to email.`
          )
        }
        return {
          ...c,
          lastTest: now,
          lastTestResult: c.connected ? 'success' : 'failed',
        }
      }),
    }))
  }, [])

  const setEventModel = useCallback(
    (eventType: EventTypeId, model: DeliveryModel) => {
      mutate((prev) => ({
        ...prev,
        eventDelivery: prev.eventDelivery.map((e) => {
          if (e.eventType !== eventType) return e
          if (e.locked) {
            toast.error(
              'Approvals and escalations are critical events — they stay event-driven and cannot be batched into digests.'
            )
            return e
          }
          return { ...e, model }
        }),
      }))
    },
    []
  )

  const updateDigestSchedule = useCallback(
    (patch: Partial<DigestSchedule>) => {
      mutate((prev) => ({
        ...prev,
        digestSchedule: { ...prev.digestSchedule, ...patch },
      }))
      toast.success('Digest schedule updated.')
    },
    []
  )

  /** All alert toggles are stored together and applied atomically (NTF-41). */
  const saveAlerts = useCallback(
    (draft: AlertsConfig) => {
      mutate((prev) => ({ ...prev, alerts: draft }))
      toast.success(
        draft.moduleEnabled
          ? 'Alert configuration saved — all toggles applied together.'
          : 'Alerts module disabled — no alerts will be generated.'
      )
      audit('Alert configuration saved', 'Alerts configuration')
    },
    [audit]
  )

  /** Preference saves append an effective-dated version (NTF-12, NTF-20). */
  const savePreferences = useCallback(
    (
      channels_: Channel[],
      groups: GroupSubscription[],
      quietHours: QuietHours
    ) => {
      const today = new Date().toISOString().slice(0, 10)
      const withEmail = channels_.includes('email')
        ? channels_
        : (['email', ...channels_] as Channel[])
      mutate((prev) => ({
        ...prev,
        preferenceVersions: [
          ...prev.preferenceVersions,
          {
            version: prev.preferenceVersions.length + 1,
            channels: withEmail,
            groups,
            quietHours,
            effectiveFrom: today,
            savedBy: 'You',
          },
        ],
      }))
      toast.success(
        `Notification settings saved effective ${today}. Email stays on for critical communications.`
      )
      audit('Notification settings saved', 'My notification settings')
    },
    [audit]
  )

  const currentPreferences =
    state.preferenceVersions[state.preferenceVersions.length - 1]

  return {
    channels: state.channels,
    toggleChannel,
    connectors: state.connectors,
    connectConnector,
    disconnectConnector,
    testConnector,
    eventDelivery: state.eventDelivery,
    setEventModel,
    digestSchedule: state.digestSchedule,
    updateDigestSchedule,
    alerts: state.alerts,
    saveAlerts,
    preferenceVersions: state.preferenceVersions,
    currentPreferences,
    savePreferences,
  }
}

export type NotificationSettingsStore = ReturnType<
  typeof useNotificationSettings
>
