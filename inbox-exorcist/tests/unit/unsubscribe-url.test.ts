import test from "node:test";
import assert from "node:assert/strict";

import { validateUnsubscribeUrl } from "../../src/lib/unsubscribe/url.ts";

test("allows ordinary https unsubscribe URLs", async () => {
  const result = await validateUnsubscribeUrl("https://example.com/unsubscribe", {
    resolveDns: false,
  });
  assert.equal(result.ok, true);
});

test("blocks localhost and private IP unsubscribe URLs", async () => {
  const localhost = await validateUnsubscribeUrl("https://localhost/unsub", {
    resolveDns: false,
  });
  const privateIp = await validateUnsubscribeUrl("https://192.168.1.4/unsub", {
    resolveDns: false,
  });

  assert.equal(localhost.ok, false);
  assert.equal(privateIp.ok, false);
});

test("blocks non-https unsubscribe URLs", async () => {
  const result = await validateUnsubscribeUrl("http://example.com/unsubscribe", {
    resolveDns: false,
  });
  assert.equal(result.ok, false);
});
