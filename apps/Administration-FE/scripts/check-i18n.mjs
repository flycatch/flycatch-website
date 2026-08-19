#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const srcDir = join(dirname(fileURLToPath(import.meta.url)), '../src');
const files = [
  'components/SignInForm.tsx',
  'components/AdminShell.tsx',
  'components/PageEditor.tsx',
  'components/RolesList.tsx',
  'components/RoleForm.tsx',
  'components/BlogsList.tsx',
  'components/BlogForm.tsx',
  'components/RichTextEditor.tsx',
  'components/AuthorsList.tsx',
  'components/AuthorForm.tsx',
  'components/MediaPreview.tsx',
  'components/CategoriesList.tsx',
  'components/CategoryForm.tsx',
  'components/MultiSelect.tsx',
];
const allowedLiteral = new Set(['Title', 'Description', 'Primary heading', 'Summary', 'Body']);

let failed = false;
for (const file of files) {
  const full = join(srcDir, file);
  const content = readFileSync(full, 'utf8');
  const jsx = content.split(/return \(/).slice(1).join('\n');
  const textNodes = jsx.match(/>\s*([A-Za-z][^<{]*?)\s*</g) || [];
  for (const node of textNodes) {
    const text = node.replace(/^>\s*/, '').replace(/\s*<$/, '').trim();
    if (!text || allowedLiteral.has(text)) continue;
    if (text.includes('{') || text.includes(';') || text.includes('=')) continue;
    if (/^[A-Za-z][A-Za-z .,'-]{3,}$/.test(text)) {
      console.error(`${full}: possible hard-coded string "${text}"`);
      failed = true;
    }
  }
}

if (failed) process.exit(1);
console.log('Administration FE i18n scan passed');
