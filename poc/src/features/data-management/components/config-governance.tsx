import { useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
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
  DATA_ENTITIES,
  FILE_FORMATS,
  TIERS,
  type FileFormat,
  type Tier,
} from '../data/catalog'
import { type DataConfigStore } from '../hooks/use-data-config'
import { TierBadge } from './badges'

interface ConfigGovernanceProps {
  store: DataConfigStore
}

/**
 * Versioned, effective-dated import/export configuration: supported
 * formats, size/batch limits and the entity → tier classification the
 * sequencing engine reads at runtime (DM-17).
 */
export function ConfigGovernance({ store }: ConfigGovernanceProps) {
  const { currentConfig, versions, publishVersion, tierMap, setEntityTier } =
    store

  const [formats, setFormats] = useState<FileFormat[]>(currentConfig.formats)
  const [maxSize, setMaxSize] = useState(String(currentConfig.maxFileSizeMb))
  const [maxBatch, setMaxBatch] = useState(
    String(currentConfig.maxBatchRecords)
  )
  const [note, setNote] = useState('')

  const toggleFormat = (format: FileFormat, checked: boolean) => {
    setFormats((prev) =>
      checked ? [...prev, format] : prev.filter((f) => f !== format)
    )
  }

  const publish = () => {
    const size = Number(maxSize)
    const batch = Number(maxBatch)
    if (formats.length === 0 || !size || !batch || size <= 0 || batch <= 0) {
      toast.error('Provide at least one format and positive limits')
      return
    }
    publishVersion({
      formats,
      maxFileSizeMb: size,
      maxBatchRecords: batch,
      note: note.trim() || 'Limits/formats update',
      publishedBy: 'Platform Ops',
    })
    setNote('')
  }

  return (
    <div className='grid gap-4 lg:grid-cols-2'>
      <Card className='gap-3 border-gray-200 py-4'>
        <CardHeader className='px-4'>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            Formats & limits (governed config)
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4 px-4'>
          <div>
            <Label className='mb-2 block'>Supported formats</Label>
            <div className='flex flex-wrap gap-4'>
              {FILE_FORMATS.map((format) => (
                <label key={format} className='flex items-center gap-2 text-sm'>
                  <Checkbox
                    variant='blue'
                    checked={formats.includes(format)}
                    onCheckedChange={(v) => toggleFormat(format, !!v)}
                  />
                  {format}
                </label>
              ))}
            </div>
          </div>
          <div className='grid grid-cols-2 gap-3'>
            <div>
              <Label className='mb-1.5 block'>Max file size (MB)</Label>
              <Input
                value={maxSize}
                onChange={(e) => setMaxSize(e.target.value)}
              />
            </div>
            <div>
              <Label className='mb-1.5 block'>Max records / batch</Label>
              <Input
                value={maxBatch}
                onChange={(e) => setMaxBatch(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label className='mb-1.5 block'>Change note</Label>
            <Input
              placeholder='Why is this changing?'
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <Button onClick={publish}>
            Publish new version (effective today)
          </Button>

          <div>
            <Label className='mb-2 block'>Version history</Label>
            <div className='space-y-1.5'>
              {versions.map((v, i) => (
                <div
                  key={v.version}
                  className='flex items-start justify-between rounded-[6px] border border-gray-200 px-3 py-1.5 text-sm'
                >
                  <div>
                    <span className='text-neutral-1600 font-medium'>
                      v{v.version}
                    </span>{' '}
                    <span className='text-neutral-1000'>
                      effective {v.effectiveFrom} · {v.formats.join(', ')} ·{' '}
                      {v.maxFileSizeMb} MB /{' '}
                      {v.maxBatchRecords.toLocaleString()} records
                    </span>
                    <p className='text-paragraph-sm text-neutral-1000'>
                      {v.note} — {v.publishedBy}
                    </p>
                  </div>
                  {i === 0 && <Badge variant='completed'>Current</Badge>}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className='gap-3 border-gray-200 py-4'>
        <CardHeader className='px-4'>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            Entity → dependency-tier classification
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-3 px-4'>
          <p className='text-paragraph-sm text-neutral-1000'>
            The sequencing engine orders imports Foundation → Organizational →
            Workforce → Transactional using this classification. Changes apply
            without a code release.
          </p>
          <div className='space-y-1.5'>
            {DATA_ENTITIES.map((entity) => (
              <div
                key={entity.id}
                className='flex items-center justify-between rounded-[6px] border border-gray-200 px-3 py-1.5'
              >
                <span className='flex items-center gap-2 text-sm'>
                  <span className='text-neutral-1600 font-medium'>
                    {entity.name}
                  </span>
                  <span className='text-neutral-1000 text-paragraph-sm'>
                    {entity.kind}
                  </span>
                  <TierBadge tier={tierMap[entity.id] ?? entity.tier} />
                </span>
                <Select
                  value={tierMap[entity.id] ?? entity.tier}
                  onValueChange={(v) => setEntityTier(entity.id, v as Tier)}
                >
                  <SelectTrigger variant='secondary' className='h-8 w-[170px]'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIERS.map((tier) => (
                      <SelectItem key={tier} value={tier}>
                        {tier}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
