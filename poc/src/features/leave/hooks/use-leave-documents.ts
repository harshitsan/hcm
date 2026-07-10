import { useState } from 'react'
import { toast } from 'sonner'
import {
  seedLeaveDocuments,
  type LeaveDocumentSubmission,
} from '../data/leave-documents'
import { shortId, todayISO } from '../data/shared'

export type LeaveDocumentInput = Omit<LeaveDocumentSubmission, 'id' | 'submittedOn'>

const STATUS_TOASTS: Record<LeaveDocumentSubmission['status'], string> = {
  submitted: 'Document submitted against the request',
  'submit-later': 'Noted — a reminder will be sent before the due date',
  'physical-copy': 'Physical copy recorded — hand it to your HR partner',
  'not-needed': 'Marked as not needed — your comments were saved',
}

/**
 * Document submissions store (PTO #29–#31). One submission per request —
 * upsert replaces the existing row for the request or appends a new one.
 */
export function useLeaveDocuments() {
  const [submissions, setSubmissions] =
    useState<LeaveDocumentSubmission[]>(seedLeaveDocuments)

  const submissionsFor = (requestId: string) =>
    submissions.filter((s) => s.requestId === requestId)

  const upsert = (input: LeaveDocumentInput) => {
    const row: LeaveDocumentSubmission = {
      ...input,
      id: shortId('ldoc'),
      submittedOn: input.status === 'submitted' ? todayISO() : undefined,
    }
    setSubmissions((prev) => {
      const existing = prev.find((s) => s.requestId === input.requestId)
      return existing
        ? prev.map((s) =>
            s.requestId === input.requestId ? { ...row, id: s.id } : s
          )
        : [...prev, row]
    })
    toast.success(STATUS_TOASTS[input.status])
  }

  return { submissions, submissionsFor, upsert }
}

export type LeaveDocumentsStore = ReturnType<typeof useLeaveDocuments>
