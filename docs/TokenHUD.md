# TokenHUD — Real-time Token Usage Display for Hermes Agent

> 🎯 A lightweight, always-on heads-up display showing your token consumption, estimated cost, and API call metrics in real time.

## What It Shows

| Metric | Description |
|--------|-------------|
| **Model** | Currently active model name |
| **In / Out** | Input and output token counts |
| **Total** | Cumulative token usage across the session |
| **Context** | Context window usage with progress bar and percentage |
| **Cost** | Estimated cost in USD |
| **Calls** | Number of API calls made |

### TUI (Terminal)

```
╭──────────────────────────────────────────────────────────╮
│ 🔵 Doubao-Smart-Router  In: 12.4K  Out: 3.2K  Tot: 15.6K│
│ Ctx: 45.2K/128K [████████░░░░░░░░░░] 35%  $0.023  📞 7  │
╰──────────────────────────────────────────────────────────╯
```

### Dashboard (Web)

A slim stats bar rendered above the terminal pane in the Dashboard Chat tab, with pulse animation on data updates.

## Installation

### Option A: Install from Wheel (Recommended)

Download the pre-built wheel from [GitHub Releases](../../releases) and install:

```bash
pip install hermes_agent-0.12.0-py3-none-any.whl
```

The wheel includes pre-built TUI dist files — no Node.js build step required.

### Option B: Build from Source

```bash
git clone https://github.com/NousResearch/hermes-agent.git
cd hermes-agent
git checkout release-v0.12.0-tokenhud

# Install Python package
pip install .

# (Optional) Rebuild TUI if you modify ui-tui/src/
cd ui-tui && npm install && npm run build
```

### Option C: Development Mode

```bash
pip install -e .
```

## Usage

TokenHUD activates automatically — no configuration needed.

### TUI Mode

```bash
hermes --tui
```

The HUD bar appears at the top of the terminal. It persists across `/new` sessions and updates in real time as tokens are consumed.

### Dashboard Mode

```bash
hermes dashboard
```

The TokenHUD component renders above the chat terminal, connected via Server-Sent Events (SSE) at `/api/chat/token-stream`.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Hermes Gateway                     │
│  (state.db — token usage per session)                │
│                                                      │
│  ┌──────────────┐       ┌──────────────────────┐    │
│  │  SSE Endpoint │──────→│  Dashboard TokenHUD  │    │
│  │ /api/chat/    │       │  (EventSource → TSX) │    │
│  │ token-stream  │       └──────────────────────┘    │
│  └──────────────┘                                     │
│                                                      │
│  ┌──────────────┐       ┌──────────────────────┐    │
│  │  Gateway     │──────→│  TUI TokenHUD        │    │
│  │  Events      │       │  ($uiState.usage)    │    │
│  └──────────────┘       └──────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

- **Dashboard**: SSE endpoint streams token data from `state.db` → `EventSource` → React component
- **TUI**: Gateway events publish to `$uiState.usage` nanostore → Ink/React component

## Requirements

| Component | Requirement |
|-----------|-------------|
| Python | ≥ 3.9 |
| TUI mode | Node.js ≥ 18 (bundled in wheel, auto-detected) |
| Dashboard | `hermes-agent[web]` extra (FastAPI + Uvicorn) |
| Platform | macOS / Linux native ✅ · Windows native ⚠️ · WSL2 ✅ |

> **Windows Note**: TUI (`hermes --tui`) requires WSL2. Dashboard and CLI-only mode work on native Windows.

## Files Changed

| File | Change |
|------|--------|
| `web/src/components/TokenHUD.tsx` | New — Dashboard HUD component |
| `web/src/pages/ChatPage.tsx` | Integration at `chat:top` PluginSlot |
| `ui-tui/src/components/tokenHUD.tsx` | New — TUI HUD component |
| `ui-tui/src/components/appLayout.tsx` | HUD bar positioned at screen top |
| `hermes_cli/web_server.py` | SSE endpoint + public path whitelist |
| `hermes_state.py` | Fixed COALESCE param order for model switching |
| `hermes_cli/model_switch.py` | Model name→ID map, Section 4 dedup fix |
| `hermes_cli/models.py` | Trimmed DeepSeek model list |
| `hermes_cli/config.py` | `discover_models` added to known keys whitelist |
| `hermes_cli/cli.py` | Model picker display name resolution |

## License

Same as Hermes Agent — see [LICENSE](../../LICENSE).
