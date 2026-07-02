import { useMemo, useState } from 'react'
import { Plus } from 'phosphor-react'
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
import { POSITIONS } from '../../data/employees'
import { LIFE_EVENT_TYPES } from '../../data/configuration'
import { type ConfigurationStore } from '../../hooks/use-configuration'
import { SectionTitle } from '../shared'

/**
 * EMP-32 dependant types, EMP-52 verification checks, EMP-53 document
 * custodians and EMP-27 metadata-driven directory grid configuration.
 */
export function CatalogTab({ store }: { store: ConfigurationStore }) {
  const { hasRole } = useRole()
  const [typeOpen, setTypeOpen] = useState(false)
  const [typeName, setTypeName] = useState('')
  const [typeDescription, setTypeDescription] = useState('')

  const [verOpen, setVerOpen] = useState(false)
  const [verName, setVerName] = useState('')
  const [verAt, setVerAt] = useState('')
  const [verRecurring, setVerRecurring] = useState(false)
  const [verApplicability, setVerApplicability] = useState('')

  const [custOpen, setCustOpen] = useState(false)
  const [custDoc, setCustDoc] = useState('')
  const [custPosition, setCustPosition] = useState('')
  const [custApplicability, setCustApplicability] = useState('')
  const [custSearch, setCustSearch] = useState('')

  const filteredCustodians = useMemo(
    () =>
      store.custodians.filter(
        (c) =>
          custSearch === '' ||
          c.documentType.toLowerCase().includes(custSearch.toLowerCase()) ||
          c.custodianPosition.toLowerCase().includes(custSearch.toLowerCase())
      ),
    [store.custodians, custSearch]
  )

  return (
    <div className='space-y-6'>
      <div className='grid gap-6 lg:grid-cols-2'>
        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <SectionTitle>Employee dependant types</SectionTitle>
            <RoleGate roles={['Company Admin']}>
              <Button size='sm' onClick={() => setTypeOpen(true)}>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {store.dependantTypes.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className='font-medium'>{t.name}</TableCell>
                    <TableCell className='text-neutral-1000'>
                      {t.description}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className='text-paragraph-sm text-neutral-1000'>
            Employees can only register dependants against these configured
            relationships. Life-event types available for self-service:{' '}
            {LIFE_EVENT_TYPES.join(', ')}.
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
            <Button
              variant='outline'
              size='sm'
              onClick={() => setCustSearch('')}
            >
              Reset
            </Button>
            <RoleGate roles={['Company Admin']}>
              <Button size='sm' onClick={() => setCustOpen(true)}>
                <Plus size={12} weight='bold' />
                Add custodian
              </Button>
            </RoleGate>
          </div>
        </div>
        <div className='rounded-md border border-gray-200 bg-white'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document type</TableHead>
                <TableHead>Custodian position</TableHead>
                <TableHead>Applicability</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustodians.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className='font-medium'>
                    {c.documentType}
                  </TableCell>
                  <TableCell>{c.custodianPosition}</TableCell>
                  <TableCell className='text-neutral-1000'>
                    {c.applicability}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={typeOpen} onOpenChange={setTypeOpen}>
        <DialogContent className='sm:max-w-[360px]'>
          <DialogHeader>
            <DialogTitle>New dependant type</DialogTitle>
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
                store.saveDependantType({
                  name: typeName,
                  description: typeDescription,
                })
                setTypeName('')
                setTypeDescription('')
                setTypeOpen(false)
              }}
            >
              Add type
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
        <DialogContent className='sm:max-w-[400px]'>
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
