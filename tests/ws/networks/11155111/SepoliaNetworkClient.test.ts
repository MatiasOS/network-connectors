import { describe, it } from "node:test";
import assert from "node:assert";
import { SepoliaClient } from "../../../../src/networks/11155111/SepoliaClient.js";
import { isHexString, validateBlock } from "../../../helpers/validators.js";
import { getTestWsUrls } from "../../../helpers/env.js";

const WS_URLS = getTestWsUrls("eth-sepolia", ["wss://ethereum-sepolia-rpc.publicnode.com"]);

describe("SepoliaClient (WebSocket) - Basic Methods [strong]", () => {
  it("should get chain ID over WebSocket", async () => {
    const client = new SepoliaClient({ type: "fallback", rpcUrls: WS_URLS });

    const result = await client.chainId();

    assert.strictEqual(result.success, true, "Should succeed");
    assert.ok(isHexString(result.data!), "Chain ID should be hex string");
    assert.strictEqual(result.data, "0xaa36a7", "Should be Sepolia testnet");

    await client.close();
  });

  it("should get block number over WebSocket", async () => {
    const client = new SepoliaClient({ type: "fallback", rpcUrls: WS_URLS });

    const result = await client.blockNumber();

    assert.strictEqual(result.success, true, "Should succeed");
    assert.ok(isHexString(result.data!), "Block number should be hex string");
    const blockNum = Number.parseInt(result.data!, 16);
    assert.ok(blockNum > 0, "Block number should be positive");

    await client.close();
  });

  it("should get gas price over WebSocket", async () => {
    const client = new SepoliaClient({ type: "fallback", rpcUrls: WS_URLS });

    const result = await client.gasPrice();

    assert.strictEqual(result.success, true, "Should succeed");
    assert.ok(isHexString(result.data!), "Gas price should be hex string");

    await client.close();
  });

  it("should get block by number over WebSocket", async () => {
    const client = new SepoliaClient({ type: "fallback", rpcUrls: WS_URLS });

    const result = await client.getBlockByNumber("latest", false);

    assert.strictEqual(result.success, true, "Should succeed");
    assert.ok(result.data, "Should have block data");
    validateBlock(result.data);

    await client.close();
  });
});
