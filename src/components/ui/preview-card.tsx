'use client'

import { HoverCard as HoverCardPrimitive } from 'radix-ui'
import { cn, renderChild } from '@/lib/utils'

const PreviewCard = HoverCardPrimitive.Root

type PreviewCardTriggerProps = React.ComponentProps<
  typeof HoverCardPrimitive.Trigger
> & { render?: React.ReactElement }

function PreviewCardTrigger({
  className,
  render,
  asChild,
  children,
  ...props
}: PreviewCardTriggerProps) {
  return (
    <HoverCardPrimitive.Trigger
      className={cn(className)}
      data-slot="preview-card-trigger"
      asChild={!!render || asChild}
      {...props}
    >
      {renderChild(render, children)}
    </HoverCardPrimitive.Trigger>
  )
}

type PreviewCardPopupProps = React.ComponentProps<
  typeof HoverCardPrimitive.Content
>

function PreviewCardPopup({
  className,
  children,
  align = 'center',
  sideOffset = 6,
  ...props
}: PreviewCardPopupProps) {
  return (
    <HoverCardPrimitive.Portal>
      <HoverCardPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'relative z-50 w-64 origin-(--radix-hover-card-content-transform-origin) rounded-lg p-3 text-sm text-pretty outline shadow-2xs',
          className,
        )}
        data-slot="preview-card-content"
        style={{
          background: 'var(--theme-card)',
          color: 'var(--theme-text)',
          outlineColor: 'var(--theme-border)',
        }}
        {...props}
      >
        {children}
      </HoverCardPrimitive.Content>
    </HoverCardPrimitive.Portal>
  )
}

export {
  PreviewCard,
  PreviewCard as HoverCard,
  PreviewCardTrigger,
  PreviewCardTrigger as HoverCardTrigger,
  PreviewCardPopup,
  PreviewCardPopup as HoverCardContent,
}
