import { describe, it } from "node:test";
import assert from "node:assert";
import { RaceStrategy } from "../../src/strategies/raceStrategy.js";
import { RpcClient } from "../../src/RpcClient.js";
import { isHexString, validateRaceMetadata } from "../helpers/validators.js";

const TEST_URLS = ["https://eth.merkle.io", "https://ethereum.publicnode.com"];

describe("RaceStrategy - Constructor", () => {
  it("should create RaceStrategy with RPC clients", () => {
    const clients = TEST_URLS.map((url) => new RpcClient(url));
    const strategy = new RaceStrategy(clients);

    assert.ok(strategy, "Strategy should be created");
    assert.strictEqual(strategy.getName(), "race", "Strategy name should be race");
  });

  it("should throw error with empty clients array", () => {
    assert.throws(
      () => {
        new RaceStrategy([]);
      },
      /at least one RPC client/i,
      "Should throw error for empty clients",
    );
  });

  it("should accept single RPC client", () => {
    const clients = [new RpcClient(TEST_URLS[0])];
    const strategy = new RaceStrategy(clients);

    assert.ok(strategy, "Should accept single client");
  });
});

describe("RaceStrategy - Execute Success", () => {
  it("should execute eth_chainId successfully", async () => {
    const clients = TEST_URLS.map((url) => new RpcClient(url));
    const strategy = new RaceStrategy(clients);

    const result = await strategy.execute<string>("eth_chainId", []);

    assert.strictEqual(result.success, true, "Result should be successful");
    assert.ok(result.data, "Result should have data");
    assert.ok(isHexString(result.data), "chainId should be hex string");
    assert.ok(result.metadata, "Should have metadata");
    assert.strictEqual(result.metadata.strategy, "race", "Strategy should be race");
  });

  it("should execute eth_blockNumber successfully", async () => {
    const clients = TEST_URLS.map((url) => new RpcClient(url));
    const strategy = new RaceStrategy(clients);

    const result = await strategy.execute<string>("eth_blockNumber", []);

    assert.strictEqual(result.success, true, "Result should be successful");
    assert.ok(result.data, "Result should have data");
    assert.ok(isHexString(result.data), "blockNumber should be hex string");
  });

  it("should execute eth_gasPrice successfully", async () => {
    const clients = TEST_URLS.map((url) => new RpcClient(url));
    const strategy = new RaceStrategy(clients);

    const result = await strategy.execute<string>("eth_gasPrice", []);

    assert.strictEqual(result.success, true, "Result should be successful");
    assert.ok(result.data, "Result should have data");
    assert.ok(isHexString(result.data), "gasPrice should be hex string");
  });

  it("should execute eth_getBlockByNumber with params", async () => {
    const clients = TEST_URLS.map((url) => new RpcClient(url));
    const strategy = new RaceStrategy(clients);

    const result = await strategy.execute<any>("eth_getBlockByNumber", ["latest", false]);

    assert.strictEqual(result.success, true, "Result should be successful");
    assert.ok(result.data, "Result should have data");
    assert.ok(result.data.number, "Block should have number");
    assert.ok(result.data.hash, "Block should have hash");
  });
});

describe("RaceStrategy - Race Behavior", () => {
  it("should succeed if at least one provider works (first invalid)", async () => {
    const clients = [
      new RpcClient("https://invalid-url-12345.com"),
      ...TEST_URLS.map((url) => new RpcClient(url)),
    ];
    const strategy = new RaceStrategy(clients);

    const result = await strategy.execute<string>("eth_chainId", []);

    assert.strictEqual(result.success, true, "Should succeed with race");
    assert.ok(result.data, "Should have data from working provider");
    assert.ok(isHexString(result.data), "chainId should be hex string");
  });

  it("should succeed if at least one provider works (multiple invalid)", async () => {
    const clients = [
      new RpcClient("https://invalid-url-1.com"),
      new RpcClient("https://invalid-url-2.com"),
      ...TEST_URLS.map((url) => new RpcClient(url)),
    ];
    const strategy = new RaceStrategy(clients);

    const result = await strategy.execute<string>("eth_blockNumber", []);

    assert.strictEqual(result.success, true, "Should eventually succeed");
    assert.ok(result.data, "Should have data from working provider");
  });

  it("should return errors when all providers fail", async () => {
    const clients = [
      new RpcClient("https://invalid-url-1.com"),
      new RpcClient("https://invalid-url-2.com"),
    ];
    const strategy = new RaceStrategy(clients);

    const result = await strategy.execute<string>("eth_chainId", []);

    assert.strictEqual(result.success, false, "Should fail when all providers fail");
    assert.ok(!result.data, "Should not have data");
    assert.ok(result.errors, "Should have errors");
    assert.strictEqual(result.errors.length, 2, "Should have errors from all providers");

    for (const error of result.errors) {
      assert.strictEqual(error.status, "error", "Error status should be error");
      assert.ok(error.error, "Should have error message");
      assert.ok(error.url, "Should have URL");
      assert.ok(typeof error.responseTime === "number", "Should have response time");
    }
  });
});

describe("RaceStrategy - Error Details", () => {
  it("should include response times in error objects", async () => {
    const clients = [
      new RpcClient("https://invalid-url-1.com"),
      new RpcClient("https://invalid-url-2.com"),
    ];
    const strategy = new RaceStrategy(clients);

    const result = await strategy.execute<string>("eth_chainId", []);

    assert.strictEqual(result.success, false, "Should fail");
    assert.ok(result.errors, "Should have errors");

    for (const error of result.errors) {
      assert.ok(typeof error.responseTime === "number", "Should have response time");
      assert.ok(error.responseTime >= 0, "Response time should be non-negative");
    }
  });
});

describe("RaceStrategy - Different RPC Methods", () => {
  const clients = TEST_URLS.map((url) => new RpcClient(url));

  it("should handle eth_getBalance", async () => {
    const strategy = new RaceStrategy(clients);
    const zeroAddress = "0x0000000000000000000000000000000000000000";
    const result = await strategy.execute<string>("eth_getBalance", [zeroAddress, "latest"]);

    assert.strictEqual(result.success, true, "Should succeed");
    if (!result.data) throw new Error("No data returned");
    assert.ok(isHexString(result.data), "Balance should be hex string");
  });

  it("should handle eth_getCode", async () => {
    const strategy = new RaceStrategy(clients);
    const zeroAddress = "0x0000000000000000000000000000000000000000";
    const result = await strategy.execute<string>("eth_getCode", [zeroAddress, "latest"]);

    assert.strictEqual(result.success, true, "Should succeed");
    if (!result.data) throw new Error("No data returned");
    assert.ok(isHexString(result.data), "Code should be hex string");
  });

  it("should handle eth_getLogs", async () => {
    const strategy = new RaceStrategy(clients);
    const result = await strategy.execute<any[]>("eth_getLogs", [
      { fromBlock: "latest", toBlock: "latest" },
    ]);

    assert.strictEqual(result.success, true, "Should succeed");
    assert.ok(Array.isArray(result.data), "Should return array");
  });

  it("should handle invalid method", async () => {
    const strategy = new RaceStrategy(clients);
    const result = await strategy.execute<string>("invalid_method", []);

    assert.strictEqual(result.success, false, "Should fail for invalid method");
    assert.ok(result.errors, "Should have errors");
  });
});

describe("RaceStrategy - Metadata", () => {
  it("should return metadata on success", async () => {
    const clients = TEST_URLS.map((url) => new RpcClient(url));
    const strategy = new RaceStrategy(clients);

    const result = await strategy.execute<string>("eth_chainId", []);

    assert.strictEqual(result.success, true, "Should succeed");
    validateRaceMetadata(result, 1);

    // Verify at least one successful response
    const successResponses = result.metadata!.responses.filter((r) => r.status === "success");
    assert.ok(successResponses.length >= 1, "Should have at least one successful response");
  });

  it("should track errors in metadata even on success", async () => {
    const clients = [
      new RpcClient("https://invalid-url-12345.com"),
      ...TEST_URLS.map((url) => new RpcClient(url)),
    ];
    const strategy = new RaceStrategy(clients);

    const result = await strategy.execute<string>("eth_chainId", []);

    assert.strictEqual(result.success, true, "Should succeed with race");
    validateRaceMetadata(result, 1);

    // Should have at least the winning response
    const successResponses = result.metadata!.responses.filter((r) => r.status === "success");
    assert.ok(successResponses.length >= 1, "Should have winning response in metadata");
  });

  it("should return metadata on total failure", async () => {
    const clients = [
      new RpcClient("https://invalid-url-1.com"),
      new RpcClient("https://invalid-url-2.com"),
    ];
    const strategy = new RaceStrategy(clients);

    const result = await strategy.execute<string>("eth_chainId", []);

    assert.strictEqual(result.success, false, "Should fail");
    validateRaceMetadata(result, 2);

    // All responses should be errors
    for (const response of result.metadata!.responses) {
      assert.strictEqual(response.status, "error");
    }
  });

  it("should have hasInconsistencies always false (race does not compare)", async () => {
    const clients = TEST_URLS.map((url) => new RpcClient(url));
    const strategy = new RaceStrategy(clients);

    const result = await strategy.execute<string>("eth_chainId", []);

    assert.strictEqual(result.success, true, "Should succeed");
    assert.strictEqual(
      result.metadata!.hasInconsistencies,
      false,
      "Race strategy should not detect inconsistencies",
    );
  });
});

describe("RaceStrategy - Performance Characteristics", () => {
  it("should return faster than sequential fallback (conceptual test)", async () => {
    // This test verifies the race strategy doesn't wait for all requests
    // by mixing fast and slow (invalid) providers
    const clients = [
      new RpcClient("https://invalid-url-slow.com"),
      ...TEST_URLS.map((url) => new RpcClient(url)),
    ];
    const strategy = new RaceStrategy(clients);

    const startTime = Date.now();
    const result = await strategy.execute<string>("eth_chainId", []);
    const duration = Date.now() - startTime;

    assert.strictEqual(result.success, true, "Should succeed");
    // The race should complete quickly because working providers respond fast
    // Invalid URLs typically timeout after several seconds
    // If this was sequential, it would take longer
    assert.ok(duration < 10000, "Race should complete before invalid URL timeout");
  });
});
