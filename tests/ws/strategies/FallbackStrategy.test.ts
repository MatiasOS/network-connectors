import { describe, it } from "node:test";
import assert from "node:assert";
import { FallbackStrategy } from "../../../src/strategies/fallbackStrategy.js";
import { WebSocketRpcClient } from "../../../src/WebSocketRpcClient.js";
import {
  isHexString,
  validateFallbackMetadata,
  validateResponseDetails,
} from "../../helpers/validators.js";

const WS_URLS = ["wss://ethereum.publicnode.com"];

describe("FallbackStrategy (WebSocket) - Constructor", () => {
  it("should create FallbackStrategy with WebSocket clients", () => {
    const clients = WS_URLS.map((url) => new WebSocketRpcClient(url));
    const strategy = new FallbackStrategy(clients);

    assert.ok(strategy, "Strategy should be created");
    assert.strictEqual(strategy.getName(), "fallback", "Strategy name should be fallback");
  });
});

describe("FallbackStrategy (WebSocket) - Execute [strong]", () => {
  it("should execute eth_chainId successfully over WebSocket", async () => {
    const clients = WS_URLS.map((url) => new WebSocketRpcClient(url));
    const strategy = new FallbackStrategy(clients);

    const result = await strategy.execute<string>("eth_chainId", []);

    assert.strictEqual(result.success, true, "Should succeed");
    assert.ok(result.data, "Should have data");
    assert.ok(isHexString(result.data), "Chain ID should be hex string");
    assert.strictEqual(result.data, "0x1", "Should be Ethereum mainnet");

    validateFallbackMetadata(result);
    validateResponseDetails(result.metadata!.responses, false);

    await strategy.close();
  });

  it("should fallback to second WebSocket provider when first fails", async () => {
    const clients = [
      new WebSocketRpcClient("wss://invalid-url-12345.example.com", { maxReconnectRetries: 0 }),
      ...WS_URLS.map((url) => new WebSocketRpcClient(url)),
    ];
    const strategy = new FallbackStrategy(clients);

    const result = await strategy.execute<string>("eth_chainId", []);

    assert.strictEqual(result.success, true, "Should succeed with fallback");
    assert.ok(result.data, "Should have data");
    assert.ok(isHexString(result.data), "Chain ID should be hex string");

    await strategy.close();
  });
});

describe("FallbackStrategy (WebSocket) - Mixed Transports [strong]", () => {
  it("should work with mixed HTTP and WebSocket clients", async () => {
    const { RpcClient } = await import("../../../src/RpcClient.js");
    const clients = [
      new RpcClient("https://ethereum.publicnode.com"),
      new WebSocketRpcClient(WS_URLS[0]),
    ];
    const strategy = new FallbackStrategy(clients);

    const result = await strategy.execute<string>("eth_chainId", []);

    assert.strictEqual(result.success, true, "Should succeed with mixed transports");
    assert.ok(isHexString(result.data!), "Chain ID should be hex string");

    await strategy.close();
  });
});
