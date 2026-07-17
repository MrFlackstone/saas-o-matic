// Testing Library solo auto-limpia cuando vitest corre con `globals: true`;
// aquí los helpers se importan explícitamente, así que el cleanup es manual.
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(cleanup)

// jsdom no implementa ResizeObserver y el slider de Radix lo exige al montar.
// El stub basta: los tests afirman sobre valores, no sobre la geometría del thumb.
globalThis.ResizeObserver ??= class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
