import { useMemo, useState } from 'react'
import { ArrowsClockwise, Plus, Trash } from 'phosphor-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { RoleGate, useRole } from '@/context/role-context'
import {
  DEPARTMENTS,
  EMPLOYEE_CLASSES,
  LOCATIONS,
  POSITIONS,
} from '../../data/employees'
import {
  type DependantType,
  type LifeEventType,
} from '../../data/configuration'
import { type ConfigurationStore } from '../../hooks/use-configuration'
import { FilterSelect, SectionTitle } from '../shared'

/**
 * EMP-32 dependant types (add + edit), ELE-01..04 life event types,
 * EMP-52 verification checks, EMP-53 document custodians with structured
 * Location/Department/Position/Class filters + Reset (DOC-02/03), and
 * EMP-27 metadata-driven directory grid configuration.
 */
export function CatalogTab({ store }: { store: ConfigurationStore }) {
  const { hasRole } = useRole()
  const [typeOpen, setTypeOpen] = useState(false)
  const [editingType, setEditingType] = useState<DependantType | null>(null)
  const [typeName, setTypeName] = useState('')
  const [typeDescription, setTypeDescription] = useState('')

  const [lifeOpen, setLifeOpen] = useState(false)
  const [editingLife, setEditingLife] = useState<LifeEventType | null>(null)
  const [lifeName, setLifeName] = useState('')
  const [lifeDescription, setLifeDescription] = useState('')
  const [deletingLife, setDeletingLife] = useState<LifeEventType | null>(null)

  const [verOpen, setVerOpen] = useState(false)
  const [verName, setVerName] = useState('')
  const [verAt, setVerAt] = useState('')
  const [verRecurring, setVerRecurring] = useState(false)
  const [verApplicability, setVerApplicability] = useState('')

  const [custOpen, setCustOpen] = useState(false)
  const [custDoc, setCustDoc] = useState('')
  const [custPosition, setCustPosition] = useState('')
  const [custApplicability, setCustApplicability] = useState('')
  const [custLocation, setCustLocation] = useState<string>(LOCATIONS[0])
  const [custDepartment, setCustDepartment] = useState<string>(DEPARTMENTS[0])
  const [custClass, setCustClass] = useState<string>(EMPLOYEE_CLASSES[0])
  const [custSearch, setCustSearch] = useState('')

  const [filterLocation, setFilterLocation] = useState('all')
  const [filterDepartment, setFilterDepartment] = useState('all')
  const [filterPosition, setFilterPosition] = useState('all')
  const [filterClass, setFilterClass] = useState('all')

  const filteredCustodians = useMemo(
    () =>
      store.custodians.filter(
        (c) =>
          (custSearch === '' ||
            c.documentType.toLowerCase().includes(custSearch.toLowerCase()) ||
            c.custodianPosition
              .toLowerCase()
              .includes(custSearch.toLowerCase())) &&
          (filterLocation === 'all' || c.location === filterLocation) &&
          (filterDepartment === 'all' || c.department === filterDepartment) &&
          (filterPosition === 'all' ||
            c.custodianPosition === filterPosition) &&
          (filterClass === 'all' || c.employeeClass === filterClass)
      ),
    [
      store.custodians,
      custSearch,
      filterLocation,
      filterDepartment,
      filterPosition,
      filterClass,
    ]
  )

  const openTypeFor = (t: DependantType | null) => {
    setEditingType(t)
    setTypeName(t?.name ?? '')
    setTypeDescription(t?.description ?? '')
    setTypeOpen(true)
  }

  const openLifeFor = (t: LifeEventType | null) => {
    setEditingLife(t)
    setLifeName(t?.name ?? '')
    setLifeDescription(t?.description ?? '')
    setLifeOpen(true)
  }

  const resetCustFilters = () => {
    setCustSearch('')
    setFilterLocation('all')
    setFilterDepartment('all')
    setFilterPosition('all')
    setFilterClass('all')
  }

  return (
    <div className='space-y-6'>
      <div className='grid gap-6 lg:grid-cols-2'>
        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <SectionTitle>Employee dependant types</SectionTitle>
            <RoleGate roles={['Company Admin']}>
              <Button size='sm' onClick={() => openTypeFor(null)}>
                <Plus size={12} weight='bold' />
                Add type
              </Button>
            </RoleGate>
          </div>
          <div className='rounded-md border border-gray-200 bg-white'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className='w-[80px]' />
                </TableRow>
              </TableHeader>
              <TableBody>
                {store.dependantTypes.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className='font-medium'>{t.name}</TableCell>
                    <TableCell className='text-neutral-1000'>
                      {t.description}
                    </TableCell>
                    <TableCell>
                      <RoleGate roles={['Company Admin']}>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => openTypeFor(t)}
                        >
                          Edit
                        </Button>
                      </RoleGate>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className='text-paragraph-sm text-neutral-1000'>
            Employees can only register dependants against these configured
            relationships.
          </p>
        </div>

        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <SectionTitle>Directory grid metadata (EMP-27)</SectionTitle>
          </div>
          <div className='rounded-md border border-gray-200 bg-white'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Column</TableHead>
                  <TableHead>Visible</TableHead>
                  <TableHead>Filterable</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {store.gridColumns.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className='font-medium'>{c.label}</TableCell>
                    <TableCell>
                      <Switch
                        checked={c.visible}
                        disabled={!hasRole('Company Admin', 'Platform Admin')}
                        onCheckedChange={() =>
                          store.toggleGridColumn(c.id, 'visible')
                        }
                        aria-label={`Toggle visibility of ${c.label}`}
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={c.filterable}
                        disabled={!hasRole('Company Admin', 'Platform Admin')}
                        onCheckedChange={() =>
                          store.toggleGridColumn(c.id, 'filterable')
                        }
                        aria-label={`Toggle filter for ${c.label}`}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className='text-paragraph-sm text-neutral-1000'>
            The employee directory reflects column/filter configuration without
            code changes; browsing always respects tenant-scoped access.
          </p>
        </div>
      </div>

      <div className='space-y-3'>
        <div className='flex items-center justify-between'>
          <SectionTitle>Employee life event types</SectionTitle>
          <div className='flex items-center gap-2'>
            <Button
              variant='icon2'
              className='text-neutral-1900 h-7 w-7'
              aria-label='Refresh life event types'
              onClick={() =>
                toast.success(
                  'Life event types refreshed — showing the current set'
                )
              }
            >
              <ArrowsClockwise size={16} weight='bold' />
            </Button>
            <RoleGate roles={['Company Admin']}>
              <Button size='sm' onClick={() => openLifeFor(null)}>
                <Plus size={12} weight='bold' />
                Add life event type
              </Button>
            </RoleGate>
          </div>
        </div>
        <div className='rounded-md border border-gray-200 bg-white'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className='w-[160px]' />
              </TableRow>
            </TableHeader>
            <TableBody>
              {store.lifeEventTypes.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className='font-medium'>{t.name}</TableCell>
                  <TableCell className='text-neutral-1000'>
                    {t.description}
                  </TableCell>
                  <TableCell>
                    <RoleGate roles={['Company Admin']}>
                      <div className='flex justify-end gap-1'>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => openLifeFor(t)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant='icon2'
                          className='text-neutral-1900 h-7 w-7'
                          aria-label={`Delete ${t.name}`}
                          onClick={() => setDeletingLife(t)}
                        >
                          <Trash size={14} weight='bold' />
                        </Button>
                      </div>
                    </RoleGate>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className='text-paragraph-sm text-neutral-1000'>
          Significant events like marriage, adoption or birth are recorded
          against these types via employee self-service.
        </p>
      </div>

      <div className='space-y-3'>
        <div className='flex items-center justify-between'>
          <SectionTitle>Employee verification checks</SectionTitle>
          <RoleGate roles={['Company Admin']}>
            <Button size='sm' onClick={() => setVerOpen(true)}>
              <Plus size={12} weight='bold' />
              Add verification
            </Button>
          </RoleGate>
        </div>
        <div className='rounded-md border border-gray-200 bg-white'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Verification name</TableHead>
                <TableHead>Applicable at</TableHead>
                <TableHead>Recurring</TableHead>
                <TableHead>Applicability</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {store.verifications.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className='font-medium'>{v.name}</TableCell>
                  <TableCell>{v.applicableAt}</TableCell>
                  <TableCell>
                    <Badge variant={v.recurring ? 'qualified' : 'pending'}>
                      {v.recurring ? 'Recurring' : 'One-time'}
                    </Badge>
                  </TableCell>
                  <TableCell className='text-neutral-1000'>
                    {v.applicability}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className='space-y-3'>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <SectionTitle>Document custodians</SectionTitle>
          <div className='flex items-center gap-2'>
            <Input
              className='h-8 w-[220px]'
              placeholder='Search document / position'
              value={custSearch}
              onChange={(e) => setCustSearch(e.target.value)}
            />
            <RoleGate roles={['Company Admin']}>
              <Button size='sm' onClick={() => setCustOpen(true)}>
                <Plus size={12} weight='bold' />
                Add custodian
              </Button>
            </RoleGate>
          </div>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <FilterSelect
            label='Location'
            value={filterLocation}
            onChange={setFilterLocation}
            options={LOCATIONS}
          />
          <FilterSelect
            label='Department'
            value={filterDepartment}
            onChange={setFilterDepartment}
            options={DEPARTMENTS}
          />
          <FilterSelect
            label='Position'
            value={filterPosition}
            onChange={setFilterPosition}
            options={POSITIONS}
          />
          <FilterSelect
            label='Employee class'
            value={filterClass}
            onChange={setFilterClass}
            options={EMPLOYEE_CLASSES}
          />
          <Button variant='outline' size='sm' onClick={resetCustFilters}>
            Reset
          </Button>
        </div>
        <div className='rounded-md border border-gray-200 bg-white'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document type</TableHead>
                <TableHead>Custodian position</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Employee class</TableHead>
                <TableHead>Applicability</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustodians.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className='text-neutral-1000'>
                    No custodian mappings match the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustodians.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className='font-medium'>
                      {c.documentType}
                    </TableCell>
                    <TableCell>{c.custodianPosition}</TableCell>
                    <TableCell className='text-neutral-1000'>
                      {c.location}
                    </TableCell>
                    <TableCell className='text-neutral-1000'>
                      {c.department}
                    </TableCell>
                    <TableCell className='text-neutral-1000'>
                      {c.employeeClass}
                    </TableCell>
                    <TableCell className='text-neutral-1000'>
                      {c.applicability}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={typeOpen} onOpenChange={setTypeOpen}>
        <DialogContent className='sm:max-w-[360px]'>
          <DialogHeader>
            <DialogTitle>
              {editingType ? 'Edit dependant type' : 'New dependant type'}
            </DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <div className='space-y-1'>
              <Label>Name</Label>
              <Input
                value={typeName}
                onChange={(e) => setTypeName(e.target.value)}
                placeholder='e.g. Guardian'
              />
            </div>
            <div className='space-y-1'>
              <Label>Description</Label>
              <Input
                value={typeDescription}
                onChange={(e) => setTypeDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setTypeOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!typeName}
              onClick={() => {
                store.saveDependantType(
                  {
                    name: typeName,
                    description: typeDescription,
                  },
                  editingType?.id
                )
                setTypeOpen(false)
              }}
            >
              {editingType ? 'Save type' : 'Add type'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={lifeOpen} onOpenChange={setLifeOpen}>
        <DialogContent className='sm:max-w-[380px]'>
          <DialogHeader>
            <DialogTitle>
              {editingLife ? 'Edit life event type' : 'New life event type'}
            </DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <div className='space-y-1'>
              <Label>Name</Label>
              <Input
                value={lifeName}
                onChange={(e) => setLifeName(e.target.value)}
                placeholder='e.g. Relocation'
              />
            </div>
            <div className='space-y-1'>
              <Label>Description</Label>
              <Input
                value={lifeDescription}
                onChange={(e) => setLifeDescription(e.target.value)}
                placeholder='When should this event be recorded?'
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setLifeOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!lifeName}
              onClick={() => {
                store.saveLifeEventType(
                  {
                    name: lifeName,
                    description: lifeDescription,
                  },
                  editingLife?.id
                )
                setLifeOpen(false)
              }}
            >
              {editingLife ? 'Save type' : 'Add type'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deletingLife !== null}
        onOpenChange={(o) => {
          if (!o) setDeletingLife(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete life event type?</AlertDialogTitle>
            <AlertDialogDescription>
              “{deletingLife?.name}” will no longer be selectable when
              employees record life events. Existing recorded events are
              unaffected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingLife) store.deleteLifeEventType(deletingLife.id)
                setDeletingLife(null)
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={verOpen} onOpenChange={setVerOpen}>
        <DialogContent className='sm:max-w-[400px]'>
          <DialogHeader>
            <DialogTitle>New verification check</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <div className='space-y-1'>
              <Label>Verification name</Label>
              <Input
                value={verName}
                onChange={(e) => setVerName(e.target.value)}
                placeholder='e.g. Education certificates'
              />
            </div>
            <div className='space-y-1'>
              <Label>Applicable at</Label>
              <Input
                value={verAt}
                onChange={(e) => setVerAt(e.target.value)}
                placeholder='e.g. Pre-joining / Annual'
              />
            </div>
            <div className='space-y-1'>
              <Label>Applicability</Label>
              <Input
                value={verApplicability}
                onChange={(e) => setVerApplicability(e.target.value)}
                placeholder='e.g. All employees'
              />
            </div>
            <div className='flex items-center justify-between rounded-md border border-gray-200 px-3 py-2'>
              <Label>Recurring check</Label>
              <Switch checked={verRecurring} onCheckedChange={setVerRecurring} />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setVerOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!verName || !verAt || !verApplicability}
              onClick={() => {
                store.saveVerification({
                  name: verName,
                  applicableAt: verAt,
                  recurring: verRecurring,
                  applicability: verApplicability,
                })
                setVerName('')
                setVerAt('')
                setVerApplicability('')
                setVerRecurring(false)
                setVerOpen(false)
              }}
            >
              Add verification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={custOpen} onOpenChange={setCustOpen}>
        <DialogContent className='sm:max-w-[440px]'>
          <DialogHeader>
            <DialogTitle>New document custodian</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <div className='space-y-1'>
              <Label>Document type</Label>
              <Input
                value={custDoc}
                onChange={(e) => setCustDoc(e.target.value)}
                placeholder='e.g. Medical records'
              />
            </div>
            <div className='space-y-1'>
              <Label>Custodian position</Label>
              <Input
                value={custPosition}
                onChange={(e) => setCustPosition(e.target.value)}
                placeholder={`e.g. ${POSITIONS[2]}`}
              />
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-1'>
                <Label>Location</Label>
                <Select value={custLocation} onValueChange={setCustLocation}>
                  <SelectTrigger variant='secondary' className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCATIONS.map((l) => (
                      <SelectItem key={l} value={l}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-1'>
                <Label>Department</Label>
                <Select
                  value={custDepartment}
                  onValueChange={setCustDepartment}
                >
                  <SelectTrigger variant='secondary' className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className='space-y-1'>
              <Label>Employee class</Label>
              <Select value={custClass} onValueChange={setCustClass}>
                <SelectTrigger variant='secondary' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYEE_CLASSES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-1'>
              <Label>Applicability</Label>
              <Input
                value={custApplicability}
                onChange={(e) => setCustApplicability(e.target.value)}
                placeholder='e.g. All locations'
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setCustOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!custDoc || !custPosition || !custApplicability}
              onClick={() => {
                store.saveCustodian({
                  documentType: custDoc,
                  custodianPosition: custPosition,
                  applicability: custApplicability,
                  location: custLocation,
                  department: custDepartment,
                  employeeClass: custClass,
                })
                setCustDoc('')
                setCustPosition('')
                setCustApplicability('')
                setCustOpen(false)
              }}
            >
              Add custodian
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
