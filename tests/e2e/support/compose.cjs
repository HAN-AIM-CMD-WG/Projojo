// Single source of truth for the `docker compose` invocation that step
// definitions use to reach the backend of the stack currently under test.
//
// The serial stack (task test:e2e) and the parallel stack (task
// test:e2e:parallel) use different compose projects, compose files and backend
// service names, so these values are read from the environment. The defaults
// reproduce the serial stack exactly, which keeps `task test:e2e:*` and manual
// `npm test` runs working without any extra environment.
//
// The parallel orchestrator (scripts/run-parallel.cjs) exports the overrides
// per worker process.

const REPO_ROOT = require('node:path').resolve(__dirname, '..', '..', '..');

const COMPOSE_ENV_FILE = process.env.PROJOJO_COMPOSE_ENV_FILE ?? '.env.test';
const COMPOSE_PROJECT = process.env.PROJOJO_COMPOSE_PROJECT ?? 'projojo-e2e';
const COMPOSE_FILES = (process.env.PROJOJO_COMPOSE_FILES ?? 'docker-compose.base.yml,docker-compose.test.yml')
  .split(',')
  .map((file) => file.trim())
  .filter(Boolean);

// The compose service that hosts the FastAPI app of the instance under test.
// Parallel instances name theirs backend1..backend4.
const BACKEND_SERVICE = process.env.PROJOJO_BACKEND_SERVICE ?? 'backend';

const DOCKER_COMPOSE_ARGS = [
  'compose',
  '--env-file',
  COMPOSE_ENV_FILE,
  '-p',
  COMPOSE_PROJECT,
  ...COMPOSE_FILES.flatMap((file) => ['-f', file]),
];

module.exports = {
  BACKEND_SERVICE,
  COMPOSE_ENV_FILE,
  COMPOSE_FILES,
  COMPOSE_PROJECT,
  DOCKER_COMPOSE_ARGS,
  REPO_ROOT,
};
