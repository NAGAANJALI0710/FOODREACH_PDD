import path from 'path';
import { spawnSync } from 'child_process';
import fs from 'fs-extra';

// ─────────────────────────────────────────────────────────────────────────────
// FoodReach — Selenium Live E2E Suite Runner (TypeScript entry point)
// Delegates to the Node.js test runner at frontend/selenium-tests/run-all.js
// which executes 420+ Mocha/Selenium test cases against the LIVE GitHub Pages
// deployment and generates 4 Excel workbooks + HTML reports.
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL = process.env.BASE_URL || 'https://nagaanjali0710.github.io/FOODREACH_PDD/';
const seleniumRunnerPath = path.resolve(__dirname, '../../frontend/selenium-tests/run-all.js');

console.log('\n' + '═'.repeat(60));
console.log('  FoodReach Selenium Live E2E Master Suite');
console.log(`  Target URL: ${BASE_URL}`);
console.log('═'.repeat(60) + '\n');

if (!fs.existsSync(seleniumRunnerPath)) {
  console.error(`❌ Selenium runner not found at: ${seleniumRunnerPath}`);
  process.exit(1);
}

console.log(`✓ Delegating to: ${seleniumRunnerPath}\n`);

const result = spawnSync('node', [seleniumRunnerPath], {
  stdio: 'inherit',
  shell: false,
  env: {
    ...process.env,
    BASE_URL,
    NODE_ENV: 'test',
  },
});

if (result.error) {
  console.error('❌ Failed to spawn selenium runner:', result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 0);
