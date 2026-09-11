import { readFile, writeFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const project = new URL('../../', import.meta.url);
const built = await readFile(new URL('static/dist/index.html', project), 'utf8');
const templateUrl = new URL('templates/dashboard/spa_index.html', project);
let template = await readFile(templateUrl, 'utf8');
for (const extension of ['js', 'css']) {
  const pattern = new RegExp(`/static/dist/assets/[^"\\s]+\\.${extension}`, 'g');
  const assets = built.match(pattern);
  if (!assets || assets.length !== 1 || !template.match(pattern)) {
    throw new Error(`Expected one built ${extension} asset and a template reference`);
  }
  await access(new URL(assets[0].slice(1), project));
  template = template.replace(pattern, assets[0]);
}
await writeFile(templateUrl, template);
console.log(`Updated dashboard asset references: ${fileURLToPath(templateUrl)}`);
