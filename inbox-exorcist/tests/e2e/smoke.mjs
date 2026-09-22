import assert from "node:assert/strict";
import { spawn } from "node:child_process";

const port = 3210;
const baseUrl = `http://127.0.0.1:${port}`;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.status === 200) return;
    } catch {
      // server is still booting
    }
    await wait(500);
  }
  throw new Error("Next dev server did not become ready");
}

const isWindows = process.platform === "win32";
const npmCmd = isWindows ? "npm.cmd" : "npm";

const child = spawn(
  npmCmd,
  ["run", "dev", "--", "--port", String(port)],
  {
    stdio: ["ignore", "pipe", "pipe"],
    shell: isWindows,
    env: {
      ...process.env,
      PORT: String(port),
      NEXT_TELEMETRY_DISABLED: "1",
      INBOXEXORCIST_E2E: "1",
    },
  },
);

let output = "";
child.stdout.on("data", (chunk) => {
  output += chunk.toString();
});
child.stderr.on("data", (chunk) => {
  output += chunk.toString();
});

try {
  await waitForServer();

  const landing = await fetch(baseUrl);
  assert.equal(landing.status, 200);
  assert.match(await landing.text(), /Your inbox has demons/);

  const oauth = await fetch(`${baseUrl}/api/auth/google/start`, {
    redirect: "manual",
  });
  assert.ok([302, 303, 307, 308].includes(oauth.status));
  assert.match(oauth.headers.get("location") || "", /GOOGLE_OAUTH_NOT_CONFIGURED/);

  const settings = await fetch(`${baseUrl}/settings`, { redirect: "manual" });
  assert.ok([302, 303, 307, 308].includes(settings.status));
  assert.match(settings.headers.get("location") || "", /\/scan/);

  const scan = await fetch(`${baseUrl}/scan`);
  assert.equal(scan.status, 200);
  assert.match(await scan.text(), /Ready when Gmail is connected/);

  const preview = await fetch(`${baseUrl}/preview/mock`);
  assert.equal(preview.status, 200);
  assert.match(await preview.text(), /Preview the exorcism/);

  const widget = await fetch(`${baseUrl}/widget`);
  assert.equal(widget.status, 200);
  assert.match(await widget.text(), /Gmail Noise Radar/);

  const providers = await fetch(`${baseUrl}/providers`);
  assert.equal(providers.status, 200);
  assert.match(await providers.text(), /Works with/);

  const embedScript = await fetch(`${baseUrl}/api/widget/embed.js`);
  assert.equal(embedScript.status, 200);
  assert.equal(embedScript.headers.get("content-type"), "application/javascript; charset=utf-8");
  assert.match(await embedScript.text(), /inbox-exorcist-floating-btn/);
} catch (error) {
  console.error(output);
  throw error;
} finally {
  if (child.pid) {
    if (isWindows) {
      try {
        spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"]);
      } catch {
        child.kill("SIGKILL");
      }
    } else {
      child.kill("SIGTERM");
    }
  }
}
