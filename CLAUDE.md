# CLAUDE.md - AI Assistant Context

This file provides structured context for AI assistants to understand the @openscan/network-connectors codebase.

## Project Overview

**@openscan/network-connectors** is a TypeScript library that provides unified, type-safe RPC client interfaces for multiple blockchain networks. It abstracts the complexity of working with different blockchain RPC providers through a consistent API.

### Key Design Patterns

- **Strategy Pattern**: Pluggable request execution strategies (Fallback, Parallel, Race)
- **Factory Pattern**: Client instantiation based on chain IDs
- **Inheritance**: Base `NetworkClient` class extended by network-specific clients

### Technology Stack

- **Language**: TypeScript 5.9.3 with strict type checking
- **Runtime**: Node.js 24 with ES modules
- **Build**: TypeScript compiler (tsc)
- **Testing**: Node.js native test framework with tsx
- **Code Quality**: Biome (linting and formatting)
- **CI/CD**: GitHub Actions for automated npm publishing

## Codebase Structure

```
@openscan/network-connectors/
├── src/
│   ├── strategies/              # Request execution strategies
│   │   ├── requestStrategy.ts   # StrategyFactory for creating strategies
│   │   ├── strategiesTypes.ts   # Interface definitions
│   │   ├── fallbackStrategy.ts  # Sequential fallback implementation
│   │   ├── parallelStrategy.ts  # Parallel execution with inconsistency detection
│   │   └── raceStrategy.ts      # Race execution returning first success
│   ├── networks/                # Network-specific clients (by chain ID)
│   │   ├── 1/                   # Ethereum mainnet
│   │   ├── 10/                  # Optimism
│   │   ├── 56/                  # BNB Smart Chain
│   │   ├── 97/                  # BNB Testnet
│   │   ├── 137/                 # Polygon
│   │   ├── 8453/                # Base
│   │   ├── 31337/               # Hardhat (local)
│   │   ├── 42161/               # Arbitrum One
│   │   ├── 677868/              # Aztec
│   │   ├── 11155111/            # Sepolia Testnet
│   │   └── bitcoin/             # Bitcoin (CAIP-2: bip122:*)
│   ├── factory/                 # Client instantiation
│   │   └── ClientRegistry.ts    # Chain ID to client mapping
│   ├── NetworkClient.ts         # Base network client
│   ├── RpcClient.ts             # Low-level RPC client
│   ├── RpcClientTypes.ts        # JSON-RPC type definitions
│   └── index.ts                 # Main export file
├── tests/                       # Comprehensive test suite
│   ├── strategies/              # Strategy tests
│   └── networks/                # Network-specific client tests
├── scripts/
│   └── publish-and-tag.sh       # Release automation script
├── .github/workflows/
│   └── npm-publish.yml          # CI/CD automation
├── biome.json                   # Linting and formatting config
├── tsconfig.json                # TypeScript configuration
└── package.json                 # Project metadata
```

### Entry Points

- **Main Entry**: [src/index.ts](src/index.ts) - Exports all public APIs (clients, types, factories, strategies)
- **Published Package**: `dist/index.js` with types at `dist/index.d.ts`

## Core Architecture

### Base Classes

#### NetworkClient ([src/NetworkClient.ts](src/NetworkClient.ts))

Abstract base class providing:

- `execute<T>(method: string, params: any[]): Promise<StrategyResult<T>>` - Generic RPC method execution
- `getStrategy(): RequestStrategy` - Get current strategy instance
- `getStrategyName(): string` - Get strategy name ("fallback", "parallel", or "race")
- `getRpcUrls(): string[]` - Get configured RPC URLs
- `updateStrategy(config: StrategyConfig): void` - Dynamically switch strategies

#### RpcClient ([src/RpcClient.ts](src/RpcClient.ts))

Low-level JSON-RPC 2.0 client:

- `call<T>(method: string, params: any[]): Promise<T>` - Direct RPC calls via fetch
- `getUrl(): string` - Get RPC endpoint URL
- `getRequestId(): number` - Get current request ID counter
- Handles HTTP errors and extracts RPC errors from responses
- Auto-increments request ID for each call

### Type System

#### Core Interfaces ([src/strategies/strategiesTypes.ts](src/strategies/strategiesTypes.ts))

```typescript
interface RequestStrategy {
  execute<T>(method: string, params: any[]): Promise<StrategyResult<T>>;
  getName(): string;
}

interface StrategyResult<T> {
  success: boolean;
  data?: T;
  errors?: RPCProviderResponse[];
  metadata?: RPCMetadata;  // For parallel and race strategies
}

interface RPCMetadata {
  strategy: "parallel" | "fallback" | "race";
  timestamp: number;
  responses: RPCProviderResponse[];
  hasInconsistencies: boolean;
}

interface RPCProviderResponse {
  url: string;
  status: "success" | "error";
  responseTime: number;
  data?: any;
  error?: string;
  hash?: string;  // Response hash for inconsistency detection
}

interface StrategyConfig {
  type: "fallback" | "parallel" | "race";
  rpcUrls: string[];
}
```

#### Blockchain Types ([src/RpcClientTypes.ts](src/RpcClientTypes.ts))

Common types across Ethereum-compatible networks:

```typescript
type BlockTag = "latest" | "earliest" | "pending" | "finalized" | "safe";
type BlockNumberOrTag = string | BlockTag;

interface EthBlock {
  number: string;           // Hex-encoded
  hash: string;
  parentHash: string;
  transactions: string[] | EthTransaction[];
  gasUsed: string;
  gasLimit: string;
  baseFeePerGas?: string;   // EIP-1559
  withdrawals?: EthWithdrawal[];  // Shanghai
  // ... 20+ additional fields
}

interface EthTransaction {
  from: string;
  to: string | null;
  value: string;
  gas: string;
  type: string;             // "0x0" (legacy), "0x1" (EIP-2930), "0x2" (EIP-1559), "0x3" (EIP-4844)
  maxFeePerGas?: string;    // EIP-1559
  maxPriorityFeePerGas?: string;
  accessList?: AccessListEntry[];  // EIP-2930
  blobVersionedHashes?: string[];  // EIP-4844
  v: string; r: string; s: string;
}

interface EthTransactionReceipt {
  blockHash: string;
  blockNumber: string;
  status?: string;          // "0x1" (success) or "0x0" (failure)
  gasUsed: string;
  effectiveGasPrice?: string;
  logs: EthLog[];
  logsBloom: string;
}

interface EthCallObject {
  from?: string;
  to?: string;
  gas?: string;
  value?: string;
  data?: string;
  accessList?: AccessListEntry[];
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
}
```

## Request Strategies

### FallbackStrategy ([src/strategies/fallbackStrategy.ts](src/strategies/fallbackStrategy.ts))

**Execution Pattern**: Sequential with early exit on success

```typescript
// Tries each RPC client in order until one succeeds
for (const client of this.rpcClients) {
  try {
    const data = await client.call<T>(method, params);
    return { success: true, data };
  } catch (error) {
    errors.push({ url, status: "error", responseTime, error: message });
  }
}
return { success: false, errors };
```

**Characteristics**:

- Minimal overhead (stops at first success)
- No metadata tracking
- Best for reliability when providers are generally consistent

### ParallelStrategy ([src/strategies/parallelStrategy.ts](src/strategies/parallelStrategy.ts))

**Execution Pattern**: Concurrent with inconsistency detection

```typescript
// Execute all RPC calls concurrently
const promises = this.rpcClients.map(client => client.call<T>(method, params));
const results = await Promise.allSettled(promises);

// Track all responses with hashes
const responses = results.map((result, index) => ({
  url: this.rpcClients[index].getUrl(),
  status: result.status === "fulfilled" ? "success" : "error",
  responseTime: endTime - startTime,
  data: result.status === "fulfilled" ? result.value : undefined,
  error: result.status === "rejected" ? result.reason : undefined,
  hash: result.status === "fulfilled" ? this.hashResponse(result.value) : undefined,
}));

// Detect inconsistencies by comparing hashes
const hasInconsistencies = this.detectInconsistencies(responses);
```

**Characteristics**:

- All providers called simultaneously
- Response hashing for data consistency checks
- Comprehensive metadata with timing and error information
- Best for detecting provider divergence or testing reliability

### RaceStrategy ([src/strategies/raceStrategy.ts](src/strategies/raceStrategy.ts))

**Execution Pattern**: Concurrent with first-success wins

```typescript
// Create promises that resolve with data or reject with error info
const racePromises = this.rpcClients.map(async (rpcClient): Promise<RaceWinner<T>> => {
  try {
    const data = await rpcClient.call<T>(method, params);
    return { data, response: { url, status: "success", responseTime, data } };
  } catch (error) {
    errors.push({ url, status: "error", responseTime, error: message });
    throw errorResponse;  // Reject so Promise.any continues to next
  }
});

// Promise.any returns first fulfilled promise
const winner = await Promise.any(racePromises);
return { success: true, data: winner.data, metadata };
```

**Characteristics**:

- All providers called simultaneously (like parallel)
- Returns immediately when first provider succeeds
- Minimizes latency by using the fastest responding provider
- Only fails if ALL requests fail (AggregateError)
- Includes metadata with winning response and any errors
- Does not detect inconsistencies (no response comparison)
- Best for latency-sensitive operations where any valid response is acceptable

**Hash Algorithm** (32-bit integer hash):

```typescript
private hashResponse(data: object): string {
  const normalized = JSON.stringify(data, Object.keys(data).sort());
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;  // Convert to 32-bit
  }
  return hash.toString(36);
}
```

### StrategyFactory ([src/strategies/requestStrategy.ts](src/strategies/requestStrategy.ts))

Creates appropriate strategy based on configuration:

```typescript
static create(config: StrategyConfig): RequestStrategy {
  if (config.rpcUrls.length === 0) {
    throw new Error("At least one RPC URL must be provided");
  }

  const rpcClients = config.rpcUrls.map(url => new RpcClient(url));

  switch (config.type) {
    case "fallback": return new FallbackStrategy(rpcClients);
    case "parallel": return new ParallelStrategy(rpcClients);
    case "race": return new RaceStrategy(rpcClients);
    default: throw new Error(`Unknown strategy type: ${config.type}`);
  }
}
```

## Network Implementations

### Supported Networks

| Network | Chain ID | Client Class | Special Features |
|---------|----------|--------------|------------------|
| Ethereum | 1 | `EthereumClient` | Full eth_*, web3_*, net_*, debug_*, trace_*, txpool_* methods |
| Optimism | 10 | `OptimismClient` | Ethereum methods + optimism_*rollup methods + opp2p_* P2P + admin_* |
| BNB Smart Chain | 56 | `BNBClient` | Extended Ethereum methods + BSC-specific features |
| BNB Testnet | 97 | `BNBClient` | Maps to BNBClient |
| Polygon | 137 | `PolygonClient` | Ethereum methods + Polygon Bor validator methods |
| Base | 8453 | `BaseClient` | Optimism-compatible (reuses Optimism types/methods) |
| Arbitrum One | 42161 | `ArbitrumClient` | Ethereum methods + arbtrace_* (Arbitrum-specific traces) |
| Aztec | 677868 | `AztecClient` | Custom node_*/nodeAdmin_* methods (non-EVM) |
| Hardhat | 31337 | `EthereumClient` | Local development network |
| Sepolia Testnet | 11155111 | `SepoliaClient` | Ethereum-compatible testnet |
| Bitcoin Mainnet | `bip122:000000000019d6689c085ae165831e93` | `BitcoinClient` | Full Bitcoin Core 28+ RPC (~115 methods) |
| Bitcoin Testnet3 | `bip122:000000000933ea01ad0ee984209779ba` | `BitcoinClient` | Bitcoin testnet3 network |
| Bitcoin Testnet4 | `bip122:00000000da84f2bafbbc53dee25a72ae` | `BitcoinClient` | Bitcoin testnet4 (BIP94) |
| Bitcoin Signet | `bip122:00000008819873e925422c1ff0f99f7c` | `BitcoinClient` | Bitcoin signet (BIP325) |

### Network-Specific Method Categories

All Ethereum-compatible networks include:

1. **Web3 Methods**: `clientVersion()`, `sha3()`
2. **Net Methods**: `version()`, `listening()`, `peerCount()`
3. **Eth Methods**: `chainId()`, `syncing()`, `blockNumber()`, `getBalance()`, `sendRawTransaction()`, etc.
4. **Block/Transaction**: `getBlockByNumber()`, `getTransactionByHash()`, `getTransactionReceipt()`
5. **Logs/Filters**: `getLogs()`, `newFilter()`, `getFilterChanges()`
6. **Fees**: `gasPrice()`, `maxPriorityFeePerGas()`, `feeHistory()`
7. **Debug**: `debugTraceTransaction()`, `debugTraceCall()`, `storageRangeAt()`
8. **Trace**: `traceBlock()`, `traceTransaction()`, `traceCall()`, `traceFilter()`
9. **TxPool**: `status()`, `content()`, `inspect()`

### Network-Specific Extensions

**Optimism** ([src/networks/10/OptimismClient.ts](src/networks/10/OptimismClient.ts)):

- `outputAtBlock()` - Get L2 output at block
- `syncStatus()` - Get sync status
- `rollupConfig()` - Get rollup configuration
- `optimismVersion()` - Get version info
- P2P methods: `p2pSelf()`, `p2pPeers()`, peer blocking/protection
- Admin: `adminStartSequencer()`, `adminStopSequencer()`, `adminSequencerActive()`

**Arbitrum** ([src/networks/42161/ArbitrumClient.ts](src/networks/42161/ArbitrumClient.ts)):

- `arbtraceBlock()` - Trace entire block
- `arbtraceTransaction()` - Trace specific transaction
- `arbtraceCall()` - Trace call with custom options
- `arbtraceCallMany()` - Trace multiple calls
- Specialized trace options for VM tracing and state diffs

**Aztec** ([src/networks/677868/AztecClient.ts](src/networks/677868/AztecClient.ts)):

- Block operations: `getBlock()`, `getBlocks()`, `getBlockHeader()`
- Transactions: `sendTx()`, `getTxReceipt()`, `getTxEffect()`
- Contract queries: `getContractClass()`, `getContractInstance()`
- State: `getPublicLogs()`, `worldStateSyncStatus()`
- Validators and node admin operations

**Bitcoin** ([src/networks/bitcoin/BitcoinClient.ts](src/networks/bitcoin/BitcoinClient.ts)):

Bitcoin uses CAIP-2/BIP122 chain IDs instead of numeric EVM chain IDs. Import constants for type-safe usage:

```typescript
import { BITCOIN_MAINNET, BITCOIN_TESTNET3, BITCOIN_TESTNET4, BITCOIN_SIGNET } from "@openscan/network-connectors";
```

Method categories (~115 methods total, targeting Bitcoin Core v28+):

- **Blockchain** (~15): `getBestBlockHash()`, `getBlock()`, `getBlockchainInfo()`, `getBlockCount()`, `getBlockHash()`, `getBlockHeader()`, `getBlockStats()`, `getChainTips()`, `getChainTxStats()`, `getDifficulty()`, `getTxOut()`, `getTxOutSetInfo()`, `verifyChain()`, `scanTxOutSet()`, `getBlockFilter()`
- **Mempool** (~10): `getMempoolInfo()`, `getRawMempool()`, `getMempoolEntry()`, `getMempoolAncestors()`, `getMempoolDescendants()`, `testMempoolAccept()`, `submitPackage()`, `getPrioritisedTransactions()`
- **Raw Transactions** (~7): `getRawTransaction()`, `decodeRawTransaction()`, `decodeScript()`, `sendRawTransaction()`, `createRawTransaction()`, `combineRawTransaction()`, `signRawTransactionWithKey()`
- **PSBT** (~8): `createPsbt()`, `decodePsbt()`, `analyzePsbt()`, `combinePsbt()`, `finalizePsbt()`, `joinPsbts()`, `convertToPsbt()`, `utxoUpdatePsbt()`
- **Network** (~13): `getNetworkInfo()`, `getPeerInfo()`, `getConnectionCount()`, `getNetTotals()`, `getAddedNodeInfo()`, `getNodeAddresses()`, `ping()`, `addNode()`, `disconnectNode()`, `listBanned()`, `setBan()`, `clearBanned()`, `setNetworkActive()`
- **Control** (~6): `getMemoryInfo()`, `getRpcInfo()`, `help()`, `uptime()`, `logging()`, `stop()`
- **Utility** (~7): `validateAddress()`, `getDescriptorInfo()`, `deriveAddresses()`, `createMultisig()`, `verifyMessage()`, `signMessageWithPrivKey()`, `getIndexInfo()`
- **Fee Estimation** (~1): `estimateSmartFee()`
- **Mining** (~9): `getMiningInfo()`, `getNetworkHashPs()`, `getBlockTemplate()`, `submitBlock()`, `submitHeader()`, `generateToAddress()`, `generateBlock()`, `generateToDescriptor()`, `prioritiseTransaction()`
- **Wallet** (~35): `getWalletInfo()`, `getBalances()`, `getBalance()`, `listWallets()`, `loadWallet()`, `unloadWallet()`, `createWallet()`, `getNewAddress()`, `getAddressInfo()`, `listTransactions()`, `sendToAddress()`, `sendMany()`, `listUnspent()`, `walletCreateFundedPsbt()`, `walletProcessPsbt()`, `importDescriptors()`, `signRawTransactionWithWallet()`, and more
- **Signer** (~2): `enumerateSigners()`, `signerDisplayAddress()`

Bitcoin Core v28+ specific features supported:

- `createWalletDescriptor()`, `getHdKeys()` - New wallet descriptor RPCs
- `getPrioritisedTransactions()` - New mempool inspection
- `submitPackage()` with `maxfeerate` and `maxburnamount` params
- Array-based `warnings` field in info responses

## Common Code Patterns

### Method Parameter Handling

```typescript
async estimateGas(
  txObject: EthCallObject,
  blockTag?: BlockNumberOrTag,
): Promise<StrategyResult<string>> {
  const params: any[] = [txObject];
  if (blockTag !== undefined) params.push(blockTag);
  return this.execute<string>("eth_estimateGas", params);
}
```

**Pattern**: Build params array conditionally to handle optional parameters.

### Error Handling in RPC Calls

```typescript
// HTTP error check
if (!response.ok) {
  throw new Error(`HTTP error! status: ${response.status}`);
}

// JSON-RPC error check
if (result.error) {
  throw new Error(`RPC error: ${result.error.message}`);
}
```

**Pattern**: Check HTTP response status, then check for JSON-RPC error object.

### Response Hashing for Inconsistency Detection

```typescript
private hashResponse(data: object): string {
  const normalized = JSON.stringify(data, Object.keys(data).sort());
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;  // Convert to 32-bit integer
  }
  return hash.toString(36);
}

private detectInconsistencies(responses: RPCProviderResponse[]): boolean {
  const successfulResponses = responses.filter((r) => r.status === "success" && r.hash);
  if (successfulResponses.length <= 1) return false;

  const referenceHash = successfulResponses[0]?.hash;
  return successfulResponses.some((r) => r.hash !== referenceHash);
}
```

**Pattern**: Normalize JSON by sorting keys, compute simple hash, compare all hashes to detect divergence.

### Biome Lint Suppressions

```typescript
// biome-ignore lint/suspicious/noExplicitAny: <TODO>
async call<T>(method: string, params: any[] = []): Promise<T>
```

**Pattern**: Used for `any[]` types in RPC methods due to variable signatures. Pragmatic approach acknowledging future type improvements.

## Client Factory

### ClientRegistry ([src/factory/ClientRegistry.ts](src/factory/ClientRegistry.ts))

**Type-Safe Chain ID Mapping**:

```typescript
// EVM chain IDs (numeric)
type SupportedChainId = 1 | 10 | 56 | 97 | 137 | 8453 | 42161 | 677868 | 31337 | 11155111;

// Bitcoin chain IDs (CAIP-2/BIP122 format)
type SupportedBitcoinChainId = BitcoinChainId;  // "bip122:000000000019d6689c085ae165831e93" | ...

// All supported networks
type SupportedNetwork = SupportedChainId | SupportedBitcoinChainId;

// Maps network identifier to client type
type NetworkToClient<T extends SupportedNetwork> =
  T extends SupportedBitcoinChainId ? BitcoinClient :
  T extends 1 | 31337 | 11155111 ? EthereumClient :
  T extends 10 ? OptimismClient :
  T extends 56 | 97 ? BNBClient :
  T extends 137 ? PolygonClient :
  T extends 8453 ? BaseClient :
  T extends 42161 ? ArbitrumClient :
  T extends 677868 ? AztecClient :
  NetworkClient;
```

**Factory Methods (Overloaded for Automatic Type Inference)**:

```typescript
// Overloaded createClient - returns correct type automatically
static createClient(chainId: 1 | 31337, config: StrategyConfig): EthereumClient;
static createClient(chainId: 10, config: StrategyConfig): OptimismClient;
static createClient(chainId: SupportedBitcoinChainId, config: StrategyConfig): BitcoinClient;
// ... other overloads
static createClient(network: SupportedNetwork, config: StrategyConfig): NetworkClient;

// Type-safe client with generic inference
static createTypedClient<T extends SupportedNetwork>(
  network: T,
  config: StrategyConfig
): NetworkToClient<T>
```

**Usage Example**:

```typescript
import { ClientFactory, BITCOIN_MAINNET } from "@openscan/network-connectors";

const config = { type: "fallback" as const, rpcUrls: ["https://btc-rpc.example.com"] };

// Automatic type inference - no generics needed
const btcClient = ClientFactory.createClient(BITCOIN_MAINNET, config);
// btcClient is typed as BitcoinClient

const ethClient = ClientFactory.createClient(1, config);
// ethClient is typed as EthereumClient

// All methods are fully typed
const info = await btcClient.getBlockchainInfo();
// info.data is BtcBlockchainInfo
```

## Testing Approach

### Test Structure

Uses Node.js native test framework with tsx for TypeScript execution:

```typescript
import { describe, it } from "node:test";
import assert from "node:assert";

describe("ComponentName - Functionality", () => {
  it("should do specific thing", async () => {
    const result = await client.method();
    assert.strictEqual(result.success, true);
    assert.ok(result.data, "Should have data");
  });
});
```

### Test Categories

1. **Strategy Tests** ([tests/strategies/](tests/strategies/)):
   - Constructor validation (empty URLs, strategy types)
   - Strategy execution (success, error handling)
   - Response metadata (parallel and race strategies)
   - Fallback behavior
   - Race strategy first-success behavior

2. **Network Tests** ([tests/networks/](tests/networks/)):
   - Network-specific client instantiation
   - Method parameter handling
   - Type safety checks
   - Error propagation

3. **Factory Tests**:
   - Chain ID to client mapping
   - Type-safe client creation
   - Invalid chain ID handling

### Test Helpers

[tests/helpers/validators.js](tests/helpers/validators.js):

- `isHexString(value)` - Validates hex string format (0x prefix)

## Build and Configuration

### TypeScript Configuration ([tsconfig.json](tsconfig.json))

- **Target**: ES5
- **Module**: ESNext (native ES modules)
- **Output**: `dist/` directory
- **Type Declarations**: `dist/types/index.d.ts`
- **Strict Mode**: Enabled (`strict: true`, `noImplicitAny: true`, `noImplicitReturns: true`)

### Biome Configuration ([biome.json](biome.json))

- **Files**: `src/**/*.ts`, `src/**/*.tsx`, `src/**/*.json`, `tests/**/*.ts`
- **Formatter**: 100 character line width, 2-space indentation
- **Linter**: Recommended rules with custom overrides
- **Special Handling**: No explicit any check in test files

### ES Modules Setup

```json
{
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "require": "./dist/index.js",
      "import": "./dist/index.js",
      "types": "./dist/types/index.d.ts"
    }
  }
}
```

## Available Commands

### Development Commands

| Command | Description |
|---------|-------------|
| `npm run build` | Compile TypeScript to JavaScript using tsc |
| `npm run test` | Run test suite using Node.js native test runner with tsx |
| `npm run typecheck` | Type check without code emission |
| `npm run format` | Check code formatting (Biome) |
| `npm run format:fix` | Auto-fix formatting issues |
| `npm run lint` | Check linting rules (Biome) |
| `npm run lint:fix` | Auto-fix linting issues |
| `npm run check` | Combined format + lint check |

### Release Commands

| Command | Description |
|---------|-------------|
| `npm run release` | Execute release script (build, publish, tag) |

### Shell Scripts

**[scripts/publish-and-tag.sh](scripts/publish-and-tag.sh)** - Automated release workflow:

1. Validates on main branch
2. Checks working directory is clean
3. Prevents duplicate releases (checks for existing git tag)
4. Runs quality checks (`npm run check`, `npm run typecheck`, `npm run build`)
5. Publishes to npm
6. Creates annotated git tag (`v<VERSION>`)
7. Pushes tag to remote

### CI/CD Pipeline

**[.github/workflows/npm-publish.yml](.github/workflows/npm-publish.yml)**:

- **Trigger**: Push to main branch
- **Environment**: ubuntu-latest, Node.js 24
- **Steps**:
  1. Checkout code
  2. Setup Node.js with npm registry
  3. Install dependencies (`npm ci`)
  4. Build project (`npm run build`)
  5. Publish to npm (JS-DevTools/npm-publish with OIDC)

## Code Quality Standards

- **TypeScript**: Strict type checking with explicit types
- **JSDoc**: Comprehensive comments on public methods
- **Type Aliases**: Common patterns (BlockNumberOrTag, BlockTag)
- **Generics**: Type parameters for return values
- **Separation of Concerns**: Strategies, clients, types in separate modules
- **Error Propagation**: async/await with proper error handling
- **Zero Dependencies**: Pure Node.js/TypeScript implementation

## Adding New Networks

To add a new network:

1. Create directory in [src/networks/](src/networks/) with chain ID
2. Define network-specific types (if needed)
3. Create client class extending `NetworkClient`
4. Implement network-specific RPC methods
5. Update `SupportedChainId` type in [src/factory/ClientRegistry.ts](src/factory/ClientRegistry.ts)
6. Update `ChainIdToClient` type mapping
7. Add case to factory `createClient()` and `createTypedClient()` methods
8. Export from [src/index.ts](src/index.ts)
9. Add tests in [tests/networks/](tests/networks/)

## Adding New RPC Methods

To add new RPC methods to existing network:

1. Add method signature to network client class
2. Define return type (create new type if needed)
3. Implement method using `this.execute<T>(method, params)` pattern
4. Handle optional parameters by conditionally building params array
5. Add JSDoc comment explaining method purpose
6. Add test coverage

## Important Notes for AI Assistants

- **No External Dependencies**: This project intentionally has zero production dependencies
- **ES Modules**: All code uses ES module syntax (`import`/`export`)
- **Type Safety**: Prioritize strict TypeScript typing over flexibility
- **Strategy Pattern**: All RPC calls go through the strategy pattern
- **Hex Encoding**: All blockchain numbers are hex-encoded strings (e.g., `"0x1"`)
- **Optional Chaining**: Use for EIP-specific fields (baseFeePerGas, maxFeePerGas, etc.)
- **Biome**: Use Biome for linting/formatting, not ESLint/Prettier
- **Native Test**: Use Node.js native test framework, not Jest/Mocha
