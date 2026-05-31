'use client'

import { Tooltip } from 'radix-ui'
import { cn, renderChild } from '@/lib/utils'

function TooltipProvider({ children }: { children: React.ReactNode }) {
  return (
    <Tooltip.Provider delayDuration={0} skipDelayDuration={0}>
      {children}
    </Tooltip.Provider>
  )
}

type TooltipRootProps = React.ComponentProps<typeof Tooltip.Root>

function TooltipRoot({ children, ...props }: TooltipRootProps) {
  return <Tooltip.Root {...props}>{children}</Tooltip.Root>
}

type TooltipTriggerProps = React.ComponentProps<typeof Tooltip.Trigger> & {
  render?: React.ReactElement
}

function TooltipTrigger({
  className,
  render,
  asChild,
  children,
  ...props
}: TooltipTriggerProps) {
  return (
    <Tooltip.Trigger
      className={cn(className)}
      asChild={!!render || asChild}
      {...props}
    >
      {renderChild(render, children)}
    </Tooltip.Trigger>
  )
}

type TooltipContentProps = {
  className?: string
  side?: 'top' | 'bottom' | 'left' | 'right'
  sideOffset?: number
  children: React.ReactNode
}

function TooltipContent({
  className,
  side = 'top',
  sideOffset = 4,
  children,
}: TooltipContentProps) {
  return (
    <Tooltip.Portal>
      <Tooltip.Content
        side={side}
        sideOffset={sideOffset}
        className={cn(
          'z-50 rounded-md px-2 py-1 text-xs shadow-lg',
          'origin-(--radix-tooltip-content-transform-origin)',
          className,
        )}
        style={{
          background: 'color-mix(in srgb, var(--theme-card) 80%, transparent)',
          color: 'var(--theme-text)',
          border:
            '1px solid color-mix(in srgb, var(--theme-border) 70%, transparent)',
          backdropFilter: 'blur(18px) saturate(140%)',
          WebkitBackdropFilter: 'blur(18px) saturate(140%)',
        }}
      >
        {children}
      </Tooltip.Content>
    </Tooltip.Portal>
  )
}

export { TooltipProvider, TooltipRoot, TooltipTrigger, TooltipContent }
