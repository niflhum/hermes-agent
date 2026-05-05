/**
 * token-hud — real-time token usage HUD for Hermes dashboard Chat tab.
 *
 * Registered into the `chat:top` slot — renders a slim semitransparent bar
 * showing model, input/output token counts, and estimated cost.
 *
 * Connects to /api/chat/token-stream (SSE) for live data; stays open as
 * long as the Chat tab is mounted.
 */

(function () {
  var sdk = window.__HERMES_PLUGIN_SDK__;
  if (!sdk) return;

  var React = sdk.React;

  var hooks = sdk.hooks;
  var useState = hooks.useState;
  var useEffect = hooks.useEffect;
  var useRef = hooks.useRef;
  var useCallback = hooks.useCallback;

  var cn = sdk.utils.cn || function () { return Array.prototype.slice.call(arguments).filter(Boolean).join(' '); };

  // -----------------------------------------------------------------------
  // Format helpers
  // -----------------------------------------------------------------------

  function fmtNum(n) {
    if (n == null || n === 0) return '0';
    if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e4) return (n / 1e3).toFixed(1) + 'K';
    return n.toLocaleString();
  }

  function fmtCost(n) {
    if (n == null || n === 0) return '$0.00';
    if (n < 0.01) return '<$0.01';
    return '$' + n.toFixed(2);
  }

  function fmtTimeAgo(ts) {
    if (!ts) return '';
    var delta = Math.floor(Date.now() / 1000 - ts);
    if (delta < 10) return 'just now';
    if (delta < 60) return delta + 's ago';
    return Math.floor(delta / 60) + 'm ago';
  }

  // -----------------------------------------------------------------------
  // Component
  // -----------------------------------------------------------------------

  function TokenHUD() {
    var _d = useState(null);
    var data = _d[0];
    var setData = _d[1];

    var _v = useState(false);
    var visible = _v[0];
    var setVisible = _v[1];

    var _p = useState(false);
    var pulse = _p[0];
    var setPulse = _p[1];

    var reconnectRef = useRef(undefined);
    var retriesRef = useRef(0);
    var sourceRef = useRef(null);

    var connect = useCallback(function () {
      if (sourceRef.current) {
        try { sourceRef.current.close(); } catch (e) { /* ok */ }
      }

      var token = (window.__HERMES_SESSION_TOKEN__) || '';
      var base = '/api/chat/token-stream';
      var url = token ? base + '?token=' + encodeURIComponent(token) : base;

      var source = new EventSource(url);
      sourceRef.current = source;

      source.onmessage = function (event) {
        try {
          var payload = JSON.parse(event.data);
          setData(function (prev) {
            if (
              !prev ||
              prev.estimated_cost_usd !== payload.estimated_cost_usd ||
              prev.input_tokens !== payload.input_tokens ||
              prev.output_tokens !== payload.output_tokens
            ) {
              return payload;
            }
            return prev;
          });
          setVisible(true);
          setPulse(true);
          setTimeout(function () { setPulse(false); }, 600);
          retriesRef.current = 0;
        } catch (e) { /* ignore */ }
      };

      source.onerror = function () {
        if (sourceRef.current) {
          try { sourceRef.current.close(); } catch (e) { /* ok */ }
          sourceRef.current = null;
        }
        var backoff = Math.min(1000 * Math.pow(2, retriesRef.current), 15000);
        retriesRef.current += 1;
        reconnectRef.current = setTimeout(connect, backoff);
      };
    }, []);

    useEffect(function () {
      connect();
      return function () {
        if (sourceRef.current) {
          try { sourceRef.current.close(); } catch (e) { /* ok */ }
          sourceRef.current = null;
        }
        if (reconnectRef.current != null) clearTimeout(reconnectRef.current);
      };
    }, [connect]);

    // --- Render guard ---

    // Show HUD whenever we have data (even zero tokens). After /new the
    // SSE reconnects and delivers the new session's info; hiding during the
    // reconnect gap would be jarring.
    if (!data) return null;

    var modelLabel = data.model || data.billing_provider || '—';
    var totalTokens = (data.input_tokens || 0) + (data.output_tokens || 0);
    var cost = data.actual_cost_usd != null ? data.actual_cost_usd : data.estimated_cost_usd;
    var hasCache = (data.cache_read_tokens || 0) > 0;
    var hasReasoning = (data.reasoning_tokens || 0) > 0;

    // Pulse className
    var rootCls = pulse
      ? 'flex items-center gap-3 overflow-hidden rounded-md px-3 py-1.5 text-xs border bg-black/20 backdrop-blur-sm transition-all duration-500 select-none border-accent/30 bg-accent/5'
      : 'flex items-center gap-3 overflow-hidden rounded-md px-3 py-1.5 text-xs border bg-black/20 backdrop-blur-sm transition-all duration-500 select-none border-white/[0.06]';

    var dot = React.createElement('span', { className: 'text-white/10 select-none', key: null }, '\u00B7');

    var children = [];

    // Model
    children.push(React.createElement(
      'span', { className: 'inline-flex items-center gap-1.5 shrink-0 text-midground/60', key: 'model' },
      React.createElement('span', { className: 'text-midground/80 font-medium max-w-[160px] truncate' }, modelLabel)
    ));

    children.push(React.createElement('span', { className: 'text-white/10 select-none', key: 'd1' }, '\u00B7'));

    // Total tokens
    children.push(React.createElement(
      'span', { className: 'text-midground/60 whitespace-nowrap', key: 'tokens' },
      React.createElement('span', { className: 'text-midground/80 tabular-nums' }, fmtNum(totalTokens)),
      ' tokens'
    ));

    // Token breakdown (hidden on very small screens)
    children.push(React.createElement(
      'span', {
        className: 'hidden sm:inline-flex items-center gap-2 text-[0.65rem]',
        key: 'breakdown'
      },
      React.createElement(
        'span', { title: 'input tokens', className: 'text-midground/50 whitespace-nowrap' },
        'in ', React.createElement('span', { className: 'text-midground/70 tabular-nums' }, fmtNum(data.input_tokens))
      ),
      React.createElement(
        'span', { title: 'output tokens', className: 'text-midground/50 whitespace-nowrap' },
        'out ', React.createElement('span', { className: 'text-midground/70 tabular-nums' }, fmtNum(data.output_tokens))
      ),
      hasCache ? React.createElement(
        'span', { title: 'cache read tokens', className: 'text-success/60 whitespace-nowrap' },
        'cache ', React.createElement('span', { className: 'tabular-nums' }, fmtNum(data.cache_read_tokens))
      ) : null,
      hasReasoning ? React.createElement(
        'span', { title: 'reasoning tokens', className: 'text-accent/60 whitespace-nowrap' },
        'think ', React.createElement('span', { className: 'tabular-nums' }, fmtNum(data.reasoning_tokens))
      ) : null
    ));

    // Cost
    if (cost != null) {
      children.push(React.createElement('span', { className: 'text-white/10 select-none', key: 'd2' }, '\u00B7'));
      children.push(React.createElement(
        'span', { title: 'estimated cost (USD)', className: 'text-midground/60 whitespace-nowrap', key: 'cost' },
        React.createElement('span', { className: 'text-midground/80 tabular-nums font-medium' }, fmtCost(cost))
      ));
    }

    // Updated-at indicator
    children.push(React.createElement(
      'span', { className: 'ml-auto text-[0.6rem] text-midground/30 hidden sm:inline', key: 'ts' },
      fmtTimeAgo(data.ts)
    ));

    return React.createElement('div', { className: rootCls }, children);
  }

  // -----------------------------------------------------------------------
  // Register
  // -----------------------------------------------------------------------

  // The dashboard plugin loader expects every plugin to call register()
  // (used for tab-based plugins). Slot-only plugins register a no-op tab
  // component so the loader doesn't report a NO_REGISTER error.
  window.__HERMES_PLUGINS__.register('token-hud', function () { return null; });

  window.__HERMES_PLUGINS__.registerSlot('token-hud', 'chat:top', TokenHUD);
})();
