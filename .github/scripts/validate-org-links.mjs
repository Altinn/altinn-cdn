/* eslint-disable no-console */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPO_ROOT = path.join(__dirname, '..', '..');
const ORGS_FILE = path.join(REPO_ROOT, 'orgs', 'altinn-orgs.json');
const CDN_BASE_URL = 'https://altinncdn.no/';

function validate() {
  console.log('Validating logo and emblem links in altinn-orgs.json...');

  if (!fs.existsSync(ORGS_FILE)) {
    console.error(`Error: ${ORGS_FILE} not found.`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(ORGS_FILE, 'utf-8'));
  const orgs = data.orgs;
  let errors = 0;

  for (const [orgKey, orgData] of Object.entries(orgs)) {
    const fields = ['logo', 'emblem'];
    for (const field of fields) {
      const url = orgData[field];
      if (url && url.length > 0) {
        if (!url.startsWith(CDN_BASE_URL)) {
          console.error(`Error: Org '${orgKey}' has ${field} URL that does not start with ${CDN_BASE_URL}: ${url}`);
          errors++;
          continue;
        }

        const relativePath = url.substring(CDN_BASE_URL.length);
        const absoluteRepoRoot = path.resolve(REPO_ROOT);
        const filePath = path.resolve(absoluteRepoRoot, relativePath);

        if (!filePath.startsWith(absoluteRepoRoot + path.sep)) {
          console.error(`Error: Org '${orgKey}' has ${field} URL with invalid path (traversal detected): ${url}`);
          errors++;
          continue;
        }

        if (!fs.existsSync(filePath)) {
          console.error(`Error: Org '${orgKey}' has ${field} link to missing file: ${url} (Expected file at: ${relativePath})`);
          errors++;
        }
      }
    }
  }

  if (errors > 0) {
    console.error(`
Validation failed with ${errors} error(s).`);
    process.exit(1);
  }

  console.log('Validation successful! All logo and emblem links are valid and point to existing files.');
}

validate();
