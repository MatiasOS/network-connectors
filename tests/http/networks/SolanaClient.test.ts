import { describe, it } from "node:test";
import assert from "node:assert";
import { SolanaClient } from "../../../src/networks/solana/SolanaClient.js";
import { SOLANA_DEVNET } from "../../../src/networks/solana/SolanaTypes.js";
import { ClientFactory } from "../../../src/factory/ClientRegistry.js";
import type { StrategyConfig } from "../../../src/strategies/requestStrategy.js";
import { getTestUrls } from "../../helpers/env.js";

const SOLANA_DEVNET_URLS = getTestUrls("solana-devnet", ["https://api.devnet.solana.com"]);

const config: StrategyConfig = {
  type: "fallback",
  rpcUrls: SOLANA_DEVNET_URLS,
};

describe("SolanaClient (HTTP) - Basic Methods [strong]", () => {
  it("should get version", async () => {
    const client = new SolanaClient(config);
    const result = await client.getVersion();

    assert.strictEqual(result.success, true, "Should succeed");
    assert.ok(result.data, "Should have data");
    assert.strictEqual(
      typeof result.data["solana-core"],
      "string",
      "solana-core should be a string",
    );
    assert.strictEqual(
      typeof result.data["feature-set"],
      "number",
      "feature-set should be a number",
    );
  });

  it("should get slot", async () => {
    const client = new SolanaClient(config);
    const result = await client.getSlot();

    assert.strictEqual(result.success, true, "Should succeed");
    assert.strictEqual(typeof result.data, "number", "Slot should be a number");
    assert.ok((result.data as number) > 0, "Slot should be positive");
  });

  it("should get block height", async () => {
    const client = new SolanaClient(config);
    const result = await client.getBlockHeight();

    assert.strictEqual(result.success, true, "Should succeed");
    assert.strictEqual(typeof result.data, "number", "Block height should be a number");
    assert.ok((result.data as number) > 0, "Block height should be positive");
  });

  it("should get latest blockhash", async () => {
    const client = new SolanaClient(config);
    const result = await client.getLatestBlockhash();

    assert.strictEqual(result.success, true, "Should succeed");
    assert.ok(result.data, "Should have data");
    assert.ok(result.data.context, "Should have context");
    assert.strictEqual(
      typeof result.data.context.slot,
      "number",
      "context.slot should be a number",
    );
    assert.ok(result.data.value, "Should have value");
    assert.strictEqual(
      typeof result.data.value.blockhash,
      "string",
      "blockhash should be a string",
    );
    assert.strictEqual(
      typeof result.data.value.lastValidBlockHeight,
      "number",
      "lastValidBlockHeight should be a number",
    );
  });

  it("should get balance for a known address", async () => {
    const client = new SolanaClient(config);
    // System program address — always exists, zero balance is fine
    const result = await client.getBalance("11111111111111111111111111111111");

    assert.strictEqual(result.success, true, "Should succeed");
    assert.ok(result.data, "Should have data");
    assert.strictEqual(
      typeof result.data.context.slot,
      "number",
      "context.slot should be a number",
    );
    assert.strictEqual(typeof result.data.value, "number", "balance value should be a number");
  });

  it("should get genesis hash matching devnet constant", async () => {
    const client = new SolanaClient(config);
    const result = await client.getGenesisHash();

    assert.strictEqual(result.success, true, "Should succeed");
    assert.strictEqual(typeof result.data, "string", "Genesis hash should be a string");

    // Verify the first 32 chars match the CAIP-2 reference in our constant
    const genesisHash = result.data as string;
    const caipReference = SOLANA_DEVNET.split(":")[1];
    assert.strictEqual(
      genesisHash.substring(0, 32),
      caipReference,
      "Genesis hash first 32 chars should match CAIP-2 chain ID reference",
    );
  });

  it("should get epoch info", async () => {
    const client = new SolanaClient(config);
    const result = await client.getEpochInfo();

    assert.strictEqual(result.success, true, "Should succeed");
    assert.ok(result.data, "Should have data");
    assert.strictEqual(
      typeof result.data.absoluteSlot,
      "number",
      "absoluteSlot should be a number",
    );
    assert.strictEqual(typeof result.data.blockHeight, "number", "blockHeight should be a number");
    assert.strictEqual(typeof result.data.epoch, "number", "epoch should be a number");
    assert.strictEqual(typeof result.data.slotIndex, "number", "slotIndex should be a number");
    assert.strictEqual(
      typeof result.data.slotsInEpoch,
      "number",
      "slotsInEpoch should be a number",
    );
  });

  it("should get health", async () => {
    const client = new SolanaClient(config);
    const result = await client.getHealth();

    assert.strictEqual(result.success, true, "Should succeed");
    assert.strictEqual(result.data, "ok", "Health should be 'ok'");
  });

  it("should get epoch schedule", async () => {
    const client = new SolanaClient(config);
    const result = await client.getEpochSchedule();

    assert.strictEqual(result.success, true, "Should succeed");
    assert.ok(result.data, "Should have data");
    assert.strictEqual(
      typeof result.data.slotsPerEpoch,
      "number",
      "slotsPerEpoch should be a number",
    );
    assert.strictEqual(typeof result.data.warmup, "boolean", "warmup should be a boolean");
  });

  it("should get cluster nodes", async () => {
    const client = new SolanaClient(config);
    const result = await client.getClusterNodes();

    assert.strictEqual(result.success, true, "Should succeed");
    assert.ok(Array.isArray(result.data), "Should return an array");
    assert.ok((result.data as unknown[]).length > 0, "Should have at least one node");
    const node = (result.data as { pubkey: string }[])[0];
    assert.strictEqual(typeof node.pubkey, "string", "Node pubkey should be a string");
  });

  it("should get recent performance samples", async () => {
    const client = new SolanaClient(config);
    const result = await client.getRecentPerformanceSamples(1);

    assert.strictEqual(result.success, true, "Should succeed");
    assert.ok(Array.isArray(result.data), "Should return an array");
  });
});

describe("SolanaClient (HTTP) - Block Methods [strong]", () => {
  it("should get a block by slot", async () => {
    const client = new SolanaClient(config);

    // First get a recent slot
    const slotResult = await client.getSlot("finalized");
    assert.strictEqual(slotResult.success, true);
    const slot = slotResult.data as number;

    // Get the block (may be null if slot was skipped)
    const result = await client.getBlock(slot, {
      maxSupportedTransactionVersion: 0,
      transactionDetails: "none",
      rewards: false,
    });

    assert.strictEqual(result.success, true, "Should succeed");
    // Block can be null for skipped slots
    if (result.data !== null) {
      assert.strictEqual(typeof result.data.blockhash, "string", "blockhash should be a string");
      assert.strictEqual(typeof result.data.parentSlot, "number", "parentSlot should be a number");
      assert.strictEqual(
        typeof result.data.previousBlockhash,
        "string",
        "previousBlockhash should be a string",
      );
    }
  });

  it("should get block time", async () => {
    const client = new SolanaClient(config);
    const slotResult = await client.getSlot("finalized");
    assert.strictEqual(slotResult.success, true);
    const slot = slotResult.data as number;

    const result = await client.getBlockTime(slot);
    assert.strictEqual(result.success, true, "Should succeed");
    // Block time can be null
    if (result.data !== null) {
      assert.strictEqual(typeof result.data, "number", "blockTime should be a number");
    }
  });
});

describe("SolanaClient (HTTP) - Transaction Methods [strong]", () => {
  it("should get recent prioritization fees", async () => {
    const client = new SolanaClient(config);
    const result = await client.getRecentPrioritizationFees();

    assert.strictEqual(result.success, true, "Should succeed");
    assert.ok(Array.isArray(result.data), "Should return an array");
    if ((result.data as unknown[]).length > 0) {
      const fee = (result.data as { slot: number; prioritizationFee: number }[])[0];
      assert.strictEqual(typeof fee.slot, "number", "slot should be a number");
      assert.strictEqual(
        typeof fee.prioritizationFee,
        "number",
        "prioritizationFee should be a number",
      );
    }
  });

  it("should validate blockhash", async () => {
    const client = new SolanaClient(config);

    // Get a recent blockhash first
    const bhResult = await client.getLatestBlockhash();
    assert.strictEqual(bhResult.success, true);
    const blockhash = bhResult.data?.value.blockhash as string;

    const result = await client.isBlockhashValid(blockhash);
    assert.strictEqual(result.success, true, "Should succeed");
    assert.ok(result.data, "Should have data");
    assert.strictEqual(typeof result.data.value, "boolean", "value should be a boolean");
  });
});

describe("SolanaClient (HTTP) - Factory Integration [strong]", () => {
  it("should create SolanaClient via ClientFactory", () => {
    const client = ClientFactory.createClient(SOLANA_DEVNET, config);

    assert.ok(client instanceof SolanaClient, "Should create SolanaClient instance");
    assert.strictEqual(client.getStrategyName(), "fallback", "Should use fallback strategy");
  });

  it("should create typed SolanaClient via ClientFactory", () => {
    const client = ClientFactory.createTypedClient(SOLANA_DEVNET, config);

    assert.ok(client instanceof SolanaClient, "Should create SolanaClient instance");
    assert.strictEqual(client.getStrategyName(), "fallback", "Should use fallback strategy");
  });
});
