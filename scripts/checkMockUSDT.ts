#!/usr/bin/env ts-node

import { ethers } from "ethers";
import * as dotenv from "dotenv";
dotenv.config();

const RPC_URL = process.env.ETH_RPC_URL || "http://localhost:8545";

const MockUSDT_ADDRESS = process.env.MOCKUSDT || "0x73a8A92025708dc795b57202F40c6883c3D5b300";
if (!MockUSDT_ADDRESS) {
  throw new Error("TOKEN1_ADDRESS must be set in .env");
}
const ABI = [
  "function balanceOf(address) view returns (uint256)",
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const [firstSigner] = await provider.listAccounts();
  console.log("🔗 RPC URL:", RPC_URL);
  console.log("👤 Using account:", firstSigner);

  const token = new ethers.Contract(MockUSDT_ADDRESS, ABI, provider);


  const [
    balanceRaw
  ] = await Promise.all([
    token.balanceOf(firstSigner)
  ]);

  const format = (n: ethers.BigNumberish) => ethers.formatUnits(n, 18);

  console.log("───────────────────────────────────");
  console.log("🏷 Token1 address:     ", MockUSDT_ADDRESS);
  console.log("👤 Your balance (MockUSDT): ", format(balanceRaw));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
