import "dotenv/config";
import { ethers } from "ethers";

// Your RPC endpoint, eg. Alchemy/Infura/Local
const RPC_URL = process.env.RPC_URL!;
// Deployed Token1 contract
const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS!;
// The user whose profit you want to fetch
const USER_ADDRESS = process.env.USER_ADDRESS!;

const ABI = [
  // if your contract has `function profitOf(address) view returns (uint256)`
  "function pendingProfit(address user) view returns (uint256)",
  "function getPrice() view returns (uint256)",
  // or perhaps: "function pendingProfit(address user) view returns (uint256)"
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);

  const token = new ethers.Contract(TOKEN_ADDRESS, ABI, provider);

  const rawPending: bigint = await token.pendingProfit(USER_ADDRESS);
  const profitTokens = ethers.formatUnits(rawPending, 18);
  console.log(`🔸 Raw pendingProfit for ${USER_ADDRESS}:`, rawPending);
  console.log(`🔸 That is approximately ${profitTokens} USDT`);

  const rawPrice: bigint = await token.getPrice();
  console.log(`🔸 Raw current token price (wei):`, rawPrice.toString());
  console.log(
    `🔸 Current token price:`,
    ethers.formatUnits(rawPrice, 18),
    "USDT per MMM"
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
