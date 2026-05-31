'use client'

import { useMemo } from 'react'

/**
 * String matcher hook — drop-in for the previous Base UI `useAutocompleteFilter`.
 *
 * The project's command/autocomplete consumers only ever used this hook (the rich
 * Base UI Autocomplete primitive surface was internal to command.tsx, which is now
 * self-contained). It returns `contains`/`startsWith` matchers that respect a
 * `sensitivity` option ('base'/'accent' → case- and accent-insensitive).
 *
 * Usage: const filter = useAutocompleteFilter({ sensitivity: 'base' })
 *        filter.contains(item, query, (i) => `${i.command} ${i.description}`)
 */
export function useAutocompleteFilter(options?: {
  sensitivity?: 'base' | 'accent' | 'case' | 'variant'
}) {
  const sensitivity = options?.sensitivity
  return useMemo(() => {
    const norm = (s: string) => {
      let r = s.toLowerCase()
      if (!sensitivity || sensitivity === 'base' || sensitivity === 'accent') {
        r = r.normalize('NFD').replace(/\p{Diacritic}/gu, '')
      }
      return r
    }
    return {
      contains<T>(
        item: T,
        query: string,
        itemToString?: (i: T) => string,
      ): boolean {
        const text = itemToString ? itemToString(item) : String(item)
        return norm(text).includes(norm(query))
      },
      startsWith<T>(
        item: T,
        query: string,
        itemToString?: (i: T) => string,
      ): boolean {
        const text = itemToString ? itemToString(item) : String(item)
        return norm(text).startsWith(norm(query))
      },
    }
  }, [sensitivity])
}
