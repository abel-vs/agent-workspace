'use client'

import { Collapsible as CollapsiblePrimitive } from 'radix-ui'
import * as React from 'react'
import { cn } from '@/lib/utils'

function Collapsible(
  props: React.ComponentProps<typeof CollapsiblePrimitive.Root>,
) {
  return <CollapsiblePrimitive.Root {...props} />
}

function CollapsibleTrigger({
  className,
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Trigger>) {
  return (
    <CollapsiblePrimitive.Trigger
      className={cn(
        'group inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-left text-xs font-medium text-[var(--theme-muted)] transition-colors hover:bg-[var(--theme-card2)] hover:text-[var(--theme-text)] data-[state=open]:text-[var(--theme-text)]',
        className,
      )}
      {...props}
    />
  )
}

type CollapsiblePanelProps = React.ComponentProps<
  typeof CollapsiblePrimitive.Content
> & {
  contentClassName?: string
}

function CollapsiblePanel({
  className,
  contentClassName,
  children,
  ...props
}: CollapsiblePanelProps) {
  return (
    <CollapsiblePrimitive.Content
      forceMount
      className={cn(
        'flex flex-col overflow-hidden text-sm transition-all duration-150 ease-out h-[var(--radix-collapsible-content-height)] data-[state=closed]:h-0',
        className,
      )}
      {...props}
    >
      <div className={cn('pt-1', contentClassName)}>{children}</div>
    </CollapsiblePrimitive.Content>
  )
}

export { Collapsible, CollapsibleTrigger, CollapsiblePanel }
