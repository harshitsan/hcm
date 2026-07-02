import { IdentificationCard } from 'phosphor-react'
import { Badge } from '@/components/ui/badge'

/**
 * Employee (Non-User) surface (RPT-16): no login-based analytics, but an
 * explanation that their HR-maintained data is fully included in registers,
 * eligibility evaluation and completeness checks run by authorized admins.
 */
export function NonUserPanel() {
  const inclusions = [
    {
      title: 'Attendance, leave and wage registers',
      detail:
        'Your attendance days, leave and wage lines appear in the statutory registers HR generates each period — no login needed.',
    },
    {
      title: 'PF / ESIC eligibility',
      detail:
        'The Rules engine evaluates your wage against the PF and ESIC decision tables exactly like any logged-in employee.',
    },
    {
      title: 'Statutory data completeness',
      detail:
        'If your UAN, PAN or ESIC number is missing, your record is flagged to HR so it can be completed before filing.',
    },
    {
      title: 'Workforce reports and dashboards',
      detail:
        'Headcount, diversity and login-status reports count you and mark your record distinctly as a non-user.',
    },
  ]

  return (
    <div className='w-full'>
      <div className='mb-3 flex items-center gap-2'>
        <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
          My Data in Reports
        </h2>
        <Badge variant='badge_inactive'>Non-user record</Badge>
      </div>
      <div className='rounded-[8px] border border-gray-200 bg-white p-5'>
        <div className='mb-4 flex items-start gap-3'>
          <IdentificationCard
            size={20}
            weight='bold'
            className='text-neutral-1000 mt-0.5 shrink-0'
          />
          <p className='text-paragraph-sm text-neutral-1000'>
            Your employee record is maintained by HR and you don't have an
            application login. You are still fully covered by every statutory
            register and compliance check — authorized admins report on your
            data without you needing to sign in.
          </p>
        </div>
        <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
          {inclusions.map((item) => (
            <div
              key={item.title}
              className='rounded-[6px] border border-gray-100 p-3'
            >
              <p className='text-neutral-1600 text-sm font-medium'>
                {item.title}
              </p>
              <p className='text-neutral-1000 pt-1 text-xs'>{item.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
