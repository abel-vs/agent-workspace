'use client'

import { Dialog } from 'radix-ui'
import { HugeiconsIcon } from '@hugeicons/react'
import { Search01Icon } from '@hugeicons/core-free-icons'
import { createContext, useContext } from 'react'
import type * as React from 'react'
import { cn, renderChild } from '@/lib/utils'

/**
 * Command palette primitives — styled containers, not a filtering engine.
 *
 * All consumers (command-palette, command-session, slash-command-menu) implement
 * their own fuzzy scoring + keyboard navigation and pass `mode="none"`, so these
 * are intentionally plain styled wrappers (Radix Dialog provides the modal shell).
 * A small context wires <CommandInput> to <Command value/onValueChange>.
 */

type CommandContextValue = {
  value?: string
  onValueChange?: (value: string) => void
}
const CommandContext = createContext<CommandContextValue>({})

type CommandProps = React.ComponentProps<'div'> & {
  value?: string
  onValueChange?: (value: string) => void
  // Accepted for back-compat with the previous Autocomplete-based API; ignored.
  items?: unknown
  mode?: string
  inline?: boolean
  open?: boolean
  autoHighlight?: boolean | string
  keepHighlight?: boolean
}

function Command({
  value,
  onValueChange,
  items: _items,
  mode: _mode,
  inline: _inline,
  open: _open,
  autoHighlight: _autoHighlight,
  keepHighlight: _keepHighlight,
  className,
  children,
  ...props
}: CommandProps) {
  return (
    <CommandContext.Provider value={{ value, onValueChange }}>
      <div
        className={cn('flex min-h-0 flex-1 flex-col', className)}
        data-slot="command"
        {...props}
      >
        {children}
      </div>
    </CommandContext.Provider>
  )
}

function CommandInput({
  className,
  placeholder,
  ...props
}: Omit<React.ComponentProps<'input'>, 'value' | 'onChange'>) {
  const { value, onValueChange } = useContext(CommandContext)
  return (
    <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
      <HugeiconsIcon
        icon={Search01Icon}
        size={18}
        strokeWidth={1.5}
        className="shrink-0 text-muted-foreground"
      />
      <input
        autoFocus
        className={cn(
          'w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground',
          className,
        )}
        data-slot="command-input"
        placeholder={placeholder}
        value={value ?? ''}
        onChange={(e) => onValueChange?.(e.target.value)}
        {...props}
      />
    </div>
  )
}

function CommandPanel({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('relative min-h-0', className)}
      data-slot="command-panel"
      {...props}
    />
  )
}

function CommandList({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('overflow-y-auto overscroll-contain p-2', className)}
      data-slot="command-list"
      {...props}
    />
  )
}

function CommandEmpty({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('py-6 text-center text-sm text-muted-foreground', className)}
      data-slot="command-empty"
      {...props}
    />
  )
}

type CommandGroupProps = React.ComponentProps<'div'> & { items?: unknown }

function CommandGroup({
  items: _items,
  className,
  ...props
}: CommandGroupProps) {
  return (
    <div
      className={cn('[[role=group]+&]:mt-1.5', className)}
      role="group"
      data-slot="command-group"
      {...props}
    />
  )
}

function CommandGroupLabel({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'px-2 py-1.5 text-xs font-medium text-muted-foreground',
        className,
      )}
      data-slot="command-group-label"
      {...props}
    />
  )
}

function CommandCollection({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

type CommandItemProps = React.ComponentProps<'div'> & { value?: string }

function CommandItem({ value, className, ...props }: CommandItemProps) {
  return (
    <div
      className={cn(
        'flex min-h-8 cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm text-foreground outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-64',
        className,
      )}
      data-slot="command-item"
      data-value={value}
      role="option"
      {...props}
    />
  )
}

function CommandSeparator({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('mx-2 my-2 h-px bg-border last:hidden', className)}
      data-slot="command-separator"
      {...props}
    />
  )
}

function CommandShortcut({ className, ...props }: React.ComponentProps<'kbd'>) {
  return (
    <kbd
      className={cn(
        'ms-auto font-sans text-xs font-medium tracking-widest text-muted-foreground',
        className,
      )}
      data-slot="command-shortcut"
      {...props}
    />
  )
}

function CommandFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-2 rounded-b-2xl border-t border-border px-5 py-3 text-xs text-muted-foreground',
        className,
      )}
      data-slot="command-footer"
      {...props}
    />
  )
}

/* ── Command dialog (modal shell) — Radix Dialog ───────────────────────── */

const CommandDialog = Dialog.Root

type CommandDialogTriggerProps = React.ComponentProps<typeof Dialog.Trigger> & {
  render?: React.ReactElement
}

function CommandDialogTrigger({
  render,
  asChild,
  children,
  ...props
}: CommandDialogTriggerProps) {
  return (
    <Dialog.Trigger
      data-slot="command-dialog-trigger"
      asChild={!!render || asChild}
      {...props}
    >
      {renderChild(render, children)}
    </Dialog.Trigger>
  )
}

function CommandDialogPopup({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Dialog.Content>) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay
        className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm transition-all duration-200 data-[state=closed]:opacity-0 data-[state=open]:opacity-100"
        data-slot="command-dialog-backdrop"
      />
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-4 py-[max(--spacing(4),4vh)]">
        <Dialog.Content
          className={cn(
            'relative flex max-h-105 min-h-0 w-full min-w-0 max-w-xl flex-col rounded-2xl shadow-lg outline outline-1 outline-foreground/10 transition-[scale,opacity] duration-200 data-[state=closed]:scale-98 data-[state=closed]:opacity-0 data-[state=open]:scale-100 data-[state=open]:opacity-100',
            className,
          )}
          data-slot="command-dialog-popup"
          style={{
            background: 'var(--theme-card)',
            color: 'var(--theme-text)',
            border: '1px solid var(--theme-border)',
          }}
          {...props}
        >
          <Dialog.Title className="sr-only">Command Menu</Dialog.Title>
          {children}
        </Dialog.Content>
      </div>
    </Dialog.Portal>
  )
}

export {
  Command,
  CommandCollection,
  CommandDialog,
  CommandDialogPopup,
  CommandDialogTrigger,
  CommandEmpty,
  CommandFooter,
  CommandGroup,
  CommandGroupLabel,
  CommandInput,
  CommandItem,
  CommandList,
  CommandPanel,
  CommandSeparator,
  CommandShortcut,
}
