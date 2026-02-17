/**
 * License audit script for CI.
 *
 * Validates that all production dependencies use approved open-source licenses.
 * Approved licenses: MIT, ISC, Apache-2.0, BSD-2-Clause, BSD-3-Clause, 0BSD,
 * Unlicense, CC0-1.0, CC-BY-3.0, CC-BY-4.0, Python-2.0, BlueOak-1.0.0
 */

import { execSync } from 'node:child_process'

const ALLOWED_LICENSES = [
  'MIT',
  'ISC',
  'Apache-2.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  '0BSD',
  'Unlicense',
  'CC0-1.0',
  'CC-BY-3.0',
  'CC-BY-4.0',
  'Python-2.0',
  'BlueOak-1.0.0',
].join(';')

try {
  execSync(
    `npx license-checker --onlyAllow '${ALLOWED_LICENSES}' --production`,
    { stdio: 'inherit' },
  )
  console.log('\n\u2713 License audit passed \u2014 all dependencies use approved licenses')
}
catch {
  console.error('\n\u2717 License audit FAILED \u2014 found dependencies with non-approved licenses')
  console.error('Approved licenses:', ALLOWED_LICENSES.replace(/;/g, ', '))
  process.exit(1)
}
