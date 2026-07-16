// Único punto donde los céntimos se convierten a unidades (spec-frontend):
// la conversión de divisa es presentación pura (RN-03), nunca se persiste.
export function formatMoney(cents: number, currency: string, rate: number): string {
  const amount = (cents / 100) * rate
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(amount)
}
