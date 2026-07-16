export const DNI_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE';
export const CIF_LETTERS = 'JABCDEFGHI';

export const DNI_PATTERN = /^\d{8}[A-Z]$/;
export const NIE_PATTERN = /^[XYZ]\d{7}[A-Z]$/;
export const SPECIAL_NIF_PATTERN = /^[KLM]\d{7}[A-Z]$/;
export const CIF_PATTERN = /^[ABCDEFGHJNPQRSUVW]\d{7}[0-9A-J]$/;

const NIE_PREFIX_DIGIT: Record<string, string> = { X: '0', Y: '1', Z: '2' };
const CIF_LETTER_ONLY_PREFIXES = 'PQRSW';
const CIF_DIGIT_ONLY_PREFIXES = 'ABEH';

function controlLetterForNumber(value: number): string {
  return DNI_LETTERS[value % 23];
}

export function isValidDni(candidate: string): boolean {
  const expected = controlLetterForNumber(Number(candidate.slice(0, 8)));
  return candidate[8] === expected;
}

export function isValidNie(candidate: string): boolean {
  const digits = NIE_PREFIX_DIGIT[candidate[0]] + candidate.slice(1, 8);
  const expected = controlLetterForNumber(Number(digits));
  return candidate[8] === expected;
}

export function isValidSpecialNif(candidate: string): boolean {
  const expected = controlLetterForNumber(Number(candidate.slice(1, 8)));
  return candidate[8] === expected;
}

function cifChecksum(digits: string): number {
  let sum = 0;
  for (let index = 0; index < digits.length; index += 1) {
    const digit = Number(digits[index]);
    if (index % 2 === 0) {
      const doubled = digit * 2;
      sum += Math.floor(doubled / 10) + (doubled % 10);
    } else {
      sum += digit;
    }
  }
  return (10 - (sum % 10)) % 10;
}

export function isValidCif(candidate: string): boolean {
  const prefix = candidate[0];
  const control = candidate[8];
  const checksum = cifChecksum(candidate.slice(1, 8));
  const matchesDigit = control === String(checksum);
  const matchesLetter = control === CIF_LETTERS[checksum];
  if (CIF_LETTER_ONLY_PREFIXES.includes(prefix)) {
    return matchesLetter;
  }
  if (CIF_DIGIT_ONLY_PREFIXES.includes(prefix)) {
    return matchesDigit;
  }
  return matchesDigit || matchesLetter;
}
