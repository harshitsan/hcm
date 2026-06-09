/**
 * Phase A — Foundation: company profile, locations, org structure, calendars,
 * custom fields. Steps 1–5 of the add-a-company wizard.
 */
import { useState } from 'react'
import { Hash } from 'lucide-react'
import { Badge, Field, Input, Select, Tabs } from '../../../components/ui'
import {
  INDIAN_STATES, CURRENCIES, TIME_ZONES, LANGUAGES, REG_TYPES,
  LOCATION_KINDS, GROUP_KINDS, HOLIDAY_KINDS, FIELD_ENTITIES, FIELD_TYPES,
  nextCompanyCode, rid,
  type Location, type Dept, type Position, type PeopleGroup, type Holiday, type Shift, type CustomField,
} from '../model'
import { ChipMultiSelect, RowList, SectionTitle, type Col, type StepProps } from '../shared'

/* ----------------------------------------------------------------- 1 · profile */
export function CompanyProfileStep({ state, update }: StepProps) {
  const toggle = (s: string) =>
    update({
      jurisdictions: state.jurisdictions.includes(s)
        ? state.jurisdictions.filter((x) => x !== s)
        : [...state.jurisdictions, s],
    })

  return (
    <div className="space-y-5">
      <Field label="Legal name" required hint="The registered legal entity name.">
        <Input value={state.legalName} onChange={(e) => update({ legalName: e.target.value })} placeholder="e.g. Northwind Foods Pvt. Ltd." autoFocus />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Trade name" hint="Brand or 'doing business as' name.">
          <Input value={state.tradeName} onChange={(e) => update({ tradeName: e.target.value })} placeholder="Northwind" />
        </Field>
        <Field label="Website">
          <Input value={state.website} onChange={(e) => update({ website: e.target.value })} placeholder="https://northwind.example" />
        </Field>
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Registration type">
          <Select value={state.regType} onChange={(e) => update({ regType: e.target.value })}>
            {REG_TYPES.map((r) => <option key={r}>{r}</option>)}
          </Select>
        </Field>
        <Field label="Registration number" hint={`Your ${state.regType} identifier.`}>
          <Input value={state.regNumber} onChange={(e) => update({ regNumber: e.target.value })} placeholder="27ABCDE1234F1Z5" />
        </Field>
        <Field label="Incorporation date">
          <Input type="date" value={state.incorpDate} onChange={(e) => update({ incorpDate: e.target.value })} />
        </Field>
      </div>

      <Field label="Operating jurisdictions" hint="States where this company employs people.">
        <ChipMultiSelect options={INDIAN_STATES} selected={state.jurisdictions} onToggle={toggle} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Base currency">
          <Select value={state.currency} onChange={(e) => update({ currency: e.target.value })}>
            {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
          </Select>
        </Field>
        <Field label="Time zone">
          <Select value={state.timeZone} onChange={(e) => update({ timeZone: e.target.value })}>
            {TIME_ZONES.map((t) => <option key={t}>{t}</option>)}
          </Select>
        </Field>
        <Field label="Language">
          <Select value={state.language} onChange={(e) => update({ language: e.target.value })}>
            {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
          </Select>
        </Field>
      </div>

      <div className="rounded-xl border border-border bg-primary/5 p-4">
        <SectionTitle hint="This person becomes the first Company HR Admin and gets an invite to finish setup.">First admin invite</SectionTitle>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Admin name"><Input value={state.adminName} onChange={(e) => update({ adminName: e.target.value })} placeholder="Full name" /></Field>
          <Field label="Admin email"><Input type="email" value={state.adminEmail} onChange={(e) => update({ adminEmail: e.target.value })} placeholder="admin@northwind.example" /></Field>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-surface2/50 px-3 py-2.5">
        <Hash className="h-4 w-4 text-primary" />
        <span className="text-[13px] text-muted-fg">Company code preview</span>
        <Badge tone="primary" className="tnum ml-auto">{nextCompanyCode()}</Badge>
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------- 2 · locations */
export function LocationsStep({ state, update }: StepProps) {
  const cols: Col<Location>[] = [
    { key: 'name', label: 'Site name', placeholder: 'Head Office' },
    { key: 'kind', label: 'Type', type: 'select', options: LOCATION_KINDS },
    { key: 'city', label: 'City', placeholder: 'Mumbai' },
    { key: 'state', label: 'State', type: 'select', options: INDIAN_STATES },
    { key: 'headcount', label: 'Seats', type: 'number' },
  ]
  return (
    <div className="space-y-2">
      <SectionTitle hint="Every office, plant, store or remote hub this company runs.">Offices & sites</SectionTitle>
      <RowList
        rows={state.locations}
        cols={cols}
        onChange={(locations) => update({ locations })}
        makeRow={(): Location => ({ id: rid('lo'), name: '', kind: 'Branch', city: '', state: INDIAN_STATES[0], headcount: 0 })}
        addLabel="Add location"
        empty="No locations yet — add your first site."
      />
    </div>
  )
}

/* ----------------------------------------------------------------- 3 · org structure */
export function OrgStructureStep({ state, update }: StepProps) {
  const [tab, setTab] = useState('departments')
  const deptNames = ['—', ...state.departments.map((d) => d.name).filter(Boolean)]

  const deptCols: Col<Dept>[] = [
    { key: 'name', label: 'Department', placeholder: 'Engineering' },
    { key: 'head', label: 'Head', placeholder: 'Full name' },
    { key: 'parent', label: 'Reports into', type: 'select', options: deptNames },
  ]
  const posCols: Col<Position>[] = [
    { key: 'title', label: 'Position', placeholder: 'Software Engineer' },
    { key: 'dept', label: 'Department', type: 'select', options: deptNames },
    { key: 'band', label: 'Band', placeholder: 'B2' },
  ]
  const groupCols: Col<PeopleGroup>[] = [
    { key: 'name', label: 'Group', placeholder: 'Platform Squad' },
    { key: 'kind', label: 'Type', type: 'select', options: GROUP_KINDS },
    { key: 'members', label: 'Members', type: 'number' },
  ]

  return (
    <div className="space-y-4">
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'departments', label: `Departments (${state.departments.length})` },
          { value: 'positions', label: `Positions (${state.positions.length})` },
          { value: 'groups', label: `Groups (${state.groups.length})` },
        ]}
      />
      {tab === 'departments' && (
        <RowList
          rows={state.departments}
          cols={deptCols}
          onChange={(departments) => update({ departments })}
          makeRow={(): Dept => ({ id: rid('de'), name: '', head: '', parent: '—' })}
          addLabel="Add department"
        />
      )}
      {tab === 'positions' && (
        <RowList
          rows={state.positions}
          cols={posCols}
          onChange={(positions) => update({ positions })}
          makeRow={(): Position => ({ id: rid('po'), title: '', dept: deptNames[1] ?? '—', band: '' })}
          addLabel="Add position"
        />
      )}
      {tab === 'groups' && (
        <RowList
          rows={state.groups}
          cols={groupCols}
          onChange={(groups) => update({ groups })}
          makeRow={(): PeopleGroup => ({ id: rid('gr'), name: '', kind: 'Function', members: 0 })}
          addLabel="Add group"
        />
      )}
    </div>
  )
}

/* ----------------------------------------------------------------- 4 · calendars */
export function CalendarsStep({ state, update }: StepProps) {
  const holidayCols: Col<Holiday>[] = [
    { key: 'name', label: 'Holiday', placeholder: 'Republic Day' },
    { key: 'date', label: 'Date', type: 'date' },
    { key: 'kind', label: 'Type', type: 'select', options: HOLIDAY_KINDS },
  ]
  const shiftCols: Col<Shift>[] = [
    { key: 'name', label: 'Shift', placeholder: 'General' },
    { key: 'start', label: 'Start', placeholder: '09:30' },
    { key: 'end', label: 'End', placeholder: '18:30' },
    { key: 'days', label: 'Days', placeholder: 'Mon–Fri' },
  ]
  return (
    <div className="space-y-6">
      <div>
        <SectionTitle hint="Public and restricted holidays for this company's calendar.">Holiday calendar</SectionTitle>
        <RowList
          rows={state.holidays}
          cols={holidayCols}
          onChange={(holidays) => update({ holidays })}
          makeRow={(): Holiday => ({ id: rid('hl'), name: '', date: '', kind: 'Public' })}
          addLabel="Add holiday"
        />
      </div>
      <div>
        <SectionTitle hint="Work shifts employees can be rostered onto.">Shifts</SectionTitle>
        <RowList
          rows={state.shifts}
          cols={shiftCols}
          onChange={(shifts) => update({ shifts })}
          makeRow={(): Shift => ({ id: rid('sh'), name: '', start: '', end: '', days: 'Mon–Fri' })}
          addLabel="Add shift"
        />
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------- 5 · custom fields */
export function CustomFieldsStep({ state, update }: StepProps) {
  const cols: Col<CustomField>[] = [
    { key: 'label', label: 'Field label', placeholder: 'GitHub handle' },
    { key: 'entity', label: 'Applies to', type: 'select', options: FIELD_ENTITIES },
    { key: 'type', label: 'Data type', type: 'select', options: FIELD_TYPES },
    { key: 'required', label: 'Required', type: 'switch' },
  ]
  return (
    <div className="space-y-2">
      <SectionTitle hint="Extra data fields to capture before importing people. Define them now so imports map cleanly.">Custom fields</SectionTitle>
      <RowList
        rows={state.customFields}
        cols={cols}
        onChange={(customFields) => update({ customFields })}
        makeRow={(): CustomField => ({ id: rid('cf'), label: '', entity: 'Employee', type: 'Text', required: false })}
        addLabel="Add field"
        empty="No custom fields — the standard employee record is enough to start."
      />
    </div>
  )
}
