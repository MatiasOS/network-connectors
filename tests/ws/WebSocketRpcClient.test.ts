import { describe, it } from "node:test";
import assert from "node:assert";
import { WebSocketRpcClient } from "../../src/WebSocketRpcClient.js";
import { isHexString } from "../helpers/validators.js";

const WS_URL = "wss://ethereum.publicnode.com";

describe("WebSocketRpcClient - Constructor", () => {
  it("should create client with URL", () => {
    const client = new WebSocketRpcClient(WS_URL);
    assert.strictEqual(client.getUrl(), WS_URL, "Should store URL");
    assert.strictEqual(client.getRequestId(), 0, "Initial request ID should be 0");
  });

  it("should accept custom options", () => {
    const client = new WebSocketRpcClient(WS_URL, {
      requestTimeoutMs: 10_000,
      maxReconnectRetries: 3,
      initialReconnectDelayMs: 500,
      maxReconnectDelayMs: 15_000,
    });
    assert.ok(client, "Should create client with custom options");
  });
});

describe("WebSocketRpcClient - Basic Calls [strong]", () => {
  it("should execute eth_chainId successfully", async () => {
    const client = new WebSocketRpcClient(WS_URL);

    const result = await client.call<string>("eth_chainId", []);

    assert.ok(isHexString(result), "Chain ID should be hex string");
    assert.strictEqual(result, "0x1", "Should be Ethereum mainnet");
    assert.strictEqual(client.getRequestId(), 1, "Request ID should increment");

    await client.close();
  });

  it("should execute eth_blockNumber successfully", async () => {
    const client = new WebSocketRpcClient(WS_URL);

    const result = await client.call<string>("eth_blockNumber", []);

    assert.ok(isHexString(result), "Block number should be hex string");
    const blockNum = Number.parseInt(result, 16);
    assert.ok(blockNum > 0, "Block number should be positive");

    await client.close();
  });

  it("should execute eth_gasPrice successfully", async () => {
    const client = new WebSocketRpcClient(WS_URL);

    const result = await client.call<string>("eth_gasPrice", []);

    assert.ok(isHexString(result), "Gas price should be hex string");

    await client.close();
  });

  it("should execute eth_getBlockByNumber with params", async () => {
    const client = new WebSocketRpcClient(WS_URL);

    const result = await client.call<any>("eth_getBlockByNumber", ["latest", false]);

    assert.ok(result, "Should return block data");
    assert.ok(result.number, "Block should have number");
    assert.ok(result.hash, "Block should have hash");
    assert.ok(isHexString(result.number), "Block number should be hex");

    await client.close();
  });
});

describe("WebSocketRpcClient - Connection Reuse [strong]", () => {
  it("should reuse connection for sequential calls", async () => {
    const client = new WebSocketRpcClient(WS_URL);

    const result1 = await client.call<string>("eth_chainId", []);
    const result2 = await client.call<string>("eth_chainId", []);

    assert.strictEqual(result1, result2, "Both calls should return same chain ID");
    assert.strictEqual(client.getRequestId(), 2, "Request ID should increment for each call");

    await client.close();
  });

  it("should handle concurrent calls (multiplexing)", async () => {
    const client = new WebSocketRpcClient(WS_URL);

    const [chainId, blockNumber, gasPrice] = await Promise.all([
      client.call<string>("eth_chainId", []),
      client.call<string>("eth_blockNumber", []),
      client.call<string>("eth_gasPrice", []),
    ]);

    assert.ok(isHexString(chainId), "Chain ID should be hex");
    assert.ok(isHexString(blockNumber), "Block number should be hex");
    assert.ok(isHexString(gasPrice), "Gas price should be hex");
    assert.strictEqual(client.getRequestId(), 3, "Should have made 3 requests");

    await client.close();
  });
});

describe("WebSocketRpcClient - Error Handling [strong]", () => {
  it("should throw on invalid RPC method", async () => {
    const client = new WebSocketRpcClient(WS_URL);

    await assert.rejects(
      () => client.call<string>("invalid_method_xyz", []),
      /RPC error/,
      "Should throw RPC error for invalid method",
    );

    await client.close();
  });

  it("should throw on connection to invalid URL", async () => {
    const client = new WebSocketRpcClient("wss://invalid-url-12345.example.com", {
      maxReconnectRetries: 0,
      requestTimeoutMs: 5_000,
    });

    await assert.rejects(
      () => client.call<string>("eth_chainId", []),
      /WebSocket connection/,
      "Should throw connection error",
    );
  });
});

describe("WebSocketRpcClient - Close and Reconnect [strong]", () => {
  it("should close cleanly", async () => {
    const client = new WebSocketRpcClient(WS_URL);

    await client.call<string>("eth_chainId", []);
    await client.close();

    // Should not throw
    assert.ok(true, "Close should complete without error");
  });

  it("should reconnect after close", async () => {
    const client = new WebSocketRpcClient(WS_URL);

    // First call establishes connection
    const result1 = await client.call<string>("eth_chainId", []);
    assert.ok(isHexString(result1), "First call should succeed");

    // Close connection
    await client.close();

    // Next call should reconnect
    const result2 = await client.call<string>("eth_chainId", []);
    assert.ok(isHexString(result2), "Call after reconnect should succeed");
    assert.strictEqual(result1, result2, "Should return same chain ID");

    await client.close();
  });

  it("should handle close when not connected", async () => {
    const client = new WebSocketRpcClient(WS_URL);

    // Close without ever connecting — should not throw
    await client.close();
    assert.ok(true, "Close on unconnected client should not throw");
  });
});
