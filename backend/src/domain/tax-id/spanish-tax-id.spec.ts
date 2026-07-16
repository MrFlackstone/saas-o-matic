import { normalizeTaxId } from './normalize';
import { validateSpanishTaxId } from './validate-spanish-tax-id';

describe('normalizeTaxId', () => {
  it.each([
    ['b58818501', 'B58818501'],
    ['B-5881850-1', 'B58818501'],
    ['  B58818501 ', 'B58818501'],
    ['12.345.678-z', '12345678Z'],
    ['', ''],
    ['   ', ''],
  ])('normaliza %j a %j', (raw, expected) => {
    expect(normalizeTaxId(raw)).toBe(expected);
  });
});

describe('validateSpanishTaxId — fixtures de la spec', () => {
  it.each([
    ['12345678Z', 'DNI'],
    ['00000000T', 'DNI'],
    ['99999999R', 'DNI'],
    ['X1234567L', 'NIE'],
    ['Y7654321G', 'NIE'],
    ['Z0000000M', 'NIE'],
    ['B58818501', 'CIF'],
    ['B12345674', 'CIF'],
    ['Q2818002D', 'CIF'],
  ] as const)('%s es válido con kind %s', (input, kind) => {
    const result = validateSpanishTaxId(input);
    expect(result.valid).toBe(true);
    expect(result.kind).toBe(kind);
    expect(result.reason).toBeUndefined();
  });

  it.each([
    ['12345678A'],
    ['1234567Z'],
    ['X1234567T'],
    ['B58818500'],
    ['Q28180024'],
    ['A5881850J'],
    ['T1234567X'],
  ])('%s es inválido', (input) => {
    const result = validateSpanishTaxId(input);
    expect(result.valid).toBe(false);
    expect(result.reason).toEqual(expect.any(String));
    expect(result.reason).not.toBe('');
  });

  it.each([['b58818501'], ['B-5881850-1'], ['  B58818501 ']])(
    '%j valida tras normalizar',
    (input) => {
      const result = validateSpanishTaxId(input);
      expect(result.valid).toBe(true);
      expect(result.kind).toBe('CIF');
    },
  );
});

describe('validateSpanishTaxId — NIF especiales (K, L, M)', () => {
  // Regla mod 23 sobre los 7 dígitos: 1234567 mod 23 = 19 → L
  it.each([['K1234567L'], ['L1234567L'], ['M1234567L'], ['M0000000T']])(
    '%s es válido con kind NIF_ESPECIAL',
    (input) => {
      const result = validateSpanishTaxId(input);
      expect(result.valid).toBe(true);
      expect(result.kind).toBe('NIF_ESPECIAL');
    },
  );

  it('K1234567A es inválido (letra de control incorrecta)', () => {
    const result = validateSpanishTaxId('K1234567A');
    expect(result.valid).toBe(false);
    expect(result.kind).toBe('NIF_ESPECIAL');
  });
});

describe('validateSpanishTaxId — CIF con control letra u opcional', () => {
  // N tolera dígito o letra: N0032484H → suma 12 → control 8 → H
  it.each([['N0032484H'], ['N00324848']])(
    '%s es válido (inicial N acepta ambos)',
    (input) => {
      expect(validateSpanishTaxId(input).valid).toBe(true);
    },
  );

  it('P2818002D es válido (P exige letra)', () => {
    const result = validateSpanishTaxId('P2818002D');
    expect(result.valid).toBe(true);
    expect(result.kind).toBe('CIF');
  });

  it('A58818501 es válido (A exige dígito)', () => {
    const result = validateSpanishTaxId('A58818501');
    expect(result.valid).toBe(true);
    expect(result.kind).toBe('CIF');
  });
});

describe('validateSpanishTaxId — entradas basura (nunca lanza)', () => {
  const garbage: string[] = [
    '',
    '   ',
    'A'.repeat(300),
    '😀',
    '😀😀😀😀😀😀😀😀😀',
    'null',
    'undefined',
    '\0\n\t',
    '1234567890123456789012345678901234567890',
    '!!!@@@###',
    'ÑÑÑÑÑÑÑÑÑ',
    '一二三四五六七八九',
    '12345678',
    'ABCDEFGHI',
    '12345678ZZ',
    'XX1234567L',
    '9999999999R',
  ];

  it.each(garbage.map((value) => [value]))(
    '%j no lanza y es inválido',
    (input) => {
      let result: ReturnType<typeof validateSpanishTaxId> | undefined;
      expect(() => {
        result = validateSpanishTaxId(input);
      }).not.toThrow();
      expect(result?.valid).toBe(false);
      expect(result?.reason).toEqual(expect.any(String));
    },
  );

  it.each([[null], [undefined], [123], [{}], [['B58818501']]])(
    'entrada no-string %p no lanza y es inválida',
    (input) => {
      const result = validateSpanishTaxId(input);
      expect(result.valid).toBe(false);
      expect(result.kind).toBeUndefined();
      expect(result.reason).toBe('identificador fiscal no es texto');
    },
  );

  it('fuzz de strings aleatorios reproducibles nunca lanza', () => {
    const charset =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .-_😀ñÑ*#';
    let seed = 42;
    const nextInt = (max: number): number => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed % max;
    };
    for (let i = 0; i < 500; i += 1) {
      const length = nextInt(40);
      let value = '';
      for (let j = 0; j < length; j += 1) {
        value += charset[nextInt(charset.length)];
      }
      expect(() => validateSpanishTaxId(value)).not.toThrow();
    }
  });
});
