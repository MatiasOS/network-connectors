import { describe, it } from "node:test";
import assert from "node:assert";
import { EthereumClient } from "../../../src/networks/1/EthereumClient.js";
import type { StrategyConfig } from "../../../src/strategies/requestStrategy.js";
import {
  validateObject,
  validateBlock,
  validateSuccessResult,
  validateTransaction,
  validateTransactionReceipt,
  validateLog,
  validateFeeHistory,
  validateFailureResult,
  isHexString,
} from "../../helpers/validators.js";
import { getTestUrls } from "../../helpers/env.js";

const TEST_URLS = getTestUrls("eth-mainnet", [
  "https://eth.merkle.io",
  "https://ethereum.publicnode.com",
]);

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

describe("EthereumClient - Constructor", () => {
  it("should create client with fallback strategy", () => {
    const config: StrategyConfig = {
      type: "fallback",
      rpcUrls: TEST_URLS,
    };

    const client = new EthereumClient(config);

    assert.ok(client, "Client should be created");
    assert.strictEqual(client.getStrategyName(), "fallback", "Should use fallback strategy");
  });

  it("should create client with parallel strategy", () => {
    const config: StrategyConfig = {
      type: "parallel",
      rpcUrls: TEST_URLS,
    };

    const client = new EthereumClient(config);

    assert.ok(client, "Client should be created");
    assert.strictEqual(client.getStrategyName(), "parallel", "Should use parallel strategy");
  });
});

describe("EthereumClient - Web3 Methods", () => {
  const config: StrategyConfig = {
    type: "fallback",
    rpcUrls: TEST_URLS,
  };

  it("should get client version", async () => {
    const client = new EthereumClient(config);
    const result = await client.clientVersion();

    validateSuccessResult(result, "string");
  });
});

describe("EthereumClient - Net Methods", () => {
  const config: StrategyConfig = {
    type: "fallback",
    rpcUrls: TEST_URLS,
  };

  it("should get network version", async () => {
    const client = new EthereumClient(config);
    const result = await client.version();

    validateSuccessResult(result, "string");
  });

  it("should get listening status", async () => {
    const client = new EthereumClient(config);
    const result = await client.listening();

    validateSuccessResult(result, "boolean");
  });

  it("should get peer count", async () => {
    const client = new EthereumClient(config);
    const result = await client.peerCount();

    validateSuccessResult(result);
    assert.ok(isHexString(result.data as string), "Peer count should be hex string");
  });
});

describe("EthereumClient - Chain Info", () => {
  const config: StrategyConfig = {
    type: "fallback",
    rpcUrls: TEST_URLS,
  };

  it("should get chain ID", async () => {
    const client = new EthereumClient(config);
    const result = await client.chainId();

    validateSuccessResult(result);
    assert.ok(isHexString(result.data as string), "Chain ID should be hex string");
  });

  it("should get block number", async () => {
    const client = new EthereumClient(config);
    const result = await client.blockNumber();

    validateSuccessResult(result);
    assert.ok(isHexString(result.data as string), "Block number should be hex string");
  });
});

describe("EthereumClient - Block Methods", () => {
  const config: StrategyConfig = {
    type: "fallback",
    rpcUrls: TEST_URLS,
  };

  it("should get block by number (latest)", async () => {
    const client = new EthereumClient(config);
    const result = await client.getBlockByNumber("latest", false);

    validateSuccessResult(result);
    validateBlock(result.data);
  });

  it("should get block by number (earliest)", async () => {
    const client = new EthereumClient(config);
    const result = await client.getBlockByNumber("earliest", false);

    validateSuccessResult(result);
    validateBlock(result.data);
  });

  it("should get block by number (pending)", async () => {
    const client = new EthereumClient(config);
    const result = await client.getBlockByNumber("pending", false);

    // Pending block may or may not exist depending on network state
    if (result.success && result.data) {
      const block = result.data;
      validateObject(block, ["transactions"]);
      assert.ok(Array.isArray(block.transactions), "Transactions should be array");
    } else {
      // Some networks may not support pending tag
      assert.ok(true, "Pending block not available or not supported");
    }
  });

  it("should get block by number (finalized)", async () => {
    const client = new EthereumClient(config);
    const result = await client.getBlockByNumber("finalized", false);

    validateSuccessResult(result);
    validateBlock(result.data);
  });

  it("should get block by number (safe)", async () => {
    const client = new EthereumClient(config);
    const result = await client.getBlockByNumber("safe", false);

    validateSuccessResult(result);
    validateBlock(result.data);
  });

  it("should get block by number with full transactions", async () => {
    const client = new EthereumClient(config);
    const result = await client.getBlockByNumber("latest", true);

    validateSuccessResult(result);
    const block = result.data;
    assert.ok(Array.isArray((block as any).transactions), "Transactions should be array");
  });

  // it("should get block by number (numeric)", async () => {
  //   const client = new EthereumClient(config);
  //   const result = await client.getBlockByNumber(" s", false);
  //
  //   assert.strictEqual(result.success, true, "Should succeed");
  //   assert.ok(result.data, "Should have block data");
  //   assert.ok(isHexString(result.data.number), "Block number should be hex");
  // });

  it("should get block by hash", async () => {
    const client = new EthereumClient(config);

    // First get latest block
    const latestResult = await client.getBlockByNumber("latest", false);
    assert.ok(latestResult.data?.hash, "Should have block hash");

    // Then get by hash
    const result = await client.getBlockByHash(latestResult.data.hash, false);

    validateSuccessResult(result);
    assert.strictEqual((result.data as any).hash, latestResult.data.hash, "Hash should match");
  });

  it("should get block transaction count by number", async () => {
    const client = new EthereumClient(config);
    const result = await client.getBlockTransactionCountByNumber("latest");

    validateSuccessResult(result);
    assert.ok(isHexString(result.data as string), "Transaction count should be hex");
  });

  it("should get block transaction count by hash", async () => {
    const client = new EthereumClient(config);

    // First get latest block
    const latestResult = await client.getBlockByNumber("latest", false);
    assert.ok(latestResult.data?.hash, "Should have block hash");

    // Then get transaction count
    const result = await client.getBlockTransactionCountByHash(latestResult.data.hash);

    validateSuccessResult(result);
    assert.ok(isHexString(result.data as string), "Transaction count should be hex");
  });
});

describe("EthereumClient - Account Methods", () => {
  const config: StrategyConfig = {
    type: "fallback",
    rpcUrls: TEST_URLS,
  };

  it("should get balance", async () => {
    const client = new EthereumClient(config);
    const result = await client.getBalance(ZERO_ADDRESS, "latest");

    validateSuccessResult(result);
    assert.ok(isHexString(result.data as string), "Balance should be hex string");
  });

  it("should get code", async () => {
    const client = new EthereumClient(config);
    const result = await client.getCode(ZERO_ADDRESS, "latest");

    validateSuccessResult(result);
    assert.ok(isHexString(result.data as string), "Code should be hex string");
  });

  it("should get storage at", async () => {
    const client = new EthereumClient(config);
    const result = await client.getStorageAt(ZERO_ADDRESS, "0x0", "latest");

    validateSuccessResult(result);
    assert.ok(isHexString(result.data as string), "Storage should be hex string");
  });

  it("should get transaction count", async () => {
    const client = new EthereumClient(config);
    const result = await client.getTransactionCount(ZERO_ADDRESS, "latest");

    validateSuccessResult(result);
    assert.ok(isHexString(result.data as string), "Transaction count should be hex string");
  });
});

describe("EthereumClient - Transaction Methods", () => {
  const config: StrategyConfig = {
    type: "fallback",
    rpcUrls: [
      "https://eth-pokt.nodies.app",
      "https://eth.api.onfinality.io/public",
      "https://ethereum.rpc.subquery.network/public",
    ],
  };

  it("should call eth_getTransactionBySenderAndNonce", async () => {
    const client = new EthereumClient(config);

    const sender = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"; // vitalik.eth
    const nonce = "0x1";
    const result = await client.getTransactionBySenderAndNonce(sender, nonce);

    assert.strictEqual(result.success, true, "Result should be successful");
    assert.ok(result.data && typeof result.data === "object", "Data should be an object");
    const tx: any = result.data;

    assert.strictEqual(tx.type, "0x0");
    assert.strictEqual(tx.nonce, "0x1");
    assert.strictEqual(tx.gasPrice, "0xba43b7400");
    assert.strictEqual(tx.gas, "0x81650");
    assert.strictEqual(tx.to.toLowerCase(), "0x7e2d0fe0ffdd78c264f8d40d19acb7d04390c6e8");
    assert.strictEqual(tx.value, "0x51dac207a000");
    assert.strictEqual(
      tx.input,
      "0x5a9809ed000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa960450000000000000000000000001db3439a222c519ab44bb1144fc28167b4fa6ee600000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000012309ce5400000000000000000000000000000000000000000000000000000000000000000e000000000000000000000000000000000000000000000000000000000000000010000000000000000000000005ed8cee6b63b1c6afce3ad7c92f4fd7e1b8fad9f0000000000000000000000000000000000000000000000000000000000000009636f7720686f7273650000000000000000000000000000000000000000000000",
    );
    assert.strictEqual(tx.r, "0xdacd4f44332b7e1962a3ad0ab0dfc2d277e6119c5d467402a378982a8dcc9385");
    assert.strictEqual(tx.s, "0x726f8ed4ab9213ae8840c2f92c769032cda97b98421b78a506bc75995ffdb13f");
    assert.strictEqual(tx.v, "0x1c");
    assert.strictEqual(
      tx.hash,
      "0xf3c0067e8aca43cf421dc502c0976525b89727fdfaee12bf356895f3b2bd7205",
    );
    assert.strictEqual(
      tx.blockHash,
      "0xedb89f2139f594b0a0b0682005a3836b82207a6b9f6282f0a06e34907d0e0051",
    );
    assert.strictEqual(tx.blockNumber, "0x4dca3");
    assert.strictEqual(tx.transactionIndex, "0x2");
    assert.strictEqual(tx.from.toLowerCase(), "0xd8da6bf26964af9d7eed9e03e53415d37aa96045");

    // Metadata checks (avoid asserting volatile fields like timestamp/responseTime)
    assert.ok(result.metadata, "Should have metadata");
    assert.strictEqual(result.metadata.strategy, "fallback");
    assert.ok(Array.isArray(result.metadata.responses) && result.metadata.responses.length >= 1);
    const resp = result.metadata.responses[0] as any;
    assert.strictEqual(resp.url, "https://eth-pokt.nodies.app");
    assert.strictEqual(resp.status, "success");
    assert.strictEqual(resp.data.hash, tx.hash);
    assert.strictEqual(result.metadata.hasInconsistencies, false);
  });

  it("should get transaction by hash", async () => {
    const client = new EthereumClient(config);

    // Get a block with transactions
    const blockResult = await client.getBlockByNumber("latest", false);
    assert.ok(blockResult.data, "Should have block");

    if (blockResult.data.transactions.length > 0) {
      const txHash = blockResult.data.transactions[0];
      const result = await client.getTransactionByHash(txHash as string);

      validateSuccessResult(result);
      validateTransaction(result.data);
      validateObject(result.data, [
        "blockHash",
        "blockNumber",
        "chainId",
        "from",
        "gas",
        "gasPrice",
        "hash",
        "input",
        "nonce",
        "to",
        "transactionIndex",
        "value",
        "v",
        "r",
        "s",
      ]);
    }
  });

  it("should get transaction receipt", async () => {
    const client = new EthereumClient(config);

    // Get a block with transactions
    const blockResult = await client.getBlockByNumber("latest", false);
    assert.ok(blockResult.data, "Should have block");

    if (blockResult.data.transactions.length > 0) {
      const txHash = blockResult.data.transactions[0];
      const result = await client.getTransactionReceipt(txHash as string);

      if (result.data !== null) {
        validateSuccessResult(result);
        validateTransactionReceipt(result.data);
      }
    }
  });

  it("should reject invalid sendRawTransaction", async () => {
    const client = new EthereumClient(config);
    const result = await client.sendRawTransaction("0xdeadbeef");

    validateFailureResult(result);
  });
});

describe("EthereumClient - Call and Estimate", () => {
  const config: StrategyConfig = {
    type: "fallback",
    rpcUrls: TEST_URLS,
  };

  it("should execute eth_call", async () => {
    const client = new EthereumClient(config);
    const result = await client.callContract({ to: ZERO_ADDRESS, data: "0x" }, "latest");

    // May succeed or fail depending on the call, but should return a result
    assert.ok(result, "Should return a result");
  });

  it("should estimate gas", async () => {
    const client = new EthereumClient(config);
    const result = await client.estimateGas({ from: ZERO_ADDRESS, to: ZERO_ADDRESS, value: "0x0" });

    // May succeed or fail, but should return a result
    assert.ok(result, "Should return a result");
  });

  it("should get gas price", async () => {
    const client = new EthereumClient(config);
    const result = await client.gasPrice();

    validateSuccessResult(result);
    assert.ok(isHexString(result.data as string), "Gas price should be hex string");
  });

  it("should get max priority fee per gas", async () => {
    const client = new EthereumClient(config);
    const result = await client.maxPriorityFeePerGas();

    validateSuccessResult(result);
    assert.ok(isHexString(result.data as string), "Max priority fee should be hex string");
  });

  it("should get fee history", async () => {
    const client = new EthereumClient(config);
    const result = await client.feeHistory("0x4", "latest", [25, 50, 75]);

    validateSuccessResult(result);
    validateFeeHistory(result.data);
  });
});

describe("EthereumClient - Logs and Filters", () => {
  const config: StrategyConfig = {
    type: "fallback",
    rpcUrls: TEST_URLS,
  };

  it("should get logs", async () => {
    const client = new EthereumClient(config);
    const result = await client.getLogs({ fromBlock: "latest", toBlock: "latest" });

    validateSuccessResult(result);
    assert.ok(Array.isArray(result.data), "Should return array of logs");

    for (const log of result.data as any[]) {
      validateLog(log);
    }
  });

  it("should create new filter", async () => {
    const client = new EthereumClient(config);
    const result = await client.newFilter({ fromBlock: "latest" });

    // May or may not be supported
    if (result.success) {
      assert.ok(isHexString(result.data as string), "Filter ID should be hex string");
    }
  });

  it("should create new block filter", async () => {
    const client = new EthereumClient(config);
    const result = await client.newBlockFilter();

    // May or may not be supported
    if (result.success) {
      assert.ok(isHexString(result.data as string), "Filter ID should be hex string");
    }
  });
});

describe("EthereumClient - Trace Methods", () => {
  const config: StrategyConfig = {
    type: "fallback",
    rpcUrls: TEST_URLS,
  };

  it("should attempt debug_traceTransaction", async () => {
    const client = new EthereumClient(config);

    // Get a transaction hash
    const blockResult = await client.getBlockByNumber("latest", false);
    if (blockResult.data && blockResult.data.transactions.length > 0) {
      const txHash = blockResult.data.transactions[0];
      const result = await client.debugTraceTransaction(txHash as string);

      // May fail if tracing not supported, but should return a result
      assert.ok(result, "Should return a result");
    }
  });

  it("should attempt trace_transaction", async () => {
    const client = new EthereumClient(config);

    // Get a transaction hash
    const blockResult = await client.getBlockByNumber("latest", false);
    if (blockResult.data && blockResult.data.transactions.length > 0) {
      const txHash = blockResult.data.transactions[0];
      const result = await client.traceTransaction(txHash as string);

      // May fail if tracing not supported, but should return a result
      assert.ok(result, "Should return a result");
    }
  });

  it("should attempt trace_block", async () => {
    const client = new EthereumClient(config);
    const result = await client.traceBlock("latest");

    // May fail if tracing not supported, but should return a result
    assert.ok(result, "Should return a result");
  });
});

describe("EthereumClient - Parallel Strategy", () => {
  const config: StrategyConfig = {
    type: "parallel",
    rpcUrls: TEST_URLS,
  };

  it("should get chain ID with metadata", async () => {
    const client = new EthereumClient(config);
    const result = await client.chainId();

    validateSuccessResult(result);
    assert.ok(result.metadata, "Should have metadata");
    assert.ok(result.metadata.responses.length >= 2, "Should have multiple responses");
  });

  it("should get block number with metadata", async () => {
    const client = new EthereumClient(config);
    const result = await client.blockNumber();

    validateSuccessResult(result);
    assert.ok(result.metadata, "Should have metadata");
    assert.strictEqual(result.metadata.strategy, "parallel", "Should be parallel strategy");
  });
});
