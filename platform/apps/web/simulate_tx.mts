import { createPublicClient, http, parseAbi } from "viem";
import { baseSepolia } from "viem/chains";

const client = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

const abi = parseAbi([
  "function setMetadataURI(uint256 agentId, string uri) external"
]);

async function main() {
  const address = "0x73C51E918887C0322eAe44E12075827804A4cC6c";
  
  try {
    const gas = await client.estimateContractGas({
      address: "0xd3bc80f778F17Ad447a34E28268cC16e2A1d09cd",
      abi,
      functionName: "setMetadataURI",
      args: [8n, "http://localhost:3000/api/agents/8/metadata"],
      account: address,
    });
    console.log("Gas estimation successful:", gas.toString());

    const { request } = await client.simulateContract({
      address: "0xd3bc80f778F17Ad447a34E28268cC16e2A1d09cd",
      abi,
      functionName: "setMetadataURI",
      args: [8n, "http://localhost:3000/api/agents/8/metadata"],
      account: address,
    });
    console.log("Simulation successful:", request.functionName);

  } catch (err) {
    console.error("Error simulating transaction:", err);
  }
}

main();
