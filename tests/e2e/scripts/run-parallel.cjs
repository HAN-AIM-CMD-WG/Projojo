#!/usr/bin/env node
//
// Orchestrates a parallel E2E run: brings up the shared parallel stack, seeds
// one TypeDB database per instance, preflights every instance, then runs the
// four feature groups concurrently and aggregates the results.
//
// Usage (from tests/e2e):  node ./scripts/run-parallel.cjs
// Normally invoked through: task test:e2e:parallel
//
// Flags:
//   --keep-stack   leave the containers running after the run (default is to
//                  leave them running; use --down to tear them down)
//   --down         tear the stack down afterwards
//   --no-build     skip image builds (faster when nothing changed)
//   --groups=1,3   only run the listed instances

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

const {
  PARALLEL_COMPOSE_FILES,
  PARALLEL_COMPOSE_PROJECT,
  PARALLEL_ENV_FILE,
  PARALLEL_GROUPS,
  groupEnv,
} = require('../support/parallel-groups.cjs');

const E2E_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(E2E_ROOT, '..', '..');
const FEATURES_DIR = path.join(E2E_ROOT, 'features');
const REPORTS_DIR = path.join(E2E_ROOT, 'reports');

const COMPOSE_ARGS = [
  'compose',
  '--env-file',
  PARALLEL_ENV_FILE,
  '-p',
  PARALLEL_COMPOSE_PROJECT,
  ...PARALLEL_COMPOSE_FILES.flatMap((file) => ['-f', file]),
];

const argv = process.argv.slice(2);
const hasFlag = (name) => argv.includes(name);
const flagValue = (name) => argv.find((arg) => arg.startsWith(`${name}=`))?.split('=').slice(1).join('=');

const tearDownAfterwards = hasFlag('--down');
const skipBuild = hasFlag('--no-build');
const requestedIds = flagValue('--groups')?.split(',').map((value) => Number(value.trim())).filter(Number.isFinite);
const groups = requestedIds?.length
  ? PARALLEL_GROUPS.filter((group) => requestedIds.includes(group.id))
  : [...PARALLEL_GROUPS];

assert.ok(groups.length > 0, `No parallel groups matched --groups=${flagValue('--groups')}`);

const RESET_COMMAND = ['uv', 'run', 'python', 'db/reset_test_database.py', '--seed', 'db/test_seed.tql'];

function formatDuration(ms) {
  const seconds = Math.round(ms / 1000);
  return `${Math.floor(seconds / 60)}m${String(seconds % 60).padStart(2, '0')}s`;
}

// Runs a child process, prefixing every output line so concurrent instances
// stay readable in a single terminal.
function run(command, args, { cwd, env, label } = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: cwd ?? REPO_ROOT,
      env: { ...process.env, ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const prefix = label ? `[${label}] ` : '';
    const pipe = (stream, sink) => {
      let buffer = '';
      stream.setEncoding('utf8');
      stream.on('data', (chunk) => {
        buffer += chunk;
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) sink.write(`${prefix}${line}\n`);
      });
      stream.on('end', () => {
        if (buffer) sink.write(`${prefix}${buffer}\n`);
      });
    };

    pipe(child.stdout, process.stdout);
    pipe(child.stderr, process.stderr);

    child.on('error', (error) => {
      process.stderr.write(`${prefix}${error.message}\n`);
      resolve(1);
    });
    child.on('close', (code) => resolve(code ?? 1));
  });
}

async function runOrFail(command, args, options) {
  const code = await run(command, args, options);
  assert.equal(code, 0, `Command failed (exit ${code}): ${command} ${args.join(' ')}`);
}

// A feature file that is in no group would silently never run, which is the one
// failure mode of explicit partitioning that a reviewer cannot see.
function assertEveryFeatureIsAssigned() {
  const onDisk = fs.readdirSync(FEATURES_DIR)
    .filter((entry) => entry.endsWith('.feature'))
    .map((entry) => `features/${entry}`)
    .sort();

  const assigned = PARALLEL_GROUPS.flatMap((group) => group.paths);
  const duplicates = assigned.filter((item, index) => assigned.indexOf(item) !== index);
  const missing = onDisk.filter((item) => !assigned.includes(item));
  const unknown = assigned.filter((item) => !onDisk.includes(item));

  assert.deepEqual(duplicates, [], `Feature files assigned to more than one parallel group: ${duplicates.join(', ')}`);
  assert.deepEqual(
    missing,
    [],
    `Feature files not assigned to any parallel group (add them in tests/e2e/support/parallel-groups.cjs): ${missing.join(', ')}`,
  );
  assert.deepEqual(unknown, [], `Parallel groups reference feature files that do not exist: ${unknown.join(', ')}`);
}

async function startStack() {
  console.log('== Recreating the parallel E2E stack');
  await runOrFail('docker', [...COMPOSE_ARGS, 'down', '-v', '--remove-orphans']);
  await runOrFail('docker', [...COMPOSE_ARGS, 'up', '-d', ...(skipBuild ? [] : ['--build']), 'typedb', 'mailhog']);
}

// Seeds one database per instance before the backends start, so no backend ever
// installs the development seed first and then has it thrown away. Sequential on
// purpose: this is a one-off cost of a couple of minutes and concurrent schema
// installs against a freshly created TypeDB server buy little for the added risk.
async function seedDatabases() {
  console.log('== Installing the deterministic seed into one database per instance');
  for (const group of groups) {
    await runOrFail(
      'docker',
      [...COMPOSE_ARGS, 'run', '--rm', '--no-deps', group.backendService, ...RESET_COMMAND],
      { label: `g${group.id}` },
    );
  }
}

async function startInstances() {
  console.log('== Starting application instances');
  const services = groups.flatMap((group) => [group.backendService, group.frontendService]);
  await runOrFail('docker', [...COMPOSE_ARGS, 'up', '-d', ...(skipBuild ? [] : ['--build']), ...services]);
}

async function preflight() {
  console.log('== Preflighting every instance');
  const results = await Promise.all(groups.map((group) => run(
    'node',
    ['./scripts/preflight.cjs'],
    { cwd: E2E_ROOT, env: groupEnv(group), label: `g${group.id}` },
  )));

  const failed = groups.filter((_, index) => results[index] !== 0);
  assert.deepEqual(
    failed.map((group) => group.id),
    [],
    `Preflight failed for instance(s) ${failed.map((group) => group.id).join(', ')}`,
  );
}

async function runGroups() {
  console.log(`== Running ${groups.length} feature groups in parallel`);
  for (const group of groups) {
    console.log(`   instance ${group.id} (${group.name}): ${group.paths.length} feature files -> ${group.frontendUrl}`);
  }

  return Promise.all(groups.map(async (group) => {
    const startedAt = Date.now();
    const code = await run(
      'node',
      ['./node_modules/@qavajs/core/bin/qavajs.js', 'run', '--config', './qavajs.config.cjs', '--profile', group.profile],
      { cwd: E2E_ROOT, env: groupEnv(group), label: `g${group.id}` },
    );
    return { group, code, durationMs: Date.now() - startedAt };
  }));
}

function report(results) {
  console.log('\n== Parallel E2E summary');
  for (const { group, code, durationMs } of results) {
    const status = code === 0 ? 'PASS' : `FAIL (exit ${code})`;
    console.log(`   instance ${group.id} ${group.name.padEnd(20)} ${formatDuration(durationMs).padStart(7)}  ${status}`);
    console.log(`     report: tests/e2e/${groupEnv(group).E2E_REPORT_PATH}`);
  }

  const slowest = Math.max(...results.map((result) => result.durationMs));
  const total = results.reduce((sum, result) => sum + result.durationMs, 0);
  console.log(`   wall time ${formatDuration(slowest)} vs ${formatDuration(total)} of serial test execution`);
  console.log('   rebalance by moving feature files between the groups in tests/e2e/support/parallel-groups.cjs');
}

async function main() {
  assertEveryFeatureIsAssigned();
  fs.mkdirSync(REPORTS_DIR, { recursive: true });

  const startedAt = Date.now();
  await startStack();
  await seedDatabases();
  await startInstances();
  await preflight();
  const results = await runGroups();
  report(results);

  if (tearDownAfterwards) {
    await run('docker', [...COMPOSE_ARGS, 'down', '-v', '--remove-orphans']);
  }

  console.log(`   total including stack setup ${formatDuration(Date.now() - startedAt)}`);
  process.exitCode = results.some((result) => result.code !== 0) ? 1 : 0;
}

main().catch((error) => {
  console.error('Parallel E2E run failed');
  console.error(error.message);
  process.exit(1);
});
