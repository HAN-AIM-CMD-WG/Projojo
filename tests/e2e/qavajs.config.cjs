const { App } = require('./support/page-object.cjs');
const { PARALLEL_GROUPS } = require('./support/parallel-groups.cjs');

// Every worker writes its own report so parallel instances do not overwrite each
// other. The orchestrator sets E2E_REPORT_PATH per instance; a plain run keeps
// the documented reports/report.html location.
const REPORT_PATH = process.env.E2E_REPORT_PATH ?? 'reports/report.html';

function createBaseConfig() {
  return {
    // Lifecycle feature files reset shared deterministic TypeDB fixtures, so keep E2E execution serial.
    // This stays 1 for parallel runs too: parallelism there comes from running
    // several isolated stacks, each with its own TypeDB database, never from
    // concurrent scenarios against one database.
    parallel: 1,
    defaultTimeout: 20_000,
    require: [
      'node_modules/@qavajs/steps-playwright/index.js',
      'node_modules/@qavajs/steps-memory/index.js',
      'steps/**/*.cjs',
    ],
    memory: {},
    format: [
      '@qavajs/console-formatter',
      ['@qavajs/html-formatter', REPORT_PATH],
    ],
    formatOptions: {
      console: {
        showLogs: true,
        showProgress: true,
      },
      htmlConfig: {
        metadata: {
          Environment: 'isolated-test-docker',
          Browser: 'chromium',
          Scope: 'neutral-infrastructure-proof',
        },
      },
    },
    browser: {
      timeout: {
        present: 10_000,
        visible: 20_000,
        page: 10_000,
        value: 5_000,
        valueInterval: 500,
      },
      capabilities: {
        browserName: 'chromium',
      },
    },
    pageObject: new App(),
  };
}

// One profile per parallel instance, e.g. --profile parallel3. The orchestrator
// (scripts/run-parallel.cjs) selects these; they are also usable by hand once a
// parallel stack is up.
const parallelProfiles = Object.fromEntries(
  PARALLEL_GROUPS.map((group) => [
    group.profile,
    {
      ...createBaseConfig(),
      paths: [...group.paths],
    },
  ]),
);

module.exports = {
  default: {
    ...createBaseConfig(),
    paths: ['features/**/*.feature'],
  },
  selective: createBaseConfig(),
  ...parallelProfiles,
};
