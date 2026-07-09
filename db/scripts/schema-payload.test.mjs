import test from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { extractPayload } from './schema-payload.mjs'

const schemaPath = fileURLToPath(new URL('../prisma/schema.prisma', import.meta.url))
const payload = await extractPayload(schemaPath)

test('extracts all 212 models', () => {
  assert.equal(payload.modelCount, 212)
  assert.equal(Object.keys(payload.models).length, 212)
})

test('groups models into the 15 postgres schemas', () => {
  assert.deepEqual(
    payload.schemas.map((s) => s.name),
    ['api', 'ben', 'cases', 'comp', 'core', 'eng', 'insight', 'ops', 'org', 'people', 'perf', 'stat', 'talent', 'tm', 'vnd']
  )
})

test('every model resolved to a known pg schema', () => {
  for (const m of Object.values(payload.models)) {
    assert.notEqual(m.pgSchema, '?', m.name + ' has unresolved pg schema')
  }
})

test('ApiContractVersion carries mapped column names and doc comments', () => {
  const m = payload.models.ApiContractVersion
  assert.ok(m, 'ApiContractVersion missing')
  assert.equal(m.pgSchema, 'api')
  assert.equal(m.tableName, 'api_contract_version')
  const f = m.fields.find((f) => f.name === 'openapiStorageKey')
  assert.equal(f.col, 'openapi_storage_key')
  const status = m.fields.find((f) => f.name === 'status')
  assert.match(status.doc || '', /current/)
})

test('relation edges are directed, deduped, and point at real models', () => {
  assert.ok(payload.edges.length > 100, 'expected a well-connected schema')
  const keys = new Set()
  for (const e of payload.edges) {
    assert.ok(payload.models[e.from], e.from + ' missing')
    assert.ok(payload.models[e.to], e.to + ' missing')
    const k = e.from + '->' + e.to + ':' + e.label
    assert.ok(!keys.has(k), 'duplicate edge ' + k)
    keys.add(k)
  }
})
