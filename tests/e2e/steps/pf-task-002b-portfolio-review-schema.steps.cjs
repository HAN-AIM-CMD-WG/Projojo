const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');

const { Then, When } = require('@qavajs/core');

const execFileAsync = promisify(execFile);

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const SCHEMA_PATH = path.join(REPO_ROOT, 'projojo_backend', 'db', 'schema.tql');
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

const PORTFOLIO_REVIEW_SCHEMA_PROBE = String.raw`
import json
import sys
from datetime import datetime, timezone
from uuid import uuid4

from db.initDatabase import Db


def quote(value: str) -> str:
    return json.dumps(value)


def typeql_datetime(year: int, month: int, day: int, hour: int = 0, minute: int = 0) -> str:
    return datetime(year, month, day, hour, minute, tzinfo=timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f+0000")


CREATED_AT = typeql_datetime(2026, 5, 10, 9, 0)
COMPLETED_AT = typeql_datetime(2026, 5, 10, 17, 0)
UPDATED_AT = typeql_datetime(2026, 5, 11, 13, 30)
NOTICE_ACCEPTED_AT = typeql_datetime(2026, 5, 12, 8, 45)


def insert_user(user_type: str, user_id: str, full_name: str) -> None:
    provider_name = f"pf-task-002b-provider-{user_id}"
    oauth_sub = f"pf-task-002b-oauth-{user_id}"
    supervisor_business = ""
    if user_type == 'supervisor':
        supervisor_business = f"""
  $business isa business,
    has id {quote(f'pf-task-002b-business-{user_id}')},
    has name {quote(f'PF-task-002b Business {user_id}')},
    has description {quote('Business required for supervisor schema cardinality')},
    has imagePath {quote('/images/pf-task-002b-business.png')},
    has location {quote('Arnhem')};
  $manages isa manages (supervisor: $user, business: $business),
    has location {quote('Arnhem')};
"""
    Db.write_transact(f"""
insert
  $provider isa oauthProvider,
    has name {quote(provider_name)};
  $user isa {user_type},
    has id {quote(user_id)},
    has email {quote(f'{user_id}@example.test')},
    has fullName {quote(full_name)},
    has imagePath {quote(f'/images/{user_id}.png')};
  $auth isa oauthAuthentication (provider: $provider, user: $user),
    has oauthSub {quote(oauth_sub)};
{supervisor_business}
""")


def portfolio_attrs(item_id: str, suffix: str, *, retired: bool) -> str:
    return f"""
    has id {quote(item_id)},
    has createdAt {CREATED_AT},
    has completedAt {COMPLETED_AT},
    has sourceStudentId {quote(f'pf-task-002b-student-{suffix}')},
    has sourceRegistrationId {quote(f'pf-task-002b-registration-{suffix}')},
    has sourceTaskId {quote(f'pf-task-002b-task-{suffix}')},
    has sourceProjectId {quote(f'pf-task-002b-project-{suffix}')},
    has sourceBusinessId {quote(f'pf-task-002b-business-{suffix}')},
    has studentName {quote('PF-task-002b Schema Student')},
    has studentImagePath {quote('/images/pf-task-002b-student.png')},
    has taskName {quote('Review Schema Task')},
    has projectName {quote('Portfolio Review Foundation')},
    has businessName {quote('HAN Review Studio')},
    has isRetired {'true' if retired else 'false'},
    has isHidden false,
    has isAuthenticatedPublicRetraction false,
    has isWorldVisible false
"""


def insert_portfolio_item(student_id: str, item_id: str, suffix: str, *, retired: bool = False) -> None:
    Db.write_transact(f"""
match
  $student isa student, has id {quote(student_id)};
insert
  $item isa portfolioItem,
{portfolio_attrs(item_id, suffix, retired=retired)};
  $ownership isa hasPortfolio (student: $student, item: $item);
""")


def review_attrs(
    review_id: str,
    text: str,
    *,
    rating: int | None,
    world_visible: bool,
    include_updated_at: bool = True,
    include_public_notice_accepted_at: bool = True,
) -> list[str]:
    attrs = [
        f"has id {quote(review_id)}",
        f"has reviewText {quote(text)}",
        f"has createdAt {CREATED_AT}",
        f"has isWorldVisible {'true' if world_visible else 'false'}",
    ]
    if include_updated_at:
        attrs.append(f"has updatedAt {UPDATED_AT}")
    if include_public_notice_accepted_at:
        attrs.append(f"has publicNoticeAcceptedAt {NOTICE_ACCEPTED_AT}")
    if rating is not None:
        attrs.append(f"has rating {rating}")
    return attrs


def insert_review(
    item_id: str,
    author_type: str,
    author_id: str,
    review_id: str,
    text: str,
    *,
    rating: int | None,
    world_visible: bool = False,
    include_updated_at: bool = True,
    include_public_notice_accepted_at: bool = True,
) -> None:
    attrs_clause = ",\n    ".join(review_attrs(
        review_id,
        text,
        rating=rating,
        world_visible=world_visible,
        include_updated_at=include_updated_at,
        include_public_notice_accepted_at=include_public_notice_accepted_at,
    ))
    Db.write_transact(f"""
match
  $item isa portfolioItem, has id {quote(item_id)};
  $author isa {author_type}, has id {quote(author_id)};
insert
  $review isa portfolioReview,
    {attrs_clause};
  $item_review isa hasPortfolioReview (item: $item, review: $review);
  $authorship isa portfolioReviewAuthor (review: $review, author: $author);
""")


def fetch_review(review_id: str) -> dict:
    return Db.read_transact(f"""
match
  $review isa portfolioReview, has id {quote(review_id)};
fetch {{
  'id': $review.id,
  'review_text': $review.reviewText,
  'rating': [$review.rating],
  'created_at': $review.createdAt,
  'updated_at': [$review.updatedAt],
  'is_world_visible': $review.isWorldVisible,
  'public_notice_accepted_at': [$review.publicNoticeAcceptedAt]
}};
""", sort_fields=False)[0]


def fetch_item_review_ids(item_id: str) -> list[str]:
    rows = Db.read_transact(f"""
match
  $item isa portfolioItem, has id {quote(item_id)};
  $item_review isa hasPortfolioReview (item: $item, review: $review);
  $review has id $review_id;
fetch {{
  'review_id': $review_id
}};
""", sort_fields=False)
    return sorted(row['review_id'] for row in rows)


def fetch_review_item_ids(review_id: str) -> list[str]:
    rows = Db.read_transact(f"""
match
  $review isa portfolioReview, has id {quote(review_id)};
  $item_review isa hasPortfolioReview (item: $item, review: $review);
  $item has id $item_id;
fetch {{
  'item_id': $item_id
}};
""", sort_fields=False)
    return sorted(row['item_id'] for row in rows)


def fetch_normal_review_ids(student_id: str) -> list[str]:
    rows = Db.read_transact(f"""
match
  $student isa student, has id {quote(student_id)};
  $ownership isa hasPortfolio (student: $student, item: $item);
  $item_review isa hasPortfolioReview (item: $item, review: $review);
  not {{ $item has isRetired true; }};
  $review has id $review_id;
fetch {{
  'review_id': $review_id
}};
""", sort_fields=False)
    return sorted(row['review_id'] for row in rows)


def is_author(review_id: str, user_id: str) -> bool:
    rows = Db.read_transact(f"""
match
  $review isa portfolioReview, has id {quote(review_id)};
  $author isa user, has id {quote(user_id)};
  $authorship isa portfolioReviewAuthor (review: $review, author: $author);
fetch {{
  'review_id': $review.id,
  'author_id': $author.id
}};
""", sort_fields=False)
    return len(rows) == 1


def fetch_author_display(review_id: str) -> dict:
    rows = Db.read_transact(f"""
match
  $review isa portfolioReview, has id {quote(review_id)};
  $authorship isa portfolioReviewAuthor (review: $review, author: $author);
  $author has id $author_id;
  $author has fullName $full_name;
  $author has imagePath $image_path;
fetch {{
  'author_id': $author_id,
  'full_name': $full_name,
  'image_path': $image_path
}};
""", sort_fields=False)
    return rows[0]


def rejection_result(operation) -> dict:
    try:
        operation()
        return {'rejected': False, 'error': None}
    except Exception as error:
        return {'rejected': True, 'error': str(error)}


def invalid_rating_is_rejected(item_id: str, teacher_id: str, invalid_review_id: str, rating: int) -> dict:
    return rejection_result(lambda: insert_review(
        item_id,
        'teacher',
        teacher_id,
        invalid_review_id,
        f'Invalid rating {rating} should fail',
        rating=rating,
    ))


def missing_required_timestamp_is_rejected(item_id: str, teacher_id: str, invalid_review_id: str, missing: str) -> dict:
    return rejection_result(lambda: insert_review(
        item_id,
        'teacher',
        teacher_id,
        invalid_review_id,
        f'Missing required {missing} should fail',
        rating=None,
        include_updated_at=missing != 'updatedAt',
        include_public_notice_accepted_at=missing != 'publicNoticeAcceptedAt',
    ))


def second_item_relation_is_rejected(second_item_id: str, review_id: str) -> dict:
    return rejection_result(lambda: Db.write_transact(f"""
match
  $item isa portfolioItem, has id {quote(second_item_id)};
  $review isa portfolioReview, has id {quote(review_id)};
insert
  $item_review isa hasPortfolioReview (item: $item, review: $review);
"""))


def probe_review_schema() -> dict:
    suffix = str(uuid4())
    ids = {
        'student_id': f"pf-task-002b-student-{suffix}",
        'teacher_id': f"pf-task-002b-teacher-{suffix}",
        'supervisor_id': f"pf-task-002b-supervisor-{suffix}",
        'active_item_id': f"pf-task-002b-active-item-{suffix}",
        'empty_item_id': f"pf-task-002b-empty-item-{suffix}",
        'retired_item_id': f"pf-task-002b-retired-item-{suffix}",
        'teacher_review_id': f"pf-task-002b-teacher-review-{suffix}",
        'supervisor_review_id': f"pf-task-002b-supervisor-review-{suffix}",
        'unrated_review_id': f"pf-task-002b-unrated-review-{suffix}",
        'retired_review_id': f"pf-task-002b-retired-review-{suffix}",
        'invalid_low_rating_review_id': f"pf-task-002b-invalid-low-rating-review-{suffix}",
        'invalid_high_rating_review_id': f"pf-task-002b-invalid-high-rating-review-{suffix}",
        'missing_updated_at_review_id': f"pf-task-002b-missing-updated-at-review-{suffix}",
        'missing_public_notice_review_id': f"pf-task-002b-missing-public-notice-review-{suffix}",
    }

    insert_user('student', ids['student_id'], 'PF-task-002b Schema Student')
    insert_user('teacher', ids['teacher_id'], 'PF-task-002b Schema Teacher')
    insert_user('supervisor', ids['supervisor_id'], 'PF-task-002b Schema Supervisor')
    insert_portfolio_item(ids['student_id'], ids['active_item_id'], suffix)
    insert_portfolio_item(ids['student_id'], ids['empty_item_id'], f"{suffix}-empty")
    insert_portfolio_item(ids['student_id'], ids['retired_item_id'], suffix, retired=True)

    insert_review(ids['active_item_id'], 'teacher', ids['teacher_id'], ids['teacher_review_id'], 'Teacher boundary rating review', rating=1)
    insert_review(ids['active_item_id'], 'supervisor', ids['supervisor_id'], ids['supervisor_review_id'], 'Supervisor boundary rating review', rating=5, world_visible=True)
    insert_review(ids['active_item_id'], 'teacher', ids['teacher_id'], ids['unrated_review_id'], 'Unrated optional review', rating=None)
    insert_review(ids['retired_item_id'], 'supervisor', ids['supervisor_id'], ids['retired_review_id'], 'Review retained on retired item', rating=3)

    return {
        'ids': ids,
        'reviews': {
            'teacher': fetch_review(ids['teacher_review_id']),
            'supervisor': fetch_review(ids['supervisor_review_id']),
            'unrated': fetch_review(ids['unrated_review_id']),
            'retired': fetch_review(ids['retired_review_id']),
        },
        'active_item_review_ids': fetch_item_review_ids(ids['active_item_id']),
        'empty_item_review_ids': fetch_item_review_ids(ids['empty_item_id']),
        'retired_item_review_ids': fetch_item_review_ids(ids['retired_item_id']),
        'teacher_review_item_ids': fetch_review_item_ids(ids['teacher_review_id']),
        'supervisor_review_item_ids': fetch_review_item_ids(ids['supervisor_review_id']),
        'normal_review_ids': fetch_normal_review_ids(ids['student_id']),
        'author_checks': {
            'teacher_is_teacher_review_author': is_author(ids['teacher_review_id'], ids['teacher_id']),
            'supervisor_is_supervisor_review_author': is_author(ids['supervisor_review_id'], ids['supervisor_id']),
            'teacher_is_not_supervisor_review_author': is_author(ids['supervisor_review_id'], ids['teacher_id']),
            'supervisor_is_not_teacher_review_author': is_author(ids['teacher_review_id'], ids['supervisor_id']),
        },
        'author_display': {
            'teacher': fetch_author_display(ids['teacher_review_id']),
            'supervisor': fetch_author_display(ids['supervisor_review_id']),
        },
        'invalid_ratings': {
            'below_minimum': invalid_rating_is_rejected(ids['active_item_id'], ids['teacher_id'], ids['invalid_low_rating_review_id'], 0),
            'above_maximum': invalid_rating_is_rejected(ids['active_item_id'], ids['teacher_id'], ids['invalid_high_rating_review_id'], 6),
        },
        'missing_required_timestamps': {
            'updated_at': missing_required_timestamp_is_rejected(ids['active_item_id'], ids['teacher_id'], ids['missing_updated_at_review_id'], 'updatedAt'),
            'public_notice_accepted_at': missing_required_timestamp_is_rejected(ids['active_item_id'], ids['teacher_id'], ids['missing_public_notice_review_id'], 'publicNoticeAcceptedAt'),
        },
        'second_item_relation': second_item_relation_is_rejected(ids['empty_item_id'], ids['teacher_review_id']),
    }


def main() -> None:
    try:
        result = probe_review_schema()
    except Exception as error:
        result = {'probe_error': str(error)}
    finally:
        Db.close()

    print(json.dumps(result))


if __name__ == '__main__':
    main()
`;

function rememberProbeResult(world, result) {
  world.pfTask002b = result;
}

function getProbeResult(world) {
  const result = world.pfTask002b;
  assert.ok(result, 'Expected a stored PF-task-002b probe result');
  assert.equal(result.probe_error, undefined, `Portfolio review schema probe failed unexpectedly: ${result.probe_error}`);
  return result;
}

function sorted(values) {
  return [...values].sort();
}

function assertSameMembers(actual, expected, message) {
  assert.deepEqual(sorted(actual), sorted(expected), message);
}

async function runPortfolioReviewSchemaProbe() {
  const { stdout, stderr } = await execFileAsync(
    'docker',
    [
      ...DOCKER_COMPOSE_ARGS,
      'exec',
      '-T',
      'backend',
      'uv',
      'run',
      'python',
      '-c',
      PORTFOLIO_REVIEW_SCHEMA_PROBE,
    ],
    {
      cwd: REPO_ROOT,
      maxBuffer: 1024 * 1024 * 10,
    },
  );

  const outputLines = stdout
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);
  const jsonLine = outputLines.at(-1);

  assert.ok(jsonLine, `Expected portfolio review schema probe to write JSON. stderr: ${stderr}`);
  return JSON.parse(jsonLine);
}

When('I probe the portfolio review schema contract', async function () {
  rememberProbeResult(this, await runPortfolioReviewSchemaProbe());
});

Then('the portfolio review schema probe should confirm review fields round-trip', function () {
  const result = getProbeResult(this);
  const teacher = result.reviews.teacher;
  const supervisor = result.reviews.supervisor;

  assert.equal(teacher.id, result.ids.teacher_review_id);
  assert.equal(teacher.review_text, 'Teacher boundary rating review');
  assert.ok(teacher.created_at, `Expected createdAt to round-trip, received ${JSON.stringify(teacher)}`);
  assert.match(String(teacher.created_at), /2026-05-10/u);
  assert.equal(teacher.updated_at.length, 1, `Expected updatedAt to round-trip, received ${JSON.stringify(teacher)}`);
  assert.match(String(teacher.updated_at[0]), /2026-05-11/u);
  assert.equal(teacher.is_world_visible, false);
  assert.equal(teacher.public_notice_accepted_at.length, 1, `Expected public notice timestamp to round-trip, received ${JSON.stringify(teacher)}`);
  assert.match(String(teacher.public_notice_accepted_at[0]), /2026-05-12/u);
  assert.equal(supervisor.is_world_visible, true);
});

Then('the portfolio review schema probe should enforce required review timestamps', function () {
  const result = getProbeResult(this);

  assert.equal(
    result.missing_required_timestamps.updated_at.rejected,
    true,
    `Expected missing updatedAt to be rejected, received ${JSON.stringify(result.missing_required_timestamps.updated_at)}`,
  );
  assert.equal(
    result.missing_required_timestamps.public_notice_accepted_at.rejected,
    true,
    `Expected missing publicNoticeAcceptedAt to be rejected, received ${JSON.stringify(result.missing_required_timestamps.public_notice_accepted_at)}`,
  );
});

Then('the portfolio review schema probe should confirm optional ratings support values from 1 through 5', function () {
  const result = getProbeResult(this);

  assert.deepEqual(result.reviews.teacher.rating, [1]);
  assert.deepEqual(result.reviews.supervisor.rating, [5]);
  assert.deepEqual(result.reviews.unrated.rating, []);
});

Then('the portfolio review schema probe should reject ratings outside 1 through 5', function () {
  const result = getProbeResult(this);

  for (const [caseName, invalidRating] of Object.entries(result.invalid_ratings)) {
    assert.equal(
      invalidRating.rejected,
      true,
      `Expected ${caseName} rating to be rejected, received ${JSON.stringify(invalidRating)}`,
    );
    assert.match(
      String(invalidRating.error ?? ''),
      /rating|range|Constraint|constraint|1|5/u,
      `Expected rejection to explain the rating constraint, received ${JSON.stringify(invalidRating)}`,
    );
  }
});

Then('the portfolio review schema probe should confirm reviews belong to one portfolio item', function () {
  const result = getProbeResult(this);

  assert.deepEqual(result.teacher_review_item_ids, [result.ids.active_item_id]);
  assert.deepEqual(result.supervisor_review_item_ids, [result.ids.active_item_id]);
});

Then('the portfolio review schema probe should confirm portfolio items can have multiple reviews', function () {
  const result = getProbeResult(this);

  assertSameMembers(
    result.active_item_review_ids,
    [result.ids.teacher_review_id, result.ids.supervisor_review_id, result.ids.unrated_review_id],
    `Expected active item to have multiple reviews, received ${JSON.stringify(result)}`,
  );
  assert.deepEqual(result.empty_item_review_ids, []);
  assert.deepEqual(result.retired_item_review_ids, [result.ids.retired_review_id]);
});

Then('the portfolio review schema probe should reject attaching a review to a second item', function () {
  const result = getProbeResult(this);

  assert.equal(
    result.second_item_relation.rejected,
    true,
    `Expected a second item relation for one review to be rejected, received ${JSON.stringify(result.second_item_relation)}`,
  );
});

Then('the portfolio review schema probe should confirm reviews on retired items can be excluded from normal reads', function () {
  const result = getProbeResult(this);

  assertSameMembers(
    result.normal_review_ids,
    [result.ids.teacher_review_id, result.ids.supervisor_review_id, result.ids.unrated_review_id],
    `Expected normal review reads to exclude reviews whose portfolio item is retired, received ${JSON.stringify(result)}`,
  );
});

Then('the portfolio review schema probe should confirm teacher and supervisor authors resolve by user id', function () {
  const result = getProbeResult(this);

  assert.deepEqual(result.author_checks, {
    teacher_is_teacher_review_author: true,
    supervisor_is_supervisor_review_author: true,
    teacher_is_not_supervisor_review_author: false,
    supervisor_is_not_teacher_review_author: false,
  });
  assert.equal(result.author_display.teacher.author_id, result.ids.teacher_id);
  assert.equal(result.author_display.supervisor.author_id, result.ids.supervisor_id);
  assert.equal(result.author_display.teacher.full_name, 'PF-task-002b Schema Teacher');
  assert.equal(result.author_display.supervisor.full_name, 'PF-task-002b Schema Supervisor');
});

Then('the portfolio review schema should document author identity rules for later review permissions', function () {
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');

  assert.match(schema, /Review author design:/u, 'Expected schema to document the review author design decision');
  assert.match(schema, /creation API must attach exactly one portfolioReviewAuthor relation/iu);
  assert.match(schema, /editing authorization matches the current caller by user id/iu);
  assert.match(schema, /read models display author details from the related author entity/iu);
  assert.match(schema, /normal review reads join through the portfolio item and exclude retired items/iu);
});
