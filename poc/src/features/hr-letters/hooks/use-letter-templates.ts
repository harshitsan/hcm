import { useCallback, useState } from 'react'
import { toast } from 'sonner'
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
  missingValueBehavior: LetterTemplate['missingValueBehavior']
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
      missingValueBehavior: draft.missingValueBehavior,
      currentVersion: 1,
      versions: [version],
      updatedOn: todayIso(),
    }
    setTemplates((prev) => [template, ...prev])
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
            missingValueBehavior: draft.missingValueBehavior,
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
      toast.success(
        'Template saved as a new version — already-generated documents are unaffected'
      )
    },
    []
  )

  return { templates, addTemplate, updateTemplate }
}
