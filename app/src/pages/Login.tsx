import { useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ReactFlow, Background, Controls, Panel, Handle, Position,
  type Node, type Edge, type NodeProps,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import dagre from 'dagre'
import { Building2, Layers, Check } from 'lucide-react'
import { useApp } from '../app/store'
import { personas, ROLE_LABELS, companies, groups, portfolios } from '../data/mock'
import { Avatar, Badge } from '../components/ui'
import { cn } from '../lib/cn'

const MANAGER_OF: Record<string, string> = { pf1: 'p2', pf2: 'p6' }

type RFData = {
  personaId?: string
  companyId?: string
  groupId?: string
  tier?: string
  roleText?: string
  hasParent?: boolean
  hasChildren?: boolean
}

// Inline style so the connector handles are ALWAYS the green bar (never React Flow's dark default).
const handleStyle = { width: 36, height: 6, minWidth: 0, border: 'none', borderRadius: 9999, background: 'rgb(var(--accent))' }

/* ---------------- custom nodes ---------------- */
function PersonaNode({ data }: NodeProps) {
  const d = data as RFData
  const p = personas.find((x) => x.id === d.personaId)!
  return (
    <div className="group flex w-[224px] items-center gap-2.5 rounded-xl border border-border bg-surface px-3 py-2.5 shadow-card transition-colors hover:border-primary/60">
      {d.hasParent && <Handle type="target" position={Position.Top} style={handleStyle} />}
      <Avatar name={p.name} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-bold leading-tight">{p.name}</p>
        <p className="truncate text-2xs text-muted-fg">{d.roleText ?? ROLE_LABELS[p.role]}</p>
      </div>
      <Badge tone="primary">{d.tier}</Badge>
      {d.hasChildren && <Handle type="source" position={Position.Bottom} style={handleStyle} />}
    </div>
  )
}

function GroupNode({ data }: NodeProps) {
  const d = data as RFData
  const g = groups.find((x) => x.id === d.groupId)!
  return (
    <div className="flex w-[224px] items-center gap-2.5 rounded-xl border border-dashed border-border bg-surface2/70 px-3 py-2.5 shadow-card">
      {d.hasParent && <Handle type="target" position={Position.Top} style={handleStyle} />}
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
        <Layers className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-bold leading-tight">{g.name}</p>
        <p className="truncate text-2xs text-muted-fg">{g.type} · {g.companyIds.length} companies</p>
        {g.sharingEnabled && (
          <p className="mt-0.5 flex items-center gap-1 text-2xs font-semibold text-success">
            <Check className="h-3 w-3" /> Cross-company sharing on
          </p>
        )}
      </div>
      <Badge tone="accent">Group</Badge>
      {d.hasChildren && <Handle type="source" position={Position.Bottom} style={handleStyle} />}
    </div>
  )
}

function CompanyNode({ data }: NodeProps) {
  const d = data as RFData
  const c = companies.find((x) => x.id === d.companyId)!
  const tone = c.status === 'Active' ? 'success' : c.status === 'Suspended' ? 'warning' : 'neutral'
  return (
    <div className="group flex w-[224px] items-center gap-2.5 rounded-xl border border-border bg-surface px-3 py-2.5 shadow-card transition-colors hover:border-primary/60">
      {d.hasParent && <Handle type="target" position={Position.Top} style={handleStyle} />}
      <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-2xs font-bold text-white', c.color)}>
        {c.initials}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-bold leading-tight">{c.name}</p>
        <p className="tnum truncate text-2xs text-muted-fg">{c.employees} employees</p>
      </div>
      <Badge tone={tone} dot>{c.status}</Badge>
      {d.hasChildren && <Handle type="source" position={Position.Bottom} style={handleStyle} />}
    </div>
  )
}

const nodeTypes = { persona: PersonaNode, group: GroupNode, company: CompanyNode }

/* ---------------- graph construction ---------------- */
const NODE_W = 240
const NODE_H = 66

function buildGraph() {
  const nodes: Node[] = []
  const edges: Edge[] = []
  const add = (id: string, type: string, data: RFData) => nodes.push({ id, type, position: { x: 0, y: 0 }, data })
  const link = (source: string, target: string) => edges.push({ id: `${source}->${target}`, source, target })

  // Platform (root)
  add('p1', 'persona', { personaId: 'p1', tier: 'Platform' })

  // Portfolios → groups → companies, + standalone companies in the portfolio
  portfolios.forEach((pf) => {
    const mgr = MANAGER_OF[pf.id]
    add(mgr, 'persona', { personaId: mgr, tier: 'Portfolio' })
    link('p1', mgr)
    const cos = companies.filter((c) => c.portfolioId === pf.id)
    const gids = [...new Set(cos.filter((c) => c.groupId).map((c) => c.groupId!))]
    gids.forEach((gid) => {
      add(gid, 'group', { groupId: gid })
      link(mgr, gid)
      cos.filter((c) => c.groupId === gid).forEach((c) => {
        add(c.id, 'company', { companyId: c.id })
        link(gid, c.id)
      })
    })
    cos.filter((c) => !c.groupId).forEach((c) => {
      add(c.id, 'company', { companyId: c.id })
      link(mgr, c.id)
    })
  })

  // Standalone companies directly under the platform (no portfolio)
  companies.filter((c) => !c.portfolioId).forEach((c) => {
    add(c.id, 'company', { companyId: c.id })
    link('p1', c.id)
  })

  // People inside Kensium Pvt Ltd (c1). Rohan (p7) is an employee here who ALSO runs
  // the portfolio — the "portfolio manager is part of the company" case (User ≠ Employee).
  const people: { id: string; tier: string; roleText?: string }[] = [
    { id: 'p3', tier: 'Company' },
    { id: 'p4', tier: 'Manager' },
    { id: 'p5', tier: 'Employee' },
    { id: 'p7', tier: 'Dual role', roleText: 'Group HR Lead · also portfolio mgr' },
  ]
  people.forEach((pp) => {
    add(pp.id, 'persona', { personaId: pp.id, tier: pp.tier, roleText: pp.roleText })
    link('c1', pp.id)
  })

  // mark which nodes have a parent / children (to render only the needed handles)
  const sources = new Set(edges.map((e) => e.source))
  const targets = new Set(edges.map((e) => e.target))
  nodes.forEach((n) => {
    const d = n.data as RFData
    d.hasParent = targets.has(n.id)
    d.hasChildren = sources.has(n.id)
  })

  return { nodes, edges }
}

function layout(nodes: Node[], edges: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'TB', nodesep: 26, ranksep: 52 })
  nodes.forEach((n) => g.setNode(n.id, { width: NODE_W, height: NODE_H }))
  edges.forEach((e) => g.setEdge(e.source, e.target))
  dagre.layout(g)
  return nodes.map((n) => {
    const p = g.node(n.id)
    return {
      ...n,
      position: { x: p.x - NODE_W / 2, y: p.y - NODE_H / 2 },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    }
  })
}

export default function Login() {
  const { loginAs, setCompanyId, theme } = useApp()
  const navigate = useNavigate()

  const { nodes, edges } = useMemo(() => {
    const built = buildGraph()
    return { nodes: layout(built.nodes, built.edges), edges: built.edges }
  }, [])

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const d = node.data as RFData
      if (d.personaId) {
        loginAs(d.personaId)
        navigate('/')
      } else if (d.companyId) {
        const c = companies.find((x) => x.id === d.companyId)
        if (c) {
          loginAs(c.portfolioId ? MANAGER_OF[c.portfolioId] : 'p1')
          setCompanyId(c.id)
          navigate('/')
        }
      }
    },
    [loginAs, setCompanyId, navigate],
  )

  return (
    <div className="h-dvh w-full bg-bg">
      <ReactFlow
        defaultNodes={nodes}
        defaultEdges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        colorMode={theme}
        fitView
        fitViewOptions={{ padding: 0.18 }}
        minZoom={0.3}
        nodesDraggable={false}
        nodesConnectable={false}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{ type: 'default', style: { stroke: 'rgb(148 163 184 / 0.55)', strokeWidth: 1.5 } }}
      >
        <Background gap={22} size={1} color="rgb(148 163 184 / 0.25)" />
        <Controls showInteractive={false} />
        <Panel position="top-left">
          <div className="flex items-center gap-2.5 rounded-xl border border-border bg-surface/90 px-3 py-2 shadow-card backdrop-blur">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-primary-fg">
              <Building2 className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-extrabold leading-tight tracking-tight">SatelliteHR</p>
              <p className="text-2xs text-muted-fg">Tap a person to log in · tap a company to enter it</p>
            </div>
          </div>
        </Panel>
        <Panel position="bottom-center">
          <p className="rounded-full border border-border bg-surface/80 px-3 py-1 text-2xs text-muted-fg shadow-card backdrop-blur">
            Platform → Portfolio → Group Company → Company → people · drag to pan, scroll to zoom
          </p>
        </Panel>
      </ReactFlow>
    </div>
  )
}
