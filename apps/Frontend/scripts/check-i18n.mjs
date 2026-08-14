#!/usr/bin/env node
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const srcDir = join(dirname(fileURLToPath(import.meta.url)), '../src');
const allowedPattern = /^\s*(import|export|const|let|var|function|class|\/\/|\/\*|\*|<!|<\?|type |interface |from |return|if |for |while |switch |case |default:|break;|\}|{|\)|\(|;|$)/;

function scan(dir) {
  const issues = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'generated') issues.push(...scan(full));
    else if (entry.name.endsWith('.astro')) {
      const content = readFileSync(full, 'utf8');
      const body = content.split('---').slice(2).join('---');
      const withoutStyles = body.replace(/<style[\s\S]*?<\/style>/gi, '');
      const textNodes = withoutStyles.match(/>([^<{][^<]*)</g) || [];
      for (const node of textNodes) {
        const text = node.slice(1, -1).trim();
        if (text && /[A-Za-z]{4,}/.test(text) && !text.startsWith('{')) {
          issues.push(`${full}: possible hard-coded string "${text}"`);
        }
      }
    }
  }
  return issues;
}

const issues = scan(srcDir);
if (issues.length) {
  console.error(issues.join('\n'));
  process.exit(1);
}
console.log('i18n scan passed');
