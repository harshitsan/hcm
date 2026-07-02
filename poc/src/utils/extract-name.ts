export default function extractNames(input: string): string[] {
  return input
    .split(',')
    .map((part) => part.split('-')[0].trim())
    .filter(Boolean)
}
