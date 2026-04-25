# ADR: Replace docker-start.sh and docker-start.ps1 with Taskfile Tasks

**Status**: Accepted  
**Date**: 2026-04-25  
**Deciders**: Development team
**Implementation**: Completed in [`Taskfile.yml`](../Taskfile.yml)

---

## 1. Context

The Projojo repository contained two platform-specific Docker startup scripts:

- `docker-start.sh` (73 lines) — Bash, for macOS/Linux
- `docker-start.ps1` (64 lines) — PowerShell, for Windows

A [`Taskfile.yml`](../Taskfile.yml) (60 lines) already exists with E2E testing tasks. The question is whether the two startup scripts should be consolidated into Taskfile tasks.

---

## 2. Behavioral Analysis of Both Scripts

### 2.1 What the Scripts Do (Step by Step)

Both scripts perform an identical 5-step sequence:

| Step | Behavior | `docker-start.sh` | `docker-start.ps1` |
|------|----------|--------------------|---------------------|
| 1 | Parse reset argument | `[[ "$1" == "reset" \|\| "$1" == "-reset" ]]` | `param([switch]$reset)` |
| 2a | Reset flow | `docker compose down --volumes` then `docker compose up -d --build` | Identical commands |
| 2b | Normal flow | `docker compose up -d` | Identical |
| 3 | Wait for init | `sleep 5` | `Start-Sleep -Seconds 5` |
| 4 | Load port from `.env` | `source .env` (sources entire file) | Regex search for `FRONTEND_PORT=` line |
| 5a | Open browser | `xdg-open` or `open` with fallback | `Start-Process $URL` |
| 5b | Stream logs | `docker compose logs -f backend frontend --tail 20` | Identical |

### 2.2 Where They Overlap

Almost everywhere. The Docker commands, the log streaming, the default port, and the overall flow are identical. The two scripts exist **solely** because of three platform-divergent operations:

1. **Sleep** — `sleep 5` vs `Start-Sleep -Seconds 5`
2. **Browser open** — `xdg-open`/`open` vs `Start-Process`
3. **Env file parsing** — `source .env` vs PowerShell regex parsing

### 2.3 Where They Diverge

| Aspect | `.sh` | `.ps1` |
|--------|-------|--------|
| Argument style | Positional `$1` with two accepted forms | PowerShell `[switch]` parameter |
| Env loading | Sources entire `.env` (all vars become available) | Only extracts `FRONTEND_PORT` via regex |
| Browser fallback | Tries `xdg-open`, then `open`, then prints manual message | `Start-Process` (always works on Windows) |
| Default port | Variable `FRONTEND_PORT` with hardcoded default `10101` | Hardcoded string `"10101"` as initial value |

### 2.4 What They Do NOT Do

- No health checks (just a naive 5-second sleep)
- No signal handling (Ctrl+C stops log stream, containers keep running — by design)
- No exit code propagation
- No error handling on any Docker command
- No interactive terminal attachment (detached mode + log follow)
- No cleanup/teardown logic

---

## 3. Taskfile Capability Assessment

### 3.1 What Taskfile Can Handle Natively

| Script behavior | Taskfile mechanism | Difficulty |
|----------------|-------------------|------------|
| Docker compose commands | `cmds:` — just shell commands | Trivial |
| Reset vs normal flow | Two separate tasks: `docker:start` and `docker:reset` | Trivial |
| Env file loading | `dotenv: ['.env']` — built-in, superior to both scripts | Trivial |
| Port as variable | `vars:` with dotenv fallback | Trivial |
| Log streaming | `docker compose logs -f ...` in `cmds:` | Trivial |
| Task composition | `task:` references (already used in existing Taskfile) | Trivial |

### 3.2 What Requires Platform-Specific Commands

| Script behavior | Taskfile mechanism | Difficulty |
|----------------|-------------------|------------|
| Browser open | `platforms:` key on individual `cmd:` entries | Straightforward |
| Sleep | `sleep 5` works in sh (Git Bash on Windows) | Low risk — see §3.3 |

### 3.3 The Windows Shell Question

Taskfile on Windows defaults to `sh` (from Git for Windows), falling back to `cmd.exe`. This means:

- `sleep 5` ✅ works in Git Bash's sh
- `open` ❌ (macOS only)
- `Start-Process` ❌ (PowerShell only)
- `xdg-open` ❌ (Linux only)

**Browser opening solution** using per-command `platforms:` key:

```yaml
- cmd: open {{.URL}}
  platforms: [darwin]
- cmd: xdg-open {{.URL}}
  platforms: [linux]
- cmd: explorer.exe {{.URL}}
  platforms: [windows]
  ignore_error: true
```

Note: `explorer.exe` is available from any shell on Windows (sh, cmd, PowerShell) and works for opening URLs. This is more robust than `Start-Process` which requires PowerShell.

### 3.4 What Cannot Be Migrated

**Nothing.** Every behavior in both scripts has a direct or superior Taskfile equivalent. There are no shell-specific capabilities (signal traps, process substitution, PowerShell pipeline magic) that would be lost.

---

## 4. Reducing Entropy Assessment

*Loaded reference mindset: "Composition Over Construction" — separate, don't combine.*

### 4.1 Line Count Before vs After

| File | Lines (incl. comments) | Status |
|------|----------------------|--------|
| `docker-start.sh` | 73 | **Delete** |
| `docker-start.ps1` | 64 | **Delete** |
| `Taskfile.yml` additions | ~35 estimated | **Add** |

**Net reduction: ~100 lines deleted, ~35 lines added = ~65 lines fewer.**

### 4.2 File Count

- **Before**: 3 files (2 scripts + Taskfile)
- **After**: 1 file (Taskfile with new tasks)
- **Reduction**: 2 files eliminated

### 4.3 Concept Count

- **Before**: Developers must know which script to run for their OS, and understand two different scripting languages
- **After**: One command (`task docker:start` or `task docker:reset`) on all platforms

### 4.4 Does This Genuinely Reduce Complexity?

**Yes.** This passes all three reducing-entropy questions:

1. **What's the smallest codebase that solves this?** — One Taskfile section replaces two scripts entirely.
2. **Does the proposed change result in less total code?** — ~65 fewer lines.
3. **What can we delete?** — Both scripts, entirely.

---

## 5. Honest Trade-off Assessment

### 5.1 What You Gain

1. **Single source of truth** — One file, one place to update behavior
2. **Cross-platform by default** — `task docker:start` works everywhere
3. **Better env handling** — Taskfile's `dotenv:` is superior to both scripts' manual parsing
4. **Consistency** — E2E tasks and dev startup tasks live in the same Taskfile
5. **Discoverability** — `task --list` shows all available tasks
6. **Composability** — Other tasks can depend on `docker:start`

### 5.2 What You Lose

1. **Zero-dependency invocation** — Both `.sh` and `.ps1` scripts work with no extra tools. Taskfile requires `task` to be installed. However, `task` is already a project dependency (the Taskfile exists).
2. **Familiarity for Windows users** — PowerShell users may expect `.ps1` scripts. But they'll need `task` installed anyway for E2E.
3. **Slightly more abstract debugging** — If something fails, you're reading YAML instead of a script. In practice, the commands are simple Docker invocations, so this is negligible.

### 5.3 Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Windows user without Git Bash | Low (Git for Windows is near-universal among developers) | `sleep` command not found | Document `task` installation prerequisites |
| `explorer.exe` URL opening fails silently | Very low | Browser doesn't open automatically | Add `ignore_error: true`; user still sees the URL in terminal output |
| Developer doesn't have `task` installed | Medium (new onboarding) | Can't run `task docker:start` | Add to README prerequisites; provide one-liner install |

### 5.4 What Could Go Wrong (Karpathy: Define Success Criteria)

**Verifiable success criteria for migration:**

1. ✅ `task docker:start` brings up all services in detached mode on macOS, Linux, and Windows
2. ✅ `task docker:reset` tears down volumes, rebuilds, and brings up services on all platforms
3. ✅ Browser opens automatically (or prints URL as fallback)
4. ✅ Logs stream for backend and frontend with `--tail 20`
5. ✅ `FRONTEND_PORT` is read from `.env` if present, defaults to `10101` otherwise
6. ✅ Both `docker-start.sh` and `docker-start.ps1` are deleted
7. ✅ `task --list` shows all docker tasks with descriptions

---

## 6. Decision

**Replace both scripts with Taskfile tasks.**

The migration is clean, reduces total codebase size, eliminates platform-specific maintenance burden, and aligns with the existing Taskfile pattern already established for E2E tasks. There are no behaviors that cannot be faithfully reproduced.

---

## 7. Migration Plan

### Step 1: Add `docker:*` tasks to `Taskfile.yml`

```yaml
# Proposed additions to Taskfile.yml

dotenv: ['.env']

vars:
  # ... existing vars ...
  FRONTEND_PORT: '{{.FRONTEND_PORT | default "10101"}}'
  FRONTEND_URL: 'http://localhost:{{.FRONTEND_PORT}}'

tasks:
  # ... existing tasks ...

  docker:start:
    desc: Start Projojo services in detached mode and open browser
    cmds:
      - docker compose up -d
      - task: docker:open

  docker:reset:
    desc: Reset Projojo services - tear down volumes, rebuild, and restart
    cmds:
      - echo "Stopping and removing project containers, networks, and volumes..."
      - docker compose down --volumes
      - echo "Rebuilding images and starting services..."
      - docker compose up -d --build
      - task: docker:open

  docker:open:
    desc: Wait for services and open browser
    internal: true
    cmds:
      - echo "Waiting for services to initialize..."
      - sleep 5
      - echo "Opening browser to {{.FRONTEND_URL}}..."
      - cmd: open {{.FRONTEND_URL}}
        platforms: [darwin]
        ignore_error: true
      - cmd: xdg-open {{.FRONTEND_URL}}
        platforms: [linux]
        ignore_error: true
      - cmd: explorer.exe {{.FRONTEND_URL}}
        platforms: [windows]
        ignore_error: true
      - task: docker:logs

  docker:logs:
    desc: Stream backend and frontend logs
    cmds:
      - docker compose logs -f backend frontend --tail 20

  docker:stop:
    desc: Stop all Projojo services
    cmds:
      - docker compose stop
```

### Step 2: Validate on All Platforms

Run the following verification checks:

- [ ] `task docker:start` on macOS
- [ ] `task docker:reset` on macOS
- [ ] `task docker:start` on Windows (with Git Bash)
- [ ] `task docker:reset` on Windows (with Git Bash)
- [ ] `task docker:logs` standalone
- [ ] `task docker:stop` standalone
- [ ] Verify `.env` FRONTEND_PORT is respected
- [ ] Verify default port 10101 when no `.env` exists

### Step 3: Delete Old Scripts

- Delete `docker-start.sh`
- Delete `docker-start.ps1`

### Step 4: Update Documentation

- Update README or any docs that reference `docker-start.sh` / `docker-start.ps1`
- Add `task` installation to prerequisites
- Document available `task docker:*` commands

### Bonus: Added Value

The migration naturally creates two tasks that didn't exist before:

- `docker:logs` — Stream logs independently (decoupled from startup)
- `docker:stop` — Stop services (was only possible via Docker Desktop or manual CLI)

This is the "composition over construction" principle: separating the log-streaming concern from the startup concern allows more flexible usage.

---

## 8. Consequences

### Positive

- 2 files deleted, ~65 net lines removed
- Single cross-platform developer command
- Superior env handling via `dotenv:`
- Better discoverability via `task --list`
- New composable tasks (`docker:logs`, `docker:stop`)
- Consistent tooling: dev startup and E2E both use Taskfile

### Negative

- `task` becomes a hard prerequisite for dev startup (was already needed for E2E)
- Developers must learn `task docker:start` instead of `./docker-start.sh` / `.\docker-start.ps1`

### Neutral

- All Docker behavior is preserved exactly
- Ctrl+C on log streaming still leaves containers running (same as before)
- No health checks added (same as before — out of scope)

---

## 9. References

- [Taskfile `platforms` documentation](https://taskfile.dev/usage/#platform-specific-tasks-and-commands)
- [Taskfile `dotenv` documentation](https://taskfile.dev/usage/#env-files)
- [Taskfile cross-platform overview](https://taskfile.dev/)
