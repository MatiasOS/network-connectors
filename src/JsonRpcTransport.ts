import { RpcClient } from "./RpcClient.js";
import { WebSocketRpcClient } from "./WebSocketRpcClient.js";

/**
 * Interface for JSON-RPC transport implementations.
 * Both HTTP (RpcClient) and WebSocket (WebSocketRpcClient) implement this.
 */
export interface JsonRpcTransport {
  // biome-ignore lint/suspicious/noExplicitAny: <TODO>
  call<T>(method: string, params?: any[]): Promise<T>;
  getUrl(): string;
  close?(): Promise<void>;
}

/**
 * Creates a transport based on URL scheme.
 * - ws:// or wss:// → WebSocketRpcClient
 * - http:// or https:// → RpcClient (HTTP)
 */
export function createTransport(url: string): JsonRpcTransport {
  if (url.startsWith("ws://") || url.startsWith("wss://")) {
    return new WebSocketRpcClient(url);
  }
  return new RpcClient(url);
}
