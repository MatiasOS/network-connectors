export interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: number | string;
  method: string;
  // biome-ignore lint/suspicious/noExplicitAny: <TODO>
  params?: any[];
}

// biome-ignore lint/suspicious/noExplicitAny: <TODO>
export interface JsonRpcResponse<T = any> {
  jsonrpc: "2.0";
  id: number | string;
  result?: T;
  error?: {
    code: number;
    message: string;
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    data?: any;
  };
}

/**
 * JSON-RPC 2.0 notification (server-pushed)
 * Used for WebSocket subscription notifications (e.g., Solana pubsub)
 */
// biome-ignore lint/suspicious/noExplicitAny: subscription payloads vary by method
export interface JsonRpcNotification<T = any> {
  jsonrpc: "2.0";
  method: string;
  params: {
    subscription: number;
    result: T;
  };
}
