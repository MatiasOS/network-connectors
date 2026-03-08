import { describe, it } from "node:test";
import assert from "node:assert";
import { AvalancheClient } from "../../src/networks/43114/AvalancheClient.js";
import type { StrategyConfig } from "../../src/strategies/requestStrategy.js";
import {
  validateObject,
  validateBlock,
  validateSuccessResult,
  validateTransaction,
  validateParallelMetadata,
  validateResponseDetails,
  isHexString,
} from "../helpers/validators.js";

const TEST_URLS = ["https://api.avax.network/ext/bc/C/rpc", "https://avalanche.public-rpc.com"];

describe("AvalancheClient - Constructor", () => {
  it("should create client with fallback strategy", () => {
    const config: StrategyConfig = { type: "fallback", rpcUrls: TEST_URLS };
    const client = new AvalancheClient(config);
    assert.ok(client);
    assert.strictEqual(client.getStrategyName(), "fallback");
  });

  it("should create client with parallel strategy", () => {
    const config: StrategyConfig = { type: "parallel", rpcUrls: TEST_URLS };
    const client = new AvalancheClient(config);
    assert.ok(client);
    assert.strictEqual(client.getStrategyName(), "parallel");
  });

  it("should create client with race strategy", () => {
    const config: StrategyConfig = { type: "race", rpcUrls: TEST_URLS };
    const client = new AvalancheClient(config);
    assert.ok(client);
    assert.strictEqual(client.getStrategyName(), "race");
  });
});

describe("AvalancheClient - Block Methods", () => {
  const config: StrategyConfig = {
    type: "fallback",
    rpcUrls: TEST_URLS,
  };

  it("should get block by number (latest)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.getBlockByNumber("latest", false);

    validateSuccessResult(result);
    validateBlock(result.data);
  });

  it("should get block by number (earliest)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.getBlockByNumber("earliest", false);

    validateSuccessResult(result);
    validateBlock(result.data);
  });

  it("should get block by number (finalized)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.getBlockByNumber("finalized", false);

    validateSuccessResult(result);
    validateBlock(result.data);
  });

  it("should get block by hash", async () => {
    const client = new AvalancheClient(config);

    // First get a block to get its hash
    const latestResult = await client.getBlockByNumber("latest", false);
    assert.ok(latestResult.data, "Should have latest block");

    const result = await client.getBlockByHash(latestResult.data.hash, false);
    validateSuccessResult(result);
    validateBlock(result.data);
  });

  it("should get block transaction count by number", async () => {
    const client = new AvalancheClient(config);
    const result = await client.getBlockTransactionCountByNumber("latest");

    validateSuccessResult(result);
    assert.ok(isHexString(result.data as string), "Transaction count should be hex");
  });

  it("should return chain ID 0xa86a (43114)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.chainId();

    validateSuccessResult(result);
    assert.strictEqual(result.data, "0xa86a", "Chain ID should be 0xa86a (43114)");
  });

  it("should get current block number", async () => {
    const client = new AvalancheClient(config);
    const result = await client.blockNumber();

    validateSuccessResult(result);
    assert.ok(isHexString(result.data as string), "Block number should be hex");
  });
});

describe("AvalancheClient - Transaction Methods", () => {
  const config: StrategyConfig = {
    type: "fallback",
    rpcUrls: TEST_URLS,
  };

  it("should get transaction by hash", async () => {
    const client = new AvalancheClient(config);

    // Get a block with transactions
    const blockResult = await client.getBlockByNumber("latest", false);
    assert.ok(blockResult.data, "Should have block");

    if (blockResult.data.transactions.length > 0) {
      const txHash = blockResult.data.transactions[0];
      const result = await client.getTransactionByHash(txHash as string);

      if (result.data !== null) {
        validateSuccessResult(result);
        validateTransaction(result.data);
      }
    }
  });

  it("should get transaction receipt", async () => {
    const client = new AvalancheClient(config);

    // Get a block with transactions
    const blockResult = await client.getBlockByNumber("latest", false);
    assert.ok(blockResult.data, "Should have block");

    if (blockResult.data.transactions.length > 0) {
      const txHash = blockResult.data.transactions[0];
      const result = await client.getTransactionReceipt(txHash as string);

      if (result.data !== null) {
        validateSuccessResult(result);
        validateObject(result.data, [
          "transactionHash",
          "blockNumber",
          "blockHash",
          "gasUsed",
          "status",
        ]);
      }
    }
  });
});

describe("AvalancheClient - Account Methods", () => {
  const config: StrategyConfig = {
    type: "fallback",
    rpcUrls: TEST_URLS,
  };

  it("should get balance", async () => {
    const client = new AvalancheClient(config);
    // WAVAX contract address - should have a non-zero balance
    const result = await client.getBalance("0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7");

    validateSuccessResult(result);
    assert.ok(isHexString(result.data as string), "Balance should be hex");
  });

  it("should get code for a contract", async () => {
    const client = new AvalancheClient(config);
    // WAVAX contract
    const result = await client.getCode("0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7");

    validateSuccessResult(result);
    assert.ok(isHexString(result.data as string), "Code should be hex");
    assert.ok((result.data as string).length > 2, "Contract should have code");
  });

  it("should get transaction count", async () => {
    const client = new AvalancheClient(config);
    const result = await client.getTransactionCount("0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7");

    validateSuccessResult(result);
    assert.ok(isHexString(result.data as string), "Transaction count should be hex");
  });
});

describe("AvalancheClient - Fee Methods", () => {
  const config: StrategyConfig = {
    type: "fallback",
    rpcUrls: TEST_URLS,
  };

  it("should get gas price", async () => {
    const client = new AvalancheClient(config);
    const result = await client.gasPrice();

    validateSuccessResult(result);
    assert.ok(isHexString(result.data as string), "Gas price should be hex");
  });

  it("should get max priority fee per gas", async () => {
    const client = new AvalancheClient(config);
    const result = await client.maxPriorityFeePerGas();

    validateSuccessResult(result);
    assert.ok(isHexString(result.data as string), "Max priority fee should be hex");
  });

  it("should get base fee (Avalanche extension)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.baseFee();

    validateSuccessResult(result);
    assert.ok(isHexString(result.data as string), "Base fee should be hex");
  });
});

describe("AvalancheClient - Parallel Strategy", () => {
  const config: StrategyConfig = {
    type: "parallel",
    rpcUrls: TEST_URLS,
  };

  it("should get block with parallel strategy and metadata", async () => {
    const client = new AvalancheClient(config);
    const result = await client.getBlockByNumber("latest", false);

    validateSuccessResult(result);
    validateBlock(result.data);
    validateParallelMetadata(result, 2);
    validateResponseDetails(result.metadata!.responses);
  });

  it("should get chain ID with parallel strategy", async () => {
    const client = new AvalancheClient(config);
    const result = await client.chainId();

    validateSuccessResult(result);
    assert.strictEqual(result.data, "0xa86a", "Chain ID should be 0xa86a (43114)");
    validateParallelMetadata(result, 2);
  });
});
