import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { cloneElement, isValidElement } from 'react'
import type { ClassValue } from 'clsx'
import type { ReactElement, ReactNode } from 'react'

export function cn(...inputs: Array<ClassValue>) {
  return twMerge(clsx(inputs))
}

/**
 * Back-compat for the previous Base UI `render={<El/>}` polymorphism on top of
 * Radix's `asChild`. Returns the element to place inside a Radix part rendered
 * with `asChild`: when `render` is given, it becomes the slotted child (with the
 * caller's `children` injected if the render element has none); otherwise the
 * plain `children` are returned. Pair with `asChild={!!render || asChild}`.
 */
export function renderChild(
  render: ReactElement | undefined,
  children: ReactNode,
): ReactNode {
  if (render && isValidElement(render)) {
    const r = render as ReactElement<{ children?: ReactNode }>
    return cloneElement(r, undefined, r.props.children ?? children)
  }
  return children
}
