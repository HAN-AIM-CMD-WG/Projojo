const assert = require('node:assert/strict');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');

const { Then, When } = require('@qavajs/core');

const execFileAsync = promisify(execFile);

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
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

const PORTFOLIO_SCHEMA_PROBE = String.raw`
import json
import sys
from datetime import datetime, timezone
from uuid import uuid4

from db.initDatabase import Db


def quote(value: str) -> str:
    return json.dumps(value)


def typeql_datetime(year: int, month: int, day: int, hour: int = 0, minute: int = 0) -> str:
    return datetime(year, month, day, hour, minute, tzinfo=timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f+0000")


CREATED_AT = typeql_datetime(2026, 5, 1, 9, 0)
COMPLETED_AT = typeql_datetime(2026, 5, 5, 17, 0)
HIDDEN_AT = typeql_datetime(2026, 5, 6, 10, 30)
RETIRED_AT = typeql_datetime(2026, 5, 7, 11, 15)
TIMELINE_START_DATE = typeql_datetime(2026, 2, 1, 8, 0)
TIMELINE_END_DATE = typeql_datetime(2026, 5, 1, 18, 0)


def ensure_student(student_id: str) -> None:
    provider_name = f"pf-task-002a-provider-{student_id}"
    oauth_sub = f"pf-task-002a-oauth-{student_id}"
    Db.write_transact(f"""
insert
  $provider isa oauthProvider,
    has name {quote(provider_name)};
  $student isa student,
    has id {quote(student_id)},
    has email {quote(f'{student_id}@example.test')},
    has fullName {quote('PF-task-002a Schema Probe Student')},
    has imagePath {quote('/images/pf-task-002a-student.png')};
  $auth isa oauthAuthentication (provider: $provider, user: $student),
    has oauthSub {quote(oauth_sub)};
""")


def insert_source_graph(ids: dict) -> None:
    ensure_student(ids['student_id'])
    Db.write_transact(f"""
match
  $student isa student, has id {quote(ids['student_id'])};
insert
  $business isa business,
    has id {quote(ids['business_id'])},
    has name {quote('HAN Innovation Studio')},
    has description {quote('Portfolio schema source business')},
    has imagePath {quote('/images/pf-task-002a-business.png')},
    has location {quote('Arnhem')},
    has isArchived false;
  $project isa project,
    has id {quote(ids['project_id'])},
    has name {quote('Portfolio Backend Replacement')},
    has description {quote('Replace stale snapshots with canonical items')},
    has imagePath {quote('/images/pf-task-002a-project.png')},
    has createdAt {CREATED_AT},
    has isArchived true;
  $task isa task,
    has id {quote(ids['task_id'])},
    has name {quote('Canonical Schema Task')},
    has description {quote('Portfolio evidence captured at completion time')},
    has totalNeeded 1,
    has createdAt {CREATED_AT};
  $skill_one isa skill,
    has id {quote(ids['skill_one_id'])},
    has name {quote(ids['skill_one_name'])},
    has isPending false,
    has createdAt {CREATED_AT};
  $skill_two isa skill,
    has id {quote(ids['skill_two_id'])},
    has name {quote(ids['skill_two_name'])},
    has isPending false,
    has createdAt {CREATED_AT};
  $has_projects isa hasProjects (business: $business, project: $project);
  $contains_task isa containsTask (project: $project, task: $task);
  $requires_skill_one isa requiresSkill (task: $task, skill: $skill_one);
  $requires_skill_two isa requiresSkill (task: $task, skill: $skill_two);
  $registration isa registersForTask (student: $student, task: $task),
    has id {quote(ids['registration_id'])},
    has description {quote('Accepted portfolio schema registration')},
    has isAccepted true,
    has createdAt {CREATED_AT},
    has requestedAt {CREATED_AT},
    has acceptedAt {CREATED_AT},
    has startedAt {TIMELINE_START_DATE},
    has completedAt {COMPLETED_AT};
""")


def portfolio_attrs(item_id: str, ids: dict, *, display_order: int, retired: bool = False, hidden_role: str | None = None, archived: tuple[bool, bool, bool] = (True, True, False)) -> list[str]:
    task_archived, project_archived, business_archived = archived
    attrs = [
        f"has id {quote(item_id)}",
        f"has createdAt {CREATED_AT}",
        f"has completedAt {COMPLETED_AT}",
        f"has sourceRegistrationId {quote(ids['registration_id'])}",
        f"has sourceTaskId {quote(ids['task_id'])}",
        f"has sourceProjectId {quote(ids['project_id'])}",
        f"has sourceBusinessId {quote(ids['business_id'])}",
        f"has taskName {quote('Canonical Schema Task')}",
        f"has taskDescription {quote('Portfolio evidence captured at completion time')}",
        f"has projectName {quote('Portfolio Backend Replacement')}",
        f"has projectDescription {quote('Replace stale snapshots with canonical items')}",
        f"has businessName {quote('HAN Innovation Studio')}",
        f"has businessLocation {quote('Arnhem')}",
        f"has skillName {quote(ids['skill_one_name'])}",
        f"has skillName {quote(ids['skill_two_name'])}",
        f"has timelineStartDate {TIMELINE_START_DATE}",
        f"has timelineEndDate {TIMELINE_END_DATE}",
        f"has isRetired {'true' if retired else 'false'}",
        f"has isHidden {'true' if hidden_role else 'false'}",
        f"has displayOrder {display_order}",
        f"has isAuthenticatedPublicRetraction {'true' if hidden_role == 'teacher' else 'false'}",
        "has isWorldVisible false",
        f"has sourceTaskArchived {'true' if task_archived else 'false'}",
        f"has sourceProjectArchived {'true' if project_archived else 'false'}",
        f"has sourceBusinessArchived {'true' if business_archived else 'false'}",
    ]
    if retired:
        attrs.append(f"has retiredAt {RETIRED_AT}")
    if hidden_role:
        attrs.extend([
            f"has hiddenAt {HIDDEN_AT}",
            f"has hiddenByRole {quote(hidden_role)}",
            f"has hiddenByUserId {quote(f'{hidden_role}-pf-task-002a')}",
        ])
    return attrs


def insert_portfolio_item(student_id: str, item_id: str, attrs: list[str]) -> None:
    attrs_clause = ",\n    ".join(attrs)
    Db.write_transact(f"""
match
  $student isa student, has id {quote(student_id)};
insert
  $item isa portfolioItem,
    {attrs_clause};
  $ownership isa hasPortfolio (student: $student, item: $item);
""")


def fetch_item(item_id: str) -> dict:
    return Db.read_transact(f"""
match
  $item isa portfolioItem, has id {quote(item_id)};
fetch {{
  'id': $item.id,
  'created_at': $item.createdAt,
  'completed_at': $item.completedAt,
  'source_registration_id': $item.sourceRegistrationId,
  'source_task_id': $item.sourceTaskId,
  'source_project_id': $item.sourceProjectId,
  'source_business_id': $item.sourceBusinessId,
  'task_name': $item.taskName,
  'task_description': [$item.taskDescription],
  'project_name': $item.projectName,
  'project_description': [$item.projectDescription],
  'business_name': $item.businessName,
  'business_location': [$item.businessLocation],
  'skill_names': [$item.skillName],
  'timeline_start_date': [$item.timelineStartDate],
  'timeline_end_date': [$item.timelineEndDate],
  'is_retired': $item.isRetired,
  'retired_at': [$item.retiredAt],
  'is_hidden': $item.isHidden,
  'hidden_at': [$item.hiddenAt],
  'hidden_by_role': [$item.hiddenByRole],
  'hidden_by_user_id': [$item.hiddenByUserId],
  'display_order': [$item.displayOrder],
  'authenticated_public_retraction': $item.isAuthenticatedPublicRetraction,
  'is_world_visible': $item.isWorldVisible,
  'source_task_archived': $item.sourceTaskArchived,
  'source_project_archived': $item.sourceProjectArchived,
  'source_business_archived': $item.sourceBusinessArchived
}};
""", sort_fields=False)[0]


def fetch_item_ids(student_id: str, *, exclude_retired: bool = False) -> list[str]:
    retired_filter = "not { $item has isRetired true; };" if exclude_retired else ""
    rows = Db.read_transact(f"""
match
  $student isa student, has id {quote(student_id)};
  $ownership isa hasPortfolio (student: $student, item: $item);
  {retired_filter}
  $item has id $item_id;
fetch {{
  'item_id': $item_id
}};
""", sort_fields=False)
    return sorted(row['item_id'] for row in rows)


def fetch_registration_id(student_id: str, task_id: str) -> str:
    rows = Db.read_transact(f"""
match
  $student isa student, has id {quote(student_id)};
  $task isa task, has id {quote(task_id)};
  $registration isa registersForTask (student: $student, task: $task), has id $registration_id;
fetch {{
  'registration_id': $registration_id
}};
""", sort_fields=False)
    return rows[0]['registration_id']


def probe_legacy_snapshot_attrs() -> dict:
    suffix = str(uuid4())
    student_id = f"pf-task-002a-snapshot-student-{suffix}"
    ids = {
        'registration_id': f"pf-task-002a-registration-{suffix}",
        'task_id': f"pf-task-002a-task-{suffix}",
        'project_id': f"pf-task-002a-project-{suffix}",
        'business_id': f"pf-task-002a-business-{suffix}",
        'skill_one_name': 'Schema Design',
        'skill_two_name': 'Portfolio Curation',
    }
    ensure_student(student_id)

    valid_attrs = portfolio_attrs(f"pf-task-002a-valid-item-{suffix}", ids, display_order=1)
    insert_portfolio_item(student_id, f"pf-task-002a-valid-item-{suffix}", valid_attrs)

    timeline_snapshot = json.dumps({'start': '2026-02-01', 'end': '2026-05-01'})
    project_snapshot = json.dumps({'id': 'project-legacy', 'name': 'Legacy Project'})
    task_snapshot = json.dumps({'id': 'task-legacy', 'name': 'Legacy Task'})
    skills_snapshot = json.dumps(['Legacy Skill'])

    legacy_attrs = portfolio_attrs(f"pf-task-002a-legacy-item-{suffix}", ids, display_order=2)
    legacy_attrs.extend([
        f"has timelineSnapshot {quote(timeline_snapshot)}",
        f"has projectSnapshot {quote(project_snapshot)}",
        f"has taskSnapshot {quote(task_snapshot)}",
        f"has skillsSnapshot {quote(skills_snapshot)}",
    ])

    try:
        insert_portfolio_item(student_id, f"pf-task-002a-legacy-item-{suffix}", legacy_attrs)
        return {
            'valid_canonical_insert_accepted': True,
            'legacy_snapshot_insert_rejected': False,
            'legacy_snapshot_error': None,
        }
    except Exception as error:
        return {
            'valid_canonical_insert_accepted': True,
            'legacy_snapshot_insert_rejected': True,
            'legacy_snapshot_error': str(error),
        }


def probe_canonical() -> dict:
    suffix = str(uuid4())
    ids = {
        'student_id': f"pf-task-002a-student-{suffix}",
        'registration_id': f"pf-task-002a-registration-{suffix}",
        'task_id': f"pf-task-002a-task-{suffix}",
        'project_id': f"pf-task-002a-project-{suffix}",
        'business_id': f"pf-task-002a-business-{suffix}",
        'skill_one_id': f"pf-task-002a-skill-schema-{suffix}",
        'skill_two_id': f"pf-task-002a-skill-curation-{suffix}",
        'skill_one_name': f"Schema Design {suffix}",
        'skill_two_name': f"Portfolio Curation {suffix}",
        'active_item_id': f"pf-task-002a-active-item-{suffix}",
        'retired_item_id': f"pf-task-002a-retired-item-{suffix}",
        'student_hidden_item_id': f"pf-task-002a-student-hidden-item-{suffix}",
    }

    insert_source_graph(ids)
    insert_portfolio_item(
        ids['student_id'],
        ids['active_item_id'],
        portfolio_attrs(ids['active_item_id'], ids, display_order=7, hidden_role='teacher'),
    )
    insert_portfolio_item(
        ids['student_id'],
        ids['retired_item_id'],
        portfolio_attrs(ids['retired_item_id'], ids, display_order=99, retired=True, archived=(False, False, False)),
    )
    insert_portfolio_item(
        ids['student_id'],
        ids['student_hidden_item_id'],
        portfolio_attrs(ids['student_hidden_item_id'], ids, display_order=8, hidden_role='student'),
    )

    return {
        'ids': ids,
        'source_registration_id': fetch_registration_id(ids['student_id'], ids['task_id']),
        'owned_item_ids': fetch_item_ids(ids['student_id']),
        'not_retired_item_ids': fetch_item_ids(ids['student_id'], exclude_retired=True),
        'items': {
            'active': fetch_item(ids['active_item_id']),
            'retired': fetch_item(ids['retired_item_id']),
            'student_hidden': fetch_item(ids['student_hidden_item_id']),
        },
    }


def main() -> None:
    mode = sys.argv[1]
    try:
        if mode == 'snapshot':
            result = probe_legacy_snapshot_attrs()
        elif mode == 'canonical':
            result = probe_canonical()
        else:
            result = {'probe_error': f'Unsupported mode: {mode}'}
    except Exception as error:
        result = {'probe_error': str(error)}
    finally:
        Db.close()

    print(json.dumps(result))


if __name__ == '__main__':
    main()
`;

function rememberProbeResult(world, key, result) {
  world.pfTask002a = {
    ...(world.pfTask002a ?? {}),
    [key]: result,
  };
}

function getProbeResult(world, key) {
  const result = world.pfTask002a?.[key];
  assert.ok(result, `Expected a stored probe result for '${key}'`);
  assert.equal(result.probe_error, undefined, `Schema probe '${key}' failed unexpectedly: ${result.probe_error}`);
  return result;
}

function sorted(values) {
  return [...values].sort();
}

function assertSameMembers(actual, expected, message) {
  assert.deepEqual(sorted(actual), sorted(expected), message);
}

async function runPortfolioSchemaProbe(mode) {
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
      PORTFOLIO_SCHEMA_PROBE,
      mode,
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

  assert.ok(jsonLine, `Expected schema probe '${mode}' to write JSON. stderr: ${stderr}`);
  return JSON.parse(jsonLine);
}

When('I probe the legacy snapshot attribute portfolio item schema contract', async function () {
  rememberProbeResult(this, 'snapshot', await runPortfolioSchemaProbe('snapshot'));
});

When('I probe the canonical portfolio item schema contract', async function () {
  rememberProbeResult(this, 'canonical', await runPortfolioSchemaProbe('canonical'));
});

Then('the legacy snapshot attribute portfolio item schema probe should be rejected', function () {
  const result = getProbeResult(this, 'snapshot');
  assert.equal(
    result.valid_canonical_insert_accepted,
    true,
    `Expected otherwise canonical portfolio shape to be accepted before legacy attribute rejection, received ${JSON.stringify(result)}`,
  );
  assert.equal(
    result.legacy_snapshot_insert_rejected,
    true,
    `Expected legacy snapshot attributes to be rejected on a canonical portfolio item, received ${JSON.stringify(result)}`,
  );
  assert.match(
    String(result.legacy_snapshot_error ?? ''),
    /Snapshot|snapshot/u,
    `Expected rejection to mention legacy snapshot attributes, received ${JSON.stringify(result)}`,
  );
});

Then('the canonical portfolio item probe should confirm the reset schema accepts canonical portfolio items', function () {
  const result = getProbeResult(this, 'canonical');
  assert.ok(result.items?.active, `Expected canonical portfolio insert to succeed, received ${JSON.stringify(result)}`);
});

Then('the canonical portfolio item probe should confirm the student ownership relation', function () {
  const result = getProbeResult(this, 'canonical');
  const ids = result.ids;
  assertSameMembers(
    result.owned_item_ids,
    [ids.active_item_id, ids.retired_item_id, ids.student_hidden_item_id],
    `Expected canonical portfolio ownership relation to be queryable, received ${JSON.stringify(result)}`,
  );
});

Then('the canonical portfolio item probe should confirm source identifiers and copied display fields can be stored', function () {
  const result = getProbeResult(this, 'canonical');
  const { ids, items } = result;
  const active = items.active;

  assert.equal(result.source_registration_id, ids.registration_id);
  assert.equal(active.source_registration_id, ids.registration_id);
  assert.equal(active.source_task_id, ids.task_id);
  assert.equal(active.source_project_id, ids.project_id);
  assert.equal(active.source_business_id, ids.business_id);
  assert.equal(active.task_name, 'Canonical Schema Task');
  assert.deepEqual(active.task_description, ['Portfolio evidence captured at completion time']);
  assert.equal(active.project_name, 'Portfolio Backend Replacement');
  assert.deepEqual(active.project_description, ['Replace stale snapshots with canonical items']);
  assert.equal(active.business_name, 'HAN Innovation Studio');
  assert.deepEqual(active.business_location, ['Arnhem']);
  assertSameMembers(active.skill_names, [ids.skill_one_name, ids.skill_two_name], `Expected copied skills to round-trip, received ${JSON.stringify(active)}`);
  assert.equal(active.timeline_start_date.length, 1, `Expected timeline start date to round-trip, received ${JSON.stringify(active)}`);
  assert.equal(active.timeline_end_date.length, 1, `Expected timeline end date to round-trip, received ${JSON.stringify(active)}`);
});

Then('the canonical portfolio item probe should confirm explicit lifecycle, retirement, and visibility state', function () {
  const result = getProbeResult(this, 'canonical');
  const { active, retired, student_hidden: studentHidden } = result.items;

  assert.equal(active.is_retired, false);
  assert.deepEqual(active.retired_at, []);
  assert.equal(active.is_hidden, true);
  assert.equal(active.hidden_at.length, 1, `Expected teacher hidden timestamp to round-trip, received ${JSON.stringify(active)}`);
  assert.deepEqual(active.hidden_by_role, ['teacher']);
  assert.deepEqual(active.hidden_by_user_id, ['teacher-pf-task-002a']);
  assert.deepEqual(active.display_order, [7]);
  assert.equal(active.authenticated_public_retraction, true);
  assert.equal(active.is_world_visible, false);
  assert.ok(active.created_at);
  assert.ok(active.completed_at);

  assert.equal(retired.is_retired, true);
  assert.equal(retired.retired_at.length, 1, `Expected retired timestamp to round-trip, received ${JSON.stringify(retired)}`);
  assert.equal(retired.is_hidden, false);

  assert.equal(studentHidden.is_hidden, true);
  assert.deepEqual(studentHidden.hidden_by_role, ['student']);
  assert.deepEqual(studentHidden.hidden_by_user_id, ['student-pf-task-002a']);
});

Then('the canonical portfolio item probe should confirm archived-source metadata support', function () {
  const result = getProbeResult(this, 'canonical');
  const active = result.items.active;

  assert.equal(active.source_task_archived, true);
  assert.equal(active.source_project_archived, true);
  assert.equal(active.source_business_archived, false);
  assert.equal(active.is_retired, false);
});

Then('the canonical portfolio item probe should confirm retired items can be excluded by explicit retired state', function () {
  const result = getProbeResult(this, 'canonical');
  const ids = result.ids;

  assertSameMembers(
    result.not_retired_item_ids,
    [ids.active_item_id, ids.student_hidden_item_id],
    `Expected retired items to be excluded by explicit retired state, received ${JSON.stringify(result)}`,
  );
});
