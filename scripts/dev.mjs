#!/usr/bin/env node
// One-command local stack: Postgres + MinIO (Docker), migrations, then Backend,
// Frontend and Administration FE in watch mode with prefixed output.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const backend = join(root, 'apps/Backend');
const frontend = join(root, 'apps/Frontend');
const admin = join(root, 'apps/Administration-FE');
const infra = join(root, 'deployment/compose/docker-compose.dev.yml');

function run(cmd, args, cwd = root) {
  const r = spawnSync(cmd, args, { cwd, stdio: 'inherit' });
  if (r.status !== 0) {
    console.error(`\n[dev] failed: ${cmd} ${args.join(' ')}`);
    process.exit(r.status ?? 1);
  }
}

console.log('[dev] starting Postgres + MinIO');
run('docker', ['compose', '-f', infra, 'up', '-d', '--wait']);

for (const dir of [frontend, admin]) {
  if (!existsSync(join(dir, 'node_modules'))) run('pnpm', ['install'], dir);
}
run('uv', ['sync', '--extra', 'dev'], backend);

console.log('[dev] applying migrations');
run('uv', ['run', 'alembic', 'upgrade', 'head'], backend);

// Both Astro dev servers proxy /api to PUBLIC_ORIGIN; point it at the local backend
// (their .env files may target a remote host).
// Astro 7 detaches into a background daemon when it detects an AI agent; keep it in the foreground.
const { AI_AGENT, CLAUDECODE, ...baseEnv } = process.env;
const apiEnv = { ...baseEnv, PUBLIC_ORIGIN: 'http://localhost:8000' };

const services = [
  { name: 'backend ', color: 33, cmd: 'uv', args: ['run', 'uvicorn', 'flycatch_api.main:app', '--reload', '--port', '8000'], cwd: backend, env: process.env },
  { name: 'frontend', color: 36, cmd: 'pnpm', args: ['run', 'dev'], cwd: frontend, env: apiEnv },
  { name: 'admin   ', color: 35, cmd: 'pnpm', args: ['run', 'dev'], cwd: admin, env: apiEnv },
];

const children = services.map((s) => {
  const child = spawn(s.cmd, s.args, { cwd: s.cwd, env: s.env, stdio: ['ignore', 'pipe', 'pipe'], detached: true });
  const tag = `\x1b[${s.color}m[${s.name}]\x1b[0m `;
  for (const stream of [child.stdout, child.stderr]) {
    let buf = '';
    stream.on('data', (d) => {
      buf += d;
      const lines = buf.split('\n');
      buf = lines.pop();
      for (const l of lines) console.log(tag + l);
    });
  }
  child.on('exit', (code) => {
    console.log(`${tag}exited (${code})`);
    shutdown(code ?? 1);
  });
  return child;
});

let closing = false;
function shutdown(code = 0) {
  if (closing) return;
  closing = true;
  // Signal each service's whole process group so pnpm/uv grandchildren (astro, uvicorn) die too.
  for (const c of children) {
    try {
      process.kill(-c.pid, 'SIGTERM');
    } catch {}
  }
  setTimeout(() => process.exit(code), 500);
}
process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

console.log('\n[dev] Site      http://localhost:8080');
console.log('[dev] Admin     http://localhost:8081/admin/   (use this one, not :4173)');
console.log('[dev] Frontend  http://localhost:4321');
console.log('[dev] Backend   http://localhost:8000/docs');
console.log('[dev] MinIO     http://localhost:9001 (minioadmin / change-me)');
console.log('[dev] Ctrl+C stops the apps; Postgres/MinIO keep running (pnpm dev:infra:down to stop)\n');
