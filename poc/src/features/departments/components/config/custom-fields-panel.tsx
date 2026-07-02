import { useState } from 'react'
import { Plus, Trash } from 'phosphor-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
import { type CustomFieldType } from '../../data/governance'
import { type DepartmentConfigStore } from '../../hooks/use-department-config'
import { VersionBadge } from '../department-badges'

/**
 * Tenant-scoped custom-field (UDF) schema for the department entity
 * (DEPT-14): fields defined here render on department create/edit forms;
 * versioning is effective-dated so prior values stay under the old schema.
 */
export function CustomFieldsPanel({ config }: { config: DepartmentConfigStore }) {
  const [label, setLabel] = useState('')
  const [type, setType] = useState<CustomFieldType>('text')
  const [required, setRequired] = useState(false)
  const [options, setOptions] = useState('')

  const handleAdd = () => {
    if (label.trim().length < 2) {
      toast.error('Enter a field label')
      return
    }
    const optionList = options
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean)
    if (type === 'select' && optionList.length === 0) {
      toast.error('A select field needs at least one option')
      return
    }
    config.addCustomField({
      label: label.trim(),
      type,
      required,
      options: type === 'select' ? optionList : [],
    })
    setLabel('')
    setType('text')
    setRequired(false)
    setOptions('')
  }

  return (
    <Card className='border-gray-200'>
      <CardHeader>
        <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
          Department custom fields (UDF schema)
        </CardTitle>
        <p className='text-neutral-1000 text-xs'>
          Tenant-scoped: schema changes apply to this company only. The Forms engine
          renders these fields on department create/edit and validates per the configured
          rules.
        </p>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='flex flex-wrap items-center gap-2'>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder='Field label'
            className='w-[180px]'
          />
          <Select value={type} onValueChange={(v) => setType(v as CustomFieldType)}>
            <SelectTrigger variant='secondary' className='w-[110px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='text'>Text</SelectItem>
              <SelectItem value='select'>Select</SelectItem>
            </SelectContent>
          </Select>
          {type === 'select' && (
            <Input
              value={options}
              onChange={(e) => setOptions(e.target.value)}
              placeholder='Options (comma separated)'
              className='w-[220px]'
            />
          )}
          <label className='flex items-center gap-2 text-sm'>
            <Switch checked={required} onCheckedChange={setRequired} />
            <span className='text-neutral-1900'>Required</span>
          </label>
          <Button onClick={handleAdd} className='h-8'>
            <Plus size={12} weight='bold' />
            Add field
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Label</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Validation</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Effective from</TableHead>
              <TableHead className='w-[190px]'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {config.customFields.map((f) => (
              <TableRow key={f.id}>
                <TableCell className='text-neutral-1600 text-sm font-medium'>
                  {f.label}
                </TableCell>
                <TableCell>
                  <Badge variant='secondary'>{f.type}</Badge>
                </TableCell>
                <TableCell className='text-neutral-1900 text-sm'>
                  {f.required ? 'Required' : 'Optional'}
                  {f.options.length > 0 && ` · ${f.options.join(' / ')}`}
                </TableCell>
                <TableCell>
                  <VersionBadge version={f.version} />
                </TableCell>
                <TableCell className='text-neutral-1900 text-sm'>{f.effectiveFrom}</TableCell>
                <TableCell>
                  <div className='flex items-center gap-2'>
                    <Button
                      variant='outline'
                      className='h-7 px-2 text-xs'
                      onClick={() => config.bumpCustomFieldVersion(f.id)}
                    >
                      New version
                    </Button>
                    <Button
                      variant='icon2'
                      className='text-neutral-1900 h-7 w-7'
                      aria-label={`Remove ${f.label}`}
                      onClick={() => config.removeCustomField(f.id)}
                    >
                      <Trash size={14} weight='bold' />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
