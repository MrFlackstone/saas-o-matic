export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('es-ES')
}

export function formatDateTime(isoDate: string): string {
  return new Date(isoDate).toLocaleString('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}
