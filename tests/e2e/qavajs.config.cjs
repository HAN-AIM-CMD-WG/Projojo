const { App } = require('./support/page-object.cjs');

function createBaseConfig() {
  return {
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
      ['@qavajs/html-formatter', 'reports/report.html'],
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

module.exports = {
  default: {
    ...createBaseConfig(),
    paths: ['features/**/*.feature'],
  },
  selective: createBaseConfig(),
};
