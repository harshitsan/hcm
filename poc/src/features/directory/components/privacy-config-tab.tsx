import { RoleGate } from '@/context/role-context'
import { type DirectoryConfigStore } from '../hooks/use-directory-config'
import { CompanyOverridePanel } from './config/company-override-panel'
import { CustomFieldsPanel } from './config/custom-fields-panel'
import { PlatformDefaultsPanel } from './config/platform-defaults-panel'
import { RulesTracePanel } from './config/rules-trace-panel'

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
