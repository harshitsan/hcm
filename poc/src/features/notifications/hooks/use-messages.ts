import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { CURRENT_USER, TODAY } from '../data/org'
import {
  seedMessages,
  type InternalMessage,
  type MessageState,
} from '../data/messages'

export interface MessageFormValues {
  message: string
  comments: string
  locations: string[]
  departments: string[]
  positions: string[]
  recipients: string[]
}

/**
 * In-memory internal-messaging store (Kensium General Features — Messages):
 * create + share messages with single/multiple/all employees, per-recipient
 * read / unread / archive state, bulk actions and delete. `notify` simulates
 * the "system will notify the employee whenever any message is shared".
 */
export function useMessages(
  notify: (title: string, body: string) => void = () => {}
) {
  const [messages, setMessages] = useState<InternalMessage[]>(seedMessages)

  const unreadCount = useMemo(
    () => messages.filter((m) => m.state === 'unread').length,
    [messages]
  )

  const addMessage = useCallback(
    (values: MessageFormValues) => {
      const msg: InternalMessage = {
        id: `MSG-${Math.floor(600 + Math.random() * 300)}`,
        message: values.message,
        comments: values.comments,
        sender: CURRENT_USER,
        recipients: values.recipients,
        locations: values.locations,
        departments: values.departments,
        positions: values.positions,
        createdAt: TODAY,
        // The sender's own copy starts as read.
        state: 'read',
      }
      setMessages((prev) => [msg, ...prev])
      const audience =
        values.recipients.includes('All employees')
          ? 'all employees'
          : `${values.recipients.length} employee(s)`
      notify(
        `New message shared: ${values.message}`,
        `${CURRENT_USER} shared a message with ${audience}. Recipients were notified on the dashboard; no email id is required to receive it.`
      )
      toast.success(
        `Message created and shared with ${audience} — recipients notified (simulated).`
      )
    },
    [notify]
  )

  const setState = useCallback((ids: string[], state: MessageState) => {
    if (ids.length === 0) return
    setMessages((prev) =>
      prev.map((m) => (ids.includes(m.id) ? { ...m, state } : m))
    )
    const label =
      state === 'archived' ? 'archived' : `marked as ${state}`
    toast.success(
      `${ids.length} message${ids.length === 1 ? '' : 's'} ${label}.`
    )
  }, [])

  /** Mark read silently (used when opening Details). */
  const markReadQuiet = useCallback((id: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === id && m.state === 'unread' ? { ...m, state: 'read' } : m
      )
    )
  }, [])

  const deleteMessages = useCallback((ids: string[]) => {
    if (ids.length === 0) return
    setMessages((prev) => prev.filter((m) => !ids.includes(m.id)))
    toast.success(
      `${ids.length} message${ids.length === 1 ? '' : 's'} deleted.`
    )
  }, [])

  return {
    messages,
    unreadCount,
    addMessage,
    setState,
    markReadQuiet,
    deleteMessages,
  }
}
