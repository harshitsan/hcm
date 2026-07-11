import { useRole, type Role } from '@/context/role-context'
import { Separator } from '@/components/ui/separator'

export interface AdminSection {
  title: string
  /** Roles that see this section; omit for "everyone with the tab". */
  roles?: Role[]
  content: React.ReactNode
}

/**
 * Canonical Admin tab layout (scaffold kit §3): stacked role-gated sections
 * separated by rules — replaces nested admin Tabs and pill navs. The
 * EngineArtifactsPanel slot renders ONCE at the top when provided.
 */
export function AdminSections({
  engineArtifacts,
  sections,
}: {
  engineArtifacts?: React.ReactNode
  sections: AdminSection[]
}) {
  const { role } = useRole()
  const visible = sections.filter((s) => !s.roles || s.roles.includes(role))

  return (
    <div className='flex w-full flex-col'>
      {engineArtifacts}
      {visible.map((s, i) => (
        <section key={s.title}>
          {(i > 0 || engineArtifacts) && <Separator className='my-5' />}
          <h3 className='text-paragraph-md text-neutral-1400 mb-3 font-semibold'>
            {s.title}
          </h3>
          {s.content}
        </section>
      ))}
    </div>
  )
}
