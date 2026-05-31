'use client'

import { AlertDialog } from 'radix-ui'
import { Button } from './button'
import { cn, renderChild } from '@/lib/utils'

type AlertDialogRootProps = React.ComponentProps<typeof AlertDialog.Root>

function AlertDialogRoot({ children, ...props }: AlertDialogRootProps) {
  return <AlertDialog.Root {...props}>{children}</AlertDialog.Root>
}

type AlertDialogTriggerProps = React.ComponentProps<
  typeof AlertDialog.Trigger
> & { render?: React.ReactElement }

function AlertDialogTrigger({
  className,
  render,
  asChild,
  children,
  ...props
}: AlertDialogTriggerProps) {
  return (
    <AlertDialog.Trigger
      className={cn(className)}
      asChild={!!render || asChild}
      {...props}
    >
      {renderChild(render, children)}
    </AlertDialog.Trigger>
  )
}

type AlertDialogContentProps = {
  className?: string
  children: React.ReactNode
}

function AlertDialogContent({ className, children }: AlertDialogContentProps) {
  return (
    <AlertDialog.Portal>
      <AlertDialog.Overlay
        className="fixed inset-0 z-50 transition-all duration-150 data-[state=open]:opacity-100 data-[state=closed]:opacity-0"
        style={{ background: 'rgba(0,0,0,0.5)' }}
      />
      <AlertDialog.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
          'w-[min(400px,92vw)] rounded-xl border p-0 shadow-xl',
          'transition-all duration-150',
          'data-[state=open]:opacity-100 data-[state=closed]:opacity-0',
          'data-[state=open]:scale-100 data-[state=closed]:scale-95',
          className,
        )}
        style={{
          background: 'var(--theme-panel)',
          borderColor: 'var(--theme-border)',
        }}
      >
        {children}
      </AlertDialog.Content>
    </AlertDialog.Portal>
  )
}

type AlertDialogTitleProps = React.ComponentProps<typeof AlertDialog.Title>

function AlertDialogTitle({ className, ...props }: AlertDialogTitleProps) {
  return (
    <AlertDialog.Title
      className={cn('text-lg font-medium', className)}
      style={{ color: 'var(--theme-text)' }}
      {...props}
    />
  )
}

type AlertDialogDescriptionProps = React.ComponentProps<
  typeof AlertDialog.Description
>

function AlertDialogDescription({
  className,
  ...props
}: AlertDialogDescriptionProps) {
  return (
    <AlertDialog.Description
      className={cn('text-sm', className)}
      style={{ color: 'var(--theme-muted)' }}
      {...props}
    />
  )
}

type AlertDialogCancelProps = React.ComponentProps<typeof AlertDialog.Cancel>

function AlertDialogCancel({
  className,
  children,
  ...props
}: AlertDialogCancelProps) {
  return (
    <AlertDialog.Cancel asChild {...props}>
      <Button variant="outline" className={cn(className)}>
        {children}
      </Button>
    </AlertDialog.Cancel>
  )
}

type AlertDialogActionProps = React.ComponentProps<typeof AlertDialog.Action>

function AlertDialogAction({
  className,
  children,
  ...props
}: AlertDialogActionProps) {
  return (
    <AlertDialog.Action asChild {...props}>
      <Button variant="destructive" className={cn(className)}>
        {children}
      </Button>
    </AlertDialog.Action>
  )
}

export {
  AlertDialogRoot,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
}
