import { describe, it } from "node:test";
import assert from "node:assert";
import { EthereumClient } from "../../../../src/networks/1/EthereumClient.js";
import { isHexString, validateBlock } from "../../../helpers/validators.js";
import { getTestWsUrls } from "../../../helpers/env.js";

const WS_URLS = getTestWsUrls("eth-mainnet", ["wss://ethereum.publicnode.com"]);
const WS_URLS_MULTI = getTestWsUrls("eth-mainnet", [
  "wss://ethereum-rpc.publicnode.com",
  "wss://ethereum.publicnode.com",
]);

describe("EthereumClient (WebSocket) - Basic Methods [strong]", () => {
  it("should get chain ID over WebSocket", async () => {
    const client = new EthereumClient({ type: "fallback", rpcUrls: WS_URLS });

    const result = await client.chainId();

    assert.strictEqual(result.success, true, "Should succeed");
    assert.ok(isHexString(result.data!), "Chain ID should be hex string");
    assert.strictEqual(result.data, "0x1", "Should be Ethereum mainnet");

    await client.close();
  });

  it("should get block number over WebSocket", async () => {
    const client = new EthereumClient({ type: "fallback", rpcUrls: WS_URLS });

    const result = await client.blockNumber();

    assert.strictEqual(result.success, true, "Should succeed");
    assert.ok(isHexString(result.data!), "Block number should be hex string");
    const blockNum = Number.parseInt(result.data!, 16);
    assert.ok(blockNum > 0, "Block number should be positive");

    await client.close();
  });

  it("should get gas price over WebSocket", async () => {
    const client = new EthereumClient({ type: "fallback", rpcUrls: WS_URLS });

    const result = await client.gasPrice();

    assert.strictEqual(result.success, true, "Should succeed");
    assert.ok(isHexString(result.data!), "Gas price should be hex string");

    await client.close();
  });

  it("should get block by number over WebSocket", async () => {
    const client = new EthereumClient({ type: "fallback", rpcUrls: WS_URLS });

    const result = await client.getBlockByNumber("latest", false);

    assert.strictEqual(result.success, true, "Should succeed");
    assert.ok(result.data, "Should have block data");
    validateBlock(result.data);

    await client.close();
  });
});

describe("EthereumClient (WebSocket) - Strategy Types [strong]", () => {
  it("should work with race strategy over WebSocket", async () => {
    const client = new EthereumClient({
      type: "race",
      rpcUrls: WS_URLS_MULTI,
    });

    const result = await client.chainId();

    assert.strictEqual(result.success, true, "Should succeed");
    assert.strictEqual(result.data, "0x1", "Should be Ethereum mainnet");

    await client.close();
  });

  it("should work with parallel strategy over WebSocket", async () => {
    const client = new EthereumClient({
      type: "parallel",
      rpcUrls: WS_URLS_MULTI,
    });

    const result = await client.chainId();

    assert.strictEqual(result.success, true, "Should succeed");
    assert.strictEqual(result.data, "0x1", "Should be Ethereum mainnet");
    assert.ok(result.metadata, "Parallel should have metadata");
    assert.strictEqual(result.metadata.hasInconsistencies, false, "Should have no inconsistencies");

    await client.close();
  });
});
