import { type AuthConfigStore } from '../hooks/use-auth-config'
import { MethodConfigPanel } from './method-config-panel'
import { MfaPanel } from './mfa-panel'
import { PolicyPanel } from './policy-panel'
import { TemplatesPanel } from './templates-panel'

interface ConfigTabProps {
  config: AuthConfigStore
}

/**
 * Governed authentication configuration (AUTH-09/10/17/18 + BRD 6.12.5):
 * platform method availability, the versioned tenant password policy, the
 * per-company MFA requirement and the notification templates used for reset
 * links and security alerts.
 */
export function ConfigTab({ config }: ConfigTabProps) {
  return (
    <div className='grid gap-4 xl:grid-cols-2'>
      <MethodConfigPanel config={config} />
      <PolicyPanel config={config} />
      <MfaPanel config={config} />
      <TemplatesPanel config={config} />
    </div>
  )
}
