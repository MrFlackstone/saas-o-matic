export function normalizeTaxId(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/[\s.-]/g, '')
}
