/* biome-ignore-all lint/suspicious/noExplicitAny: <TODO> */
// Hardhat Network RPC Types
// Chain ID: 31337
// Hardhat is fully compatible with Ethereum mainnet API plus hardhat_* and evm_* methods

// Re-export all types from Ethereum mainnet as they are identical
export type {
  BlockTag,
  BlockNumberOrTag,
  EthBlock as HardhatBlock,
  EthTransaction as HardhatTransaction,
  EthTransactionReceipt as HardhatTransactionReceipt,
  EthLog as HardhatLog,
  EthLogFilter as HardhatLogFilter,
  EthCallObject as HardhatCallObject,
  EthWithdrawal as HardhatWithdrawal,
  EthSyncingStatus as HardhatSyncingStatus,
  AccessListEntry,
  JsonRpcRequest,
  JsonRpcResponse,
} from "../1/EthereumTypes.js";

// ===== Hardhat-Specific Types =====

/**
 * Return type for hardhat_metadata
 */
export interface HardhatMetadata {
  clientVersion: string;
  chainId: number;
  instanceId: string;
  latestBlockNumber: number;
  latestBlockHash: string;
  forkedNetwork: HardhatForkedNetworkInfo | null;
}

/**
 * Forked network information returned by hardhat_metadata
 */
export interface HardhatForkedNetworkInfo {
  chainId: number;
  forkBlockNumber: number;
  forkBlockHash: string;
}

/**
 * Options for hardhat_reset
 */
export interface HardhatResetOptions {
  forking?: {
    jsonRpcUrl: string;
    blockNumber?: number;
  };
}

/**
 * Parameters for hardhat_addCompilationResult
 */
export interface HardhatCompilationResult {
  solcVersion: string;
  input: Record<string, any>;
  output: Record<string, any>;
}
