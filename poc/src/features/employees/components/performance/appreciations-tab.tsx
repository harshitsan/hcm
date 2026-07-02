import { useMemo, useState } from 'react'
import { Gear, Plus } from 'phosphor-react'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { RoleGate } from '@/context/role-context'
import { DEPARTMENTS } from '../../data/employees'
import { type PerformanceStore } from '../../hooks/use-performance'
import { FilterSelect, SectionTitle } from '../shared'

const EMPLOYEE_NAMES = [
  'Ananya Krishnan',
  'Vikram Shetty',
  'Rohit Menon',
  'Sneha Patil',
  'Imran Qureshi',
  'Deepa Raghavan',
  'Kavya Reddy',
  'Grace D’Souza',
]

/**
 * EMP-35/36/37 — appreciation categories with points, giving appreciations
 * with feedback, the per-employee summary and the notification schedule.
 */
export function AppreciationsTab({ store }: { store: PerformanceStore }) {
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [employeeFilter, setEmployeeFilter] = useState('all')
  const [giveOpen, setGiveOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [categoryOpen, setCategoryOpen] = useState(false)

  const [employee, setEmployee] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [feedback, setFeedback] = useState('')

  const [notifyDay, setNotifyDay] = useState(
    String(store.appreciationSettings.notifyDayOfMonth)
  )
  const [calcStart, setCalcStart] = useState(
    store.appreciationSettings.scoreCalculationStart
  )

  const [catName, setCatName] = useState('')
  const [catDescription, setCatDescription] = useState('')
  const [catPoints, setCatPoints] = useState('')

  const filtered = useMemo(
    () =>
      store.appreciations.filter(
        (a) =>
          (departmentFilter === 'all' || a.department === departmentFilter) &&
          (employeeFilter === 'all' || a.employee === employeeFilter)
      ),
    [store.appreciations, departmentFilter, employeeFilter]
  )

  const summary = useMemo(() => {
    const start = store.appreciationSettings.scoreCalculationStart
    const tally = new Map<string, { count: number; points: number }>()
    for (const a of store.appreciations) {
      if (a.date < start) continue // only from the calc start date onward
      const cur = tally.get(a.employee) ?? { count: 0, points: 0 }
      tally.set(a.employee, {
        count: cur.count + 1,
        points: cur.points + a.points,
      })
    }
    return [...tally.entries()].sort((a, b) => b[1].points - a[1].points)
  }, [store.appreciations, store.appreciationSettings])

  const give = () => {
    const category = store.categories.find((c) => c.id === categoryId)
    if (!employee || !category || !feedback) return
    store.giveAppreciation({
      employee,
      department:
        store.appreciations.find((a) => a.employee === employee)?.department ??
        'Engineering',
      appreciatedBy: 'You',
      category: category.name,
      feedback,
      points: category.points,
    })
    setEmployee('')
    setCategoryId('')
    setFeedback('')
    setGiveOpen(false)
  }

  const saveCategory = () => {
    if (!catName || !catPoints) return
    store.saveCategory({
      name: catName,
      description: catDescription,
      points: Number(catPoints),
    })
    setCatName('')
    setCatDescription('')
    setCatPoints('')
    setCategoryOpen(false)
  }

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div className='flex flex-wrap gap-2'>
          <FilterSelect
            label='Department'
            value={departmentFilter}
            onChange={setDepartmentFilter}
            options={DEPARTMENTS}
          />
          <FilterSelect
            label='Employee'
            value={employeeFilter}
            onChange={setEmployeeFilter}
            options={EMPLOYEE_NAMES}
          />
        </div>
        <div className='flex items-center gap-2'>
          <RoleGate roles={['Company Admin']}>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setCategoryOpen(true)}
            >
              <Plus size={12} weight='bold' />
              Category
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setSettingsOpen(true)}
            >
              <Gear size={12} weight='bold' />
              Schedule
            </Button>
          </RoleGate>
          <RoleGate roles={['Employee (User)', 'Company Admin']}>
            <Button size='sm' onClick={() => setGiveOpen(true)}>
              <Plus size={12} weight='bold' />
              Appreciate a colleague
            </Button>
          </RoleGate>
        </div>
      </div>

      <div className='grid gap-4 lg:grid-cols-[2fr_1fr]'>
        <div className='rounded-md border border-gray-200 bg-white'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Appreciated by</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Feedback</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className='font-medium'>{a.employee}</TableCell>
                  <TableCell>{a.appreciatedBy}</TableCell>
                  <TableCell>
                    <Badge variant='open'>{a.category}</Badge>
                  </TableCell>
                  <TableCell className='text-neutral-1000 max-w-[260px] truncate'>
                    {a.feedback}
                  </TableCell>
                  <TableCell>
                    <Badge variant='qualified'>+{a.points}</Badge>
                  </TableCell>
                  <TableCell className='text-neutral-1000'>{a.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className='space-y-3'>
          <div className='rounded-md border border-gray-200 bg-white p-3'>
            <SectionTitle>Appreciation summary</SectionTitle>
            <ul className='space-y-1.5 pt-2'>
              {summary.map(([name, s]) => (
                <li
                  key={name}
                  className='flex items-center justify-between text-sm'
                >
                  <span>{name}</span>
                  <span className='text-neutral-1000'>
                    {s.count} × · {s.points} pts
                  </span>
                </li>
              ))}
            </ul>
            <p className='text-paragraph-sm text-neutral-1000 pt-2'>
              Points counted from{' '}
              {store.appreciationSettings.scoreCalculationStart}; employees are
              notified on day {store.appreciationSettings.notifyDayOfMonth} of
              each month.
            </p>
          </div>
          <div className='rounded-md border border-gray-200 bg-white p-3'>
            <SectionTitle>Categories & points</SectionTitle>
            <ul className='space-y-1.5 pt-2'>
              {store.categories.map((c) => (
                <li
                  key={c.id}
                  className='flex items-center justify-between text-sm'
                >
                  <span>
                    <span className='font-medium'>{c.name}</span>{' '}
                    <span className='text-neutral-1000'>— {c.description}</span>
                  </span>
                  <Badge variant='qualified'>{c.points} pts</Badge>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <Dialog open={giveOpen} onOpenChange={setGiveOpen}>
        <DialogContent className='sm:max-w-[420px]'>
          <DialogHeader>
            <DialogTitle>Appreciate a colleague</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <div className='space-y-1'>
              <Label>Employee</Label>
              <Select value={employee} onValueChange={setEmployee}>
                <SelectTrigger variant='secondary' className='w-full'>
                  <SelectValue placeholder='Select employee' />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYEE_NAMES.map((n) => (
                    <SelectItem key={n} value={n}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-1'>
              <Label>Category (points auto-attributed)</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger variant='secondary' className='w-full'>
                  <SelectValue placeholder='Select category' />
                </SelectTrigger>
                <SelectContent>
                  {store.categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} (+{c.points})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-1'>
              <Label>Feedback</Label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder='What did they do well?'
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setGiveOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={give}
              disabled={!employee || !categoryId || !feedback}
            >
              Send appreciation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className='sm:max-w-[380px]'>
          <DialogHeader>
            <DialogTitle>Appreciation notification schedule</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <div className='space-y-1'>
              <Label>Day of month to notify employees</Label>
              <Input
                type='number'
                min={1}
                max={28}
                value={notifyDay}
                onChange={(e) => setNotifyDay(e.target.value)}
              />
            </div>
            <div className='space-y-1'>
              <Label>Score-calculation start date</Label>
              <Input
                type='date'
                value={calcStart}
                onChange={(e) => setCalcStart(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setSettingsOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                store.saveAppreciationSettings({
                  notifyDayOfMonth: Number(notifyDay) || 1,
                  scoreCalculationStart: calcStart,
                })
                setSettingsOpen(false)
              }}
            >
              Save schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={categoryOpen} onOpenChange={setCategoryOpen}>
        <DialogContent className='sm:max-w-[380px]'>
          <DialogHeader>
            <DialogTitle>New appreciation category</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <div className='space-y-1'>
              <Label>Name</Label>
              <Input
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder='e.g. Safety Champion'
              />
            </div>
            <div className='space-y-1'>
              <Label>Description</Label>
              <Input
                value={catDescription}
                onChange={(e) => setCatDescription(e.target.value)}
                placeholder='When should this be used?'
              />
            </div>
            <div className='space-y-1'>
              <Label>Points</Label>
              <Input
                type='number'
                min={1}
                value={catPoints}
                onChange={(e) => setCatPoints(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setCategoryOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveCategory} disabled={!catName || !catPoints}>
              Add category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
