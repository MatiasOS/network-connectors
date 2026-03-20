import { describe, it } from "node:test";
import assert from "node:assert";
import { SolanaClient } from "../../../../src/networks/solana/SolanaClient.js";
import type { SolSlotNotification } from "../../../../src/networks/solana/SolanaTypes.js";
import type { StrategyConfig } from "../../../../src/strategies/requestStrategy.js";

const SOLANA_DEVNET_WS_URL = "wss://api.devnet.solana.com";
const SOLANA_DEVNET_HTTP_URL = "https://api.devnet.solana.com";

const config: StrategyConfig = {
  type: "fallback",
  rpcUrls: [SOLANA_DEVNET_HTTP_URL, SOLANA_DEVNET_WS_URL],
};

describe("SolanaClient (WebSocket) - Slot Subscription [strong]", () => {
  it("should receive slot notifications via slotSubscribe", async () => {
    const client = new SolanaClient(config);

    try {
      const notifications: SolSlotNotification[] = [];

      const { subscriptionId, unsubscribe } = await client.slotSubscribe((data) => {
        notifications.push(data);
      });

      assert.strictEqual(typeof subscriptionId, "number", "subscriptionId should be a number");
      assert.ok(subscriptionId >= 0, "subscriptionId should be non-negative");

      // Wait for at least one notification (slots happen every ~400ms)
      await new Promise<void>((resolve) => {
        const check = setInterval(() => {
          if (notifications.length > 0) {
            clearInterval(check);
            resolve();
          }
        }, 200);
        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(check);
          resolve();
        }, 10_000);
      });

      assert.ok(notifications.length > 0, "Should receive at least one slot notification");

      const notification = notifications[0];
      assert.strictEqual(typeof notification.slot, "number", "slot should be a number");
      assert.strictEqual(typeof notification.parent, "number", "parent should be a number");
      assert.strictEqual(typeof notification.root, "number", "root should be a number");

      const result = await unsubscribe();
      assert.strictEqual(result, true, "Unsubscribe should return true");
    } finally {
      await client.close();
    }
  });
});

describe("SolanaClient (WebSocket) - Root Subscription [strong]", () => {
  it("should receive root notifications via rootSubscribe", async () => {
    const client = new SolanaClient(config);

    try {
      const roots: number[] = [];

      const { subscriptionId, unsubscribe } = await client.rootSubscribe((data) => {
        roots.push(data);
      });

      assert.strictEqual(typeof subscriptionId, "number", "subscriptionId should be a number");

      // Wait for at least one notification
      await new Promise<void>((resolve) => {
        const check = setInterval(() => {
          if (roots.length > 0) {
            clearInterval(check);
            resolve();
          }
        }, 200);
        setTimeout(() => {
          clearInterval(check);
          resolve();
        }, 10_000);
      });

      assert.ok(roots.length > 0, "Should receive at least one root notification");
      assert.strictEqual(typeof roots[0], "number", "Root should be a number");

      const result = await unsubscribe();
      assert.strictEqual(result, true, "Unsubscribe should return true");
    } finally {
      await client.close();
    }
  });
});

describe("SolanaClient (WebSocket) - Error Handling [strong]", () => {
  it("should throw when subscribing without a WebSocket URL", async () => {
    const httpOnlyConfig: StrategyConfig = {
      type: "fallback",
      rpcUrls: [SOLANA_DEVNET_HTTP_URL],
    };
    const client = new SolanaClient(httpOnlyConfig);

    await assert.rejects(
      () => client.slotSubscribe(() => {}),
      /Solana subscriptions require at least one ws:\/\/ or wss:\/\/ URL/,
      "Should throw when no WebSocket URL is configured",
    );
  });

  it("should close subscription WebSocket on client close", async () => {
    const client = new SolanaClient(config);

    const { subscriptionId } = await client.slotSubscribe(() => {});
    assert.strictEqual(typeof subscriptionId, "number", "Should subscribe successfully");

    // close() should not throw
    await client.close();
  });
});
