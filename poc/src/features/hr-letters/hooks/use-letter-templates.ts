import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { publishAuditEvent } from '@/features/audit-logs/data/live-trail'
import {
  seedTemplates,
  todayIso,
  type LetterTemplate,
  type TemplateVersion,
} from '../data/hr-letters'

export interface TemplateDraft {
  docType: LetterTemplate['docType']
  name: string
  body: string
  layout: LetterTemplate['layout']
  letterhead: boolean
  requiresApproval: boolean
  requiresAcknowledgment: boolean
  signingAuthority: string
  effectiveFrom: string
  changeSummary: string
}

export type LetterTemplatesStore = ReturnType<typeof useLetterTemplates>

/**
 * In-memory template store with effective-dated versioning (HLC-01/02/18/28):
 * every save creates a new template version while prior versions stay
 * retained, so already-generated documents keep referencing the version they
 * were produced under.
 */
export function useLetterTemplates() {
  const [templates, setTemplates] = useState<LetterTemplate[]>(seedTemplates)

  const addTemplate = useCallback((draft: TemplateDraft, editedBy: string) => {
    const version: TemplateVersion = {
      version: 1,
      effectiveFrom: draft.effectiveFrom,
      editedBy,
      summary: draft.changeSummary || 'Initial template',
    }
    const template: LetterTemplate = {
      id: `tpl-${crypto.randomUUID().slice(0, 8)}`,
      docType: draft.docType,
      name: draft.name,
      body: draft.body,
      layout: draft.layout,
      letterhead: draft.letterhead,
      requiresApproval: draft.requiresApproval,
      requiresAcknowledgment: draft.requiresAcknowledgment,
      signingAuthority: draft.signingAuthority,
      currentVersion: 1,
      versions: [version],
      updatedOn: todayIso(),
    }
    setTemplates((prev) => [template, ...prev])
    publishAuditEvent({
      module: 'HR Letters & Certificates',
      action: `Template "${draft.name}" created (v1)`,
      actor: editedBy,
      entityType: 'Company',
      actionType: 'create',
      recordId: template.id,
      recordName: `${draft.docType} template — ${draft.name}`,
    })
    toast.success(`Template "${draft.name}" created (v1, effective ${draft.effectiveFrom})`)
    return template
  }, [])

  const updateTemplate = useCallback(
    (id: string, draft: TemplateDraft, editedBy: string) => {
      setTemplates((prev) =>
        prev.map((t) => {
          if (t.id !== id) return t
          const nextVersion = t.currentVersion + 1
          return {
            ...t,
            docType: draft.docType,
            name: draft.name,
            body: draft.body,
            layout: draft.layout,
            letterhead: draft.letterhead,
            requiresApproval: draft.requiresApproval,
            requiresAcknowledgment: draft.requiresAcknowledgment,
            signingAuthority: draft.signingAuthority,
            currentVersion: nextVersion,
            versions: [
              ...t.versions,
              {
                version: nextVersion,
                effectiveFrom: draft.effectiveFrom,
                editedBy,
                summary: draft.changeSummary || 'Template updated',
              },
            ],
            updatedOn: todayIso(),
          }
        })
      )
      publishAuditEvent({
        module: 'HR Letters & Certificates',
        action: `Template "${draft.name}" saved as a new version`,
        actor: editedBy,
        entityType: 'Company',
        actionType: 'update',
        recordId: id,
        recordName: `${draft.docType} template — ${draft.name}`,
      })
      toast.success(
        'Template saved as a new version — already-generated documents are unaffected'
      )
    },
    []
  )

  return { templates, addTemplate, updateTemplate }
}
