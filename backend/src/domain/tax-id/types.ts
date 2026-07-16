export type SpanishTaxIdKind = 'DNI' | 'NIE' | 'CIF' | 'NIF_ESPECIAL';

export interface TaxIdValidationResult {
  valid: boolean;
  kind?: SpanishTaxIdKind;
  reason?: string;
}
