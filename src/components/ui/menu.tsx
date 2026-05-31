'use client'

import { DropdownMenu } from 'radix-ui'
import { cn, renderChild } from '@/lib/utils'

type MenuRootProps = React.ComponentProps<typeof DropdownMenu.Root>

function MenuRoot({ children, ...props }: MenuRootProps) {
  return <DropdownMenu.Root {...props}>{children}</DropdownMenu.Root>
}

type MenuTriggerProps = React.ComponentProps<typeof DropdownMenu.Trigger> & {
  render?: React.ReactElement
}

function MenuTrigger({
  className,
  render,
  asChild,
  children,
  ...props
}: MenuTriggerProps) {
  return (
    <DropdownMenu.Trigger
      className={cn(className)}
      asChild={!!render || asChild}
      {...props}
    >
      {renderChild(render, children)}
    </DropdownMenu.Trigger>
  )
}

type MenuContentProps = {
  className?: string
  side?: 'top' | 'bottom' | 'left' | 'right'
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
  children: React.ReactNode
}

function MenuContent({
  className,
  side = 'bottom',
  align = 'end',
  sideOffset = 4,
  children,
}: MenuContentProps) {
  return (
    <DropdownMenu.Portal>
      <DropdownMenu.Content
        side={side}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'z-[9999] min-w-[110px] rounded-lg p-1 text-sm shadow-lg',
          'origin-(--radix-dropdown-menu-content-transform-origin)',
          className,
        )}
        style={{
          background: 'var(--theme-card)',
          color: 'var(--theme-text)',
          border: '1px solid var(--theme-border)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        {children}
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  )
}

type MenuItemProps = React.ComponentProps<typeof DropdownMenu.Item>

function MenuItem({ className, ...props }: MenuItemProps) {
  return (
    <DropdownMenu.Item
      className={cn(
        'flex w-full cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-sm font-[450] text-[var(--theme-text)] outline-none select-none data-[highlighted]:bg-[var(--theme-card2)] data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export { MenuRoot, MenuTrigger, MenuContent, MenuItem }
