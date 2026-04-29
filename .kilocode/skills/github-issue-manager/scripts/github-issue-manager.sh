#!/bin/bash
# GitHub Issue Management Tool
# Manages GitHub issues, project boards, and issue relationships using github-project.env

VERSION="1.1.0"
SCRIPT_NAME="github-issue-manager.sh"
ROOT_CONFIG_NAME="github-project.env"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Global variables (will be set by load_config)
REPO=""
REPO_OWNER=""
REPO_NAME=""
PROJECT_BOARD_NAME=""
CONFIG_FILE=""
PROJECT_ROOT=""
PROJECT_ID=""
PROJECT_NUMBER=""
STATUS_FIELD_ID=""
BACKLOG_OPTION_ID=""
BACKLOG_OPTION_NAME=""
STATUS_COLUMNS=""

#=============================================================================
# UTILITY FUNCTIONS
#=============================================================================

print_usage() {
    cat << EOF
GitHub Issue Manager v${VERSION}

Manages GitHub issues, project boards, and parent-child relationships
for a three-level hierarchy: epics > stories > tasks.

DEPENDENCIES:
    gh      GitHub CLI, authenticated with scopes: repo, read:org, project
    jq      Command-line JSON processor

    Check auth: gh auth status
    Fix auth:   gh auth refresh -h github.com -s repo,read:org,project

SETUP:
    Create a file called ${ROOT_CONFIG_NAME} in your project root:

        GH_REPO="owner/repo"
        PROJECT_BOARD_NAME="My Board"
        COLUMNS="Backlog,Ready,In Progress,AI Review,Review,Done"

    GH_REPO              Owner and repo name (e.g. "myorg/myapp").
    PROJECT_BOARD_NAME   Title of the GitHub Projects v2 board.
                         Created automatically if it does not exist.
    COLUMNS              Comma-separated status values for the board's
                         Status field. "Backlog" and "Done" are always
                         added even if omitted. The Status field and any
                         missing options are created automatically.

    The script searches upward from the current directory for this file.
    If not found, it also searches upward from the script's own directory.

USAGE:
    ${SCRIPT_NAME} <command> [flags]

    All commands use named flags. Positional arguments are rejected.

COMMANDS:

  create-epic
      --title <title>       Issue title (required)
      --body <body>         Issue body (required)
      --epic-slug <slug>    Slug for the epic: label (required)

      Creates a GitHub issue labeled "epic" and "epic:<slug>", adds it
      to the project board, and sets its status to Backlog.

      Output (stdout): {"epic_number": <num>}

  create-story
      --title <title>       Issue title (required)
      --body <body>         Issue body (required)
      --story-slug <slug>   Slug for the story: label (required)
      --epic-number <num>   Link to parent epic by issue number
      --epic-title <frag>   Link to parent epic by title fragment
      --epic-slug <slug>    Override the parent epic's slug

      Creates a GitHub issue labeled "story" and "story:<slug>". If a
      parent epic is given, also labels it "epic:<slug>" and creates a
      sub-issue relationship.

      --epic-number and --epic-title are mutually exclusive. When either
      is used, the epic's slug is read from its "epic:<slug>" label
      unless --epic-slug is also provided.

      Output (stdout): {"story_number": <num>}

  create-task
      --title <title>       Issue title (required)
      --body <body>         Issue body (required)
      --story-number <num>  Link to parent story by issue number
      --story-title <frag>  Link to parent story by title fragment
      --story-slug <slug>   Override the parent story's slug
      --epic-slug <slug>    Add the epic:<slug> label without linking

      Creates a GitHub issue labeled "task". If a parent story is given,
      also labels it "story:<slug>" and creates a sub-issue relationship.
      When linking to a story, the story's "story:<slug>" and
      "epic:<slug>" labels are read automatically unless overridden.

      --story-number and --story-title are mutually exclusive.
      --epic-slug alone (without --story-*) adds the epic label only.

      Output (stdout): {"task_number": <num>}

  update-status
      --issue-number <num>  Identify issue by number
      --issue-title <frag>  Identify issue by title fragment
      --status <status>     Target status column (required)

      Sets the Status field on the project board. The issue is added to
      the board automatically if it is not already there.

      --issue-number and --issue-title are mutually exclusive; one is
      required.

      Status must match a configured COLUMNS value. Legacy aliases:
      "Todo" and "Next Milestone" both map to "Backlog".

      Side effects:
        - Setting status to "Done" closes the issue on GitHub.
        - Moving a closed issue to any other status reopens it.

      Output (stdout):
        {"success": "...", "item_id": "...", "requested_status": "...",
         "applied_status": "...", "issue_state": "OPEN"|"CLOSED"}

  list-stories
      --filter <filter>     Filter string (default: "label:story state:open")

      Lists issues matching the filter. The filter string supports
      "label:<name>" and "state:<open|closed|all>" tokens, space-separated.
      If no recognized tokens are found, defaults to stories in open state.

      Each item includes: number, title, labels, state, url, assignees,
      milestone, parent (number + title or null), and sub_issues (array
      of number + title). Issue body text is not included.

      Results are limited to 50 issues. The last array element is a
      _metadata object with the filter used and the count.

      Output (stdout): JSON array

  get-issue-context
      --issue-number <num>  Identify issue by number
      --issue-title <frag>  Identify issue by title fragment

      Returns detailed JSON for any issue type (epic, story, task, or
      unmanaged). Includes: metadata, parsed body sections (Story,
      Acceptance Criteria, Tasks, Dev Notes), parent-child relationships
      via both labels and the GitHub sub-issue API, linked issues with
      details, sibling tasks, related stories/tasks, and file-list
      comments.

      --issue-number and --issue-title are mutually exclusive; one is
      required.

      Output (stdout): JSON object

  help, -h, --help       Show this help text.
  version, -v, --version  Show version string.

TITLE MATCHING:
    Flags named --*-title or --issue-title resolve an issue by searching
    for the given substring in issue titles. The search covers all issue
    states (open and closed) and is case-insensitive.

    Parent-scoped flags are label-filtered:
      --epic-title   only matches issues with the "epic" label
      --story-title  only matches issues with the "story" label

    Generic --issue-title matches any issue regardless of labels.

    Resolution rules:
      - 1 match:   used directly.
      - >1 match:  warning printed to stderr listing all candidates;
                    the open issue with the lowest number is selected.
      - >1 match, none open: command fails with a JSON error on stderr
                    listing all candidates.
      - 0 matches: command fails with a JSON error on stderr.

SLUGS:
    Slugs are short identifiers used in label names (e.g. "epic:foundation").
    Rules:
      - Lowercase, hyphens instead of spaces, alphanumeric + hyphens only.
      - Must contain at least one non-numeric character (purely numeric
        slugs like "42" are rejected to prevent issue-number mix-ups).
      - Epic slugs: max 20 characters.
      - Story slugs: max 30 characters.
    Tip: derive from the title, abbreviate where obvious (e.g. "auth"
    for "authentication"), drop stop words ("the", "and", "of").

LABELS:
    The script creates these labels automatically as needed:
      epic             Applied to all epics.
      story            Applied to all stories.
      task             Applied to all tasks.
      epic:<slug>      Groups an epic with its stories and tasks.
      story:<slug>     Groups a story with its tasks.

OUTPUT:
    Successful commands print JSON to stdout. Progress and warnings go
    to stderr with colored prefixes ([INFO], [SUCCESS], [WARNING]).
    Errors print a JSON object to stderr and exit with code 1.

    All commands are flag-only. Passing positional arguments prints an
    error and exits.

EXAMPLES:
    # Create an epic
    ${SCRIPT_NAME} create-epic --title "Foundation" --body "Setup base" --epic-slug "foundation"

    # Story under an epic (by number)
    ${SCRIPT_NAME} create-story --title "User Auth" --body "Login" --story-slug "user-auth" --epic-number 15

    # Story under an epic (by title fragment)
    ${SCRIPT_NAME} create-story --title "User Auth" --body "Login" --story-slug "user-auth" --epic-title "Foundation"

    # Standalone story
    ${SCRIPT_NAME} create-story --title "Bug Fix" --body "Fix timeout" --story-slug "login-fix"

    # Task under a story (by number)
    ${SCRIPT_NAME} create-task --title "Validation" --body "Client checks" --story-number 16

    # Task under a story (by title fragment)
    ${SCRIPT_NAME} create-task --title "Validation" --body "Client checks" --story-title "User Auth"

    # Task with epic label only (no story link)
    ${SCRIPT_NAME} create-task --title "CI pipeline" --body "Actions setup" --epic-slug "foundation"

    # Standalone task
    ${SCRIPT_NAME} create-task --title "Quick fix" --body "Patch security issue"

    # Update status
    ${SCRIPT_NAME} update-status --issue-number 42 --status "In Progress"
    ${SCRIPT_NAME} update-status --issue-title "Validation" --status "Done"

    # List stories
    ${SCRIPT_NAME} list-stories
    ${SCRIPT_NAME} list-stories --filter "label:epic state:all"

    # Get issue context
    ${SCRIPT_NAME} get-issue-context --issue-number 42
    ${SCRIPT_NAME} get-issue-context --issue-title "User Auth"
EOF
}

print_version() {
    echo "${SCRIPT_NAME} v${VERSION}"
    echo "Standalone GitHub Issue Management for project boards"
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" >&2
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" >&2
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" >&2
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

output_json() {
    echo "$1"
}

output_error() {
    jq -n --arg error "$1" '{error: $error}' >&2
    exit 1
}

output_error_json() {
    echo "$1" >&2
    exit 1
}

is_valid_json() {
    local value="$1"
    [ -n "$value" ] && printf '%s\n' "$value" | jq -e . >/dev/null 2>&1
}

ensure_json_or_default() {
    local value="$1"
    local default_json="$2"

    if is_valid_json "$value"; then
        printf '%s\n' "$value"
    else
        printf '%s\n' "$default_json"
    fi
}

issue_summary_jq_filter() {
    cat <<'JQ'
{
    number: .number,
    title: .title,
    state: .state,
    url: .url,
    labels: [.labels[].name?],
    issue_type: (
        ([.labels[].name?]) as $labels |
        if ($labels | index("epic")) then "epic"
        elif ($labels | index("story")) then "story"
        elif ($labels | index("task")) then "task"
        else "issue"
        end
    ),
    slugs: {
        epic: ([.labels[].name? | select(startswith("epic:")) | sub("^epic:"; "")] | first // null),
        story: ([.labels[].name? | select(startswith("story:")) | sub("^story:"; "")] | first // null)
    }
}
JQ
}

issue_summary_from_json() {
    jq -c "$(issue_summary_jq_filter)"
}

require_flag_value() {
    local flag="$1"
    local remaining_count="$2"

    if [ "$remaining_count" -lt 2 ]; then
        output_error "$flag requires a value"
    fi
}

reject_positional_arg() {
    local command_name="$1"
    local arg="$2"

    output_error "Unexpected positional argument for $command_name: $arg. This command uses flags only. Run: $SCRIPT_NAME help"
}

require_one_issue_ref() {
    local command_name="$1"
    local number_flag="$2"
    local number_value="$3"
    local title_flag="$4"
    local title_value="$5"

    if [ -n "$number_value" ] && [ -n "$title_value" ]; then
        output_error "$command_name accepts either $number_flag or $title_flag, not both"
    fi

    if [ -z "$number_value" ] && [ -z "$title_value" ]; then
        output_error "$command_name requires either $number_flag <num> or $title_flag <fragment>"
    fi
}

validate_issue_number() {
    local issue_num="$1"
    local flag_name="$2"

    if ! [[ "$issue_num" =~ ^[0-9]+$ ]]; then
        output_error "Invalid $flag_name: $issue_num. Must be numeric."
    fi
}

resolve_issue_ref() {
    local number_value="$1"
    local title_fragment="$2"
    local required_label="$3"
    local ref_description="$4"

    if [ -z "$REPO" ]; then
        load_config
    fi

    if [ -n "$number_value" ]; then
        validate_issue_number "$number_value" "issue number"

        local issue_data
        issue_data=$(gh issue view "$number_value" --repo "$REPO" --json number,title,state,url,labels 2>&1)
        if [ $? -ne 0 ]; then
            output_error "Issue #$number_value not found in repo $REPO"
        fi

        if ! is_valid_json "$issue_data"; then
            output_error "Issue #$number_value not found or invalid response from GitHub"
        fi

        if [ -n "$required_label" ]; then
            if ! printf '%s\n' "$issue_data" | jq -e --arg label "$required_label" '[.labels[].name?] | index($label)' >/dev/null 2>&1; then
                output_error "Issue #$number_value is not labeled $required_label"
            fi
        fi

        printf '%s\n' "$issue_data" | issue_summary_from_json
        return 0
    fi

    if [ -z "$title_fragment" ]; then
        output_error "Missing title fragment for $ref_description"
    fi

    local title_query="$title_fragment"
    if [ -n "$required_label" ]; then
        title_query="$title_query label:$required_label"
    fi

    local search_output
    search_output=$(gh issue list --repo "$REPO" --search "$title_query" --state all --limit 100 --json number,title,state,url,labels 2>&1)
    if [ $? -ne 0 ]; then
        output_error "Failed to search issues by title for $ref_description: $search_output"
    fi

    if ! is_valid_json "$search_output"; then
        output_error "Invalid JSON response while searching issues by title for $ref_description"
    fi

    local matches
    matches=$(printf '%s\n' "$search_output" | jq -c --arg fragment "$title_fragment" --arg label "$required_label" '
        map(select((.title // "" | ascii_downcase | contains($fragment | ascii_downcase))))
        | if $label == "" then . else map(select([.labels[].name?] | index($label))) end
        | map({
            number: .number,
            title: .title,
            state: .state,
            url: .url,
            labels: [.labels[].name?],
            issue_type: (
                ([.labels[].name?]) as $labels |
                if ($labels | index("epic")) then "epic"
                elif ($labels | index("story")) then "story"
                elif ($labels | index("task")) then "task"
                else "issue"
                end
            ),
            slugs: {
                epic: ([.labels[].name? | select(startswith("epic:")) | sub("^epic:"; "")] | first // null),
                story: ([.labels[].name? | select(startswith("story:")) | sub("^story:"; "")] | first // null)
            }
        })')

    matches=$(ensure_json_or_default "$matches" "[]")

    local match_count
    match_count=$(printf '%s\n' "$matches" | jq 'length')

    if [ "$match_count" -eq 0 ]; then
        local error_json
        error_json=$(jq -n \
            --arg error "No issue found for title fragment" \
            --arg fragment "$title_fragment" \
            --arg required_label "$required_label" \
            --arg ref "$ref_description" \
            '{error: $error, reference: $ref, fragment: $fragment, required_label: (if $required_label == "" then null else $required_label end), candidates: []}')
        output_error_json "$error_json"
    fi

    if [ "$match_count" -eq 1 ]; then
        printf '%s\n' "$matches" | jq -c '.[0]'
        return 0
    fi

    local open_match_count
    open_match_count=$(printf '%s\n' "$matches" | jq '[.[] | select(.state == "OPEN")] | length')

    if [ "$open_match_count" -eq 0 ]; then
        local no_open_error
        no_open_error=$(jq -n \
            --arg error "Multiple title matches found, but none are open" \
            --arg fragment "$title_fragment" \
            --arg required_label "$required_label" \
            --arg ref "$ref_description" \
            --argjson candidates "$matches" \
            '{error: $error, reference: $ref, fragment: $fragment, required_label: (if $required_label == "" then null else $required_label end), candidates: $candidates}')
        output_error_json "$no_open_error"
    fi

    local selected
    selected=$(printf '%s\n' "$matches" | jq -c '[.[] | select(.state == "OPEN")] | sort_by(.number) | .[0]')
    local selected_number
    selected_number=$(printf '%s\n' "$selected" | jq -r '.number')

    local warning_json
    warning_json=$(jq -n \
        --arg message "Multiple title matches found; selecting open issue with the lowest issue number" \
        --arg fragment "$title_fragment" \
        --arg required_label "$required_label" \
        --arg selected_number "$selected_number" \
        --argjson candidates "$matches" \
        '{message: $message, fragment: $fragment, required_label: (if $required_label == "" then null else $required_label end), selected_number: ($selected_number | tonumber), candidates: $candidates}')
    log_warning "$warning_json"

    printf '%s\n' "$selected"
}

# Cache for existing labels to avoid redundant API calls (bash 3.x compatible)
# Uses a newline-separated string instead of associative arrays
LABEL_CACHE=""

# Check if label exists (uses cache)
label_exists() {
    local label_name="$1"

    # Check cache first (grep for exact match with delimiters)
    if echo "$LABEL_CACHE" | grep -qFx "$label_name"; then
        return 0
    fi

    # Query GitHub API
    if gh label list --repo "$REPO" --json name 2>/dev/null | jq -e --arg name "$label_name" '.[] | select(.name == $name)' >/dev/null 2>&1; then
        # Add to cache
        LABEL_CACHE="${LABEL_CACHE}${label_name}"$'\n'
        return 0
    else
        return 1
    fi
}

# Validate that a slug is not purely numeric (common AI agent mistake)
validate_slug() {
    local slug="$1"
    local slug_type="$2"  # "epic" or "story" for error messages
    
    # Allow empty slugs (they're handled elsewhere)
    if [ -z "$slug" ]; then
        return 0
    fi
    
    # Reject purely numeric slugs - this is likely an issue number passed by mistake
    if [[ "$slug" =~ ^[0-9]+$ ]]; then
        log_warning "Invalid ${slug_type}_slug: '$slug' appears to be an issue number, not a semantic slug."
        log_warning "Slugs should be descriptive (e.g., 'user-auth', 'foundation') not issue numbers."
        log_warning "Check that you're passing the correct parameters to the script."
        output_error "Invalid ${slug_type}_slug: '$slug'. Slugs must contain at least one letter or hyphen, not be purely numeric. Expected format: 'lowercase-hyphenated-slug'"
    fi
    
    return 0
}

# Create label if it doesn't exist
ensure_label() {
    local label_name="$1"
    local description="$2"
    local color="$3"

    if ! label_exists "$label_name"; then
        if gh label create "$label_name" --description "$description" --color "$color" --repo "$REPO" 2>/dev/null; then
            # Add to cache on successful creation
            LABEL_CACHE="${LABEL_CACHE}${label_name}"$'\n'
        fi
    fi
}

trim_whitespace() {
    echo "$1" | sed 's/^[[:space:]]*//; s/[[:space:]]*$//'
}

append_unique_status_column() {
    local status_name="$1"

    if [ -z "$status_name" ]; then
        return 0
    fi

    if echo "$STATUS_COLUMNS" | grep -qFx "$status_name"; then
        return 0
    fi

    STATUS_COLUMNS="${STATUS_COLUMNS}${status_name}"$'\n'
}

status_columns_to_csv() {
    printf '%s' "$STATUS_COLUMNS" | awk 'NF { out = out ? out "," $0 : $0 } END { print out }'
}

status_columns_to_display() {
    printf '%s' "$STATUS_COLUMNS" | awk 'NF { out = out ? out ", " $0 : $0 } END { print out }'
}

status_columns_to_json() {
    printf '%s' "$STATUS_COLUMNS" | jq -R -s 'split("\n") | map(select(length > 0))'
}

status_is_configured() {
    local status_name="$1"
    echo "$STATUS_COLUMNS" | grep -qFx "$status_name"
}

normalize_requested_status() {
    case "$1" in
        "Todo"|"Next Milestone")
            echo "Backlog"
            ;;
        *)
            echo "$1"
            ;;
    esac
}

status_color_for() {
    case "$1" in
        "Backlog"|"Todo")
            echo "GRAY"
            ;;
        "Ready")
            echo "YELLOW"
            ;;
        "In Progress")
            echo "BLUE"
            ;;
        "AI Review"|"Review")
            echo "PURPLE"
            ;;
        "Done")
            echo "GREEN"
            ;;
        *)
            echo "GRAY"
            ;;
    esac
}

normalize_status_columns() {
    local raw_columns="${COLUMNS:-}"
    STATUS_COLUMNS=""

    if [ -z "$raw_columns" ] || [ "$raw_columns" = "null" ]; then
        output_error "COLUMNS is not configured in $ROOT_CONFIG_NAME"
    fi

    local previous_ifs="$IFS"
    IFS=','
    read -r -a configured_columns <<< "$raw_columns"
    IFS="$previous_ifs"

    local column_name=""
    for column_name in "${configured_columns[@]}"; do
        column_name="$(trim_whitespace "$column_name")"
        append_unique_status_column "$column_name"
    done

    append_unique_status_column "Backlog"
    append_unique_status_column "Done"

    if [ -z "$(status_columns_to_csv)" ]; then
        output_error "COLUMNS did not produce any usable status values"
    fi
}

check_dependencies() {
    local missing_deps=()
    local required_scopes=("repo" "read:org" "project")
    
    if ! command -v jq &> /dev/null; then
        missing_deps+=("jq (install with: brew install jq)")
    fi
    
    if ! command -v gh &> /dev/null; then
        missing_deps+=("gh (install with: brew install gh)")
    fi
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        log_error "Missing dependencies:"
        for dep in "${missing_deps[@]}"; do
            log_error "  - $dep"
        done
        exit 1
    fi
    
    # Check GitHub authentication
    local auth_status_output
    auth_status_output=$(gh auth status 2>&1)

    if [ $? -ne 0 ]; then
        output_error "GitHub CLI not authenticated. Run: gh auth login -h github.com -s repo,read:org,project"
    fi

    local scope_line
    scope_line=$(printf '%s\n' "$auth_status_output" | grep -i "Token scopes:" | head -n 1)

    if [ -z "$scope_line" ]; then
        output_error "Could not determine GitHub token scopes from gh auth status. Run: gh auth refresh -h github.com -s repo,read:org,project and then verify with gh auth status"
    fi

    local normalized_scopes
    normalized_scopes=$(printf '%s\n' "$scope_line" \
        | sed -E 's/.*Token scopes:[[:space:]]*//I' \
        | tr -d "'\"" \
        | tr ',' '\n' \
        | sed 's/^[[:space:]]*//; s/[[:space:]]*$//' \
        | sed '/^$/d')

    local missing_scopes=()
    local required_scope
    for required_scope in "${required_scopes[@]}"; do
        if ! printf '%s\n' "$normalized_scopes" | grep -Fxq "$required_scope"; then
            missing_scopes+=("$required_scope")
        fi
    done

    if [ ${#missing_scopes[@]} -gt 0 ]; then
        local missing_scope_list
        missing_scope_list=$(printf '%s, ' "${missing_scopes[@]}")
        missing_scope_list=${missing_scope_list%, }

        output_error "GitHub authentication is missing required scopes: $missing_scope_list. Run: gh auth refresh -h github.com -s repo,read:org,project. If that fails, run: gh auth login -h github.com -s repo,read:org,project"
    fi
}

#=============================================================================
# CONFIGURATION FUNCTIONS
#=============================================================================

find_project_root() {
    local search_dir="$PWD"

    while [ "$search_dir" != "/" ]; do
        if [ -f "$search_dir/$ROOT_CONFIG_NAME" ]; then
            echo "$search_dir"
            return 0
        fi
        search_dir="$(dirname "$search_dir")"
    done

    local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    search_dir="$script_dir"

    while [ "$search_dir" != "/" ]; do
        if [ -f "$search_dir/$ROOT_CONFIG_NAME" ]; then
            echo "$search_dir"
            return 0
        fi
        search_dir="$(dirname "$search_dir")"
    done

    return 1
}

load_config() {
    check_dependencies

    PROJECT_ROOT="$(find_project_root)"
    if [ -z "$PROJECT_ROOT" ]; then
        output_error "Could not find project root containing $ROOT_CONFIG_NAME"
    fi

    CONFIG_FILE="$PROJECT_ROOT/$ROOT_CONFIG_NAME"
    if [[ ! -f "$CONFIG_FILE" ]]; then
        output_error "$ROOT_CONFIG_NAME not found at $CONFIG_FILE"
    fi

    # shellcheck disable=SC1090
    set -a
    . "$CONFIG_FILE"
    set +a

    REPO="${GH_REPO:-}"
    if [ -z "$REPO" ] || [ "$REPO" = "null" ]; then
        output_error "GH_REPO is not configured in $ROOT_CONFIG_NAME"
    fi

    # Validate repo format (owner/repo)
    if [[ ! "$REPO" =~ ^[^/]+/[^/]+$ ]]; then
        output_error "Invalid repo format. Expected: owner/repo, got: $REPO"
    fi
    
    REPO_OWNER=$(echo "$REPO" | cut -d'/' -f1)
    REPO_NAME=$(echo "$REPO" | cut -d'/' -f2)
    
    # Validate owner and name are not empty
    if [ -z "$REPO_OWNER" ] || [ -z "$REPO_NAME" ]; then
        output_error "Failed to parse repo owner/name from: $REPO"
    fi

    PROJECT_BOARD_NAME="${PROJECT_BOARD_NAME:-}"
    if [ -z "$PROJECT_BOARD_NAME" ] || [ "$PROJECT_BOARD_NAME" = "null" ]; then
        output_error "PROJECT_BOARD_NAME is not configured in $ROOT_CONFIG_NAME"
    fi

    normalize_status_columns
}

#=============================================================================
# PROJECT BOARD FUNCTIONS
#=============================================================================

ensure_project_board() {
    if [ -z "$REPO" ]; then
        load_config
    fi

    local project_name="$PROJECT_BOARD_NAME"

    log_info "Looking for project board with title: $project_name"
    
    # Check if project exists (using new Projects API)
    local project_exists=false
    PROJECT_ID=""
    PROJECT_NUMBER=""
    
    # List organization projects to find existing one
    local projects_response=$(gh project list --owner "$REPO_OWNER" --format json 2>/dev/null)
    if [ $? -eq 0 ] && [ -n "$projects_response" ]; then
        local existing_project=$(echo "$projects_response" | jq -r --arg name "$project_name" '.projects[] | select(.title == $name) // empty')
        if [ -n "$existing_project" ] && [ "$existing_project" != "null" ]; then
            PROJECT_ID=$(echo "$existing_project" | jq -r '.id // empty')
            PROJECT_NUMBER=$(echo "$existing_project" | jq -r '.number // empty')
            if [ -n "$PROJECT_ID" ] && [ -n "$PROJECT_NUMBER" ]; then
                project_exists=true
                log_info "Found existing project: $project_name (Number: $PROJECT_NUMBER, ID: $PROJECT_ID)"
            fi
        fi
    fi
    
    if [ "$project_exists" = false ]; then
        log_info "Project '$project_name' not found. Creating new project..."
        # Create new project (v2)
        local create_response=$(gh project create --owner "$REPO_OWNER" --title "$project_name" --format json 2>&1)
        
        if [ $? -ne 0 ] || [ -z "$create_response" ]; then
            output_error "Failed to create project: $create_response"
        fi
        
        # Parse response
        PROJECT_ID=$(echo "$create_response" | jq -r '.id // empty')
        PROJECT_NUMBER=$(echo "$create_response" | jq -r '.number // empty')
        
        if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "null" ] || [ -z "$PROJECT_NUMBER" ] || [ "$PROJECT_NUMBER" = "null" ]; then
            output_error "Failed to parse project ID/number from response"
        fi
        
        log_success "Project created: $project_name (ID: $PROJECT_ID, Number: $PROJECT_NUMBER)"
    else
        log_info "Using existing project: $project_name (ID: $PROJECT_ID, Number: $PROJECT_NUMBER)"
    fi
    
    sync_status_field

    # Link repository to project
    log_info "Linking repository to project..."
    gh project link "$PROJECT_NUMBER" --owner "$REPO_OWNER" --repo "$REPO" 2>/dev/null
    # Don't fail if already linked
    
}

get_status_field_data() {
    local status_field_response=$(gh api graphql -f query='
query($projectId: ID!) {
  node(id: $projectId) {
    ... on ProjectV2 {
      fields(first: 50) {
        nodes {
          ... on ProjectV2SingleSelectField {
            id
            name
            options {
              id
              name
              color
              description
            }
          }
        }
      }
    }
  }
}' -f projectId="$PROJECT_ID" 2>/dev/null)

    if [ $? -ne 0 ] || [ -z "$status_field_response" ]; then
        return 1
    fi

    echo "$status_field_response" | jq -c '.data.node.fields.nodes[] | select(.name == "Status") // empty'
}

has_missing_configured_statuses() {
    local existing_statuses="$1"
    local configured_status=""

    while IFS= read -r configured_status; do
        [ -z "$configured_status" ] && continue
        if ! printf '%s\n' "$existing_statuses" | grep -qFx "$configured_status"; then
            return 0
        fi
    done <<< "$STATUS_COLUMNS"

    return 1
}

build_status_options_graphql_literal() {
    local status_field_json="$1"
    local existing_options_json=$(echo "$status_field_json" | jq -c '.options // []')
    local desired_statuses_json=$(status_columns_to_json)

    local merged_options_json=$(jq -n \
        --argjson existing "$existing_options_json" \
        --argjson desired "$desired_statuses_json" \
        '
        def color_for($name):
            if $name == "Done" then "GREEN"
            elif $name == "In Progress" then "BLUE"
            elif ($name | test("Review")) then "PURPLE"
            elif $name == "Ready" then "YELLOW"
            elif ($name == "Backlog" or $name == "Todo") then "GRAY"
            else "GRAY"
            end;
        ($existing // []) as $existingOptions |
        ($desired // []) as $desiredNames |
        ($existingOptions | map(.name)) as $existingNames |
        (
            ($existingOptions | map({
                id: .id,
                name: .name,
                color: (.color // color_for(.name)),
                description: (.description // "")
            }))
            +
            ($desiredNames | map(select(($existingNames | index(.)) | not) | {
                name: ., color: color_for(.), description: "Managed by github-issue-manager.sh"
            }))
        )')

    echo "$merged_options_json" | jq -r '
        def esc: gsub("\\\\"; "\\\\\\\\") | gsub("\""; "\\\"");
        "[" + (
            map(
                "{"
                + (if (.id // "") != "" then "id: \"" + (.id | esc) + "\", " else "" end)
                + "name: \"" + (.name | esc) + "\", "
                + "color: " + .color + ", "
                + "description: \"" + (.description | esc) + "\""
                + "}"
            ) | join(", ")
        ) + "]"'
}

sync_status_field() {
    local status_field_json=$(get_status_field_data)

    if [ -z "$status_field_json" ]; then
        local columns_csv=$(status_columns_to_csv)
        log_info "Creating Status field with options: $columns_csv"
        local create_field_response=$(gh project field-create "$PROJECT_NUMBER" --owner "$REPO_OWNER" --name "Status" --data-type "SINGLE_SELECT" --single-select-options "$columns_csv" --format json 2>&1)

        if [ $? -ne 0 ]; then
            output_error "Failed to create Status field: $create_field_response"
        fi

        status_field_json=$(get_status_field_data)
        if [ -z "$status_field_json" ]; then
            output_error "Status field creation reported success but the field could not be retrieved"
        fi
    fi

    STATUS_FIELD_ID=$(echo "$status_field_json" | jq -r '.id // empty')
    if [ -z "$STATUS_FIELD_ID" ] || [ "$STATUS_FIELD_ID" = "null" ]; then
        output_error "Failed to determine Status field ID"
    fi

    local existing_options=$(echo "$status_field_json" | jq -r '.options[]?.name // empty')
    if has_missing_configured_statuses "$existing_options"; then
        local options_graphql_literal=$(build_status_options_graphql_literal "$status_field_json")
        log_info "Adding missing Status options from COLUMNS"
        local update_field_response=$(gh api graphql -f query="
mutation {
  updateProjectV2Field(input: {
    fieldId: \"$STATUS_FIELD_ID\",
    singleSelectOptions: $options_graphql_literal
  }) {
    projectV2Field {
      ... on ProjectV2SingleSelectField {
        id
        name
      }
    }
  }
}" 2>&1)

        if [ $? -ne 0 ]; then
            output_error "Failed to update Status field options: $update_field_response"
        fi

        status_field_json=$(get_status_field_data)
        if [ -z "$status_field_json" ]; then
            output_error "Status field options were updated but the field could not be retrieved afterward"
        fi
    fi

    local synced_options=$(echo "$status_field_json" | jq -r '.options[]?.name // empty' | tr '\n' ',' | sed 's/,$//')
    log_info "Status field exists with ID: $STATUS_FIELD_ID"
    log_info "Available options: $synced_options"

    local backlog_resolution
    backlog_resolution=$(resolve_status_option "Backlog")
    BACKLOG_OPTION_ID=$(echo "$backlog_resolution" | cut -f1)
    BACKLOG_OPTION_NAME=$(echo "$backlog_resolution" | cut -f2)

    if [ -n "$BACKLOG_OPTION_ID" ] && [ "$BACKLOG_OPTION_ID" != "null" ]; then
        log_info "Initial backlog option ID: $BACKLOG_OPTION_ID ($BACKLOG_OPTION_NAME)"
    else
        output_error "Failed to resolve a usable Backlog status option after syncing the Status field"
    fi
}

#=============================================================================
# ISSUE CREATION FUNCTIONS
#=============================================================================

create_epic_issue() {
    local title="$1"
    local body="$2"
    local epic_slug="$3"
    
    if [ -z "$title" ] || [ -z "$body" ] || [ -z "$epic_slug" ]; then
        output_error "Usage: create-epic --title <title> --body <body> --epic-slug <slug>"
    fi
    
    # Validate slug is not purely numeric (common AI agent mistake - passing issue numbers as slugs)
    validate_slug "$epic_slug" "epic"
    
    if [ -z "$REPO" ]; then
        load_config
    fi

    ensure_project_board

    ensure_label "epic" "Epic issue" "5319e7"
    ensure_label "epic:$epic_slug" "Epic stories" "1e3a8a"

    # Create issue and capture the issue number directly
    local issue_url=$(gh issue create --repo "$REPO" --title "$title" --body "$body" --label "epic,epic:$epic_slug")
    if [ $? -ne 0 ]; then
        output_error "Failed to create epic issue"
    fi
    
    local epic_num=$(echo "$issue_url" | grep -o '[0-9]*$')
    if [ -z "$epic_num" ]; then
        output_error "Failed to parse epic issue number"
    fi
    
    # Add to project and set status to Backlog
    log_info "Adding epic to project..."
    local add_response=$(gh project item-add "$PROJECT_NUMBER" --owner "$REPO_OWNER" --url "https://github.com/$REPO/issues/$epic_num" --format json 2>/dev/null)

    if [ $? -eq 0 ] && [ -n "$add_response" ]; then
        local epic_item_id=$(echo "$add_response" | jq -r '.id // empty')
        if [ -n "$epic_item_id" ] && [ "$epic_item_id" != "null" ]; then
            # Set status to Backlog using the option ID
            if [ -n "$BACKLOG_OPTION_ID" ] && [ "$BACKLOG_OPTION_ID" != "null" ]; then
                gh project item-edit --id "$epic_item_id" --project-id "$PROJECT_ID" --field-id "$STATUS_FIELD_ID" --single-select-option-id "$BACKLOG_OPTION_ID" 2>/dev/null
                if [ $? -eq 0 ]; then
                    log_success "Epic added to project with $BACKLOG_OPTION_NAME status"
                else
                    log_warning "Epic added to project but failed to set status"
                fi
            else
                log_warning "Epic added to project (status not set - no Backlog option ID)"
            fi
        else
            log_warning "Epic added to project but failed to parse item ID"
        fi
    else
        log_warning "Failed to add epic to project, manual addition needed"
    fi

    output_json "{\"epic_number\": $epic_num}"
}

create_story_issue() {
    # Parameters: title, body, story_slug, [epic_num], [epic_slug]
    # epic_num and epic_slug are optional but must be provided together
    local title="$1"
    local body="$2"
    local story_slug="$3"
    local epic_num="$4"
    local epic_slug="$5"
    
    # Validate required parameters
    if [ -z "$title" ] || [ -z "$body" ] || [ -z "$story_slug" ]; then
        output_error "Usage: create-story --title <title> --body <body> --story-slug <slug> [--epic-number <num> | --epic-title <fragment>] [--epic-slug <slug>]"
    fi
    
    # Validate slugs are not purely numeric (common AI agent mistake - passing issue numbers as slugs)
    validate_slug "$story_slug" "story"
    
    # If epic_num is provided, epic_slug must also be available.
    if [ -n "$epic_num" ] && [ -z "$epic_slug" ]; then
        output_error "When linking a story to an epic, --epic-slug must be provided or inferred from an epic:<slug> label"
    fi
    if [ -n "$epic_slug" ] && [ -z "$epic_num" ]; then
        output_error "--epic-slug requires --epic-number or --epic-title when creating a story"
    fi
    
    # Validate epic_num is numeric if provided
    if [ -n "$epic_num" ] && ! [[ "$epic_num" =~ ^[0-9]+$ ]]; then
        output_error "Invalid epic_num: $epic_num. Must be numeric."
    fi
    
    if [ -n "$epic_slug" ]; then
        validate_slug "$epic_slug" "epic"
    fi
    
    if [ -z "$REPO" ]; then
        load_config
    fi

    ensure_project_board
    
    # Enhance body with parent epic reference (only if epic info provided)
    local enhanced_body="$body"
    if [ -n "$epic_num" ] && [ -n "$epic_slug" ]; then
        enhanced_body="$body

Parent Epic: $epic_slug (#$epic_num)"
    fi
    
    # Create labels
    ensure_label "story" "Story issue" "1d76db"
    local labels="story"
    if [ -n "$epic_slug" ]; then
        ensure_label "epic:$epic_slug" "Epic $epic_num stories" "1e3a8a"
        labels="$labels,epic:$epic_slug"
    fi
    ensure_label "story:$story_slug" "Story $story_slug" "9017ca"
    labels="$labels,story:$story_slug"

    # Create story issue and capture the issue number directly
    local issue_url=$(gh issue create --repo "$REPO" --title "$title" --body "$enhanced_body" --label "$labels")
    if [ $? -ne 0 ]; then
        output_error "Failed to create story issue"
    fi
    
    local story_num=$(echo "$issue_url" | grep -o '[0-9]*$')
    if [ -z "$story_num" ]; then
        output_error "Failed to parse story issue number"
    fi
    
    # Add to project and set status to Backlog
    log_info "Adding story to project..."
    local add_response=$(gh project item-add "$PROJECT_NUMBER" --owner "$REPO_OWNER" --url "https://github.com/$REPO/issues/$story_num" --format json 2>/dev/null)

    if [ $? -eq 0 ] && [ -n "$add_response" ]; then
        local story_item_id=$(echo "$add_response" | jq -r '.id // empty')
        if [ -n "$story_item_id" ] && [ "$story_item_id" != "null" ]; then
            # Set status to Backlog using the option ID
            if [ -n "$BACKLOG_OPTION_ID" ] && [ "$BACKLOG_OPTION_ID" != "null" ]; then
                gh project item-edit --id "$story_item_id" --project-id "$PROJECT_ID" --field-id "$STATUS_FIELD_ID" --single-select-option-id "$BACKLOG_OPTION_ID" 2>/dev/null
                if [ $? -eq 0 ]; then
                    log_success "Story added to project with $BACKLOG_OPTION_NAME status"
                else
                    log_warning "Story added to project but failed to set status"
                fi
            else
                log_warning "Story added to project (status not set - no Backlog option ID)"
            fi
        else
            log_warning "Story added to project but failed to parse item ID"
        fi
    else
        log_warning "Failed to add story to project, manual addition needed"
    fi

    # Create sub-issue relationship with epic (only if epic_num exists)
    if [ -n "$epic_num" ]; then
        create_sub_issue_relationship "$epic_num" "$story_num"
    fi
    
    output_json "{\"story_number\": $story_num}"
}

create_task_issue() {
    # Parameters: title, body, [story_num], [story_slug], [epic_slug]
    # story_num and story_slug must be provided together if linking to a story
    local title="$1"
    local body="$2"
    local story_num="$3"
    local story_slug="$4"
    local epic_slug="$5"
    
    # Validate required parameters
    if [ -z "$title" ] || [ -z "$body" ]; then
        output_error "Usage: create-task --title <title> --body <body> [--story-number <num> | --story-title <fragment>] [--story-slug <slug>] [--epic-slug <epic_slug>]"
    fi
    
    # If story_num is provided, story_slug must also be available.
    if [ -n "$story_num" ] && [ -z "$story_slug" ]; then
        output_error "When linking a task to a story, --story-slug must be provided or inferred from a story:<slug> label"
    fi
    if [ -n "$story_slug" ] && [ -z "$story_num" ]; then
        output_error "--story-slug requires --story-number or --story-title when creating a task"
    fi
    
    # Validate story_num is numeric if provided
    if [ -n "$story_num" ] && ! [[ "$story_num" =~ ^[0-9]+$ ]]; then
        output_error "Invalid story_num: $story_num. Must be numeric."
    fi
    
    # Validate slugs are not purely numeric (common AI agent mistake - passing issue numbers as slugs)
    if [ -n "$epic_slug" ]; then
        validate_slug "$epic_slug" "epic"
    fi
    if [ -n "$story_slug" ]; then
        validate_slug "$story_slug" "story"
    fi
    
    if [ -z "$REPO" ]; then
        load_config
    fi

    ensure_project_board
    
    # Build enhanced body
    local enhanced_body="$body"
    
    # Add parent story reference if provided
    if [ -n "$story_num" ]; then
        enhanced_body="$enhanced_body

Parent Story: #$story_num"
        if [ -n "$story_slug" ]; then
            enhanced_body="$enhanced_body
Story Slug: $story_slug"
        fi
    fi
    
    # Add epic slug info if provided
    if [ -n "$epic_slug" ]; then
        enhanced_body="$enhanced_body
Epic Slug: $epic_slug"
    fi

    # Create labels
    ensure_label "task" "Task issue" "0e8a16"
    local labels="task"
    if [ -n "$epic_slug" ]; then
        ensure_label "epic:$epic_slug" "Epic $epic_slug tasks" "1e3a8a"
        labels="$labels,epic:$epic_slug"
    fi
    if [ -n "$story_slug" ]; then
        ensure_label "story:$story_slug" "Story $story_slug tasks" "9017ca"
        labels="$labels,story:$story_slug"
    fi
    
    # Create task issue and capture the issue number directly
    local issue_url=$(gh issue create --repo "$REPO" --title "$title" --body "$enhanced_body" --label "$labels")
    if [ $? -ne 0 ]; then
        output_error "Failed to create task issue"
    fi
    
    local task_num=$(echo "$issue_url" | grep -o '[0-9]*$')
    if [ -z "$task_num" ]; then
        output_error "Failed to parse task issue number"
    fi
    
    # Add to project and set status to Backlog
    log_info "Adding task to project..."
    local add_response=$(gh project item-add "$PROJECT_NUMBER" --owner "$REPO_OWNER" --url "https://github.com/$REPO/issues/$task_num" --format json 2>/dev/null)

    if [ $? -eq 0 ] && [ -n "$add_response" ]; then
        local task_item_id=$(echo "$add_response" | jq -r '.id // empty')
        if [ -n "$task_item_id" ] && [ "$task_item_id" != "null" ]; then
            # Set status to Backlog using the option ID
            if [ -n "$BACKLOG_OPTION_ID" ] && [ "$BACKLOG_OPTION_ID" != "null" ]; then
                gh project item-edit --id "$task_item_id" --project-id "$PROJECT_ID" --field-id "$STATUS_FIELD_ID" --single-select-option-id "$BACKLOG_OPTION_ID" 2>/dev/null
                if [ $? -eq 0 ]; then
                    log_success "Task added to project with $BACKLOG_OPTION_NAME status"
                else
                    log_warning "Task added to project but failed to set status"
                fi
            else
                log_warning "Task added to project (status not set - no Backlog option ID)"
            fi
        else
            log_warning "Task added to project but failed to parse item ID"
        fi
    else
        log_warning "Failed to add task to project, manual addition needed"
    fi

    # Create sub-issue relationship with parent story (only if story_num provided)
    if [ -n "$story_num" ]; then
        create_sub_issue_relationship "$story_num" "$task_num"
    fi
    
    output_json "{\"task_number\": $task_num}"
}

create_sub_issue_relationship() {
    local parent_issue_num="$1"
    local child_issue_num="$2"
    
    if [ -z "$parent_issue_num" ] || [ -z "$child_issue_num" ]; then
        output_error "Usage: create-relationship <parent_issue_num> <child_issue_num>"
    fi
    
    # Validate inputs
    if ! [[ "$parent_issue_num" =~ ^[0-9]+$ ]]; then
        output_error "Invalid parent issue number: $parent_issue_num. Must be numeric."
    fi
    
    if ! [[ "$child_issue_num" =~ ^[0-9]+$ ]]; then
        output_error "Invalid child issue number: $child_issue_num. Must be numeric."
    fi
    
    if [ -z "$REPO" ]; then
        load_config
    fi
    
    # Verify both issues exist
    if ! gh issue view "$parent_issue_num" --repo "$REPO" >/dev/null 2>&1; then
        output_error "Parent issue #$parent_issue_num not found in repo $REPO"
    fi
    
    if ! gh issue view "$child_issue_num" --repo "$REPO" >/dev/null 2>&1; then
        output_error "Child issue #$child_issue_num not found in repo $REPO"
    fi
    
    # Get issue node IDs for GraphQL
    local parent_node_id=$(gh api "repos/$REPO/issues/$parent_issue_num" --jq '.node_id' 2>/dev/null)
    local child_node_id=$(gh api "repos/$REPO/issues/$child_issue_num" --jq '.node_id' 2>/dev/null)
    
    if [ -z "$parent_node_id" ] || [ -z "$child_node_id" ]; then
        output_error "Failed to get issue node IDs"
    fi
    
    # Create sub-issue relationship using GraphQL
    log_info "Creating sub-issue relationship: #$parent_issue_num -> #$child_issue_num"
    
    local mutation_result=$(gh api graphql -f query='
      mutation($parentId: ID!, $subIssueId: ID!) {
        addSubIssue(input: {
          issueId: $parentId,
          subIssueId: $subIssueId
        }) {
          issue {
            id
            number
          }
          subIssue {
            id
            number
          }
        }
      }' -f parentId="$parent_node_id" -f subIssueId="$child_node_id" 2>&1)
    
    if [ $? -eq 0 ]; then
        # GraphQL mutation succeeded
        output_json "{\"success\": \"Sub-issue relationship created\", \"parent\": \"$parent_issue_num\", \"child\": \"$child_issue_num\"}"
    else
        # Check if it's an API error we can handle
        if echo "$mutation_result" | grep -q "not found\|does not exist"; then
            output_error "GitHub sub-issue API not available or issues not found"
        else
            output_error "Failed to create sub-issue relationship: $mutation_result"
        fi
    fi
}

resolve_status_option() {
    local requested_status="$1"
    local status_response=$(gh api graphql -f query='
query($projectId: ID!) {
  node(id: $projectId) {
    ... on ProjectV2 {
      fields(first: 20) {
        nodes {
          ... on ProjectV2SingleSelectField {
            id
            name
            options {
              id
              name
            }
          }
        }
      }
    }
  }
}' -f projectId="$PROJECT_ID" 2>/dev/null)

    if [ -z "$status_response" ]; then
        return 1
    fi

    local actual_status="$requested_status"
    local option_id=""

    case "$requested_status" in
        "Backlog")
            option_id=$(echo "$status_response" | jq -r '.data.node.fields.nodes[] | select(.name == "Status") | .options[] | select(.name == "Backlog") | .id // empty')
            if [ -z "$option_id" ] || [ "$option_id" = "null" ]; then
                option_id=$(echo "$status_response" | jq -r '.data.node.fields.nodes[] | select(.name == "Status") | .options[] | select(.name == "Todo") | .id // empty')
                actual_status="Todo"
            fi
            ;;
        *)
            option_id=$(echo "$status_response" | jq -r --arg status "$requested_status" '.data.node.fields.nodes[] | select(.name == "Status") | .options[] | select(.name == $status) | .id // empty')
            ;;
    esac

    if [ -z "$option_id" ] || [ "$option_id" = "null" ]; then
        return 1
    fi

    printf '%s\t%s\n' "$option_id" "$actual_status"
}

get_issue_hierarchy_summary() {
    local issue_num="$1"

    local empty_summary='{"parent":null,"sub_issues":[]}'

    if [ -z "$issue_num" ] || ! [[ "$issue_num" =~ ^[0-9]+$ ]]; then
        printf '%s\n' "$empty_summary"
        return 0
    fi

    local node_id
    node_id=$(gh api "repos/$REPO/issues/$issue_num" --jq '.node_id' 2>/dev/null)
    if [ -z "$node_id" ] || [ "$node_id" = "null" ]; then
        printf '%s\n' "$empty_summary"
        return 0
    fi

    local hierarchy_data
    hierarchy_data=$(gh api graphql -H "GraphQL-Features: sub_issues" -f query='
        query($nodeId: ID!) {
            node(id: $nodeId) {
                ... on Issue {
                    parent {
                        __typename
                        ... on Issue {
                            number
                            title
                        }
                    }
                    subIssues(first: 50) {
                        nodes {
                            number
                            title
                        }
                    }
                }
            }
        }' -f nodeId="$node_id" 2>/dev/null)

    if [ $? -ne 0 ] || [ -z "$hierarchy_data" ] || ! is_valid_json "$hierarchy_data"; then
        printf '%s\n' "$empty_summary"
        return 0
    fi

    local summary
    summary=$(printf '%s\n' "$hierarchy_data" | jq -c '{
        parent: (
            .data.node.parent // null
            | if . == null or .__typename != "Issue" then null else {number: .number, title: .title} end
        ),
        sub_issues: [
            .data.node.subIssues.nodes[]?
            | select(. != null)
            | {number: .number, title: .title}
        ]
    }' 2>/dev/null)

    if [ $? -ne 0 ] || [ -z "$summary" ] || ! is_valid_json "$summary"; then
        printf '%s\n' "$empty_summary"
        return 0
    fi

    printf '%s\n' "$summary"
}

#=============================================================================
# ISSUE MANAGEMENT FUNCTIONS
#=============================================================================

update_issue_status() {
    local issue_num="$1"
    local column="$2"
    
    if [ -z "$issue_num" ] || [ -z "$column" ]; then
        output_error "Usage: update-status (--issue-number <num> | --issue-title <fragment>) --status <status>"
    fi
    
    # Validate inputs
    if ! [[ "$issue_num" =~ ^[0-9]+$ ]]; then
        output_error "Invalid issue number: $issue_num. Must be numeric."
    fi
    
    if [ -z "$REPO" ]; then
        load_config
    fi

    ensure_project_board
    
    # Verify issue exists and capture current open/closed state
    local issue_state
    issue_state=$(gh issue view "$issue_num" --repo "$REPO" --json state --jq '.state' 2>/dev/null)
    if [ $? -ne 0 ] || [ -z "$issue_state" ]; then
        output_error "Issue #$issue_num not found in repo $REPO"
    fi
    
    # Normalize legacy aliases and validate against configured statuses
    local status_value
    status_value="$(normalize_requested_status "$column")"

    if ! status_is_configured "$status_value"; then
        output_error "Invalid status: $column. Configured statuses: $(status_columns_to_display) (legacy aliases: Todo, Next Milestone)"
    fi
    
    # Check if issue is already in the project
    local issue_items_response=$(gh project item-list "$PROJECT_NUMBER" --owner "$REPO_OWNER" --format json 2>/dev/null)
    local issue_item_id=""
    
    if [ $? -eq 0 ] && [ -n "$issue_items_response" ]; then
        # Find the project item for this issue
        issue_item_id=$(echo "$issue_items_response" | jq -r --arg issue "$issue_num" --arg repo "$REPO" '[.items[] | select(.content.type == "Issue" and .content.repository == $repo and (.content.number | tostring) == $issue)] | .[0].id // empty')
    fi
    
    # Add issue to project if not already there
    if [ -z "$issue_item_id" ] || [ "$issue_item_id" = "null" ]; then
        log_info "Adding issue to project..."
        local add_response=$(gh project item-add "$PROJECT_NUMBER" --owner "$REPO_OWNER" --url "https://github.com/$REPO/issues/$issue_num" --format json 2>&1)
        
        if [ $? -ne 0 ]; then
            output_error "Failed to add issue to project: $add_response"
        fi
        
        issue_item_id=$(echo "$add_response" | jq -r '.id // empty')
        if [ -z "$issue_item_id" ] || [ "$issue_item_id" = "null" ]; then
            output_error "Failed to parse item ID from add response"
        fi
    fi
    
    local status_resolution
    status_resolution=$(resolve_status_option "$status_value")
    local status_option_id=$(echo "$status_resolution" | cut -f1)
    local applied_status=$(echo "$status_resolution" | cut -f2)

    if [ -z "$status_option_id" ] || [ "$status_option_id" = "null" ]; then
        output_error "Failed to find option ID for status: $status_value"
    fi

    # Update the Status field for this issue
    log_info "Setting status to: $applied_status (from $column)"
    local update_response=$(gh project item-edit --id "$issue_item_id" --project-id "$PROJECT_ID" --field-id "$STATUS_FIELD_ID" --single-select-option-id "$status_option_id" 2>&1)
    
    if [ $? -eq 0 ]; then
        if [ "$applied_status" = "Done" ] && [ "$issue_state" != "CLOSED" ]; then
            log_info "Closing issue because status is Done"
            local close_response=$(gh issue close "$issue_num" --repo "$REPO" 2>&1)
            if [ $? -ne 0 ]; then
                output_error "Status updated to Done, but failed to close issue: $close_response"
            fi
            issue_state="CLOSED"
        elif [ "$applied_status" != "Done" ] && [ "$issue_state" = "CLOSED" ]; then
            log_info "Reopening issue because status moved out of Done"
            local reopen_response=$(gh issue reopen "$issue_num" --repo "$REPO" 2>&1)
            if [ $? -ne 0 ]; then
                output_error "Status updated to $applied_status, but failed to reopen issue: $reopen_response"
            fi
            issue_state="OPEN"
        fi

        output_json "{\"success\": \"Issue status updated to $applied_status\", \"item_id\": \"$issue_item_id\", \"requested_status\": \"$column\", \"applied_status\": \"$applied_status\", \"issue_state\": \"$issue_state\"}"
    else
        output_error "Failed to update status: $update_response"
    fi
}

list_stories() {
    local filter=${1:-"label:story state:open"}
    
    if [ -z "$REPO" ]; then
        load_config
    fi
    
    # Parse filter into gh issue list arguments
    local gh_args=""
    if [[ "$filter" == *"label:"* ]]; then
        local label=$(echo "$filter" | sed -n 's/.*label:\([^ ]*\).*/\1/p')
        if [ -n "$label" ]; then
            gh_args="$gh_args --label \"$label\""
        fi
    fi
    
    if [[ "$filter" == *"state:"* ]]; then
        local state=$(echo "$filter" | sed -n 's/.*state:\([^ ]*\).*/\1/p')
        if [ -n "$state" ]; then
            gh_args="$gh_args --state \"$state\""
        fi
    fi
    
    # If no specific args parsed, use default
    if [ -z "$gh_args" ]; then
        gh_args="--label story --state open"
    fi
    
    # List issues without body text. Story hierarchy is enriched below.
    local output=$(eval "gh issue list $gh_args --json number,title,labels,assignees,milestone,state,url --limit 50 --repo \"$REPO\"" 2>&1)
    if [ $? -ne 0 ]; then
        output_error "Failed to list issues: $output"
    fi
    
    # Validate JSON output
    if ! echo "$output" | jq . >/dev/null 2>&1; then
        output_error "Invalid JSON response from gh issue list"
    fi
    
    # Check if output is empty array (this is normal, not an error)
    local story_count=$(echo "$output" | jq '. | length')
    if [ "$story_count" -eq 0 ]; then
        output_json "{\"result\": [], \"count\": 0, \"message\": \"No stories found matching filter: $filter\"}"
        return 0
    fi
    
    local enriched_output="[]"
    local story_item=""
    local story_num=""
    local hierarchy_summary=""

    while IFS= read -r story_item; do
        [ -z "$story_item" ] && continue

        story_num=$(printf '%s\n' "$story_item" | jq -r '.number')
        hierarchy_summary=$(get_issue_hierarchy_summary "$story_num")
        hierarchy_summary=$(ensure_json_or_default "$hierarchy_summary" '{"parent":null,"sub_issues":[]}')

        enriched_output=$(jq -n \
            --argjson stories "$enriched_output" \
            --argjson story "$story_item" \
            --argjson hierarchy "$hierarchy_summary" \
            '$stories + [($story + {parent: $hierarchy.parent, sub_issues: $hierarchy.sub_issues})]')
    done <<< "$(printf '%s\n' "$output" | jq -c '.[]')"

    # Return successful result with metadata
    echo "$enriched_output" | jq --arg filter "$filter" --arg count "$story_count" '. + [{"_metadata": {"filter": $filter, "count": ($count | tonumber), "includes_body": false, "includes_hierarchy": true}}]'
}

get_issue_context() {
    local issue_num="$1"

    if [ -z "$issue_num" ]; then
        output_error "Usage: get-issue-context (--issue-number <num> | --issue-title <fragment>)"
    fi

    # Validate issue number
    if ! [[ "$issue_num" =~ ^[0-9]+$ ]]; then
        output_error "Invalid issue number: $issue_num. Must be numeric."
    fi

    if [ -z "$REPO" ]; then
        load_config
    fi

    issue_summary_from_data() {
        jq '{
            number: .number,
            title: .title,
            state: .state,
            url: .url,
            labels: [.labels[].name?],
            issue_type: (
                ([.labels[].name?]) as $labels |
                if ($labels | index("epic")) then "epic"
                elif ($labels | index("story")) then "story"
                elif ($labels | index("task")) then "task"
                else "issue"
                end
            )
        }'
    }

    extract_section_from_body() {
        local section_pattern="$1"
        printf '%s\n' "$body" | awk -v section_pattern="$section_pattern" '
            BEGIN { in_section = 0; content = "" }
            /^##/ {
                if (in_section) exit
                if ($0 ~ section_pattern) in_section = 1
                next
            }
            in_section {
                if (content != "") content = content "\\n"
                content = content $0
            }
            END { print content }
        '
    }

    list_related_issues_for_label() {
        local relation_label="$1"
        local desired_type="$2"

        if [ -z "$relation_label" ]; then
            echo "[]"
            return 0
        fi

        local related_output=$(gh issue list --repo "$REPO" --label "$relation_label" --state all --limit 100 --json number,title,state,url,labels 2>/dev/null)
        if [ $? -ne 0 ] || [ -z "$related_output" ]; then
            echo "[]"
            return 0
        fi

        echo "$related_output" | jq \
            --arg desired_type "$desired_type" \
            --argjson current_issue "$issue_num" '
                map({
                    number: .number,
                    title: .title,
                    state: .state,
                    url: .url,
                    labels: [.labels[].name?],
                    issue_type: (
                        ([.labels[].name?]) as $labels |
                        if ($labels | index("epic")) then "epic"
                        elif ($labels | index("story")) then "story"
                        elif ($labels | index("task")) then "task"
                        else "issue"
                        end
                    )
                })
                | map(select(.number != $current_issue))
                | if $desired_type == "" then . else map(select(.issue_type == $desired_type)) end'
    }

    summarize_issue_collection() {
        local issues_json="$1"

        issues_json=$(ensure_json_or_default "$issues_json" "[]")

        jq -n --argjson issues "$issues_json" '{
            total: ($issues | length),
            epic_count: ($issues | map(select(.issue_type == "epic")) | length),
            story_count: ($issues | map(select(.issue_type == "story")) | length),
            task_count: ($issues | map(select(.issue_type == "task")) | length),
            other_count: ($issues | map(select(.issue_type == "issue")) | length)
        }'
    }

    # Verify issue exists and get comprehensive data
    log_info "Fetching context for issue #$issue_num..."
    local issue_data=$(gh issue view "$issue_num" --repo "$REPO" --json number,title,state,body,labels,assignees,milestone,createdAt,updatedAt,closedAt,url 2>&1)

    if [ $? -ne 0 ]; then
        output_error "Issue #$issue_num not found in repo $REPO"
    fi

    # Validate JSON
    if ! echo "$issue_data" | jq . >/dev/null 2>&1; then
        output_error "Issue #$issue_num not found or invalid response from GitHub"
    fi

    # Extract basic metadata
    local title=$(echo "$issue_data" | jq -r '.title // empty')
    local body=$(echo "$issue_data" | jq -r '.body // empty')
    local issue_type=$(echo "$issue_data" | jq -r '
        ([.labels[].name?]) as $labels |
        if ($labels | index("epic")) then "epic"
        elif ($labels | index("story")) then "story"
        elif ($labels | index("task")) then "task"
        else "issue"
        end')
    local epic_slug=$(echo "$issue_data" | jq -r '[.labels[].name? | select(startswith("epic:")) | sub("^epic:"; "")] | first // empty')
    local story_slug=$(echo "$issue_data" | jq -r '[.labels[].name? | select(startswith("story:")) | sub("^story:"; "")] | first // empty')

    if [ -z "$title" ]; then
        output_error "Failed to extract issue metadata for #$issue_num"
    fi

    # Parse structured sections from the issue body
    local story_section=$(extract_section_from_body '^## Story')
    local acceptance_criteria=$(extract_section_from_body '^## Acceptance Criteria')
    local tasks_section=$(extract_section_from_body '^## (Tasks|Subtasks|Tasks / Subtasks)')
    local dev_notes=$(extract_section_from_body '^## Dev Notes')

    # Extract linked issues from body (looking for #123 patterns and sub-issue relationships)
    local linked_issues=$(printf '%s\n' "$body" | grep -o '#[0-9]\+' 2>/dev/null | sed 's/#//' | sort -u | jq -R 'select(length > 0) | tonumber' | jq -s .)
    if [ -z "$linked_issues" ]; then
        linked_issues="[]"
    fi

    local linked_issue_details="[]"
    local linked_issue_num=""
    for linked_issue_num in $(echo "$linked_issues" | jq -r '.[]?'); do
        local linked_issue_data=$(gh issue view "$linked_issue_num" --repo "$REPO" --json number,title,state,url,labels 2>/dev/null)
        if [ $? -eq 0 ] && [ -n "$linked_issue_data" ]; then
            local linked_issue_summary=$(echo "$linked_issue_data" | issue_summary_from_data)
            linked_issue_details=$(echo "$linked_issue_details" | jq --argjson item "$linked_issue_summary" '. + [$item]')
        fi
    done

    # Query comments to find "File List" entries
    log_info "Checking comments for file lists..."
    local comments_data=""
    local file_lists="[]"

    comments_data=$(gh api "repos/$REPO/issues/$issue_num/comments" 2>/dev/null)
    if [ $? -eq 0 ]; then
        comments_data=$(ensure_json_or_default "$comments_data" "[]")
        # Look for comments containing "File List" or similar markers
        file_lists=$(printf '%s\n' "$comments_data" | jq '[.[]? | select((.body // "") | test("(?i)(file list|files?:)")) | {author: (.user.login // "unknown"), content: (.body // "")}]' 2>/dev/null)
        file_lists=$(ensure_json_or_default "$file_lists" "[]")
    fi

    # Get direct parent and sub-issues using GraphQL if available
    log_info "Fetching hierarchy relationships..."
    local node_id=$(gh api "repos/$REPO/issues/$issue_num" --jq '.node_id' 2>/dev/null)
    local graph_parent="null"
    local sub_issues="[]"

    if [ -n "$node_id" ] && [ "$node_id" != "null" ]; then
        local hierarchy_data=$(gh api graphql -H "GraphQL-Features: sub_issues" -f query='
            query($nodeId: ID!) {
                node(id: $nodeId) {
                    ... on Issue {
                        parent {
                            __typename
                            ... on Issue {
                                number
                                title
                                state
                                url
                                labels(first: 20) {
                                    nodes {
                                        name
                                    }
                                }
                            }
                        }
                        subIssues(first: 50) {
                            nodes {
                                number
                                title
                                state
                                url
                                labels(first: 20) {
                                    nodes {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            }' -f nodeId="$node_id" 2>/dev/null)

        if [ $? -eq 0 ] && [ -n "$hierarchy_data" ]; then
            local parsed_graph_parent=""
            parsed_graph_parent=$(printf '%s\n' "$hierarchy_data" | jq -c '(
                .data.node.parent // null
            ) | if . == null or .__typename != "Issue" then null else {
                number: .number,
                title: .title,
                state: .state,
                url: .url,
                labels: [.labels.nodes[]?.name],
                issue_type: (
                    ([.labels.nodes[]?.name]) as $labels |
                    if ($labels | index("epic")) then "epic"
                    elif ($labels | index("story")) then "story"
                    elif ($labels | index("task")) then "task"
                    else "issue"
                    end
                )
            } end' 2>/dev/null)
            if [ $? -eq 0 ] && [ -n "$parsed_graph_parent" ]; then
                graph_parent="$parsed_graph_parent"
            fi

            local parsed_sub_issues=""
            parsed_sub_issues=$(printf '%s\n' "$hierarchy_data" | jq -c '[
                .data.node.subIssues.nodes[]?
                | select(. != null)
                | {
                    number: .number,
                    title: .title,
                    state: .state,
                    url: .url,
                    labels: [.labels.nodes[]?.name],
                    issue_type: (
                        ([.labels.nodes[]?.name]) as $labels |
                        if ($labels | index("epic")) then "epic"
                        elif ($labels | index("story")) then "story"
                        elif ($labels | index("task")) then "task"
                        else "issue"
                        end
                    )
                }
            ]' 2>/dev/null)
            if [ $? -eq 0 ] && [ -n "$parsed_sub_issues" ]; then
                sub_issues="$parsed_sub_issues"
            fi
        fi
    fi

    local parent_epic="null"
    local parent_story="null"
    local related_stories="[]"
    local related_tasks="[]"
    local sibling_tasks="[]"

    if printf '%s\n' "$graph_parent" | jq -e . >/dev/null 2>&1 && [ "$graph_parent" != "null" ]; then
        local graph_parent_type=$(printf '%s\n' "$graph_parent" | jq -r '.issue_type // "issue"' 2>/dev/null)
        if [ "$graph_parent_type" = "epic" ]; then
            parent_epic="$graph_parent"
        elif [ "$graph_parent_type" = "story" ]; then
            parent_story="$graph_parent"
        fi
    fi

    if [ -n "$epic_slug" ]; then
        local epic_scope_issues=$(list_related_issues_for_label "epic:$epic_slug" "")
        if [ "$parent_epic" = "null" ]; then
            parent_epic=$(echo "$epic_scope_issues" | jq 'map(select(.issue_type == "epic")) | first // null')
        fi

        if [ "$issue_type" = "epic" ]; then
            related_stories=$(echo "$epic_scope_issues" | jq 'map(select(.issue_type == "story"))')
            related_tasks=$(echo "$epic_scope_issues" | jq 'map(select(.issue_type == "task"))')
        fi
    fi

    if [ -n "$story_slug" ]; then
        local story_scope_issues=$(list_related_issues_for_label "story:$story_slug" "")
        if [ "$parent_story" = "null" ]; then
            parent_story=$(echo "$story_scope_issues" | jq 'map(select(.issue_type == "story")) | first // null')
        fi

        if [ "$issue_type" = "story" ]; then
            related_tasks=$(echo "$story_scope_issues" | jq 'map(select(.issue_type == "task"))')
        elif [ "$issue_type" = "task" ]; then
            sibling_tasks=$(echo "$story_scope_issues" | jq 'map(select(.issue_type == "task"))')

            if [ "$parent_epic" = "null" ]; then
                local parent_story_epic_slug=$(printf '%s\n' "$parent_story" | jq -r '.labels[]? | select(startswith("epic:")) | sub("^epic:"; "")' 2>/dev/null | head -n 1)
                if [ -n "$parent_story_epic_slug" ]; then
                    local parent_epic_scope=$(list_related_issues_for_label "epic:$parent_story_epic_slug" "")
                    parent_epic=$(echo "$parent_epic_scope" | jq 'map(select(.issue_type == "epic")) | first // null')
                    related_stories=$(echo "$parent_epic_scope" | jq 'map(select(.issue_type == "story"))')
                    related_tasks=$(echo "$parent_epic_scope" | jq 'map(select(.issue_type == "task"))')
                fi
            fi
        fi
    fi

    local empty_issue_summary='{"total":0,"epic_count":0,"story_count":0,"task_count":0,"other_count":0}'

    linked_issues=$(ensure_json_or_default "$linked_issues" "[]")
    linked_issue_details=$(ensure_json_or_default "$linked_issue_details" "[]")
    file_lists=$(ensure_json_or_default "$file_lists" "[]")
    sub_issues=$(ensure_json_or_default "$sub_issues" "[]")
    parent_epic=$(ensure_json_or_default "$parent_epic" "null")
    parent_story=$(ensure_json_or_default "$parent_story" "null")
    related_stories=$(ensure_json_or_default "$related_stories" "[]")
    related_tasks=$(ensure_json_or_default "$related_tasks" "[]")
    sibling_tasks=$(ensure_json_or_default "$sibling_tasks" "[]")

    local direct_sub_issue_summary=$(summarize_issue_collection "$sub_issues")
    local related_story_summary=$(summarize_issue_collection "$related_stories")
    local related_task_summary=$(summarize_issue_collection "$related_tasks")
    local sibling_task_summary=$(summarize_issue_collection "$sibling_tasks")

    direct_sub_issue_summary=$(ensure_json_or_default "$direct_sub_issue_summary" "$empty_issue_summary")
    related_story_summary=$(ensure_json_or_default "$related_story_summary" "$empty_issue_summary")
    related_task_summary=$(ensure_json_or_default "$related_task_summary" "$empty_issue_summary")
    sibling_task_summary=$(ensure_json_or_default "$sibling_task_summary" "$empty_issue_summary")

    # Build comprehensive JSON result
    local result=""
    result=$(jq -n \
        --arg issue_num "$issue_num" \
        --arg issue_type "$issue_type" \
        --arg epic_slug "$epic_slug" \
        --arg story_slug "$story_slug" \
        --argjson metadata "$issue_data" \
        --arg story_section "$story_section" \
        --arg acceptance_criteria "$acceptance_criteria" \
        --arg tasks "$tasks_section" \
        --arg dev_notes "$dev_notes" \
        --argjson linked_issues "$linked_issues" \
        --argjson linked_issue_details "$linked_issue_details" \
        --argjson file_lists "$file_lists" \
        --argjson sub_issues "$sub_issues" \
        --argjson parent_epic "$parent_epic" \
        --argjson parent_story "$parent_story" \
        --argjson related_stories "$related_stories" \
        --argjson related_tasks "$related_tasks" \
        --argjson sibling_tasks "$sibling_tasks" \
        --argjson direct_sub_issue_summary "$direct_sub_issue_summary" \
        --argjson related_story_summary "$related_story_summary" \
        --argjson related_task_summary "$related_task_summary" \
        --argjson sibling_task_summary "$sibling_task_summary" \
        '{
            issue_number: ($issue_num | tonumber),
            issue_type: $issue_type,
            metadata: {
                title: $metadata.title,
                state: $metadata.state,
                url: $metadata.url,
                labels: $metadata.labels,
                assignees: $metadata.assignees,
                milestone: $metadata.milestone,
                created_at: $metadata.createdAt,
                updated_at: $metadata.updatedAt,
                closed_at: $metadata.closedAt
            },
            slugs: {
                epic: (if $epic_slug == "" then null else $epic_slug end),
                story: (if $story_slug == "" then null else $story_slug end)
            },
            body: $metadata.body,
            parsed_sections: {
                story: $story_section,
                acceptance_criteria: $acceptance_criteria,
                tasks: $tasks,
                dev_notes: $dev_notes
            },
            linked_issues: $linked_issues,
            linked_issue_details: $linked_issue_details,
            sub_issues: $sub_issues,
            relationships: {
                parent_epic: $parent_epic,
                parent_story: $parent_story,
                direct_sub_issues: $sub_issues,
                related_stories: $related_stories,
                related_tasks: $related_tasks,
                sibling_tasks: $sibling_tasks,
                summaries: {
                    direct_sub_issues: $direct_sub_issue_summary,
                    related_stories: $related_story_summary,
                    related_tasks: $related_task_summary,
                    sibling_tasks: $sibling_task_summary
                }
            },
            file_lists: $file_lists
        }')

    if [ $? -ne 0 ] || ! is_valid_json "$result"; then
        output_error "Failed to build issue context JSON for #$issue_num"
    fi

    log_success "Successfully retrieved context for issue #$issue_num"
    output_json "$result"
}

#=============================================================================
# MIGRATION FUNCTIONS
#=============================================================================

#=============================================================================
# ARGUMENT PARSING HELPERS
#=============================================================================

parse_create_epic_args() {
    local title=""
    local body=""
    local epic_slug=""

    while [ $# -gt 0 ]; do
        case "$1" in
            --title)
                require_flag_value "$1" $#
                title="$2"
                shift 2
                ;;
            --body)
                require_flag_value "$1" $#
                body="$2"
                shift 2
                ;;
            --epic-slug)
                require_flag_value "$1" $#
                epic_slug="$2"
                shift 2
                ;;
            --*)
                output_error "Unknown option for create-epic: $1"
                ;;
            *)
                reject_positional_arg "create-epic" "$1"
                ;;
        esac
    done

    if [ -z "$title" ] || [ -z "$body" ] || [ -z "$epic_slug" ]; then
        output_error "Usage: create-epic --title <title> --body <body> --epic-slug <slug>"
    fi

    create_epic_issue "$title" "$body" "$epic_slug"
}

# Parse create-story arguments
# Syntax: create-story --title <title> --body <body> --story-slug <slug> [--epic-number <num> | --epic-title <fragment>] [--epic-slug <slug>]
parse_create_story_args() {
    local title=""
    local body=""
    local story_slug=""
    local epic_num=""
    local epic_title=""
    local epic_slug=""

    # Parse optional flags
    while [ $# -gt 0 ]; do
        case "$1" in
            --title)
                require_flag_value "$1" $#
                title="$2"
                shift 2
                ;;
            --body)
                require_flag_value "$1" $#
                body="$2"
                shift 2
                ;;
            --story-slug)
                require_flag_value "$1" $#
                story_slug="$2"
                shift 2
                ;;
            --epic-number)
                require_flag_value "$1" $#
                epic_num="$2"
                shift 2
                ;;
            --epic-title)
                require_flag_value "$1" $#
                epic_title="$2"
                shift 2
                ;;
            --epic-slug)
                require_flag_value "$1" $#
                epic_slug="$2"
                shift 2
                ;;
            --*)
                output_error "Unknown option for create-story: $1"
                ;;
            *)
                reject_positional_arg "create-story" "$1"
                ;;
        esac
    done

    if [ -z "$title" ] || [ -z "$body" ] || [ -z "$story_slug" ]; then
        output_error "Usage: create-story --title <title> --body <body> --story-slug <slug> [--epic-number <num> | --epic-title <fragment>] [--epic-slug <slug>]"
    fi

    if [ -n "$epic_num" ] || [ -n "$epic_title" ]; then
        require_one_issue_ref "create-story" "--epic-number" "$epic_num" "--epic-title" "$epic_title"

        local epic_ref
        if ! epic_ref=$(resolve_issue_ref "$epic_num" "$epic_title" "epic" "parent epic"); then
            exit 1
        fi
        epic_num=$(printf '%s\n' "$epic_ref" | jq -r '.number')

        if [ -z "$epic_slug" ]; then
            epic_slug=$(printf '%s\n' "$epic_ref" | jq -r '.slugs.epic // empty')
            if [ -z "$epic_slug" ]; then
                output_error "Could not infer --epic-slug from parent epic #$epic_num. Add an epic:<slug> label or pass --epic-slug explicitly."
            fi
        fi
    elif [ -n "$epic_slug" ]; then
        output_error "--epic-slug requires --epic-number or --epic-title when creating a story"
    fi

    # Call create_story_issue with parameter order: title, body, story_slug, epic_num, epic_slug
    create_story_issue "$title" "$body" "$story_slug" "$epic_num" "$epic_slug"
}

# Parse create-task arguments
# Syntax: create-task --title <title> --body <body> [--story-number <num> | --story-title <fragment>] [--story-slug <slug>] [--epic-slug <epic_slug>]
parse_create_task_args() {
    local title=""
    local body=""
    local story_num=""
    local story_title=""
    local story_slug=""
    local epic_slug=""

    # Parse optional flags
    while [ $# -gt 0 ]; do
        case "$1" in
            --title)
                require_flag_value "$1" $#
                title="$2"
                shift 2
                ;;
            --body)
                require_flag_value "$1" $#
                body="$2"
                shift 2
                ;;
            --story-number)
                require_flag_value "$1" $#
                story_num="$2"
                shift 2
                ;;
            --story-title)
                require_flag_value "$1" $#
                story_title="$2"
                shift 2
                ;;
            --story-slug)
                require_flag_value "$1" $#
                story_slug="$2"
                shift 2
                ;;
            --epic-slug)
                require_flag_value "$1" $#
                epic_slug="$2"
                shift 2
                ;;
            --*)
                output_error "Unknown option for create-task: $1"
                ;;
            *)
                reject_positional_arg "create-task" "$1"
                ;;
        esac
    done

    if [ -z "$title" ] || [ -z "$body" ]; then
        output_error "Usage: create-task --title <title> --body <body> [--story-number <num> | --story-title <fragment>] [--story-slug <slug>] [--epic-slug <epic_slug>]"
    fi

    if [ -n "$story_num" ] || [ -n "$story_title" ]; then
        require_one_issue_ref "create-task" "--story-number" "$story_num" "--story-title" "$story_title"

        local story_ref
        if ! story_ref=$(resolve_issue_ref "$story_num" "$story_title" "story" "parent story"); then
            exit 1
        fi
        story_num=$(printf '%s\n' "$story_ref" | jq -r '.number')

        if [ -z "$story_slug" ]; then
            story_slug=$(printf '%s\n' "$story_ref" | jq -r '.slugs.story // empty')
            if [ -z "$story_slug" ]; then
                output_error "Could not infer --story-slug from parent story #$story_num. Add a story:<slug> label or pass --story-slug explicitly."
            fi
        fi

        if [ -z "$epic_slug" ]; then
            epic_slug=$(printf '%s\n' "$story_ref" | jq -r '.slugs.epic // empty')
        fi
    elif [ -n "$story_slug" ]; then
        output_error "--story-slug requires --story-number or --story-title when creating a task"
    fi

    # Call create_task_issue with parameter order: title, body, story_num, story_slug, epic_slug
    create_task_issue "$title" "$body" "$story_num" "$story_slug" "$epic_slug"
}

parse_update_status_args() {
    local issue_num=""
    local issue_title=""
    local status=""

    while [ $# -gt 0 ]; do
        case "$1" in
            --issue-number)
                require_flag_value "$1" $#
                issue_num="$2"
                shift 2
                ;;
            --issue-title)
                require_flag_value "$1" $#
                issue_title="$2"
                shift 2
                ;;
            --status)
                require_flag_value "$1" $#
                status="$2"
                shift 2
                ;;
            --*)
                output_error "Unknown option for update-status: $1"
                ;;
            *)
                reject_positional_arg "update-status" "$1"
                ;;
        esac
    done

    require_one_issue_ref "update-status" "--issue-number" "$issue_num" "--issue-title" "$issue_title"

    if [ -z "$status" ]; then
        output_error "Usage: update-status (--issue-number <num> | --issue-title <fragment>) --status <status>"
    fi

    local issue_ref
    if ! issue_ref=$(resolve_issue_ref "$issue_num" "$issue_title" "" "issue"); then
        exit 1
    fi
    issue_num=$(printf '%s\n' "$issue_ref" | jq -r '.number')

    update_issue_status "$issue_num" "$status"
}

parse_list_stories_args() {
    local filter=""

    while [ $# -gt 0 ]; do
        case "$1" in
            --filter)
                require_flag_value "$1" $#
                filter="$2"
                shift 2
                ;;
            --*)
                output_error "Unknown option for list-stories: $1"
                ;;
            *)
                reject_positional_arg "list-stories" "$1"
                ;;
        esac
    done

    list_stories "$filter"
}

parse_get_issue_context_args() {
    local issue_num=""
    local issue_title=""

    while [ $# -gt 0 ]; do
        case "$1" in
            --issue-number)
                require_flag_value "$1" $#
                issue_num="$2"
                shift 2
                ;;
            --issue-title)
                require_flag_value "$1" $#
                issue_title="$2"
                shift 2
                ;;
            --*)
                output_error "Unknown option for get-issue-context: $1"
                ;;
            *)
                reject_positional_arg "get-issue-context" "$1"
                ;;
        esac
    done

    require_one_issue_ref "get-issue-context" "--issue-number" "$issue_num" "--issue-title" "$issue_title"

    local issue_ref
    if ! issue_ref=$(resolve_issue_ref "$issue_num" "$issue_title" "" "issue"); then
        exit 1
    fi
    issue_num=$(printf '%s\n' "$issue_ref" | jq -r '.number')

    get_issue_context "$issue_num"
}

#=============================================================================
# MAIN COMMAND HANDLER
#=============================================================================

main() {
    if [ $# -eq 0 ]; then
        print_usage
        exit 1
    fi
    
    local command="$1"
    shift
    
    case "$command" in
        "create-epic")
            parse_create_epic_args "$@"
            ;;
        "create-story")
            parse_create_story_args "$@"
            ;;
        "create-task")
            parse_create_task_args "$@"
            ;;
        "update-status")
            parse_update_status_args "$@"
            ;;
        "list-stories")
            parse_list_stories_args "$@"
            ;;
        "get-issue-context")
            parse_get_issue_context_args "$@"
            ;;
        "help"|"-h"|"--help")
            print_usage
            ;;
        "version"|"-v"|"--version")
            print_version
            ;;
        *)
            log_error "Unknown command: $command"
            echo ""
            print_usage
            exit 1
            ;;
    esac
}

# Execute main function with all arguments
main "$@"
