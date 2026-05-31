#!/usr/bin/env node
/**
 * shadcn token codemod
 * ---------------------
 * Rewrites the project's legacy color utilities to shadcn semantic tokens:
 *   - the inverted `primary-50..950` neutral ramp  → background/card/muted/
 *     muted-foreground/primary/primary-foreground/foreground/border
 *   - custom `surface`, `surface-deep`, `ink` color tokens
 *   - the clean `.theme-*` surface/text utility classes
 *
 * Mapping derives from the ground-truth per-theme remap in styles.css
 * (lines ~1228-1276) where, e.g., primary-200 = --theme-border,
 * primary-700..950 = --theme-text, primary-50 = surface, etc.
 *
 * Brand-accent utilities (.theme-accent-*, accent-400/500/600, --theme-accent)
 * are intentionally LEFT ALONE — shadcn's --primary maps to the high-contrast
 * neutral (matching the existing buttons), so the brand hue keeps its own scale.
 *
 * Usage:
 *   node scripts/shadcn-codemod.mjs            # dry run, prints counts
 *   node scripts/shadcn-codemod.mjs --write    # apply changes
 *   node scripts/shadcn-codemod.mjs --write src/screens/chat   # scope to a path
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'

const args = process.argv.slice(2)
const WRITE = args.includes('--write')
const roots = args.filter((a) => !a.startsWith('--'))
const SCAN = roots.length ? roots : ['src']

// shade -> shadcn token, per utility family. Token names become `${prefix}-${token}`.
const BG = { 50: 'background', 100: 'card', 200: 'muted', 300: 'muted', 400: 'muted-foreground', 500: 'muted-foreground', 600: 'muted-foreground', 700: 'primary', 800: 'primary', 900: 'primary', 950: 'primary' }
const FG = { 50: 'primary-foreground', 100: 'primary-foreground', 200: 'primary-foreground', 300: 'muted-foreground', 400: 'muted-foreground', 500: 'muted-foreground', 600: 'muted-foreground', 700: 'foreground', 800: 'foreground', 900: 'foreground', 950: 'foreground' }
const BORDER = { 50: 'border', 100: 'border', 200: 'border', 300: 'border', 400: 'border', 500: 'border', 600: 'border', 700: 'foreground', 800: 'foreground', 900: 'foreground', 950: 'foreground' }

// utility prefix -> table (or constant). Longer prefixes first for alternation.
const PREFIXES = [
  ['ring-offset', () => 'background'],
  ['ring', () => 'ring'],
  ['bg', (s) => BG[s]],
  ['text', (s) => FG[s]],
  ['placeholder', (s) => FG[s]],
  ['caret', (s) => FG[s]],
  ['decoration', (s) => FG[s]],
  ['fill', (s) => FG[s]],
  ['stroke', (s) => FG[s]],
  ['shadow', (s) => FG[s]],
  ['from', (s) => BG[s]],
  ['via', (s) => BG[s]],
  ['to', (s) => BG[s]],
  // directional / axis border-color utilities (longer first so border-t beats border)
  ['border-t', (s) => BORDER[s]],
  ['border-b', (s) => BORDER[s]],
  ['border-l', (s) => BORDER[s]],
  ['border-r', (s) => BORDER[s]],
  ['border-x', (s) => BORDER[s]],
  ['border-y', (s) => BORDER[s]],
  ['border-s', (s) => BORDER[s]],
  ['border-e', (s) => BORDER[s]],
  ['border', (s) => BORDER[s]],
  ['divide', (s) => BORDER[s]],
  ['outline', (s) => BORDER[s]],
  // accent-color property utility (range sliders, checkboxes) -> shadcn primary (neutral action)
  ['accent', () => 'primary'],
]
const PREFIX_ALT = PREFIXES.map(([p]) => p).join('|')

// primary-<shade> with any utility prefix + optional opacity modifier. \b before prefix
// keeps variant chains (hover:, dark:, group-hover:, data-[..]:) untouched.
const PRIMARY_RE = new RegExp(`\\b(${PREFIX_ALT})-primary-(50|100|200|300|400|500|600|700|800|900|950)(/[0-9.]+|/\\[[^\\]]+\\])?\\b`, 'g')

// static token replacements (order: most-specific first)
const STATIC = [
  // surface-deep before surface
  [new RegExp(`\\b(${PREFIX_ALT})-surface-deep\\b`, 'g'), '$1-background'],
  [new RegExp(`\\b(${PREFIX_ALT})-surface\\b`, 'g'), '$1-background'],
  [new RegExp(`\\b(${PREFIX_ALT})-ink\\b`, 'g'), '$1-foreground'],
  // .theme-* clean surface/text utility CLASSES only (NOT theme-accent-*, theme-shadow-*,
  // theme-active …). The (?<!-) guard prevents matching inside `var(--theme-*)` CSS-var
  // references (inline styles / arbitrary values), which must be left untouched — the
  // --theme-* layer is the source of truth that feeds the @theme tokens.
  [/(?<!-)\btheme-border-subtle\b/g, 'border-border'],
  [/(?<!-)\btheme-border\b/g, 'border-border'],
  [/(?<!-)\btheme-card2\b/g, 'bg-secondary'],
  [/(?<!-)\btheme-card\b/g, 'bg-card'],
  [/(?<!-)\btheme-sidebar\b/g, 'bg-sidebar'],
  [/(?<!-)\btheme-panel\b/g, 'bg-card'],
  [/(?<!-)\btheme-bg\b/g, 'bg-background'],
  [/(?<!-)\btheme-muted\b/g, 'text-muted-foreground'],
  [/(?<!-)\btheme-text\b/g, 'text-foreground'],
]

const counts = {}
let filesChanged = 0
let totalRepl = 0

function transform(src) {
  let out = src
  let n = 0
  out = out.replace(PRIMARY_RE, (m, prefix, shade, op = '') => {
    const fn = PREFIXES.find(([p]) => p === prefix)[1]
    const token = fn(Number(shade))
    if (!token) return m
    const next = `${prefix}-${token}${op}`
    if (next !== m) {
      counts[`${prefix}-primary-${shade}→${prefix}-${token}`] = (counts[`${prefix}-primary-${shade}→${prefix}-${token}`] || 0) + 1
      n++
    }
    return next
  })
  for (const [re, rep] of STATIC) {
    out = out.replace(re, (m, ...g) => {
      const res = m.replace(re, rep)
      counts[`${m}→${res}`] = (counts[`${m}→${res}`] || 0) + 1
      n++
      return res
    })
  }
  return { out, n }
}

function walk(dir, acc) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e)
    const st = statSync(p)
    if (st.isDirectory()) {
      if (e === 'node_modules' || e === '.git' || e === 'dist') continue
      walk(p, acc)
    } else if (['.tsx', '.ts', '.jsx', '.js'].includes(extname(p)) && !p.endsWith('.d.ts')) {
      acc.push(p)
    }
  }
  return acc
}

const files = []
for (const root of SCAN) {
  const st = statSync(root)
  if (st.isDirectory()) walk(root, files)
  else files.push(root)
}

for (const f of files) {
  const src = readFileSync(f, 'utf8')
  const { out, n } = transform(src)
  if (n > 0) {
    filesChanged++
    totalRepl += n
    if (WRITE) writeFileSync(f, out)
  }
}

// report
const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
console.log(`\n${WRITE ? 'APPLIED' : 'DRY RUN'} — ${totalRepl} replacements across ${filesChanged} files (${files.length} scanned)\n`)
for (const [k, v] of sorted) console.log(`  ${String(v).padStart(5)}  ${k}`)

// leftover unmatched primary-N (shades/prefixes the codemod didn't handle)
let leftover = 0
const leftoverSamples = new Set()
for (const f of files) {
  const src = WRITE ? readFileSync(f, 'utf8') : transform(readFileSync(f, 'utf8')).out
  const m = src.match(/[\w-]*primary-(?:50|100|200|300|400|500|600|700|800|900|950)\b/g)
  if (m) { leftover += m.length; m.forEach((x) => leftoverSamples.add(x)) }
}
if (leftover) {
  console.log(`\n  ⚠ ${leftover} primary-N token(s) NOT rewritten — review:`)
  for (const s of [...leftoverSamples].sort()) console.log(`      ${s}`)
}
console.log('')
