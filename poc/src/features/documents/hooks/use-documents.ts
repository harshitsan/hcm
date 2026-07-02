import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  expiryStatusOf,
  seedDocuments,
  type DocumentRecord,
} from '../data/documents'
import { todayIso } from '../data/org'

export type DocumentDraft = Omit<DocumentRecord, 'id' | 'uploadDate' | 'uploadedBy'>

export interface ExpiryNotification {
  id: string
  documentName: string
  company: string
  status: 'Upcoming expiry' | 'Expired'
  recipient: string
  generatedAt: string
  message: string
}

/**
 * In-memory documents store. Stands in for the document service while the
 * backend is disabled — uploads persist metadata only and reset on reload.
 * Also hosts the notification engine (DOC-20): it evaluates every document
 * against the configured lead time and fires template-based alerts once per
 * document + status + expiry date, so renewed documents never re-alert.
 */
export function useDocuments() {
  const [documents, setDocuments] = useState<DocumentRecord[]>(seedDocuments)
  const [notifications, setNotifications] = useState<ExpiryNotification[]>([])
  const [firedKeys, setFiredKeys] = useState<string[]>([])

  const addDocument = useCallback(
    (draft: DocumentDraft, uploadedBy: string) => {
      const record: DocumentRecord = {
        ...draft,
        id: `doc-${crypto.randomUUID().slice(0, 8)}`,
        uploadDate: todayIso(),
        uploadedBy,
      }
      setDocuments((prev) => [record, ...prev])
      return record
    },
    []
  )

  const updateDocument = useCallback((id: string, draft: DocumentDraft) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...draft } : d))
    )
  }, [])

  const deleteDocument = useCallback((id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id))
  }, [])

  const runExpiryEngine = useCallback(
    (leadDays: number, template: string) => {
      const today = todayIso()
      const generated: ExpiryNotification[] = []
      const newKeys: string[] = []

      documents.forEach((doc) => {
        const status = expiryStatusOf(doc.expiryDate, leadDays, today)
        if (status !== 'expired' && status !== 'expiring') return
        const label: ExpiryNotification['status'] =
          status === 'expired' ? 'Expired' : 'Upcoming expiry'
        // Renewing a document changes its expiry date, producing a new key —
        // cleared/renewed documents never re-fire for the old date.
        const key = `${doc.id}|${label}|${doc.expiryDate}`
        if (firedKeys.includes(key) || newKeys.includes(key)) return
        newKeys.push(key)
        generated.push({
          id: `ntf-${crypto.randomUUID().slice(0, 8)}`,
          documentName: doc.name,
          company: doc.company,
          status: label,
          recipient: 'Document custodian + Company Admin',
          generatedAt: today,
          message: template
            .replace('{document}', doc.name)
            .replace('{status}', label.toLowerCase())
            .replace('{date}', doc.expiryDate ?? '-'),
        })
      })

      if (generated.length === 0) {
        toast.info(
          'Notification engine ran — no new documents entered the alert window'
        )
        return
      }
      setNotifications((prev) => [...generated, ...prev])
      setFiredKeys((prev) => [...prev, ...newKeys])
      toast.success(
        `Notification engine generated ${generated.length} expiry ${
          generated.length === 1 ? 'alert' : 'alerts'
        } from the configured template`
      )
    },
    [documents, firedKeys]
  )

  return {
    documents,
    addDocument,
    updateDocument,
    deleteDocument,
    notifications,
    runExpiryEngine,
  }
}

export type DocumentsStore = ReturnType<typeof useDocuments>
