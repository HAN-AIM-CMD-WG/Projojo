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

const STUDENT_PORTFOLIO_SETTINGS_SCHEMA_PROBE = String.raw`
import json
from uuid import uuid4

from db.initDatabase import Db


def quote(value: str) -> str:
    return json.dumps(value)


def ensure_student(student_id: str, *, summary: str | None = None, slug: str | None = None, world_public: bool | None = None) -> None:
    provider_name = f"pf-task-002c-provider-{student_id}"
    oauth_sub = f"pf-task-002c-oauth-{student_id}"
    optional_attrs = []
    if summary is not None:
        optional_attrs.append(f"has portfolioSummary {quote(summary)}")
    if slug is not None:
        optional_attrs.append(f"has portfolioSlug {quote(slug)}")
    if world_public is not None:
        optional_attrs.append(f"has isPortfolioWorldPublic {'true' if world_public else 'false'}")
    optional_clause = ""
    if optional_attrs:
        optional_clause = ",\n    " + ",\n    ".join(optional_attrs)

    Db.write_transact(f"""
insert
  $provider isa oauthProvider,
    has name {quote(provider_name)};
  $student isa student,
    has id {quote(student_id)},
    has email {quote(f'{student_id}@example.test')},
    has fullName {quote('PF-task-002c Settings Student')},
    has imagePath {quote('/images/pf-task-002c-student.png')}{optional_clause};
  $auth isa oauthAuthentication (provider: $provider, user: $student),
    has oauthSub {quote(oauth_sub)};
""")


def fetch_settings(student_id: str) -> dict:
    return Db.read_transact(f"""
match
  $student isa student, has id {quote(student_id)};
fetch {{
  'id': $student.id,
  'portfolio_summary': [$student.portfolioSummary],
  'portfolio_slug': [$student.portfolioSlug],
  'is_portfolio_world_public': [$student.isPortfolioWorldPublic]
}};
""", sort_fields=False)[0]


def fetch_item_ids(student_id: str) -> list[str]:
    rows = Db.read_transact(f"""
match
  $student isa student, has id {quote(student_id)};
  $ownership isa hasPortfolio (student: $student, item: $item);
  $item has id $item_id;
fetch {{
  'item_id': $item_id
}};
""", sort_fields=False)
    return sorted(row['item_id'] for row in rows)


def rejection_result(operation) -> dict:
    try:
        operation()
        return {'rejected': False, 'error': None}
    except Exception as error:
        return {'rejected': True, 'error': str(error)}


def probe_student_portfolio_settings_schema() -> dict:
    suffix = str(uuid4())
    ids = {
        'empty_student_id': f"pf-task-002c-empty-student-{suffix}",
        'empty_summary_student_id': f"pf-task-002c-empty-summary-student-{suffix}",
        'configured_student_id': f"pf-task-002c-configured-student-{suffix}",
        'duplicate_slug_student_id': f"pf-task-002c-duplicate-slug-student-{suffix}",
        'portfolio_slug': f"pf-task-002c-slug-{suffix}",
    }
    summary = 'Student curated portfolio summary for schema verification.'

    ensure_student(ids['empty_student_id'])
    ensure_student(ids['empty_summary_student_id'], summary='')
    ensure_student(
        ids['configured_student_id'],
        summary=summary,
        slug=ids['portfolio_slug'],
        world_public=False,
    )

    duplicate_slug = rejection_result(lambda: ensure_student(
        ids['duplicate_slug_student_id'],
        slug=ids['portfolio_slug'],
        world_public=True,
    ))

    return {
        'ids': ids,
        'expected_summary': summary,
        'empty_settings': fetch_settings(ids['empty_student_id']),
        'empty_summary_settings': fetch_settings(ids['empty_summary_student_id']),
        'configured_settings': fetch_settings(ids['configured_student_id']),
        'configured_item_ids': fetch_item_ids(ids['configured_student_id']),
        'duplicate_slug': duplicate_slug,
    }


def main() -> None:
    try:
        result = probe_student_portfolio_settings_schema()
    except Exception as error:
        result = {'probe_error': str(error)}
    finally:
        Db.close()

    print(json.dumps(result))


if __name__ == '__main__':
    main()
`;

function rememberProbeResult(world, result) {
  world.pfTask002c = result;
}

function getProbeResult(world) {
  const result = world.pfTask002c;
  assert.ok(result, 'Expected a stored PF-task-002c probe result');
  assert.equal(result.probe_error, undefined, `Student portfolio settings schema probe failed unexpectedly: ${result.probe_error}`);
  return result;
}

async function runStudentPortfolioSettingsSchemaProbe() {
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
      STUDENT_PORTFOLIO_SETTINGS_SCHEMA_PROBE,
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

  assert.ok(jsonLine, `Expected student portfolio settings schema probe to write JSON. stderr: ${stderr}`);
  return JSON.parse(jsonLine);
}

When('I probe the student portfolio settings schema contract', async function () {
  rememberProbeResult(this, await runStudentPortfolioSettingsSchemaProbe());
});

Then('the student portfolio settings probe should confirm summary can be omitted or empty', function () {
  const result = getProbeResult(this);

  assert.deepEqual(result.empty_settings.portfolio_summary, []);
  assert.deepEqual(result.empty_summary_settings.portfolio_summary, ['']);
  assert.deepEqual(result.empty_settings.portfolio_slug, []);
  assert.deepEqual(result.empty_settings.is_portfolio_world_public, []);
});

Then('the student portfolio settings probe should confirm omitted world-public state is absent for later private-default reads', function () {
  const result = getProbeResult(this);

  assert.deepEqual(
    result.empty_settings.is_portfolio_world_public,
    [],
    `Expected absent world-public setting to leave private-default behavior to read models, received ${JSON.stringify(result.empty_settings)}`,
  );
});

Then('the student portfolio settings probe should confirm summary, slug, and world-public state round-trip', function () {
  const result = getProbeResult(this);
  const configured = result.configured_settings;

  assert.deepEqual(configured.portfolio_summary, [result.expected_summary]);
  assert.deepEqual(configured.portfolio_slug, [result.ids.portfolio_slug]);
  assert.deepEqual(configured.is_portfolio_world_public, [false]);
});

Then('the student portfolio settings probe should confirm settings can be read without portfolio items', function () {
  const result = getProbeResult(this);

  assert.deepEqual(result.configured_item_ids, []);
  assert.deepEqual(result.configured_settings.portfolio_slug, [result.ids.portfolio_slug]);
  assert.deepEqual(result.configured_settings.portfolio_summary, [result.expected_summary]);
  assert.deepEqual(result.configured_settings.is_portfolio_world_public, [false]);
});

Then('the student portfolio settings probe should reject duplicate portfolio slugs', function () {
  const result = getProbeResult(this);

  assert.equal(
    result.duplicate_slug.rejected,
    true,
    `Expected duplicate portfolio slug to be rejected, received ${JSON.stringify(result.duplicate_slug)}`,
  );
  assert.match(
    String(result.duplicate_slug.error ?? ''),
    /portfolioSlug|unique|Uniqueness|Constraint|constraint/u,
    `Expected duplicate slug rejection to mention a uniqueness constraint, received ${JSON.stringify(result.duplicate_slug)}`,
  );
});
