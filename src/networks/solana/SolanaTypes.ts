/**
 * Solana RPC Types
 *
 * Type definitions for Solana JSON-RPC API responses.
 * Supports mainnet-beta, devnet, and testnet clusters.
 *
 * @see https://solana.com/docs/rpc
 */

// ─── Chain ID Constants (CAIP-2 format: solana:<first-32-chars-of-genesis-hash>) ───

/**
 * CAIP-2 chain ID for Solana Mainnet Beta
 */
export const SOLANA_MAINNET = "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp" as const;

/**
 * CAIP-2 chain ID for Solana Devnet
 */
export const SOLANA_DEVNET = "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1" as const;

/**
 * CAIP-2 chain ID for Solana Testnet
 */
export const SOLANA_TESTNET = "solana:4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z" as const;

/**
 * Union type of all supported Solana CAIP-2 chain IDs
 */
export type SolanaChainId = typeof SOLANA_MAINNET | typeof SOLANA_DEVNET | typeof SOLANA_TESTNET;

// ─── Common Config Types ───

/** Commitment levels for Solana RPC requests */
export type Commitment = "processed" | "confirmed" | "finalized";

/** Encoding formats for account data */
export type Encoding = "base58" | "base64" | "base64+zstd" | "jsonParsed";

/** Transaction detail levels for getBlock */
export type TransactionDetail = "full" | "accounts" | "signatures" | "none";

/** Data slice configuration for account data */
export interface DataSlice {
  offset: number;
  length: number;
}

/** Wrapped response with context metadata */
export interface SolRpcResponse<T> {
  context: {
    slot: number;
    apiVersion?: string;
  };
  value: T;
}

// ─── Account Types ───

export interface SolAccountInfo {
  /** Number of lamports assigned to this account */
  lamports: number;
  /** Base-58 encoded pubkey of the program this account has been assigned to */
  owner: string;
  /** Data associated with the account, either as encoded string or JSON parsed */
  // biome-ignore lint/suspicious/noExplicitAny: account data varies by encoding
  data: string | [string, string] | { program: string; parsed: any; space: number };
  /** Whether this account contains an executable program */
  executable: boolean;
  /** The epoch at which this account will next owe rent */
  rentEpoch: number;
  /** The data size of the account */
  space?: number;
}

export interface SolKeyedAccount {
  account: SolAccountInfo;
  pubkey: string;
}

// ─── Token Types ───

export interface SolTokenAmount {
  /** Raw amount as a string */
  amount: string;
  /** Number of decimals */
  decimals: number;
  /** Token amount as a number (deprecated, may lose precision) */
  uiAmount: number | null;
  /** Token amount as a string */
  uiAmountString: string;
}

export interface SolTokenAccount {
  account: SolAccountInfo;
  pubkey: string;
}

export interface SolTokenLargestAccount {
  address: string;
  amount: string;
  decimals: number;
  uiAmount: number | null;
  uiAmountString: string;
}

// ─── Transaction Types ───

export interface SolTransaction {
  /** Slot this transaction was processed in */
  slot: number;
  /** The transaction object */
  transaction: SolTransactionData;
  /** Transaction metadata */
  meta: SolTransactionMeta | null;
  /** The unix timestamp of when the transaction was processed */
  blockTime: number | null;
  /** Transaction version ("legacy" or 0) */
  version?: "legacy" | 0;
}

export interface SolTransactionData {
  /** List of base-58 encoded signatures */
  signatures: string[];
  /** The transaction message */
  message: SolTransactionMessage;
}

export interface SolTransactionMessage {
  /** List of base-58 encoded public keys used by the transaction */
  accountKeys: string[] | SolParsedAccountKey[];
  /** A base-58 encoded hash of a recent block */
  recentBlockhash: string;
  /** List of program instructions */
  // biome-ignore lint/suspicious/noExplicitAny: instruction formats vary by encoding
  instructions: any[];
  /** List of address table lookups used by the transaction (v0 transactions) */
  addressTableLookups?: SolAddressTableLookup[];
}

export interface SolParsedAccountKey {
  pubkey: string;
  writable: boolean;
  signer: boolean;
  source?: "transaction" | "lookupTable";
}

export interface SolAddressTableLookup {
  accountKey: string;
  writableIndexes: number[];
  readonlyIndexes: number[];
}

export interface SolTransactionMeta {
  /** Error if transaction failed, null if succeeded */
  // biome-ignore lint/suspicious/noExplicitAny: error format varies
  err: any;
  /** Fee this transaction was charged (in lamports) */
  fee: number;
  /** Array of account balances before the transaction was processed */
  preBalances: number[];
  /** Array of account balances after the transaction was processed */
  postBalances: number[];
  /** List of inner instructions or null if not enabled */
  innerInstructions: SolInnerInstruction[] | null;
  /** Log messages from the transaction */
  logMessages: string[] | null;
  /** Pre-transaction token balances */
  preTokenBalances?: SolTokenBalance[];
  /** Post-transaction token balances */
  postTokenBalances?: SolTokenBalance[];
  /** Rewards collected in this transaction */
  rewards?: SolReward[] | null;
  /** Addresses loaded from address lookup tables (v0 transactions) */
  loadedAddresses?: SolLoadedAddresses;
  /** Return data from the transaction */
  returnData?: SolReturnData | null;
  /** Compute units consumed by the transaction */
  computeUnitsConsumed?: number;
}

export interface SolInnerInstruction {
  index: number;
  // biome-ignore lint/suspicious/noExplicitAny: instruction formats vary by encoding
  instructions: any[];
}

export interface SolTokenBalance {
  accountIndex: number;
  mint: string;
  uiTokenAmount: SolTokenAmount;
  owner?: string;
  programId?: string;
}

export interface SolLoadedAddresses {
  writable: string[];
  readonly: string[];
}

export interface SolReturnData {
  programId: string;
  data: [string, string];
}

// ─── Block Types ───

export interface SolBlock {
  /** The blockhash of this block */
  blockhash: string;
  /** The blockhash of this block's parent */
  previousBlockhash: string;
  /** The slot index of this block's parent */
  parentSlot: number;
  /** Array of transactions in this block */
  // biome-ignore lint/suspicious/noExplicitAny: transaction format varies by transactionDetails param
  transactions?: any[];
  /** Array of transaction signatures in this block */
  signatures?: string[];
  /** Array of rewards collected in this block */
  rewards?: SolReward[];
  /** Estimated production time as a Unix timestamp */
  blockTime: number | null;
  /** The number of blocks beneath this block */
  blockHeight: number | null;
}

export interface SolReward {
  pubkey: string;
  lamports: number;
  postBalance: number;
  rewardType: "fee" | "rent" | "staking" | "voting" | null;
  commission?: number | null;
}

// ─── Cluster / Network Types ───

export interface SolVersion {
  /** Software version of solana-core */
  "solana-core": string;
  /** Unique identifier of the current software's feature set */
  "feature-set": number;
}

export interface SolEpochInfo {
  absoluteSlot: number;
  blockHeight: number;
  epoch: number;
  slotIndex: number;
  slotsInEpoch: number;
  transactionCount?: number;
}

export interface SolEpochSchedule {
  slotsPerEpoch: number;
  leaderScheduleSlotOffset: number;
  warmup: boolean;
  firstNormalEpoch: number;
  firstNormalSlot: number;
}

export interface SolInflationGovernor {
  initial: number;
  terminal: number;
  taper: number;
  foundation: number;
  foundationTerm: number;
}

export interface SolInflationRate {
  total: number;
  validator: number;
  foundation: number;
  epoch: number;
}

export interface SolInflationReward {
  epoch: number;
  effectiveSlot: number;
  amount: number;
  postBalance: number;
  commission?: number | null;
}

export interface SolSupply {
  total: number;
  circulating: number;
  nonCirculating: number;
  nonCirculatingAccounts: string[];
}

export interface SolVoteAccount {
  votePubkey: string;
  nodePubkey: string;
  activatedStake: number;
  epochVoteAccount: boolean;
  commission: number;
  lastVote: number;
  epochCredits: [number, number, number][];
  rootSlot?: number;
}

export interface SolClusterNode {
  pubkey: string;
  gossip: string | null;
  tpu: string | null;
  rpc: string | null;
  version: string | null;
  featureSet: number | null;
  shredVersion: number | null;
}

export interface SolPerfSample {
  slot: number;
  numTransactions: number;
  numSlots: number;
  samplePeriodSecs: number;
  numNonVoteTransactions?: number;
}

export interface SolBlockProduction {
  byIdentity: Record<string, [number, number]>;
  range: {
    firstSlot: number;
    lastSlot: number;
  };
}

export interface SolHighestSnapshotSlot {
  full: number;
  incremental?: number;
}

export interface SolPrioritizationFee {
  slot: number;
  prioritizationFee: number;
}

export interface SolSignatureStatus {
  slot: number;
  confirmations: number | null;
  // biome-ignore lint/suspicious/noExplicitAny: error format varies
  err: any;
  confirmationStatus: Commitment | null;
}

export interface SolSignatureInfo {
  signature: string;
  slot: number;
  // biome-ignore lint/suspicious/noExplicitAny: error format varies
  err: any;
  memo: string | null;
  blockTime: number | null;
  confirmationStatus: Commitment | null;
}

export interface SolStakeActivation {
  state: "active" | "inactive" | "activating" | "deactivating";
  active: number;
  inactive: number;
}

export interface SolLeaderSchedule {
  [validatorIdentity: string]: number[];
}

export interface SolLargestAccount {
  address: string;
  lamports: number;
}

export interface SolBlockCommitment {
  commitment: number[] | null;
  totalStake: number;
}

export interface SolLatestBlockhash {
  blockhash: string;
  lastValidBlockHeight: number;
}

export interface SolSimulateTransactionResult {
  // biome-ignore lint/suspicious/noExplicitAny: error format varies
  err: any;
  logs: string[] | null;
  accounts?: (SolAccountInfo | null)[] | null;
  unitsConsumed?: number;
  returnData?: SolReturnData | null;
  innerInstructions?: SolInnerInstruction[] | null;
}

// ─── Config Types for Method Parameters ───

export interface SolGetAccountInfoConfig {
  commitment?: Commitment;
  encoding?: Encoding;
  dataSlice?: DataSlice;
  minContextSlot?: number;
}

export interface SolGetBlockConfig {
  commitment?: Commitment;
  encoding?: "json" | "jsonParsed" | "base58" | "base64";
  transactionDetails?: TransactionDetail;
  maxSupportedTransactionVersion?: number;
  rewards?: boolean;
}

export interface SolGetSignaturesConfig {
  limit?: number;
  before?: string;
  until?: string;
  commitment?: Commitment;
  minContextSlot?: number;
}

export interface SolGetTransactionConfig {
  commitment?: Commitment;
  encoding?: "json" | "jsonParsed" | "base58" | "base64";
  maxSupportedTransactionVersion?: number;
}

export interface SolSendTransactionConfig {
  encoding?: "base58" | "base64";
  skipPreflight?: boolean;
  preflightCommitment?: Commitment;
  maxRetries?: number;
  minContextSlot?: number;
}

export interface SolSimulateTransactionConfig {
  commitment?: Commitment;
  encoding?: "base58" | "base64";
  sigVerify?: boolean;
  replaceRecentBlockhash?: boolean;
  minContextSlot?: number;
  accounts?: {
    addresses: string[];
    encoding?: Encoding;
  };
  innerInstructions?: boolean;
}

export interface SolGetBlockProductionConfig {
  commitment?: Commitment;
  identity?: string;
  range?: {
    firstSlot: number;
    lastSlot?: number;
  };
}

export interface SolGetLeaderScheduleConfig {
  commitment?: Commitment;
  identity?: string;
}

export interface SolGetSupplyConfig {
  commitment?: Commitment;
  excludeNonCirculatingAccountsList?: boolean;
}

export interface SolGetVoteAccountsConfig {
  commitment?: Commitment;
  votePubkey?: string;
  keepUnstakedDelinquents?: boolean;
  delinquentSlotDistance?: number;
}

export interface SolGetProgramAccountsConfig {
  commitment?: Commitment;
  encoding?: Encoding;
  dataSlice?: DataSlice;
  filters?: SolProgramAccountFilter[];
  withContext?: boolean;
  minContextSlot?: number;
}

export type SolProgramAccountFilter =
  | { memcmp: { offset: number; bytes: string; encoding?: "base58" | "base64" } }
  | { dataSize: number };

export interface SolGetInflationRewardConfig {
  commitment?: Commitment;
  epoch?: number;
  minContextSlot?: number;
}

export interface SolGetLargestAccountsConfig {
  commitment?: Commitment;
  filter?: "circulating" | "nonCirculating";
}

export interface SolGetSignatureStatusesConfig {
  searchTransactionHistory?: boolean;
}

export interface SolTokenAccountFilter {
  mint?: string;
  programId?: string;
}

export interface SolGetTokenAccountsConfig {
  commitment?: Commitment;
  encoding?: Encoding;
  dataSlice?: DataSlice;
  minContextSlot?: number;
}

// ─── Subscription Notification Types ───

export interface SolAccountNotification {
  lamports: number;
  owner: string;
  // biome-ignore lint/suspicious/noExplicitAny: account data varies by encoding
  data: string | [string, string] | { program: string; parsed: any; space: number };
  executable: boolean;
  rentEpoch: number;
  space?: number;
}

export interface SolProgramNotification {
  pubkey: string;
  account: SolAccountNotification;
}

export interface SolLogsNotification {
  signature: string;
  // biome-ignore lint/suspicious/noExplicitAny: error format varies
  err: any;
  logs: string[];
}

export interface SolSignatureNotification {
  // biome-ignore lint/suspicious/noExplicitAny: error format varies
  err: any;
}

export interface SolSlotNotification {
  parent: number;
  root: number;
  slot: number;
}

export interface SolSlotsUpdatesNotification {
  parent?: number;
  slot: number;
  timestamp: number;
  type:
    | "firstShredReceived"
    | "completed"
    | "createdBank"
    | "frozen"
    | "dead"
    | "optimisticConfirmation"
    | "root";
}

/** Root subscription returns a slot number directly */
export type SolRootNotification = number;

export interface SolBlockNotification {
  slot: number;
  // biome-ignore lint/suspicious/noExplicitAny: block format varies by config
  block: any | null;
  // biome-ignore lint/suspicious/noExplicitAny: error format varies
  err: any;
}

export interface SolVoteNotification {
  votePubkey: string;
  hash: string;
  slots: number[];
  timestamp: number | null;
  signature: string;
}

// ─── Subscription Config Types ───

export interface SolAccountSubscribeConfig {
  commitment?: Commitment;
  encoding?: Encoding;
}

export interface SolProgramSubscribeConfig {
  commitment?: Commitment;
  encoding?: Encoding;
  filters?: SolProgramAccountFilter[];
}

export interface SolLogsSubscribeConfig {
  commitment?: Commitment;
}

export interface SolSignatureSubscribeConfig {
  commitment?: Commitment;
  enableReceivedNotification?: boolean;
}

export interface SolBlockSubscribeConfig {
  commitment?: Commitment;
  encoding?: "json" | "jsonParsed" | "base58" | "base64";
  transactionDetails?: TransactionDetail;
  maxSupportedTransactionVersion?: number;
  showRewards?: boolean;
}
