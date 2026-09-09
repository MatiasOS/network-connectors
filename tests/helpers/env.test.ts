import { describe, it } from "node:test";
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../..");

/**
 * Mirrors the placeholder rule in env.ts. Kept as a local copy rather than an
 * export so the test pins the intended behaviour rather than whatever env.ts
 * currently does.
 */
function isPlaceholder(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.startsWith("<") && trimmed.endsWith(">");
}

describe("test env - .env.example placeholders [strong]", () => {
  it("should ship every value as a recognisable placeholder", () => {
    const example = readFileSync(resolve(repoRoot, ".env.example"), "utf8");

    const assignments = example
      .split("\n")
      .filter((line) => line.trim() && !line.trim().startsWith("#"))
      .map((line) => line.split("="));

    assert.ok(assignments.length > 0, ".env.example should declare variables");

    for (const [name, ...rest] of assignments) {
      const value = rest.join("=");
      assert.ok(
        isPlaceholder(value),
        `${name} should ship as a <placeholder> so copying .env.example never looks configured`,
      );
    }
  });

  it("should treat a copied .env.example as unconfigured", async () => {
    // Simulate `cp .env.example .env` by exporting the placeholders, then load a
    // fresh copy of env.ts so its module-level constants are recomputed.
    process.env.TATUM_API_KEY = "<tatum_api_key>";
    process.env.ZCASH_RPC_URL = "<zcash_rpc_url>";
    process.env.ALCHEMY_API_KEY = "<alchemy_api_key>";

    const env = await import(`./env.js?placeholder-check=${Date.now()}`);

    assert.strictEqual(env.hasTatumApiKey, false, "A placeholder key must not count as a key");
    assert.strictEqual(env.hasZcashNodeUrl, false, "A placeholder URL must not count as a node");

    assert.deepStrictEqual(
      env.getZcashTestEndpoints(["https://zcash.example"]),
      ["https://zcash.example"],
      "A placeholder ZCASH_RPC_URL must not be spliced into the endpoint list",
    );
    assert.deepStrictEqual(
      env.getTestUrls("eth-mainnet", ["https://eth.example"]),
      ["https://eth.example"],
      "A placeholder ALCHEMY_API_KEY must not append an Alchemy URL",
    );
  });
});
