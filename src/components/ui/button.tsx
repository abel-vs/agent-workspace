'use client'

import { cva } from 'class-variance-authority'
import type { VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { Slot } from 'radix-ui'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'relative inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 select-none duration-150',
  {
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
    variants: {
      size: {
        default: 'h-9 px-4',
        sm: 'h-8 px-3',
        lg: 'h-10 px-5',
        icon: 'size-9',
        'icon-sm': 'size-8',
        'icon-md': 'size-10',
        'icon-xl': 'size-11 [&_svg]:size-5',
      },
      variant: {
        default:
          'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm outline outline-foreground/10 shadow-2xs',
        secondary:
          'bg-background text-foreground hover:bg-muted outline outline-foreground/10 shadow-2xs',
        outline:
          'border border-border bg-transparent text-foreground hover:bg-muted shadow-2xs',
        ghost: 'text-foreground hover:bg-muted hover:text-foreground',
        destructive:
          'bg-destructive text-white hover:bg-destructive/90 shadow-sm',
      },
    },
  },
)

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: VariantProps<typeof buttonVariants>['variant']
  size?: VariantProps<typeof buttonVariants>['size']
  /** Canonical shadcn polymorphism: render as the single child element. */
  asChild?: boolean
  /**
   * Back-compat with the previous Base UI API: render as the given element
   * (the button's classes/props are merged onto it). Kept so existing
   * `render={<Link .../>}` call sites keep working.
   */
  render?: React.ReactElement
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  render,
  type,
  children,
  ...props
}: ButtonProps) {
  const classes = cn(buttonVariants({ className, size, variant }))

  if (render && React.isValidElement(render)) {
    const r = render as React.ReactElement<Record<string, unknown>>
    return React.cloneElement(
      r,
      {
        ...props,
        ...r.props,
        className: cn(classes, r.props.className as string | undefined),
        'data-slot': 'button',
      },
      (r.props.children as React.ReactNode) ?? children,
    )
  }

  const Comp = (asChild ? Slot.Root : 'button') as React.ElementType
  return (
    <Comp
      className={classes}
      data-slot="button"
      type={asChild ? undefined : (type ?? 'button')}
      {...props}
    >
      {children}
    </Comp>
  )
}

export { Button, buttonVariants }
