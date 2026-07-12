import { Info } from 'phosphor-react'
import { RoleGate } from '@/context/role-context'
import { Card, CardContent } from '@/components/ui/card'
import { type DirectoryConfigStore } from '../hooks/use-directory-config'
import { CompanyOverridePanel } from './config/company-override-panel'
import { CustomFieldsPanel } from './config/custom-fields-panel'
import { PlatformDefaultsPanel } from './config/platform-defaults-panel'
import { RulesTracePanel } from './config/rules-trace-panel'

/** Admin-facing allow-list note: what the directory can and can never show. */
function DirectoryScopeNote() {
  return (
    <Card className='border-gray-200'>
      <CardContent className='flex gap-2.5 px-4 py-3'>
        <Info size={16} className='text-neutral-1000 mt-0.5 shrink-0' />
        <div className='space-y-1'>
          <p className='text-neutral-1600 text-sm font-medium'>
            What the directory shows
          </p>
          <p className='text-neutral-1000 text-xs'>
            The directory works from a defined allow-list: name and employee
            code, position, department, location, work email and work phone
            (where policy permits), employment status and non-sensitive custom
            fields.
          </p>
          <p className='text-neutral-1000 text-xs'>
            It never shows government IDs, date of birth, personal contact
            details or compensation data — these are excluded structurally in
            Phase 1, so no platform default or company override can surface
            them on any card, detail view, search result or export.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Governed privacy & field configuration (DIR-10/11/19/20/21):
 * platform defaults for the Platform Admin, versioned company overrides and
 * custom-field schema for the Company Admin, plus the shared rules-engine
 * inspector.
 */
export function PrivacyConfigTab({ config }: { config: DirectoryConfigStore }) {
  return (
    <div className='grid gap-4 xl:grid-cols-2'>
      <div className='space-y-4'>
        <DirectoryScopeNote />
        <RoleGate roles={['Platform Admin']}>
          <PlatformDefaultsPanel config={config} />
        </RoleGate>
        <CompanyOverridePanel config={config} />
      </div>
      <div className='space-y-4'>
        <RoleGate roles={['Company Admin', 'Platform Admin']}>
          <CustomFieldsPanel config={config} />
        </RoleGate>
        <RulesTracePanel config={config} />
      </div>
    </div>
  )
}
