'use client'

import { Tabs as TabsPrimitive } from 'radix-ui'

import { cn } from '@/lib/utils'

type TabsVariant = 'default' | 'underline'

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      className={cn(
        'flex flex-col gap-2 data-[orientation=vertical]:flex-row',
        className,
      )}
      data-slot="tabs"
      {...props}
    />
  )
}

function TabsList({
  variant = 'default',
  className,
  children,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> & {
  variant?: TabsVariant
}) {
  return (
    <TabsPrimitive.List
      className={cn(
        'relative z-0 flex w-fit items-center justify-center gap-x-0.5 text-muted-foreground',
        'data-[orientation=vertical]:flex-col',
        variant === 'default'
          ? 'rounded-lg bg-muted p-0.5 text-muted-foreground/80'
          : 'data-[orientation=vertical]:px-1 data-[orientation=horizontal]:py-1',
        className,
      )}
      data-slot="tabs-list"
      data-variant={variant}
      {...props}
    >
      {children}
    </TabsPrimitive.List>
  )
}

function TabsTab({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        '[&_svg]:-mx-0.5 relative z-10 flex h-8 shrink-0 grow cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 text-sm font-medium outline-none transition-[color,background-color,box-shadow] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-disabled:pointer-events-none data-[orientation=vertical]:w-full data-[orientation=vertical]:justify-start data-[state=active]:bg-[var(--theme-accent-subtle)] data-[state=active]:text-[var(--theme-accent)] data-[state=active]:font-semibold data-disabled:opacity-64 [&_svg:not([class*="size-"])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0',
        className,
      )}
      data-slot="tabs-tab"
      {...props}
    />
  )
}

function TabsPanel({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={cn('flex-1 outline-none', className)}
      data-slot="tabs-content"
      {...props}
    />
  )
}

export {
  Tabs,
  TabsList,
  TabsTab,
  TabsTab as TabsTrigger,
  TabsPanel,
  TabsPanel as TabsContent,
}
