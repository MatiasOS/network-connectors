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
 * An RPC endpoint with optional per-endpoint HTTP headers.
 *
 * Use this instead of a plain URL string when a provider requires authentication
 * headers (e.g. `{ "x-api-key": "..." }`). Headers are scoped to this endpoint only,
 * so a credential is never sent to the other URLs configured in the same strategy.
 *
 * Headers apply to HTTP transports only — the WebSocket handshake does not
 * support custom headers.
 */
export interface RpcEndpoint {
  url: string;
  headers?: Record<string, string>;
}

/**
 * Creates a transport based on URL scheme.
 * - ws:// or wss:// → WebSocketRpcClient
 * - http:// or https:// → RpcClient (HTTP)
 *
 * Accepts either a plain URL string or an {@link RpcEndpoint} carrying headers.
 * Headers apply to HTTP transports only — the WebSocket handshake takes no custom
 * headers.
 *
 * @throws Error if headers are supplied for a ws:// or wss:// endpoint. Silently
 * dropping them would produce an unauthenticated connection that fails later and
 * far from its cause, and there is no correct way to honour the request.
 */
export function createTransport(endpoint: string | RpcEndpoint): JsonRpcTransport {
  const url = typeof endpoint === "string" ? endpoint : endpoint.url;
  const headers = typeof endpoint === "string" ? undefined : endpoint.headers;

  if (url.startsWith("ws://") || url.startsWith("wss://")) {
    if (headers && Object.keys(headers).length > 0) {
      throw new Error(
        `Headers are not supported for WebSocket endpoints (${url}). The WebSocket ` +
          `handshake takes no custom headers — use an HTTP endpoint for authenticated ` +
          `requests, or move the credential into the URL if the provider allows it.`,
      );
    }
    return new WebSocketRpcClient(url);
  }
  return new RpcClient(url, headers);
}
