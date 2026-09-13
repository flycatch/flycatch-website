import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { once } from "node:events";

const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const pages = [
  ["home", "https://www.flycatchtech.com/"],
  ["service", "https://www.flycatchtech.com/services/ai-services"],
  ["solution", "https://www.flycatchtech.com/solutions/flyGrid-ai"],
  [
    "case_study",
    "https://www.flycatchtech.com/case-studies/a-social-e-commerce-platform-for-medallion-retailers",
  ],
  ["blog", "https://www.flycatchtech.com/company/blogs/how-kubernetes-help-your-growing-business"],
];

function freePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
    server.on("error", reject);
  });
}

async function cdp(wsUrl, method, params = {}) {
  const ws = new WebSocket(wsUrl);
  await once(ws, "open");
  const id = Math.floor(Math.random() * 1e9);
  const result = new Promise((resolve, reject) => {
    ws.addEventListener("message", (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id === id) {
        ws.close();
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
      }
    });
  });
  ws.send(JSON.stringify({ id, method, params }));
  return result;
}

async function measure(wsUrl, url) {
  await cdp(wsUrl, "Page.enable");
  await cdp(wsUrl, "Runtime.enable");
  await cdp(wsUrl, "Page.navigate", { url });
  await new Promise((r) => setTimeout(r, 8000));
  await cdp(wsUrl, "Runtime.evaluate", {
    expression: `(() => {
      window.__inp = null;
      const po = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const v = entry.duration || entry.processingEnd - entry.processingStart || 0;
          window.__inp = window.__inp == null ? v : Math.max(window.__inp, v);
        }
      });
      try { po.observe({ type: 'event', buffered: true, durationThreshold: 0 }); } catch (e) {}
      return true;
    })()`,
    returnByValue: true,
  });
  const metrics = await cdp(wsUrl, "Page.getLayoutMetrics");
  const box = metrics.cssVisualViewport || metrics.visualViewport || { clientWidth: 400, clientHeight: 700 };
  const x = Math.round((box.clientWidth || 400) / 2);
  const y = Math.round((box.clientHeight || 700) / 3);
  for (const [cx, cy] of [
    [x, y],
    [40, 80],
    [x, Math.round((box.clientHeight || 700) * 0.6)],
  ]) {
    await cdp(wsUrl, "Input.dispatchMouseEvent", {
      type: "mousePressed",
      x: cx,
      y: cy,
      button: "left",
      clickCount: 1,
    });
    await cdp(wsUrl, "Input.dispatchMouseEvent", {
      type: "mouseReleased",
      x: cx,
      y: cy,
      button: "left",
      clickCount: 1,
    });
    await new Promise((r) => setTimeout(r, 800));
  }
  await new Promise((r) => setTimeout(r, 1500));
  const { result } = await cdp(wsUrl, "Runtime.evaluate", {
    expression: "window.__inp",
    returnByValue: true,
  });
  return result.value;
}

const port = await freePort();
const userData = `/tmp/flycatch-lh-inp-${port}`;
const chrome = spawn(
  chromePath,
  [
    `--remote-debugging-port=${port}`,
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    `--user-data-dir=${userData}`,
  ],
  { stdio: ["ignore", "pipe", "pipe"] },
);
let stderr = "";
chrome.stderr.on("data", (chunk) => {
  stderr += chunk.toString();
});
for (let i = 0; i < 20; i += 1) {
  await new Promise((r) => setTimeout(r, 250));
  try {
    await fetch(`http://127.0.0.1:${port}/json/version`);
    break;
  } catch (error) {
    if (i === 19) {
      throw new Error(`Chrome did not start: ${error}\n${stderr}`);
    }
  }
}
const results = {};
for (const [id, url] of pages) {
  const created = await (
    await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`, { method: "PUT" })
  ).json();
  const wsUrl = created.webSocketDebuggerUrl;
  const inp = await measure(wsUrl, url);
  results[id] = inp;
  console.log(id, inp);
}
chrome.kill("SIGTERM");
console.log(JSON.stringify(results));
