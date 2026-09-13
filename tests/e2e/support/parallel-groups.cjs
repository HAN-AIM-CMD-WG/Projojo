// Parallel E2E instance definitions and the feature partitioning per instance.
//
// WHY EXPLICIT GROUPS AND NOT --shard
// -----------------------------------
// The suite is not fully independent. Scenarios inside a feature file re-stage
// their own fixtures, but several feature files share mutable global state (the
// theme catalog, the public visibility of the proof project, projects created by
// TS-task-015 that cannot be deleted) and rely on running after a fresh seed in
// a known order. Cucumber's --shard splits round-robin over individual
// scenarios, which would tear those files apart, so instead each instance gets a
// whole set of feature files and still runs them serially (parallel: 1).
//
// Two invariants this partitioning preserves:
//   1. A feature file is never split across instances.
//   2. Every group lists its files in the same alphabetical order the serial run
//      uses, so the relative order of any two files that end up in the same
//      instance is unchanged. Files that end up in different instances get
//      different TypeDB databases, which is stricter isolation than before.
//
// BALANCING
// ---------
// Groups are balanced on weighted cost, not scenario count: a @ui scenario
// launches a fresh Chromium and costs roughly 3x an @api scenario. Current
// weighted load per group is within ~15%. The orchestrator prints the wall time
// of every group, so rebalancing means moving a feature file between the lists
// below and nothing else.
//
// PORTS
// -----
// The ports here must stay in sync with docker-compose.parallel.yml.

const PARALLEL_GROUPS = Object.freeze([
  Object.freeze({
    // Portfolio API baseline + schema probes. Mostly @api, plus the two
    // SDG badge UI suites to even out the browser load.
    id: 1,
    name: 'portfolio-api',
    profile: 'parallel1',
    backendService: 'backend1',
    frontendService: 'frontend1',
    frontendUrl: 'http://localhost:10211',
    backendUrl: 'http://localhost:10212',
    paths: Object.freeze([
      'features/bug-404-overview-search-during-load.feature',
      'features/development-login.feature',
      'features/pf-task-001-legacy-portfolio-decommission.feature',
      'features/pf-task-002a-canonical-portfolio-item-schema.feature',
      'features/pf-task-002b-portfolio-review-schema.feature',
      'features/pf-task-002c-student-portfolio-settings-schema.feature',
      'features/pf-task-002d-portfolio-seed-fixtures-and-reset-contract.feature',
      'features/pf-task-003-authenticated-portfolio-api-baseline.feature',
      'features/pf-task-004-registration-lifecycle-api.feature',
      'features/pf-task-005-completion-portfolio-item-review-api.feature',
      'features/pf-task-006-revert-recompletion-api.feature',
      'features/pf-task-007a-authenticated-portfolio-read-access-matrix.feature',
      'features/pf-task-007b-supervisor-authenticated-public-item-filtering.feature',
      'features/pf-task-007c-student-authenticated-public-retraction-api.feature',
      'features/pf-task-007d-authenticated-portfolio-response-contract-examples.feature',
      'features/pf-task-008-review-creation-and-editing.feature',
      'features/ts-task-022-sdg-badge-component.feature',
      'features/ts-task-023-sdg-badge-integration.feature',
    ]),
  }),
  Object.freeze({
    // Portfolio curation and world-public portfolio, plus the theme modal UI
    // suites. PF-task-009 through 013 stay together because they share the
    // archived-source and slug fixtures.
    id: 2,
    name: 'portfolio-curation',
    profile: 'parallel2',
    backendService: 'backend2',
    frontendService: 'frontend2',
    frontendUrl: 'http://localhost:10221',
    backendUrl: 'http://localhost:10222',
    paths: Object.freeze([
      'features/pf-task-009-archived-source-context.feature',
      'features/pf-task-010-student-summary-slug-and-public-settings.feature',
      'features/pf-task-011a-student-item-curation.feature',
      'features/pf-task-011b-teacher-soft-hide.feature',
      'features/pf-task-012a-student-review-world-public-selection.feature',
      'features/pf-task-012b-reviewer-public-use-notice.feature',
      'features/pf-task-013-world-public-portfolio-api-and-route.feature',
      'features/ts-task-011-theme-create-modal.feature',
      'features/ts-task-012-theme-edit-modal.feature',
      'features/ts-task-013-theme-delete-confirmation.feature',
      'features/ts-task-014-theme-picker.feature',
    ]),
  }),
  Object.freeze({
    // All theme-integrity API suites belong together: they share
    // theme-integrity.steps.cjs and create themes without per-scenario cleanup,
    // so they must not run next to a concurrent catalog reset. TS-task-015 and
    // its consumers (016, 017) stay in this order because 015 creates projects
    // that cannot be deleted.
    id: 3,
    name: 'theme-integrity',
    profile: 'parallel3',
    backendService: 'backend3',
    frontendService: 'frontend3',
    frontendUrl: 'http://localhost:10231',
    backendUrl: 'http://localhost:10232',
    paths: Object.freeze([
      'features/api-memory.feature',
      'features/project-theme-ownership.feature',
      'features/stack-health.feature',
      'features/theme-atomic-linking.feature',
      'features/theme-input-validation.feature',
      'features/theme-jwt-middleware-exclusion.feature',
      'features/theme-link-existence-validation.feature',
      'features/theme-name-uniqueness.feature',
      'features/ts-task-010-theme-management-list.feature',
      'features/ts-task-015-theme-on-project-create.feature',
      'features/ts-task-016-theme-on-project-edit.feature',
      'features/ts-task-017-theme-inline-edit-details.feature',
    ]),
  }),
  Object.freeze({
    // Theme display surfaces. TS-task-020 flips the public visibility of the
    // proof project and restores it in an After hook; keeping it away from
    // api-memory and stack-health (group 3) means a leak can no longer reach
    // them at all.
    id: 4,
    name: 'theme-display',
    profile: 'parallel4',
    backendService: 'backend4',
    frontendService: 'frontend4',
    frontendUrl: 'http://localhost:10241',
    backendUrl: 'http://localhost:10242',
    paths: Object.freeze([
      'features/ts-task-009-business-complete-themes.feature',
      'features/ts-task-018-projectcard-theme-badges.feature',
      'features/ts-task-019-theme-display-on-project-details.feature',
      'features/ts-task-020-overviewpage-theme-source.feature',
      'features/ts-task-021-supervisor-dashboard-themes.feature',
      'features/ts-task-024-student-interest-api.feature',
      'features/ts-task-028-duplicate-sdg-codes.feature',
    ]),
  }),
]);

const PARALLEL_COMPOSE_PROJECT = 'projojo-e2e-parallel';
const PARALLEL_COMPOSE_FILES = ['docker-compose.parallel.yml'];
const PARALLEL_ENV_FILE = '.env.test';

// Environment every parallel worker (preflight and qavajs run) needs so that
// support/test-data.cjs and support/compose.cjs target the right instance.
function groupEnv(group) {
  return {
    PROJOJO_FRONTEND_URL: group.frontendUrl,
    PROJOJO_BACKEND_URL: group.backendUrl,
    PROJOJO_COMPOSE_PROJECT: PARALLEL_COMPOSE_PROJECT,
    PROJOJO_COMPOSE_FILES: PARALLEL_COMPOSE_FILES.join(','),
    PROJOJO_COMPOSE_ENV_FILE: PARALLEL_ENV_FILE,
    PROJOJO_BACKEND_SERVICE: group.backendService,
    E2E_REPORT_PATH: `reports/report-parallel-${group.id}.html`,
  };
}

module.exports = {
  PARALLEL_COMPOSE_FILES,
  PARALLEL_COMPOSE_PROJECT,
  PARALLEL_ENV_FILE,
  PARALLEL_GROUPS,
  groupEnv,
};
