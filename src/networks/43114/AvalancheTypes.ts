/* biome-ignore-all lint/suspicious/noExplicitAny: <TODO> */
// Avalanche C-Chain RPC Types
// Avalanche C-Chain is EVM-compatible and shares the same base types as Ethereum

export type BlockTag = "latest" | "earliest" | "pending" | "finalized" | "safe";
export type BlockNumberOrTag = string | BlockTag;

// Block Types
export interface AvalancheBlock {
  number: string; // hex-encoded block number
  hash: string;
  parentHash: string;
  nonce: string;
  sha3Uncles: string;
  logsBloom: string;
  transactionsRoot: string;
  stateRoot: string;
  receiptsRoot: string;
  miner: string;
  difficulty: string;
  totalDifficulty?: string;
  extraData: string;
  size: string;
  gasLimit: string;
  gasUsed: string;
  timestamp: string;
  transactions: string[] | AvalancheTransaction[]; // transaction hashes or full objects
  uncles: string[];
  baseFeePerGas?: string; // EIP-1559
  mixHash?: string;
  withdrawalsRoot?: string;
  withdrawals?: AvalancheWithdrawal[];
}

// Transaction Types
export interface AvalancheTransaction {
  hash: string;
  nonce: string;
  blockHash: string | null;
  blockNumber: string | null;
  transactionIndex: string | null;
  from: string;
  to: string | null;
  value: string;
  gasPrice?: string;
  maxFeePerGas?: string; // EIP-1559
  maxPriorityFeePerGas?: string; // EIP-1559
  maxFeePerBlobGas?: string; // EIP-4844
  blobVersionedHashes?: string[]; // EIP-4844
  gas: string;
  input: string;
  type: string; // "0x0" (legacy), "0x1" (EIP-2930), "0x2" (EIP-1559), "0x3" (EIP-4844)
  accessList?: AvalancheAccessListEntry[]; // EIP-2930
  chainId?: string;
  v: string;
  r: string;
  s: string;
  yParity?: string; // EIP-2930/EIP-1559
}

export interface AvalancheAccessListEntry {
  address: string;
  storageKeys: string[];
}

export interface AvalancheTransactionReceipt {
  transactionHash: string;
  transactionIndex: string;
  blockHash: string;
  blockNumber: string;
  from: string;
  to: string | null;
  cumulativeGasUsed: string;
  effectiveGasPrice?: string; // EIP-1559
  gasUsed: string;
  blobGasUsed?: string; // EIP-4844
  blobGasPrice?: string; // EIP-4844
  contractAddress: string | null; // if contract creation
  logs: AvalancheLog[];
  logsBloom: string;
  type: string; // "0x0", "0x1", "0x2", or "0x3"
  root?: string; // pre-Byzantium
  status?: string; // post-Byzantium: "0x0" (failure) or "0x1" (success)
}

// Log Types
export interface AvalancheLog {
  removed: boolean;
  logIndex: string;
  transactionIndex: string;
  transactionHash: string;
  blockHash: string;
  blockNumber: string;
  address: string;
  data: string;
  topics: string[];
}

export interface AvalancheLogFilter {
  fromBlock?: BlockNumberOrTag;
  toBlock?: BlockNumberOrTag;
  address?: string | string[];
  topics?: (string | string[] | null)[];
  blockHash?: string; // alternative to fromBlock/toBlock
}

// Call/Transaction Object Types
export interface AvalancheCallObject {
  from?: string;
  to?: string;
  gas?: string;
  gasPrice?: string;
  maxFeePerGas?: string; // EIP-1559
  maxPriorityFeePerGas?: string; // EIP-1559
  maxFeePerBlobGas?: string; // EIP-4844
  blobVersionedHashes?: string[]; // EIP-4844
  value?: string;
  data?: string;
  accessList?: AvalancheAccessListEntry[]; // EIP-2930
  type?: string; // "0x0", "0x1", or "0x2"
  nonce?: string;
  chainId?: string;
}

export interface AvalancheWithdrawal {
  index: string;
  validatorIndex: string;
  address: string;
  amount: string;
}

// eth_syncing return type
export interface AvalancheSyncingStatus {
  startingBlock: string;
  currentBlock: string;
  highestBlock: string;
}

// eth_feeHistory (EIP-1559) response
export interface AvalancheFeeHistory {
  oldestBlock: string;
  baseFeePerGas: string[];
  gasUsedRatio: number[];
  reward?: (string | null)[][];
}

// ===== TxPool Types =====

export type AvalancheTxPoolContent = Record<string, Record<string, AvalancheTransaction>>; // sender => nonce => tx
export interface AvalancheTxPoolStatus {
  pending: string;
  queued: string;
}

// ===== Avalanche-Specific Types =====

// avax.getAtomicTx return type
export interface AvaxAtomicTx {
  tx: string;
  encoding: string;
  blockHeight: string;
}

// avax.getAtomicTxStatus return type
export type AvaxAtomicTxStatusValue = "Accepted" | "Processing" | "Dropped" | "Unknown";
export interface AvaxAtomicTxStatus {
  status: AvaxAtomicTxStatusValue;
  blockHeight?: string;
}

// avax.getUTXOs return type
export interface AvaxUTXOsResponse {
  numFetched: string;
  utxos: string[];
  endIndex: {
    address: string;
    utxo: string;
  };
  encoding: string;
}

// avax.issueTx return type
export interface AvaxIssueTxResponse {
  txID: string;
}

// avax.import params
export interface AvaxImportParams {
  to: string;
  sourceChain: string;
  username: string;
  password: string;
}

// avax.export params
export interface AvaxExportParams {
  amount: number;
  assetID: string;
  to: string;
  username: string;
  password: string;
}

// ===== Admin Types =====

// admin_nodeInfo return type
export interface AvalancheAdminNodeInfo {
  id: string;
  name: string;
  enode: string;
  enr: string;
  ip: string;
  ports: {
    discovery: number;
    listener: number;
  };
  listenAddr: string;
  protocols: Record<string, any>;
}

// admin_peers return type
export interface AvalancheAdminPeerInfo {
  id: string;
  name: string;
  enode: string;
  enr: string;
  caps: string[];
  network: {
    localAddress: string;
    remoteAddress: string;
    inbound: boolean;
    trusted: boolean;
    static: boolean;
  };
  protocols: Record<string, any>;
}
