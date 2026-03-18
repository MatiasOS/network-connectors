import { describe, it } from "node:test";
import assert from "node:assert";
import { RaceStrategy } from "../../../src/strategies/raceStrategy.js";
import { WebSocketRpcClient } from "../../../src/WebSocketRpcClient.js";
import { isHexString, validateRaceMetadata } from "../../helpers/validators.js";
import { getTestWsUrls } from "../../helpers/env.js";

const WS_URLS = getTestWsUrls("eth-mainnet", [
  "wss://ethereum-rpc.publicnode.com",
  "wss://ethereum.publicnode.com",
]);

describe("RaceStrategy (WebSocket) - Execute [strong]", () => {
  it("should execute eth_chainId as race over WebSocket", async () => {
    const clients = WS_URLS.map((url) => new WebSocketRpcClient(url));
    const strategy = new RaceStrategy(clients);

    const result = await strategy.execute<string>("eth_chainId", []);

    assert.strictEqual(result.success, true, "Should succeed");
    assert.ok(result.data, "Should have data");
    assert.ok(isHexString(result.data), "Chain ID should be hex string");
    assert.strictEqual(result.data, "0x1", "Should be Ethereum mainnet");

    validateRaceMetadata(result, 1);

    await strategy.close();
  });

  it("should succeed when one WebSocket provider fails", async () => {
    const clients = [
      new WebSocketRpcClient("wss://invalid-url-12345.example.com", { maxReconnectRetries: 0 }),
      ...WS_URLS.map((url) => new WebSocketRpcClient(url)),
    ];
    const strategy = new RaceStrategy(clients);

    const result = await strategy.execute<string>("eth_chainId", []);

    assert.strictEqual(result.success, true, "Should succeed with working providers");
    assert.ok(isHexString(result.data!), "Chain ID should be hex string");

    await strategy.close();
  });

  it("should fail when all WebSocket providers fail", async () => {
    const clients = [
      new WebSocketRpcClient("wss://invalid-url-1.example.com", { maxReconnectRetries: 0 }),
      new WebSocketRpcClient("wss://invalid-url-2.example.com", { maxReconnectRetries: 0 }),
    ];
    const strategy = new RaceStrategy(clients);

    const result = await strategy.execute<string>("eth_chainId", []);

    assert.strictEqual(result.success, false, "Should fail when all providers fail");
    assert.ok(result.errors, "Should have errors");
    assert.strictEqual(result.errors.length, 2, "Should have errors from all providers");

    await strategy.close();
  });
});
