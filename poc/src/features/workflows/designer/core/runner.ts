import { applyMapping, branchCond, evalCond, evalExpr, interpolate, runCode } from './expr'
import type { Ctx, MappingRow } from './expr'
import { isContainer } from './model'
import type { Branch, Step, WorkflowDoc } from './model'
import { getDef } from './registry'

export type RunEvent = {
  type: 'enter' | 'success' | 'error' | 'log'
  id: string
  message?: string
  data?: unknown
}

class StepFailure extends Error {
  constructor(public stepId: string) { super(`Step ${stepId} failed`) }
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new DOMException('Aborted', 'AbortError'))
    const onAbort = () => { clearTimeout(t); reject(new DOMException('Aborted', 'AbortError')) }
    const t = setTimeout(() => { signal.removeEventListener('abort', onAbort); resolve() }, ms)
    signal.addEventListener('abort', onAbort, { once: true })
  })
}

function parsePayload(doc: WorkflowDoc): unknown {
  const raw = doc.trigger.config.samplePayload
  if (typeof raw !== 'string' || raw.trim() === '') return {}
  try { return JSON.parse(raw) } catch { return {} }
}

export async function runWorkflow(
  doc: WorkflowDoc,
  emit: (e: RunEvent) => void,
  signal: AbortSignal,
  stepDelayMs = 400,
  payloadOverride?: unknown,
): Promise<void> {
  const tick = () => sleep(stepDelayMs, signal)
  const payload = payloadOverride !== undefined ? payloadOverride : parsePayload(doc)
  const vars: Record<string, unknown> = {}

  const fail = (step: Step, message: string): never => {
    emit({ type: 'error', id: step.id, message })
    throw new StepFailure(step.id)
  }

  const unwrap = <T>(step: Step, r: { ok: true; value: T } | { ok: false; error: string }): T =>
    r.ok ? r.value : fail(step, `${step.label}: ${r.error}`)

  /** Runs a leaf step against the context; returns its output. */
  async function runLeaf(step: Step, ctx: Ctx): Promise<unknown> {
    emit({ type: 'enter', id: step.id })
    await tick()
    if (step.config.mockFail === true) fail(step, `${step.label} failed (mock)`)
    let output: unknown = ctx.input
    switch (step.kind) {
      case 'transform': {
        const mode = (step.config.mode as string) ?? 'expression'
        if (mode === 'map') {
          output = applyMapping((step.config.mappings as MappingRow[] | undefined) ?? [], ctx)
        } else if (mode === 'template') {
          output = interpolate(String(step.config.template ?? ''), ctx)
        } else if (mode === 'code') {
          output = unwrap(step, runCode(String(step.config.code ?? ''), ctx))
        } else {
          output = unwrap(step, evalExpr(String(step.config.expression ?? ''), ctx))
        }
        break
      }
      case 'setVariable': {
        const name = String(step.config.name ?? '')
        const valueExpr = String(step.config.value ?? '')
        const value = valueExpr === '' ? undefined : unwrap(step, evalExpr(valueExpr, ctx))
        if (name) vars[name] = value
        output = value
        break
      }
      case 'log': {
        const message = interpolate(String(step.config.message ?? ''), ctx)
        emit({ type: 'log', id: step.id, message: `[${step.config.level ?? 'info'}] ${message}` })
        output = message
        break
      }
      case 'http': {
        // Simulated request: URL is templated against the context, response is a stub
        const url = interpolate(String(step.config.url ?? ''), ctx)
        output = { status: 200, url, method: step.config.method ?? 'GET', body: { simulated: true } }
        break
      }
      case 'delay':
        break
    }
    emit({ type: 'success', id: step.id, data: output })
    return output
  }

  /** Runs a sequence, threading each step's output into the next; returns the last output. */
  async function runSteps(steps: Step[], input: unknown, loop?: { item?: unknown; index?: number }): Promise<unknown> {
    let current = input
    for (const step of steps) {
      if (signal.aborted) throw new DOMException('Aborted', 'AbortError')
      const ctx: Ctx = { payload, input: current, vars, item: loop?.item, index: loop?.index }
      if (!isContainer(step)) { current = await runLeaf(step, ctx); continue }

      emit({ type: 'enter', id: step.id })
      const single = (key: string): Branch | undefined => step.branches.find(b => b.key === key)
      let output: unknown = current
      try {
        switch (step.kind) {
          case 'tryCatch': {
            try {
              output = await runSteps(single('try')?.steps ?? [], current, loop)
            } catch (err) {
              if (!(err instanceof StepFailure)) throw err
              emit({ type: 'log', id: step.id, message: 'Error caught — running Catch' })
              output = await runSteps(single('catch')?.steps ?? [], current, loop)
            } finally {
              await runSteps(single('finally')?.steps ?? [], current, loop)
            }
            break
          }
          case 'ifElse':
          case 'choiceWhen': {
            const mocked = step.branches.find(b => b.config.mockTaken === true)
            const taken = mocked ?? step.branches.find(b => {
              const cond = branchCond(b.config)
              return cond ? evalCond(cond, ctx) : !getDefConditional(step, b)
            })
            if (taken) {
              emit({ type: 'log', id: step.id, message: `Taking branch: ${taken.label}` })
              output = await runSteps(taken.steps, current, loop)
            } else {
              emit({ type: 'log', id: step.id, message: 'No branch matched — skipping' })
            }
            break
          }
          case 'for':
          case 'forEach': {
            let items: unknown[]
            if (step.config.mockIterations !== undefined) {
              items = Array.from({ length: Number(step.config.mockIterations) })
            } else if (step.kind === 'for') {
              items = Array.from({ length: Number(step.config.count ?? 2) })
            } else {
              const r = evalExpr(String(step.config.items ?? ''), ctx)
              if (!r.ok) { fail(step, `${step.label}: ${r.error}`); break }
              if (!Array.isArray(r.value)) { fail(step, `${step.label}: items did not evaluate to an array`); break }
              items = r.value
            }
            const results: unknown[] = []
            for (let i = 0; i < items.length; i++) {
              emit({ type: 'log', id: step.id, message: `Iteration ${i + 1}/${items.length}` })
              results.push(await runSteps(single('body')?.steps ?? [], current, { item: items[i], index: i }))
            }
            output = results
            break
          }
          case 'group': {
            output = await runSteps(single('body')?.steps ?? [], current, loop)
            break
          }
        }
        emit({ type: 'success', id: step.id, data: output })
        current = output
      } catch (err) {
        if (err instanceof StepFailure) { emit({ type: 'error', id: step.id, message: 'Unhandled failure' }); throw err }
        throw err
      }
    }
    return current
  }

  emit({ type: 'enter', id: doc.trigger.id })
  await tick()
  emit({ type: 'success', id: doc.trigger.id, data: payload })
  try {
    await runSteps(doc.body, payload)
    emit({ type: 'log', id: doc.id, message: 'Run completed' })
  } catch (err) {
    if (err instanceof StepFailure) { emit({ type: 'log', id: doc.id, message: 'Run failed' }); return }
    throw err
  }
}

function getDefConditional(step: Step & { kind: string }, branch: Branch): boolean {
  if (!isContainer(step)) return false
  const spec = getDef(step.kind).branchSpec
  const def = spec?.fixed.find(d => d.key === branch.key) ?? spec?.addable?.def
  return def?.conditional === true
}
