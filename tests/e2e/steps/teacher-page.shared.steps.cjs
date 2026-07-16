// Shared teacher-page steps reused across the theme management suites
// (TS-task-010 list, TS-task-011 create modal, and the sibling theme tasks).

const { When } = require('@qavajs/core');

const { FRONTEND_URL } = require('../support/test-data.cjs');
const { page } = require('../support/e2e-session.cjs');

const TEACHER_PAGE_URL = `${FRONTEND_URL}/teacher`;

When('I open the TeacherPage', async function () {
  await page(this).goto(TEACHER_PAGE_URL);
});
