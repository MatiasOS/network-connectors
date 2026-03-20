import type { JsonRpcTransport } from "./JsonRpcTransport.js";
import type { JsonRpcRequest, JsonRpcResponse } from "./RpcClientTypes.js";

interface PendingRequest<T> {
  resolve: (value: T) => void;
  reject: (reason: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

interface SubscriptionHandler {
  // biome-ignore lint/suspicious/noExplicitAny: subscription payloads vary by method
  callback: (data: any) => void;
  errorHandler?: (error: Error) => void;
}

interface WebSocketRpcClientOptions {
  /** Request timeout in milliseconds (default: 30000) */
  requestTimeoutMs?: number;
  /** Maximum reconnection retries (default: 5) */
  maxReconnectRetries?: number;
  /** Initial reconnection delay in milliseconds (default: 1000) */
  initialReconnectDelayMs?: number;
  /** Maximum reconnection delay in milliseconds (default: 30000) */
  maxReconnectDelayMs?: number;
}

export class WebSocketRpcClient implements JsonRpcTransport {
  private url: string;
  private requestId = 0;
  private ws: WebSocket | null = null;
  // biome-ignore lint/suspicious/noExplicitAny: pending requests hold generic resolve/reject
  private pendingRequests: Map<number, PendingRequest<any>> = new Map();
  private subscriptionHandlers: Map<number, SubscriptionHandler> = new Map();
  private connectPromise: Promise<void> | null = null;
  private requestTimeoutMs: number;
  private maxReconnectRetries: number;
  private initialReconnectDelayMs: number;
  private maxReconnectDelayMs: number;
  private closed = false;
  private connectingWs: WebSocket | null = null;

  constructor(url: string, options?: WebSocketRpcClientOptions) {
    this.url = url;
    this.requestTimeoutMs = options?.requestTimeoutMs ?? 30_000;
    this.maxReconnectRetries = options?.maxReconnectRetries ?? 5;
    this.initialReconnectDelayMs = options?.initialReconnectDelayMs ?? 1_000;
    this.maxReconnectDelayMs = options?.maxReconnectDelayMs ?? 30_000;
  }

  // biome-ignore lint/suspicious/noExplicitAny: <TODO>
  async call<T>(method: string, params: any[] = []): Promise<T> {
    await this.ensureConnection();

    const id = ++this.requestId;
    const request: JsonRpcRequest = {
      jsonrpc: "2.0",
      id,
      method,
      params,
    };

    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(
          new Error(
            `WebSocket request timeout after ${this.requestTimeoutMs}ms for method: ${method}`,
          ),
        );
      }, this.requestTimeoutMs);

      this.pendingRequests.set(id, { resolve, reject, timer });

      try {
        this.ws?.send(JSON.stringify(request));
      } catch (error) {
        clearTimeout(timer);
        this.pendingRequests.delete(id);
        reject(
          new Error(
            `WebSocket send error: ${error instanceof Error ? error.message : String(error)}`,
          ),
        );
      }
    });
  }

  /**
   * Subscribe to server-pushed notifications
   * Sends a subscribe request via call(), then registers a handler for incoming notifications
   *
   * @param subscribeMethod - The RPC method to subscribe (e.g., "slotSubscribe")
   * @param unsubscribeMethod - The RPC method to unsubscribe (e.g., "slotUnsubscribe")
   * @param params - Parameters for the subscribe call
   * @param callback - Handler invoked for each notification payload
   * @param errorHandler - Optional handler invoked on connection loss
   * @returns Object with subscriptionId and unsubscribe() function
   */
  async subscribe<T>(
    subscribeMethod: string,
    unsubscribeMethod: string,
    // biome-ignore lint/suspicious/noExplicitAny: subscription params vary by method
    params: any[],
    callback: (data: T) => void,
    errorHandler?: (error: Error) => void,
  ): Promise<{ subscriptionId: number; unsubscribe: () => Promise<boolean> }> {
    const subscriptionId = await this.call<number>(subscribeMethod, params);

    this.subscriptionHandlers.set(subscriptionId, {
      callback,
      errorHandler,
    });

    const unsubscribe = async (): Promise<boolean> => {
      this.subscriptionHandlers.delete(subscriptionId);
      try {
        return await this.call<boolean>(unsubscribeMethod, [subscriptionId]);
      } catch {
        return false;
      }
    };

    return { subscriptionId, unsubscribe };
  }

  getUrl(): string {
    return this.url;
  }

  getRequestId(): number {
    return this.requestId;
  }

  async close(): Promise<void> {
    this.closed = true;
    this.rejectAllPending(new Error("WebSocket connection closed by client"));

    if (this.connectingWs) {
      this.connectingWs.onopen = null;
      this.connectingWs.onclose = null;
      this.connectingWs.onerror = null;
      this.connectingWs.close();
      this.connectingWs = null;
    }

    if (this.ws) {
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;
      this.ws.close();
      this.ws = null;
    }

    this.connectPromise = null;
    this.closed = false;
  }

  private async ensureConnection(): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    if (this.connectPromise) {
      return this.connectPromise;
    }

    this.connectPromise = this.connectWithRetry();
    try {
      await this.connectPromise;
    } catch (error) {
      this.connectPromise = null;
      throw error;
    }
  }

  private async connectWithRetry(): Promise<void> {
    let delay = this.initialReconnectDelayMs;

    for (let attempt = 0; attempt <= this.maxReconnectRetries; attempt++) {
      if (this.closed) {
        throw new Error("WebSocket client is closed");
      }
      try {
        await this.connect();
        return;
      } catch (error) {
        if (this.closed) {
          throw new Error("WebSocket client is closed");
        }
        if (attempt === this.maxReconnectRetries) {
          throw new Error(
            `WebSocket connection failed after ${this.maxReconnectRetries + 1} attempts: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
        await this.sleep(delay);
        delay = Math.min(delay * 2, this.maxReconnectDelayMs);
      }
    }
  }

  private connect(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (this.closed) {
        reject(new Error("WebSocket client is closed"));
        return;
      }

      const ws = new WebSocket(this.url);
      this.connectingWs = ws;

      ws.onopen = () => {
        this.connectingWs = null;
        this.ws = ws;
        this.setupMessageHandler(ws);
        this.setupCloseHandler(ws);
        resolve();
      };

      ws.onerror = (event) => {
        this.connectingWs = null;
        reject(new Error(`WebSocket connection error to ${this.url}: ${String(event)}`));
      };

      ws.onclose = () => {
        this.connectingWs = null;
        reject(new Error(`WebSocket connection closed before opening to ${this.url}`));
      };
    });
  }

  private setupMessageHandler(ws: WebSocket): void {
    ws.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(String(event.data));

        // Subscription notification: has method + params.subscription, no id
        if (data.id == null && data.method && data.params?.subscription != null) {
          const handler = this.subscriptionHandlers.get(data.params.subscription);
          if (handler) {
            handler.callback(data.params.result);
          }
          return;
        }

        // Standard request/response: has id
        const response: JsonRpcResponse = data;
        if (response.id == null) {
          return;
        }

        const id = typeof response.id === "string" ? Number.parseInt(response.id, 10) : response.id;
        const pending = this.pendingRequests.get(id);

        if (!pending) {
          return;
        }

        clearTimeout(pending.timer);
        this.pendingRequests.delete(id);

        if (response.error) {
          pending.reject(new Error(`RPC error: ${response.error.message}`));
        } else {
          pending.resolve(response.result);
        }
      } catch {
        // Malformed JSON — ignore
      }
    };
  }

  private setupCloseHandler(ws: WebSocket): void {
    ws.onclose = () => {
      if (this.ws === ws) {
        this.ws = null;
        this.connectPromise = null;
        this.rejectAllPending(new Error("WebSocket connection closed unexpectedly"));
      }
    };
  }

  private rejectAllPending(error: Error): void {
    this.pendingRequests.forEach((pending, id) => {
      clearTimeout(pending.timer);
      pending.reject(error);
      this.pendingRequests.delete(id);
    });

    // Notify subscription error handlers and clear all subscriptions
    this.subscriptionHandlers.forEach((handler) => {
      handler.errorHandler?.(error);
    });
    this.subscriptionHandlers.clear();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
