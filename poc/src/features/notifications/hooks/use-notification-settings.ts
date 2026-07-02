import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { CHANNEL_LABELS, type Channel, type EventTypeId } from '../data/notifications'
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
  type Frequency,
  type PreferenceVersion,
} from '../data/settings'

export interface ConnectorDraft {
  webhookUrl: string
  apiKey: string
}

/**
 * In-memory configuration store for channels, connectors, delivery models,
 * Kensium alert toggles (saved atomically) and effective-dated user
 * preferences (FR 6.27.1/3/5).
 */
export function useNotificationSettings() {
  const [channels, setChannels] = useState<ChannelSetting[]>(seedChannelSettings)
  const [connectors, setConnectors] = useState<Connector[]>(seedConnectors)
  const [eventDelivery, setEventDelivery] = useState(seedEventDelivery)
  const [digestSchedule, setDigestSchedule] =
    useState<DigestSchedule>(seedDigestSchedule)
  const [alerts, setAlerts] = useState<AlertsConfig>(seedAlertsConfig)
  const [preferenceVersions, setPreferenceVersions] = useState<
    PreferenceVersion[]
  >(seedPreferenceVersions)

  const toggleChannel = useCallback(
    (channel: Channel, enabled: boolean) => {
      if (channel === 'email') {
        toast.error(
          'Email is the mandatory, always-on channel and cannot be disabled.'
        )
        return
      }
      const connector = connectors.find((c) => c.id === channel)
      if (enabled && connector && !connector.provisioned) {
        toast.error(
          `${CHANNEL_LABELS[channel]} requires a provisioned connector. Ask your Platform Admin to configure it.`
        )
        return
      }
      setChannels((prev) =>
        prev.map((c) => (c.channel === channel ? { ...c, enabled } : c))
      )
      toast.success(
        `${CHANNEL_LABELS[channel]} channel ${enabled ? 'enabled' : 'disabled'}. Email remains enforced as fallback.`
      )
    },
    [connectors]
  )

  const saveConnector = useCallback(
    (id: Connector['id'], draft: ConnectorDraft) => {
      setConnectors((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                provisioned: true,
                credentialStatus: 'valid',
                webhookUrl: draft.webhookUrl,
                apiKey: draft.apiKey,
              }
            : c
        )
      )
      toast.success(
        `${CHANNEL_LABELS[id]} connector provisioned — Company Admins can now enable the channel.`
      )
    },
    []
  )

  const testConnector = useCallback((id: Connector['id']) => {
    const now = new Date().toISOString().slice(0, 19)
    setConnectors((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c
        const ok = c.provisioned && c.credentialStatus === 'valid'
        if (ok) {
          toast.success(`${c.name} test delivery succeeded.`)
        } else {
          toast.error(
            `${c.name} test delivery failed (${c.credentialStatus === 'invalid' ? 'invalid credentials' : 'not provisioned'}) — the engine would fall back to email.`
          )
        }
        return { ...c, lastTest: now, lastTestResult: ok ? 'success' : 'failed' }
      })
    )
  }, [])

  const setEventModel = useCallback(
    (eventType: EventTypeId, model: DeliveryModel) => {
      setEventDelivery((prev) =>
        prev.map((e) => {
          if (e.eventType !== eventType) return e
          if (e.locked) {
            toast.error(
              'Approvals and escalations are critical events — they stay event-driven and cannot be batched into digests.'
            )
            return e
          }
          return { ...e, model }
        })
      )
    },
    []
  )

  const updateDigestSchedule = useCallback(
    (patch: Partial<DigestSchedule>) => {
      setDigestSchedule((prev) => ({ ...prev, ...patch }))
      toast.success('Digest schedule updated.')
    },
    []
  )

  /** All alert toggles are stored together and applied atomically (NTF-41). */
  const saveAlerts = useCallback((draft: AlertsConfig) => {
    setAlerts(draft)
    toast.success(
      draft.moduleEnabled
        ? 'Alert configuration saved — all toggles applied together.'
        : 'Alerts module disabled — no alerts will be generated.'
    )
  }, [])

  /** Preference saves append an effective-dated version (NTF-12, NTF-20). */
  const savePreferences = useCallback(
    (channels_: Channel[], subscriptions: EventTypeId[], frequency: Frequency) => {
      const today = new Date().toISOString().slice(0, 10)
      const withEmail = channels_.includes('email')
        ? channels_
        : (['email', ...channels_] as Channel[])
      setPreferenceVersions((prev) => [
        ...prev,
        {
          version: prev.length + 1,
          channels: withEmail,
          subscriptions,
          frequency,
          effectiveFrom: today,
          savedBy: 'You',
        },
      ])
      toast.success(
        `Preferences saved effective ${today}. Email stays enforced for mandatory and critical communications.`
      )
    },
    []
  )

  const currentPreferences = preferenceVersions[preferenceVersions.length - 1]

  return {
    channels,
    toggleChannel,
    connectors,
    saveConnector,
    testConnector,
    eventDelivery,
    setEventModel,
    digestSchedule,
    updateDigestSchedule,
    alerts,
    saveAlerts,
    preferenceVersions,
    currentPreferences,
    savePreferences,
  }
}

export type NotificationSettingsStore = ReturnType<
  typeof useNotificationSettings
>
