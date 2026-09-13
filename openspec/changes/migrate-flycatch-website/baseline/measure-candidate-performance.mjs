#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const outPath = join(root, 'candidate-performance.json');
const baseUrl = (process.env.CANDIDATE_ORIGIN || 'http://127.0.0.1:4321').replace(/\/$/, '');
const chromePath =
  process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const pages = [
  { id: 'home', path: '/' },
  { id: 'service', path: '/services/ai-services' },
  { id: 'solution', path: '/solutions/flyGrid-ai' },
  {
    id: 'case_study',
    path: '/case-studies/a-social-e-commerce-platform-for-medallion-retailers',
  },
  { id: 'blog', path: '/company/blogs/how-kubernetes-help-your-growing-business' },
];

function runLighthouse(url) {
  return new Promise((resolve, reject) => {
    const args = [
      'lighthouse',
      url,
      '--only-categories=performance',
      '--form-factor=mobile',
      '--screenEmulation.mobile',
      '--output=json',
      '--quiet',
      '--chrome-flags=--headless=new --disable-gpu --no-first-run --no-sandbox',
    ];
    const child = spawn('npx', args, {
      env: { ...process.env, CHROME_PATH: chromePath },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`lighthouse exited ${code} for ${url}\n${stderr}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout));
      } catch (error) {
        reject(new Error(`Invalid Lighthouse JSON for ${url}: ${error}\n${stderr}`));
      }
    });
  });
}

function numeric(audit) {
  return typeof audit?.numericValue === 'number' ? audit.numericValue : null;
}

function extractLab(report) {
  const audits = report.audits || {};
  const lcp = numeric(audits['largest-contentful-paint']);
  const cls = numeric(audits['cumulative-layout-shift']);
  const ttfb = numeric(audits['server-response-time']) ?? numeric(audits['time-to-first-byte']);
  const tbt = numeric(audits['total-blocking-time']);
  const transfer = numeric(audits['total-byte-weight']);
  const inpAudit = audits['interaction-to-next-paint'] || audits.inp;
  const inp = numeric(inpAudit);
  const usedInp = inp != null;
  return {
    lcp_ms: lcp,
    inp_ms: usedInp ? inp : tbt,
    cls,
    ttfb_ms: ttfb,
    tbt_ms: tbt,
    transfer_size_bytes: transfer,
    performance_score: report.categories?.performance?.score ?? null,
    inp_source: usedInp ? 'lighthouse-inp' : 'tbt-lab-proxy-event-timing-unavailable',
  };
}

const results = [];
for (const page of pages) {
  const url = `${baseUrl}${page.path === '/' ? '/' : page.path}`;
  console.error(`Measuring ${page.id} ${url}`);
  const report = await runLighthouse(url);
  const lab = extractLab(report);
  results.push({
    id: page.id,
    url,
    requested_url: url,
    final_url: report.finalDisplayedUrl || report.finalUrl || url,
    strategy: 'mobile',
    source: `lighthouse@${report.lighthouseVersion || 'npx'} headless Chrome, form-factor=mobile`,
    lab,
    notes: [
      'LCP, CLS, TTFB, and transfer size are Lighthouse mobile lab values.',
      'INP is recorded from Lighthouse when present; otherwise Total Blocking Time is stored as the lab interactivity proxy, matching the 1.3 production baseline method.',
    ],
  });
  console.error(
    `  LCP=${lab.lcp_ms?.toFixed(0)}ms INP=${lab.inp_ms} CLS=${lab.cls} TTFB=${lab.ttfb_ms?.toFixed(0)}ms transfer=${lab.transfer_size_bytes}`,
  );
}

const payload = {
  captured_at: new Date().toISOString(),
  method:
    'Local Lighthouse against the candidate origin, mobile emulation. Figures are lab, not CrUX field data.',
  candidate_origin: baseUrl,
  pages: results,
};

mkdirSync(root, { recursive: true });
writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`);
console.log(outPath);
