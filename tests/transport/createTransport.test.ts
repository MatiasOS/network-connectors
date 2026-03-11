import { describe, it } from "node:test";
import assert from "node:assert";
import { createTransport } from "../../src/JsonRpcTransport.js";
import { RpcClient } from "../../src/RpcClient.js";
import { WebSocketRpcClient } from "../../src/WebSocketRpcClient.js";

describe("createTransport - Auto-Detection", () => {
  it("should return RpcClient for https:// URL", () => {
    const transport = createTransport("https://ethereum.publicnode.com");
    assert.ok(transport instanceof RpcClient, "Should create RpcClient for https URL");
  });

  it("should return RpcClient for http:// URL", () => {
    const transport = createTransport("http://localhost:8545");
    assert.ok(transport instanceof RpcClient, "Should create RpcClient for http URL");
  });

  it("should return WebSocketRpcClient for wss:// URL", () => {
    const transport = createTransport("wss://ethereum.publicnode.com");
    assert.ok(
      transport instanceof WebSocketRpcClient,
      "Should create WebSocketRpcClient for wss URL",
    );
  });

  it("should return WebSocketRpcClient for ws:// URL", () => {
    const transport = createTransport("ws://localhost:8545");
    assert.ok(
      transport instanceof WebSocketRpcClient,
      "Should create WebSocketRpcClient for ws URL",
    );
  });

  it("should preserve URL in created transport", () => {
    const httpUrl = "https://ethereum.publicnode.com";
    const wsUrl = "wss://ethereum.publicnode.com";

    assert.strictEqual(createTransport(httpUrl).getUrl(), httpUrl);
    assert.strictEqual(createTransport(wsUrl).getUrl(), wsUrl);
  });
});
