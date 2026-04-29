---
name: github-issue-manager
description: Manage GitHub Projects v2 issues and board state through the bundled github-issue-manager.sh script. Use this whenever the user needs repeatable issue creation, epic/story/task hierarchy, sub-issue linking, board triage, story inspection, review-state progression, or disciplined status changes instead of ad-hoc gh issue or gh project mutations.
compatibility:
  - bash
  - gh
  - jq
---

# GitHub Issue Manager

Use this skill to manage GitHub Projects v2 work through the bundled script `github-issue-manager.sh`.

Find the «script-dir» by checking the following directories in order, for the existence of `github-issue-manager.sh`, stopping at the first success:

  1. .agents/skills/github-issue-manager/scripts/
  2. .roo/skills/github-issue-manager/scripts/
  3. .claude/skills/github-issue-manager/scripts/
  4. .cursor/skills/github-issue-manager/scripts/
  5. .junie/skills/github-issue-manager/scripts/
  6. .kilocode/skills/github-issue-manager/scripts/
  7. .kilo/skills/github-issue-manager/scripts/
  8. ~/.agents/skills/github-issue-manager/scripts/
  9. ~/.roo/skills/github-issue-manager/scripts/
  10. ~/.claude/skills/github-issue-manager/scripts/
  11. ~/.codex/skills/github-issue-manager/scripts/
  12. ~/.cursor/skills/github-issue-manager/scripts/
  13. ~/.junie/skills/github-issue-manager/scripts/
  14. ~/.kilocode/skills/github-issue-manager/scripts/
  15. ~/.kilo/skills/github-issue-manager/scripts/
  16. ~/.config/agents/skills/github-issue-manager/scripts/

## Default rules

- Use the bundled script for issue creation, parent-child linking, project membership, and status changes.
- Do not replace this workflow with raw `gh` mutations unless the user explicitly asks for manual commands.
- Create new work in `Backlog`.
- Move work to `Done` only at final acceptance.
- Treat script warnings as unfinished work. Repair them before the next mutation.
- Do not assume labels imply hierarchy or board state.

## Preflight: run before any mutation

Stop and explain the problem before changing anything if any item below fails:

- `github-project.env` is missing
- `GH_REPO` is missing or not in `owner/repo` format
- `PROJECT_BOARD_NAME` is missing
- `COLUMNS` is missing or empty
- `gh` is unavailable
- `jq` is unavailable
- `gh auth status` fails
- the authenticated GitHub token is missing any of `repo`, `read:org`, or `project`
- the authenticated user cannot create or update the project board or project fields

Required config file "github-project.env" in project root:

```bash
GH_REPO="owner/repo"
PROJECT_BOARD_NAME="Engineering Board"
COLUMNS="Backlog,Ready,In Progress,AI Review,Review,Done"
```

The bundled script searches upward for `github-project.env` from the current directory and from the script location.

Before mutating anything, confirm the GitHub CLI session has the required scopes:

```bash
gh auth status
```

This workflow expects at least:

- `repo`
- `read:org`
- `project`

`project` is the project-mutation scope this workflow needs. That scope check is necessary but not sufficient: the authenticated user can still lack permission on the target owner or board to create the project, create the `Status` field, or update field options.

If any are missing, refresh the token with:

```bash
gh auth refresh -h github.com -s repo,read:org,project
```

If refresh is unavailable or the auth session is broken, re-run login with the required scopes:

```bash
gh auth login -h github.com -s repo,read:org,project
```

Re-run `gh auth status` after refreshing or logging in again, then continue only when all required scopes are present.

If a later project or field mutation fails because the authenticated user lacks permission on the target owner or board, stop, explain the permission problem, and do not continue with more mutations.

Canonical invocation:

```bash
bash «script-dir»/github-issue-manager.sh «command» ...
```

Immediately after activating this skill, run the following command to learn the exact syntax the script uses for all commands.

```bash
bash «script-dir»/github-issue-manager.sh help
```

## Choose the command using this decision guide:

- Need to inspect open story work before creating or continuing work: use `list-stories`
- Need full context for an epic, story, or task before implementation or review: use `get-issue-context`
- Need a top-level grouping issue: use `create-epic`
- Need a user-facing or deliverable unit of work: use `create-story`
- Need an implementation task under a story: use `create-task` with `--story-number` or `--story-title`
- Need a cross-cutting task without a story parent: use `create-task` without `--story-number`, `--story-title`, or `--story-slug`
- Need to advance or correct board state: use `update-status`

## Standard workflow

### 1. Inspect before creating work

Before creating the next story, inspect existing stories:

```bash
bash «script-dir»/github-issue-manager.sh list-stories
```

The `list-stories` response omits issue body text. Each story item includes its issue number, title, labels, state, URL, assignees, milestone, parent issue summary, and sub-issue summaries. Parent and sub-issue summaries include issue number and title only.

Use a filter if needed:

```bash
bash «script-dir»/github-issue-manager.sh list-stories --filter "label:story state:open"
```

If earlier work is incomplete, surface it and wait for user approval before creating more work.

### 2. Inspect issue context before implementation or review

```bash
bash «script-dir»/github-issue-manager.sh get-issue-context --issue-number 456
```

You can also resolve an epic, story, or task by part of its title:

```bash
bash «script-dir»/github-issue-manager.sh get-issue-context --issue-title "Login form"
```

Title matching is case-insensitive substring matching over all issue states. If multiple issues match, the script emits a warning with candidates and selects the open issue with the lowest issue number. If multiple issues match but none are open, the command fails with a JSON error listing the candidates.

Use the returned JSON as the working context for issue type, parent and child relationships, acceptance criteria, linked issues, linked issue details, sub-issues, and file-list comments.

### 3. Create work with explicit hierarchy

Create epic:

```bash
bash «script-dir»/github-issue-manager.sh create-epic --title "Epic title" --body "Epic body" --epic-slug "epic-slug"
```

Create story under an epic (123 is the epic's issue number on GitHub):

```bash
bash «script-dir»/github-issue-manager.sh create-story --title "Story title" --body "Story body" --story-slug "story-slug" --epic-number 123
```

Create story under an epic by partial epic title:

```bash
bash «script-dir»/github-issue-manager.sh create-story --title "Story title" --body "Story body" --story-slug "story-slug" --epic-title "Foundation"
```

Create standalone story:

```bash
bash «script-dir»/github-issue-manager.sh create-story --title "Story title" --body "Story body" --story-slug "story-slug"
```

Create task under a story (456 is the story's issue number on github):

```bash
bash «script-dir»/github-issue-manager.sh create-task --title "Task title" --body "Task body" --story-number 456
```

Create task under a story by partial story title:

```bash
bash «script-dir»/github-issue-manager.sh create-task --title "Task title" --body "Task body" --story-title "Login"
```

Create standalone or cross-cutting task:

```bash
bash «script-dir»/github-issue-manager.sh create-task --title "Task title" --body "Task body"
```

Hierarchy rules:

- When a story belongs to an epic, create it with `--epic-number` or `--epic-title`.
- When a task belongs to a story, create it with `--story-number` or `--story-title`.
- Parent slugs are inferred from `epic:«slug»` and `story:«slug»` labels when possible.
- Do not rely on labels or project placement to create parent-child links.
- Verify the parent-child relationship succeeded before creating more work.

### 4. Moving work through the board

```bash
bash «script-dir»/github-issue-manager.sh update-status --issue-number 456 --status "In Progress"
```

Or by partial title:

```bash
bash «script-dir»/github-issue-manager.sh update-status --issue-title "Login form" --status "In Progress"
```

456 is the issue number on GitHub.

Preferred lifecycle unless the repository defines a different one:

```text
Backlog → Ready → In Progress → AI Review → Review → Done
```

## Verification and repair loop

After every mutation, inspect stdout as JSON.

Expected success keys:

- epic creation: `epic_number`
- story creation: `story_number`
- task creation: `task_number`
- status change: `success`, `item_id`, `requested_status`, `applied_status`, `issue_state`
- list query: array result with metadata, or an empty result object
- issue context: structured JSON with issue type, metadata, parsed sections, parent-child relationships, linked issues, sub-issues, and file-list comments

If the script emits warnings, stop and repair the warning state before continuing. Common partial-success states:

- issue created but not added to project
- issue added to project but initial status not set
- parent-child relationship failed
- requested status not available on the board

Do not continue with more mutations until these are repaired.

## Slug rules

When creating epic, story, and task slugs:

- derive the slug from the issue title
- use lowercase
- use hyphens instead of spaces
- use only alphanumeric characters and hyphens
- use well-known abbreviations where useful, for example `auth`
- omit common stop words such as `the`, `and`, and `of`
- never pass a purely numeric slug

Length limits:

- epic slug: max 20 characters
- story slug: max 30 characters
- task slug: max 30 characters

The bundled script rejects purely numeric slugs. Do not confuse issue numbers with slugs.

## Issue hygiene defaults

- Record ongoing execution history in comments, not repeated issue-body rewrites.
- Record progress updates in comments.
- Record completion notes in comments.
- Maintain a File List in comments with added, modified, and deleted files.
- Maintain a Change Log in comments when follow-up fixes are applied.
- Do not rename or rewrite issue titles or bodies just to track routine progress.
- Keep stories and tasks small enough to stay reviewable and movable across the board.
- Do not apply that size constraint to epics.

## Labels and status field behavior

Script-managed labels you can rely on:

- `epic`
- `story`
- `task`
- `epic:«slug»`
- `story:«slug»`

Do not assume other workflow labels are script-managed.

Status field behavior:

- If the project `Status` field does not exist, the script creates it.
- If configured values from `COLUMNS` are missing, the script adds them.
- Existing extra status options are preserved.
- This requires GitHub project mutation permissions.

## Guardrails

- Never pass numeric slugs.
- Never use older positional examples. Public commands are flag-only.
- Use `--epic-number` or `--epic-title` for parent epics.
- Use `--story-number` or `--story-title` for parent stories.
- Never assume labels reflect actual board status.
- Never move an issue to `Done` if it still needs review.
- Never skip an incomplete earlier story without explicit user approval.

## Reference syntax

Immediately after activating this skill, run the following command to learn the exact syntax the script uses for all commands.

```bash
bash «script-dir»/github-issue-manager.sh help
