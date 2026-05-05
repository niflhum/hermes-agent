import { Box, Text } from '@hermes/ink'
import { useStore } from '@nanostores/react'
import { useEffect, useRef, useState } from 'react'

import { $uiState } from '../app/uiStore.js'
import { fmtK } from '../lib/text.js'
import type { Theme } from '../theme.js'

/**
 * TokenHUD — compact heads-up display pinned to the top of the TUI.
 *
 * Shows the active model, accumulated token counts, cost, and context
 * usage.  Data comes from `$uiState.usage` (updated via gateway events).
 * A brief colour pulse signals updates.
 */

interface HudSnapshot {
  input: number
  output: number
  total: number
  cost_usd: number | undefined
  context_max: number | undefined
  context_used: number | undefined
  calls: number
}

function fmtCost(n: number | undefined): string {
  if (n == null || n === 0) return ''
  if (n < 0.01) return '<$0.01'
  return `$${n.toFixed(2)}`
}

function contextBar(pct: number | undefined, t: Theme): string {
  if (pct == null || pct <= 0) return ''
  const block = pct > 80 ? '█' : pct > 60 ? '▓' : pct > 40 ? '▒' : '░'
  const w = Math.max(1, Math.min(10, Math.round(pct / 10)))
  return block.repeat(w)
}

export function TokenHUD({ t }: { t: Theme }) {
  const ui = useStore($uiState)
  const usage = ui.usage

  const model = ui.info?.model ?? ''

  // ⚠️ ALL hooks must run before any conditional return (Rules of Hooks)
  const prev = useRef<HudSnapshot>({ input: 0, output: 0, total: 0, cost_usd: undefined, context_max: undefined, context_used: undefined, calls: 0 })
  const [pulse, setPulse] = useState(false)

  useEffect(() => {
    const snap: HudSnapshot = {
      input: usage.input,
      output: usage.output,
      total: usage.total,
      cost_usd: usage.cost_usd,
      context_max: usage.context_max,
      context_used: usage.context_used,
      calls: usage.calls,
    }
    const changed =
      snap.input !== prev.current.input ||
      snap.output !== prev.current.output ||
      snap.total !== prev.current.total ||
      snap.context_max !== prev.current.context_max ||
      snap.context_used !== prev.current.context_used ||
      snap.cost_usd !== prev.current.cost_usd ||
      snap.calls !== prev.current.calls

    if (changed) {
      setPulse(true)
      const t = setTimeout(() => setPulse(false), 600)
      prev.current = snap
      return () => clearTimeout(t)
    }
    prev.current = snap
  }, [usage.input, usage.output, usage.total, usage.cost_usd, usage.context_max, usage.context_used, usage.calls])

  if (!model) return null

  const pct = usage.context_percent
  const bar = contextBar(pct, t)
  const barColor = pct != null ? (pct > 80 ? t.color.error : pct > 60 ? t.color.warn : t.color.ok) : t.color.border

  const ctxLabel = usage.context_max
    ? `${fmtK(usage.context_used ?? 0)}/${fmtK(usage.context_max)}`
    : usage.total > 0
      ? `${fmtK(usage.total)} tok`
      : ''

  const cost = fmtCost(usage.cost_usd)

  const entryColor = pulse ? t.color.primary : t.color.muted

  return (
    <Box flexShrink={0} height={1}>
      <Text color={t.color.border}>
        {'━ '}
        <Text color={pulse ? t.color.accent : t.color.muted}>
          {model}
        </Text>
        <Text color={t.color.muted}>
          {' │ '}
          <Text color={entryColor}>in {fmtK(usage.input)}</Text>
          {' · '}
          <Text color={entryColor}>out {fmtK(usage.output)}</Text>
          {usage.total > 0 ? (
            <>
              {' · '}
              <Text color={entryColor}>tot {fmtK(usage.total)}</Text>
            </>
          ) : null}
        </Text>
        {ctxLabel ? (
          <Text color={t.color.muted}>
            {' │ '}
            <Text color={entryColor}>{ctxLabel}</Text>
            {bar ? (
              <Text>
                {' '}
                <Text color={barColor}>[{bar}]</Text>
                {pct != null ? (
                  <Text color={barColor}> {pct}%</Text>
                ) : null}
              </Text>
            ) : null}
          </Text>
        ) : bar ? (
          <Text color={t.color.muted}>
            {' │ '}
            <Text color={barColor}>[{bar}]</Text>
            {pct != null ? (
              <Text color={barColor}> {pct}%</Text>
            ) : null}
          </Text>
        ) : null}
        {cost ? (
          <Text color={t.color.muted}>
            {' │ '}
            <Text color={entryColor}>{cost}</Text>
          </Text>
        ) : null}
        {usage.calls > 0 ? (
          <Text color={t.color.muted}>
            {' │ '}
            <Text color={entryColor}>{usage.calls} call{usage.calls !== 1 ? 's' : ''}</Text>
          </Text>
        ) : null}
        {' ━'}
      </Text>
    </Box>
  )
}
