// Réplica estática de la lista sembrada en backend (RN-02): el alta necesita
// las opciones antes de cualquier llamada; el servidor sigue siendo la autoridad.
export interface CountryOption {
  code: string
  name: string
}

export const COUNTRIES: readonly CountryOption[] = [
  { code: 'ES', name: 'España' },
  { code: 'PT', name: 'Portugal' },
  { code: 'FR', name: 'Francia' },
  { code: 'DE', name: 'Alemania' },
  { code: 'IT', name: 'Italia' },
  { code: 'NL', name: 'Países Bajos' },
  { code: 'BE', name: 'Bélgica' },
  { code: 'IE', name: 'Irlanda' },
  { code: 'GB', name: 'Reino Unido' },
  { code: 'US', name: 'Estados Unidos' },
]

export interface PlanOption {
  code: string
  name: string
}

export const PLANS: readonly PlanOption[] = [
  { code: 'STARTER', name: 'Starter' },
  { code: 'PRO', name: 'Pro' },
  { code: 'ENTERPRISE', name: 'Enterprise' },
]

// Bandera emoji a partir del código ISO-3166 (indicadores regionales Unicode).
export function countryFlag(code: string): string {
  return code
    .toUpperCase()
    .replace(/[A-Z]/g, (letter) =>
      String.fromCodePoint(0x1f1e6 + letter.charCodeAt(0) - 65),
    )
}
