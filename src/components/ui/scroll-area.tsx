'use client'

import { ScrollArea } from 'radix-ui'
import { cn } from '@/lib/utils'

type ScrollAreaRootProps = React.ComponentProps<typeof ScrollArea.Root>

function ScrollAreaRoot({ className, ...props }: ScrollAreaRootProps) {
  return (
    <ScrollArea.Root
      className={cn(
        'group/scroll-area relative overflow-hidden outline-none focus-visible:outline-none',
        className,
      )}
      scrollHideDelay={300}
      {...props}
    />
  )
}

type ScrollAreaViewportProps = React.ComponentProps<typeof ScrollArea.Viewport>

function ScrollAreaViewport({ className, ...props }: ScrollAreaViewportProps) {
  return (
    <ScrollArea.Viewport
      className={cn(
        'size-full rounded-[inherit] outline-none focus-visible:outline-none',
        className,
      )}
      data-slot="scroll-area-viewport"
      {...props}
    />
  )
}

type ScrollAreaScrollbarProps = React.ComponentProps<
  typeof ScrollArea.Scrollbar
>

function ScrollAreaScrollbar({
  className,
  orientation = 'vertical',
  ...props
}: ScrollAreaScrollbarProps) {
  return (
    <ScrollArea.Scrollbar
      orientation={orientation}
      className={cn(
        'flex touch-none select-none p-0.5 outline-none transition-opacity duration-150 focus-visible:outline-none',
        orientation === 'vertical' && 'h-full w-2',
        orientation === 'horizontal' && 'h-2 flex-col',
        'data-[state=hidden]:opacity-0',
        className,
      )}
      data-slot="scroll-area-scrollbar"
      {...props}
    />
  )
}

type ScrollAreaThumbProps = React.ComponentProps<typeof ScrollArea.Thumb>

function ScrollAreaThumb({ className, ...props }: ScrollAreaThumbProps) {
  return (
    <ScrollArea.Thumb
      className={cn(
        'relative flex-1 rounded-full bg-muted-foreground outline-none focus-visible:outline-none',
        className,
      )}
      {...props}
    />
  )
}

type ScrollAreaCornerProps = React.ComponentProps<typeof ScrollArea.Corner>

function ScrollAreaCorner({ className, ...props }: ScrollAreaCornerProps) {
  return (
    <ScrollArea.Corner
      className={cn('bg-card outline-none focus-visible:outline-none', className)}
      {...props}
    />
  )
}

export {
  ScrollAreaRoot,
  ScrollAreaViewport,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaCorner,
}
