/* biome-ignore-all lint/suspicious/noExplicitAny: <TODO> */
// Avalanche C-Chain RPC Types
// Chain ID: 43114
// Avalanche C-Chain is EVM-compatible with additional Avalanche-specific extensions

// Re-export base Ethereum types as Avalanche aliases (C-Chain is EVM-compatible)
export type {
  BlockTag,
  BlockNumberOrTag,
  EthBlock as AvalancheBlock,
  EthTransaction as AvalancheTransaction,
  EthTransactionReceipt as AvalancheTransactionReceipt,
  EthLog as AvalancheLog,
  EthLogFilter as AvalancheLogFilter,
  EthCallObject as AvalancheCallObject,
  EthWithdrawal as AvalancheWithdrawal,
  EthSyncingStatus as AvalancheSyncingStatus,
  AccessListEntry,
  JsonRpcRequest,
  JsonRpcResponse,
} from "../1/EthereumTypes.js";

// ===== Avalanche-specific types =====

/**
 * Response from eth_getChainConfig (Avalanche extension)
 * Returns the chain configuration
 */
export interface AvalancheChainConfig {
  chainId: number;
  homesteadBlock: number;
  eip150Block: number;
  eip155Block: number;
  eip158Block: number;
  byzantiumBlock: number;
  constantinopleBlock: number;
  petersburgBlock: number;
  istanbulBlock: number;
  muirGlacierBlock: number;
  [key: string]: any;
}

/**
 * Response from eth_callDetailed (Avalanche extension)
 * Returns detailed call result including gas and error info
 */
export interface AvalancheCallDetailedResult {
  gas: string;
  errCode: number;
  err: string;
  returnData: string;
}

/**
 * Bad block info from eth_getBadBlocks (Avalanche extension)
 */
export interface AvalancheBadBlock {
  hash: string;
  block: any;
  rlp: string;
  reason: string;
}

/**
 * Price tier from eth_suggestPriceOptions (Avalanche extension)
 */
export interface AvalanchePriceTier {
  maxPriorityFeePerGas: string;
  maxFeePerGas: string;
}

/**
 * Response from eth_suggestPriceOptions (Avalanche extension)
 */
export interface AvalancheSuggestPriceOptions {
  slow: AvalanchePriceTier;
  normal: AvalanchePriceTier;
  fast: AvalanchePriceTier;
}

// ===== Warp API types (Avalanche cross-chain messaging) =====

/**
 * Response from warp_getMessageAggregateSignature and warp_getBlockAggregateSignature
 * Contains the serialized signed warp message
 */
export interface AvalancheWarpSignedMessage {
  data: string;
}

// ===== Admin API types =====

/**
 * Response from admin_getVMConfig
 * Contains the VM configuration object
 */
export interface AvalancheVMConfig {
  config: Record<string, any>;
}

// ===== Avalanche-specific API types (avax.*) =====

/**
 * Start index for paginated UTXO queries
 */
export interface AvalancheUTXOIndex {
  address: string;
  utxo: string;
}

/**
 * Response from avax.getUTXOs
 */
export interface AvalancheGetUTXOsResponse {
  utxos: string[];
  endIndex: AvalancheUTXOIndex;
  numFetched: string;
  encoding: string;
}

/**
 * Response from avax.getAtomicTxStatus
 */
export interface AvalancheAtomicTxStatus {
  status: string;
  blockHeight?: number;
}

/**
 * Response from avax.getAtomicTx
 */
export interface AvalancheAtomicTx {
  tx: string;
  encoding: string;
  blockHeight?: number;
}
