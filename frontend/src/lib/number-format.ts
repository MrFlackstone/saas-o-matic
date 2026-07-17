// Formato de miles de los inputs del simulador. Son cantidades de consumo
// (usuarios, GB, llamadas), no importes: el dinero se formatea en `money.ts`.
export function formatThousands(value: number): string {
  return value.toLocaleString('es-ES')
}

// Lee un entero de lo que el usuario haya tecleado, tolerando los separadores
// de miles que produce `formatThousands`. Todo lo demás → null: descartar los
// caracteres sobrantes convertiría "1,5" en 15 en vez de rechazarlo.
export function parseIntegerInput(raw: string): number | null {
  const compacted = raw.replace(/[.\s]/g, '')
  if (!/^\d+$/.test(compacted)) {
    return null
  }
  return Number.parseInt(compacted, 10)
}
