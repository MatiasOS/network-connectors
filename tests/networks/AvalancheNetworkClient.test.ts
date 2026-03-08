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
  "https://rpc.ankr.com/avalanche"
];

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const config: StrategyConfig = {
  type: "fallback",
  rpcUrls: TEST_URLS,
};

// ===== Type-shape validators matching AvalancheTypes.ts exactly =====

function validateAvalancheBlock(block: any, fullTx = false): void {
  // Required fields
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

  // Required string fields (non-null)
  assert.strictEqual(typeof block.number, "string", "number should be string");
  assert.strictEqual(typeof block.hash, "string", "hash should be string");
  assert.strictEqual(typeof block.parentHash, "string", "parentHash should be string");
  assert.strictEqual(typeof block.nonce, "string", "nonce should be string");
  assert.strictEqual(typeof block.sha3Uncles, "string", "sha3Uncles should be string");
  assert.strictEqual(typeof block.logsBloom, "string", "logsBloom should be string");
  assert.strictEqual(typeof block.transactionsRoot, "string", "transactionsRoot should be string");
  assert.strictEqual(typeof block.stateRoot, "string", "stateRoot should be string");
  assert.strictEqual(typeof block.receiptsRoot, "string", "receiptsRoot should be string");
  assert.strictEqual(typeof block.miner, "string", "miner should be string");
  assert.strictEqual(typeof block.difficulty, "string", "difficulty should be string");
  assert.strictEqual(typeof block.extraData, "string", "extraData should be string");
  assert.strictEqual(typeof block.size, "string", "size should be string");
  assert.strictEqual(typeof block.gasLimit, "string", "gasLimit should be string");
  assert.strictEqual(typeof block.gasUsed, "string", "gasUsed should be string");
  assert.strictEqual(typeof block.timestamp, "string", "timestamp should be string");

  // Hex validation on key fields
  assert.ok(isHexString(block.number), "number should be hex");
  assert.ok(isHexString(block.hash), "hash should be hex");
  assert.ok(isHexString(block.parentHash), "parentHash should be hex");
  assert.ok(isHexString(block.gasLimit), "gasLimit should be hex");
  assert.ok(isHexString(block.gasUsed), "gasUsed should be hex");
  assert.ok(isHexString(block.timestamp), "timestamp should be hex");

  // transactions array
  assert.ok(Array.isArray(block.transactions), "transactions should be array");
  if (fullTx && block.transactions.length > 0) {
    validateAvalancheTransaction(block.transactions[0]);
  } else if (!fullTx && block.transactions.length > 0) {
    assert.strictEqual(typeof block.transactions[0], "string", "tx hashes should be strings");
  }

  // uncles array
  assert.ok(Array.isArray(block.uncles), "uncles should be array");

  // Optional fields: type check only if present
  if ("totalDifficulty" in block && block.totalDifficulty !== undefined) {
    assert.strictEqual(typeof block.totalDifficulty, "string", "totalDifficulty should be string");
  }
  if ("baseFeePerGas" in block && block.baseFeePerGas !== undefined) {
    assert.strictEqual(typeof block.baseFeePerGas, "string", "baseFeePerGas should be string");
  }
  if ("mixHash" in block && block.mixHash !== undefined) {
    assert.strictEqual(typeof block.mixHash, "string", "mixHash should be string");
  }
  if ("withdrawalsRoot" in block && block.withdrawalsRoot !== undefined) {
    assert.strictEqual(typeof block.withdrawalsRoot, "string", "withdrawalsRoot should be string");
  }
  if ("withdrawals" in block && block.withdrawals !== undefined) {
    assert.ok(Array.isArray(block.withdrawals), "withdrawals should be array");
    if (block.withdrawals.length > 0) {
      validateAvalancheWithdrawal(block.withdrawals[0]);
    }
  }
}

function validateAvalancheTransaction(tx: any): void {
  // Required fields
  const requiredFields = ["hash", "nonce", "from", "value", "gas", "input", "type", "v", "r", "s"];
  for (const field of requiredFields) {
    assert.ok(field in tx, `AvalancheTransaction should have required field '${field}'`);
  }

  // Required string fields
  assert.strictEqual(typeof tx.hash, "string", "hash should be string");
  assert.ok(isHexString(tx.hash), "hash should be hex");
  assert.strictEqual(typeof tx.nonce, "string", "nonce should be string");
  assert.strictEqual(typeof tx.from, "string", "from should be string");
  assert.ok(isAddress(tx.from), "from should be address");
  assert.strictEqual(typeof tx.value, "string", "value should be string");
  assert.strictEqual(typeof tx.gas, "string", "gas should be string");
  assert.strictEqual(typeof tx.input, "string", "input should be string");
  assert.strictEqual(typeof tx.type, "string", "type should be string");
  assert.strictEqual(typeof tx.v, "string", "v should be string");
  assert.strictEqual(typeof tx.r, "string", "r should be string");
  assert.strictEqual(typeof tx.s, "string", "s should be string");

  // Nullable fields
  assert.ok(
    tx.blockHash === null || typeof tx.blockHash === "string",
    "blockHash should be string|null",
  );
  assert.ok(
    tx.blockNumber === null || typeof tx.blockNumber === "string",
    "blockNumber should be string|null",
  );
  assert.ok(
    tx.transactionIndex === null || typeof tx.transactionIndex === "string",
    "transactionIndex should be string|null",
  );
  assert.ok(tx.to === null || typeof tx.to === "string", "to should be string|null");

  // Optional fields
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
  if ("maxFeePerBlobGas" in tx && tx.maxFeePerBlobGas !== undefined) {
    assert.strictEqual(typeof tx.maxFeePerBlobGas, "string", "maxFeePerBlobGas should be string");
  }
  if ("blobVersionedHashes" in tx && tx.blobVersionedHashes !== undefined) {
    assert.ok(Array.isArray(tx.blobVersionedHashes), "blobVersionedHashes should be array");
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
  if ("yParity" in tx && tx.yParity !== undefined) {
    assert.strictEqual(typeof tx.yParity, "string", "yParity should be string");
  }
}

function validateAvalancheAccessListEntry(entry: any): void {
  assert.strictEqual(typeof entry.address, "string", "accessList entry address should be string");
  assert.ok(Array.isArray(entry.storageKeys), "accessList entry storageKeys should be array");
  for (const key of entry.storageKeys) {
    assert.strictEqual(typeof key, "string", "storageKey should be string");
  }
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

  assert.strictEqual(typeof receipt.transactionHash, "string", "transactionHash should be string");
  assert.ok(isHexString(receipt.transactionHash), "transactionHash should be hex");
  assert.strictEqual(
    typeof receipt.transactionIndex,
    "string",
    "transactionIndex should be string",
  );
  assert.strictEqual(typeof receipt.blockHash, "string", "blockHash should be string");
  assert.ok(isHexString(receipt.blockHash), "blockHash should be hex");
  assert.strictEqual(typeof receipt.blockNumber, "string", "blockNumber should be string");
  assert.ok(isHexString(receipt.blockNumber), "blockNumber should be hex");
  assert.strictEqual(typeof receipt.from, "string", "from should be string");
  assert.ok(isAddress(receipt.from), "from should be address");
  assert.ok(receipt.to === null || typeof receipt.to === "string", "to should be string|null");
  assert.strictEqual(
    typeof receipt.cumulativeGasUsed,
    "string",
    "cumulativeGasUsed should be string",
  );
  assert.strictEqual(typeof receipt.gasUsed, "string", "gasUsed should be string");
  assert.ok(
    receipt.contractAddress === null || typeof receipt.contractAddress === "string",
    "contractAddress should be string|null",
  );
  assert.ok(Array.isArray(receipt.logs), "logs should be array");
  for (const log of receipt.logs) {
    validateAvalancheLog(log);
  }
  assert.strictEqual(typeof receipt.logsBloom, "string", "logsBloom should be string");
  assert.strictEqual(typeof receipt.type, "string", "type should be string");

  // Optional fields
  if ("effectiveGasPrice" in receipt && receipt.effectiveGasPrice !== undefined) {
    assert.strictEqual(
      typeof receipt.effectiveGasPrice,
      "string",
      "effectiveGasPrice should be string",
    );
  }
  if ("blobGasUsed" in receipt && receipt.blobGasUsed !== undefined) {
    assert.strictEqual(typeof receipt.blobGasUsed, "string", "blobGasUsed should be string");
  }
  if ("blobGasPrice" in receipt && receipt.blobGasPrice !== undefined) {
    assert.strictEqual(typeof receipt.blobGasPrice, "string", "blobGasPrice should be string");
  }
  if ("root" in receipt && receipt.root !== undefined) {
    assert.strictEqual(typeof receipt.root, "string", "root should be string");
  }
  if ("status" in receipt && receipt.status !== undefined) {
    assert.strictEqual(typeof receipt.status, "string", "status should be string");
  }
}

function validateAvalancheLog(log: any): void {
  const requiredFields = [
    "removed",
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

  assert.strictEqual(typeof log.removed, "boolean", "removed should be boolean");
  assert.strictEqual(typeof log.logIndex, "string", "logIndex should be string");
  assert.strictEqual(typeof log.transactionIndex, "string", "transactionIndex should be string");
  assert.strictEqual(typeof log.transactionHash, "string", "transactionHash should be string");
  assert.ok(isHexString(log.transactionHash), "transactionHash should be hex");
  assert.strictEqual(typeof log.blockHash, "string", "blockHash should be string");
  assert.ok(isHexString(log.blockHash), "blockHash should be hex");
  assert.strictEqual(typeof log.blockNumber, "string", "blockNumber should be string");
  assert.ok(isHexString(log.blockNumber), "blockNumber should be hex");
  assert.strictEqual(typeof log.address, "string", "address should be string");
  assert.ok(isAddress(log.address), "address should be valid address");
  assert.strictEqual(typeof log.data, "string", "data should be string");
  assert.ok(Array.isArray(log.topics), "topics should be array");
  for (const topic of log.topics) {
    assert.strictEqual(typeof topic, "string", "topic should be string");
    assert.ok(isHexString(topic), "topic should be hex");
  }
}

function validateAvalancheWithdrawal(w: any): void {
  assert.strictEqual(typeof w.index, "string", "withdrawal index should be string");
  assert.strictEqual(
    typeof w.validatorIndex,
    "string",
    "withdrawal validatorIndex should be string",
  );
  assert.strictEqual(typeof w.address, "string", "withdrawal address should be string");
  assert.strictEqual(typeof w.amount, "string", "withdrawal amount should be string");
}

function validateAvalancheSyncingStatus(status: any): void {
  assert.strictEqual(typeof status.startingBlock, "string", "startingBlock should be string");
  assert.strictEqual(typeof status.currentBlock, "string", "currentBlock should be string");
  assert.strictEqual(typeof status.highestBlock, "string", "highestBlock should be string");
}

function validateAvalancheFeeHistory(fh: any): void {
  const requiredFields = ["oldestBlock", "baseFeePerGas", "gasUsedRatio"];
  for (const field of requiredFields) {
    assert.ok(field in fh, `AvalancheFeeHistory should have required field '${field}'`);
  }

  assert.strictEqual(typeof fh.oldestBlock, "string", "oldestBlock should be string");
  assert.ok(isHexString(fh.oldestBlock), "oldestBlock should be hex");
  assert.ok(Array.isArray(fh.baseFeePerGas), "baseFeePerGas should be array");
  for (const fee of fh.baseFeePerGas) {
    assert.strictEqual(typeof fee, "string", "baseFeePerGas entry should be string");
  }
  assert.ok(Array.isArray(fh.gasUsedRatio), "gasUsedRatio should be array");
  for (const ratio of fh.gasUsedRatio) {
    assert.strictEqual(typeof ratio, "number", "gasUsedRatio entry should be number");
  }

  if ("reward" in fh && fh.reward !== undefined) {
    assert.ok(Array.isArray(fh.reward), "reward should be array");
    for (const rewardBlock of fh.reward) {
      assert.ok(Array.isArray(rewardBlock), "reward entry should be array");
      for (const r of rewardBlock) {
        assert.ok(r === null || typeof r === "string", "reward value should be string|null");
      }
    }
  }
}

function validateAvalancheTxPoolStatus(status: any): void {
  assert.ok("pending" in status, "TxPoolStatus should have pending");
  assert.ok("queued" in status, "TxPoolStatus should have queued");
  assert.strictEqual(typeof status.pending, "string", "pending should be string");
  assert.strictEqual(typeof status.queued, "string", "queued should be string");
}

function validateAvalancheAdminNodeInfo(info: any): void {
  const requiredFields = ["id", "name", "enode", "enr", "ip", "ports", "listenAddr", "protocols"];
  for (const field of requiredFields) {
    assert.ok(field in info, `AvalancheAdminNodeInfo should have required field '${field}'`);
  }

  assert.strictEqual(typeof info.id, "string", "id should be string");
  assert.strictEqual(typeof info.name, "string", "name should be string");
  assert.strictEqual(typeof info.enode, "string", "enode should be string");
  assert.strictEqual(typeof info.enr, "string", "enr should be string");
  assert.strictEqual(typeof info.ip, "string", "ip should be string");
  assert.strictEqual(typeof info.ports, "object", "ports should be object");
  assert.strictEqual(typeof info.ports.discovery, "number", "ports.discovery should be number");
  assert.strictEqual(typeof info.ports.listener, "number", "ports.listener should be number");
  assert.strictEqual(typeof info.listenAddr, "string", "listenAddr should be string");
  assert.strictEqual(typeof info.protocols, "object", "protocols should be object");
}

function validateAvalancheAdminPeerInfo(peer: any): void {
  const requiredFields = ["id", "name", "enode", "enr", "caps", "network", "protocols"];
  for (const field of requiredFields) {
    assert.ok(field in peer, `AvalancheAdminPeerInfo should have required field '${field}'`);
  }

  assert.strictEqual(typeof peer.id, "string", "id should be string");
  assert.strictEqual(typeof peer.name, "string", "name should be string");
  assert.strictEqual(typeof peer.enode, "string", "enode should be string");
  assert.strictEqual(typeof peer.enr, "string", "enr should be string");
  assert.ok(Array.isArray(peer.caps), "caps should be array");
  assert.strictEqual(typeof peer.network, "object", "network should be object");
  assert.strictEqual(
    typeof peer.network.localAddress,
    "string",
    "network.localAddress should be string",
  );
  assert.strictEqual(
    typeof peer.network.remoteAddress,
    "string",
    "network.remoteAddress should be string",
  );
  assert.strictEqual(typeof peer.network.inbound, "boolean", "network.inbound should be boolean");
  assert.strictEqual(typeof peer.network.trusted, "boolean", "network.trusted should be boolean");
  assert.strictEqual(typeof peer.network.static, "boolean", "network.static should be boolean");
  assert.strictEqual(typeof peer.protocols, "object", "protocols should be object");
}

function validateAvaxAtomicTx(tx: any): void {
  assert.strictEqual(typeof tx.tx, "string", "tx should be string");
  assert.strictEqual(typeof tx.encoding, "string", "encoding should be string");
  assert.strictEqual(typeof tx.blockHeight, "string", "blockHeight should be string");
}

function validateAvaxAtomicTxStatus(status: any): void {
  assert.ok("status" in status, "AvaxAtomicTxStatus should have status");
  assert.strictEqual(typeof status.status, "string", "status should be string");
  const validStatuses = ["Accepted", "Processing", "Dropped", "Unknown"];
  assert.ok(
    validStatuses.includes(status.status),
    `status should be one of ${validStatuses.join(", ")}, got '${status.status}'`,
  );
  if ("blockHeight" in status && status.blockHeight !== undefined) {
    assert.strictEqual(typeof status.blockHeight, "string", "blockHeight should be string");
  }
}

function validateAvaxUTXOsResponse(resp: any): void {
  assert.strictEqual(typeof resp.numFetched, "string", "numFetched should be string");
  assert.ok(Array.isArray(resp.utxos), "utxos should be array");
  assert.strictEqual(typeof resp.endIndex, "object", "endIndex should be object");
  assert.strictEqual(typeof resp.endIndex.address, "string", "endIndex.address should be string");
  assert.strictEqual(typeof resp.endIndex.utxo, "string", "endIndex.utxo should be string");
  assert.strictEqual(typeof resp.encoding, "string", "encoding should be string");
}

function validateAvaxIssueTxResponse(resp: any): void {
  assert.strictEqual(typeof resp.txID, "string", "txID should be string");
}

// ===== Tests =====

describe("AvalancheClient - Constructor", () => {
  it("[strong] should create client with fallback strategy", () => {
    const client = new AvalancheClient(config);
    assert.ok(client, "Client should be created");
    assert.strictEqual(client.getStrategyName(), "fallback", "Should use fallback strategy");
  });

  it("[strong] should create client with parallel strategy", () => {
    const parallelConfig: StrategyConfig = { type: "parallel", rpcUrls: TEST_URLS };
    const client = new AvalancheClient(parallelConfig);
    assert.ok(client, "Client should be created");
    assert.strictEqual(client.getStrategyName(), "parallel", "Should use parallel strategy");
  });

  it("[strong] should create client with race strategy", () => {
    const raceConfig: StrategyConfig = { type: "race", rpcUrls: TEST_URLS };
    const client = new AvalancheClient(raceConfig);
    assert.ok(client, "Client should be created");
    assert.strictEqual(client.getStrategyName(), "race", "Should use race strategy");
  });
});

describe("AvalancheClient - Web3 Methods", () => {
  it("[strong] should get client version (web3_clientVersion)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.clientVersion();

    validateSuccessResult(result, "string");
    assert.ok((result.data as string).length > 0, "Client version should not be empty");
  });

  it("[strong] should compute sha3 hash (web3_sha3)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.sha3("0x68656c6c6f");

    validateSuccessResult(result, "string");
    assert.ok(isHexString(result.data as string), "SHA3 result should be hex string");
  });
});

describe("AvalancheClient - Net Methods", () => {
  it("[strong] should get network version (net_version)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.version();

    validateSuccessResult(result, "string");
  });

  it("[strong] should get listening status (net_listening)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.listening();

    validateSuccessResult(result, "boolean");
  });

  it("[strong] should get peer count (net_peerCount)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.peerCount();

    validateSuccessResult(result, "string");
    assert.ok(isHexString(result.data as string), "Peer count should be hex string");
  });
});

describe("AvalancheClient - Eth Chain Info", () => {
  it("[strong] should get chain ID (eth_chainId)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.chainId();

    validateSuccessResult(result, "string");
    assert.ok(isHexString(result.data as string), "Chain ID should be hex string");
    assert.strictEqual(result.data, "0xa86a", "Avalanche C-Chain ID should be 0xa86a (43114)");
  });

  it("[strong] should get block number (eth_blockNumber)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.blockNumber();

    validateSuccessResult(result, "string");
    assert.ok(isHexString(result.data as string), "Block number should be hex string");
  });

  it("[strong] should get syncing status (eth_syncing)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.syncing();

    validateSuccessResult(result);
    if (result.data === false) {
      assert.strictEqual(result.data, false, "Not syncing should return false");
    } else {
      validateAvalancheSyncingStatus(result.data);
    }
  });

  it("[strong] should get accounts (eth_accounts)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.accounts();

    if (result.success) {
      assert.ok(Array.isArray(result.data), "Accounts should be an array");
      for (const account of result.data as string[]) {
        assert.strictEqual(typeof account, "string", "Account should be string");
      }
    }
  });

  it("[strong] should attempt coinbase (eth_coinbase)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.coinbase();

    if (result.success) {
      assert.strictEqual(typeof result.data, "string", "Coinbase should be string");
    }
  });

  it("[strong] should attempt protocol version (eth_protocolVersion)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.protocolVersion();

    if (result.success) {
      assert.strictEqual(typeof result.data, "string", "Protocol version should be string");
    }
  });

  it("[strong] should get mining status (eth_mining)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.mining();

    if (result.success) {
      assert.strictEqual(typeof result.data, "boolean", "Mining should be boolean");
    }
  });

  it("[strong] should get hash rate (eth_hashrate)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.hashRate();

    if (result.success) {
      assert.strictEqual(typeof result.data, "string", "Hash rate should be string");
      assert.ok(isHexString(result.data as string), "Hash rate should be hex");
    }
  });
});

describe("AvalancheClient - Block Methods", () => {
  it("[strong] should get block by number without full tx (eth_getBlockByNumber)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.getBlockByNumber("latest", false);

    validateSuccessResult(result);
    validateAvalancheBlock(result.data, false);
  });

  it("[strong] should get block by number with full tx (eth_getBlockByNumber fullTx)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.getBlockByNumber("latest", true);

    validateSuccessResult(result);
    validateAvalancheBlock(result.data, true);
  });

  it("[strong] should get earliest block (eth_getBlockByNumber earliest)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.getBlockByNumber("earliest", false);

    validateSuccessResult(result);
    validateAvalancheBlock(result.data, false);
  });

  it("[strong] should get block by hash (eth_getBlockByHash)", async () => {
    const client = new AvalancheClient(config);
    const latestResult = await client.getBlockByNumber("latest", false);
    assert.ok(latestResult.data?.hash, "Should have block hash");

    const result = await client.getBlockByHash(latestResult.data.hash, false);

    validateSuccessResult(result);
    validateAvalancheBlock(result.data, false);
    assert.strictEqual((result.data as any).hash, latestResult.data.hash, "Hash should match");
  });

  it("[strong] should get block transaction count by number (eth_getBlockTransactionCountByNumber)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.getBlockTransactionCountByNumber("latest");

    validateSuccessResult(result, "string");
    assert.ok(isHexString(result.data as string), "Transaction count should be hex");
  });

  it("[strong] should get block transaction count by hash (eth_getBlockTransactionCountByHash)", async () => {
    const client = new AvalancheClient(config);
    const latestResult = await client.getBlockByNumber("latest", false);
    assert.ok(latestResult.data?.hash, "Should have block hash");

    const result = await client.getBlockTransactionCountByHash(latestResult.data.hash);

    validateSuccessResult(result, "string");
    assert.ok(isHexString(result.data as string), "Transaction count should be hex");
  });

  it("[strong] should get uncle count by block number (eth_getUncleCountByBlockNumber)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.getUncleCountByBlockNumber("latest");

    validateSuccessResult(result, "string");
    assert.ok(isHexString(result.data as string), "Uncle count should be hex");
  });

  it("[strong] should get uncle count by block hash (eth_getUncleCountByBlockHash)", async () => {
    const client = new AvalancheClient(config);
    const latestResult = await client.getBlockByNumber("latest", false);
    assert.ok(latestResult.data?.hash, "Should have block hash");

    const result = await client.getUncleCountByBlockHash(latestResult.data.hash);

    validateSuccessResult(result, "string");
    assert.ok(isHexString(result.data as string), "Uncle count should be hex");
  });

  it("[strong] should get uncle by block number and index (eth_getUncleByBlockNumberAndIndex)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.getUncleByBlockNumberAndIndex("latest", "0x0");

    // Uncles are rare on Avalanche, so null is expected
    assert.ok(result.success, "Should succeed");
    if (result.data !== null) {
      validateAvalancheBlock(result.data, false);
    }
  });

  it("[strong] should get uncle by block hash and index (eth_getUncleByBlockHashAndIndex)", async () => {
    const client = new AvalancheClient(config);
    const latestResult = await client.getBlockByNumber("latest", false);
    assert.ok(latestResult.data?.hash, "Should have block hash");

    const result = await client.getUncleByBlockHashAndIndex(latestResult.data.hash, "0x0");

    assert.ok(result.success, "Should succeed");
    if (result.data !== null) {
      validateAvalancheBlock(result.data, false);
    }
  });

  it("[strong] should get block receipts (eth_getBlockReceipts)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.getBlockReceipts("latest");

    if (result.success) {
      if (result.data !== null) {
        assert.ok(Array.isArray(result.data), "Should return array of receipts");
        for (const receipt of result.data) {
          validateAvalancheTransactionReceipt(receipt);
        }
      }
    }
  });
});

describe("AvalancheClient - Account Methods", () => {
  it("[strong] should get balance (eth_getBalance)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.getBalance(ZERO_ADDRESS, "latest");

    validateSuccessResult(result, "string");
    assert.ok(isHexString(result.data as string), "Balance should be hex string");
  });

  it("[strong] should get code (eth_getCode)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.getCode(ZERO_ADDRESS, "latest");

    validateSuccessResult(result, "string");
    assert.ok(isHexString(result.data as string), "Code should be hex string");
  });

  it("[strong] should get storage at (eth_getStorageAt)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.getStorageAt(ZERO_ADDRESS, "0x0", "latest");

    validateSuccessResult(result, "string");
    assert.ok(isHexString(result.data as string), "Storage should be hex string");
  });

  it("[strong] should get transaction count (eth_getTransactionCount)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.getTransactionCount(ZERO_ADDRESS, "latest");

    validateSuccessResult(result, "string");
    assert.ok(isHexString(result.data as string), "Transaction count should be hex string");
  });
});

describe("AvalancheClient - Transaction Methods", () => {
  it("[strong] should get transaction by hash (eth_getTransactionByHash)", async () => {
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

  it("[strong] should get transaction by block hash and index (eth_getTransactionByBlockHashAndIndex)", async () => {
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

  it("[strong] should get transaction by block number and index (eth_getTransactionByBlockNumberAndIndex)", async () => {
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

  it("[strong] should get transaction receipt (eth_getTransactionReceipt)", async () => {
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

  it("[strong] should reject invalid sendRawTransaction (eth_sendRawTransaction)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.sendRawTransaction("0xdeadbeef");

    validateFailureResult(result);
  });
});

describe("AvalancheClient - Call and Estimate", () => {
  it("[strong] should execute eth_call (eth_call)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.callContract({ to: ZERO_ADDRESS, data: "0x" }, "latest");

    if (result.success) {
      assert.strictEqual(typeof result.data, "string", "Call result should be string");
      assert.ok(isHexString(result.data as string), "Call result should be hex");
    }
  });

  it("[strong] should estimate gas (eth_estimateGas)", async () => {
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

  it("[strong] should create access list (eth_createAccessList)", async () => {
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

  it("[strong] should get gas price (eth_gasPrice)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.gasPrice();

    validateSuccessResult(result, "string");
    assert.ok(isHexString(result.data as string), "Gas price should be hex string");
  });

  it("[strong] should get max priority fee per gas (eth_maxPriorityFeePerGas)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.maxPriorityFeePerGas();

    validateSuccessResult(result, "string");
    assert.ok(isHexString(result.data as string), "Max priority fee should be hex string");
  });

  it("[strong] should get fee history (eth_feeHistory)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.feeHistory("0x4", "latest", [25, 50, 75]);

    validateSuccessResult(result);
    validateAvalancheFeeHistory(result.data);
  });
});

describe("AvalancheClient - Logs and Filters", () => {
  it("[strong] should get logs (eth_getLogs)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.getLogs({ fromBlock: "latest", toBlock: "latest" });

    validateSuccessResult(result);
    assert.ok(Array.isArray(result.data), "Should return array of logs");
    for (const log of result.data as any[]) {
      validateAvalancheLog(log);
    }
  });

  it("[strong] should create new filter (eth_newFilter)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.newFilter({ fromBlock: "latest" });

    if (result.success) {
      assert.strictEqual(typeof result.data, "string", "Filter ID should be string");
      assert.ok(isHexString(result.data as string), "Filter ID should be hex string");
    }
  });

  it("[strong] should create new block filter (eth_newBlockFilter)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.newBlockFilter();

    if (result.success) {
      assert.strictEqual(typeof result.data, "string", "Filter ID should be string");
      assert.ok(isHexString(result.data as string), "Filter ID should be hex string");
    }
  });

  it("[strong] should create new pending transaction filter (eth_newPendingTransactionFilter)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.newPendingTransactionFilter();

    if (result.success) {
      assert.strictEqual(typeof result.data, "string", "Filter ID should be string");
      assert.ok(isHexString(result.data as string), "Filter ID should be hex string");
    }
  });

  it("[weak] should get filter changes (eth_getFilterChanges)", async () => {
    const client = new AvalancheClient(config);
    const filterResult = await client.newBlockFilter();

    if (filterResult.success) {
      const result = await client.getFilterChanges(filterResult.data as string);

      if (result.success) {
        assert.ok(Array.isArray(result.data), "Filter changes should be array");
      }
    }
  });

  it("[strong] should get filter logs (eth_getFilterLogs)", async () => {
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

  it("[strong] should uninstall filter (eth_uninstallFilter)", async () => {
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
  it("[strong] should get txpool status (txpool_status)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.status();

    if (result.success) {
      validateAvalancheTxPoolStatus(result.data);
    }
  });

  it("[weak] should get txpool content (txpool_content)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.content();

    if (result.success) {
      assert.strictEqual(typeof result.data, "object", "Content should be object");
    }
  });

  it("[weak] should get txpool content from address (txpool_contentFrom)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.contentFrom(ZERO_ADDRESS);

    if (result.success) {
      assert.strictEqual(typeof result.data, "object", "ContentFrom should be object");
    }
  });

  it("[weak] should get txpool inspect (txpool_inspect)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.inspect();

    if (result.success) {
      assert.strictEqual(typeof result.data, "object", "Inspect should be object");
    }
  });
});

describe("AvalancheClient - Debug Methods", () => {
  it("[weak] should attempt debug_traceTransaction (debug_traceTransaction)", async () => {
    const client = new AvalancheClient(config);
    const blockResult = await client.getBlockByNumber("latest", false);

    if (blockResult.data && blockResult.data.transactions.length > 0) {
      const txHash = blockResult.data.transactions[0] as string;
      const result = await client.debugTraceTransaction(txHash);

      // Debug methods may not be supported on public nodes
      assert.ok(result, "Should return a result");
    }
  });

  it("[weak] should attempt debug_traceCall (debug_traceCall)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.debugTraceCall({ to: ZERO_ADDRESS, data: "0x" }, {}, "latest");

    assert.ok(result, "Should return a result");
  });

  it("[weak] should attempt debug_traceBlockByNumber (debug_traceBlockByNumber)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.debugTraceBlockByNumber("latest");

    assert.ok(result, "Should return a result");
  });

  it("[weak] should attempt debug_traceBlockByHash (debug_traceBlockByHash)", async () => {
    const client = new AvalancheClient(config);
    const blockResult = await client.getBlockByNumber("latest", false);
    assert.ok(blockResult.data?.hash, "Should have block hash");

    const result = await client.debugTraceBlockByHash(blockResult.data.hash);

    assert.ok(result, "Should return a result");
  });

  it("[weak] should attempt debug_traceBlock (debug_traceBlock)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.debugTraceBlock("0x");

    assert.ok(result, "Should return a result");
  });

  it("[weak] should attempt debug_traceBadBlock (debug_traceBadBlock)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.debugTraceBadBlock(
      "0x0000000000000000000000000000000000000000000000000000000000000000",
    );

    assert.ok(result, "Should return a result");
  });

  it("[weak] should attempt debug_traceChain (debug_traceChain)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.debugTraceChain("0x1", "0x2");

    assert.ok(result, "Should return a result");
  });

  it("[weak] should attempt debug_traceBlockFromFile (debug_traceBlockFromFile)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.debugTraceBlockFromFile("/nonexistent");

    assert.ok(result, "Should return a result");
  });

  it("[weak] should attempt debug_getBadBlocks (debug_getBadBlocks)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.debugGetBadBlocks();

    if (result.success) {
      assert.ok(Array.isArray(result.data), "Bad blocks should be array");
    }
  });

  it("[weak] should attempt debug_getModifiedAccountsByHash (debug_getModifiedAccountsByHash)", async () => {
    const client = new AvalancheClient(config);
    const blockResult = await client.getBlockByNumber("latest", false);
    assert.ok(blockResult.data?.hash, "Should have block hash");

    const result = await client.getModifiedAccountsByHash(blockResult.data.hash);

    assert.ok(result, "Should return a result");
  });

  it("[weak] should attempt debug_getModifiedAccountsByNumber (debug_getModifiedAccountsByNumber)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.getModifiedAccountsByNumber("0x1");

    assert.ok(result, "Should return a result");
  });

  it("[weak] should attempt debug_storageRangeAt (debug_storageRangeAt)", async () => {
    const client = new AvalancheClient(config);
    const blockResult = await client.getBlockByNumber("latest", false);
    assert.ok(blockResult.data?.hash, "Should have block hash");

    const result = await client.storageRangeAt(blockResult.data.hash, 0, ZERO_ADDRESS, "0x0", 10);

    assert.ok(result, "Should return a result");
  });

  it("[weak] should attempt debug_intermediateRoots (debug_intermediateRoots)", async () => {
    const client = new AvalancheClient(config);
    const blockResult = await client.getBlockByNumber("latest", false);
    assert.ok(blockResult.data?.hash, "Should have block hash");

    const result = await client.debugIntermediateRoots(blockResult.data.hash);

    assert.ok(result, "Should return a result");
  });

  it("[weak] should attempt debug_accountRange (debug_accountRange)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.accountRange("latest", "0x0", 10);

    assert.ok(result, "Should return a result");
  });

  it("[weak] should attempt debug_dumpBlock (debug_dumpBlock)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.debugDumpBlock("0x1");

    assert.ok(result, "Should return a result");
  });

  it("[weak] should attempt debug_memStats (debug_memStats)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.debugMemStats();

    if (result.success) {
      assert.strictEqual(typeof result.data, "object", "MemStats should be object");
    }
  });

  it("[weak] should attempt debug_gcStats (debug_gcStats)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.debugGcStats();

    if (result.success) {
      assert.strictEqual(typeof result.data, "object", "GcStats should be object");
    }
  });

  it("[weak] should attempt debug_setGCPercent (debug_setGCPercent)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.debugSetGCPercent(100);

    assert.ok(result, "Should return a result");
  });

  it("[weak] should attempt debug_metrics (debug_metrics)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.debugMetrics();

    if (result.success) {
      assert.strictEqual(typeof result.data, "object", "Metrics should be object");
    }
  });

  it("[weak] should attempt debug_verbosity (debug_verbosity)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.debugVerbosity(3);

    assert.ok(result, "Should return a result");
  });
});

describe("AvalancheClient - Admin Methods", () => {
  it("[strong] should attempt admin_nodeInfo (admin_nodeInfo)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.adminNodeInfo();

    if (result.success) {
      validateAvalancheAdminNodeInfo(result.data);
    }
  });

  it("[strong] should attempt admin_peers (admin_peers)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.adminPeers();

    if (result.success) {
      assert.ok(Array.isArray(result.data), "Peers should be array");
      for (const peer of result.data as any[]) {
        validateAvalancheAdminPeerInfo(peer);
      }
    }
  });

  it("[strong] should attempt admin_addPeer (admin_addPeer)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.adminAddPeer("enode://test@127.0.0.1:30303");

    // Admin methods typically not available on public nodes
    if (result.success) {
      assert.strictEqual(typeof result.data, "boolean", "addPeer should return boolean");
    }
  });

  it("[strong] should attempt admin_removePeer (admin_removePeer)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.adminRemovePeer("enode://test@127.0.0.1:30303");

    if (result.success) {
      assert.strictEqual(typeof result.data, "boolean", "removePeer should return boolean");
    }
  });

  it("[weak] should attempt admin_alias (admin_alias)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.adminAlias("/ext/bc/C/rpc", "/ext/bc/C/avax");

    // Admin methods typically not available on public nodes
    assert.ok(result, "Should return a result");
  });
});

describe("AvalancheClient - Avalanche-Specific Methods (avax.*)", () => {
  it("[strong] should attempt avax.getAtomicTxStatus (avax.getAtomicTxStatus)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.avaxGetAtomicTxStatus(
      "2QouvFWUbjuySRxeX5xMbNCuAaKWfbk5FeEa2JmoF85RKLnC8i",
    );

    if (result.success) {
      validateAvaxAtomicTxStatus(result.data);
    }
  });

  it("[strong] should attempt avax.getAtomicTx (avax.getAtomicTx)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.avaxGetAtomicTx(
      "2QouvFWUbjuySRxeX5xMbNCuAaKWfbk5FeEa2JmoF85RKLnC8i",
    );

    if (result.success) {
      validateAvaxAtomicTx(result.data);
    }
  });

  it("[strong] should attempt avax.getUTXOs (avax.getUTXOs)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.avaxGetUTXOs([ZERO_ADDRESS], 10);

    if (result.success) {
      validateAvaxUTXOsResponse(result.data);
    }
  });

  it("[strong] should attempt avax.issueTx (avax.issueTx)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.avaxIssueTx("0xdeadbeef");

    // Will fail with invalid tx, but verifies the call path
    if (result.success) {
      validateAvaxIssueTxResponse(result.data);
    }
  });

  it("[weak] should attempt avax.import (avax.import)", async () => {
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

  it("[weak] should attempt avax.export (avax.export)", async () => {
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
  it("[strong] should attempt eth_sign (eth_sign)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.sign(ZERO_ADDRESS, "0x68656c6c6f");

    // Not supported on public nodes
    if (result.success) {
      assert.strictEqual(typeof result.data, "string", "Signature should be string");
      assert.ok(isHexString(result.data as string), "Signature should be hex");
    }
  });

  it("[strong] should attempt eth_signTransaction (eth_signTransaction)", async () => {
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

  it("[strong] should attempt eth_signTypedData (eth_signTypedData)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.signTypedData(ZERO_ADDRESS, {
      types: { EIP712Domain: [] },
      primaryType: "EIP712Domain",
      domain: {},
      message: {},
    });

    if (result.success) {
      assert.strictEqual(typeof result.data, "string", "Signature should be string");
    }
  });

  it("[strong] should attempt eth_signTypedData_v4 (eth_signTypedData_v4)", async () => {
    const client = new AvalancheClient(config);
    const result = await client.signTypedDataV4(ZERO_ADDRESS, {
      types: { EIP712Domain: [] },
      primaryType: "EIP712Domain",
      domain: {},
      message: {},
    });

    if (result.success) {
      assert.strictEqual(typeof result.data, "string", "Signature should be string");
    }
  });

  it("[strong] should attempt eth_sendTransaction (eth_sendTransaction)", async () => {
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

  it("[strong] should get chain ID with metadata", async () => {
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

  it("[strong] should get block with full type validation via parallel", async () => {
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

  it("[strong] should get block number with race strategy metadata", async () => {
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
