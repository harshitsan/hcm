import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MODULES, type ModuleName } from '../data/companies'
import {
  currentVersion,
  type SubscriptionPackage,
} from '../data/subscriptions'
import { type PackageVersionDraft } from '../hooks/use-subscriptions'

interface PackageVersionFormProps {
  pkg: SubscriptionPackage
  onPublish: (packageId: string, draft: PackageVersionDraft) => void
  onCancel: () => void
}

/** CMP-19 — publish a new versioned, effective-dated package definition. */
export function PackageVersionForm({
  pkg,
  onPublish,
  onCancel,
}: PackageVersionFormProps) {
  const current = currentVersion(pkg)
  const [companyLimit, setCompanyLimit] = useState(String(current.companyLimit))
  const [employeeLimit, setEmployeeLimit] = useState(
    String(current.employeeLimit)
  )
  const [price, setPrice] = useState(String(current.pricePerEmployeeMonth))
  const [effectiveDate, setEffectiveDate] = useState(
    new Date().toISOString().slice(0, 10)
  )
  const [modules, setModules] = useState<ModuleName[]>(current.modules)

  const toggle = (m: ModuleName) =>
    setModules((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    )

  const publish = () => {
    const companies = Number(companyLimit)
    const employees = Number(employeeLimit)
    const priceNum = Number(price)
    if (
      !Number.isFinite(companies) ||
      companies <= 0 ||
      !Number.isFinite(employees) ||
      employees <= 0 ||
      !Number.isFinite(priceNum) ||
      priceNum < 0 ||
      modules.length === 0 ||
      !effectiveDate
    ) {
      toast.error(
        'Limits must be positive numbers, at least one module is required, and an effective date must be set'
      )
      return
    }
    onPublish(pkg.id, {
      companyLimit: companies,
      employeeLimit: employees,
      modules,
      pricePerEmployeeMonth: priceNum,
      effectiveDate,
    })
    onCancel()
  }

  return (
    <div className='space-y-3 rounded-[6px] border border-dashed border-gray-300 p-3'>
      <p className='text-paragraph-sm font-medium'>
        New version of {pkg.name} (v{current.version} → v{current.version + 1})
      </p>
      <div className='grid grid-cols-4 gap-3'>
        <div className='space-y-1'>
          <Label className='text-paragraph-sm'>Company limit</Label>
          <Input
            value={companyLimit}
            onChange={(e) => setCompanyLimit(e.target.value)}
          />
        </div>
        <div className='space-y-1'>
          <Label className='text-paragraph-sm'>Employee limit</Label>
          <Input
            value={employeeLimit}
            onChange={(e) => setEmployeeLimit(e.target.value)}
          />
        </div>
        <div className='space-y-1'>
          <Label className='text-paragraph-sm'>Price / employee / month</Label>
          <Input value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div className='space-y-1'>
          <Label className='text-paragraph-sm'>Effective date</Label>
          <Input
            type='date'
            value={effectiveDate}
            onChange={(e) => setEffectiveDate(e.target.value)}
          />
        </div>
      </div>
      <div className='grid grid-cols-2 gap-2 lg:grid-cols-4'>
        {MODULES.map((m) => (
          <label key={m} className='flex items-center gap-2 text-sm'>
            <Checkbox
              variant='blue'
              checked={modules.includes(m)}
              onCheckedChange={() => toggle(m)}
            />
            {m}
          </label>
        ))}
      </div>
      <div className='flex justify-end gap-2'>
        <Button type='button' variant='outline' onClick={onCancel}>
          Cancel
        </Button>
        <Button type='button' onClick={publish}>
          Publish version
        </Button>
      </div>
    </div>
  )
}
