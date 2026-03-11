import type { JsonRpcTransport } from "./JsonRpcTransport.js";
import type { JsonRpcRequest, JsonRpcResponse } from "./RpcClientTypes.js";

interface PendingRequest<T> {
  resolve: (value: T) => void;
  reject: (reason: Error) => void;
  timer: ReturnType<typeof setTimeout>;
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
  private connectPromise: Promise<void> | null = null;
  private requestTimeoutMs: number;
  private maxReconnectRetries: number;
  private initialReconnectDelayMs: number;
  private maxReconnectDelayMs: number;

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

  getUrl(): string {
    return this.url;
  }

  getRequestId(): number {
    return this.requestId;
  }

  async close(): Promise<void> {
    this.rejectAllPending(new Error("WebSocket connection closed by client"));

    if (this.ws) {
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;
      this.ws.close();
      this.ws = null;
    }

    this.connectPromise = null;
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
      try {
        await this.connect();
        return;
      } catch (error) {
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
      const ws = new WebSocket(this.url);

      ws.onopen = () => {
        this.ws = ws;
        this.setupMessageHandler(ws);
        this.setupCloseHandler(ws);
        resolve();
      };

      ws.onerror = (event) => {
        reject(new Error(`WebSocket connection error to ${this.url}: ${String(event)}`));
      };
    });
  }

  private setupMessageHandler(ws: WebSocket): void {
    ws.onmessage = (event: MessageEvent) => {
      try {
        const response: JsonRpcResponse = JSON.parse(String(event.data));

        if (response.id == null) {
          // Server-initiated message (e.g., subscription notification) — ignore for now
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
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
