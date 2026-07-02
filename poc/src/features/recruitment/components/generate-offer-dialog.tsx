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
import type { Application } from '../data/candidates'
import type { LetterTemplate, OfferApproverRule } from '../data/config'
import { formatInr } from '../data/offers'
import { LOCATIONS } from '../data/requisitions'
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
}

/**
 * Generate an offer from a configurable template and route it through the
 * location-based approval matrix, with out-of-band salary sign-off when the
 * CTC exceeds the band (TA-11, TA-15, TA-46).
 */
export function GenerateOfferDialog({
  application: app,
  onOpenChange,
  letterTemplates,
  offerApproverRules,
  outOfBandApprover,
  onGenerate,
}: GenerateOfferDialogProps) {
  const activeTemplates = letterTemplates.filter(
    (t) => t.letterType === 'Offer' && t.active
  )
  const [templateId, setTemplateId] = useState('')
  const [ctc, setCtc] = useState('3000000')
  const [bandMax, setBandMax] = useState('3500000')
  const [location, setLocation] = useState<string>(LOCATIONS[0])
  const [deadline, setDeadline] = useState('')

  useEffect(() => {
    if (app) setTemplateId(activeTemplates[0]?.id ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app])

  const template = activeTemplates.find((t) => t.id === templateId)
  const outOfBand = Number(ctc) > Number(bandMax)

  const routing = useMemo(() => {
    const rule = offerApproverRules.find((r) => r.locations.includes(location))
    const chain = rule ? [...rule.approvers] : ['Sunita Patil']
    if (outOfBand) chain.push(`${outOfBandApprover} (out-of-band)`)
    return chain
  }, [offerApproverRules, location, outOfBand, outOfBandApprover])

  const preview = useMemo(() => {
    if (!template || !app) return ''
    return template.content
      .replace('{{candidate_name}}', app.candidateName)
      .replace('{{position}}', app.requisitionTitle)
      .replace('{{location}}', location)
      .replace('{{ctc}}', formatInr(Number(ctc) || 0))
      .replace('{{deadline}}', deadline || '—')
  }, [template, app, location, ctc, deadline])

  if (!app) return null

  const submit = () => {
    if (!template || !deadline) return
    onGenerate(app, {
      templateId: template.id,
      templateName: template.name,
      templateVersion: template.version,
      annualCtc: Number(ctc),
      bandMax: Number(bandMax),
      location,
      responseDeadline: deadline,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={Boolean(app)} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[480px]'>
        <DialogHeader>
          <DialogTitle>Generate offer — {app.candidateName}</DialogTitle>
        </DialogHeader>

        <div className='space-y-3'>
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
              <p className='mb-1 text-sm font-medium'>Annual CTC (₹)</p>
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

          <div className='grid grid-cols-2 gap-3'>
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
              <p className='mb-1 text-sm font-medium'>Response deadline</p>
              <Input
                type='date'
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
          </div>

          <div className='rounded-[8px] border border-gray-200 bg-neutral-100 p-3'>
            <div className='mb-1 flex items-center gap-2'>
              <p className='text-sm font-medium'>Merged preview</p>
              {outOfBand && <OutOfBandBadge />}
            </div>
            <p className='text-paragraph-sm text-neutral-1000'>{preview}</p>
            <p className='text-paragraph-sm text-neutral-1600 mt-2'>
              Approval routing: {routing.join(' → ')}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!template || !deadline} onClick={submit}>
            Generate &amp; submit for approval
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
