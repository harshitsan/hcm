import { useMemo, useState } from 'react'
import { Plus } from 'phosphor-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { type Asset } from '../data/assets'
import { type AssetCategoryConfig } from '../data/config'
import { type AssetConfigStore, type CategoryDraft } from '../hooks/use-asset-config'

interface ConfigCategoriesProps {
  config: AssetConfigStore
  assets: Asset[]
}

/**
 * Category taxonomy master (ASM-19, ASM-37): name, code, maintain-asset-ids
 * flag and approximate life in months. Changes are versioned/effective-dated;
 * categories in use can only be deactivated after reassignment.
 */
export function ConfigCategories({ config, assets }: ConfigCategoriesProps) {
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<AssetCategoryConfig | null>(null)
  const [draft, setDraft] = useState<CategoryDraft>({
    name: '',
    code: '',
    maintainAssetIds: true,
    approxLifeMonths: 36,
  })

  const filtered = useMemo(
    () =>
      config.categories.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.code.toLowerCase().includes(search.toLowerCase())
      ),
    [config.categories, search]
  )

  const inUseCount = (name: string) => assets.filter((a) => a.category === name).length

  const openNew = () => {
    setEditing(null)
    setDraft({ name: '', code: '', maintainAssetIds: true, approxLifeMonths: 36 })
    setDialogOpen(true)
  }

  const openEdit = (category: AssetCategoryConfig) => {
    setEditing(category)
    setDraft({
      name: category.name,
      code: category.code,
      maintainAssetIds: category.maintainAssetIds,
      approxLifeMonths: category.approxLifeMonths,
    })
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (draft.name.trim().length < 2 || draft.code.trim().length < 2) {
      toast.error('Category name and code are required')
      return
    }
    if (draft.approxLifeMonths < 1) {
      toast.error('Approximate life must be at least 1 month')
      return
    }
    if (editing) config.updateCategory(editing.id, draft)
    else config.addCategory(draft)
    setDialogOpen(false)
  }

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between gap-3'>
        <div className='flex items-center gap-3'>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Search category or code'
            className='h-7 w-[220px]'
          />
          <Button variant='outline' className='h-7 rounded-[6px] px-2.5' onClick={() => setSearch('')}>
            Reset
          </Button>
          <Badge variant='open'>
            taxonomy v{config.taxonomyVersion} — versioned, effective-dated
          </Badge>
        </div>
        <Button
          variant='red'
          onClick={openNew}
          className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
        >
          <Plus size={10} weight='bold' />
          New Category
        </Button>
      </div>

      <div className='border-grey-200 overflow-hidden rounded-[6px] border bg-white'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category ID</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Maintain asset id(s)</TableHead>
              <TableHead>Approx. life (months)</TableHead>
              <TableHead>In use</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => (
              <TableRow key={c.id}>
                <TableCell className='text-paragraph-sm text-neutral-1000'>{c.id}</TableCell>
                <TableCell className='text-sm font-medium'>{c.name}</TableCell>
                <TableCell className='text-sm'>{c.code}</TableCell>
                <TableCell className='text-sm'>{c.maintainAssetIds ? 'Yes' : 'No'}</TableCell>
                <TableCell className='text-sm'>{c.approxLifeMonths}</TableCell>
                <TableCell className='text-sm'>{inUseCount(c.name)} asset(s)</TableCell>
                <TableCell>
                  <Switch
                    checked={c.active}
                    onCheckedChange={(active) =>
                      config.setCategoryActive(c.id, active, inUseCount(c.name))
                    }
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant='outline'
                    className='h-7 rounded-[6px] px-2.5'
                    onClick={() => openEdit(c)}
                  >
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='sm:max-w-[400px]'>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit category' : 'New category'}</DialogTitle>
            <DialogDescription>
              Saving versions the taxonomy and stamps a new effective date — no code
              deployment required.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-3'>
            <div className='grid grid-cols-2 gap-3'>
              <div className='flex flex-col gap-1'>
                <Label className='text-paragraph-sm'>Category name</Label>
                <Input
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </div>
              <div className='flex flex-col gap-1'>
                <Label className='text-paragraph-sm'>Code</Label>
                <Input
                  value={draft.code}
                  onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })}
                />
              </div>
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <div className='flex flex-col gap-1'>
                <Label className='text-paragraph-sm'>Approx. life (months)</Label>
                <Input
                  type='number'
                  min={1}
                  value={draft.approxLifeMonths}
                  onChange={(e) =>
                    setDraft({ ...draft, approxLifeMonths: Number(e.target.value) })
                  }
                />
              </div>
              <div className='mt-5 flex items-center gap-2'>
                <Switch
                  id='cat-maintain'
                  checked={draft.maintainAssetIds}
                  onCheckedChange={(maintainAssetIds) => setDraft({ ...draft, maintainAssetIds })}
                />
                <Label htmlFor='cat-maintain' className='text-paragraph-sm'>
                  Maintain asset id(s)
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
