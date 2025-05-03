#!/usr/bin/env ts-node

import { ethers } from "ethers";
import * as dotenv from "dotenv";
dotenv.config();

const RPC_URL = process.env.ETH_RPC_URL || "http://localhost:8545";

const TOKEN1_ADDRESS = process.env.TOKEN1_ADDRESS || "";
if (!TOKEN1_ADDRESS) {
  throw new Error("TOKEN1_ADDRESS must be set in .env");
}
const ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function getPrice() view returns (uint256)",
  "function usdt() view returns (address)",
  "function treasury() view returns (address)",
  "function totalStable() view returns (uint256)",
  "function totalBorrowMMM() view returns (uint256)",
];

async function main() {
  // ----------------------------------------------------------------
  // 2. Initialization of the provider and recipient (default Account#0).
  // ----------------------------------------------------------------
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const [firstSigner] = await provider.listAccounts();
  console.log("🔗 RPC URL:", RPC_URL);
  console.log("👤 Using account:", firstSigner);

  // ----------------------------------------------------------------
  // 3. Instantiating the contract
  // ----------------------------------------------------------------
  const token = new ethers.Contract(TOKEN1_ADDRESS, ABI, provider);

  // ----------------------------------------------------------------
  // 4. Reading the data
  // ----------------------------------------------------------------
  const [
    balanceRaw,
    //priceRaw,
    usdtAddr,
    treasuryAddr,
    totalStableRaw,
    totalBorrowRaw,
  ] = await Promise.all([
    token.balanceOf(firstSigner),
    //token.getPrice(),
    token.usdt(),
    token.treasury(),
    token.totalStable(),
    token.totalBorrowMMM(),
  ]);

  // ----------------------------------------------------------------
  // 5. Formatting and outputting
  // ----------------------------------------------------------------
  const format = (n: ethers.BigNumberish) => ethers.formatUnits(n, 18);

  console.log("───────────────────────────────────");
  console.log("🏷 Token1 address:     ", TOKEN1_ADDRESS);
  console.log("👤 Your balance (MMM): ", format(balanceRaw));
  //console.log("💰 Current price:      ", format(priceRaw), "USDT per MMM");
  console.log("🪙 USDT token address: ", usdtAddr);
  console.log("🏦 Treasury address:   ", treasuryAddr);
  console.log("📊 totalStable (USDT): ", format(totalStableRaw));
  console.log("📈 totalBorrowMMM:     ", format(totalBorrowRaw));
  console.log("───────────────────────────────────");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
