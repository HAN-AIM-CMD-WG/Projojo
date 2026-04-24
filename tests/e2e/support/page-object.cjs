const { locator } = require('@qavajs/steps-playwright/po.js');

const { PROOF_PROJECT_ID, PROOF_SUPERVISOR_NAME } = require('./test-data.cjs');

class App {
  PageBody = locator('body');

  MainHeading = locator('main h1');

  SupervisorRoleTab = locator('button:has-text("Begeleider")');

  ProofSupervisorUserButton = locator(`button:has-text("${PROOF_SUPERVISOR_NAME}")`);

  ProofProjectLink = locator(`a[href="/projects/${PROOF_PROJECT_ID}"]`);
}

module.exports = { App };
