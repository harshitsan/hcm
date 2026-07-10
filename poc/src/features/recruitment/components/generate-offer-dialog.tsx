import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
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
import { useRole } from '@/context/role-context'
import type { Application } from '../data/candidates'
import {
  computeBreakup,
  findSlab,
  seedCompensationSlabs,
  type CompensationSlab,
} from '../data/compensation'
import type { LetterTemplate, OfferApproverRule } from '../data/config'
import { formatInr, type ComponentChange, type OfferComponent } from '../data/offers'
import { LOCATIONS, seedRequisitions } from '../data/requisitions'
import type { OfferDraft } from '../hooks/use-offers'
import { OutOfBandBadge } from './badges'

interface GenerateOfferDialogProps {
  application: Application | null
  onOpenChange: (open: boolean) => void
  /** Only active offer-letter templates are selectable (TA-15). */
  letterTemplates: LetterTemplate[]
  offerApproverRules: OfferApproverRule[]
  outOfBandApprover: string
  onGenerate: (app: Application, draft: OfferDraft) => void
  /** Compensation slabs used to derive the breakup (defaults to seeds). */
  slabs?: CompensationSlab[]
}

/** Position level derived from the requisition title (POC heuristic). */
const positionLevel = (title: string) =>
  /lead|principal|head/i.test(title)
    ? 'L4 — Lead'
    : /senior|sr\./i.test(title)
      ? 'L3 — Senior'
      : 'L2 — Mid'

/**
 * Generate an offer per the Kensium PDF — candidate compensation context
 * (current/expected/recommended CTC), offered CTC + expected DOJ, the slab-
 * derived salary-component breakup with click-to-edit amounts (each edit is
 * audit-logged) — then route through the location-based approval matrix with
 * out-of-band sign-off when the CTC exceeds the band (TA-11, TA-15, TA-46).
 */
export function GenerateOfferDialog({
  application: app,
  onOpenChange,
  letterTemplates,
  offerApproverRules,
  outOfBandApprover,
  onGenerate,
  slabs = seedCompensationSlabs,
}: GenerateOfferDialogProps) {
  const { role } = useRole()
  const activeTemplates = letterTemplates.filter(
    (t) => t.letterType === 'Offer' && t.active
  )
  const [templateId, setTemplateId] = useState('')
  const [ctc, setCtc] = useState('3000000')
  const [bandMax, setBandMax] = useState('3500000')
  const [location, setLocation] = useState<string>(LOCATIONS[0])
  const [deadline, setDeadline] = useState('')
  const [expectedDoj, setExpectedDoj] = useState('')
  const [currentCtc, setCurrentCtc] = useState('2400000')
  const [expectedCtc, setExpectedCtc] = useState('3200000')
  const [comments, setComments] = useState('')

  // Breakup table state — rows re-derive from the matched slab on CTC or
  // location change; manual amount edits are appended to componentChanges.
  const [rows, setRows] = useState<OfferComponent[]>([])
  const [changes, setChanges] = useState<ComponentChange[]>([])
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [editAmount, setEditAmount] = useState('')
  const [newName, setNewName] = useState('')
  const [newAmount, setNewAmount] = useState('')

  const requisition = seedRequisitions.find((r) => r.id === app?.requisitionId)
  const department = requisition?.department ?? 'Engineering'

  useEffect(() => {
    if (!app) return
    setTemplateId(activeTemplates[0]?.id ?? '')
    if (requisition) setLocation(requisition.location)
    setComments('')
    setChanges([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app])

  const template = activeTemplates.find((t) => t.id === templateId)
  const outOfBand = Number(ctc) > Number(bandMax)

  const slab = useMemo(
    () => findSlab(slabs, Number(ctc) || 0, location, department),
    [slabs, ctc, location, department]
  )
  /** Recommended CTC from the matched slab — midpoint of its range. */
  const recommendedCtc = slab
    ? Math.round((slab.ctcFrom + slab.ctcTo) / 2)
    : Number(expectedCtc) || 0

  // Re-derive the breakup whenever the slab match or CTC changes; manual
  // edits are reset since amounts are recomputed from the slab.
  useEffect(() => {
    if (!slab) {
      setRows([])
      return
    }
    setRows(
      computeBreakup(slab, Number(ctc) || 0).map(
        ({ name, type, mode, value, amount }) => ({
          name,
          type,
          mode,
          value,
          amount,
        })
      )
    )
    setChanges([])
    setEditingIdx(null)
  }, [slab, ctc])

  const routing = useMemo(() => {
    const rule = offerApproverRules.find((r) => r.locations.includes(location))
    const chain = rule ? [...rule.approvers] : ['Sunita Patil']
    if (outOfBand) chain.push(`${outOfBandApprover} (out-of-band)`)
    return chain
  }, [offerApproverRules, location, outOfBand, outOfBandApprover])

  if (!app) return null

  /** Commit a click-to-edit amount change and audit it. */
  const commitEdit = () => {
    if (editingIdx === null) return
    const to = Number(editAmount)
    const row = rows[editingIdx]
    if (!Number.isNaN(to) && to !== row.amount) {
      setChanges((prev) => [
        ...prev,
        {
          component: row.name,
          from: row.amount,
          to,
          by: role,
          at: new Date().toISOString(),
        },
      ])
      setRows((prev) =>
        prev.map((r, i) => (i === editingIdx ? { ...r, amount: to } : r))
      )
    }
    setEditingIdx(null)
  }

  /** Add a custom fixed component — logged as a change from 0. */
  const addComponent = () => {
    const amount = Number(newAmount)
    if (!newName.trim() || Number.isNaN(amount) || amount <= 0) return
    setRows((prev) => [
      ...prev,
      { name: newName.trim(), type: 'Earning', mode: 'fixed', value: amount, amount },
    ])
    setChanges((prev) => [
      ...prev,
      {
        component: newName.trim(),
        from: 0,
        to: amount,
        by: role,
        at: new Date().toISOString(),
      },
    ])
    setNewName('')
    setNewAmount('')
  }

  const submit = () => {
    if (!template || !deadline || !expectedDoj) return
    onGenerate(app, {
      templateId: template.id,
      templateName: template.name,
      templateVersion: template.version,
      annualCtc: Number(ctc),
      bandMax: Number(bandMax),
      location,
      responseDeadline: deadline,
      expectedDoj,
      currentCtc: Number(currentCtc) || 0,
      expectedCtc: Number(expectedCtc) || 0,
      recommendedCtc,
      breakup: rows,
      componentChanges: changes,
      comments: comments || undefined,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={Boolean(app)} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[640px]'>
        <DialogHeader>
          <DialogTitle>Generate offer — {app.candidateName}</DialogTitle>
        </DialogHeader>

        <div className='max-h-[70vh] space-y-3 overflow-y-auto pr-1'>
          {/* Candidate context per the PDF — role, level and CTC anchors */}
          <div className='rounded-[8px] border border-gray-200 bg-neutral-100 p-3'>
            <div className='grid grid-cols-2 gap-x-4 gap-y-1 text-sm'>
              <p>
                <span className='text-neutral-1000'>Department:</span>{' '}
                {department}
              </p>
              <p>
                <span className='text-neutral-1000'>Position:</span>{' '}
                {app.requisitionTitle}
              </p>
              <p>
                <span className='text-neutral-1000'>Position level:</span>{' '}
                {positionLevel(app.requisitionTitle)}
              </p>
              <p>
                <span className='text-neutral-1000'>Recommended CTC:</span>{' '}
                {slab ? formatInr(recommendedCtc) : '— (no slab match)'}
              </p>
            </div>
          </div>

          <div className='grid grid-cols-2 gap-3'>
            <div>
              <p className='mb-1 text-sm font-medium'>Current CTC (₹)</p>
              <Input
                type='number'
                value={currentCtc}
                onChange={(e) => setCurrentCtc(e.target.value)}
              />
            </div>
            <div>
              <p className='mb-1 text-sm font-medium'>Expected CTC (₹)</p>
              <Input
                type='number'
                value={expectedCtc}
                onChange={(e) => setExpectedCtc(e.target.value)}
              />
            </div>
          </div>

          <div>
            <p className='mb-1 text-sm font-medium'>
              Offer template (active templates only)
            </p>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Select template' />
              </SelectTrigger>
              <SelectContent>
                {activeTemplates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} (v{t.version})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='grid grid-cols-2 gap-3'>
            <div>
              <p className='mb-1 text-sm font-medium'>Offered annual CTC (₹)</p>
              <Input
                type='number'
                value={ctc}
                onChange={(e) => setCtc(e.target.value)}
              />
            </div>
            <div>
              <p className='mb-1 text-sm font-medium'>Band maximum (₹)</p>
              <Input
                type='number'
                value={bandMax}
                onChange={(e) => setBandMax(e.target.value)}
              />
            </div>
          </div>

          <div className='grid grid-cols-3 gap-3'>
            <div>
              <p className='mb-1 text-sm font-medium'>Work location</p>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger className='w-full'>
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
            <div>
              <p className='mb-1 text-sm font-medium'>Expected DOJ</p>
              <Input
                type='date'
                value={expectedDoj}
                onChange={(e) => setExpectedDoj(e.target.value)}
              />
            </div>
            <div>
              <p className='mb-1 text-sm font-medium'>Response deadline</p>
              <Input
                type='date'
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
          </div>

          {/* Slab-derived compensation breakup with click-to-edit amounts */}
          <div className='rounded-[8px] border border-gray-200 bg-white'>
            <div className='flex items-center justify-between px-3 pt-2'>
              <p className='text-sm font-medium'>
                Compensation breakup{slab ? ` — ${slab.name}` : ''}
              </p>
              {outOfBand && <OutOfBandBadge />}
            </div>
            {slab ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Component</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Basis</TableHead>
                    <TableHead className='text-right'>Annual amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r, i) => (
                    <TableRow key={`${r.name}-${i}`}>
                      <TableCell className='text-sm'>{r.name}</TableCell>
                      <TableCell className='text-paragraph-sm text-neutral-1000'>
                        {r.type}
                      </TableCell>
                      <TableCell className='text-paragraph-sm text-neutral-1000'>
                        {r.mode === 'percent-of-gross'
                          ? `${r.value}% of gross`
                          : 'Fixed'}
                      </TableCell>
                      <TableCell className='text-right'>
                        {editingIdx === i ? (
                          <Input
                            autoFocus
                            type='number'
                            className='ml-auto h-6 w-[110px] text-right'
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            onBlur={commitEdit}
                            onKeyDown={(e) => e.key === 'Enter' && commitEdit()}
                          />
                        ) : (
                          <button
                            type='button'
                            className='cursor-pointer text-sm underline decoration-dotted underline-offset-2'
                            title='Click to edit — change is audit-logged'
                            onClick={() => {
                              setEditingIdx(i)
                              setEditAmount(String(r.amount))
                            }}
                          >
                            {formatInr(r.amount)}
                          </button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Add component row */}
                  <TableRow>
                    <TableCell colSpan={3}>
                      <Input
                        placeholder='Add component (e.g. Joining Bonus)'
                        className='h-7'
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                      />
                    </TableCell>
                    <TableCell className='text-right'>
                      <div className='flex items-center justify-end gap-1'>
                        <Input
                          type='number'
                          placeholder='₹ / yr'
                          className='h-7 w-[100px] text-right'
                          value={newAmount}
                          onChange={(e) => setNewAmount(e.target.value)}
                        />
                        <Button
                          variant='outline'
                          className='h-7 px-2 text-xs'
                          onClick={addComponent}
                        >
                          Add
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            ) : (
              <p className='px-3 pb-3 pt-1 text-paragraph-sm text-amber-600'>
                Offered CTC is out of slab range — no compensation slab matches{' '}
                {formatInr(Number(ctc) || 0)} for {department} in {location}.
                Adjust the CTC or configure a slab before generating.
              </p>
            )}
            {changes.length > 0 && (
              <div className='border-t border-gray-200 px-3 py-2'>
                <p className='mb-1 text-paragraph-sm font-medium'>
                  Component changes (audit-logged)
                </p>
                {changes.map((c, i) => (
                  <p key={i} className='text-paragraph-sm text-neutral-1000'>
                    {c.component}: {formatInr(c.from)} → {formatInr(c.to)} by{' '}
                    {c.by}
                  </p>
                ))}
              </div>
            )}
          </div>

          <div className='rounded-[8px] border border-gray-200 bg-neutral-100 p-3'>
            <p className='text-paragraph-sm text-neutral-1600'>
              Approval routing: {routing.join(' → ')}
            </p>
          </div>

          <Textarea
            placeholder='Comments for the approvers (optional)'
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={2}
          />
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!template || !deadline || !expectedDoj}
            onClick={submit}
          >
            Generate &amp; submit for approval
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
