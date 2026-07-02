import { useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { type FieldType } from '../data/config'
import { type FeedbackConfigStore } from '../hooks/use-feedback-config'

interface ConfigSetupStepProps {
  store: FeedbackConfigStore
  onNext: () => void
}

/**
 * Setup step (FBG-13/14): per-tenant module toggle with version history,
 * governed entry categories, and the submission form schema including
 * custom fields — effective-dated, so existing entries keep their schema.
 */
export function ConfigSetupStep({ store, onNext }: ConfigSetupStepProps) {
  const { config } = store
  const [moduleEnabled, setModuleEnabled] = useState(config.moduleEnabled)
  const [categories, setCategories] = useState(config.categories)
  const [formFields, setFormFields] = useState(config.formFields)
  const [newCategory, setNewCategory] = useState('')
  const [newFieldLabel, setNewFieldLabel] = useState('')
  const [newFieldType, setNewFieldType] = useState<FieldType>('text')

  const save = (advance: boolean) => {
    const ok = store.saveSetup({ moduleEnabled, categories, formFields })
    if (ok && advance) onNext()
  }

  const cancel = () => {
    setModuleEnabled(config.moduleEnabled)
    setCategories(config.categories)
    setFormFields(config.formFields)
    toast.info('Unsaved Setup changes discarded')
  }

  const addCategory = () => {
    const name = newCategory.trim()
    if (!name || categories.some((c) => c.name === name)) return
    setCategories([...categories, { name, active: true }])
    setNewCategory('')
  }

  const addField = () => {
    const label = newFieldLabel.trim()
    if (!label) return
    setFormFields([
      ...formFields,
      {
        id: `udf-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        label,
        type: newFieldType,
        required: false,
        custom: true,
        active: true,
      },
    ])
    setNewFieldLabel('')
  }

  return (
    <div className='grid w-full grid-cols-1 gap-4 xl:grid-cols-2'>
      <Card className='gap-3 border-none bg-white py-4'>
        <CardHeader className='px-4'>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            Module availability (per tenant, versioned)
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-3 px-4'>
          <div className='border-grey-200 flex items-center justify-between rounded-[6px] border px-3 py-2'>
            <div>
              <Label className='text-sm font-medium'>
                Feedback & Grievance module enabled
              </Label>
              <p className='text-paragraph-sm text-neutral-1000'>
                When off, submission and tracking are unavailable to employees
                of this company. Changes are effective-dated below.
              </p>
            </div>
            <Switch checked={moduleEnabled} onCheckedChange={setModuleEnabled} />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Version</TableHead>
                <TableHead>Effective from</TableHead>
                <TableHead>Changed by</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...config.versions].reverse().map((v) => (
                <TableRow key={v.version}>
                  <TableCell className='text-sm font-medium'>v{v.version}</TableCell>
                  <TableCell className='text-sm'>{v.changedOn}</TableCell>
                  <TableCell className='text-sm'>{v.changedBy}</TableCell>
                  <TableCell className='text-neutral-1000 text-sm'>{v.note}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className='gap-3 border-none bg-white py-4'>
        <CardHeader className='px-4'>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            Entry categories
          </CardTitle>
          <p className='text-paragraph-sm text-neutral-1000'>
            Click a category to activate/deactivate it for new submissions.
          </p>
        </CardHeader>
        <CardContent className='space-y-3 px-4'>
          <div className='flex flex-wrap gap-2'>
            {categories.map((c) => (
              <button
                key={c.name}
                type='button'
                onClick={() =>
                  setCategories(
                    categories.map((x) =>
                      x.name === c.name ? { ...x, active: !x.active } : x
                    )
                  )
                }
              >
                <Badge variant={c.active ? 'open' : 'badge_inactive'}>
                  {c.name}
                  {c.active ? '' : ' (inactive)'}
                </Badge>
              </button>
            ))}
          </div>
          <div className='flex items-center gap-2'>
            <Input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder='New category name'
              className='h-8'
            />
            <Button variant='outline' onClick={addCategory} className='h-8 gap-1'>
              <Plus className='size-3.5' /> Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className='gap-3 border-none bg-white py-4 xl:col-span-2'>
        <CardHeader className='px-4'>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            Submission form schema (current: v{config.schemaVersion})
          </CardTitle>
          <p className='text-paragraph-sm text-neutral-1000'>
            New submissions render from this schema; existing entries retain
            the schema under which they were captured. Saving a schema change
            bumps the version.
          </p>
        </CardHeader>
        <CardContent className='space-y-3 px-4'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Field</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Origin</TableHead>
                <TableHead>Mandatory</TableHead>
                <TableHead>Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {formFields.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className='text-sm font-medium'>{f.label}</TableCell>
                  <TableCell className='text-sm'>{f.type}</TableCell>
                  <TableCell>
                    <Badge variant={f.custom ? 'pending' : 'booked'}>
                      {f.custom ? 'Custom (UDF)' : 'Base'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={f.required}
                      disabled={!f.custom && f.required}
                      onCheckedChange={(required) =>
                        setFormFields(
                          formFields.map((x) =>
                            x.id === f.id ? { ...x, required } : x
                          )
                        )
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={f.active}
                      disabled={!f.custom}
                      onCheckedChange={(active) =>
                        setFormFields(
                          formFields.map((x) =>
                            x.id === f.id ? { ...x, active } : x
                          )
                        )
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className='flex items-center gap-2'>
            <Input
              value={newFieldLabel}
              onChange={(e) => setNewFieldLabel(e.target.value)}
              placeholder='New custom field label'
              className='h-8 max-w-72'
            />
            <Select
              value={newFieldType}
              onValueChange={(v) => setNewFieldType(v as FieldType)}
            >
              <SelectTrigger variant='secondary' className='h-8 w-[130px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='text'>Text</SelectItem>
                <SelectItem value='textarea'>Long text</SelectItem>
                <SelectItem value='date'>Date</SelectItem>
              </SelectContent>
            </Select>
            <Button variant='outline' onClick={addField} className='h-8 gap-1'>
              <Plus className='size-3.5' /> Add custom field
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className='flex items-center justify-end gap-3 xl:col-span-2'>
        <Button variant='outline' onClick={cancel}>
          Cancel
        </Button>
        <Button variant='outline' onClick={() => save(false)}>
          Save
        </Button>
        <Button onClick={() => save(true)}>Save & Next</Button>
      </div>
    </div>
  )
}
