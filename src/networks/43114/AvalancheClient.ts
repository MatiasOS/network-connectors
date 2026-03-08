/* biome-ignore-all lint/suspicious/noExplicitAny: <TODO> */
import { NetworkClient } from "../../NetworkClient.js";
import type { StrategyResult } from "../../strategies/strategiesTypes.js";
import type { StrategyConfig } from "../../strategies/requestStrategy.js";
import type {
  AvalancheBlock,
  AvalancheTransaction,
  AvalancheTransactionReceipt,
  AvalancheLog,
  AvalancheLogFilter,
  AvalancheCallObject,
  AvalancheSyncingStatus,
  AvalancheChainConfig,
  AvalancheCallDetailedResult,
  AvalancheBadBlock,
  AvalancheSuggestPriceOptions,
  BlockNumberOrTag,
  AccessListEntry,
} from "./AvalancheTypes.js";

/**
 * Avalanche C-Chain network client with typed methods
 * Chain ID: 43114
 *
 * Avalanche C-Chain is an EVM-compatible smart contract platform with high throughput.
 * It supports all standard Ethereum RPC methods plus Avalanche-specific extensions
 * like eth_baseFee, eth_getChainConfig, eth_callDetailed, and eth_suggestPriceOptions.
 *
 * Uses composition to integrate strategies with Ethereum and Avalanche RPC methods.
 */
export class AvalancheClient extends NetworkClient {
  constructor(config: StrategyConfig) {
    super(config);
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
   * Returns 0xa86a (43114) for Avalanche C-Chain
   */
  async chainId(): Promise<StrategyResult<string>> {
    return this.execute<string>("eth_chainId");
  }

  /**
   * Get syncing status
   * Returns false if not syncing, or an object with sync progress if syncing
   */
  async syncing(): Promise<StrategyResult<boolean | AvalancheSyncingStatus>> {
    return this.execute<boolean | AvalancheSyncingStatus>("eth_syncing");
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
  ): Promise<StrategyResult<AvalancheBlock | null>> {
    return this.execute<AvalancheBlock | null>("eth_getBlockByNumber", [blockTag, fullTx]);
  }

  async getBlockByHash(
    blockHash: string,
    fullTx: boolean = false,
  ): Promise<StrategyResult<AvalancheBlock | null>> {
    return this.execute<AvalancheBlock | null>("eth_getBlockByHash", [blockHash, fullTx]);
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
  ): Promise<StrategyResult<AvalancheBlock | null>> {
    return this.execute<AvalancheBlock | null>("eth_getUncleByBlockNumberAndIndex", [
      blockTag,
      index,
    ]);
  }

  async getUncleByBlockHashAndIndex(
    blockHash: string,
    index: string,
  ): Promise<StrategyResult<AvalancheBlock | null>> {
    return this.execute<AvalancheBlock | null>("eth_getUncleByBlockHashAndIndex", [
      blockHash,
      index,
    ]);
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
    callObject: AvalancheCallObject,
    blockTag?: BlockNumberOrTag,
  ): Promise<StrategyResult<string>> {
    const params: any[] = [callObject];
    if (blockTag !== undefined) params.push(blockTag);
    return this.execute<string>("eth_call", params);
  }

  async estimateGas(
    txObject: AvalancheCallObject,
    blockTag?: BlockNumberOrTag,
  ): Promise<StrategyResult<string>> {
    const params: any[] = [txObject];
    if (blockTag !== undefined) params.push(blockTag);
    return this.execute<string>("eth_estimateGas", params);
  }

  async createAccessList(
    txObject: AvalancheCallObject,
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

  async getTransactionByHash(txHash: string): Promise<StrategyResult<AvalancheTransaction | null>> {
    return this.execute<AvalancheTransaction | null>("eth_getTransactionByHash", [txHash]);
  }

  async getTransactionByBlockHashAndIndex(
    blockHash: string,
    index: string,
  ): Promise<StrategyResult<AvalancheTransaction | null>> {
    return this.execute<AvalancheTransaction | null>("eth_getTransactionByBlockHashAndIndex", [
      blockHash,
      index,
    ]);
  }

  async getTransactionByBlockNumberAndIndex(
    blockTag: BlockNumberOrTag,
    index: string,
  ): Promise<StrategyResult<AvalancheTransaction | null>> {
    return this.execute<AvalancheTransaction | null>("eth_getTransactionByBlockNumberAndIndex", [
      blockTag,
      index,
    ]);
  }

  async getTransactionReceipt(
    txHash: string,
  ): Promise<StrategyResult<AvalancheTransactionReceipt | null>> {
    return this.execute<AvalancheTransactionReceipt | null>("eth_getTransactionReceipt", [txHash]);
  }

  // ===== Logs & Filters =====

  async newFilter(filterObject: AvalancheLogFilter): Promise<StrategyResult<string>> {
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

  async getFilterLogs(filterId: string): Promise<StrategyResult<AvalancheLog[]>> {
    return this.execute<AvalancheLog[]>("eth_getFilterLogs", [filterId]);
  }

  async getLogs(filterObject: AvalancheLogFilter): Promise<StrategyResult<AvalancheLog[]>> {
    return this.execute<AvalancheLog[]>("eth_getLogs", [filterObject]);
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

  // ===== Avalanche-specific Eth Extensions =====

  /**
   * Get the base fee for the next block (Avalanche extension)
   * @returns Hex value of base fee
   */
  async baseFee(): Promise<StrategyResult<string>> {
    return this.execute<string>("eth_baseFee");
  }

  /**
   * Get the chain configuration (Avalanche extension)
   * @returns Chain config object with network parameters
   */
  async getChainConfig(): Promise<StrategyResult<AvalancheChainConfig>> {
    return this.execute<AvalancheChainConfig>("eth_getChainConfig");
  }

  /**
   * Execute a call with detailed result (Avalanche extension)
   * Returns gas used, error code, error message, and return data
   * @param callObject - The call object
   * @param blockTag - Block number or tag
   * @param stateOverrides - Optional state overrides
   */
  async callDetailed(
    callObject: AvalancheCallObject,
    blockTag?: BlockNumberOrTag,
    stateOverrides?: Record<string, any>,
  ): Promise<StrategyResult<AvalancheCallDetailedResult>> {
    const params: any[] = [callObject];
    if (blockTag !== undefined) params.push(blockTag);
    if (stateOverrides !== undefined) params.push(stateOverrides);
    return this.execute<AvalancheCallDetailedResult>("eth_callDetailed", params);
  }

  /**
   * Get bad blocks (Avalanche extension)
   * @returns Array of bad block objects with hash, block, rlp, and reason
   */
  async getBadBlocks(): Promise<StrategyResult<AvalancheBadBlock[]>> {
    return this.execute<AvalancheBadBlock[]>("eth_getBadBlocks");
  }

  /**
   * Get suggested price options (Avalanche extension)
   * Returns slow/normal/fast pricing tiers with maxPriorityFeePerGas and maxFeePerGas
   */
  async suggestPriceOptions(): Promise<StrategyResult<AvalancheSuggestPriceOptions>> {
    return this.execute<AvalancheSuggestPriceOptions>("eth_suggestPriceOptions");
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
    callObject: AvalancheCallObject,
    options: Record<string, any>,
    blockTag?: BlockNumberOrTag,
  ): Promise<StrategyResult<any>> {
    const params: any[] = [callObject, options];
    if (blockTag !== undefined) params.push(blockTag);
    return this.execute<any>("debug_traceCall", params);
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
    callObject: AvalancheCallObject,
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
