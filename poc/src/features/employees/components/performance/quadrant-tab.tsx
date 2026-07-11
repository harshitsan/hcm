import { useState } from 'react'
import { Gear } from 'phosphor-react'
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
import { RoleGate } from '@/context/role-context'
import { QUADRANTS, type Quadrant } from '../../data/performance'
import { type PerformanceStore } from '../../hooks/use-performance'
import { SectionTitle } from '../shared'

/** Direct reports rated by the signed-in manager persona in the POC. */
const MY_REPORTS = ['Rohit Menon', 'Sneha Patil', 'Grace D’Souza']

const MONTHS = ['2026-04', '2026-05', '2026-06', '2026-07']

/**
 * EMP-38/39 — monthly quadrant rating of direct reports with comments, plus
 * the Company Admin cycle configuration (frequency, start, reminders,
 * deadline).
 */
export function QuadrantTab({ store }: { store: PerformanceStore }) {
  const [month, setMonth] = useState('2026-06')
  const [drafts, setDrafts] = useState<
    Record<string, { quadrant: Quadrant | ''; comment: string }>
  >({})
  const [configOpen, setConfigOpen] = useState(false)
  const [config, setConfig] = useState(store.quadrantConfig)

  const draftFor = (name: string) =>
    drafts[name] ?? { quadrant: '' as const, comment: '' }

  const submit = (name: string) => {
    const d = draftFor(name)
    if (!d.quadrant) return
    store.saveQuadrantRating({
      employee: name,
      manager: 'You',
      month,
      quadrant: d.quadrant,
      comment: d.comment,
    })
    setDrafts((prev) => ({
      ...prev,
      [name]: { quadrant: '', comment: '' },
    }))
  }

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div className='flex items-center gap-2'>
          <Label>Rating month</Label>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger variant='secondary' className='h-8 w-[130px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className='text-paragraph-sm text-neutral-1000'>
            {store.quadrantConfig.frequency} cycle · starts day{' '}
            {store.quadrantConfig.periodStartDay} · reminder after{' '}
            {store.quadrantConfig.reminderAfterDays} days · complete within{' '}
            {store.quadrantConfig.completionDeadlineDays} days
          </span>
        </div>
        <RoleGate roles={['Company Admin']}>
          <Button
            variant='outline'
            size='sm'
            onClick={() => {
              setConfig(store.quadrantConfig)
              setConfigOpen(true)
            }}
          >
            <Gear size={12} weight='bold' />
            Configure cycle
          </Button>
        </RoleGate>
      </div>

      <RoleGate
        roles={['Employee (User)', 'Company Admin']}
        fallback={
          <p className='text-paragraph-sm text-neutral-1000'>
            Quadrant ratings are given by reporting managers.
          </p>
        }
      >
        <SectionTitle>Rate my reports — {month}</SectionTitle>
        <div className='rounded-md border border-gray-200 bg-white'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Quadrant</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {MY_REPORTS.map((name) => {
                const existing = store.quadrantRatings.find(
                  (r) => r.employee === name && r.month === month
                )
                const d = draftFor(name)
                return (
                  <TableRow key={name}>
                    <TableCell>
                      <span className='font-medium'>{name}</span>
                      {existing && (
                        <p className='text-paragraph-sm text-neutral-1000'>
                          Current: {existing.quadrant} — “{existing.comment}”
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={d.quadrant}
                        onValueChange={(v) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [name]: { ...d, quadrant: v as Quadrant },
                          }))
                        }
                      >
                        <SelectTrigger
                          variant='secondary'
                          className='w-[210px]'
                        >
                          <SelectValue placeholder='Select quadrant' />
                        </SelectTrigger>
                        <SelectContent>
                          {QUADRANTS.map((q) => (
                            <SelectItem key={q} value={q}>
                              {q}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={d.comment}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [name]: { ...d, comment: e.target.value },
                          }))
                        }
                        placeholder='Comment (saved with the rating)'
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        size='sm'
                        onClick={() => submit(name)}
                        disabled={!d.quadrant}
                      >
                        {existing ? 'Update' : 'Submit'}
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </RoleGate>

      <SectionTitle>Rating history by month</SectionTitle>
      <div className='rounded-md border border-gray-200 bg-white'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Month</TableHead>
              <TableHead>Quadrant</TableHead>
              <TableHead>Comment</TableHead>
              <TableHead>Rated by</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {store.quadrantRatings.map((r) => (
              <TableRow key={r.id}>
                <TableCell className='font-medium'>{r.employee}</TableCell>
                <TableCell>{r.month}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      r.quadrant === 'Key Members'
                        ? 'badge_active'
                        : r.quadrant === 'Bad Performers'
                          ? 'dropped'
                          : 'open'
                    }
                  >
                    {r.quadrant}
                  </Badge>
                </TableCell>
                <TableCell className='text-neutral-1000 max-w-[280px] truncate'>
                  {r.comment}
                </TableCell>
                <TableCell>{r.manager}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={configOpen} onOpenChange={setConfigOpen}>
        <DialogContent className='sm:max-w-[400px]'>
          <DialogHeader>
            <DialogTitle>Quadrant rating cycle</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <div className='space-y-1'>
              <Label>Frequency</Label>
              <Select
                value={config.frequency}
                onValueChange={(v) =>
                  setConfig((c) => ({
                    ...c,
                    frequency: v as typeof c.frequency,
                  }))
                }
              >
                <SelectTrigger variant='secondary' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='Monthly'>Monthly</SelectItem>
                  <SelectItem value='Quarterly'>Quarterly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(
              [
                ['periodStartDay', 'Rating period starts (day of month)'],
                ['reminderAfterDays', 'Remind managers after (days)'],
                ['completionDeadlineDays', 'Must complete within (days)'],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className='space-y-1'>
                <Label>{label}</Label>
                <Input
                  type='number'
                  min={1}
                  value={config[key]}
                  onChange={(e) =>
                    setConfig((c) => ({
                      ...c,
                      [key]: Number(e.target.value) || 1,
                    }))
                  }
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setConfigOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                store.saveQuadrantConfig(config)
                setConfigOpen(false)
              }}
            >
              Save — applies to subsequent cycles
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
