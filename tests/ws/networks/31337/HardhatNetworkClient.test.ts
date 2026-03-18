import { describe, it } from "node:test";
import assert from "node:assert";
import { HardhatClient } from "../../../../src/networks/31337/HardhatClient.js";
import { isHexString, validateBlock } from "../../../helpers/validators.js";

const WS_URLS = ["ws://127.0.0.1:8545"];

describe("HardhatClient (WebSocket) - Basic Methods [strong]", () => {
  it("should get chain ID over WebSocket", async () => {
    const client = new HardhatClient({ type: "fallback", rpcUrls: WS_URLS });

    const result = await client.chainId();

    assert.strictEqual(result.success, true, "Should succeed");
    assert.ok(isHexString(result.data!), "Chain ID should be hex string");
    assert.strictEqual(result.data, "0x7a69", "Should be Hardhat chain ID (31337)");

    await client.close();
  });

  it("should get block number over WebSocket", async () => {
    const client = new HardhatClient({ type: "fallback", rpcUrls: WS_URLS });

    const result = await client.blockNumber();

    assert.strictEqual(result.success, true, "Should succeed");
    assert.ok(isHexString(result.data!), "Block number should be hex string");

    await client.close();
  });

  it("should get gas price over WebSocket", async () => {
    const client = new HardhatClient({ type: "fallback", rpcUrls: WS_URLS });

    const result = await client.gasPrice();

    assert.strictEqual(result.success, true, "Should succeed");
    assert.ok(isHexString(result.data!), "Gas price should be hex string");

    await client.close();
  });

  it("should get block by number over WebSocket", async () => {
    const client = new HardhatClient({ type: "fallback", rpcUrls: WS_URLS });

    const result = await client.getBlockByNumber("latest", false);

    assert.strictEqual(result.success, true, "Should succeed");
    assert.ok(result.data, "Should have block data");
    validateBlock(result.data);

    await client.close();
  });
});

describe("HardhatClient (WebSocket) - Hardhat Methods [strong]", () => {
  it("should get automine status over WebSocket", async () => {
    const client = new HardhatClient({ type: "fallback", rpcUrls: WS_URLS });

    const result = await client.getAutomine();

    assert.strictEqual(result.success, true, "Should succeed");
    assert.strictEqual(typeof result.data, "boolean", "Automine should be boolean");

    await client.close();
  });

  it("should get metadata over WebSocket", async () => {
    const client = new HardhatClient({ type: "fallback", rpcUrls: WS_URLS });

    const result = await client.metadata();

    assert.strictEqual(result.success, true, "Should succeed");
    assert.ok(result.data, "Should have metadata");
    assert.strictEqual(
      typeof result.data.clientVersion,
      "string",
      "clientVersion should be string",
    );
    assert.strictEqual(typeof result.data.chainId, "number", "chainId should be number");

    await client.close();
  });

  it("should mine blocks over WebSocket", async () => {
    const client = new HardhatClient({ type: "fallback", rpcUrls: WS_URLS });

    const beforeResult = await client.blockNumber();
    assert.strictEqual(beforeResult.success, true, "Should succeed");
    const beforeBlock = Number.parseInt(beforeResult.data!, 16);

    await client.mine("0x1");

    const afterResult = await client.blockNumber();
    assert.strictEqual(afterResult.success, true, "Should succeed");
    const afterBlock = Number.parseInt(afterResult.data!, 16);

    assert.ok(afterBlock >= beforeBlock + 1, "Should have mined at least 1 block");

    await client.close();
  });
});

describe("HardhatClient (WebSocket) - EVM Methods [strong]", () => {
  it("should create and revert snapshot over WebSocket", async () => {
    const client = new HardhatClient({ type: "fallback", rpcUrls: WS_URLS });

    const snapshotResult = await client.evmSnapshot();
    assert.strictEqual(snapshotResult.success, true, "Should succeed");
    assert.ok(snapshotResult.data, "Should return snapshot ID");

    const revertResult = await client.evmRevert(snapshotResult.data!);
    assert.strictEqual(revertResult.success, true, "Should succeed");
    assert.strictEqual(revertResult.data, true, "Revert should return true");

    await client.close();
  });

  it("should mine with evm_mine over WebSocket", async () => {
    const client = new HardhatClient({ type: "fallback", rpcUrls: WS_URLS });

    const mineResult = await client.evmMine();
    assert.strictEqual(mineResult.success, true, "Should succeed");

    await client.close();
  });
});

describe("HardhatClient (WebSocket) - Race Strategy [strong]", () => {
  it("should work with race strategy over WebSocket", async () => {
    const client = new HardhatClient({ type: "race", rpcUrls: WS_URLS });

    const result = await client.chainId();

    assert.strictEqual(result.success, true, "Should succeed");
    assert.strictEqual(result.data, "0x7a69", "Should be Hardhat chain ID");

    await client.close();
  });
});
