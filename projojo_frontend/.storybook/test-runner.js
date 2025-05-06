import { checkA11y, injectAxe } from 'axe-playwright';

export default {
  async preVisit(page) {
    await injectAxe(page);
  },
  async postVisit(page) {
    await checkA11y(page, "#storybook-root", {
      detailedReport: true,
      detailedReportOptions: {
        html: true,
      },
      verbose: false,
    });
  },
};