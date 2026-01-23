import type {
  RequestStrategy,
  StrategyResult,
  RPCProviderResponse,
  RPCMetadata,
} from "./strategiesTypes.js";
import type { RpcClient } from "../RpcClient.js";

interface RaceWinner<T> {
  data: T;
  response: RPCProviderResponse;
}

export class RaceStrategy implements RequestStrategy {
  private rpcClients: RpcClient[];

  constructor(rpcClients: RpcClient[]) {
    if (rpcClients.length === 0) {
      throw new Error("At least one RPC client must be provided");
    }
    this.rpcClients = rpcClients;
  }

  /**
   * Execute request as a race across all RPC clients
   * Returns the first successful response immediately, minimizing latency
   * Only fails if ALL requests fail
   */
  // biome-ignore lint/suspicious/noExplicitAny: <TODO>
  async execute<T>(method: string, params: any[]): Promise<StrategyResult<T>> {
    const timestamp = Date.now();
    const errors: RPCProviderResponse[] = [];

    // Create promises that resolve with data or reject with error info
    const racePromises = this.rpcClients.map(async (rpcClient): Promise<RaceWinner<T>> => {
      const startTime = Date.now();
      try {
        const data = await rpcClient.call<T>(method, params);
        const responseTime = Date.now() - startTime;

        return {
          data,
          response: {
            url: rpcClient.getUrl(),
            status: "success",
            responseTime,
            data,
          },
        };
      } catch (error) {
        const responseTime = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);

        const errorResponse: RPCProviderResponse = {
          url: rpcClient.getUrl(),
          status: "error",
          responseTime,
          error: errorMessage,
        };

        // Track error for metadata
        errors.push(errorResponse);

        // Reject so Promise.any continues to next
        throw errorResponse;
      }
    });

    try {
      // Promise.any returns first fulfilled promise
      const winner = await Promise.any(racePromises);

      const metadata: RPCMetadata = {
        strategy: "race",
        timestamp,
        responses: [winner.response, ...errors],
        hasInconsistencies: false, // Race doesn't compare responses
      };

      return {
        success: true,
        data: winner.data,
        metadata,
      };
    } catch (_aggregateError) {
      // All promises rejected - AggregateError contains all rejection reasons
      const metadata: RPCMetadata = {
        strategy: "race",
        timestamp,
        responses: errors,
        hasInconsistencies: false,
      };

      return {
        success: false,
        errors,
        metadata,
      };
    }
  }

  getName(): string {
    return "race";
  }
}
