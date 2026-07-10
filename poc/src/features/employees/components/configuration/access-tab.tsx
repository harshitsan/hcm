import { Fragment, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useRole } from '@/context/role-context'
import { EMPLOYEE_CLASSES, LOCATIONS } from '../../data/employees'
import {
  ACCESS_ACTORS,
  ACCESS_SECTIONS,
  type AccessSection,
} from '../../data/configuration'
import { type ConfigurationStore } from '../../hooks/use-configuration'
import { FilterSelect, SectionTitle } from '../shared'

/**
 * EMP-51 — per-field View/Edit permission matrix for HR, Reporting Manager
 * and Employee, keyed by employee class + location, split across the employee
 * data sections, with Save / Save and Next / Apply-to-others.
 */
export function AccessMatrixTab({ store }: { store: ConfigurationStore }) {
  const { hasRole } = useRole()
  const canEdit = hasRole('Company Admin')
  const [employeeClass, setEmployeeClass] = useState<string>(
    EMPLOYEE_CLASSES[0]
  )
  const [location, setLocation] = useState<string>(LOCATIONS[0])
  const [section, setSection] = useState<AccessSection>(ACCESS_SECTIONS[0])

  const rows = store.fieldPermissions.filter((p) => p.section === section)
  const sectionIndex = ACCESS_SECTIONS.indexOf(section)

  const saveAndNext = () => {
    toast.success(`Permissions saved for ${employeeClass} @ ${location}`)
    if (sectionIndex < ACCESS_SECTIONS.length - 1) {
      setSection(ACCESS_SECTIONS[sectionIndex + 1])
    }
  }

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-center gap-2'>
        <FilterSelect
          label='Employee class'
          value={employeeClass}
          onChange={setEmployeeClass}
          options={EMPLOYEE_CLASSES}
          allLabel='All classes'
        />
        <FilterSelect
          label='Location'
          value={location}
          onChange={setLocation}
          options={LOCATIONS}
          allLabel='All locations'
        />
        <span className='text-paragraph-sm text-neutral-1000'>
          Matrix loads per class + location combination
        </span>
      </div>

      <Tabs
        value={section}
        onValueChange={(v) => setSection(v as AccessSection)}
      >
        <TabsList>
          {ACCESS_SECTIONS.map((s) => (
            <TabsTrigger key={s} value={s}>
              {s}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className='rounded-md border border-gray-200 bg-white'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead rowSpan={2}>Field</TableHead>
              {ACCESS_ACTORS.map((actor) => (
                <TableHead key={actor} colSpan={2} className='text-center'>
                  {actor}
                </TableHead>
              ))}
            </TableRow>
            <TableRow>
              {ACCESS_ACTORS.map((actor) => (
                <Fragment key={actor}>
                  <TableHead className='text-center'>View</TableHead>
                  <TableHead className='text-center'>Edit</TableHead>
                </Fragment>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((p) => (
              <TableRow key={p.field}>
                <TableCell className='font-medium'>{p.field}</TableCell>
                {ACCESS_ACTORS.map((actor) => (
                  <Fragment key={`${p.field}-${actor}`}>
                    <TableCell className='text-center'>
                      <Checkbox
                        variant='blue'
                        checked={p.permissions[actor].view}
                        disabled={!canEdit}
                        onCheckedChange={() =>
                          store.togglePermission(p.field, actor, 'view')
                        }
                        aria-label={`${actor} view ${p.field}`}
                      />
                    </TableCell>
                    <TableCell className='text-center'>
                      <Checkbox
                        variant='blue'
                        checked={p.permissions[actor].edit}
                        disabled={!canEdit}
                        onCheckedChange={() =>
                          store.togglePermission(p.field, actor, 'edit')
                        }
                        aria-label={`${actor} edit ${p.field}`}
                      />
                    </TableCell>
                  </Fragment>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className='max-w-xl space-y-3'>
        <SectionTitle>Configuration questions (EAP-05)</SectionTitle>
        <div className='space-y-3 rounded-md border border-gray-200 bg-white p-4'>
          {store.accessQuestions.map((q) => (
            <div key={q.id} className='flex items-center justify-between gap-4'>
              <div>
                <p className='text-neutral-1600 text-sm font-medium'>
                  {q.question}
                </p>
                <p className='text-paragraph-sm text-neutral-1000'>{q.hint}</p>
              </div>
              <Switch
                checked={q.answer}
                disabled={!canEdit}
                onCheckedChange={() => store.toggleAccessQuestion(q.id)}
                aria-label={q.question}
              />
            </div>
          ))}
        </div>
        <p className='text-paragraph-sm text-neutral-1000'>
          Answers apply to {employeeClass} @ {location} and drive downstream
          systems and reports (bench report, billing, Wrike provisioning).
        </p>
      </div>

      {canEdit && (
        <div className='flex items-center gap-3'>
          <Button
            size='sm'
            onClick={() =>
              toast.success(
                `Permissions saved for ${employeeClass} @ ${location}`
              )
            }
          >
            Save
          </Button>
          <Button
            size='sm'
            variant='outline'
            onClick={saveAndNext}
            disabled={sectionIndex >= ACCESS_SECTIONS.length - 1}
          >
            Save and Next
          </Button>
          <Button
            size='sm'
            variant='outline'
            onClick={() =>
              toast.success(
                'Configuration copied to the other classes and locations'
              )
            }
          >
            Apply to other classes & locations
          </Button>
        </div>
      )}
    </div>
  )
}
