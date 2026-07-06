import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  seedEmailTemplates,
  seedNotificationRules,
  seedNotificationTemplates,
  seedPhysicalResources,
  seedPresenterPanels,
  seedPrograms,
  seedQuestions,
  type NotificationRule,
  type OrientationProgram,
  type OrientationQuestion,
  type PhysicalResource,
  type PresenterPanel,
  type ProgramStatus,
} from '../data/orientation'
import { shortId, todayISO } from '../data/shared'
import { type LogInput } from './use-lifecycle-log'

interface Deps {
  log: (input: Omit<LogInput, 'actor' | 'actorRole'>) => void
  notify: (input: {
    recipient: string
    kind: 'task' | 'approval' | 'reminder' | 'escalation'
    title: string
    body: string
  }) => void
}

/** Sections that expose an explicit "Refresh" affordance. */
export type OrientationSection =
  | 'rules'
  | 'resources'
  | 'panels'
  | 'questions'
  | 'email-templates'
  | 'notification-templates'
  | 'programs'

const COMPANY = 'Aurora Software India'
const MODULE = 'Orientation'

/**
 * Orientation store — module setup, notification rules, physical resources,
 * presenter panels, question bank, communication templates and the orientation
 * programs scheduled against that configuration. All state is in-memory.
 */
export function useOrientation({ log, notify }: Deps) {
  const [moduleEnabled, setModuleEnabled] = useState(true)
  const [notificationRuleRequired, setNotificationRuleRequired] =
    useState(true)
  const [rules, setRules] = useState<NotificationRule[]>(seedNotificationRules)
  const [resources, setResources] = useState<PhysicalResource[]>(
    seedPhysicalResources
  )
  const [panels, setPanels] = useState<PresenterPanel[]>(seedPresenterPanels)
  const [questions, setQuestions] =
    useState<OrientationQuestion[]>(seedQuestions)
  const [emailTemplates] = useState(seedEmailTemplates)
  const [notificationTemplates] = useState(seedNotificationTemplates)
  const [programs, setPrograms] = useState<OrientationProgram[]>(seedPrograms)
  const [refreshedAt, setRefreshedAt] = useState<
    Partial<Record<OrientationSection, string>>
  >({})

  /** Simulated re-fetch: stamps the section and confirms via toast. */
  const refresh = useCallback((section: OrientationSection, label: string) => {
    setRefreshedAt((prev) => ({
      ...prev,
      [section]: new Date().toLocaleTimeString(),
    }))
    toast.success(`${label} refreshed — showing the latest data`)
  }, [])

  const saveSetup = useCallback(
    (enabled: boolean) => {
      setModuleEnabled(enabled)
      log({
        company: COMPANY,
        module: MODULE,
        action: `Orientation module ${enabled ? 'enabled' : 'disabled'}`,
        target: 'Orientation setup',
        outcome: enabled
          ? 'Orientation programs can now be scheduled'
          : 'Orientation scheduling is switched off for this company',
        onBehalfOf: null,
      })
      toast.success(
        `Setup saved — Orientation module ${enabled ? 'enabled' : 'disabled'}`
      )
    },
    [log]
  )

  const saveNotificationPolicy = useCallback(
    (required: boolean) => {
      setNotificationRuleRequired(required)
      log({
        company: COMPANY,
        module: MODULE,
        action: 'Notification frequency policy saved',
        target: 'Orientation notification rules',
        outcome: required
          ? 'A frequency rule is required for every location'
          : 'Frequency rules are optional',
        onBehalfOf: null,
      })
      toast.success('Notification rule policy saved')
    },
    [log]
  )

  const addRule = useCallback(
    (draft: Omit<NotificationRule, 'id'>) => {
      const created: NotificationRule = { ...draft, id: shortId('nr') }
      setRules((prev) => [created, ...prev])
      log({
        company: COMPANY,
        module: MODULE,
        action: 'Notification rule added',
        target: `${created.id} · ${draft.location}`,
        outcome: `${draft.mode} notifications on a ${draft.recurrence.toLowerCase()} schedule`,
        onBehalfOf: null,
      })
      toast.success(`Notification rule for ${draft.location} saved`)
    },
    [log]
  )

  const saveResource = useCallback(
    (draft: Omit<PhysicalResource, 'id'>, id?: string) => {
      if (id) {
        setResources((prev) =>
          prev.map((r) => (r.id === id ? { ...r, ...draft } : r))
        )
      } else {
        setResources((prev) => [{ ...draft, id: shortId('prs') }, ...prev])
      }
      log({
        company: COMPANY,
        module: MODULE,
        action: id ? 'Physical resource updated' : 'Physical resource added',
        target: draft.resource,
        outcome: `${draft.type} at ${draft.location} · capacity ${draft.capacity}`,
        onBehalfOf: null,
      })
      toast.success(
        `${draft.resource} ${id ? 'updated' : 'added'} (capacity ${draft.capacity})`
      )
    },
    [log]
  )

  const savePanel = useCallback(
    (draft: Omit<PresenterPanel, 'id'>, id?: string) => {
      if (id) {
        setPanels((prev) =>
          prev.map((p) => (p.id === id ? { ...p, ...draft } : p))
        )
      } else {
        setPanels((prev) => [{ ...draft, id: shortId('pnl') }, ...prev])
      }
      log({
        company: COMPANY,
        module: MODULE,
        action: id ? 'Presenter panel updated' : 'Presenter panel added',
        target: draft.panel,
        outcome: `Covers ${draft.topics.join(', ')} at ${draft.locations.join(', ')}`,
        onBehalfOf: null,
      })
      toast.success(`Presenter panel "${draft.panel}" ${id ? 'updated' : 'saved'}`)
    },
    [log]
  )

  const saveQuestion = useCallback(
    (draft: Omit<OrientationQuestion, 'id'>, id?: string) => {
      if (id) {
        setQuestions((prev) =>
          prev.map((q) => (q.id === id ? { ...q, ...draft } : q))
        )
      } else {
        setQuestions((prev) => [{ ...draft, id: shortId('qsn') }, ...prev])
      }
      log({
        company: COMPANY,
        module: MODULE,
        action: id ? 'Question updated' : 'Question added to bank',
        target: draft.topic,
        outcome: `Correct answer "${draft.answer}" · ${draft.locations.length} location(s)`,
        onBehalfOf: null,
      })
      toast.success(`Question ${id ? 'updated' : 'added'} under ${draft.topic}`)
    },
    [log]
  )

  const scheduleProgram = useCallback(
    (draft: Omit<OrientationProgram, 'id' | 'status'>) => {
      const created: OrientationProgram = {
        ...draft,
        id: shortId('orp'),
        status: 'scheduled',
      }
      setPrograms((prev) => [created, ...prev])
      log({
        company: COMPANY,
        module: MODULE,
        action: 'Orientation scheduled',
        target: `${created.id} · ${draft.title}`,
        outcome: `${draft.mode} on ${draft.startDate} at ${draft.location} for ${draft.participants} participant(s)`,
        onBehalfOf: null,
      })
      notify({
        recipient: draft.panel,
        kind: 'task',
        title: 'New orientation assigned',
        body: `${draft.title} (${draft.mode}) starts ${draft.startDate} at ${draft.location}.`,
      })
      toast.success(`"${draft.title}" scheduled for ${draft.startDate}`)
    },
    [log, notify]
  )

  const setProgramStatus = useCallback(
    (p: OrientationProgram, status: ProgramStatus, outcome: string) => {
      setPrograms((prev) =>
        prev.map((x) => (x.id === p.id ? { ...x, status } : x))
      )
      log({
        company: COMPANY,
        module: MODULE,
        action: `Orientation ${status.replace('-', ' ')}`,
        target: `${p.id} · ${p.title}`,
        outcome,
        onBehalfOf: null,
      })
      toast.success(`"${p.title}" is now ${status.replace('-', ' ')}`)
    },
    [log]
  )

  const notifyParticipants = useCallback(
    (p: OrientationProgram) => {
      notify({
        recipient: `${p.participants} participants`,
        kind: 'reminder',
        title: `Reminder: ${p.title}`,
        body: `Session (${p.mode}) at ${p.location} starting ${p.startDate}. Sent ${todayISO()}.`,
      })
      log({
        company: COMPANY,
        module: MODULE,
        action: 'Participants notified',
        target: `${p.id} · ${p.title}`,
        outcome: `Session reminder pushed to ${p.participants} participant(s)`,
        onBehalfOf: null,
      })
      toast.success(`Reminder sent to ${p.participants} participants`)
    },
    [log, notify]
  )

  return {
    moduleEnabled,
    notificationRuleRequired,
    setNotificationRuleRequired,
    saveSetup,
    saveNotificationPolicy,
    rules,
    addRule,
    resources,
    saveResource,
    panels,
    savePanel,
    questions,
    saveQuestion,
    emailTemplates,
    notificationTemplates,
    programs,
    scheduleProgram,
    setProgramStatus,
    notifyParticipants,
    refresh,
    refreshedAt,
  }
}

export type OrientationStore = ReturnType<typeof useOrientation>
