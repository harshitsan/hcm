import { Buildings, Clock, Globe, Info, MapPin } from 'phosphor-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EMPLOYEE_PROFILE, JURISDICTIONS } from '../data/locations'
import type { LocationsStore } from '../hooks/use-locations'
import type { OrganizationStore } from '../hooks/use-organization'
import { formatDate } from '../utils/format'

interface MyLocationTabProps {
  store: LocationsStore
  org: OrganizationStore
}

/**
 * Employee self-service view of the assigned location (LOC-10): read-only —
 * no configuration, sharing or ownership controls, and only the location
 * relevant to the employee's own company is visible.
 */
export function MyLocationTab({ store, org }: MyLocationTabProps) {
  const location = store.locationById.get(EMPLOYEE_PROFILE.locationId)
  const jurisdiction = location
    ? JURISDICTIONS.find((j) => j.id === location.jurisdictionId)
    : undefined

  if (!location) {
    return (
      <Card className='gap-2 border-none bg-white py-3'>
        <CardContent className='px-4 py-6 text-sm'>
          No location is currently assigned to you. Contact your Company Admin.
        </CardContent>
      </Card>
    )
  }

  const rows = [
    {
      icon: <Buildings size={16} weight='bold' />,
      label: 'Physical site',
      value: `${location.name} (${location.acronym})`,
    },
    {
      icon: <Globe size={16} weight='bold' />,
      label: 'Jurisdiction',
      value: jurisdiction ? `${jurisdiction.name}, ${jurisdiction.country}` : '—',
    },
    {
      icon: <MapPin size={16} weight='bold' />,
      label: 'Address',
      value: [
        location.address1,
        location.address2,
        `${location.city}, ${location.state} ${location.pinCode}`,
        location.country,
      ]
        .filter(Boolean)
        .join(', '),
    },
    {
      icon: <Clock size={16} weight='bold' />,
      label: 'Site timezone',
      value: `${location.timezone} — attendance and schedules run in this local time`,
    },
  ]

  return (
    <div className='w-full max-w-2xl space-y-4'>
      <Card className='gap-2 border-none bg-white py-3'>
        <CardHeader className='flex items-center justify-between px-4'>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            My assigned location
          </CardTitle>
          <Badge variant='open'>Assigned to you</Badge>
        </CardHeader>
        <CardContent className='px-4'>
          <p className='text-paragraph-sm text-neutral-1000 mb-3'>
            {EMPLOYEE_PROFILE.name} ({EMPLOYEE_PROFILE.employeeId}) ·{' '}
            {EMPLOYEE_PROFILE.designation} ·{' '}
            {store.companyName(EMPLOYEE_PROFILE.companyId)} · Assigned since{' '}
            {formatDate(location.createdOn, org.localization.dateFormat)}
          </p>
          <dl className='space-y-3'>
            {rows.map((row) => (
              <div key={row.label} className='flex items-start gap-3'>
                <span className='text-neutral-1000 mt-0.5'>{row.icon}</span>
                <div>
                  <dt className='text-paragraph-sm text-neutral-1000'>{row.label}</dt>
                  <dd className='text-neutral-1600 text-sm font-medium'>
                    {row.value}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <Card className='gap-2 border-none bg-white py-3'>
        <CardContent className='flex items-start gap-3 px-4'>
          <Info size={16} weight='bold' className='text-blue-1400 mt-0.5 shrink-0' />
          <p className='text-paragraph-sm text-neutral-1000'>
            This view is read-only. Location configuration, sharing and
            ownership are managed by your Company Admin, and you only see
            locations relevant to your own company.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
