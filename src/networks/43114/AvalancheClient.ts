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
  BlockNumberOrTag,
  AvalancheAccessListEntry,
  AvalancheSyncingStatus,
  AvalancheAdminNodeInfo,
  AvalancheAdminPeerInfo,
  AvaxAtomicTx,
  AvaxAtomicTxStatus,
  AvaxUTXOsResponse,
  AvaxIssueTxResponse,
  AvaxImportParams,
  AvaxExportParams,
} from "./AvalancheTypes.js";

/**
 * Avalanche C-Chain network client with typed methods
 * Chain ID: 43114
 * Uses composition to integrate strategies with Avalanche C-Chain RPC methods
 *
 * Documentation: https://docs.avax.network/api-reference/c-chain/api
 */
export class AvalancheClient extends NetworkClient {
  constructor(config: StrategyConfig) {
    super(config);
  }

  // ===== Avalanche C-Chain Specific Methods (avax.*) =====

  /**
   * Get an atomic transaction by its ID
   * @param txID - The transaction ID
   * @param encoding - The encoding format (e.g., "hex", "cb58")
   */
  async avaxGetAtomicTx(txID: string, encoding?: string): Promise<StrategyResult<AvaxAtomicTx>> {
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    const params: Record<string, any> = { txID };
    if (encoding !== undefined) params.encoding = encoding;
    return this.execute<AvaxAtomicTx>("avax.getAtomicTx", [params]);
  }

  /**
   * Get the status of an atomic transaction
   * @param txID - The transaction ID
   */
  async avaxGetAtomicTxStatus(txID: string): Promise<StrategyResult<AvaxAtomicTxStatus>> {
    return this.execute<AvaxAtomicTxStatus>("avax.getAtomicTxStatus", [{ txID }]);
  }

  /**
   * Get UTXOs for the given addresses
   * @param addresses - List of addresses to get UTXOs for
   * @param limit - Maximum number of UTXOs to return
   * @param sourceChain - Source chain ID
   * @param startIndex - Pagination start index
   * @param encoding - Encoding format
   */
  async avaxGetUTXOs(
    addresses: string[],
    limit: number,
    sourceChain?: string,
    startIndex?: { address: string; utxo: string },
    encoding?: string,
  ): Promise<StrategyResult<AvaxUTXOsResponse>> {
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    const params: Record<string, any> = { addresses, limit };
    if (sourceChain !== undefined) params.sourceChain = sourceChain;
    if (startIndex !== undefined) params.startIndex = startIndex;
    if (encoding !== undefined) params.encoding = encoding;
    return this.execute<AvaxUTXOsResponse>("avax.getUTXOs", [params]);
  }

  /**
   * Issue a signed transaction to the network
   * @param tx - The signed transaction
   * @param encoding - Encoding format
   */
  async avaxIssueTx(tx: string, encoding?: string): Promise<StrategyResult<AvaxIssueTxResponse>> {
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    const params: Record<string, any> = { tx };
    if (encoding !== undefined) params.encoding = encoding;
    return this.execute<AvaxIssueTxResponse>("avax.issueTx", [params]);
  }

  /**
   * Import AVAX from the X-Chain or P-Chain to the C-Chain
   * WARNING: This method requires username/password credentials sent in plaintext.
   * Only use with local/trusted nodes.
   * @param params - Import parameters including to, sourceChain, username, password
   */
  async avaxImport(params: AvaxImportParams): Promise<StrategyResult<string>> {
    return this.execute<string>("avax.import", [params]);
  }

  /**
   * Export AVAX from the C-Chain to the X-Chain or P-Chain
   * WARNING: This method requires username/password credentials sent in plaintext.
   * Only use with local/trusted nodes.
   * @param params - Export parameters including amount, assetID, to, username, password
   */
  async avaxExport(params: AvaxExportParams): Promise<StrategyResult<string>> {
    return this.execute<string>("avax.export", [params]);
  }

  // ===== Admin Methods =====

  /**
   * Add a peer to the node
   * @param enode - Enode URL of the peer
   */
  async adminAddPeer(enode: string): Promise<StrategyResult<boolean>> {
    return this.execute<boolean>("admin_addPeer", [enode]);
  }

  /**
   * Remove a peer from the node
   * @param enode - Enode URL of the peer
   */
  async adminRemovePeer(enode: string): Promise<StrategyResult<boolean>> {
    return this.execute<boolean>("admin_removePeer", [enode]);
  }

  /**
   * Get information about connected peers
   */
  async adminPeers(): Promise<StrategyResult<AvalancheAdminPeerInfo[]>> {
    return this.execute<AvalancheAdminPeerInfo[]>("admin_peers");
  }

  /**
   * Get information about the node
   */
  async adminNodeInfo(): Promise<StrategyResult<AvalancheAdminNodeInfo>> {
    return this.execute<AvalancheAdminNodeInfo>("admin_nodeInfo");
  }

  /**
   * Set an alias for an API endpoint (Avalanche-specific)
   * @param endpoint - The original endpoint
   * @param alias - The alias to assign
   */
  async adminAlias(endpoint: string, alias: string): Promise<StrategyResult<null>> {
    return this.execute<null>("admin_alias", [endpoint, alias]);
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
   * Get list of addresses managed by the client/node
   */
  async accounts(): Promise<StrategyResult<string[]>> {
    return this.execute<string[]>("eth_accounts");
  }

  /**
   * Get the chain ID
   */
  async chainId(): Promise<StrategyResult<string>> {
    return this.execute<string>("eth_chainId");
  }

  /**
   * Get the coinbase address
   */
  async coinbase(): Promise<StrategyResult<string>> {
    return this.execute<string>("eth_coinbase");
  }

  /**
   * Get the protocol version
   */
  async protocolVersion(): Promise<StrategyResult<string>> {
    return this.execute<string>("eth_protocolVersion");
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

  /**
   * Get all transaction receipts for a given block
   * @param blockTag - Block number or tag
   */
  async getBlockReceipts(
    blockTag: BlockNumberOrTag,
  ): Promise<StrategyResult<AvalancheTransactionReceipt[] | null>> {
    return this.execute<AvalancheTransactionReceipt[] | null>("eth_getBlockReceipts", [blockTag]);
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

  async sendRawTransaction(signedTx: string): Promise<StrategyResult<string>> {
    return this.execute<string>("eth_sendRawTransaction", [signedTx]);
  }

  // biome-ignore lint/suspicious/noExplicitAny: <TODO>
  async sendTransaction(txObject: Record<string, any>): Promise<StrategyResult<string>> {
    return this.execute<string>("eth_sendTransaction", [txObject]);
  }

  /**
   * Sign data with a given address
   * @param address - Address to sign with
   * @param message - Data to sign
   */
  async sign(address: string, message: string): Promise<StrategyResult<string>> {
    return this.execute<string>("eth_sign", [address, message]);
  }

  /**
   * Sign a transaction without sending it
   * @param txObject - Transaction object
   */
  // biome-ignore lint/suspicious/noExplicitAny: <TODO>
  async signTransaction(txObject: Record<string, any>): Promise<StrategyResult<string>> {
    return this.execute<string>("eth_signTransaction", [txObject]);
  }

  /**
   * Sign typed data (EIP-712)
   * @param address - Address to sign with
   * @param typedData - EIP-712 typed data structure
   */
  async signTypedData(
    address: string,
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    typedData: Record<string, any>,
  ): Promise<StrategyResult<string>> {
    return this.execute<string>("eth_signTypedData", [address, typedData]);
  }

  /**
   * Sign typed data v4 (EIP-712)
   * @param address - Address to sign with
   * @param typedData - EIP-712 typed data structure
   */
  async signTypedDataV4(
    address: string,
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    typedData: Record<string, any>,
  ): Promise<StrategyResult<string>> {
    return this.execute<string>("eth_signTypedData_v4", [address, typedData]);
  }

  async callContract(
    callObject: AvalancheCallObject,
    blockTag?: BlockNumberOrTag,
  ): Promise<StrategyResult<string>> {
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    const params: any[] = [callObject];
    if (blockTag !== undefined) params.push(blockTag);
    return this.execute<string>("eth_call", params);
  }

  async estimateGas(
    txObject: AvalancheCallObject,
    blockTag?: BlockNumberOrTag,
  ): Promise<StrategyResult<string>> {
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    const params: any[] = [txObject];
    if (blockTag !== undefined) params.push(blockTag);
    return this.execute<string>("eth_estimateGas", params);
  }

  async createAccessList(
    txObject: AvalancheCallObject,
    blockTag?: BlockNumberOrTag,
  ): Promise<StrategyResult<{ accessList: AvalancheAccessListEntry[]; gasUsed: string }>> {
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    const params: any[] = [txObject];
    if (blockTag !== undefined) params.push(blockTag);
    return this.execute<{ accessList: AvalancheAccessListEntry[]; gasUsed: string }>(
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

  // biome-ignore lint/suspicious/noExplicitAny: <TODO>
  async getFilterChanges(filterId: string): Promise<StrategyResult<any[]>> {
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
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
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
  ): Promise<StrategyResult<any>> {
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    const params: any[] = [blockCount, newestBlock];
    if (rewardPercentiles !== undefined) params.push(rewardPercentiles);
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    return this.execute<any>("eth_feeHistory", params);
  }

  // ===== Deprecated / Legacy =====

  async mining(): Promise<StrategyResult<boolean>> {
    return this.execute<boolean>("eth_mining");
  }

  async hashRate(): Promise<StrategyResult<string>> {
    return this.execute<string>("eth_hashrate");
  }

  // ===== TxPool Methods =====

  async status(): Promise<StrategyResult<{ pending: string; queued: string }>> {
    return this.execute<{ pending: string; queued: string }>("txpool_status");
  }

  // biome-ignore lint/suspicious/noExplicitAny: <TODO>
  async content(): Promise<StrategyResult<Record<string, any>>> {
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    return this.execute<Record<string, any>>("txpool_content");
  }

  /**
   * Get txpool content filtered by a specific sender address
   * @param address - The sender address to filter by
   */
  // biome-ignore lint/suspicious/noExplicitAny: <TODO>
  async contentFrom(address: string): Promise<StrategyResult<Record<string, any>>> {
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    return this.execute<Record<string, any>>("txpool_contentFrom", [address]);
  }

  // biome-ignore lint/suspicious/noExplicitAny: <TODO>
  async inspect(): Promise<StrategyResult<Record<string, any>>> {
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    return this.execute<Record<string, any>>("txpool_inspect");
  }

  // ===== Debug Methods =====

  async debugTraceTransaction(
    txHash: string,
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    options: Record<string, any> = {},
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
  ): Promise<StrategyResult<any>> {
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    return this.execute<any>("debug_traceTransaction", [txHash, options]);
  }

  async debugTraceCall(
    callObject: AvalancheCallObject,
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    options: Record<string, any>,
    blockTag?: BlockNumberOrTag,
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
  ): Promise<StrategyResult<any>> {
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    const params: any[] = [callObject, options];
    if (blockTag !== undefined) params.push(blockTag);
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    return this.execute<any>("debug_traceCall", params);
  }

  /**
   * Trace a block by its RLP-encoded form
   * @param blockRlp - RLP-encoded block
   * @param options - Trace options
   */
  async debugTraceBlock(
    blockRlp: string,
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    options?: Record<string, any>,
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
  ): Promise<StrategyResult<any>> {
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    const params: any[] = [blockRlp];
    if (options !== undefined) params.push(options);
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    return this.execute<any>("debug_traceBlock", params);
  }

  /**
   * Trace a block by its hash
   * @param blockHash - Block hash
   * @param options - Trace options
   */
  async debugTraceBlockByHash(
    blockHash: string,
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    options?: Record<string, any>,
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
  ): Promise<StrategyResult<any>> {
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    const params: any[] = [blockHash];
    if (options !== undefined) params.push(options);
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    return this.execute<any>("debug_traceBlockByHash", params);
  }

  /**
   * Trace a block by its number
   * @param blockTag - Block number or tag
   * @param options - Trace options
   */
  async debugTraceBlockByNumber(
    blockTag: BlockNumberOrTag,
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    options?: Record<string, any>,
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
  ): Promise<StrategyResult<any>> {
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    const params: any[] = [blockTag];
    if (options !== undefined) params.push(options);
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    return this.execute<any>("debug_traceBlockByNumber", params);
  }

  /**
   * Trace a block from a file
   * @param file - Path to the block file
   * @param options - Trace options
   */
  async debugTraceBlockFromFile(
    file: string,
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    options?: Record<string, any>,
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
  ): Promise<StrategyResult<any>> {
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    const params: any[] = [file];
    if (options !== undefined) params.push(options);
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    return this.execute<any>("debug_traceBlockFromFile", params);
  }

  /**
   * Trace a bad block by its hash
   * @param blockHash - Hash of the bad block
   * @param options - Trace options
   */
  async debugTraceBadBlock(
    blockHash: string,
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    options?: Record<string, any>,
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
  ): Promise<StrategyResult<any>> {
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    const params: any[] = [blockHash];
    if (options !== undefined) params.push(options);
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    return this.execute<any>("debug_traceBadBlock", params);
  }

  /**
   * Trace a chain of blocks
   * @param startBlock - Start block number
   * @param endBlock - End block number
   * @param options - Trace options
   */
  async debugTraceChain(
    startBlock: string,
    endBlock: string,
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    options?: Record<string, any>,
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
  ): Promise<StrategyResult<any>> {
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    const params: any[] = [startBlock, endBlock];
    if (options !== undefined) params.push(options);
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    return this.execute<any>("debug_traceChain", params);
  }

  /**
   * Get bad blocks cached by the node
   */
  // biome-ignore lint/suspicious/noExplicitAny: <TODO>
  async debugGetBadBlocks(): Promise<StrategyResult<any>> {
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    return this.execute<any>("debug_getBadBlocks");
  }

  /**
   * Get accounts modified by hash
   * @param blockHash - Block hash
   */
  // biome-ignore lint/suspicious/noExplicitAny: <TODO>
  async getModifiedAccountsByHash(blockHash: string): Promise<StrategyResult<any>> {
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    return this.execute<any>("debug_getModifiedAccountsByHash", [blockHash]);
  }

  /**
   * Get accounts modified by number
   * @param blockNumber - Block number
   */
  // biome-ignore lint/suspicious/noExplicitAny: <TODO>
  async getModifiedAccountsByNumber(blockNumber: string): Promise<StrategyResult<any>> {
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    return this.execute<any>("debug_getModifiedAccountsByNumber", [blockNumber]);
  }

  async storageRangeAt(
    blockHash: string,
    txIndex: number,
    address: string,
    startKey: string,
    maxResults: number,
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
  ): Promise<StrategyResult<any>> {
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    return this.execute<any>("debug_storageRangeAt", [
      blockHash,
      txIndex,
      address,
      startKey,
      maxResults,
    ]);
  }

  /**
   * Get the intermediate state trie roots of a block
   * @param blockHash - Block hash
   * @param options - Trace options
   */
  async debugIntermediateRoots(
    blockHash: string,
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    options?: Record<string, any>,
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
  ): Promise<StrategyResult<any>> {
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    const params: any[] = [blockHash];
    if (options !== undefined) params.push(options);
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    return this.execute<any>("debug_intermediateRoots", params);
  }

  async accountRange(
    blockTag: BlockNumberOrTag,
    start: string,
    maxResults: number,
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
  ): Promise<StrategyResult<any>> {
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    return this.execute<any>("debug_accountRange", [blockTag, start, maxResults]);
  }

  /**
   * Dump the state of a block
   * @param blockTag - Block number or tag
   */
  // biome-ignore lint/suspicious/noExplicitAny: <TODO>
  async debugDumpBlock(blockTag: BlockNumberOrTag): Promise<StrategyResult<any>> {
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    return this.execute<any>("debug_dumpBlock", [blockTag]);
  }

  /**
   * Set the logging verbosity level
   * @param level - Verbosity level
   */
  async debugVerbosity(level: number): Promise<StrategyResult<null>> {
    return this.execute<null>("debug_verbosity", [level]);
  }

  /**
   * Get memory statistics
   */
  // biome-ignore lint/suspicious/noExplicitAny: <TODO>
  async debugMemStats(): Promise<StrategyResult<any>> {
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    return this.execute<any>("debug_memStats");
  }

  /**
   * Get garbage collection statistics
   */
  // biome-ignore lint/suspicious/noExplicitAny: <TODO>
  async debugGcStats(): Promise<StrategyResult<any>> {
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    return this.execute<any>("debug_gcStats");
  }

  /**
   * Set the garbage collection target percentage
   * @param percent - Target GC percentage
   */
  // biome-ignore lint/suspicious/noExplicitAny: <TODO>
  async debugSetGCPercent(percent: number): Promise<StrategyResult<any>> {
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    return this.execute<any>("debug_setGCPercent", [percent]);
  }

  /**
   * Get node metrics
   * @param raw - Whether to return raw metrics
   */
  // biome-ignore lint/suspicious/noExplicitAny: <TODO>
  async debugMetrics(raw?: boolean): Promise<StrategyResult<any>> {
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    const params: any[] = [];
    if (raw !== undefined) params.push(raw);
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    return this.execute<any>("debug_metrics", params);
  }
}
