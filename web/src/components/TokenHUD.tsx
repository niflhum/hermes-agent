/**
 * TokenHUD — real-time token / cost / rate-limit heads-up display.
 *
 * Connects to /api/chat/token-stream (SSE) and renders a slim stats bar
 * above the terminal pane in the dashboard Chat tab.
 */

import { Cpu } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface TokenPayload {
  model?: string;
  billing_provider?: string;
  input_tokens?: number;
  output_tokens?: number;
  cache_read_tokens?: number;
  cache_write_tokens?: number;
  reasoning_tokens?: number;
  estimated_cost_usd?: number;
  actual_cost_usd?: number;
  api_call_count?: number;
  ts?: number;
}

function fmtNum(n: number | undefined | null): string {
  if (n == null || n === 0) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 10_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString();
}

function fmtCost(n: number | undefined | null): string {
  if (n == null || n === 0) return "$0.00";
  if (n < 0.01) return "<$0.01";
  return "$" + n.toFixed(2);
}

function fmtTimeAgo(ts: number | undefined): string {
  if (!ts) return "";
  const delta = Math.floor(Date.now() / 1000 - ts);
  if (delta < 10) return "just now";
  if (delta < 60) return `${delta}s ago`;
  return `${Math.floor(delta / 60)}m ago`;
}

/** Resolve session token from the window global injected by the server. */
function getSessionToken(): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return (w.__HERMES_SESSION_TOKEN__ as string) || "";
}

export function TokenHUD() {
  const [data, setData] = useState<TokenPayload | null>(null);
  const [visible, setVisible] = useState(false);
  const [pulse, setPulse] = useState(false);
  const reconnectRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const retriesRef = useRef(0);

  const connect = useCallback((): (() => void) => {
    const token = getSessionToken();
    const base = "/api/chat/token-stream";
    const url = token ? `${base}?token=${encodeURIComponent(token)}` : base;

    const source = new EventSource(url);

    source.onmessage = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data) as TokenPayload;
        setData((prev) => {
          if (
            prev?.estimated_cost_usd !== payload.estimated_cost_usd ||
            prev?.input_tokens !== payload.input_tokens ||
            prev?.output_tokens !== payload.output_tokens
          ) {
            return payload;
          }
          return prev;
        });
        setVisible(true);
        setPulse(true);
        setTimeout(() => setPulse(false), 600);
        retriesRef.current = 0;
      } catch {
        // ignore malformed frame
      }
    };

    source.onerror = () => {
      source.close();
      const backoff = Math.min(1000 * Math.pow(2, retriesRef.current), 15000);
      retriesRef.current += 1;
      reconnectRef.current = setTimeout(connect, backoff);
    };

    return () => {
      source.close();
    };
  }, []);

  useEffect(() => {
    const cleanup = connect();
    return () => {
      cleanup?.();
      if (reconnectRef.current != null) clearTimeout(reconnectRef.current);
    };
  }, [connect]);

  if (!visible || !data) return null;

  const modelLabel = data.model || data.billing_provider || "—";
  const totalTokens = (data.input_tokens || 0) + (data.output_tokens || 0);
  const cost = data.actual_cost_usd ?? data.estimated_cost_usd;

  return (
    <div
      className={`
        flex items-center gap-3 overflow-hidden rounded-md px-3 py-1.5 text-xs
        border bg-black/20 backdrop-blur-sm
        transition-all duration-500 select-none
        ${pulse ? "border-accent/30 bg-accent/5" : "border-white/[0.06]"}
      `}
    >
      {/* Model */}
      <span className="inline-flex items-center gap-1.5 shrink-0 text-midground/60">
        <Cpu className="h-3 w-3" />
        <span className="text-midground/80 font-medium max-w-[160px] truncate">
          {modelLabel}
        </span>
      </span>

      <span className="text-white/10 select-none">·</span>

      {/* Tokens */}
      <span className="text-midground/60 whitespace-nowrap">
        <span className="text-midground/80 tabular-nums">{fmtNum(totalTokens)}</span>{" "}
        tokens
      </span>

      <span className="hidden sm:inline text-white/10 select-none">·</span>

      <span className="hidden sm:inline-flex items-center gap-2 text-[0.65rem]">
        <span className="text-midground/50 whitespace-nowrap" title="input tokens">
          in{" "}
          <span className="text-midground/70 tabular-nums">
            {fmtNum(data.input_tokens)}
          </span>
        </span>
        <span className="text-midground/50 whitespace-nowrap" title="output tokens">
          out{" "}
          <span className="text-midground/70 tabular-nums">
            {fmtNum(data.output_tokens)}
          </span>
        </span>
        {(data.cache_read_tokens ?? 0) > 0 && (
          <span className="text-success/60 whitespace-nowrap" title="cache read tokens">
            cache <span className="tabular-nums">{fmtNum(data.cache_read_tokens)}</span>
          </span>
        )}
        {(data.reasoning_tokens ?? 0) > 0 && (
          <span className="text-accent/60 whitespace-nowrap" title="reasoning tokens">
            think <span className="tabular-nums">{fmtNum(data.reasoning_tokens)}</span>
          </span>
        )}
      </span>

      {/* Cost */}
      {cost != null && (
        <>
          <span className="text-white/10 select-none">·</span>
          <span className="text-midground/60 whitespace-nowrap" title="estimated cost (USD)">
            <span className="text-midground/80 tabular-nums font-medium">
              {fmtCost(cost)}
            </span>
          </span>
        </>
      )}

      {/* Updated-at indicator */}
      <span className="ml-auto text-[0.6rem] text-midground/30 hidden sm:inline">
        {fmtTimeAgo(data.ts)}
      </span>
    </div>
  );
}
