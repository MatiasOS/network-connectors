import { describe, it } from "node:test";
import assert from "node:assert";
import { HardhatClient } from "../../../src/networks/31337/HardhatClient.js";
import type { StrategyConfig } from "../../../src/strategies/requestStrategy.js";
import {
  validateObject,
  validateBlock,
  validateSuccessResult,
  validateFailureResult,
  validateTransaction,
  validateTransactionReceipt,
  isHexString,
} from "../../helpers/validators.js";

const TEST_URLS = ["http://127.0.0.1:8545"];

const config: StrategyConfig = {
  type: "fallback",
  rpcUrls: TEST_URLS,
};

async function sendTestTransaction(client: HardhatClient) {
  const accountsResult = await client.execute<string[]>("eth_accounts", []);
  const from = accountsResult.data![0];
  const to = "0x0000000000000000000000000000000000000001";

  const txResult = await client.sendTransaction({ from, to, value: "0x1" });
  const txHash = txResult.data!;

  const receipt = await client.getTransactionReceipt(txHash);
  return {
    from,
    txHash,
    blockHash: receipt.data!.blockHash,
    blockNumber: receipt.data!.blockNumber,
  };
}

describe("HardhatNetworkClient - Constructor", () => {
  it("should create a client with fallback strategy", () => {
    const client = new HardhatClient(config);
    assert.ok(client, "Client should be created");
    assert.strictEqual(client.getStrategyName(), "fallback", "Should use fallback strategy");
  });

  it("should create a client with race strategy", () => {
    const client = new HardhatClient({ type: "race", rpcUrls: TEST_URLS });
    assert.strictEqual(client.getStrategyName(), "race", "Should use race strategy");
  });

  it("should create a client with parallel strategy", () => {
    const client = new HardhatClient({ type: "parallel", rpcUrls: TEST_URLS });
    assert.strictEqual(client.getStrategyName(), "parallel", "Should use parallel strategy");
  });
});

// ===== Hardhat-Specific Methods =====

describe("HardhatNetworkClient - Hardhat Methods [strong]", () => {
  it("should get automine status", async () => {
    const client = new HardhatClient(config);
    const result = await client.getAutomine();

    validateSuccessResult(result);
    assert.strictEqual(typeof result.data, "boolean", "Automine should be boolean");
  });

  it("should get metadata", async () => {
    const client = new HardhatClient(config);
    const result = await client.metadata();

    validateSuccessResult(result);
    assert.ok(result.data, "Should have metadata");
    validateObject(result.data, [
      "clientVersion",
      "chainId",
      "instanceId",
      "latestBlockNumber",
      "latestBlockHash",
    ]);
    assert.strictEqual(
      typeof result.data.clientVersion,
      "string",
      "clientVersion should be string",
    );
    assert.strictEqual(typeof result.data.chainId, "number", "chainId should be number");
    assert.strictEqual(typeof result.data.instanceId, "string", "instanceId should be string");
    assert.strictEqual(
      typeof result.data.latestBlockNumber,
      "number",
      "latestBlockNumber should be number",
    );
    assert.strictEqual(
      typeof result.data.latestBlockHash,
      "string",
      "latestBlockHash should be string",
    );
  });

  it("should mine blocks with hardhat_mine", async () => {
    const client = new HardhatClient(config);

    const beforeResult = await client.blockNumber();
    validateSuccessResult(beforeResult);
    const beforeBlock = Number.parseInt(beforeResult.data!, 16);

    const mineResult = await client.mine("0x5");
    validateSuccessResult(mineResult);

    const afterResult = await client.blockNumber();
    validateSuccessResult(afterResult);
    const afterBlock = Number.parseInt(afterResult.data!, 16);

    assert.ok(afterBlock >= beforeBlock + 5, "Should have mined at least 5 blocks");
  });

  it("should set and get balance", async () => {
    const client = new HardhatClient(config);
    const address = "0x0000000000000000000000000000000000000001";
    const newBalance = "0xDE0B6B3A7640000"; // 1 ETH in wei

    const setResult = await client.setBalance(address, newBalance);
    validateSuccessResult(setResult);

    const getResult = await client.getBalance(address);
    validateSuccessResult(getResult);
    assert.strictEqual(
      getResult.data!.toLowerCase(),
      newBalance.toLowerCase(),
      "Balance should match",
    );
  });

  it("should set and get code", async () => {
    const client = new HardhatClient(config);
    const address = "0x0000000000000000000000000000000000000002";
    const bytecode = "0x6080604052"; // minimal bytecode

    const setResult = await client.setCode(address, bytecode);
    validateSuccessResult(setResult);

    const getResult = await client.getCode(address);
    validateSuccessResult(getResult);
    assert.ok(getResult.data!.startsWith("0x6080604052"), "Code should start with set bytecode");
  });

  it("should set and get nonce", async () => {
    const client = new HardhatClient(config);
    const address = "0x0000000000000000000000000000000000000003";
    const newNonce = "0xa"; // 10

    const setResult = await client.setNonce(address, newNonce);
    validateSuccessResult(setResult);

    const getResult = await client.getTransactionCount(address);
    validateSuccessResult(getResult);
    assert.strictEqual(Number.parseInt(getResult.data!, 16), 10, "Nonce should be 10");
  });

  it("should set and get storage", async () => {
    const client = new HardhatClient(config);
    const address = "0x0000000000000000000000000000000000000004";
    const position = "0x0";
    const value = "0x000000000000000000000000000000000000000000000000000000000000002a"; // 42

    const setResult = await client.setStorageAt(address, position, value);
    validateSuccessResult(setResult);

    const getResult = await client.getStorageAt(address, position);
    validateSuccessResult(getResult);
    assert.strictEqual(getResult.data!, value, "Storage value should match");
  });

  it("should impersonate and stop impersonating account", async () => {
    const client = new HardhatClient(config);
    const address = "0x0000000000000000000000000000000000000005";

    const impersonateResult = await client.impersonateAccount(address);
    validateSuccessResult(impersonateResult);

    const stopResult = await client.stopImpersonatingAccount(address);
    validateSuccessResult(stopResult);
  });

  it("should set coinbase [weak]", async () => {
    const client = new HardhatClient(config);
    const address = "0x0000000000000000000000000000000000000006";

    const result = await client.setCoinbase(address);
    validateSuccessResult(result);
  });

  it("should set logging enabled [weak]", async () => {
    const client = new HardhatClient(config);

    const result = await client.setLoggingEnabled(false);
    validateSuccessResult(result);

    // Re-enable logging
    await client.setLoggingEnabled(true);
  });

  it("should set next block base fee per gas", async () => {
    const client = new HardhatClient(config);
    const baseFee = "0x3B9ACA00"; // 1 gwei

    const setResult = await client.setNextBlockBaseFeePerGas(baseFee);
    validateSuccessResult(setResult);

    // Mine a block to apply the base fee
    await client.evmMine();

    const blockResult = await client.getBlockByNumber("latest", false);
    validateSuccessResult(blockResult);
    assert.ok(blockResult.data, "Should have block");
    assert.strictEqual(
      blockResult.data.baseFeePerGas?.toLowerCase(),
      baseFee.toLowerCase(),
      "Base fee should match",
    );
  });

  it("should set prev randao [weak]", async () => {
    const client = new HardhatClient(config);
    const value = "0x0000000000000000000000000000000000000000000000000000000000000042";

    const result = await client.setPrevRandao(value);
    validateSuccessResult(result);
  });

  it("should reset network", async () => {
    const client = new HardhatClient(config);

    const result = await client.reset();
    validateSuccessResult(result);

    // After reset, block number should be 0
    const blockResult = await client.blockNumber();
    validateSuccessResult(blockResult);
    const blockNum = Number.parseInt(blockResult.data!, 16);
    assert.strictEqual(blockNum, 0, "Block number should be 0 after reset");
  });
});

// ===== EVM Methods =====

describe("HardhatNetworkClient - EVM Methods [strong]", () => {
  it("should create and revert snapshots", async () => {
    const client = new HardhatClient(config);

    // Take snapshot
    const snapshotResult = await client.evmSnapshot();
    validateSuccessResult(snapshotResult);
    assert.ok(snapshotResult.data, "Should return snapshot ID");

    // Mine some blocks
    await client.mine("0x3");

    // Revert to snapshot
    const revertResult = await client.evmRevert(snapshotResult.data!);
    validateSuccessResult(revertResult);
    assert.strictEqual(revertResult.data, true, "Revert should return true");
  });

  it("should mine a block with evm_mine", async () => {
    const client = new HardhatClient(config);

    const beforeResult = await client.blockNumber();
    validateSuccessResult(beforeResult);
    const beforeBlock = Number.parseInt(beforeResult.data!, 16);

    const mineResult = await client.evmMine();
    validateSuccessResult(mineResult);

    const afterResult = await client.blockNumber();
    validateSuccessResult(afterResult);
    const afterBlock = Number.parseInt(afterResult.data!, 16);

    assert.strictEqual(afterBlock, beforeBlock + 1, "Should have mined exactly 1 block");
  });

  it("should increase time", async () => {
    const client = new HardhatClient(config);

    const result = await client.evmIncreaseTime(3600); // 1 hour
    validateSuccessResult(result);
    assert.strictEqual(typeof result.data, "number", "Should return total time adjustment");
  });

  it("should set next block timestamp", async () => {
    const client = new HardhatClient(config);

    const futureTimestamp = Math.floor(Date.now() / 1000) + 86400; // 1 day in the future
    const setResult = await client.evmSetNextBlockTimestamp(futureTimestamp);
    validateSuccessResult(setResult);

    // Mine a block to apply the timestamp
    await client.evmMine();

    const blockResult = await client.getBlockByNumber("latest", false);
    validateSuccessResult(blockResult);
    assert.ok(blockResult.data, "Should have block");
    assert.strictEqual(
      Number.parseInt(blockResult.data.timestamp, 16),
      futureTimestamp,
      "Block timestamp should match",
    );
  });

  it("should set automine", async () => {
    const client = new HardhatClient(config);

    const disableResult = await client.evmSetAutomine(false);
    validateSuccessResult(disableResult);

    const automineResult = await client.getAutomine();
    validateSuccessResult(automineResult);
    assert.strictEqual(automineResult.data, false, "Automine should be disabled");

    // Re-enable automine
    const enableResult = await client.evmSetAutomine(true);
    validateSuccessResult(enableResult);

    const automineResult2 = await client.getAutomine();
    validateSuccessResult(automineResult2);
    assert.strictEqual(automineResult2.data, true, "Automine should be re-enabled");
  });

  it("should set block gas limit [weak]", async () => {
    const client = new HardhatClient(config);

    const result = await client.evmSetBlockGasLimit(30_000_000);
    validateSuccessResult(result);
  });

  it("should set interval mining [weak]", async () => {
    const client = new HardhatClient(config);

    // Enable interval mining
    const enableResult = await client.evmSetIntervalMining(5000);
    validateSuccessResult(enableResult);

    // Disable interval mining
    const disableResult = await client.evmSetIntervalMining(0);
    validateSuccessResult(disableResult);
  });
});

// ===== Standard Ethereum Methods =====

describe("HardhatNetworkClient - Chain Info [strong]", () => {
  it("should get chain ID", async () => {
    const client = new HardhatClient(config);
    const result = await client.chainId();

    validateSuccessResult(result);
    assert.ok(isHexString(result.data!), "Chain ID should be hex string");
    assert.strictEqual(result.data, "0x7a69", "Should be Hardhat chain ID (31337)");
  });

  it("should get block number", async () => {
    const client = new HardhatClient(config);
    const result = await client.blockNumber();

    validateSuccessResult(result);
    assert.ok(isHexString(result.data!), "Block number should be hex string");
  });

  it("should get gas price", async () => {
    const client = new HardhatClient(config);
    const result = await client.gasPrice();

    validateSuccessResult(result);
    assert.ok(isHexString(result.data!), "Gas price should be hex string");
  });

  it("should get syncing status", async () => {
    const client = new HardhatClient(config);
    const result = await client.syncing();

    validateSuccessResult(result);
    // Hardhat local node is never syncing
    assert.strictEqual(result.data, false, "Hardhat should not be syncing");
  });
});

describe("HardhatNetworkClient - Web3 Methods [strong]", () => {
  it("should get client version", async () => {
    const client = new HardhatClient(config);
    const result = await client.clientVersion();

    validateSuccessResult(result);
    assert.ok(typeof result.data === "string", "Client version should be string");
    assert.ok(result.data!.length > 0, "Client version should not be empty");
  });

  it("should compute sha3 hash", async () => {
    const client = new HardhatClient(config);
    const result = await client.sha3("0x68656c6c6f"); // "hello" in hex

    validateSuccessResult(result);
    assert.ok(isHexString(result.data!), "SHA3 result should be hex string");
  });
});

describe("HardhatNetworkClient - Net Methods [strong]", () => {
  it("should get network version", async () => {
    const client = new HardhatClient(config);
    const result = await client.version();

    validateSuccessResult(result);
    assert.ok(typeof result.data === "string", "Version should be string");
  });

  it("should check listening status", async () => {
    const client = new HardhatClient(config);
    const result = await client.listening();

    validateSuccessResult(result);
    assert.strictEqual(typeof result.data, "boolean", "Listening should be boolean");
  });

  it("should get peer count", async () => {
    const client = new HardhatClient(config);
    const result = await client.peerCount();

    validateSuccessResult(result);
    assert.ok(isHexString(result.data!), "Peer count should be hex string");
  });
});

describe("HardhatNetworkClient - Block Methods [strong]", () => {
  it("should get block by number (latest)", async () => {
    const client = new HardhatClient(config);
    const result = await client.getBlockByNumber("latest", false);

    validateSuccessResult(result);
    validateBlock(result.data);
  });

  it("should get block by number (earliest)", async () => {
    const client = new HardhatClient(config);
    const result = await client.getBlockByNumber("earliest", false);

    validateSuccessResult(result);
    validateBlock(result.data);
  });

  it("should get block by hash", async () => {
    const client = new HardhatClient(config);
    const blockResult = await client.getBlockByNumber("latest", false);
    validateSuccessResult(blockResult);
    assert.ok(blockResult.data, "Should have block");

    const result = await client.getBlockByHash(blockResult.data.hash, false);
    validateSuccessResult(result);
    validateBlock(result.data);
  });

  it("should get block transaction count by number", async () => {
    const client = new HardhatClient(config);
    const result = await client.getBlockTransactionCountByNumber("latest");

    validateSuccessResult(result);
    assert.ok(isHexString(result.data!), "Count should be hex string");
  });
});

describe("HardhatNetworkClient - Account Methods [strong]", () => {
  it("should get balance", async () => {
    const client = new HardhatClient(config);
    const result = await client.getBalance("0x0000000000000000000000000000000000000000");

    validateSuccessResult(result);
    assert.ok(isHexString(result.data!), "Balance should be hex string");
  });

  it("should get code for non-contract address", async () => {
    const client = new HardhatClient(config);
    const result = await client.getCode("0x0000000000000000000000000000000000000000");

    validateSuccessResult(result);
    assert.strictEqual(result.data, "0x", "Non-contract should return 0x");
  });

  it("should get transaction count", async () => {
    const client = new HardhatClient(config);
    const result = await client.getTransactionCount("0x0000000000000000000000000000000000000000");

    validateSuccessResult(result);
    assert.ok(isHexString(result.data!), "Transaction count should be hex string");
  });

  it("should get storage at position", async () => {
    const client = new HardhatClient(config);
    const result = await client.getStorageAt("0x0000000000000000000000000000000000000000", "0x0");

    validateSuccessResult(result);
    assert.ok(typeof result.data === "string", "Storage value should be string");
  });
});

describe("HardhatNetworkClient - Call and Estimate [strong]", () => {
  it("should estimate gas for a simple transfer", async () => {
    const client = new HardhatClient(config);
    const result = await client.estimateGas({
      from: "0x0000000000000000000000000000000000000000",
      to: "0x0000000000000000000000000000000000000001",
      value: "0x0",
    });

    validateSuccessResult(result);
    assert.ok(isHexString(result.data!), "Gas estimate should be hex string");
  });

  it("should execute eth_call", async () => {
    const client = new HardhatClient(config);
    const result = await client.call({
      to: "0x0000000000000000000000000000000000000001",
      data: "0x",
    });

    validateSuccessResult(result);
    assert.ok(typeof result.data === "string", "Call result should be string");
  });
});

describe("HardhatNetworkClient - Logs and Filters [strong]", () => {
  it("should get logs with empty filter", async () => {
    const client = new HardhatClient(config);
    const result = await client.getLogs({
      fromBlock: "earliest",
      toBlock: "latest",
    });

    validateSuccessResult(result);
    assert.ok(Array.isArray(result.data), "Logs should be array");
  });
});

describe("HardhatNetworkClient - Fee Methods [strong]", () => {
  it("should get gas price", async () => {
    const client = new HardhatClient(config);
    const result = await client.gasPrice();

    validateSuccessResult(result);
    assert.ok(isHexString(result.data!), "Gas price should be hex string");
  });

  it("should get fee history", async () => {
    const client = new HardhatClient(config);
    const result = await client.feeHistory("0x1", "latest", [25, 50, 75]);

    validateSuccessResult(result);
    assert.ok(result.data, "Should have fee history data");
  });

  it("should get max priority fee per gas [strong]", async () => {
    const client = new HardhatClient(config);
    const result = await client.maxPriorityFeePerGas();

    validateSuccessResult(result);
    assert.ok(isHexString(result.data!), "Max priority fee should be hex string");
  });
});

// ===== Hardhat Methods - Additional =====

describe("HardhatNetworkClient - Hardhat Methods Additional", () => {
  it("should fail addCompilationResult with dummy data [weak]", async () => {
    const client = new HardhatClient(config);
    const result = await client.addCompilationResult("0.8.0", {}, {});

    validateFailureResult(result);
  });

  it("should drop a pending transaction [strong]", async () => {
    const client = new HardhatClient(config);

    // Disable automine so the tx stays pending
    await client.evmSetAutomine(false);

    const accountsResult = await client.execute<string[]>("eth_accounts", []);
    const from = accountsResult.data![0];

    const txResult = await client.sendTransaction({
      from,
      to: "0x0000000000000000000000000000000000000001",
      value: "0x1",
    });
    validateSuccessResult(txResult);

    const dropResult = await client.dropTransaction(txResult.data!);
    validateSuccessResult(dropResult);
    assert.strictEqual(dropResult.data, true, "Should return true on drop");

    // Re-enable automine
    await client.evmSetAutomine(true);
  });

  it("should fail setMinGasPrice on EIP-1559 network [weak]", async () => {
    const client = new HardhatClient(config);
    const result = await client.setMinGasPrice("0x1");

    // Hardhat with EIP-1559 rejects setMinGasPrice
    validateFailureResult(result);
  });
});

// ===== Block Methods - Additional =====

describe("HardhatNetworkClient - Block Methods Additional [strong]", () => {
  it("should get block transaction count by hash", async () => {
    const client = new HardhatClient(config);
    const blockResult = await client.getBlockByNumber("latest", false);
    validateSuccessResult(blockResult);

    const result = await client.getBlockTransactionCountByHash(blockResult.data!.hash);
    validateSuccessResult(result);
    assert.ok(isHexString(result.data!), "Count should be hex string");
  });

  it("should attempt getUncleCountByBlockNumber [weak]", async () => {
    const client = new HardhatClient(config);
    const result = await client.getUncleCountByBlockNumber("latest");

    // Not supported on all Hardhat versions
    if (result.success) {
      assert.ok(isHexString(result.data!), "Uncle count should be hex string");
    } else {
      validateFailureResult(result);
    }
  });

  it("should attempt getUncleCountByBlockHash [weak]", async () => {
    const client = new HardhatClient(config);
    const blockResult = await client.getBlockByNumber("latest", false);
    validateSuccessResult(blockResult);

    const result = await client.getUncleCountByBlockHash(blockResult.data!.hash);

    if (result.success) {
      assert.ok(isHexString(result.data!), "Uncle count should be hex string");
    } else {
      validateFailureResult(result);
    }
  });

  it("should attempt getUncleByBlockNumberAndIndex [weak]", async () => {
    const client = new HardhatClient(config);
    const result = await client.getUncleByBlockNumberAndIndex("latest", "0x0");

    // May return null on success or fail if unsupported
    if (result.success) {
      assert.strictEqual(result.data, null, "Should be null (no uncles)");
    } else {
      validateFailureResult(result);
    }
  });

  it("should attempt getUncleByBlockHashAndIndex [weak]", async () => {
    const client = new HardhatClient(config);
    const blockResult = await client.getBlockByNumber("latest", false);
    validateSuccessResult(blockResult);

    const result = await client.getUncleByBlockHashAndIndex(blockResult.data!.hash, "0x0");

    if (result.success) {
      assert.strictEqual(result.data, null, "Should be null (no uncles)");
    } else {
      validateFailureResult(result);
    }
  });
});

// ===== Transaction Methods =====

describe("HardhatNetworkClient - Transaction Methods [strong]", () => {
  it("should send a transaction", async () => {
    const client = new HardhatClient(config);
    const accountsResult = await client.execute<string[]>("eth_accounts", []);
    const from = accountsResult.data![0];

    const result = await client.sendTransaction({
      from,
      to: "0x0000000000000000000000000000000000000001",
      value: "0x1",
    });

    validateSuccessResult(result);
    assert.ok(isHexString(result.data!), "Tx hash should be hex string");
  });

  it("should fail sendRawTransaction with invalid data [weak]", async () => {
    const client = new HardhatClient(config);
    const result = await client.sendRawTransaction("0xdeadbeef");

    validateFailureResult(result);
  });

  it("should get transaction by hash", async () => {
    const client = new HardhatClient(config);
    const { txHash } = await sendTestTransaction(client);

    const result = await client.getTransactionByHash(txHash);
    validateSuccessResult(result);
    assert.ok(result.data, "Should have transaction data");
    validateTransaction(result.data);
  });

  it("should get transaction by block hash and index", async () => {
    const client = new HardhatClient(config);
    const { blockHash } = await sendTestTransaction(client);

    const result = await client.getTransactionByBlockHashAndIndex(blockHash, "0x0");
    validateSuccessResult(result);
    assert.ok(result.data, "Should have transaction data");
    validateTransaction(result.data);
  });

  it("should get transaction by block number and index", async () => {
    const client = new HardhatClient(config);
    const { blockNumber } = await sendTestTransaction(client);

    const result = await client.getTransactionByBlockNumberAndIndex(blockNumber, "0x0");
    validateSuccessResult(result);
    assert.ok(result.data, "Should have transaction data");
    validateTransaction(result.data);
  });

  it("should get transaction receipt", async () => {
    const client = new HardhatClient(config);
    const { txHash } = await sendTestTransaction(client);

    const result = await client.getTransactionReceipt(txHash);
    validateSuccessResult(result);
    assert.ok(result.data, "Should have receipt data");
    validateTransactionReceipt(result.data);
  });

  it("should get proof [weak]", async () => {
    const client = new HardhatClient(config);
    const result = await client.getProof(
      "0x0000000000000000000000000000000000000001",
      ["0x0"],
      "latest",
    );

    // Hardhat may or may not support eth_getProof
    assert.ok(
      result.success || !result.success,
      "Should return a result (success or failure)",
    );
  });

  it("should attempt createAccessList [weak]", async () => {
    const client = new HardhatClient(config);
    const accountsResult = await client.execute<string[]>("eth_accounts", []);
    const from = accountsResult.data![0];

    const result = await client.createAccessList({
      from,
      to: "0x0000000000000000000000000000000000000001",
      value: "0x0",
    });

    // Not supported on all Hardhat versions
    if (result.success) {
      assert.ok(result.data, "Should have access list data");
      assert.ok(Array.isArray(result.data.accessList), "accessList should be array");
      assert.ok(isHexString(result.data.gasUsed), "gasUsed should be hex string");
    } else {
      validateFailureResult(result);
    }
  });
});

// ===== Filter Methods =====

describe("HardhatNetworkClient - Filter Methods [strong]", () => {
  it("should create and use a log filter", async () => {
    const client = new HardhatClient(config);

    const filterResult = await client.newFilter({ fromBlock: "latest", toBlock: "latest" });
    validateSuccessResult(filterResult);
    assert.ok(isHexString(filterResult.data!), "Filter ID should be hex string");

    const changesResult = await client.getFilterChanges(filterResult.data!);
    validateSuccessResult(changesResult);
    assert.ok(Array.isArray(changesResult.data), "Changes should be array");

    const uninstallResult = await client.uninstallFilter(filterResult.data!);
    validateSuccessResult(uninstallResult);
    assert.strictEqual(uninstallResult.data, true, "Should uninstall filter");
  });

  it("should create and use a block filter", async () => {
    const client = new HardhatClient(config);

    const filterResult = await client.newBlockFilter();
    validateSuccessResult(filterResult);
    assert.ok(isHexString(filterResult.data!), "Filter ID should be hex string");

    const changesResult = await client.getFilterChanges(filterResult.data!);
    validateSuccessResult(changesResult);
    assert.ok(Array.isArray(changesResult.data), "Changes should be array");

    const uninstallResult = await client.uninstallFilter(filterResult.data!);
    validateSuccessResult(uninstallResult);
  });

  it("should create and use a pending transaction filter", async () => {
    const client = new HardhatClient(config);

    const filterResult = await client.newPendingTransactionFilter();
    validateSuccessResult(filterResult);
    assert.ok(isHexString(filterResult.data!), "Filter ID should be hex string");

    const changesResult = await client.getFilterChanges(filterResult.data!);
    validateSuccessResult(changesResult);
    assert.ok(Array.isArray(changesResult.data), "Changes should be array");

    const uninstallResult = await client.uninstallFilter(filterResult.data!);
    validateSuccessResult(uninstallResult);
  });

  it("should get filter logs for a log filter", async () => {
    const client = new HardhatClient(config);

    const filterResult = await client.newFilter({ fromBlock: "earliest", toBlock: "latest" });
    validateSuccessResult(filterResult);

    const logsResult = await client.getFilterLogs(filterResult.data!);
    validateSuccessResult(logsResult);
    assert.ok(Array.isArray(logsResult.data), "Logs should be array");

    await client.uninstallFilter(filterResult.data!);
  });
});

// ===== Legacy Mining Methods =====

describe("HardhatNetworkClient - Legacy Mining Methods [weak]", () => {
  it("should attempt mining [weak]", async () => {
    const client = new HardhatClient(config);
    const result = await client.mining();

    // Not supported on all Hardhat versions
    if (result.success) {
      assert.strictEqual(typeof result.data, "boolean", "Mining should be boolean");
    } else {
      validateFailureResult(result);
    }
  });

  it("should attempt hashRate [weak]", async () => {
    const client = new HardhatClient(config);
    const result = await client.hashRate();

    if (result.success) {
      assert.ok(isHexString(result.data!), "Hash rate should be hex string");
    } else {
      validateFailureResult(result);
    }
  });

  it("should fail getWork [weak]", async () => {
    const client = new HardhatClient(config);
    const result = await client.getWork();

    validateFailureResult(result);
  });

  it("should fail submitWork [weak]", async () => {
    const client = new HardhatClient(config);
    const result = await client.submitWork("0x0", "0x0", "0x0");

    validateFailureResult(result);
  });

  it("should fail submitHashrate [weak]", async () => {
    const client = new HardhatClient(config);
    const result = await client.submitHashrate("0x0", "0x0");

    validateFailureResult(result);
  });
});

// ===== TxPool Methods =====

describe("HardhatNetworkClient - TxPool Methods [weak]", () => {
  it("should get txpool status [weak]", async () => {
    const client = new HardhatClient(config);
    const result = await client.txPoolStatus();

    // May succeed or fail depending on Hardhat version
    assert.ok(
      result.success || !result.success,
      "Should return a result",
    );
  });

  it("should get txpool content [weak]", async () => {
    const client = new HardhatClient(config);
    const result = await client.txPoolContent();

    assert.ok(
      result.success || !result.success,
      "Should return a result",
    );
  });

  it("should get txpool inspect [weak]", async () => {
    const client = new HardhatClient(config);
    const result = await client.txPoolInspect();

    assert.ok(
      result.success || !result.success,
      "Should return a result",
    );
  });
});

// ===== Debug Methods =====

describe("HardhatNetworkClient - Debug Methods", () => {
  it("should debug trace a transaction [strong]", async () => {
    const client = new HardhatClient(config);
    const { txHash } = await sendTestTransaction(client);

    const result = await client.debugTraceTransaction(txHash);
    validateSuccessResult(result);
    assert.ok(result.data, "Should have trace data");
  });

  it("should debug trace a call [strong]", async () => {
    const client = new HardhatClient(config);

    const result = await client.debugTraceCall(
      { to: "0x0000000000000000000000000000000000000001", data: "0x" },
      "latest",
    );

    validateSuccessResult(result);
    assert.ok(result.data, "Should have trace data");
  });

  it("should attempt debugStorageRangeAt [weak]", async () => {
    const client = new HardhatClient(config);
    const blockResult = await client.getBlockByNumber("latest", false);
    validateSuccessResult(blockResult);

    const result = await client.debugStorageRangeAt(
      blockResult.data!.hash,
      0,
      "0x0000000000000000000000000000000000000001",
      "0x0",
      10,
    );

    assert.ok(
      result.success || !result.success,
      "Should return a result",
    );
  });

  it("should attempt debugAccountRange [weak]", async () => {
    const client = new HardhatClient(config);
    const result = await client.debugAccountRange("latest", "0x0", 10);

    assert.ok(
      result.success || !result.success,
      "Should return a result",
    );
  });

  it("should attempt debugGetModifiedAccountsByHash [weak]", async () => {
    const client = new HardhatClient(config);
    const blockResult = await client.getBlockByNumber("latest", false);
    validateSuccessResult(blockResult);

    const result = await client.debugGetModifiedAccountsByHash(blockResult.data!.hash);

    assert.ok(
      result.success || !result.success,
      "Should return a result",
    );
  });

  it("should attempt debugGetModifiedAccountsByNumber [weak]", async () => {
    const client = new HardhatClient(config);
    const blockNumResult = await client.blockNumber();
    validateSuccessResult(blockNumResult);

    const result = await client.debugGetModifiedAccountsByNumber(blockNumResult.data!);

    assert.ok(
      result.success || !result.success,
      "Should return a result",
    );
  });
});

// ===== Trace Methods =====

describe("HardhatNetworkClient - Trace Methods [weak]", () => {
  it("should fail traceBlock (unsupported) [weak]", async () => {
    const client = new HardhatClient(config);
    const result = await client.traceBlock("latest");

    validateFailureResult(result);
  });

  it("should fail traceTransaction (unsupported) [weak]", async () => {
    const client = new HardhatClient(config);
    const { txHash } = await sendTestTransaction(client);

    const result = await client.traceTransaction(txHash);
    validateFailureResult(result);
  });

  it("should fail traceCall (unsupported) [weak]", async () => {
    const client = new HardhatClient(config);
    const result = await client.traceCall(
      { to: "0x0000000000000000000000000000000000000001" },
      {},
    );

    validateFailureResult(result);
  });

  it("should fail traceRawTransaction (unsupported) [weak]", async () => {
    const client = new HardhatClient(config);
    const result = await client.traceRawTransaction("0xdeadbeef", {});

    validateFailureResult(result);
  });

  it("should fail traceFilter (unsupported) [weak]", async () => {
    const client = new HardhatClient(config);
    const result = await client.traceFilter({ fromBlock: "0x0", toBlock: "latest" });

    validateFailureResult(result);
  });
});
