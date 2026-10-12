import 'dotenv/config';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const root = process.cwd();
const result = spawnSync(process.execPath, [path.join(root, 'node_modules', 'prisma', 'build', 'index.js'), ...process.argv.slice(2)], {
  cwd: path.join(root, 'apps/api'), stdio: 'inherit', env: process.env, shell: false,
});
process.exit(result.status ?? 1);
