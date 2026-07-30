const FRONTEND_URL = process.env.PROJOJO_FRONTEND_URL ?? 'http://localhost:10121';
const BACKEND_URL = process.env.PROJOJO_BACKEND_URL ?? 'http://localhost:10122';

const LOGIN_URL = `${FRONTEND_URL}/login`;
const PUBLIC_DISCOVERY_URL = `${FRONTEND_URL}/publiek`;

const PROOF_SEED_MARKER = 'PROJOJO_E2E_INFRASTRUCTURE_V1';
const PROOF_BUSINESS_NAME = 'E2E Infrastructure Business';
const PROOF_PROJECT_NAME = 'E2E Infrastructure Proof Project';
const PROOF_BUSINESS_ID = '30000000-0000-4000-8000-000000000001';
const PROOF_PROJECT_ID = '40000000-0000-4000-8000-000000000001';
const PROOF_TEACHER_USER_ID = '20000000-0000-4000-8000-000000000001';
const PROOF_STUDENT_USER_ID = '20000000-0000-4000-8000-000000000002';
const PROOF_SUPERVISOR_NAME = 'Sanne Testbegeleider';
const PROOF_SUPERVISOR_USER_ID = '20000000-0000-4000-8000-000000000003';
const CROSS_BUSINESS_PROJECT_ID = '40000000-0000-4000-8000-000000000003';
const PROOF_TASK_ID = '50000000-0000-4000-8000-000000000001';
const E2E_TEACHER_ID = '20000000-0000-4000-8000-000000000001';
const E2E_STUDENT_ID = '20000000-0000-4000-8000-000000000002';
const ARCHIVED_SOURCE_BUSINESS_ID = '30000000-0000-4000-8000-000000000003';
const ARCHIVED_SOURCE_PROJECT_ID = '40000000-0000-4000-8000-000000000002';
const ARCHIVED_SOURCE_TASK_ID = '50000000-0000-4000-8000-000000000002';
const ARCHIVED_SOURCE_REGISTRATION_ID = 'pf-seed-registration-archived-source';

const PORTFOLIO_SEED_ALIASES = Object.freeze({
  actors: Object.freeze({
    student: Object.freeze({ alias: 'portfolio-owner-student', id: E2E_STUDENT_ID, fullName: 'Tom Teststudent' }),
    privateStudent: Object.freeze({ alias: 'portfolio-private-student', id: '20000000-0000-4000-8000-000000000005', fullName: 'Priya Priveportfolio' }),
    // Historical name: this fixture now carries a seeded slug (slugs are assigned at account
    // creation); it is the "clean slate" student used to read settings from a world-private default.
    noSlugStudent: Object.freeze({ alias: 'portfolio-no-slug-student', id: '20000000-0000-4000-8000-000000000010', fullName: 'Nora Nieuwslug' }),
    settingsStudent: Object.freeze({ alias: 'portfolio-settings-student', id: '20000000-0000-4000-8000-000000000011', fullName: 'Sven Instellingen' }),
    teacher: Object.freeze({ alias: 'portfolio-teacher', id: E2E_TEACHER_ID, fullName: 'Tessa Testdocent' }),
    secondTeacher: Object.freeze({ alias: 'portfolio-second-teacher', id: '20000000-0000-4000-8000-000000000012', fullName: 'Twan Tweededocent' }),
    relatedSupervisor: Object.freeze({ alias: 'portfolio-related-supervisor', id: '20000000-0000-4000-8000-000000000003', fullName: 'Sanne Testbegeleider' }),
    unrelatedSupervisor: Object.freeze({ alias: 'portfolio-unrelated-supervisor', id: '20000000-0000-4000-8000-000000000004', fullName: 'Umar Onverwant' }),
    everAcceptedSupervisor: Object.freeze({ alias: 'portfolio-ever-accepted-supervisor', id: '20000000-0000-4000-8000-000000000008', fullName: 'Evi Eerdergeaccepteerd' }),
    openApplicationSupervisor: Object.freeze({ alias: 'portfolio-open-application-supervisor', id: '20000000-0000-4000-8000-000000000006', fullName: 'Otis Openaanvraag' }),
    rejectedApplicationSupervisor: Object.freeze({ alias: 'portfolio-rejected-application-supervisor', id: '20000000-0000-4000-8000-000000000007', fullName: 'Rian Afgewezen' }),
  }),
  businesses: Object.freeze({
    related: Object.freeze({ alias: 'portfolio-related-business', id: PROOF_BUSINESS_ID, name: 'E2E Infrastructure Business' }),
    unrelated: Object.freeze({ alias: 'portfolio-unrelated-business', id: '30000000-0000-4000-8000-000000000002', name: 'Portfolio Unrelated Business' }),
    archivedSource: Object.freeze({ alias: 'portfolio-archived-source-business', id: ARCHIVED_SOURCE_BUSINESS_ID, name: 'Portfolio Archived Source Business' }),
    openApplication: Object.freeze({ alias: 'portfolio-open-application-business', id: '30000000-0000-4000-8000-000000000004', name: 'Portfolio Open Application Business' }),
    rejectedApplication: Object.freeze({ alias: 'portfolio-rejected-application-business', id: '30000000-0000-4000-8000-000000000005', name: 'Portfolio Rejected Application Business' }),
    everAccepted: Object.freeze({ alias: 'portfolio-ever-accepted-business', id: '30000000-0000-4000-8000-000000000006', name: 'Portfolio Ever Accepted Business' }),
  }),
  source: Object.freeze({
    registration: Object.freeze({ alias: 'portfolio-completed-registration', id: 'pf-seed-registration-completed' }),
    task: Object.freeze({ alias: 'portfolio-source-task', id: PROOF_TASK_ID }),
    project: Object.freeze({ alias: 'portfolio-source-project', id: PROOF_PROJECT_ID }),
    business: Object.freeze({ alias: 'portfolio-source-business', id: PROOF_BUSINESS_ID }),
    archivedRegistration: Object.freeze({ alias: 'portfolio-archived-source-registration', id: ARCHIVED_SOURCE_REGISTRATION_ID }),
    archivedTask: Object.freeze({ alias: 'portfolio-archived-source-task', id: ARCHIVED_SOURCE_TASK_ID }),
    archivedProject: Object.freeze({ alias: 'portfolio-archived-source-project', id: ARCHIVED_SOURCE_PROJECT_ID }),
    archivedBusiness: Object.freeze({ alias: 'portfolio-archived-source-business-record', id: ARCHIVED_SOURCE_BUSINESS_ID }),
  }),
  lifecycle: Object.freeze({
    acceptedForStart: Object.freeze({ alias: 'portfolio-lifecycle-accepted-for-start', taskId: '50000000-0000-4000-8000-000000000010', registrationId: 'pf-task-004-accepted-for-start' }),
    pendingStartRejected: Object.freeze({ alias: 'portfolio-lifecycle-pending-start-rejected', taskId: '50000000-0000-4000-8000-000000000011', registrationId: 'pf-task-004-pending-start-rejected' }),
    rejectedStartRejected: Object.freeze({ alias: 'portfolio-lifecycle-rejected-start-rejected', taskId: '50000000-0000-4000-8000-000000000012', registrationId: 'pf-task-004-rejected-start-rejected' }),
    startedStartRejected: Object.freeze({ alias: 'portfolio-lifecycle-started-start-rejected', taskId: '50000000-0000-4000-8000-000000000013', registrationId: 'pf-task-004-started-start-rejected' }),
    completedStartRejected: Object.freeze({ alias: 'portfolio-lifecycle-completed-start-rejected', taskId: '50000000-0000-4000-8000-000000000014', registrationId: 'pf-task-004-completed-start-rejected' }),
    acceptedCompletionRejected: Object.freeze({ alias: 'portfolio-lifecycle-accepted-completion-rejected', taskId: '50000000-0000-4000-8000-000000000015', registrationId: 'pf-task-004-accepted-completion-rejected' }),
    startedForCompletion: Object.freeze({ alias: 'portfolio-lifecycle-started-for-completion', taskId: '50000000-0000-4000-8000-000000000016', registrationId: 'pf-task-004-started-for-completion' }),
    studentDenied: Object.freeze({ alias: 'portfolio-lifecycle-student-denied', taskId: '50000000-0000-4000-8000-000000000017', registrationId: 'pf-task-004-student-denied' }),
    supervisorDenied: Object.freeze({ alias: 'portfolio-lifecycle-supervisor-denied', taskId: '50000000-0000-4000-8000-000000000018', registrationId: 'pf-task-004-supervisor-denied' }),
    timelineAccess: Object.freeze({ alias: 'portfolio-lifecycle-timeline-access', taskId: '50000000-0000-4000-8000-000000000019', registrationId: 'pf-task-004-timeline-access' }),
    startedForRevert: Object.freeze({ alias: 'portfolio-lifecycle-started-for-revert', taskId: '50000000-0000-4000-8000-000000000020', registrationId: 'pf-task-004-started-for-revert' }),
    completedForRevert: Object.freeze({ alias: 'portfolio-lifecycle-completed-for-revert', taskId: '50000000-0000-4000-8000-000000000021', registrationId: 'pf-task-004-completed-for-revert' }),
    supervisorStartAllowed: Object.freeze({ alias: 'portfolio-lifecycle-supervisor-start-allowed', taskId: '50000000-0000-4000-8000-000000000022', registrationId: 'pf-task-004-supervisor-start-allowed' }),
    supervisorCompletionAllowed: Object.freeze({ alias: 'portfolio-lifecycle-supervisor-completion-allowed', taskId: '50000000-0000-4000-8000-000000000023', registrationId: 'pf-task-004-supervisor-completion-allowed' }),
  }),
  // NOTE: every alias listed under `items` is automatically enrolled into the
  // pf-task-002d seed-fixtures probe, which asserts each item's source fields match the
  // shared "completed" source (see pf-task-002d-...steps.cjs). Keep new items' source_*,
  // student name and image consistent with that source, or add archived-source handling there.
  items: Object.freeze({
    noRatings: Object.freeze({ alias: 'portfolio-item-no-ratings', id: 'pf-seed-item-no-ratings' }),
    allRatingsGood: Object.freeze({ alias: 'portfolio-item-all-ratings-good', id: 'pf-seed-item-all-ratings-good' }),
    lowRating: Object.freeze({ alias: 'portfolio-item-low-rating', id: 'pf-seed-item-low-rating' }),
    mixedRatings: Object.freeze({ alias: 'portfolio-item-mixed-ratings', id: 'pf-seed-item-mixed-ratings' }),
    hidden: Object.freeze({ alias: 'portfolio-item-hidden', id: 'pf-seed-item-hidden' }),
    retractedAuthenticatedPublic: Object.freeze({ alias: 'portfolio-item-retracted-authenticated-public', id: 'pf-seed-item-retracted-authenticated-public' }),
    retired: Object.freeze({ alias: 'portfolio-item-retired', id: 'pf-seed-item-retired' }),
    worldPublicSelected: Object.freeze({ alias: 'portfolio-item-world-public-selected', id: 'pf-seed-item-world-public-selected' }),
    archivedSource: Object.freeze({ alias: 'portfolio-item-archived-source', id: 'pf-seed-item-archived-source' }),
  }),
  reviews: Object.freeze({
    noRating: Object.freeze({ alias: 'portfolio-review-no-rating', id: 'pf-seed-review-no-rating' }),
    goodTeacher: Object.freeze({ alias: 'portfolio-review-good-teacher', id: 'pf-seed-review-good-teacher' }),
    goodSupervisor: Object.freeze({ alias: 'portfolio-review-good-supervisor', id: 'pf-seed-review-good-supervisor' }),
    lowRating: Object.freeze({ alias: 'portfolio-review-low-rating', id: 'pf-seed-review-low-rating' }),
    hidden: Object.freeze({ alias: 'portfolio-review-hidden', id: 'pf-seed-review-hidden' }),
    retracted: Object.freeze({ alias: 'portfolio-review-retracted', id: 'pf-seed-review-retracted' }),
    worldPublicSelected: Object.freeze({ alias: 'portfolio-review-world-public-selected', id: 'pf-seed-review-world-public-selected' }),
    archivedSource: Object.freeze({ alias: 'portfolio-review-archived-source', id: 'pf-seed-review-archived-source' }),
  }),
  ratingStates: Object.freeze({
    noRatings: Object.freeze({ alias: 'portfolio-rating-state-no-ratings', itemId: 'pf-seed-item-no-ratings' }),
    allRatingsAtLeastThree: Object.freeze({ alias: 'portfolio-rating-state-all-ratings-at-least-three', itemId: 'pf-seed-item-all-ratings-good' }),
    belowThree: Object.freeze({ alias: 'portfolio-rating-state-below-three', itemId: 'pf-seed-item-low-rating' }),
  }),
  publicSlugs: Object.freeze({
    existing: Object.freeze({ alias: 'portfolio-public-slug-existing', slug: 'portfolio-seed-world-public' }),
    private: Object.freeze({ alias: 'portfolio-public-slug-private', slug: 'portfolio-seed-private' }),
    unused: Object.freeze({ alias: 'portfolio-public-slug-unused', slug: 'portfolio-seed-unused-slug' }),
  }),
  archivedSourceState: Object.freeze({
    alias: 'portfolio-archived-source-state',
    itemId: 'pf-seed-item-archived-source',
    registrationId: ARCHIVED_SOURCE_REGISTRATION_ID,
    taskId: ARCHIVED_SOURCE_TASK_ID,
    projectId: ARCHIVED_SOURCE_PROJECT_ID,
    businessId: ARCHIVED_SOURCE_BUSINESS_ID,
  }),
});

module.exports = {
  FRONTEND_URL,
  BACKEND_URL,
  LOGIN_URL,
  PUBLIC_DISCOVERY_URL,
  PROOF_SEED_MARKER,
  PROOF_BUSINESS_NAME,
  PROOF_PROJECT_NAME,
  PROOF_BUSINESS_ID,
  PROOF_PROJECT_ID,
  PROOF_TEACHER_USER_ID,
  PROOF_STUDENT_USER_ID,
  PROOF_SUPERVISOR_NAME,
  PROOF_SUPERVISOR_USER_ID,
  CROSS_BUSINESS_PROJECT_ID,
  ARCHIVED_SOURCE_PROJECT_ID,
  PROOF_TASK_ID,
  E2E_TEACHER_ID,
  E2E_STUDENT_ID,
  PORTFOLIO_SEED_ALIASES,
};
