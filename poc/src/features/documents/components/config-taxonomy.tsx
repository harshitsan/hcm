import { useState } from 'react'
import { ArrowDown, ArrowUp, Check, PencilSimple, Plus } from 'phosphor-react'
import { ROLES } from '@/context/role-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  type DocumentSettingsStore,
  type PermissionKind,
} from '../hooks/use-document-settings'

const PERMISSION_KINDS: PermissionKind[] = ['view', 'download', 'upload']

interface ConfigTaxonomyProps {
  settings: DocumentSettingsStore
}

/**
 * Company Admin governed config: the per-tenant category taxonomy (DOC-16 —
 * add / rename / retire / reorder, versioned and effective-dated) and the
 * role-based access matrix mapping view / download / upload rights per
 * category (DOC-18).
 */
export function ConfigTaxonomy({ settings }: ConfigTaxonomyProps) {
  const [newCategory, setNewCategory] = useState('')
  const [renaming, setRenaming] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const latestCategoryVersion =
    settings.categoryVersions[settings.categoryVersions.length - 1]
  const latestAccessVersion =
    settings.accessVersions[settings.accessVersions.length - 1]

  const submitAdd = () => {
    const name = newCategory.trim()
    if (!name) return
    settings.addCategory(name)
    setNewCategory('')
  }

  return (
    <>
      <Card className='gap-3 border-none bg-white py-4'>
        <CardHeader className='px-4'>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            Category taxonomy (tenant-scoped, versioned)
          </CardTitle>
          <p className='text-paragraph-sm text-neutral-1000'>
            v{latestCategoryVersion.version} · effective{' '}
            {latestCategoryVersion.effectiveFrom} · {latestCategoryVersion.note}
            . Retired categories stay on existing documents but are no longer
            offered for new uploads.
          </p>
        </CardHeader>
        <CardContent className='space-y-2 px-4'>
          <div className='flex items-center gap-2'>
            <Input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder='New category name'
              className='h-7 w-[220px]'
              onKeyDown={(e) => e.key === 'Enter' && submitAdd()}
            />
            <Button className='h-7 gap-1 px-2' onClick={submitAdd}>
              <Plus size={12} weight='bold' />
              Add
            </Button>
          </div>
          {settings.categories.map((category, index) => (
            <div
              key={category.name}
              className='border-grey-200 flex items-center gap-2 rounded-[6px] border px-3 py-1.5'
            >
              <div className='flex items-center gap-1'>
                <Button
                  variant='icon'
                  aria-label='Move up'
                  disabled={index === 0}
                  onClick={() => settings.moveCategory(category.name, -1)}
                >
                  <ArrowUp size={12} />
                </Button>
                <Button
                  variant='icon'
                  aria-label='Move down'
                  disabled={index === settings.categories.length - 1}
                  onClick={() => settings.moveCategory(category.name, 1)}
                >
                  <ArrowDown size={12} />
                </Button>
              </div>
              {renaming === category.name ? (
                <div className='flex flex-1 items-center gap-2'>
                  <Input
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    className='h-6 w-[200px]'
                  />
                  <Button
                    variant='icon'
                    aria-label='Confirm rename'
                    onClick={() => {
                      if (renameValue.trim()) {
                        settings.renameCategory(
                          category.name,
                          renameValue.trim()
                        )
                      }
                      setRenaming(null)
                    }}
                  >
                    <Check size={14} weight='bold' />
                  </Button>
                </div>
              ) : (
                <div className='flex flex-1 items-center gap-2'>
                  <span
                    className={`text-sm font-medium ${category.retired ? 'text-neutral-1000 line-through' : 'text-neutral-1600'}`}
                  >
                    {category.name}
                  </span>
                  {category.retired && (
                    <Badge variant='badge_inactive'>Retired</Badge>
                  )}
                  <Button
                    variant='icon'
                    aria-label='Rename'
                    onClick={() => {
                      setRenaming(category.name)
                      setRenameValue(category.name)
                    }}
                  >
                    <PencilSimple size={14} />
                  </Button>
                </div>
              )}
              <div className='flex items-center gap-2'>
                <span className='text-paragraph-sm text-neutral-1000'>
                  {category.retired ? 'Retired' : 'Active'}
                </span>
                <Switch
                  checked={!category.retired}
                  onCheckedChange={() => settings.toggleRetired(category.name)}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className='gap-3 border-none bg-white py-4'>
        <CardHeader className='px-4'>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            Role-based access matrix (per category)
          </CardTitle>
          <p className='text-paragraph-sm text-neutral-1000'>
            v{latestAccessVersion.version} · effective{' '}
            {latestAccessVersion.effectiveFrom}. Click a role to toggle its
            permission — the access-control check reads this config, combined
            with tenant isolation.
          </p>
        </CardHeader>
        <CardContent className='space-y-3 px-4'>
          {settings.activeCategories.map((category) => {
            const perms = settings.permsFor(category)
            return (
              <div
                key={category}
                className='border-grey-200 rounded-[6px] border px-3 py-2'
              >
                <p className='text-neutral-1600 mb-1 text-sm font-medium'>
                  {category}
                </p>
                {PERMISSION_KINDS.map((kind) => (
                  <div key={kind} className='mb-1 flex items-center gap-2'>
                    <span className='text-paragraph-sm text-neutral-1000 w-[70px] capitalize'>
                      {kind}
                    </span>
                    <div className='flex flex-wrap gap-1'>
                      {ROLES.map((role) => {
                        const granted = perms[kind].includes(role)
                        return (
                          <button
                            key={role}
                            type='button'
                            onClick={() =>
                              settings.togglePermission(category, kind, role)
                            }
                            title={
                              granted
                                ? 'Granted — click to revoke'
                                : 'Not granted — click to grant'
                            }
                          >
                            <Badge variant={granted ? 'open' : 'pending'}>
                              {role}
                            </Badge>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </CardContent>
      </Card>
    </>
  )
}
