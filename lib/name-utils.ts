/** Regla aprobada (plan de unificación): ÚLTIMA palabra = apellido. */
export function splitFullName(fullNameInput: string): {
  firstName: string
  lastName: string
} {
  const trimmed = String(fullNameInput ?? '').trim().replace(/\s+/g, ' ')
  if (!trimmed) return { firstName: '', lastName: '' }
  const words = trimmed.split(' ')
  if (words.length === 1) return { firstName: words[0], lastName: '' }
  return {
    firstName: words.slice(0, -1).join(' '),
    lastName: words[words.length - 1],
  }
}

export function fullNameOf(person: { firstName: string; lastName: string }): string {
  return `${person.firstName} ${person.lastName}`.trim()
}
