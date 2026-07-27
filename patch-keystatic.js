import fs from 'fs';
import path from 'path';
const file = path.resolve('./node_modules/@keystatic/astro/dist/keystatic-astro-api.js');
if (fs.existsSync(file)) {
  let code = fs.readFileSync(file, 'utf8');
  code = code.replaceAll('import.meta.env.KEYSTATIC_GITHUB_CLIENT_ID', 'process.env.KEYSTATIC_GITHUB_CLIENT_ID');
  code = code.replaceAll('import.meta.env.KEYSTATIC_GITHUB_CLIENT_SECRET', 'process.env.KEYSTATIC_GITHUB_CLIENT_SECRET');
  code = code.replaceAll('import.meta.env.KEYSTATIC_SECRET', 'process.env.KEYSTATIC_SECRET');
  fs.writeFileSync(file, code);
  console.log('Successfully patched Keystatic for Vercel');
} else {
  console.log('Keystatic file not found, skipping patch.');
}
