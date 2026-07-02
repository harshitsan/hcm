import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { seedCompanies } from '../data/group-companies'
import { seedTemplates, type PolicyTemplate } from '../data/sharing'
import { type RecordAudit } from './use-audit'

const today = () => new Date().toISOString().slice(0, 10)

/**
 * Shared policy templates (GRP-23). Templates are read-only to member
 * companies; adopting creates an independent per-company instance and later
 * template versions never propagate automatically.
 */
export function usePolicyTemplates(record: RecordAudit) {
  const [templates, setTemplates] = useState<PolicyTemplate[]>(seedTemplates)

  const name = useCallback(
    (companyId: string) =>
      seedCompanies.find((c) => c.id === companyId)?.name ?? companyId,
    []
  )

  const shareTemplate = useCallback(
    (
      draft: Pick<PolicyTemplate, 'name' | 'category' | 'sourceCompanyId' | 'groupId'>,
      groupCode: string,
      sharedBy: string
    ) => {
      setTemplates((prev) => [
        {
          id: `pt-${crypto.randomUUID().slice(0, 6)}`,
          ...draft,
          version: 1,
          updatedOn: today(),
          sharedBy,
          instances: [],
        },
        ...prev,
      ])
      record({
        action: 'POLICY_TEMPLATE_SHARED',
        category: 'policy',
        groupCode,
        targetCompany: name(draft.sourceCompanyId),
        detail: `"${draft.name}" shared with the group as a read-only template (v1)`,
      })
      toast.success(`"${draft.name}" shared as a read-only template`)
    },
    [name, record]
  )

  const adoptTemplate = useCallback(
    (templateId: string, companyId: string, groupCode: string) => {
      const tpl = templates.find((t) => t.id === templateId)
      if (!tpl) return
      if (tpl.instances.some((i) => i.companyId === companyId)) {
        toast.error(`${name(companyId)} already has an instance of "${tpl.name}"`)
        return
      }
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === templateId
            ? {
                ...t,
                instances: [
                  ...t.instances,
                  {
                    id: `pi-${crypto.randomUUID().slice(0, 6)}`,
                    companyId,
                    adoptedVersion: t.version,
                    adoptedOn: today(),
                    locallyEdited: false,
                  },
                ],
              }
            : t
        )
      )
      record({
        action: 'POLICY_INSTANCE_CREATED',
        category: 'policy',
        groupCode,
        targetCompany: name(companyId),
        detail: `${name(companyId)} adopted "${tpl.name}" v${tpl.version} as an independent company instance`,
      })
      toast.success(`Independent instance of "${tpl.name}" created for ${name(companyId)}`)
    },
    [name, record, templates]
  )

  const editInstance = useCallback(
    (templateId: string, instanceId: string, groupCode: string) => {
      const tpl = templates.find((t) => t.id === templateId)
      const inst = tpl?.instances.find((i) => i.id === instanceId)
      if (!tpl || !inst) return
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === templateId
            ? {
                ...t,
                instances: t.instances.map((i) =>
                  i.id === instanceId ? { ...i, locallyEdited: true } : i
                ),
              }
            : t
        )
      )
      record({
        action: 'POLICY_INSTANCE_EDITED',
        category: 'policy',
        groupCode,
        targetCompany: name(inst.companyId),
        detail: `${name(inst.companyId)} edited its instance of "${tpl.name}" — the shared template and other companies are unaffected`,
      })
      toast.success('Instance edited — affects only this company, never the shared template')
    },
    [name, record, templates]
  )

  const updateTemplate = useCallback(
    (templateId: string, groupCode: string) => {
      const tpl = templates.find((t) => t.id === templateId)
      if (!tpl) return
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === templateId ? { ...t, version: t.version + 1, updatedOn: today() } : t
        )
      )
      record({
        action: 'POLICY_TEMPLATE_UPDATED',
        category: 'policy',
        groupCode,
        targetCompany: name(tpl.sourceCompanyId),
        detail: `"${tpl.name}" updated to v${tpl.version + 1} — existing company instances NOT auto-updated`,
      })
      toast.success(
        `Template updated to v${tpl.version + 1} — changes do not propagate to existing instances`
      )
    },
    [name, record, templates]
  )

  return { templates, shareTemplate, adoptTemplate, editInstance, updateTemplate }
}

export type PolicyTemplatesStore = ReturnType<typeof usePolicyTemplates>
