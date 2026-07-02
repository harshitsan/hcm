import { type AuthConfigStore } from '../hooks/use-auth-config'
import { MethodConfigPanel } from './method-config-panel'
import { PolicyPanel } from './policy-panel'
import { TemplatesPanel } from './templates-panel'

interface ConfigTabProps {
  config: AuthConfigStore
}

/**
 * Governed authentication configuration (AUTH-09/10/17/18): platform method
 * availability, the versioned tenant password policy and the notification
 * templates used for reset links and security alerts.
 */
export function ConfigTab({ config }: ConfigTabProps) {
  return (
    <div className='grid gap-4 xl:grid-cols-2'>
      <MethodConfigPanel config={config} />
      <PolicyPanel config={config} />
      <div className='xl:col-span-2'>
        <TemplatesPanel config={config} />
      </div>
    </div>
  )
}
