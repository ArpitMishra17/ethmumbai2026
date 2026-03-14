import { createPublicClient, http, formatEther } from "viem";
import { baseSepolia } from "viem/chains";

const client = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

async function main() {
  const address = "0x73C51E918887C0322eAe44E12075827804A4cC6c";
  const balance = await client.getBalance({ address });
  console.log(`Balance of ${address}: ${formatEther(balance)} ETH`);
}

main();
