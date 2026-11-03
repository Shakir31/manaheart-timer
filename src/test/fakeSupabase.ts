// A minimal stand-in for the Supabase query builder. Records every call so tests can
// assert what was sent, and resolves with whatever the test queued for that table.
import { vi } from 'vitest'

export interface Call {
  table: string
  method: string
  args: unknown[]
}

type Result = { data: unknown; error: unknown }

export function createFakeSupabase() {
  const calls: Call[] = []
  const queues = new Map<string, Result[]>()

  const respond = (table: string, ...results: Result[]) => {
    queues.set(table, [...(queues.get(table) ?? []), ...results])
  }

  const from = vi.fn((table: string) => {
    const builder: Record<string, unknown> = {}
    for (const method of ['select', 'insert', 'update', 'delete', 'eq', 'order', 'range', 'single']) {
      builder[method] = (...args: unknown[]) => {
        calls.push({ table, method, args })
        return builder
      }
    }
    builder.then = (resolve: (r: Result) => unknown, reject: (e: unknown) => unknown) => {
      const next = queues.get(table)?.shift() ?? { data: null, error: null }
      return Promise.resolve(next).then(resolve, reject)
    }
    return builder
  })

  return { client: { from }, calls, respond }
}
