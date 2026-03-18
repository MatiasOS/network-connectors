import { describe, it } from "node:test";
import assert from "node:assert";
import { RpcClient } from "../../src/RpcClient.js";
import { WebSocketRpcClient } from "../../src/WebSocketRpcClient.js";
import type { JsonRpcTransport } from "../../src/JsonRpcTransport.js";
import { isHexString } from "../helpers/validators.js";
import { getTestUrls, getTestWsUrls } from "../helpers/env.js";

const HTTP_URL = getTestUrls("eth-mainnet", ["https://ethereum.publicnode.com"])[0];
const WS_URL = getTestWsUrls("eth-mainnet", ["wss://ethereum.publicnode.com"])[0];

describe("JsonRpcTransport - Interface Contract", () => {
  it("should verify RpcClient satisfies JsonRpcTransport interface", () => {
    const client: JsonRpcTransport = new RpcClient(HTTP_URL);
    assert.ok(typeof client.call === "function", "Should have call method");
    assert.ok(typeof client.getUrl === "function", "Should have getUrl method");
    assert.strictEqual(client.getUrl(), HTTP_URL, "Should return correct URL");
  });

  it("should verify WebSocketRpcClient satisfies JsonRpcTransport interface", () => {
    const client: JsonRpcTransport = new WebSocketRpcClient(WS_URL);
    assert.ok(typeof client.call === "function", "Should have call method");
    assert.ok(typeof client.getUrl === "function", "Should have getUrl method");
    assert.ok(typeof client.close === "function", "Should have close method");
    assert.strictEqual(client.getUrl(), WS_URL, "Should return correct URL");
  });

  it("should return same result for eth_chainId via both transports", async () => {
    const httpClient = new RpcClient(HTTP_URL);
    const wsClient = new WebSocketRpcClient(WS_URL);

    const [httpResult, wsResult] = await Promise.all([
      httpClient.call<string>("eth_chainId", []),
      wsClient.call<string>("eth_chainId", []),
    ]);

    assert.strictEqual(httpResult, wsResult, "Both transports should return the same chain ID");
    assert.ok(isHexString(httpResult), "Chain ID should be hex string");
    assert.strictEqual(httpResult, "0x1", "Should be Ethereum mainnet");

    await wsClient.close();
  });

  it("should return same result for eth_blockNumber via both transports", async () => {
    const httpClient = new RpcClient(HTTP_URL);
    const wsClient = new WebSocketRpcClient(WS_URL);

    const [httpResult, wsResult] = await Promise.all([
      httpClient.call<string>("eth_blockNumber", []),
      wsClient.call<string>("eth_blockNumber", []),
    ]);

    assert.ok(isHexString(httpResult), "HTTP block number should be hex string");
    assert.ok(isHexString(wsResult), "WS block number should be hex string");

    // Block numbers should be close (within a few blocks due to timing)
    const httpBlock = Number.parseInt(httpResult, 16);
    const wsBlock = Number.parseInt(wsResult, 16);
    assert.ok(
      Math.abs(httpBlock - wsBlock) < 10,
      "Block numbers should be within 10 blocks of each other",
    );

    await wsClient.close();
  });
});
