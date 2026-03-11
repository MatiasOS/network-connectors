import dotenvFlow from "dotenv-flow";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenvFlow.config({ path: resolve(__dirname, "../..") });

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;

const ALCHEMY_NETWORKS: Record<string, string> = {
  "eth-mainnet": "eth-mainnet",
  "opt-mainnet": "opt-mainnet",
  "bnb-mainnet": "bnb-mainnet",
  "bnb-testnet": "bnb-testnet",
  "matic-mainnet": "matic-mainnet",
  "base-mainnet": "base-mainnet",
  "arb-mainnet": "arb-mainnet",
  "avax-mainnet": "avax-mainnet",
  "eth-sepolia": "eth-sepolia",
  "bitcoin-mainnet": "bitcoin-mainnet",
};

export function getTestUrls(network: string, baseUrls: string[]): string[] {
  if (!ALCHEMY_API_KEY) return baseUrls;
  const subdomain = ALCHEMY_NETWORKS[network];
  if (!subdomain) return baseUrls;
  return [...baseUrls, `https://${subdomain}.g.alchemy.com/v2/${ALCHEMY_API_KEY}`];
}
