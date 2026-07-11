import { useMemo, useState } from 'react'
import { useRole } from '@/context/role-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { type Department } from '../data/org-model'
import { type OrgModelStore } from '../hooks/use-org-model'
import { MiniTable, SectionCard, ToneBadge } from './shared'

const ROOT = 'root'

function flattenTree(
  departments: Department[]
): { dept: Department; depth: number }[] {
  const out: { dept: Department; depth: number }[] = []
  const walk = (parentId: string | null, depth: number) => {
    departments
      .filter((d) => d.parentId === parentId)
      .forEach((d) => {
        out.push({ dept: d, depth })
        walk(d.id, depth + 1)
      })
  }
  walk(null, 0)
  return out
}

/** N-level department hierarchy + positions bound to one department each
 * (SYS-22, 45, 46, 50). */
export function OrgStructureCards({ store }: { store: OrgModelStore }) {
  const { hasRole } = useRole()
  const canEdit = hasRole('Company Admin', 'Platform Admin')
  const tree = useMemo(() => flattenTree(store.departments), [store.departments])

  const [deptName, setDeptName] = useState('')
  const [deptParent, setDeptParent] = useState(ROOT)
  const [posTitle, setPosTitle] = useState('')
  const [posDept, setPosDept] = useState('')

  const deptName4 = (id: string) =>
    store.departments.find((d) => d.id === id)?.name ?? id

  return (
    <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
      <SectionCard
        title={`Departments — n-level hierarchy (${store.departments.length})`}
        description='Arbitrary nesting depth; moves preserve sub-trees and cycles are rejected'
        className='mb-0'
      >
        <ul className='border-gray-200 rounded-[6px] border p-3'>
          {tree.map(({ dept, depth }) => (
            <li
              key={dept.id}
              className='flex items-center gap-2 py-1 text-sm'
              style={{ paddingLeft: `${depth * 20}px` }}
            >
              <span className='text-neutral-1000'>{depth > 0 ? '└' : '•'}</span>
              <span className={depth === 0 ? 'font-medium' : ''}>
                {dept.name}
              </span>
              <span className='text-paragraph-sm text-neutral-1000'>
                L{depth + 1}
              </span>
            </li>
          ))}
        </ul>
        {canEdit && (
          <div className='mt-3 flex flex-wrap items-center gap-2'>
            <Input
              placeholder='New department name'
              value={deptName}
              onChange={(e) => setDeptName(e.target.value)}
              className='h-8 w-[190px]'
            />
            <Select value={deptParent} onValueChange={setDeptParent}>
              <SelectTrigger className='h-8 w-[210px] bg-white'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ROOT}>Root (no parent)</SelectItem>
                {tree.map(({ dept, depth }) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {`${'— '.repeat(depth)}${dept.name}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              className='h-8'
              disabled={deptName.trim().length < 2}
              onClick={() => {
                store.addDepartment(
                  deptName.trim(),
                  deptParent === ROOT ? null : deptParent
                )
                setDeptName('')
              }}
            >
              Add department
            </Button>
          </div>
        )}
      </SectionCard>

      <SectionCard
        title={`Positions (${store.positions.length})`}
        description='Each position belongs to exactly one department — multi-department positions are rejected'
        className='mb-0'
      >
        <MiniTable
          headers={['Position', 'Department (exactly one)', 'Holders']}
          rows={store.positions.map((p) => [
            <span key='t' className='font-medium'>{p.title}</span>,
            <ToneBadge key='d' tone='blue'>{deptName4(p.departmentId)}</ToneBadge>,
            p.holders,
          ])}
        />
        {canEdit && (
          <div className='mt-3 flex flex-wrap items-center gap-2'>
            <Input
              placeholder='New position title'
              value={posTitle}
              onChange={(e) => setPosTitle(e.target.value)}
              className='h-8 w-[190px]'
            />
            <Select value={posDept} onValueChange={setPosDept}>
              <SelectTrigger className='h-8 w-[210px] bg-white'>
                <SelectValue placeholder='Department (single)' />
              </SelectTrigger>
              <SelectContent>
                {store.departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              className='h-8'
              disabled={posTitle.trim().length < 2 || posDept === ''}
              onClick={() => {
                store.addPosition(posTitle.trim(), posDept)
                setPosTitle('')
                setPosDept('')
              }}
            >
              Add position
            </Button>
          </div>
        )}
      </SectionCard>

      <SectionCard
        title={`Locations (${store.locations.length})`}
        description='Company-specific by default; shareable only via approved group-company relationships'
        className='mb-0 lg:col-span-2'
      >
        <MiniTable
          headers={['Location', 'City', 'Group sharing', '']}
          rows={store.locations.map((l) => [
            <span key='n' className='font-medium'>{l.name}</span>,
            l.city,
            <ToneBadge key='s' tone={l.sharedWithGroup ? 'green' : 'grey'}>
              {l.sharedWithGroup ? 'Shared with group' : 'Company-specific'}
            </ToneBadge>,
            <div key='a' className='flex justify-end'>
              {canEdit && !l.sharedWithGroup && (
                <Button
                  variant='outline'
                  className='h-7 px-2 text-xs'
                  onClick={() => store.requestLocationSharing(l.id)}
                >
                  Request group sharing
                </Button>
              )}
            </div>,
          ])}
        />
      </SectionCard>
    </div>
  )
}
