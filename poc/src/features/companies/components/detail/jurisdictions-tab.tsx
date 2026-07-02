import { useState } from 'react'
import { Trash } from 'phosphor-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  SUPPORTED_JURISDICTIONS,
  UNSUPPORTED_JURISDICTIONS,
  type Company,
} from '../../data/companies'
import { type CompaniesStore } from '../../hooks/use-companies'

interface JurisdictionsTabProps {
  company: Company
  store: CompaniesStore
  canEdit: boolean
}

/**
 * FR 6.2.3 — CompanyJurisdiction management: effective/expiry dates, exactly
 * one primary, COMP_002 for unsupported entries, removal blocked when
 * employees are assigned.
 */
export function JurisdictionsTab({
  company,
  store,
  canEdit,
}: JurisdictionsTabProps) {
  const [jurisdiction, setJurisdiction] = useState('')
  const [effectiveDate, setEffectiveDate] = useState(
    new Date().toISOString().slice(0, 10)
  )
  const [expiryDate, setExpiryDate] = useState('')

  const handleAdd = () => {
    if (!jurisdiction) {
      toast.error('Select a jurisdiction to add')
      return
    }
    const result = store.addJurisdiction(
      company.id,
      jurisdiction,
      effectiveDate,
      expiryDate || null
    )
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success(
      `${jurisdiction} added — jurisdiction-specific structures, policies, security, workflows and workforce data can now be configured for it`
    )
    setJurisdiction('')
    setExpiryDate('')
  }

  const handleRemove = (jurisdictionId: string) => {
    const result = store.removeJurisdiction(company.id, jurisdictionId)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success('Jurisdiction removed')
  }

  const handleSetPrimary = (jurisdictionId: string) => {
    store.setPrimaryJurisdiction(company.id, jurisdictionId)
    toast.success(
      'Primary operating region updated — exactly one jurisdiction is primary; the rest are secondary'
    )
  }

  return (
    <div className='space-y-4'>
      <p className='text-paragraph-sm text-neutral-1000'>
        One tenant, many jurisdictions — no separate tenant is required per
        region. Each jurisdiction carries an effective date and optional expiry.
      </p>

      <div className='rounded-[6px] border border-gray-200 bg-white'>
        {company.jurisdictions.map((j) => (
          <div
            key={j.id}
            className='flex items-center justify-between gap-3 border-b border-gray-100 px-3 py-2 last:border-b-0'
          >
            <div className='flex min-w-0 items-center gap-2'>
              <span className='text-neutral-1600 text-sm font-medium'>
                {j.jurisdiction}
              </span>
              {j.isPrimary ? (
                <Badge variant='badge_active'>Primary</Badge>
              ) : (
                <Badge variant='pending'>Secondary</Badge>
              )}
            </div>
            <div className='flex items-center gap-3'>
              <span className='text-paragraph-sm text-neutral-1000'>
                Effective {j.effectiveDate}
                {j.expiryDate ? ` → ${j.expiryDate}` : ''} ·{' '}
                {j.employeeCount.toLocaleString('en-US')} employees
              </span>
              {canEdit && !j.isPrimary && (
                <Button
                  type='button'
                  variant='outline'
                  className='h-7 px-2 text-xs'
                  onClick={() => handleSetPrimary(j.id)}
                >
                  Set primary
                </Button>
              )}
              {canEdit && (
                <Button
                  type='button'
                  variant='icon2'
                  className='text-neutral-1900 h-7 w-7'
                  aria-label={`Remove ${j.jurisdiction}`}
                  onClick={() => handleRemove(j.id)}
                >
                  <Trash size={14} weight='bold' />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {canEdit && (
        <div className='space-y-3 rounded-[6px] border border-gray-200 bg-white p-3'>
          <p className='text-paragraph-sm text-neutral-1600 font-medium'>
            Add jurisdiction
          </p>
          <div className='grid grid-cols-3 gap-3'>
            <div className='space-y-1'>
              <Label className='text-paragraph-sm'>Jurisdiction</Label>
              <Select value={jurisdiction} onValueChange={setJurisdiction}>
                <SelectTrigger variant='secondary' className='w-full'>
                  <SelectValue placeholder='Select…' />
                </SelectTrigger>
                <SelectContent>
                  {[...SUPPORTED_JURISDICTIONS, ...UNSUPPORTED_JURISDICTIONS].map(
                    (j) => (
                      <SelectItem key={j} value={j}>
                        {j}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-1'>
              <Label className='text-paragraph-sm'>Effective date</Label>
              <Input
                type='date'
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
              />
            </div>
            <div className='space-y-1'>
              <Label className='text-paragraph-sm'>Expiry date (optional)</Label>
              <Input
                type='date'
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
          </div>
          <div className='flex justify-end'>
            <Button type='button' onClick={handleAdd}>
              Add jurisdiction
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
