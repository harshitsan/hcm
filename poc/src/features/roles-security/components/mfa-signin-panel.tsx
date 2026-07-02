import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  CURRENT_EMPLOYEE_ID,
  HOME_COMPANY_ID,
  companyName,
  personById,
} from '../data/directory'
import { type SecurityConfigStore } from '../hooks/use-security-config'
import { SecurityBadge } from './badges'

type Stage = 'signed-out' | 'enroll' | 'challenge' | 'signed-in'

/**
 * Employee MFA sign-in simulation (RSEC-12): when the company has MFA
 * enabled the user must enroll a factor and complete the challenge before
 * access is granted; failing or cancelling denies access. With MFA disabled
 * no additional factor is requested. Reads the live company policy, so
 * toggling MFA in the Authentication tab changes this flow immediately.
 */
export function MfaSigninPanel({ store }: { store: SecurityConfigStore }) {
  const [stage, setStage] = useState<Stage>('signed-out')
  const [enrolled, setEnrolled] = useState(false)
  const [code, setCode] = useState('')

  const me = personById(CURRENT_EMPLOYEE_ID)
  const mfaEnabled = store.securityFor(HOME_COMPANY_ID)?.mfaEnabled ?? false
  if (!me) return null

  const signIn = () => {
    if (!mfaEnabled) {
      setStage('signed-in')
      toast.success(
        `Signed in — MFA is disabled for ${companyName(HOME_COMPANY_ID)}, no additional factor required`
      )
      return
    }
    if (!enrolled) {
      setStage('enroll')
      toast.info('First sign-in with MFA enabled — enroll your factor')
      return
    }
    setStage('challenge')
  }

  const enroll = () => {
    setEnrolled(true)
    setStage('challenge')
    toast.success('Authenticator enrolled — complete the challenge to finish sign-in')
  }

  const verify = () => {
    if (/^\d{6}$/.test(code)) {
      setStage('signed-in')
      setCode('')
      toast.success('Additional factor verified — access granted')
    } else {
      toast.error('MFA challenge failed — access denied')
    }
  }

  const cancel = () => {
    setStage('signed-out')
    setCode('')
    toast.error('MFA challenge cancelled — access denied')
  }

  return (
    <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
      <div className='mb-2 flex items-center gap-2'>
        <h3 className='text-neutral-1600 text-sm font-medium'>
          Sign-in simulation — {me.name} at {companyName(HOME_COMPANY_ID)}
        </h3>
        <SecurityBadge value={mfaEnabled ? 'Enabled' : 'Disabled'} />
        <span className='text-neutral-1000 text-xs'>company MFA policy</span>
      </div>

      {stage === 'signed-out' && (
        <div className='flex items-center gap-3'>
          <Button className='h-7' onClick={signIn}>
            Sign in (password accepted)
          </Button>
          <span className='text-neutral-1000 text-xs'>
            {mfaEnabled
              ? 'MFA is enabled for your company — an additional factor will be required'
              : 'MFA is disabled for your company — you will not be prompted for a factor'}
          </span>
        </div>
      )}

      {stage === 'enroll' && (
        <div className='flex items-center gap-3'>
          <Button className='h-7' onClick={enroll}>
            Enroll authenticator app
          </Button>
          <span className='text-neutral-1000 text-xs'>
            your company requires an authentication factor before first access
          </span>
        </div>
      )}

      {stage === 'challenge' && (
        <div className='flex flex-wrap items-center gap-3'>
          <Input
            placeholder='6-digit code'
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className='h-7 w-36'
            maxLength={6}
          />
          <Button className='h-7' onClick={verify}>
            Verify factor
          </Button>
          <Button variant='outline' className='h-7' onClick={cancel}>
            Cancel
          </Button>
          <span className='text-neutral-1000 text-xs'>
            any 6 digits verify in this demo; anything else is denied
          </span>
        </div>
      )}

      {stage === 'signed-in' && (
        <div className='flex items-center gap-3'>
          <SecurityBadge value='Allowed' />
          <span className='text-neutral-1900 text-sm'>
            Signed in{mfaEnabled ? ' with MFA' : ''} — session active
          </span>
          <Button
            variant='outline'
            className='h-7'
            onClick={() => setStage('signed-out')}
          >
            Sign out
          </Button>
        </div>
      )}

      <p className='text-neutral-1000 pt-2 text-xs'>
        Each company&apos;s MFA policy is enforced independently — a Company
        Admin toggling the policy in the Authentication tab changes this
        sign-in flow for {companyName(HOME_COMPANY_ID)} only.
      </p>
    </div>
  )
}
