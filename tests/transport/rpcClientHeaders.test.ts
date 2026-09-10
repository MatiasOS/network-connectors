import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { RpcClient } from "../../src/RpcClient.js";

/**
 * Header behaviour is verified against a local server rather than a live provider:
 * the assertions are about exactly what goes onto the wire, which no public
 * endpoint will echo back, and this keeps the test offline and rate-limit free.
 */
let server: Server;
let baseUrl: string;
let lastHeaders: Record<string, string | string[] | undefined> = {};

before(async () => {
  server = createServer((req, res) => {
    lastHeaders = req.headers;
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      const { id } = JSON.parse(body);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ jsonrpc: "2.0", id, result: "0x1" }));
    });
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close((err) => (err ? reject(err) : resolve())),
  );
});

describe("RpcClient - request headers [strong]", () => {
  it("should send configured headers", async () => {
    const client = new RpcClient(baseUrl, { "x-api-key": "secret-key" });
    await client.call("eth_chainId");

    assert.strictEqual(lastHeaders["x-api-key"], "secret-key", "Custom header should be sent");
  });

  it("should always send Content-Type: application/json", async () => {
    const client = new RpcClient(baseUrl);
    await client.call("eth_chainId");

    assert.strictEqual(lastHeaders["content-type"], "application/json");
  });

  it("should not let a configured header displace Content-Type", async () => {
    // The body is always JSON, so Content-Type is not the caller's to override.
    const client = new RpcClient(baseUrl, { "Content-Type": "text/plain" });
    await client.call("eth_chainId");

    assert.strictEqual(
      lastHeaders["content-type"],
      "application/json",
      "Content-Type must survive a caller-supplied override",
    );
  });

  it("should ignore later mutation of the caller's header object", async () => {
    const headers: Record<string, string> = { "x-api-key": "original" };
    const client = new RpcClient(baseUrl, headers);

    headers["x-api-key"] = "swapped";
    headers["x-injected"] = "yes";
    await client.call("eth_chainId");

    assert.strictEqual(lastHeaders["x-api-key"], "original", "Client should hold its own copy");
    assert.strictEqual(lastHeaders["x-injected"], undefined, "Injected header must not appear");
  });
});
