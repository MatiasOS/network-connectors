import { describe, it } from "node:test";
import assert from "node:assert";
import { ParallelStrategy } from "../../../src/strategies/parallelStrategy.js";
import { WebSocketRpcClient } from "../../../src/WebSocketRpcClient.js";
import {
  isHexString,
  validateParallelMetadata,
  validateResponseDetails,
} from "../../helpers/validators.js";

const WS_URLS = ["wss://ethereum-rpc.publicnode.com", "wss://ethereum.publicnode.com"];

describe("ParallelStrategy (WebSocket) - Execute [strong]", () => {
  it("should execute eth_chainId in parallel over WebSocket", async () => {
    const clients = WS_URLS.map((url) => new WebSocketRpcClient(url));
    const strategy = new ParallelStrategy(clients);

    const result = await strategy.execute<string>("eth_chainId", []);

    assert.strictEqual(result.success, true, "Should succeed");
    assert.ok(result.data, "Should have data");
    assert.ok(isHexString(result.data), "Chain ID should be hex string");

    validateParallelMetadata(result, 2);
    validateResponseDetails(result.metadata!.responses, true);

    // Both responses should succeed with same chain ID
    assert.strictEqual(
      result.metadata!.hasInconsistencies,
      false,
      "Should have no inconsistencies",
    );

    await strategy.close();
  });

  it("should detect inconsistencies when mixed with failing provider", async () => {
    const clients = [
      new WebSocketRpcClient("wss://invalid-url-12345.example.com", { maxReconnectRetries: 0 }),
      ...WS_URLS.map((url) => new WebSocketRpcClient(url)),
    ];
    const strategy = new ParallelStrategy(clients);

    const result = await strategy.execute<string>("eth_chainId", []);

    assert.strictEqual(result.success, true, "Should succeed (at least one provider works)");
    assert.ok(result.metadata, "Should have metadata");
    assert.ok(result.metadata.responses.length === 3, "Should have 3 responses");

    const errorResponses = result.metadata.responses.filter((r) => r.status === "error");
    assert.ok(errorResponses.length >= 1, "Should have at least one error response");

    await strategy.close();
  });
});
