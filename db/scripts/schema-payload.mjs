import fs from 'node:fs'
import prismaInternals from '@prisma/internals'

const { getDMMF } = prismaInternals

const DOC_SCHEMA_RE = /^([a-z]+)\.([a-z0-9_]+)\b/

export async function extractPayload(schemaPath) {
  const datamodel = fs.readFileSync(schemaPath, 'utf8')
  const dmmf = await getDMMF({ datamodel })
  const schemaAttrByModel = parseSchemaAttributes(datamodel)

  const models = {}
  const edges = []
  const seenEdges = new Set()

  for (const m of dmmf.datamodel.models) {
    const doc = (m.documentation || '').trim()
    const docMatch = doc.match(DOC_SCHEMA_RE)
    const pgSchema = m.schema || (docMatch && docMatch[1]) || schemaAttrByModel[m.name] || '?'
    const tableName = m.dbName || (docMatch && docMatch[2]) || m.name
    const pkFields = new Set(m.primaryKey ? m.primaryKey.fields : [])

    const fields = m.fields
      .filter((f) => f.kind === 'scalar' || f.kind === 'enum' || f.kind === 'object')
      .map((f) => ({
        name: f.name,
        col: f.dbName || f.name,
        type: f.type,
        kind: f.kind,
        list: !!f.isList,
        opt: !f.isRequired && !f.isList,
        pk: !!f.isId || pkFields.has(f.name),
        unique: !!f.isUnique,
        fk:
          f.kind === 'object'
            ? f.relationFromFields && f.relationFromFields.length
              ? { target: f.type, from: [...f.relationFromFields], to: [...(f.relationToFields || [])] }
              : { target: f.type }
            : null,
        def: f.hasDefaultValue ? formatDefault(f.default) : null,
        doc: (f.documentation || '').trim() || null,
      }))

    models[m.name] = { name: m.name, pgSchema, tableName, doc: doc || null, fields }

    for (const f of m.fields) {
      if (f.kind === 'object' && f.relationFromFields && f.relationFromFields.length) {
        const k = m.name + '->' + f.type + ':' + f.name
        if (!seenEdges.has(k)) {
          seenEdges.add(k)
          edges.push({ from: m.name, to: f.type, label: f.name })
        }
      }
    }
  }

  const groups = {}
  for (const m of Object.values(models)) {
    ;(groups[m.pgSchema] ||= []).push(m.name)
  }
  const schemas = Object.keys(groups)
    .sort()
    .map((name) => ({ name, models: groups[name].sort() }))

  return { modelCount: Object.keys(models).length, schemas, models, edges }
}

function formatDefault(d) {
  if (d && typeof d === 'object' && !Array.isArray(d) && 'name' in d) {
    return d.name + '(' + (d.args || []).join(', ') + ')'
  }
  return JSON.stringify(d)
}

// Fallback for DMMF versions that do not expose model.schema: scan the schema
// text for @@schema("x") inside each model block.
function parseSchemaAttributes(text) {
  const out = {}
  let current = null
  for (const line of text.split('\n')) {
    const modelMatch = line.match(/^model\s+(\w+)\s/)
    if (modelMatch) current = modelMatch[1]
    const attr = line.match(/@@schema\("(\w+)"\)/)
    if (attr && current) out[current] = attr[1]
  }
  return out
}
