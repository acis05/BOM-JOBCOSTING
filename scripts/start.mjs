import { spawn } from 'node:child_process';

const port = process.env.PORT || '3000';
console.log(`[BOM-JOBCOSTING] v0.2.2 booting`);
console.log(`[BOM-JOBCOSTING] PORT=${port}`);
console.log(`[BOM-JOBCOSTING] DATABASE_URL=${process.env.DATABASE_URL ? 'configured' : 'NOT configured'}`);
console.log(`[BOM-JOBCOSTING] APP_URL=${process.env.APP_URL || '(not set)'}`);

function runMigration() {
  return new Promise((resolve) => {
    if (!process.env.DATABASE_URL) {
      console.warn('[BOM-JOBCOSTING] Migration skipped: DATABASE_URL not configured');
      return resolve(false);
    }
    console.log('[BOM-JOBCOSTING] Running database migration...');
    const child = spawn(process.execPath, ['scripts/migrate.mjs'], { stdio: 'inherit', env: process.env });
    let finished = false;
    const timer = setTimeout(() => {
      if (!finished) {
        console.warn('[BOM-JOBCOSTING] Migration timeout after 20s; starting web server anyway.');
        child.kill('SIGTERM');
        resolve(false);
      }
    }, 20000);
    child.on('exit', (code) => {
      finished = true;
      clearTimeout(timer);
      if (code === 0) console.log('[BOM-JOBCOSTING] Migration OK');
      else console.warn(`[BOM-JOBCOSTING] Migration exited code=${code}; web server will still start.`);
      resolve(code === 0);
    });
    child.on('error', (err) => {
      finished = true;
      clearTimeout(timer);
      console.warn('[BOM-JOBCOSTING] Migration process error:', err.message);
      resolve(false);
    });
  });
}

await runMigration();
console.log(`[BOM-JOBCOSTING] Starting Next.js on 0.0.0.0:${port}`);
const web = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-H', '0.0.0.0', '-p', port], {
  stdio: 'inherit', env: process.env,
});
web.on('error', (err) => { console.error('[BOM-JOBCOSTING] Failed to start Next.js:', err); process.exit(1); });
web.on('exit', (code, signal) => { console.log(`[BOM-JOBCOSTING] Next.js exited code=${code ?? ''} signal=${signal ?? ''}`); process.exit(code ?? 1); });
for (const sig of ['SIGTERM','SIGINT']) process.on(sig, () => web.kill(sig));
