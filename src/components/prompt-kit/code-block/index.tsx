import { useEffect, useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Copy01Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import { createHighlighter } from 'shiki'
import { formatLanguageName, normalizeLanguage, resolveLanguage } from './utils'
import type { BundledLanguage, Highlighter } from 'shiki'
import { useResolvedTheme } from '@/hooks/use-chat-settings'
import { writeTextToClipboard } from '@/lib/clipboard'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type CodeBlockProps = {
  content: string
  ariaLabel?: string
  language?: string
  className?: string
}

let highlighterPromise: Promise<Highlighter> | null = null

function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['vitesse-light', 'vitesse-dark'],
      langs: ['text'],
    })
  }
  return highlighterPromise
}

export function CodeBlock({
  content,
  ariaLabel,
  language = 'text',
  className,
}: CodeBlockProps) {
  const resolvedTheme = useResolvedTheme()
  const [copied, setCopied] = useState(false)
  const [showLineNumbers, setShowLineNumbers] = useState(false)
  const [html, setHtml] = useState<string | null>(null)
  const [resolvedLanguage, setResolvedLanguage] = useState('text')
  const [headerBg, setHeaderBg] = useState<string | undefined>()

  const fallback = useMemo(() => {
    return content
  }, [content])

  const normalizedLanguage = normalizeLanguage(language || 'text')
  const themeName = resolvedTheme === 'dark' ? 'vitesse-dark' : 'vitesse-light'
  const lineCount = useMemo(
    () => Math.max(1, content.split('\n').length),
    [content],
  )
  const canShowLineNumbers = lineCount > 1

  useEffect(() => {
    let active = true
    getHighlighter()
      .then(async (highlighter) => {
        let lang = resolveLanguage(normalizedLanguage)
        if (lang !== 'text') {
          try {
            await highlighter.loadLanguage(lang as BundledLanguage)
          } catch {
            lang = 'text'
          }
        }
        const highlighted = highlighter.codeToHtml(content, {
          lang: lang as BundledLanguage,
          theme: themeName,
        })
        if (active) {
          setResolvedLanguage(lang)
          setHtml(highlighted)
          const theme = highlighter.getTheme(themeName)
          setHeaderBg(theme.bg)
        }
      })
      .catch(() => {
        if (active) setHtml(null)
      })
    return () => {
      active = false
    }
  }, [content, normalizedLanguage, themeName])

  async function handleCopy() {
    try {
      await writeTextToClipboard(content)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  const isSingleLine = content.split('\n').length === 1
  const displayLanguage = formatLanguageName(resolvedLanguage)

  return (
    <div
      className={cn(
        'group relative min-w-0 overflow-hidden rounded-lg border border-border',
        className,
      )}
    >
      <div
        className={cn('flex items-center justify-between gap-2 px-3 pt-2')}
        style={{ backgroundColor: headerBg }}
      >
        <span className="rounded border border-border bg-card/80 px-2 py-0.5 text-xs font-medium text-foreground">
          {displayLanguage}
        </span>
        <div className="flex items-center gap-2">
          {canShowLineNumbers ? (
            <Button
              variant="ghost"
              className="h-auto px-0 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-transparent"
              onClick={() => {
                setShowLineNumbers((current) => !current)
              }}
            >
              {showLineNumbers ? 'Hide lines' : 'Show lines'}
            </Button>
          ) : null}
          <Button
            variant="ghost"
            aria-label={ariaLabel ?? 'Copy code'}
            className="h-auto px-0 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-transparent"
            onClick={() => {
              handleCopy().catch(() => {})
            }}
          >
            <HugeiconsIcon
              icon={copied ? Tick02Icon : Copy01Icon}
              size={20}
              strokeWidth={1.5}
            />
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
      </div>
      <div className="flex min-w-0 overflow-x-auto">
        {showLineNumbers ? (
          <ol className="sticky left-0 z-10 select-none border-r border-border bg-card/60 px-2 py-3 text-right text-xs text-muted-foreground tabular-nums">
            {Array.from({ length: lineCount }, (_, index) => (
              <li key={`line-${index + 1}`} className="leading-6">
                {index + 1}
              </li>
            ))}
          </ol>
        ) : null}
        <div className="min-w-0 flex-1">
          {html ? (
            <div
              className={cn(
                'text-sm text-foreground [&>pre]:m-0 [&>pre]:overflow-visible [&>pre]:leading-6',
                isSingleLine
                  ? '[&>pre]:whitespace-pre [&>pre]:px-3 [&>pre]:py-2'
                  : '[&>pre]:px-3 [&>pre]:py-3',
              )}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : (
            <pre
              className={cn(
                'text-sm leading-6 text-foreground',
                isSingleLine ? 'whitespace-pre px-3 py-2' : 'px-3 py-3',
              )}
            >
              <code>{fallback}</code>
            </pre>
          )}
        </div>
      </div>
    </div>
  )
}
