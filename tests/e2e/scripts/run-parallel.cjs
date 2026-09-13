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
const { randomUUID } = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
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
const RUN_LOCK_FILE = path.join(os.tmpdir(), `${PARALLEL_COMPOSE_PROJECT}.lock`);

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
const groupsFlag = flagValue('--groups');
const requestedValues = groupsFlag?.split(',').map((value) => value.trim());

assert.ok(!(tearDownAfterwards && hasFlag('--keep-stack')), 'Use either --down or --keep-stack, not both');
assert.ok(
  requestedValues === undefined || (requestedValues.length > 0 && requestedValues.every((value) => /^\d+$/.test(value))),
  `--groups must be a comma-separated list of instance IDs, received: ${groupsFlag ?? ''}`,
);

const requestedIds = requestedValues?.map(Number);
const unknownIds = requestedIds?.filter((id) => !PARALLEL_GROUPS.some((group) => group.id === id)) ?? [];
assert.deepEqual(unknownIds, [], `Unknown parallel group ID(s): ${unknownIds.join(', ')}`);

const groups = requestedIds === undefined
  ? [...PARALLEL_GROUPS]
  : PARALLEL_GROUPS.filter((group) => requestedIds.includes(group.id));

assert.ok(groups.length > 0, `No parallel groups matched --groups=${groupsFlag}`);

const RESET_COMMAND = ['uv', 'run', 'python', 'db/reset_test_database.py', '--seed', 'db/test_seed.tql'];
const children = new Set();
const processGroups = new Set();

let heldLockId;
let interruption;
let terminationPromise;
let stackOwned = false;
let teardownPromise;

function formatDuration(ms) {
  const seconds = Math.round(ms / 1000);
  return `${Math.floor(seconds / 60)}m${String(seconds % 60).padStart(2, '0')}s`;
}

// Runs a child process, prefixing every output line so concurrent instances
// stay readable in a single terminal.
function run(command, args, { cwd, env, label, allowDuringInterruption = false } = {}) {
  if (interruption && !allowDuringInterruption) return Promise.resolve(interruption.exitCode);

  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: cwd ?? REPO_ROOT,
      detached: process.platform !== 'win32',
      env: { ...process.env, ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    children.add(child);
    if (child.pid !== undefined) processGroups.add(child);

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
    child.on('close', async (code) => {
      children.delete(child);

      while (processGroups.has(child) && processGroupIsRunning(child)) await delay(50);
      processGroups.delete(child);
      resolve(code ?? 1);
    });
  });
}

async function runOrFail(command, args, options) {
  const code = await run(command, args, options);
  assert.equal(code, 0, `Command failed (exit ${code}): ${command} ${args.join(' ')}`);
}

function lockSnapshot(file = RUN_LOCK_FILE) {
  let descriptor;
  try {
    descriptor = fs.openSync(file, 'r');
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }

  try {
    const stat = fs.fstatSync(descriptor);
    let owner = null;
    try {
      owner = JSON.parse(fs.readFileSync(descriptor, 'utf8'));
    } catch {
      // A malformed legacy lock can still be identified safely by its inode.
    }
    return { owner, stat };
  } finally {
    fs.closeSync(descriptor);
  }
}

function lockOwner() {
  return lockSnapshot()?.owner ?? null;
}

function processStartTicks(pid) {
  try {
    const stat = fs.readFileSync(`/proc/${pid}/stat`, 'utf8');
    const fields = stat.slice(stat.lastIndexOf(')') + 2).trim().split(/\s+/);
    return fields[19] ?? null;
  } catch {
    return null;
  }
}

function processIsRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code !== 'ESRCH';
  }
}

function ownerIsRunning(owner) {
  if (!Number.isInteger(owner?.pid) || !processIsRunning(owner.pid)) return false;

  const currentStartTicks = processStartTicks(owner.pid);
  if (owner.processStartTicks && currentStartTicks) {
    return owner.processStartTicks === currentStartTicks;
  }

  // Stay conservative on platforms without /proc or for locks from an older
  // runner version: a live PID is safer to treat as the owner.
  return true;
}

// The stack has fixed ports and a fixed Compose project so operational commands
// remain predictable. An atomic cross-worktree lock prevents one run from
// destroying another run's containers with the initial `down -v`.
function acquireRunLock() {
  const lockId = randomUUID();
  const candidate = `${RUN_LOCK_FILE}.candidate-${lockId}`;

  fs.writeFileSync(
    candidate,
    `${JSON.stringify({
      lockId,
      pid: process.pid,
      processStartTicks: processStartTicks(process.pid),
      cwd: REPO_ROOT,
      startedAt: new Date().toISOString(),
    }, null, 2)}\n`,
    { flag: 'wx' },
  );

  try {
    while (true) {
      try {
        // Publishing a populated candidate in one hard link means a crash can
        // never leave a newly acquired lock without ownership metadata.
        fs.linkSync(candidate, RUN_LOCK_FILE);
        heldLockId = lockId;
        return;
      } catch (error) {
        if (error.code !== 'EEXIST') throw error;

        const snapshot = lockSnapshot();
        if (!snapshot) continue;
        const { owner, stat: lockStat } = snapshot;
        const lockIsRecent = Date.now() - lockStat.mtimeMs < 10_000;
        if (ownerIsRunning(owner) || (!owner && lockIsRecent)) {
          const ownerMessage = owner?.pid ? ` (PID ${owner.pid}, ${owner.cwd ?? 'unknown directory'})` : '';
          throw new Error(`Another parallel E2E run owns ${RUN_LOCK_FILE}${ownerMessage}`);
        }

        // The hard link is an atomic claim on the exact stale inode. A delayed
        // contender cannot unlink a replacement lock because the deterministic
        // claim already exists, and an incarnation mismatch is rejected below.
        const staleIdentity = owner?.lockId ?? `${lockStat.dev}-${lockStat.ino}-${lockStat.mtimeMs}`;
        const quarantine = `${RUN_LOCK_FILE}.stale-${staleIdentity}`;
        try {
          fs.linkSync(RUN_LOCK_FILE, quarantine);
        } catch (linkError) {
          if (linkError.code === 'ENOENT') continue;
          if (linkError.code === 'EEXIST') {
            throw new Error(`Stale parallel E2E lock recovery is already claimed at ${quarantine}`);
          }
          throw linkError;
        }

        const claimedStat = fs.statSync(quarantine);
        if (claimedStat.dev !== lockStat.dev || claimedStat.ino !== lockStat.ino) {
          fs.rmSync(quarantine, { force: true });
          continue;
        }

        try {
          const currentStat = fs.statSync(RUN_LOCK_FILE);
          if (currentStat.dev === lockStat.dev && currentStat.ino === lockStat.ino) {
            fs.unlinkSync(RUN_LOCK_FILE);
          }
        } catch (unlinkError) {
          if (unlinkError.code !== 'ENOENT') throw unlinkError;
        } finally {
          fs.rmSync(quarantine, { force: true });
        }
      }
    }
  } finally {
    fs.rmSync(candidate, { force: true });
  }
}

function releaseRunLock() {
  if (!heldLockId) return;
  if (lockOwner()?.lockId !== heldLockId) {
    console.error(`Parallel E2E lock ownership changed; refusing to remove ${RUN_LOCK_FILE}`);
    heldLockId = undefined;
    return;
  }
  fs.rmSync(RUN_LOCK_FILE, { force: true });
  heldLockId = undefined;
}

function featureFilesIn(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return featureFilesIn(absolutePath);
    if (!entry.name.endsWith('.feature')) return [];
    return [path.relative(E2E_ROOT, absolutePath).split(path.sep).join('/')];
  });
}

// A feature file that is in no group would silently never run, which is the one
// failure mode of explicit partitioning that a reviewer cannot see.
function assertEveryFeatureIsAssigned() {
  const onDisk = featureFilesIn(FEATURES_DIR).sort();

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

function reportPath(group) {
  return path.resolve(E2E_ROOT, groupEnv(group).E2E_REPORT_PATH);
}

function cleanReports() {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  for (const group of groups) fs.rmSync(reportPath(group), { force: true });
}

async function startStack() {
  console.log('== Recreating the parallel E2E stack');
  await runOrFail('docker', [...COMPOSE_ARGS, 'down', '-v', '--remove-orphans']);

  if (!skipBuild) {
    console.log('== Building application images before database seeding');
    await runOrFail('docker', [
      ...COMPOSE_ARGS,
      'build',
      groups[0].backendService,
      groups[0].frontendService,
    ]);
  }

  stackOwned = true;
  await runOrFail('docker', [
    ...COMPOSE_ARGS,
    'up',
    '-d',
    '--wait',
    '--wait-timeout',
    '120',
    'typedb',
    'mailhog',
  ]);
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
  await runOrFail('docker', [...COMPOSE_ARGS, 'up', '-d', ...services]);
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
    const relativeReportPath = `tests/e2e/${groupEnv(group).E2E_REPORT_PATH}`;
    console.log(fs.existsSync(reportPath(group))
      ? `     report: ${relativeReportPath}`
      : '     report: not generated');
  }

  const slowest = Math.max(...results.map((result) => result.durationMs));
  const total = results.reduce((sum, result) => sum + result.durationMs, 0);
  console.log(`   wall time ${formatDuration(slowest)} vs ${formatDuration(total)} of serial test execution`);
  console.log('   rebalance by moving feature files between the groups in tests/e2e/support/parallel-groups.cjs');
}

function tearDownStack() {
  if (!stackOwned) return Promise.resolve();
  if (!teardownPromise) {
    teardownPromise = runOrFail(
      'docker',
      [...COMPOSE_ARGS, 'down', '-v', '--remove-orphans'],
      { allowDuringInterruption: true },
    )
      .then(() => {
        stackOwned = false;
      });
  }
  return teardownPromise;
}

function signalChild(child, signal) {
  try {
    if (process.platform === 'win32') child.kill(signal);
    else process.kill(-child.pid, signal);
  } catch (error) {
    if (error.code !== 'ESRCH') throw error;
  }
}

function processGroupIsRunning(child) {
  if (process.platform === 'win32') {
    return child.exitCode === null && child.signalCode === null;
  }

  try {
    process.kill(-child.pid, 0);
    return true;
  } catch (error) {
    if (error.code === 'ESRCH') return false;
    throw error;
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function terminateChildren(signal) {
  const activeGroups = [...processGroups];
  if (activeGroups.length === 0) return;

  for (const child of activeGroups) signalChild(child, signal);

  const deadline = Date.now() + 5_000;
  while (activeGroups.some(processGroupIsRunning) && Date.now() < deadline) {
    await delay(Math.min(50, deadline - Date.now()));
  }

  const remainingGroups = activeGroups.filter(processGroupIsRunning);
  if (remainingGroups.length > 0) {
    console.error('Parallel E2E child processes did not stop in time; sending SIGKILL');
    for (const child of remainingGroups) signalChild(child, 'SIGKILL');

    // A leader may have closed before a descendant. Keep ownership of the
    // shared stack until every process in each detached group has disappeared.
    while (remainingGroups.some(processGroupIsRunning)) {
      await delay(50);
    }
  }
}

function installSignalHandlers() {
  const exitCodes = { SIGINT: 130, SIGTERM: 143 };
  for (const signal of Object.keys(exitCodes)) {
    process.on(signal, () => {
      if (interruption) return;

      console.error(`Parallel E2E run interrupted by ${signal}`);
      interruption = { signal, exitCode: exitCodes[signal] };
      terminationPromise = terminateChildren(signal);
    });
  }
}

async function main() {
  const startedAt = Date.now();
  let exitCode = 0;
  let cleanupFailed = false;

  try {
    acquireRunLock();
    installSignalHandlers();
    assertEveryFeatureIsAssigned();
    cleanReports();

    await startStack();
    await seedDatabases();
    await startInstances();
    await preflight();
    const results = await runGroups();
    report(results);
    exitCode = results.some((result) => result.code !== 0) ? 1 : 0;
  } catch (error) {
    if (!interruption) {
      console.error('Parallel E2E run failed');
      console.error(error.message);
      exitCode = 1;
    }
  } finally {
    if (terminationPromise) {
      try {
        await terminationPromise;
      } catch (error) {
        console.error(`Parallel E2E child termination failed: ${error.message}`);
        cleanupFailed = true;
      }
    }
    if (tearDownAfterwards) {
      try {
        await tearDownStack();
      } catch (error) {
        console.error(`Parallel E2E teardown failed: ${error.message}`);
        cleanupFailed = true;
      }
    }
    // A signal can arrive while teardown itself is the active child.
    if (terminationPromise) {
      try {
        await terminationPromise;
      } catch {
        cleanupFailed = true;
      }
    }
    releaseRunLock();
  }

  if (cleanupFailed) exitCode = 1;
  else if (interruption) exitCode = interruption.exitCode;

  console.log(`   total including stack setup ${formatDuration(Date.now() - startedAt)}`);
  process.exitCode = exitCode;
}

main();
