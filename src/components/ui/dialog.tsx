'use client'

import { Dialog } from 'radix-ui'
import { Button } from './button'
import { cn, renderChild } from '@/lib/utils'

type DialogRootProps = React.ComponentProps<typeof Dialog.Root>

function DialogRoot({ children, ...props }: DialogRootProps) {
  return <Dialog.Root {...props}>{children}</Dialog.Root>
}

type DialogTriggerProps = React.ComponentProps<typeof Dialog.Trigger> & {
  render?: React.ReactElement
}

function DialogTrigger({
  className,
  render,
  asChild,
  children,
  ...props
}: DialogTriggerProps) {
  return (
    <Dialog.Trigger
      className={cn(className)}
      asChild={!!render || asChild}
      {...props}
    >
      {renderChild(render, children)}
    </Dialog.Trigger>
  )
}

type DialogContentProps = {
  className?: string
  children: React.ReactNode
  style?: React.CSSProperties
}

function DialogContent({ className, children, style }: DialogContentProps) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay
        className="fixed inset-0 z-50 transition-all duration-150 data-[state=open]:opacity-100 data-[state=closed]:opacity-0"
        style={{ background: 'rgba(0,0,0,0.5)' }}
      />
      <Dialog.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
          'w-[min(400px,92vw)] max-h-[90vh] rounded-[10px] p-0 overflow-hidden flex flex-col',
          'transition-all duration-150',
          'data-[state=open]:opacity-100 data-[state=closed]:opacity-0',
          'data-[state=open]:scale-100 data-[state=closed]:scale-95',
          className,
        )}
        style={{
          background: 'var(--theme-panel)',
          border: '1px solid var(--theme-border)',
          boxShadow: 'var(--theme-shadow-3)',
          color: 'var(--theme-text)',
          ...style,
        }}
      >
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  )
}

type DialogTitleProps = React.ComponentProps<typeof Dialog.Title>

function DialogTitle({ className, ...props }: DialogTitleProps) {
  return (
    <Dialog.Title
      className={cn('text-lg font-medium', className)}
      style={{ color: 'var(--theme-text)' }}
      {...props}
    />
  )
}

type DialogDescriptionProps = React.ComponentProps<typeof Dialog.Description>

function DialogDescription({ className, ...props }: DialogDescriptionProps) {
  return (
    <Dialog.Description
      className={cn('text-sm', className)}
      style={{ color: 'var(--theme-muted)' }}
      {...props}
    />
  )
}

type DialogCloseProps = Omit<
  React.ComponentProps<typeof Dialog.Close>,
  'asChild'
> & {
  render?: React.ReactElement
}

function DialogClose({
  className,
  render,
  children,
  ...props
}: DialogCloseProps) {
  return (
    <Dialog.Close asChild {...props}>
      {render ? (
        renderChild(render, children)
      ) : (
        <Button variant="outline" className={cn(className)}>
          {children}
        </Button>
      )}
    </Dialog.Close>
  )
}

export {
  DialogRoot,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
}
