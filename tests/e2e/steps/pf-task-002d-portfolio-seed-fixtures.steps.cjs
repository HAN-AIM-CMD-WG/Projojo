const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');

const { Given, Then } = require('@qavajs/core');
const { PORTFOLIO_SEED_ALIASES } = require('../support/test-data.cjs');

const execFileAsync = promisify(execFile);

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const TEST_SEED_PATH = path.join(REPO_ROOT, 'projojo_backend', 'db', 'test_seed.tql');
const DOCKER_COMPOSE_ARGS = [
  'compose',
  '--env-file',
  '.env.test',
  '-p',
  'projojo-e2e',
  '-f',
  'docker-compose.base.yml',
  '-f',
  'docker-compose.test.yml',
];

const PORTFOLIO_SEED_PROBE = String.raw`
import json
import os

from db.initDatabase import Db


ALIASES = json.loads(os.environ['PORTFOLIO_SEED_ALIASES'])


def quote(value: str) -> str:
    return json.dumps(value)


def rows(query: str) -> list[dict]:
    return Db.read_transact(query, sort_fields=False)


def one(label: str, query: str) -> dict:
    result = rows(query)
    if len(result) != 1:
        raise AssertionError(f"Expected exactly one {label}, found {len(result)}: {result}")
    return result[0]


def user(user_type: str, fixture: dict) -> dict:
    return one(fixture['alias'], f"""
match
  $user isa {user_type}, has id {quote(fixture['id'])};
fetch {{
  'id': $user.id,
  'full_name': $user.fullName,
  'email': $user.email
}};
""")


def student(fixture: dict) -> dict:
    return one(fixture['alias'], f"""
match
  $student isa student, has id {quote(fixture['id'])};
fetch {{
  'id': $student.id,
  'full_name': $student.fullName,
  'portfolio_summary': [$student.portfolioSummary],
  'portfolio_slug': [$student.portfolioSlug],
  'is_portfolio_world_public': [$student.isPortfolioWorldPublic]
}};
""")


def business(fixture: dict) -> dict:
    return one(fixture['alias'], f"""
match
  $business isa business, has id {quote(fixture['id'])};
fetch {{
  'id': $business.id,
  'name': $business.name,
  'location': $business.location,
  'is_archived': [$business.isArchived]
}};
""")


def project(fixture: dict) -> dict:
    return one(fixture['alias'], f"""
match
  $project isa project, has id {quote(fixture['id'])};
fetch {{
  'id': $project.id,
  'name': $project.name,
  'is_archived': [$project.isArchived]
}};
""")


def task(fixture: dict) -> dict:
    return one(fixture['alias'], f"""
match
  $task isa task, has id {quote(fixture['id'])};
fetch {{
  'id': $task.id,
  'name': $task.name
}};
""")


def business_project_link(business_id: str, project_id: str) -> dict:
    return one('source business/project link', f"""
match
  $business isa business, has id {quote(business_id)};
  $project isa project, has id {quote(project_id)};
  $link isa hasProjects (business: $business, project: $project);
fetch {{
  'business_id': $business.id,
  'project_id': $project.id
}};
""")


def project_task_link(project_id: str, task_id: str) -> dict:
    return one('source project/task link', f"""
match
  $project isa project, has id {quote(project_id)};
  $task isa task, has id {quote(task_id)};
  $link isa containsTask (project: $project, task: $task);
fetch {{
  'project_id': $project.id,
  'task_id': $task.id
}};
""")


def related_management(supervisor_id: str, business_id: str) -> dict:
    return one('related supervisor management', f"""
match
  $supervisor isa supervisor, has id {quote(supervisor_id)};
  $business isa business, has id {quote(business_id)};
  $management isa manages (supervisor: $supervisor, business: $business);
fetch {{
  'supervisor_id': $supervisor.id,
  'business_id': $business.id,
  'business_name': $business.name
}};
""")


def registration() -> dict:
    return registration_for(ALIASES['source']['registration'], ALIASES['source']['task'])


def registration_for(fixture: dict, task_fixture: dict) -> dict:
    student_id = ALIASES['actors']['student']['id']
    task_id = task_fixture['id']
    return one(fixture['alias'], f"""
match
  $student isa student, has id {quote(student_id)};
  $task isa task, has id {quote(task_id)};
  $registration isa registersForTask (student: $student, task: $task), has id {quote(fixture['id'])};
fetch {{
  'id': $registration.id,
  'task_id': $task.id,
  'is_accepted': [$registration.isAccepted],
  'started_at': [$registration.startedAt],
  'completed_at': [$registration.completedAt]
}};
""")


def unrelated_source_links() -> list[dict]:
    unrelated_supervisor_id = ALIASES['actors']['unrelatedSupervisor']['id']
    unrelated_business_id = ALIASES['businesses']['unrelated']['id']
    source_project_id = ALIASES['source']['project']['id']
    archived_project_id = ALIASES['source']['archivedProject']['id']
    return rows(f"""
match
  {{ $project isa project, has id {quote(source_project_id)}; }} or {{ $project isa project, has id {quote(archived_project_id)}; }};
  {{
    $business isa business, has id {quote(unrelated_business_id)};
    $link isa hasProjects (business: $business, project: $project);
  }} or {{
    $supervisor isa supervisor, has id {quote(unrelated_supervisor_id)};
    $created isa creates (supervisor: $supervisor, project: $project);
  }};
fetch {{
  'project_id': $project.id
}};
""")


def item(fixture: dict) -> dict:
    student_id = ALIASES['actors']['student']['id']
    return one(fixture['alias'], f"""
match
  $student isa student, has id {quote(student_id)};
  $ownership isa hasPortfolio (student: $student, item: $item);
  $item isa portfolioItem, has id {quote(fixture['id'])};
fetch {{
  'id': $item.id,
  'source_registration_id': $item.sourceRegistrationId,
  'source_task_id': $item.sourceTaskId,
  'source_project_id': $item.sourceProjectId,
  'source_business_id': $item.sourceBusinessId,
  'task_name': $item.taskName,
  'project_name': $item.projectName,
  'business_name': $item.businessName,
  'skill_names': [$item.skillName],
  'is_retired': $item.isRetired,
  'is_hidden': $item.isHidden,
  'hidden_by_role': [$item.hiddenByRole],
  'display_order': [$item.displayOrder],
  'is_authenticated_public_retraction': $item.isAuthenticatedPublicRetraction,
  'is_world_visible': $item.isWorldVisible,
  'source_task_archived': [$item.sourceTaskArchived],
  'source_project_archived': [$item.sourceProjectArchived],
  'source_business_archived': [$item.sourceBusinessArchived]
}};
""")


def reviews_for_item(item_id: str) -> list[dict]:
    return rows(f"""
match
  $item isa portfolioItem, has id {quote(item_id)};
  $item_review isa hasPortfolioReview (item: $item, review: $review);
  $authorship isa portfolioReviewAuthor (review: $review, author: $author);
fetch {{
  'id': $review.id,
  'review_text': $review.reviewText,
  'rating': [$review.rating],
  'is_world_visible': $review.isWorldVisible,
  'author_id': $author.id
}};
""")


def review(fixture: dict) -> dict:
    return one(fixture['alias'], f"""
match
  $review isa portfolioReview, has id {quote(fixture['id'])};
  $item_review isa hasPortfolioReview (item: $item, review: $review);
  $authorship isa portfolioReviewAuthor (review: $review, author: $author);
fetch {{
  'id': $review.id,
  'review_text': $review.reviewText,
  'rating': [$review.rating],
  'is_world_visible': $review.isWorldVisible,
  'item_id': $item.id,
  'author_id': $author.id
}};
""")


def slug_rows(slug: str) -> list[dict]:
    return rows(f"""
match
  $student isa student, has portfolioSlug {quote(slug)};
fetch {{
  'student_id': $student.id,
  'portfolio_slug': $student.portfolioSlug,
  'is_portfolio_world_public': [$student.isPortfolioWorldPublic]
}};
""")


def probe() -> dict:
    actors = ALIASES['actors']
    businesses = ALIASES['businesses']
    source = ALIASES['source']
    items = {key: item(value) for key, value in ALIASES['items'].items()}
    reviews = {key: review(value) for key, value in ALIASES['reviews'].items()}

    return {
        'aliases': ALIASES,
        'actors': {
            'student': student(actors['student']),
            'teacher': user('teacher', actors['teacher']),
            'relatedSupervisor': user('supervisor', actors['relatedSupervisor']),
            'unrelatedSupervisor': user('supervisor', actors['unrelatedSupervisor']),
        },
        'businesses': {
            'related': business(businesses['related']),
            'unrelated': business(businesses['unrelated']),
            'archivedSource': business(businesses['archivedSource']),
        },
        'management': {
            'related': related_management(actors['relatedSupervisor']['id'], businesses['related']['id']),
            'unrelated': related_management(actors['unrelatedSupervisor']['id'], businesses['unrelated']['id']),
        },
        'source': {
            'registration': registration(),
            'task': task(source['task']),
            'project': project(source['project']),
            'business': business(source['business']),
            'businessProjectLink': business_project_link(source['business']['id'], source['project']['id']),
            'projectTaskLink': project_task_link(source['project']['id'], source['task']['id']),
            'archivedRegistration': registration_for(source['archivedRegistration'], source['archivedTask']),
            'archivedTask': task(source['archivedTask']),
            'archivedProject': project(source['archivedProject']),
            'archivedBusiness': business(source['archivedBusiness']),
            'archivedBusinessProjectLink': business_project_link(source['archivedBusiness']['id'], source['archivedProject']['id']),
            'archivedProjectTaskLink': project_task_link(source['archivedProject']['id'], source['archivedTask']['id']),
        },
        'items': items,
        'reviews': reviews,
        'reviewsByItem': {key: reviews_for_item(value['id']) for key, value in ALIASES['items'].items()},
        'slugs': {
            'existing': slug_rows(ALIASES['publicSlugs']['existing']['slug']),
            'private': slug_rows(ALIASES['publicSlugs']['private']['slug']),
            'unused': slug_rows(ALIASES['publicSlugs']['unused']['slug']),
        },
        'unrelatedSourceLinks': unrelated_source_links(),
    }


def main() -> None:
    try:
        result = probe()
    except Exception as error:
        result = {'probe_error': str(error)}
    finally:
        Db.close()

    print(json.dumps(result))


if __name__ == '__main__':
    main()
`;

function getSeedResult(world) {
  const result = world.pfTask002d;
  assert.ok(result, 'Expected a stored PF-task-002d seed probe result');
  assert.equal(result.probe_error, undefined, `Portfolio seed probe failed unexpectedly: ${result.probe_error}`);
  return result;
}

function flattenedAliasObjects(value) {
  if (!value || typeof value !== 'object') return [];
  if (Object.hasOwn(value, 'alias')) return [value];

  return Object.values(value).flatMap(flattenedAliasObjects);
}

async function runPortfolioSeedProbe() {
  const { stdout, stderr } = await execFileAsync(
    'docker',
    [
      ...DOCKER_COMPOSE_ARGS,
      'exec',
      '-T',
      '-e',
      `PORTFOLIO_SEED_ALIASES=${JSON.stringify(PORTFOLIO_SEED_ALIASES)}`,
      'backend',
      'uv',
      'run',
      'python',
      '-c',
      PORTFOLIO_SEED_PROBE,
    ],
    {
      cwd: REPO_ROOT,
      env: {
        ...process.env,
        PORTFOLIO_SEED_ALIASES: JSON.stringify(PORTFOLIO_SEED_ALIASES),
      },
      maxBuffer: 1024 * 1024 * 10,
    },
  );

  const outputLines = stdout
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);
  const jsonLine = outputLines.at(-1);

  assert.ok(jsonLine, `Expected portfolio seed probe to write JSON. stderr: ${stderr}`);
  return JSON.parse(jsonLine);
}

Given('the deterministic portfolio seed fixtures are loaded', async function () {
  this.pfTask002d = await runPortfolioSeedProbe();
});

Then('the portfolio seed should expose stable aliases for required actors and source records', function () {
  const result = getSeedResult(this);

  assert.equal(result.actors.student.id, PORTFOLIO_SEED_ALIASES.actors.student.id);
  assert.equal(result.actors.student.full_name, PORTFOLIO_SEED_ALIASES.actors.student.fullName);
  assert.deepEqual(result.actors.student.portfolio_slug, [PORTFOLIO_SEED_ALIASES.publicSlugs.existing.slug]);
  assert.deepEqual(result.actors.student.is_portfolio_world_public, [true]);
  assert.equal(result.actors.teacher.id, PORTFOLIO_SEED_ALIASES.actors.teacher.id);
  assert.equal(result.actors.relatedSupervisor.id, PORTFOLIO_SEED_ALIASES.actors.relatedSupervisor.id);
  assert.equal(result.actors.unrelatedSupervisor.id, PORTFOLIO_SEED_ALIASES.actors.unrelatedSupervisor.id);
  assert.equal(result.businesses.related.id, PORTFOLIO_SEED_ALIASES.businesses.related.id);
  assert.equal(result.businesses.unrelated.id, PORTFOLIO_SEED_ALIASES.businesses.unrelated.id);
  assert.equal(result.management.related.business_id, PORTFOLIO_SEED_ALIASES.businesses.related.id);
  assert.equal(result.management.unrelated.business_id, PORTFOLIO_SEED_ALIASES.businesses.unrelated.id);
  assert.equal(result.source.registration.id, PORTFOLIO_SEED_ALIASES.source.registration.id);
  assert.equal(result.source.registration.task_id, PORTFOLIO_SEED_ALIASES.source.task.id);
  assert.deepEqual(result.source.registration.is_accepted, [true]);
  assert.equal(result.source.registration.completed_at.length, 1);
  assert.equal(result.source.task.id, PORTFOLIO_SEED_ALIASES.source.task.id);
  assert.equal(result.source.project.id, PORTFOLIO_SEED_ALIASES.source.project.id);
  assert.equal(result.source.business.id, PORTFOLIO_SEED_ALIASES.source.business.id);
  assert.equal(result.source.businessProjectLink.business_id, PORTFOLIO_SEED_ALIASES.source.business.id);
  assert.equal(result.source.businessProjectLink.project_id, PORTFOLIO_SEED_ALIASES.source.project.id);
  assert.equal(result.source.projectTaskLink.project_id, PORTFOLIO_SEED_ALIASES.source.project.id);
  assert.equal(result.source.projectTaskLink.task_id, PORTFOLIO_SEED_ALIASES.source.task.id);
  assert.equal(result.unrelatedSourceLinks.length, 0, `Expected unrelated fixtures to stay disconnected from source projects: ${JSON.stringify(result.unrelatedSourceLinks)}`);
});

Then('the portfolio seed should expose stable aliases for required items and reviews', function () {
  const result = getSeedResult(this);

  for (const [key, fixture] of Object.entries(PORTFOLIO_SEED_ALIASES.items)) {
    assert.equal(result.items[key].id, fixture.id);
  }

  for (const [key, fixture] of Object.entries(PORTFOLIO_SEED_ALIASES.reviews)) {
    assert.equal(result.reviews[key].id, fixture.id);
    assert.ok(result.reviews[key].item_id, `Expected review '${fixture.alias}' to belong to a portfolio item`);
    assert.ok(result.reviews[key].author_id, `Expected review '${fixture.alias}' to have an author`);
  }
});

Then('the portfolio seed should include no-rating, good-rating, and low-rating item states', function () {
  const result = getSeedResult(this);

  const noRatingReviews = result.reviewsByItem.noRatings;
  const goodRatings = result.reviewsByItem.allRatingsGood.flatMap((review) => review.rating);
  const lowRatings = result.reviewsByItem.lowRating.flatMap((review) => review.rating);

  assert.equal(PORTFOLIO_SEED_ALIASES.ratingStates.noRatings.itemId, PORTFOLIO_SEED_ALIASES.items.noRatings.id);
  assert.equal(PORTFOLIO_SEED_ALIASES.ratingStates.allRatingsAtLeastThree.itemId, PORTFOLIO_SEED_ALIASES.items.allRatingsGood.id);
  assert.equal(PORTFOLIO_SEED_ALIASES.ratingStates.belowThree.itemId, PORTFOLIO_SEED_ALIASES.items.lowRating.id);
  assert.ok(noRatingReviews.length >= 1, 'Expected the no-rating item to have a review without a rating');
  assert.ok(noRatingReviews.every((review) => review.rating.length === 0), JSON.stringify(noRatingReviews));
  assert.ok(goodRatings.length >= 1, 'Expected at least one rating for the all-good item');
  assert.ok(goodRatings.every((rating) => rating >= 3), JSON.stringify(goodRatings));
  assert.ok(lowRatings.some((rating) => rating < 3), JSON.stringify(lowRatings));
});

Then('the portfolio seed should include hidden and retracted authenticated-public item states', function () {
  const result = getSeedResult(this);

  assert.equal(result.items.hidden.is_hidden, true);
  assert.equal(result.items.hidden.hidden_by_role.length, 1);
  assert.equal(result.items.retractedAuthenticatedPublic.is_authenticated_public_retraction, true);
  assert.equal(result.items.retractedAuthenticatedPublic.is_hidden, false);
});

Then('the portfolio seed should include a world-public page with a selected item and selected review', function () {
  const result = getSeedResult(this);

  assert.equal(result.slugs.existing.length, 1);
  assert.equal(result.slugs.existing[0].student_id, PORTFOLIO_SEED_ALIASES.actors.student.id);
  assert.deepEqual(result.slugs.existing[0].is_portfolio_world_public, [true]);
  assert.equal(result.items.worldPublicSelected.is_world_visible, true);
  assert.equal(result.reviews.worldPublicSelected.item_id, PORTFOLIO_SEED_ALIASES.items.worldPublicSelected.id);
  assert.equal(result.reviews.worldPublicSelected.is_world_visible, true);
});

Then('the portfolio seed should include an archived-source item state', function () {
  const result = getSeedResult(this);
  const archivedItem = result.items.archivedSource;

  assert.equal(archivedItem.id, PORTFOLIO_SEED_ALIASES.items.archivedSource.id);
  assert.equal(PORTFOLIO_SEED_ALIASES.archivedSourceState.itemId, archivedItem.id);
  assert.equal(archivedItem.source_registration_id, PORTFOLIO_SEED_ALIASES.source.archivedRegistration.id);
  assert.equal(archivedItem.source_task_id, PORTFOLIO_SEED_ALIASES.source.archivedTask.id);
  assert.equal(archivedItem.source_project_id, PORTFOLIO_SEED_ALIASES.source.archivedProject.id);
  assert.equal(archivedItem.source_business_id, PORTFOLIO_SEED_ALIASES.source.archivedBusiness.id);
  assert.equal(result.source.archivedRegistration.task_id, PORTFOLIO_SEED_ALIASES.source.archivedTask.id);
  assert.deepEqual(result.source.archivedProject.is_archived, [true]);
  assert.deepEqual(result.source.archivedBusiness.is_archived, [true]);
  assert.equal(result.source.archivedBusinessProjectLink.business_id, PORTFOLIO_SEED_ALIASES.source.archivedBusiness.id);
  assert.equal(result.source.archivedBusinessProjectLink.project_id, PORTFOLIO_SEED_ALIASES.source.archivedProject.id);
  assert.equal(result.source.archivedProjectTaskLink.project_id, PORTFOLIO_SEED_ALIASES.source.archivedProject.id);
  assert.equal(result.source.archivedProjectTaskLink.task_id, PORTFOLIO_SEED_ALIASES.source.archivedTask.id);
  assert.deepEqual(archivedItem.source_task_archived, [true]);
  assert.deepEqual(archivedItem.source_project_archived, [true]);
  assert.deepEqual(archivedItem.source_business_archived, [true]);
  assert.equal(archivedItem.is_retired, false);
});

Then('the portfolio seed should support baseline lookup by aliases without generated IDs', function () {
  const result = getSeedResult(this);
  const aliasObjects = flattenedAliasObjects(PORTFOLIO_SEED_ALIASES);

  assert.ok(aliasObjects.length >= 25, 'Expected aliases for actors, source records, items, reviews, rating states, slugs, and archive state');
  for (const fixture of aliasObjects) {
    assert.match(fixture.alias, /^[a-z0-9]+(?:-[a-z0-9]+)*$/u, `Alias is not human-readable kebab-case: ${fixture.alias}`);
    assert.doesNotMatch(fixture.alias, /^[0-9a-f]{8}-[0-9a-f-]{27,}$/iu, `Alias must not be a generated id: ${fixture.alias}`);
  }
  for (const [key, item] of Object.entries(result.items)) {
    const expectedSource = key === 'archivedSource'
      ? {
        registration: PORTFOLIO_SEED_ALIASES.source.archivedRegistration.id,
        task: PORTFOLIO_SEED_ALIASES.source.archivedTask.id,
        project: PORTFOLIO_SEED_ALIASES.source.archivedProject.id,
        business: PORTFOLIO_SEED_ALIASES.source.archivedBusiness.id,
      }
      : {
        registration: PORTFOLIO_SEED_ALIASES.source.registration.id,
        task: PORTFOLIO_SEED_ALIASES.source.task.id,
        project: PORTFOLIO_SEED_ALIASES.source.project.id,
        business: PORTFOLIO_SEED_ALIASES.source.business.id,
      };

    assert.equal(item.source_registration_id, expectedSource.registration, `Unexpected source registration for ${key}`);
    assert.equal(item.source_task_id, expectedSource.task, `Unexpected source task for ${key}`);
    assert.equal(item.source_project_id, expectedSource.project, `Unexpected source project for ${key}`);
    assert.equal(item.source_business_id, expectedSource.business, `Unexpected source business for ${key}`);
    assert.notEqual(item.source_business_id, PORTFOLIO_SEED_ALIASES.businesses.unrelated.id, `Unexpected unrelated source business for ${key}`);
  }
});

Then('the portfolio seed should include existing, private, and unused public slug fixtures', function () {
  const result = getSeedResult(this);

  assert.equal(result.slugs.existing.length, 1, 'Expected the existing public slug to be occupied for duplicate-slug tests');
  assert.equal(result.slugs.existing[0].portfolio_slug, PORTFOLIO_SEED_ALIASES.publicSlugs.existing.slug);
  assert.equal(result.slugs.private.length, 1, 'Expected the private public slug to be occupied for private-by-default tests');
  assert.equal(result.slugs.private[0].portfolio_slug, PORTFOLIO_SEED_ALIASES.publicSlugs.private.slug);
  assert.deepEqual(result.slugs.private[0].is_portfolio_world_public, [false]);
  assert.equal(result.slugs.unused.length, 0, 'Expected the unused public slug alias to be available for successful-update tests');
});

Then('the portfolio reset and verification commands should be documented near the seed contract', function () {
  const seedContract = fs.readFileSync(TEST_SEED_PATH, 'utf8');

  assert.match(seedContract, /task test:e2e:reset/u);
  assert.match(seedContract, /reset_test_database\.py --seed db\/test_seed\.tql/u);
  assert.match(seedContract, /task test:e2e:run:selective CLI_ARGS="--paths features\/pf-task-002d-portfolio-seed-fixtures-and-reset-contract\.feature"/u);
});
