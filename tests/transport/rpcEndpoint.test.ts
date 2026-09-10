import { describe, it } from "node:test";
import assert from "node:assert";
import { createTransport } from "../../src/JsonRpcTransport.js";
import { RpcClient } from "../../src/RpcClient.js";
import { WebSocketRpcClient } from "../../src/WebSocketRpcClient.js";
import { NetworkClient } from "../../src/NetworkClient.js";
import type { RpcEndpoint, StrategyConfig } from "../../src/strategies/requestStrategy.js";
import { hasTatumApiKey, withTatumKey } from "../helpers/env.js";

const HTTP_URL = "https://ethereum.publicnode.com";
const WS_URL = "wss://ethereum.publicnode.com";

describe("RpcEndpoint - createTransport accepts strings and endpoint objects [strong]", () => {
  it("should create an RpcClient from a plain URL string", () => {
    const transport = createTransport(HTTP_URL);

    assert.ok(transport instanceof RpcClient, "Should create RpcClient");
    assert.strictEqual(transport.getUrl(), HTTP_URL, "Should preserve the URL");
  });

  it("should create an RpcClient from an endpoint object", () => {
    const transport = createTransport({ url: HTTP_URL, headers: { "x-api-key": "test-key" } });

    assert.ok(transport instanceof RpcClient, "Should create RpcClient");
    assert.strictEqual(transport.getUrl(), HTTP_URL, "Should unwrap the URL from the object");
  });

  it("should create an RpcClient from an endpoint object without headers", () => {
    const transport = createTransport({ url: HTTP_URL });

    assert.ok(transport instanceof RpcClient, "Should create RpcClient");
    assert.strictEqual(transport.getUrl(), HTTP_URL, "Should unwrap the URL");
  });

  it("should still detect WebSocket transport from an endpoint object", () => {
    const transport = createTransport({ url: WS_URL });

    assert.ok(
      transport instanceof WebSocketRpcClient,
      "Should create WebSocketRpcClient for a wss endpoint object",
    );
    assert.strictEqual(transport.getUrl(), WS_URL, "Should unwrap the URL");
  });
});

describe("RpcEndpoint - NetworkClient URL normalization [strong]", () => {
  it("should return plain strings from getRpcUrls for mixed input", () => {
    const config: StrategyConfig = {
      type: "fallback",
      rpcUrls: [HTTP_URL, { url: "https://cloudflare-eth.com", headers: { "x-api-key": "k" } }],
    };
    const client = new NetworkClient(config);

    assert.deepStrictEqual(
      client.getRpcUrls(),
      [HTTP_URL, "https://cloudflare-eth.com"],
      "getRpcUrls should normalize endpoint objects to their URL",
    );
  });

  it("should never expose configured headers via getRpcUrls", () => {
    const config: StrategyConfig = {
      type: "fallback",
      rpcUrls: [{ url: HTTP_URL, headers: { "x-api-key": "super-secret" } }],
    };
    const client = new NetworkClient(config);

    for (const url of client.getRpcUrls()) {
      assert.strictEqual(typeof url, "string", "Each entry should be a string");
      assert.ok(!url.includes("super-secret"), "Header values must not leak into getRpcUrls");
    }
  });

  it("should preserve endpoint objects via getRpcEndpoints", () => {
    const endpoint: RpcEndpoint = { url: HTTP_URL, headers: { "x-api-key": "k" } };
    const client = new NetworkClient({ type: "fallback", rpcUrls: [endpoint] });

    assert.deepStrictEqual(
      client.getRpcEndpoints(),
      [endpoint],
      "getRpcEndpoints should return the configured endpoints unchanged",
    );
  });

  it("should preserve endpoint headers across updateStrategy", () => {
    const endpoint: RpcEndpoint = { url: HTTP_URL, headers: { "x-api-key": "k" } };
    const client = new NetworkClient({ type: "fallback", rpcUrls: [endpoint] });

    client.updateStrategy("parallel");

    assert.strictEqual(client.getStrategyName(), "parallel", "Strategy should have switched");
    assert.deepStrictEqual(
      client.getRpcEndpoints(),
      [endpoint],
      "Endpoint headers should survive a strategy swap",
    );
  });
});

describe("RpcEndpoint - headers reach a real provider [strong]", () => {
  // What goes onto the wire is asserted precisely, and offline, in
  // rpcClientHeaders.test.ts. This one check is about the other half — that a real
  // provider reads the header we send — so it needs a live endpoint.
  //
  // Gated on a configured key because it is otherwise served from Tatum's anonymous
  // bucket (5 req/min shared across all its hosts), which makes it fail with a 429
  // that says nothing about the code.
  const TATUM_URL = "https://zcash-mainnet-zebrad.gateway.tatum.io";
  const needsKey = { skip: hasTatumApiKey ? false : "requires TATUM_API_KEY" };

  it("should send configured headers on the request", { ...needsKey }, async () => {
    const client = new RpcClient(TATUM_URL, { "x-api-key": "definitely-not-a-valid-key" });

    await assert.rejects(
      () => client.call<number>("getblockcount"),
      /401/,
      "An invalid x-api-key should be rejected, proving the header reached the server",
    );
  });

  it("should authenticate with a valid key", { ...needsKey }, async () => {
    const endpoint = withTatumKey(TATUM_URL);
    assert.notStrictEqual(typeof endpoint, "string", "A configured key should yield an endpoint");

    const transport = createTransport(endpoint);
    const result = await transport.call<number>("getblockcount");

    assert.strictEqual(typeof result, "number", "Authenticated access should succeed");
    assert.ok(result > 0, "Block count should be positive");
  });
});

describe("RpcEndpoint - WebSocket endpoints reject headers [strong]", () => {
  it("should throw when headers are supplied for a wss endpoint", () => {
    assert.throws(
      () => createTransport({ url: WS_URL, headers: { "x-api-key": "k" } }),
      /Headers are not supported for WebSocket endpoints/,
      "Silently dropping the credential would fail later and far from the cause",
    );
  });

  it("should throw for a ws:// endpoint too", () => {
    assert.throws(
      () => createTransport({ url: "ws://localhost:8545", headers: { authorization: "Bearer x" } }),
      /Headers are not supported for WebSocket endpoints/,
    );
  });

  it("should still accept a WebSocket endpoint object with an empty header map", () => {
    const transport = createTransport({ url: WS_URL, headers: {} });
    assert.ok(transport instanceof WebSocketRpcClient, "An empty map is not a credential");
  });
});

describe("RpcEndpoint - configuration is not caller-mutable [strong]", () => {
  it("should not expose the internal endpoint list for mutation", () => {
    const client = new NetworkClient({ type: "fallback", rpcUrls: [HTTP_URL] });

    const endpoints = client.getRpcEndpoints();
    endpoints.push("https://attacker.example");

    assert.deepStrictEqual(
      client.getRpcEndpoints(),
      [HTTP_URL],
      "Mutating the returned array must not reconfigure the client",
    );
  });

  it("should not track later mutation of the caller's config array", () => {
    const rpcUrls: (string | RpcEndpoint)[] = [HTTP_URL];
    const client = new NetworkClient({ type: "fallback", rpcUrls });

    rpcUrls.push("https://attacker.example");

    assert.deepStrictEqual(
      client.getRpcUrls(),
      [HTTP_URL],
      "The client should have copied the array it was given",
    );
  });
});
