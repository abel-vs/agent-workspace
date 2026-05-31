import { useCallback, useEffect, useRef } from 'react'
import type { Mode } from '@/hooks/use-modes'

type ApplyModeDialogProps = {
  mode: Mode
  onConfirm: (switchModel: boolean) => void
  onClose: () => void
}

export function ApplyModeDialog({
  mode,
  onConfirm,
  onClose,
}: ApplyModeDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  // Focus trap
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
        return
      }

      if (event.key === 'Tab') {
        const focusable = dialog!.querySelectorAll<HTMLElement>(
          'button, [tabindex]:not([tabindex="-1"])',
        )
        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  const handleSwitchNow = useCallback(() => {
    onConfirm(true)
  }, [onConfirm])

  const handleSkip = useCallback(() => {
    onConfirm(false)
  }, [onConfirm])

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-labelledby="apply-mode-title"
        aria-modal="true"
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-background p-6 shadow-xl"
      >
        <h2
          id="apply-mode-title"
          className="mb-2 text-lg font-semibold text-foreground"
        >
          Switch Model?
        </h2>

        <p className="mb-6 text-sm text-muted-foreground">
          Mode "{mode.name}" uses{' '}
          <span className="font-medium">{mode.preferredModel}</span>. Would you
          like to switch to this model now?
        </p>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={handleSkip}
            className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={handleSwitchNow}
            className="rounded-lg bg-muted-foreground px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary focus:outline-none focus:ring-2 focus:ring-ring"
          >
            Switch Now
          </button>
        </div>
      </div>
    </>
  )
}
