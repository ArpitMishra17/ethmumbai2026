import { createPublicClient, http, parseAbi } from "viem";
import { baseSepolia } from "viem/chains";

const client = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

const abi = parseAbi([
  "function getAgent(uint256) view returns ((address owner, string name, string ensName, string metadataURI, bool isActive))"
]);

async function main() {
  try {
    const res = await client.readContract({
      address: "0xd3bc80f778F17Ad447a34E28268cC16e2A1d09cd",
      abi,
      functionName: "getAgent",
      args: [8n],
    });
    console.log("Agent 8:", res);
  } catch (err) {
    console.error("Error reading agent 8:", err);
  }
}

main();
