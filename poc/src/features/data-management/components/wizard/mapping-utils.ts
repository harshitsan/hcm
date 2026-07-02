import { type ImportFunction } from '../../data/catalog'
import { type MappingTemplate } from '../../data/mappings'
import { toSourceColumn } from './schema'

export function targetFieldsFor(fn: ImportFunction): string[] {
  return [...fn.requiredFields, ...fn.fields, ...fn.customFields]
}

export function defaultColumnMap(
  fn: ImportFunction,
  template?: MappingTemplate
): Record<string, string> {
  if (template) return { ...template.columnMap }
  const map: Record<string, string> = {}
  for (const field of [...fn.requiredFields, ...fn.fields]) {
    map[toSourceColumn(field)] = field
  }
  for (const field of fn.customFields) {
    map[toSourceColumn(field)] = ''
  }
  return map
}

export function missingRequiredFields(
  fn: ImportFunction,
  columnMap: Record<string, string>
): string[] {
  const mapped = new Set(Object.values(columnMap))
  return fn.requiredFields.filter((f) => !mapped.has(f))
}
