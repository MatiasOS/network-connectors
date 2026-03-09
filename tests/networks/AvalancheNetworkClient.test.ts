/* biome-ignore-all lint/suspicious/noExplicitAny: <TODO> */
import { describe, it } from "node:test";
import assert from "node:assert";
import { AvalancheClient } from "../../src/networks/43114/AvalancheClient.js";
import type { StrategyConfig } from "../../src/strategies/requestStrategy.js";
import {
  validateSuccessResult,
  validateFailureResult,
  isHexString,
  isAddress,
} from "../helpers/validators.js";

const TEST_URLS = [
  "https://api.avax.network/ext/bc/C/rpc",
  "https://avalanche.public-rpc.com",
  "https://rpc.ankr.com/avalanche",
];

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const config: StrategyConfig = {
  type: "fallback",
  rpcUrls: TEST_URLS,
};

// ===== Type-shape validators matching AvalancheTypes.ts exactly =====

function validateAvalancheBlock(block: any, fullTx = false): void {
  const requiredFields = [
    "number",
    "hash",
    "parentHash",
    "nonce",
    "sha3Uncles",
    "logsBloom",
    "transactionsRoot",
    "stateRoot",
    "receiptsRoot",
    "miner",
    "difficulty",
    "extraData",
    "size",
    "gasLimit",
    "gasUsed",
    "timestamp",
    "transactions",
    "uncles",
  ];
  for (const field of requiredFields) {
    assert.ok(field in block, `AvalancheBlock should have required field '${field}'`);
  }

  assert.strictEqual(typeof block.number, "string", "number should be string");
  assert.strictEqual(typeof block.hash, "string", "hash should be string");
  assert.strictEqual(typeof block.parentHash, "string", "parentHash should be string");
  assert.strictEqual(typeof block.nonce, "string", "nonce should be string");
  assert.strictEqual(typeof block.gasLimit, "string", "gasLimit should be string");
  assert.strictEqual(typeof block.gasUsed, "string", "gasUsed should be string");
  assert.strictEqual(typeof block.timestamp, "string", "timestamp should be string");

  assert.ok(isHexString(block.number), "number should be hex");
  assert.ok(isHexString(block.hash), "hash should be hex");
  assert.ok(isHexString(block.parentHash), "parentHash should be hex");
  assert.ok(isHexString(block.gasLimit), "gasLimit should be hex");
  assert.ok(isHexString(block.gasUsed), "gasUsed should be hex");
  assert.ok(isHexString(block.timestamp), "timestamp should be hex");

  assert.ok(Array.isArray(block.transactions), "transactions should be array");
  if (fullTx && block.transactions.length > 0) {
    validateAvalancheTransaction(block.transactions[0]);
  } else if (!fullTx && block.transactions.length > 0) {
    assert.strictEqual(typeof block.transactions[0], "string", "tx hashes should be strings");
  }

  assert.ok(Array.isArray(block.uncles), "uncles should be array");

  if ("baseFeePerGas" in block && block.baseFeePerGas !== undefined) {
    assert.strictEqual(typeof block.baseFeePerGas, "string", "baseFeePerGas should be string");
  }
  if ("withdrawals" in block && block.withdrawals !== undefined) {
    assert.ok(Array.isArray(block.withdrawals), "withdrawals should be array");
  }
}

function validateAvalancheTransaction(tx: any): void {
  const requiredFields = ["hash", "nonce", "from", "value", "gas", "input", "type", "v", "r", "s"];
  for (const field of requiredFields) {
    assert.ok(field in tx, `AvalancheTransaction should have required field '${field}'`);
  }

  assert.strictEqual(typeof tx.hash, "string", "hash should be string");
  assert.ok(isHexString(tx.hash), "hash should be hex");
  assert.strictEqual(typeof tx.from, "string", "from should be string");
  assert.ok(isAddress(tx.from), "from should be address");
  assert.strictEqual(typeof tx.value, "string", "value should be string");
  assert.strictEqual(typeof tx.gas, "string", "gas should be string");

  assert.ok(
    tx.blockHash === null || typeof tx.blockHash === "string",
    "blockHash should be string|null",
  );
  assert.ok(
    tx.blockNumber === null || typeof tx.blockNumber === "string",
    "blockNumber should be string|null",
  );
  assert.ok(tx.to === null || typeof tx.to === "string", "to should be string|null");

  if ("gasPrice" in tx && tx.gasPrice !== undefined) {
    assert.strictEqual(typeof tx.gasPrice, "string", "gasPrice should be string");
  }
  if ("maxFeePerGas" in tx && tx.maxFeePerGas !== undefined) {
    assert.strictEqual(typeof tx.maxFeePerGas, "string", "maxFeePerGas should be string");
  }
  if ("maxPriorityFeePerGas" in tx && tx.maxPriorityFeePerGas !== undefined) {
    assert.strictEqual(
      typeof tx.maxPriorityFeePerGas,
      "string",
      "maxPriorityFeePerGas should be string",
    );
  }
  if ("accessList" in tx && tx.accessList !== undefined) {
    assert.ok(Array.isArray(tx.accessList), "accessList should be array");
    if (tx.accessList.length > 0) {
      validateAvalancheAccessListEntry(tx.accessList[0]);
    }
  }
  if ("chainId" in tx && tx.chainId !== undefined) {
    assert.strictEqual(typeof tx.chainId, "string", "chainId should be string");
  }
}

function validateAvalancheAccessListEntry(entry: any): void {
  assert.strictEqual(typeof entry.address, "string", "accessList entry address should be string");
  assert.ok(Array.isArray(entry.storageKeys), "accessList entry storageKeys should be array");
}

function validateAvalancheTransactionReceipt(receipt: any): void {
  const requiredFields = [
    "transactionHash",
    "transactionIndex",
    "blockHash",
    "blockNumber",
    "from",
    "cumulativeGasUsed",
    "gasUsed",
    "logs",
    "logsBloom",
    "type",
  ];
  for (const field of requiredFields) {
    assert.ok(
      field in receipt,
      `AvalancheTransactionReceipt should have required field '${field}'`,
    );
  }

  assert.ok(isHexString(receipt.transactionHash), "transactionHash should be hex");
  assert.ok(isHexString(receipt.blockHash), "blockHash should be hex");
  assert.ok(isHexString(receipt.blockNumber), "blockNumber should be hex");
  assert.ok(isAddress(receipt.from), "from should be address");
  assert.ok(receipt.to === null || typeof receipt.to === "string", "to should be string|null");
  assert.ok(Array.isArray(receipt.logs), "logs should be array");
  for (const log of receipt.logs) {
    validateAvalancheLog(log);
  }
}

function validateAvalancheLog(log: any): void {
  const requiredFields = [
    "logIndex",
    "transactionIndex",
    "transactionHash",
    "blockHash",
    "blockNumber",
    "address",
    "data",
    "topics",
  ];
  for (const field of requiredFields) {
    assert.ok(field in log, `AvalancheLog should have required field '${field}'`);
  }

  assert.ok(isHexString(log.transactionHash), "transactionHash should be hex");
  assert.ok(isHexString(log.blockHash), "blockHash should be hex");
  assert.ok(isHexString(log.blockNumber), "blockNumber should be hex");
  assert.ok(isAddress(log.address), "address should be valid address");
  assert.ok(Array.isArray(log.topics), "topics should be array");
  for (const topic of log.topics) {
    assert.ok(isHexString(topic), "topic should be hex");
  }
}

function validateAvalancheFeeHistory(fh: any): void {
  const requiredFields = ["oldestBlock", "baseFeePerGas", "gasUsedRatio"];
  for (const field of requiredFields) {
    assert.ok(field in fh, `FeeHistory should have required field '${field}'`);
  }

  assert.ok(isHexString(fh.oldestBlock), "oldestBlock should be hex");
  assert.ok(Array.isArray(fh.baseFeePerGas), "baseFeePerGas should be array");
  assert.ok(Array.isArray(fh.gasUsedRatio), "gasUsedRatio should be array");

  if ("reward" in fh && fh.reward !== undefined) {
    assert.ok(Array.isArray(fh.reward), "reward should be array");
  }
}

function validateAvalancheTxPoolStatus(status: any): void {
  assert.ok("pending" in status, "TxPoolStatus should have pending");
  assert.ok("queued" in status, "TxPoolStatus should have queued");
  assert.strictEqual(typeof status.pending, "string", "pending should be string");
  assert.strictEqual(typeof status.queued, "string", "queued should be string");
}

// ===== Tests =====

describe("AvalancheClient - Constructor", () => {
  it("should create client with fallback strategy", () => {
    const client = new AvalancheClient(config);
    assert.ok(client, "Client should be created");
    assert.strictEqual(client.getStrategyName(), "fallback", "Should use fallback strategy");
  });

  it("should create client with parallel strategy", () => {
    const parallelConfig: StrategyConfig = { type: "parallel", rpcUrls: TEST_URLS };
    const client = new AvalancheClient(parallelConfig);
    assert.ok(client, "Client should be created");
    assert.strictEqual(client.getStrategyName(), "parallel", "Should use parallel strategy");
  });

  it("should create client with race strategy", () => {
    const raceConfig: StrategyConfig = { type: "race", rpcUrls: TEST_URLS };
    const client = new AvalancheClient(raceConfig);
    assert.ok(client, "Client should be created");
    assert.strictEqual(client.getStrategyName(), "race", "Should use race strategy");
  });
});

describe("AvalancheClient - Web3 Methods", () => {
  it("should get client version (web3_clientVersion)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.clientVersion();

    validateSuccessResult(result, "string");
    assert.ok((result.data as string).length > 0, "Client version should not be empty");
  });

  it("should compute sha3 hash (web3_sha3)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.sha3("0x68656c6c6f");

    validateSuccessResult(result, "string");
    assert.ok(isHexString(result.data as string), "SHA3 result should be hex string");
  });
});

describe("AvalancheClient - Net Methods", () => {
  it("should get network version (net_version)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.version();

    validateSuccessResult(result, "string");
  });

  it("should get listening status (net_listening)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.listening();

    validateSuccessResult(result, "boolean");
  });

  it("should attempt peer count (net_peerCount)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.peerCount();

    assert.ok(result, "Should return a result");
    if (result.success) {
      assert.ok(isHexString(result.data as string), "Peer count should be hex string");
    }
  });
});

describe("AvalancheClient - Eth Chain Info", () => {
  it("should get chain ID 0xa86a (eth_chainId)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.chainId();

    validateSuccessResult(result, "string");
    assert.ok(isHexString(result.data as string), "Chain ID should be hex string");
    assert.strictEqual(result.data, "0xa86a", "Avalanche C-Chain ID should be 0xa86a (43114)");
  });

  it("should get block number (eth_blockNumber)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.blockNumber();

    validateSuccessResult(result, "string");
    assert.ok(isHexString(result.data as string), "Block number should be hex string");
  });

  it("should attempt syncing status (eth_syncing)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.syncing();

    assert.ok(result, "Should return a result");
    if (result.success) {
      if (result.data === false) {
        assert.strictEqual(result.data, false, "Not syncing should return false");
      } else {
        const status = result.data as any;
        assert.strictEqual(typeof status.startingBlock, "string", "startingBlock should be string");
        assert.strictEqual(typeof status.currentBlock, "string", "currentBlock should be string");
        assert.strictEqual(typeof status.highestBlock, "string", "highestBlock should be string");
      }
    }
  });

  it("should attempt accounts (eth_accounts)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.accounts();

    if (result.success) {
      assert.ok(Array.isArray(result.data), "Accounts should be an array");
    }
  });

  it("should get mining status (eth_mining)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.mining();

    if (result.success) {
      assert.strictEqual(typeof result.data, "boolean", "Mining should be boolean");
    }
  });

  it("should get hash rate (eth_hashrate)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.hashRate();

    if (result.success) {
      assert.strictEqual(typeof result.data, "string", "Hash rate should be string");
      assert.ok(isHexString(result.data as string), "Hash rate should be hex");
    }
  });
});

describe("AvalancheClient - Block Methods", () => {
  it("should get block by number without full tx (eth_getBlockByNumber)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.getBlockByNumber("latest", false);

    validateSuccessResult(result);
    validateAvalancheBlock(result.data, false);
  });

  it("should get block by number with full tx (eth_getBlockByNumber fullTx)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.getBlockByNumber("latest", true);

    validateSuccessResult(result);
    validateAvalancheBlock(result.data, true);
  });

  it("should get earliest block (eth_getBlockByNumber earliest)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.getBlockByNumber("earliest", false);

    validateSuccessResult(result);
    validateAvalancheBlock(result.data, false);
  });

  it("should get block by hash (eth_getBlockByHash)", async () => {
    const client = new AvalancheClient(config);
    const latestResult = await client.getBlockByNumber("latest", false);
    assert.ok(latestResult.data?.hash, "Should have block hash");

    const result = await client.getBlockByHash(latestResult.data.hash, false);

    validateSuccessResult(result);
    validateAvalancheBlock(result.data, false);
    assert.strictEqual((result.data as any).hash, latestResult.data.hash, "Hash should match");
  });

  it("should get block transaction count by number (eth_getBlockTransactionCountByNumber)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.getBlockTransactionCountByNumber("latest");

    validateSuccessResult(result, "string");
    assert.ok(isHexString(result.data as string), "Transaction count should be hex");
  });

  it("should get block transaction count by hash (eth_getBlockTransactionCountByHash)", async () => {
    const client = new AvalancheClient(config);
    const latestResult = await client.getBlockByNumber("latest", false);
    assert.ok(latestResult.data?.hash, "Should have block hash");

    const result = await client.getBlockTransactionCountByHash(latestResult.data.hash);

    validateSuccessResult(result, "string");
    assert.ok(isHexString(result.data as string), "Transaction count should be hex");
  });

  it("should get uncle count by block number (eth_getUncleCountByBlockNumber)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.getUncleCountByBlockNumber("latest");

    validateSuccessResult(result, "string");
    assert.ok(isHexString(result.data as string), "Uncle count should be hex");
  });

  it("should get uncle count by block hash (eth_getUncleCountByBlockHash)", async () => {
    const client = new AvalancheClient(config);
    const latestResult = await client.getBlockByNumber("latest", false);
    assert.ok(latestResult.data?.hash, "Should have block hash");

    const result = await client.getUncleCountByBlockHash(latestResult.data.hash);

    validateSuccessResult(result, "string");
    assert.ok(isHexString(result.data as string), "Uncle count should be hex");
  });

  it("should get uncle by block number and index (eth_getUncleByBlockNumberAndIndex)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.getUncleByBlockNumberAndIndex("latest", "0x0");

    // Uncles are rare on Avalanche, so null is expected
    assert.ok(result.success, "Should succeed");
    if (result.data !== null) {
      validateAvalancheBlock(result.data, false);
    }
  });

  it("should get block receipts (eth_getBlockReceipts)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.getBlockReceipts("latest");

    if (result.success && result.data !== null) {
      assert.ok(Array.isArray(result.data), "Should return array of receipts");
      for (const receipt of result.data) {
        validateAvalancheTransactionReceipt(receipt);
      }
    }
  });
});

describe("AvalancheClient - Account Methods", () => {
  it("should get balance (eth_getBalance)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.getBalance(ZERO_ADDRESS, "latest");

    validateSuccessResult(result, "string");
    assert.ok(isHexString(result.data as string), "Balance should be hex string");
  });

  it("should get code (eth_getCode)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.getCode(ZERO_ADDRESS, "latest");

    validateSuccessResult(result, "string");
    assert.ok(isHexString(result.data as string), "Code should be hex string");
  });

  it("should get storage at (eth_getStorageAt)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.getStorageAt(ZERO_ADDRESS, "0x0", "latest");

    validateSuccessResult(result, "string");
    assert.ok(isHexString(result.data as string), "Storage should be hex string");
  });

  it("should get transaction count (eth_getTransactionCount)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.getTransactionCount(ZERO_ADDRESS, "latest");

    validateSuccessResult(result, "string");
    assert.ok(isHexString(result.data as string), "Transaction count should be hex string");
  });
});

describe("AvalancheClient - Transaction Methods", () => {
  it("should get transaction by hash (eth_getTransactionByHash)", async () => {
    const client = new AvalancheClient(config);
    const blockResult = await client.getBlockByNumber("latest", false);
    assert.ok(blockResult.data, "Should have block");

    if (blockResult.data.transactions.length > 0) {
      const txHash = blockResult.data.transactions[0] as string;
      const result = await client.getTransactionByHash(txHash);

      validateSuccessResult(result);
      if (result.data !== null) {
        validateAvalancheTransaction(result.data);
      }
    }
  });

  it("should get transaction by block hash and index (eth_getTransactionByBlockHashAndIndex)", async () => {
    const client = new AvalancheClient(config);
    const blockResult = await client.getBlockByNumber("latest", false);
    assert.ok(blockResult.data, "Should have block");

    if (blockResult.data.transactions.length > 0) {
      const result = await client.getTransactionByBlockHashAndIndex(blockResult.data.hash, "0x0");

      validateSuccessResult(result);
      if (result.data !== null) {
        validateAvalancheTransaction(result.data);
      }
    }
  });

  it("should get transaction by block number and index (eth_getTransactionByBlockNumberAndIndex)", async () => {
    const client = new AvalancheClient(config);
    const blockResult = await client.getBlockByNumber("latest", false);
    assert.ok(blockResult.data, "Should have block");

    if (blockResult.data.transactions.length > 0) {
      const result = await client.getTransactionByBlockNumberAndIndex(
        blockResult.data.number,
        "0x0",
      );

      validateSuccessResult(result);
      if (result.data !== null) {
        validateAvalancheTransaction(result.data);
      }
    }
  });

  it("should get transaction receipt (eth_getTransactionReceipt)", async () => {
    const client = new AvalancheClient(config);
    const blockResult = await client.getBlockByNumber("latest", false);
    assert.ok(blockResult.data, "Should have block");

    if (blockResult.data.transactions.length > 0) {
      const txHash = blockResult.data.transactions[0] as string;
      const result = await client.getTransactionReceipt(txHash);

      validateSuccessResult(result);
      if (result.data !== null) {
        validateAvalancheTransactionReceipt(result.data);
      }
    }
  });

  it("should reject invalid sendRawTransaction (eth_sendRawTransaction)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.sendRawTransaction("0xdeadbeef");

    validateFailureResult(result);
  });
});

describe("AvalancheClient - Call and Estimate", () => {
  it("should execute eth_call", async () => {
    const client = new AvalancheClient(config);
    const result = await client.call({ to: ZERO_ADDRESS, data: "0x" }, "latest");

    if (result.success) {
      assert.strictEqual(typeof result.data, "string", "Call result should be string");
      assert.ok(isHexString(result.data as string), "Call result should be hex");
    }
  });

  it("should estimate gas (eth_estimateGas)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.estimateGas({
      from: ZERO_ADDRESS,
      to: ZERO_ADDRESS,
      value: "0x0",
    });

    if (result.success) {
      assert.strictEqual(typeof result.data, "string", "Gas estimate should be string");
      assert.ok(isHexString(result.data as string), "Gas estimate should be hex");
    }
  });

  it("should create access list (eth_createAccessList)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.createAccessList(
      { from: ZERO_ADDRESS, to: ZERO_ADDRESS, data: "0x" },
      "latest",
    );

    if (result.success) {
      const data = result.data as any;
      assert.ok(Array.isArray(data.accessList), "accessList should be array");
      assert.strictEqual(typeof data.gasUsed, "string", "gasUsed should be string");
      for (const entry of data.accessList) {
        validateAvalancheAccessListEntry(entry);
      }
    }
  });

  it("should get gas price (eth_gasPrice)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.gasPrice();

    validateSuccessResult(result, "string");
    assert.ok(isHexString(result.data as string), "Gas price should be hex string");
  });

  it("should get max priority fee per gas (eth_maxPriorityFeePerGas)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.maxPriorityFeePerGas();

    validateSuccessResult(result, "string");
    assert.ok(isHexString(result.data as string), "Max priority fee should be hex string");
  });

  it("should get fee history (eth_feeHistory)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.feeHistory("0x4", "latest", [25, 50, 75]);

    validateSuccessResult(result);
    validateAvalancheFeeHistory(result.data);
  });

  it("should get base fee (Avalanche extension eth_baseFee)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.baseFee();

    validateSuccessResult(result, "string");
    assert.ok(isHexString(result.data as string), "Base fee should be hex string");
  });
});

describe("AvalancheClient - Logs and Filters", () => {
  it("should get logs (eth_getLogs)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.getLogs({ fromBlock: "latest", toBlock: "latest" });

    validateSuccessResult(result);
    assert.ok(Array.isArray(result.data), "Should return array of logs");
    for (const log of result.data as any[]) {
      validateAvalancheLog(log);
    }
  });

  it("should create new filter (eth_newFilter)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.newFilter({ fromBlock: "latest" });

    if (result.success) {
      assert.strictEqual(typeof result.data, "string", "Filter ID should be string");
      assert.ok(isHexString(result.data as string), "Filter ID should be hex string");
    }
  });

  it("should create new block filter (eth_newBlockFilter)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.newBlockFilter();

    if (result.success) {
      assert.strictEqual(typeof result.data, "string", "Filter ID should be string");
      assert.ok(isHexString(result.data as string), "Filter ID should be hex string");
    }
  });

  it("should create new pending transaction filter (eth_newPendingTransactionFilter)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.newPendingTransactionFilter();

    if (result.success) {
      assert.strictEqual(typeof result.data, "string", "Filter ID should be string");
    }
  });

  it("should get filter changes (eth_getFilterChanges)", async () => {
    const client = new AvalancheClient(config);
    const filterResult = await client.newBlockFilter();

    if (filterResult.success) {
      const result = await client.getFilterChanges(filterResult.data as string);

      if (result.success) {
        assert.ok(Array.isArray(result.data), "Filter changes should be array");
      }
    }
  });

  it("should get filter logs (eth_getFilterLogs)", async () => {
    const client = new AvalancheClient(config);
    const filterResult = await client.newFilter({ fromBlock: "latest", toBlock: "latest" });

    if (filterResult.success) {
      const result = await client.getFilterLogs(filterResult.data as string);

      if (result.success) {
        assert.ok(Array.isArray(result.data), "Filter logs should be array");
        for (const log of result.data as any[]) {
          validateAvalancheLog(log);
        }
      }
    }
  });

  it("should uninstall filter (eth_uninstallFilter)", async () => {
    const client = new AvalancheClient(config);
    const filterResult = await client.newBlockFilter();

    if (filterResult.success) {
      const result = await client.uninstallFilter(filterResult.data as string);

      if (result.success) {
        assert.strictEqual(typeof result.data, "boolean", "Uninstall result should be boolean");
      }
    }
  });
});

describe("AvalancheClient - TxPool Methods", () => {
  it("should get txpool status (txpool_status)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.txPoolStatus();

    if (result.success) {
      validateAvalancheTxPoolStatus(result.data);
    }
  });

  it("should get txpool content (txpool_content)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.txPoolContent();

    if (result.success) {
      assert.strictEqual(typeof result.data, "object", "Content should be object");
    }
  });

  it("should get txpool content from address (txpool_contentFrom)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.txPoolContentFrom(ZERO_ADDRESS);

    if (result.success) {
      assert.strictEqual(typeof result.data, "object", "ContentFrom should be object");
    }
  });

  it("should get txpool inspect (txpool_inspect)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.txPoolInspect();

    if (result.success) {
      assert.strictEqual(typeof result.data, "object", "Inspect should be object");
    }
  });
});

describe("AvalancheClient - Debug Methods", () => {
  it("should attempt debug_traceTransaction", async () => {
    const client = new AvalancheClient(config);
    const blockResult = await client.getBlockByNumber("latest", false);

    if (blockResult.data && blockResult.data.transactions.length > 0) {
      const txHash = blockResult.data.transactions[0] as string;
      const result = await client.debugTraceTransaction(txHash);
      assert.ok(result, "Should return a result");
    }
  });

  it("should attempt debug_traceCall", async () => {
    const client = new AvalancheClient(config);
    const result = await client.debugTraceCall({ to: ZERO_ADDRESS, data: "0x" }, {}, "latest");
    assert.ok(result, "Should return a result");
  });

  it("should attempt debug_traceBlockByNumber", async () => {
    const client = new AvalancheClient(config);
    const result = await client.debugTraceBlockByNumber("latest");
    assert.ok(result, "Should return a result");
  });

  it("should attempt debug_traceBlockByHash", async () => {
    const client = new AvalancheClient(config);
    const blockResult = await client.getBlockByNumber("latest", false);
    assert.ok(blockResult.data?.hash, "Should have block hash");

    const result = await client.debugTraceBlockByHash(blockResult.data.hash);
    assert.ok(result, "Should return a result");
  });

  it("should attempt debug_traceBlock", async () => {
    const client = new AvalancheClient(config);
    const result = await client.debugTraceBlock("0x");
    assert.ok(result, "Should return a result");
  });

  it("should attempt debug_traceBadBlock", async () => {
    const client = new AvalancheClient(config);
    const result = await client.debugTraceBadBlock(
      "0x0000000000000000000000000000000000000000000000000000000000000000",
    );
    assert.ok(result, "Should return a result");
  });

  it("should attempt debug_getBadBlocks", async () => {
    const client = new AvalancheClient(config);
    const result = await client.debugGetBadBlocks();

    if (result.success) {
      assert.ok(Array.isArray(result.data), "Bad blocks should be array");
    }
  });

  it("should attempt debug_getModifiedAccountsByHash", async () => {
    const client = new AvalancheClient(config);
    const blockResult = await client.getBlockByNumber("latest", false);
    assert.ok(blockResult.data?.hash, "Should have block hash");

    const result = await client.debugGetModifiedAccountsByHash(blockResult.data.hash);
    assert.ok(result, "Should return a result");
  });

  it("should attempt debug_getModifiedAccountsByNumber", async () => {
    const client = new AvalancheClient(config);
    const result = await client.debugGetModifiedAccountsByNumber("0x1");
    assert.ok(result, "Should return a result");
  });

  it("should attempt debug_storageRangeAt", async () => {
    const client = new AvalancheClient(config);
    const blockResult = await client.getBlockByNumber("latest", false);
    assert.ok(blockResult.data?.hash, "Should have block hash");

    const result = await client.debugStorageRangeAt(
      blockResult.data.hash,
      0,
      ZERO_ADDRESS,
      "0x0",
      10,
    );
    assert.ok(result, "Should return a result");
  });

  it("should attempt debug_accountRange", async () => {
    const client = new AvalancheClient(config);
    const result = await client.debugAccountRange("latest", "0x0", 10);
    assert.ok(result, "Should return a result");
  });

  it("should attempt debug_intermediateRoots", async () => {
    const client = new AvalancheClient(config);
    const blockResult = await client.getBlockByNumber("latest", false);
    assert.ok(blockResult.data?.hash, "Should have block hash");

    const result = await client.debugIntermediateRoots(blockResult.data.hash);
    assert.ok(result, "Should return a result");
  });

  it("should attempt debug_dumpBlock", async () => {
    const client = new AvalancheClient(config);
    const result = await client.debugDumpBlock("0x1");
    assert.ok(result, "Should return a result");
  });

  it("should attempt debug_memStats", async () => {
    const client = new AvalancheClient(config);
    const result = await client.debugMemStats();

    if (result.success) {
      assert.strictEqual(typeof result.data, "object", "MemStats should be object");
    }
  });

  it("should attempt debug_gcStats", async () => {
    const client = new AvalancheClient(config);
    const result = await client.debugGcStats();

    if (result.success) {
      assert.strictEqual(typeof result.data, "object", "GcStats should be object");
    }
  });

  it("should attempt debug_metrics", async () => {
    const client = new AvalancheClient(config);
    const result = await client.debugMetrics();

    if (result.success) {
      assert.strictEqual(typeof result.data, "object", "Metrics should be object");
    }
  });
});

describe("AvalancheClient - Admin Methods", () => {
  it("should attempt admin_nodeInfo", async () => {
    const client = new AvalancheClient(config);
    const result = await client.adminNodeInfo();

    if (result.success) {
      assert.strictEqual(typeof result.data, "object", "NodeInfo should be object");
    }
  });

  it("should attempt admin_peers", async () => {
    const client = new AvalancheClient(config);
    const result = await client.adminPeers();

    if (result.success) {
      assert.ok(Array.isArray(result.data), "Peers should be array");
    }
  });

  it("should attempt admin_addPeer", async () => {
    const client = new AvalancheClient(config);
    const result = await client.adminAddPeer("enode://test@127.0.0.1:30303");

    if (result.success) {
      assert.strictEqual(typeof result.data, "boolean", "addPeer should return boolean");
    }
  });

  it("should attempt admin_removePeer", async () => {
    const client = new AvalancheClient(config);
    const result = await client.adminRemovePeer("enode://test@127.0.0.1:30303");

    if (result.success) {
      assert.strictEqual(typeof result.data, "boolean", "removePeer should return boolean");
    }
  });

  it("should attempt admin_getVMConfig (Avalanche-specific)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.adminGetVMConfig();

    if (result.success) {
      assert.strictEqual(typeof result.data, "object", "VMConfig should be object");
    }
  });
});

describe("AvalancheClient - Avalanche-Specific Methods (avax.*)", () => {
  it("should attempt avax.getAtomicTxStatus", async () => {
    const client = new AvalancheClient(config);
    const result = await client.avaxGetAtomicTxStatus(
      "2QouvFWUbjuySRxeX5xMbNCuAaKWfbk5FeEa2JmoF85RKLnC8i",
    );

    if (result.success) {
      const status = result.data as any;
      assert.ok("status" in status, "Should have status field");
      assert.strictEqual(typeof status.status, "string", "status should be string");
    }
  });

  it("should attempt avax.getAtomicTx", async () => {
    const client = new AvalancheClient(config);
    const result = await client.avaxGetAtomicTx(
      "2QouvFWUbjuySRxeX5xMbNCuAaKWfbk5FeEa2JmoF85RKLnC8i",
    );

    if (result.success) {
      const data = result.data as any;
      assert.strictEqual(typeof data.tx, "string", "tx should be string");
      assert.strictEqual(typeof data.encoding, "string", "encoding should be string");
    }
  });

  it("should attempt avax.getUTXOs", async () => {
    const client = new AvalancheClient(config);
    const result = await client.avaxGetUTXOs([ZERO_ADDRESS], "X", 10);

    if (result.success) {
      const data = result.data as any;
      assert.ok(Array.isArray(data.utxos), "utxos should be array");
      assert.strictEqual(typeof data.numFetched, "string", "numFetched should be string");
    }
  });

  it("should attempt avax.issueTx", async () => {
    const client = new AvalancheClient(config);
    const result = await client.avaxIssueTx("0xdeadbeef");

    // Will fail with invalid tx, but verifies the call path
    if (result.success) {
      assert.strictEqual(typeof (result.data as any).txID, "string", "txID should be string");
    }
  });

  it("should attempt avax.import", async () => {
    const client = new AvalancheClient(config);
    const result = await client.avaxImport({
      to: ZERO_ADDRESS,
      sourceChain: "X",
      username: "test",
      password: "test",
    });

    // Will fail on public nodes, just verifies the call path
    assert.ok(result, "Should return a result");
  });

  it("should attempt avax.export", async () => {
    const client = new AvalancheClient(config);
    const result = await client.avaxExport({
      amount: 1,
      assetID: "AVAX",
      to: "X-test",
      username: "test",
      password: "test",
    });

    // Will fail on public nodes, just verifies the call path
    assert.ok(result, "Should return a result");
  });
});

describe("AvalancheClient - Sign Methods", () => {
  it("should attempt eth_sign", async () => {
    const client = new AvalancheClient(config);
    const result = await client.sign(ZERO_ADDRESS, "0x68656c6c6f");

    // Not supported on public nodes
    if (result.success) {
      assert.strictEqual(typeof result.data, "string", "Signature should be string");
      assert.ok(isHexString(result.data as string), "Signature should be hex");
    }
  });

  it("should attempt eth_signTransaction", async () => {
    const client = new AvalancheClient(config);
    const result = await client.signTransaction({
      from: ZERO_ADDRESS,
      to: ZERO_ADDRESS,
      value: "0x0",
    });

    if (result.success) {
      assert.strictEqual(typeof result.data, "string", "Signed tx should be string");
    }
  });

  it("should attempt eth_sendTransaction", async () => {
    const client = new AvalancheClient(config);
    const result = await client.sendTransaction({
      from: ZERO_ADDRESS,
      to: ZERO_ADDRESS,
      value: "0x0",
    });

    // Will fail on public nodes
    if (result.success) {
      assert.strictEqual(typeof result.data, "string", "Tx hash should be string");
      assert.ok(isHexString(result.data as string), "Tx hash should be hex");
    }
  });
});

describe("AvalancheClient - Parallel Strategy", () => {
  const parallelConfig: StrategyConfig = {
    type: "parallel",
    rpcUrls: TEST_URLS,
  };

  it("should get chain ID with metadata", async () => {
    const client = new AvalancheClient(parallelConfig);
    const result = await client.chainId();

    validateSuccessResult(result);
    assert.ok(result.metadata, "Should have metadata");
    assert.strictEqual(result.metadata.strategy, "parallel", "Should be parallel strategy");
    assert.ok(typeof result.metadata.timestamp === "number", "Should have timestamp");
    assert.ok(Array.isArray(result.metadata.responses), "Should have responses array");
    assert.ok(result.metadata.responses.length >= 1, "Should have at least one response");
    assert.strictEqual(
      typeof result.metadata.hasInconsistencies,
      "boolean",
      "Should have hasInconsistencies flag",
    );
  });

  it("should get block with full type validation via parallel", async () => {
    const client = new AvalancheClient(parallelConfig);
    const result = await client.getBlockByNumber("latest", false);

    validateSuccessResult(result);
    validateAvalancheBlock(result.data, false);
    assert.ok(result.metadata, "Should have metadata");
    assert.strictEqual(result.metadata.strategy, "parallel", "Should be parallel strategy");
  });
});

describe("AvalancheClient - Race Strategy", () => {
  const raceConfig: StrategyConfig = {
    type: "race",
    rpcUrls: TEST_URLS,
  };

  it("should get block number with race strategy metadata", async () => {
    const client = new AvalancheClient(raceConfig);
    const result = await client.blockNumber();

    validateSuccessResult(result, "string");
    assert.ok(isHexString(result.data as string), "Block number should be hex");
    assert.ok(result.metadata, "Should have metadata");
    assert.strictEqual(result.metadata.strategy, "race", "Should be race strategy");
    assert.ok(typeof result.metadata.timestamp === "number", "Should have timestamp");
    assert.ok(Array.isArray(result.metadata.responses), "Should have responses array");
    assert.strictEqual(
      result.metadata.hasInconsistencies,
      false,
      "Race strategy should not detect inconsistencies",
    );
  });
});
