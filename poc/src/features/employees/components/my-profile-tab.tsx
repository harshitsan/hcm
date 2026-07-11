import { useCallback, useState } from 'react'
import { FloppyDisk, Plus, Trash } from 'phosphor-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CustomFieldsSection,
  validateCustomFields,
} from '@/features/custom-fields/components/custom-fields-section'
import { type FieldValue } from '@/features/custom-fields/data/records'
import {
  companyGroup,
  companyName,
  SELF_EMPLOYEE_ID,
} from '../data/employees'
import { LIFE_EVENT_TYPES, seedDependantTypes } from '../data/configuration'
import { type EmployeesStore } from '../hooks/use-employees'
import { useProfileExtras } from '../hooks/use-profile-extras'
import {
  getProfileFieldValues,
  saveProfileFieldValues,
} from '../hooks/use-profile-field-values'
import { ClientFeedbackSection } from './profile/client-feedback-section'
import { ContactInfoSection } from './profile/contact-info-section'
import { EducationSection } from './profile/education-section'
import { PersonalInfoSection } from './profile/personal-info-section'
import { SkillsSection } from './profile/skills-section'
import { WorkExperienceSection } from './profile/work-experience-section'
import { InfoField, SectionTitle, StatusBadge } from './shared'

/** Anchor targets for the profile's in-page section navigation. */
const PROFILE_SECTIONS = [
  { id: 'profile-placement', label: 'Placement' },
  { id: 'profile-reporting', label: 'Reporting & leave' },
  { id: 'profile-statutory', label: 'Statutory' },
  { id: 'profile-dependants', label: 'Dependants & events' },
  { id: 'profile-personal', label: 'Personal info' },
  { id: 'profile-contact', label: 'Contact & address' },
  { id: 'profile-education', label: 'Education' },
  { id: 'profile-experience', label: 'Work experience' },
  { id: 'profile-skills', label: 'Skills & certifications' },
  { id: 'profile-feedback', label: 'Client feedback' },
  { id: 'profile-custom', label: 'Custom fields' },
] as const

/**
 * Employee (User) self-service: my organizational placement (EMP-13), my
 * reporting lines (EMP-14), my leave & statutory data — read-only (EMP-15),
 * my dependants (EMP-33) and life events (EMP-34) against configured types,
 * plus the Kensium profile extras — personal info (photo, place of birth,
 * languages), contact & address with emergency contacts, education, work
 * experience, skills & certifications and client feedback.
 */
export function MyProfileTab({ store }: { store: EmployeesStore }) {
  const me = store.employees.find((e) => e.id === SELF_EMPLOYEE_ID)
  const extras = useProfileExtras()
  const [depName, setDepName] = useState('')
  const [depRel, setDepRel] = useState('')
  const [depDob, setDepDob] = useState('')
  const [eventType, setEventType] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventDetails, setEventDetails] = useState('')
  // A6: employee-level custom field values (employee profile form) — draft
  // starts from the last saved snapshot; Save validates then persists.
  const [customValues, setCustomValues] = useState<Record<string, FieldValue>>(
    () => ({ ...getProfileFieldValues() })
  )
  const [customErrors, setCustomErrors] = useState<Record<string, string>>({})
  const handleCustomChange = useCallback((fieldId: string, value: FieldValue) => {
    setCustomValues((prev) => ({ ...prev, [fieldId]: value }))
    setCustomErrors((prev) => {
      if (!(fieldId in prev)) return prev
      const next = { ...prev }
      delete next[fieldId]
      return next
    })
  }, [])

  const saveCustomFields = () => {
    const errors = validateCustomFields('Employees', customValues, 'employee')
    setCustomErrors(errors)
    const count = Object.keys(errors).length
    if (count > 0) {
      toast.error(
        `Cannot save — fix ${count} field${count === 1 ? '' : 's'} highlighted below`
      )
      return
    }
    saveProfileFieldValues(customValues)
    toast.success('Custom profile fields saved to your employee record')
  }

  const jumpTo = (id: string) =>
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  if (!me) {
    return (
      <p className='text-paragraph-sm text-neutral-1000'>
        Your employee record was not found in this company context.
      </p>
    )
  }

  const myDelegation = store.delegations.find(
    (d) =>
      d.status === 'Active' &&
      (d.manager === me.primaryManager || d.manager === me.name)
  )

  const addDependant = () => {
    if (!depName || !depRel || !depDob) return
    store.addDependant(me.id, {
      name: depName,
      relationship: depRel,
      dateOfBirth: depDob,
    })
    setDepName('')
    setDepRel('')
    setDepDob('')
  }

  const addLifeEvent = () => {
    if (!eventType || !eventDate) return
    store.addLifeEvent(me.id, {
      type: eventType,
      date: eventDate,
      details: eventDetails,
    })
    setEventType('')
    setEventDate('')
    setEventDetails('')
  }

  return (
    <div className='space-y-5'>
      <nav
        aria-label='Profile sections'
        className='sticky top-0 z-10 flex flex-wrap items-center gap-1.5 rounded-[8px] border border-gray-200 bg-white p-2'
      >
        <span className='text-paragraph-sm text-neutral-1000 px-1 font-medium'>
          Jump to:
        </span>
        {PROFILE_SECTIONS.map((s) => (
          <button
            key={s.id}
            type='button'
            onClick={() => jumpTo(s.id)}
            className='text-neutral-1000 rounded-md border border-gray-200 bg-white px-2 py-0.5 text-xs font-medium transition-colors hover:border-gray-300 hover:text-black'
          >
            {s.label}
          </button>
        ))}
      </nav>

      <div className='grid gap-5 lg:grid-cols-2'>
      <Card id='profile-placement' className='scroll-mt-16 border-gray-200'>
        <CardContent className='space-y-4 pt-4'>
          <SectionTitle>My organizational placement (view only)</SectionTitle>
          <div className='grid grid-cols-2 gap-4'>
            <InfoField label='Company' value={companyName(me.companyId)} />
            <InfoField label='Group company' value={companyGroup(me.companyId)} />
            <InfoField label='Jurisdiction' value={me.jurisdiction} />
            <InfoField label='Position' value={me.position} />
            <InfoField label='Departments' value={me.departments.join(', ')} />
            <InfoField
              label='Groups'
              value={me.groups.length ? me.groups.join(', ') : 'None'}
            />
            <InfoField label='Locations' value={me.locations.join(', ')} />
            <InfoField
              label='Lifecycle stage'
              value={<StatusBadge status={me.lifecycleStage} />}
            />
          </div>
          <p className='text-paragraph-sm text-neutral-1000'>
            Company-controlled assignments are read-only. Only your record in
            this company context is shown.
          </p>
        </CardContent>
      </Card>

      <Card id='profile-reporting' className='scroll-mt-16 border-gray-200'>
        <CardContent className='space-y-4 pt-4'>
          <SectionTitle>My reporting structure (as of today)</SectionTitle>
          <div className='space-y-2'>
            <div className='flex items-center justify-between rounded-md border border-gray-200 px-3 py-2'>
              <div>
                <p className='text-sm font-medium'>{me.primaryManager}</p>
                <p className='text-paragraph-sm text-neutral-1000'>
                  Effective {me.managerEffectiveDate}
                </p>
              </div>
              <Badge variant='badge_active'>Primary manager</Badge>
            </div>
            {me.dottedLineManagers.map((m) => (
              <div
                key={m}
                className='flex items-center justify-between rounded-md border border-gray-200 px-3 py-2'
              >
                <p className='text-sm font-medium'>{m}</p>
                <Badge variant='open'>Dotted-line</Badge>
              </div>
            ))}
            {myDelegation && (
              <div className='flex items-center justify-between rounded-md border border-gray-200 px-3 py-2'>
                <div>
                  <p className='text-sm font-medium'>
                    {myDelegation.actingManager}
                  </p>
                  <p className='text-paragraph-sm text-neutral-1000'>
                    {myDelegation.startDate} → {myDelegation.endDate}
                  </p>
                </div>
                <Badge variant='overdue'>Acting manager</Badge>
              </div>
            )}
          </div>

          <SectionTitle>My leave balances & statutory entitlements</SectionTitle>
          <ul className='space-y-1.5'>
            {me.leaveBalances.map((b) => (
              <li
                key={b.type}
                className='flex items-center justify-between rounded-md border border-gray-200 px-3 py-1.5 text-sm'
              >
                <span className='font-medium'>{b.type}</span>
                <span className='text-neutral-1000'>
                  {b.balance} available · {b.statutoryEntitlement}/yr statutory
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card id='profile-statutory' className='scroll-mt-16 border-gray-200'>
        <CardContent className='space-y-4 pt-4'>
          <SectionTitle>My statutory data (read-only)</SectionTitle>
          <div className='grid grid-cols-2 gap-4'>
            <InfoField label='UAN' value={me.uan} />
            <InfoField label='ESIC number' value={me.esicNumber} />
            <InfoField
              label='ESI / PF'
              value={<StatusBadge status={me.esiPfEligibility} />}
            />
            <InfoField
              label='Professional Tax'
              value={me.ptRegistered ? 'Registered' : 'Not registered'}
            />
            <InfoField
              label='LWF'
              value={me.lwfApplicable ? 'Applicable' : 'Not applicable'}
            />
            <InfoField
              label='Maternity benefit'
              value={<StatusBadge status={me.maternityEligibility} />}
            />
            <InfoField
              label='Gratuity'
              value={<StatusBadge status={me.gratuityEligibility} />}
            />
          </div>
          <p className='text-paragraph-sm text-neutral-1000'>
            Shown for your own record only. Spot a discrepancy? Raise it with
            HR for correction — values are view-only here.
          </p>
        </CardContent>
      </Card>

      <Card id='profile-dependants' className='scroll-mt-16 border-gray-200'>
        <CardContent className='space-y-4 pt-4'>
          <SectionTitle>My dependants</SectionTitle>
          {me.dependants.length === 0 && (
            <p className='text-paragraph-sm text-neutral-1000'>
              No dependants recorded yet.
            </p>
          )}
          <ul className='space-y-1.5'>
            {me.dependants.map((d) => (
              <li
                key={d.id}
                className='flex items-center justify-between rounded-md border border-gray-200 px-3 py-1.5 text-sm'
              >
                <span>
                  <span className='font-medium'>{d.name}</span>{' '}
                  <span className='text-neutral-1000'>
                    — {d.relationship}, b. {d.dateOfBirth}
                  </span>
                </span>
                <Button
                  variant='icon2'
                  className='h-7 w-7'
                  aria-label='Remove dependant'
                  onClick={() => store.removeDependant(me.id, d.id)}
                >
                  <Trash size={14} />
                </Button>
              </li>
            ))}
          </ul>
          <div className='grid grid-cols-3 gap-2'>
            <Input
              placeholder='Name'
              value={depName}
              onChange={(e) => setDepName(e.target.value)}
            />
            <Select value={depRel} onValueChange={setDepRel}>
              <SelectTrigger variant='secondary' className='w-full'>
                <SelectValue placeholder='Relationship' />
              </SelectTrigger>
              <SelectContent>
                {seedDependantTypes.map((t) => (
                  <SelectItem key={t.id} value={t.name}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type='date'
              value={depDob}
              onChange={(e) => setDepDob(e.target.value)}
            />
          </div>
          <Button
            size='sm'
            onClick={addDependant}
            disabled={!depName || !depRel || !depDob}
          >
            <Plus size={12} weight='bold' />
            Add dependant
          </Button>
          <p className='text-paragraph-sm text-neutral-1000'>
            Only configured relationship types can be selected.
          </p>

          <SectionTitle>Record a life event</SectionTitle>
          {me.lifeEvents.map((e) => (
            <p key={e.id} className='text-paragraph-sm text-neutral-1000'>
              {e.type} on {e.date} — {e.details || 'no details'}
            </p>
          ))}
          <div className='grid grid-cols-3 gap-2'>
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger variant='secondary' className='w-full'>
                <SelectValue placeholder='Event type' />
              </SelectTrigger>
              <SelectContent>
                {LIFE_EVENT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type='date'
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
            <Input
              placeholder='Details'
              value={eventDetails}
              onChange={(e) => setEventDetails(e.target.value)}
            />
          </div>
          <Button
            size='sm'
            onClick={addLifeEvent}
            disabled={!eventType || !eventDate}
          >
            <Plus size={12} weight='bold' />
            Record life event
          </Button>
          <p className='text-paragraph-sm text-neutral-1000'>
            Recorded events are visible to HR to drive eligibility and benefit
            review. Only configured event types are permitted.
          </p>
        </CardContent>
      </Card>

      <div id='profile-personal' className='scroll-mt-16'>
        <PersonalInfoSection store={extras} name={me.name} />
      </div>
      <div id='profile-contact' className='scroll-mt-16'>
        <ContactInfoSection store={extras} />
      </div>
      </div>

      <div id='profile-education' className='scroll-mt-16'>
        <EducationSection store={extras} />
      </div>
      <div id='profile-experience' className='scroll-mt-16'>
        <WorkExperienceSection store={extras} />
      </div>
      <div id='profile-skills' className='scroll-mt-16'>
        <SkillsSection store={extras} />
      </div>
      <div id='profile-feedback' className='scroll-mt-16'>
        <ClientFeedbackSection store={extras} />
      </div>

      {/* A6: employee entity-level custom fields — validated + persisted on Save. */}
      <div
        id='profile-custom'
        className='scroll-mt-16 rounded-[8px] border border-gray-200 bg-white p-4'
      >
        <CustomFieldsSection
          entity='Employees'
          values={customValues}
          onChange={handleCustomChange}
          errors={customErrors}
          audience='employee'
          title='Custom profile fields'
        />
        <div className='mt-4 flex items-center justify-between border-t border-gray-100 pt-3'>
          <p className='text-paragraph-sm text-neutral-1000'>
            Required fields are marked; values are kept on your employee
            record after saving.
          </p>
          <Button size='sm' onClick={saveCustomFields}>
            <FloppyDisk size={12} weight='bold' />
            Save profile fields
          </Button>
        </div>
      </div>
    </div>
  )
}
