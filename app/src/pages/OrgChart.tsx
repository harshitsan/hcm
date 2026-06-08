import { useEffect, useMemo, useState } from 'react'
import {
  ReactFlow, Background, Controls, useNodesState, useEdgesState, Handle, Position,
  type Node, type Edge, type NodeProps,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import dagre from 'dagre'
import { Network, Users, Search } from 'lucide-react'
import { useApp } from '../app/store'
import { useCompanyData } from '../data/companyData'
import type { Employee } from '../data/mock'
import {
  Avatar, Badge, Card, CardBody, Input, PageHeader, Segmented, useToast,
} from '../components/ui'
import { cn } from '../lib/cn'

type View = 'people' | 'departments'

const accentHandle = '!h-1.5 !w-9 !min-w-0 !rounded-full !border-0 !bg-accent'

const statusTone = (s: Employee['status']): 'success' | 'info' | 'warning' | 'accent' =>
  s === 'Active' ? 'success' : s === 'On Leave' ? 'info' : s === 'Probation' ? 'warning' : 'accent'

type EData = {
  name: string
  title: string
  dept: string
  status: Employee['status']
  reports: number
  hasParent: boolean
  hasChildren: boolean
  match: boolean
}

function EmployeeNode({ data }: NodeProps) {
  const d = data as EData
  return (
    <div
      className={cn(
        'group w-[220px] rounded-xl border bg-surface px-3 py-2.5 shadow-card transition-colors',
        d.match ? 'border-primary ring-2 ring-primary/40' : 'border-border hover:border-primary/50',
      )}
    >
      {d.hasParent && <Handle type="target" position={Position.Top} className={accentHandle} />}
      <div className="flex items-center gap-2.5">
        <Avatar name={d.name} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-bold leading-tight">{d.name}</p>
          <p className="truncate text-2xs text-muted-fg">{d.title}</p>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="truncate text-2xs text-muted-fg">{d.dept}</span>
        <div className="flex shrink-0 items-center gap-1.5">
          <Badge tone={statusTone(d.status)}>{d.status}</Badge>
          {d.reports > 0 && <Badge tone="neutral"><Users className="h-3 w-3" />{d.reports}</Badge>}
        </div>
      </div>
      {d.hasChildren && <Handle type="source" position={Position.Bottom} className={accentHandle} />}
    </div>
  )
}

const nodeTypes = { employee: EmployeeNode }

const NODE_W = 240
const NODE_H = 84

function buildAndLayout(
  employees: Employee[],
  deptName: (id: string) => string,
  reportsCount: (id: string) => number,
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = employees.map((e) => ({
    id: e.id,
    type: 'employee',
    position: { x: 0, y: 0 },
    data: {
      name: e.name,
      title: e.title,
      dept: deptName(e.departmentId),
      status: e.status,
      reports: reportsCount(e.id),
      hasParent: !!e.managerId,
      hasChildren: reportsCount(e.id) > 0,
      match: false,
    } as EData,
  }))
  const edges: Edge[] = employees
    .filter((e) => e.managerId)
    .map((e) => ({ id: `${e.managerId}->${e.id}`, source: e.managerId as string, target: e.id }))

  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'TB', nodesep: 28, ranksep: 56 })
  nodes.forEach((n) => g.setNode(n.id, { width: NODE_W, height: NODE_H }))
  edges.forEach((e) => g.setEdge(e.source, e.target))
  dagre.layout(g)
  nodes.forEach((n) => {
    const p = g.node(n.id)
    n.position = { x: p.x - NODE_W / 2, y: p.y - NODE_H / 2 }
  })
  return { nodes, edges }
}

export default function OrgChart() {
  const { employees, departments, getDepartment, reportsOf } = useCompanyData()
  const { company, theme } = useApp()
  const { push } = useToast()
  const [view, setView] = useState<View>('people')
  const [query, setQuery] = useState('')

  const initial = useMemo(
    () => buildAndLayout(employees, (id) => getDepartment(id)?.name ?? '—', (id) => reportsOf(id).length),
    [employees, getDepartment, reportsOf],
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes)
  const [edges, , onEdgesChange] = useEdgesState(initial.edges)

  // highlight nodes matching the search
  useEffect(() => {
    const q = query.trim().toLowerCase()
    setNodes((ns) =>
      ns.map((n) => {
        const d = n.data as EData
        const match = q.length > 0 && (d.name.toLowerCase().includes(q) || d.title.toLowerCase().includes(q))
        return d.match === match ? n : { ...n, data: { ...d, match } }
      }),
    )
  }, [query, setNodes])

  const matchCount = nodes.filter((n) => (n.data as EData).match).length

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Org Chart"
        subtitle={`Reporting structure across ${company.name}.`}
        icon={<Network className="h-5 w-5" />}
        actions={
          <Segmented<View>
            value={view}
            onChange={setView}
            options={[
              { value: 'people', label: 'People' },
              { value: 'departments', label: 'Departments' },
            ]}
          />
        }
      />

      {view === 'people' ? (
        <Card className="overflow-hidden p-0">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <Badge tone="primary" className="tnum">{employees.length} people</Badge>
              {query && <Badge tone={matchCount ? 'success' : 'neutral'} className="tnum">{matchCount} match</Badge>}
            </div>
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-fg" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a person…" className="h-8 pl-8 text-[13px]" />
            </div>
          </div>
          <div className="h-[72vh] w-full bg-surface2/40">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              onNodeClick={(_, node) => {
                const d = node.data as EData
                push({ title: `${d.name} · ${d.title}`, tone: 'info' })
              }}
              colorMode={theme}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              minZoom={0.2}
              nodesDraggable={false}
              nodesConnectable={false}
              proOptions={{ hideAttribution: true }}
              defaultEdgeOptions={{ type: 'default', style: { stroke: 'rgb(148 163 184 / 0.55)', strokeWidth: 1.5 } }}
            >
              <Background gap={22} size={1} color="rgb(148 163 184 / 0.25)" />
              <Controls showInteractive={false} />
            </ReactFlow>
          </div>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((d) => {
            const parent = d.parentId ? getDepartment(d.parentId) : null
            const head = employees.find((e) => e.name === d.head)
            return (
              <Card key={d.id}>
                <CardBody>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold tracking-tight">{d.name}</h3>
                    <Badge tone="primary" className="tnum">{d.headcount}</Badge>
                  </div>
                  {parent && <p className="mt-0.5 text-2xs text-muted-fg">under {parent.name}</p>}
                  <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
                    <Avatar name={d.head} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold">{d.head}</p>
                      <p className="truncate text-2xs text-muted-fg">{head?.title ?? 'Department head'}</p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
