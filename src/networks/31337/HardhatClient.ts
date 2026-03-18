/* biome-ignore-all lint/suspicious/noExplicitAny: <TODO> */
import { NetworkClient } from "../../NetworkClient.js";
import type { StrategyResult } from "../../strategies/strategiesTypes.js";
import type { StrategyConfig } from "../../strategies/requestStrategy.js";
import type {
  HardhatBlock,
  HardhatTransaction,
  HardhatTransactionReceipt,
  HardhatLog,
  HardhatLogFilter,
  HardhatCallObject,
  HardhatMetadata,
  HardhatResetOptions,
  BlockNumberOrTag,
  AccessListEntry,
  HardhatSyncingStatus,
} from "./HardhatTypes.js";

/**
 * Hardhat Network client with typed methods
 * Chain ID: 31337
 *
 * Hardhat is a local Ethereum development network that supports all standard
 * Ethereum RPC methods plus Hardhat-specific methods (hardhat_*) for
 * manipulating the local blockchain state and EVM methods (evm_*) for
 * controlling mining and time.
 *
 * Uses composition to integrate strategies with Ethereum RPC methods.
 */
export class HardhatClient extends NetworkClient {
  constructor(config: StrategyConfig) {
    super(config);
  }

  // ===== Hardhat-Specific Methods =====

  /**
   * Add compilation result metadata (internal use)
   * @param solcVersion - Solidity compiler version
   * @param input - Compiler input
   * @param output - Compiler output
   */
  async addCompilationResult(
    solcVersion: string,
    input: Record<string, any>,
    output: Record<string, any>,
  ): Promise<StrategyResult<boolean>> {
    return this.execute<boolean>("hardhat_addCompilationResult", [solcVersion, input, output]);
  }

  /**
   * Remove a pending transaction from the mempool
   * @param txHash - Transaction hash to drop
   * @returns true if the transaction was found and removed
   */
  async dropTransaction(txHash: string): Promise<StrategyResult<boolean>> {
    return this.execute<boolean>("hardhat_dropTransaction", [txHash]);
  }

  /**
   * Check if automatic mining is enabled
   * @returns true if automine is enabled
   */
  async getAutomine(): Promise<StrategyResult<boolean>> {
    return this.execute<boolean>("hardhat_getAutomine");
  }

  /**
   * Impersonate an account, allowing transactions to be sent as that address
   * @param address - Address to impersonate
   */
  async impersonateAccount(address: string): Promise<StrategyResult<boolean>> {
    return this.execute<boolean>("hardhat_impersonateAccount", [address]);
  }

  /**
   * Get metadata about the Hardhat Network instance
   * @returns Metadata including clientVersion, chainId, instanceId, and fork info
   */
  async metadata(): Promise<StrategyResult<HardhatMetadata>> {
    return this.execute<HardhatMetadata>("hardhat_metadata");
  }

  /**
   * Mine one or more blocks
   * @param blockCount - Number of blocks to mine (hex-encoded, default "0x1")
   * @param interval - Time interval between blocks in seconds (hex-encoded, default "0x1")
   */
  async mine(blockCount?: string, interval?: string): Promise<StrategyResult<string>> {
    const params: any[] = [];
    if (blockCount !== undefined) params.push(blockCount);
    if (interval !== undefined) {
      if (blockCount === undefined) params.push("0x1");
      params.push(interval);
    }
    return this.execute<string>("hardhat_mine", params);
  }

  /**
   * Reset the network to a fresh state or fork from a different block
   * @param options - Optional reset configuration with forking parameters
   */
  async reset(options?: HardhatResetOptions): Promise<StrategyResult<boolean>> {
    const params: any[] = [];
    if (options !== undefined) params.push(options);
    return this.execute<boolean>("hardhat_reset", params);
  }

  /**
   * Set the balance of an account
   * @param address - Account address
   * @param balance - New balance in wei (hex-encoded)
   */
  async setBalance(address: string, balance: string): Promise<StrategyResult<boolean>> {
    return this.execute<boolean>("hardhat_setBalance", [address, balance]);
  }

  /**
   * Set the bytecode at an address
   * @param address - Contract address
   * @param bytecode - New bytecode (hex-encoded)
   */
  async setCode(address: string, bytecode: string): Promise<StrategyResult<boolean>> {
    return this.execute<boolean>("hardhat_setCode", [address, bytecode]);
  }

  /**
   * Set the coinbase address for block rewards
   * @param address - New coinbase address
   */
  async setCoinbase(address: string): Promise<StrategyResult<boolean>> {
    return this.execute<boolean>("hardhat_setCoinbase", [address]);
  }

  /**
   * Enable or disable RPC method logging
   * @param enabled - Whether to enable logging
   */
  async setLoggingEnabled(enabled: boolean): Promise<StrategyResult<boolean>> {
    return this.execute<boolean>("hardhat_setLoggingEnabled", [enabled]);
  }

  /**
   * Set the minimum gas price accepted by the network
   * @param gasPrice - Minimum gas price in wei (hex-encoded)
   */
  async setMinGasPrice(gasPrice: string): Promise<StrategyResult<boolean>> {
    return this.execute<boolean>("hardhat_setMinGasPrice", [gasPrice]);
  }

  /**
   * Set the base fee for the next mined block (EIP-1559)
   * @param baseFee - Base fee in wei (hex-encoded)
   */
  async setNextBlockBaseFeePerGas(baseFee: string): Promise<StrategyResult<boolean>> {
    return this.execute<boolean>("hardhat_setNextBlockBaseFeePerGas", [baseFee]);
  }

  /**
   * Set the PREVRANDAO value for the next mined block
   * @param value - PREVRANDAO value (hex-encoded)
   */
  async setPrevRandao(value: string): Promise<StrategyResult<boolean>> {
    return this.execute<boolean>("hardhat_setPrevRandao", [value]);
  }

  /**
   * Set the nonce of an account (can only increase, not decrease)
   * @param address - Account address
   * @param nonce - New nonce (hex-encoded)
   */
  async setNonce(address: string, nonce: string): Promise<StrategyResult<boolean>> {
    return this.execute<boolean>("hardhat_setNonce", [address, nonce]);
  }

  /**
   * Write a 32-byte value to a specific storage position in a contract
   * @param address - Contract address
   * @param position - Storage position index (hex-encoded)
   * @param value - 32-byte value to write (hex-encoded)
   */
  async setStorageAt(
    address: string,
    position: string,
    value: string,
  ): Promise<StrategyResult<boolean>> {
    return this.execute<boolean>("hardhat_setStorageAt", [address, position, value]);
  }

  /**
   * Stop impersonating an account
   * @param address - Address to stop impersonating
   */
  async stopImpersonatingAccount(address: string): Promise<StrategyResult<boolean>> {
    return this.execute<boolean>("hardhat_stopImpersonatingAccount", [address]);
  }

  // ===== EVM Methods =====

  /**
   * Move forward in time by the specified number of seconds
   * @param seconds - Number of seconds to increase time by
   * @returns Total time adjustment in seconds
   */
  async evmIncreaseTime(seconds: number): Promise<StrategyResult<number>> {
    return this.execute<number>("evm_increaseTime", [seconds]);
  }

  /**
   * Mine a single block including pending transactions
   */
  async evmMine(): Promise<StrategyResult<string>> {
    return this.execute<string>("evm_mine");
  }

  /**
   * Revert the blockchain to a previous snapshot
   * @param snapshotId - Snapshot ID returned by evm_snapshot
   * @returns true if the revert was successful
   */
  async evmRevert(snapshotId: string): Promise<StrategyResult<boolean>> {
    return this.execute<boolean>("evm_revert", [snapshotId]);
  }

  /**
   * Enable or disable automatic mining
   * @param enabled - true to enable automine, false to disable
   */
  async evmSetAutomine(enabled: boolean): Promise<StrategyResult<boolean>> {
    return this.execute<boolean>("evm_setAutomine", [enabled]);
  }

  /**
   * Set the block gas limit for subsequently mined blocks
   * @param gasLimit - New block gas limit
   */
  async evmSetBlockGasLimit(gasLimit: number): Promise<StrategyResult<boolean>> {
    return this.execute<boolean>("evm_setBlockGasLimit", [gasLimit]);
  }

  /**
   * Enable interval-based mining (blocks mined at regular intervals)
   * @param milliseconds - Mining interval in milliseconds (0 to disable)
   */
  async evmSetIntervalMining(milliseconds: number): Promise<StrategyResult<boolean>> {
    return this.execute<boolean>("evm_setIntervalMining", [milliseconds]);
  }

  /**
   * Set the exact timestamp for the next mined block
   * @param timestamp - Unix timestamp in seconds
   */
  async evmSetNextBlockTimestamp(timestamp: number): Promise<StrategyResult<boolean>> {
    return this.execute<boolean>("evm_setNextBlockTimestamp", [timestamp]);
  }

  /**
   * Create a snapshot of the current blockchain state
   * @returns Snapshot ID that can be used with evmRevert
   */
  async evmSnapshot(): Promise<StrategyResult<string>> {
    return this.execute<string>("evm_snapshot");
  }

  // ===== Web3 Methods =====

  /**
   * Get the client version
   */
  async clientVersion(): Promise<StrategyResult<string>> {
    return this.execute<string>("web3_clientVersion");
  }

  /**
   * Calculate Keccak-256 hash
   * @param data - Data to hash
   */
  async sha3(data: string): Promise<StrategyResult<string>> {
    return this.execute<string>("web3_sha3", [data]);
  }

  // ===== Net Methods =====

  /**
   * Get the network ID
   */
  async version(): Promise<StrategyResult<string>> {
    return this.execute<string>("net_version");
  }

  /**
   * Check if the node is listening for connections
   */
  async listening(): Promise<StrategyResult<boolean>> {
    return this.execute<boolean>("net_listening");
  }

  /**
   * Get the number of connected peers
   */
  async peerCount(): Promise<StrategyResult<string>> {
    return this.execute<string>("net_peerCount");
  }

  // ===== Eth Methods =====

  /**
   * Get the chain ID
   * Returns 0x7a69 (31337) for Hardhat network
   */
  async chainId(): Promise<StrategyResult<string>> {
    return this.execute<string>("eth_chainId");
  }

  /**
   * Get syncing status
   * Returns false if not syncing, or an object with sync progress if syncing
   */
  async syncing(): Promise<StrategyResult<boolean | HardhatSyncingStatus>> {
    return this.execute<boolean | HardhatSyncingStatus>("eth_syncing");
  }

  /**
   * Get the current block number
   */
  async blockNumber(): Promise<StrategyResult<string>> {
    return this.execute<string>("eth_blockNumber");
  }

  async getBlockByNumber(
    blockTag: BlockNumberOrTag,
    fullTx: boolean = false,
  ): Promise<StrategyResult<HardhatBlock | null>> {
    return this.execute<HardhatBlock | null>("eth_getBlockByNumber", [blockTag, fullTx]);
  }

  async getBlockByHash(
    blockHash: string,
    fullTx: boolean = false,
  ): Promise<StrategyResult<HardhatBlock | null>> {
    return this.execute<HardhatBlock | null>("eth_getBlockByHash", [blockHash, fullTx]);
  }

  async getBlockTransactionCountByNumber(
    blockTag: BlockNumberOrTag,
  ): Promise<StrategyResult<string>> {
    return this.execute<string>("eth_getBlockTransactionCountByNumber", [blockTag]);
  }

  async getBlockTransactionCountByHash(blockHash: string): Promise<StrategyResult<string>> {
    return this.execute<string>("eth_getBlockTransactionCountByHash", [blockHash]);
  }

  async getUncleCountByBlockNumber(blockTag: BlockNumberOrTag): Promise<StrategyResult<string>> {
    return this.execute<string>("eth_getUncleCountByBlockNumber", [blockTag]);
  }

  async getUncleCountByBlockHash(blockHash: string): Promise<StrategyResult<string>> {
    return this.execute<string>("eth_getUncleCountByBlockHash", [blockHash]);
  }

  async getUncleByBlockNumberAndIndex(
    blockTag: BlockNumberOrTag,
    index: string,
  ): Promise<StrategyResult<HardhatBlock | null>> {
    return this.execute<HardhatBlock | null>("eth_getUncleByBlockNumberAndIndex", [
      blockTag,
      index,
    ]);
  }

  async getUncleByBlockHashAndIndex(
    blockHash: string,
    index: string,
  ): Promise<StrategyResult<HardhatBlock | null>> {
    return this.execute<HardhatBlock | null>("eth_getUncleByBlockHashAndIndex", [blockHash, index]);
  }

  async getBalance(
    address: string,
    blockTag: BlockNumberOrTag = "latest",
  ): Promise<StrategyResult<string>> {
    return this.execute<string>("eth_getBalance", [address, blockTag]);
  }

  async getCode(
    address: string,
    blockTag: BlockNumberOrTag = "latest",
  ): Promise<StrategyResult<string>> {
    return this.execute<string>("eth_getCode", [address, blockTag]);
  }

  async getStorageAt(
    address: string,
    position: string,
    blockTag: BlockNumberOrTag = "latest",
  ): Promise<StrategyResult<string>> {
    return this.execute<string>("eth_getStorageAt", [address, position, blockTag]);
  }

  async getTransactionCount(
    address: string,
    blockTag: BlockNumberOrTag = "latest",
  ): Promise<StrategyResult<string>> {
    return this.execute<string>("eth_getTransactionCount", [address, blockTag]);
  }

  async getProof(
    address: string,
    storageKeys: string[],
    blockTag: BlockNumberOrTag,
  ): Promise<StrategyResult<unknown>> {
    return this.execute<unknown>("eth_getProof", [address, storageKeys, blockTag]);
  }

  async sendRawTransaction(signedTx: string): Promise<StrategyResult<string>> {
    return this.execute<string>("eth_sendRawTransaction", [signedTx]);
  }

  async sendTransaction(txObject: Record<string, any>): Promise<StrategyResult<string>> {
    return this.execute<string>("eth_sendTransaction", [txObject]);
  }

  async call(
    callObject: HardhatCallObject,
    blockTag?: BlockNumberOrTag,
  ): Promise<StrategyResult<string>> {
    const params: any[] = [callObject];
    if (blockTag !== undefined) params.push(blockTag);
    return this.execute<string>("eth_call", params);
  }

  async estimateGas(
    txObject: HardhatCallObject,
    blockTag?: BlockNumberOrTag,
  ): Promise<StrategyResult<string>> {
    const params: any[] = [txObject];
    if (blockTag !== undefined) params.push(blockTag);
    return this.execute<string>("eth_estimateGas", params);
  }

  async createAccessList(
    txObject: HardhatCallObject,
    blockTag?: BlockNumberOrTag,
  ): Promise<StrategyResult<{ accessList: AccessListEntry[]; gasUsed: string }>> {
    const params: any[] = [txObject];
    if (blockTag !== undefined) params.push(blockTag);
    return this.execute<{ accessList: AccessListEntry[]; gasUsed: string }>(
      "eth_createAccessList",
      params,
    );
  }

  // ===== Block / Transaction Queries =====

  async getTransactionByHash(txHash: string): Promise<StrategyResult<HardhatTransaction | null>> {
    return this.execute<HardhatTransaction | null>("eth_getTransactionByHash", [txHash]);
  }

  async getTransactionByBlockHashAndIndex(
    blockHash: string,
    index: string,
  ): Promise<StrategyResult<HardhatTransaction | null>> {
    return this.execute<HardhatTransaction | null>("eth_getTransactionByBlockHashAndIndex", [
      blockHash,
      index,
    ]);
  }

  async getTransactionByBlockNumberAndIndex(
    blockTag: BlockNumberOrTag,
    index: string,
  ): Promise<StrategyResult<HardhatTransaction | null>> {
    return this.execute<HardhatTransaction | null>("eth_getTransactionByBlockNumberAndIndex", [
      blockTag,
      index,
    ]);
  }

  async getTransactionReceipt(
    txHash: string,
  ): Promise<StrategyResult<HardhatTransactionReceipt | null>> {
    return this.execute<HardhatTransactionReceipt | null>("eth_getTransactionReceipt", [txHash]);
  }

  // ===== Logs & Filters =====

  async newFilter(filterObject: HardhatLogFilter): Promise<StrategyResult<string>> {
    return this.execute<string>("eth_newFilter", [filterObject]);
  }

  async newBlockFilter(): Promise<StrategyResult<string>> {
    return this.execute<string>("eth_newBlockFilter");
  }

  async newPendingTransactionFilter(): Promise<StrategyResult<string>> {
    return this.execute<string>("eth_newPendingTransactionFilter");
  }

  async uninstallFilter(filterId: string): Promise<StrategyResult<boolean>> {
    return this.execute<boolean>("eth_uninstallFilter", [filterId]);
  }

  async getFilterChanges(filterId: string): Promise<StrategyResult<any[]>> {
    return this.execute<any[]>("eth_getFilterChanges", [filterId]);
  }

  async getFilterLogs(filterId: string): Promise<StrategyResult<HardhatLog[]>> {
    return this.execute<HardhatLog[]>("eth_getFilterLogs", [filterId]);
  }

  async getLogs(filterObject: HardhatLogFilter): Promise<StrategyResult<HardhatLog[]>> {
    return this.execute<HardhatLog[]>("eth_getLogs", [filterObject]);
  }

  // ===== Fees (EIP-1559) =====

  async gasPrice(): Promise<StrategyResult<string>> {
    return this.execute<string>("eth_gasPrice");
  }

  async maxPriorityFeePerGas(): Promise<StrategyResult<string>> {
    return this.execute<string>("eth_maxPriorityFeePerGas");
  }

  async feeHistory(
    blockCount: string,
    newestBlock: BlockNumberOrTag,
    rewardPercentiles?: number[],
  ): Promise<StrategyResult<any>> {
    const params: any[] = [blockCount, newestBlock];
    if (rewardPercentiles !== undefined) params.push(rewardPercentiles);
    return this.execute<any>("eth_feeHistory", params);
  }

  // ===== Deprecated / Legacy (post-Merge mostly unsupported) =====

  async mining(): Promise<StrategyResult<boolean>> {
    return this.execute<boolean>("eth_mining");
  }

  async hashRate(): Promise<StrategyResult<string>> {
    return this.execute<string>("eth_hashrate");
  }

  async getWork(): Promise<StrategyResult<string[]>> {
    return this.execute<string[]>("eth_getWork");
  }

  async submitWork(
    nonce: string,
    powHash: string,
    digest: string,
  ): Promise<StrategyResult<boolean>> {
    return this.execute<boolean>("eth_submitWork", [nonce, powHash, digest]);
  }

  async submitHashrate(hashrate: string, id: string): Promise<StrategyResult<boolean>> {
    return this.execute<boolean>("eth_submitHashrate", [hashrate, id]);
  }

  // ===== TxPool Methods =====

  async txPoolStatus(): Promise<StrategyResult<{ pending: string; queued: string }>> {
    return this.execute<{ pending: string; queued: string }>("txpool_status");
  }

  async txPoolContent(): Promise<StrategyResult<Record<string, any>>> {
    return this.execute<Record<string, any>>("txpool_content");
  }

  async txPoolInspect(): Promise<StrategyResult<Record<string, any>>> {
    return this.execute<Record<string, any>>("txpool_inspect");
  }

  // ===== Debug Methods =====

  async debugTraceTransaction(
    txHash: string,
    options: Record<string, any> = {},
  ): Promise<StrategyResult<any>> {
    return this.execute<any>("debug_traceTransaction", [txHash, options]);
  }

  async debugTraceCall(
    callObject: HardhatCallObject,
    blockTag: BlockNumberOrTag = "latest",
    options: Record<string, any> = {},
  ): Promise<StrategyResult<any>> {
    return this.execute<any>("debug_traceCall", [callObject, blockTag, options]);
  }

  async debugStorageRangeAt(
    blockHash: string,
    txIndex: number,
    address: string,
    startKey: string,
    maxResults: number,
  ): Promise<StrategyResult<any>> {
    return this.execute<any>("debug_storageRangeAt", [
      blockHash,
      txIndex,
      address,
      startKey,
      maxResults,
    ]);
  }

  async debugAccountRange(
    blockTag: BlockNumberOrTag,
    start: string,
    maxResults: number,
  ): Promise<StrategyResult<any>> {
    return this.execute<any>("debug_accountRange", [blockTag, start, maxResults]);
  }

  async debugGetModifiedAccountsByHash(blockHash: string): Promise<StrategyResult<any>> {
    return this.execute<any>("debug_getModifiedAccountsByHash", [blockHash]);
  }

  async debugGetModifiedAccountsByNumber(blockNumber: string): Promise<StrategyResult<any>> {
    return this.execute<any>("debug_getModifiedAccountsByNumber", [blockNumber]);
  }

  // ===== Trace Methods =====

  async traceBlock(blockNumber: string | number): Promise<StrategyResult<any>> {
    return this.execute<any>("trace_block", [blockNumber]);
  }

  async traceTransaction(txHash: string): Promise<StrategyResult<any>> {
    return this.execute<any>("trace_transaction", [txHash]);
  }

  async traceCall(
    callObject: HardhatCallObject,
    options: Record<string, any>,
    blockTag?: BlockNumberOrTag,
  ): Promise<StrategyResult<any>> {
    const params: any[] = [callObject, options];
    if (blockTag !== undefined) params.push(blockTag);
    return this.execute<any>("trace_call", params);
  }

  async traceRawTransaction(
    signedTx: string,
    options: Record<string, any>,
  ): Promise<StrategyResult<any>> {
    return this.execute<any>("trace_rawTransaction", [signedTx, options]);
  }

  async traceFilter(filter: Record<string, any>): Promise<StrategyResult<any>> {
    return this.execute<any>("trace_filter", [filter]);
  }
}
