import { HardhatUserConfig, task } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";

import { sepolia } from "./addresses/token_list.json";

import dotenv from "dotenv";

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "";
const PRIVATE_KEYS = process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [];
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

if (!PRIVATE_KEYS[0]) {
  throw new Error("PRIVATE_KEY is missing in .env file!");
}

dotenv.config();
const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    hardhat: {
      initialBaseFeePerGas: 0,
      forking: {
        url: process.env.SEPOLIA_RPC_URL!,
        blockNumber: 7920355,
      },
    },
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: PRIVATE_KEYS,
    },
  },
  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_API_KEY,
    },
  },
};

task("deposit", "Deposit USDT into Token1")
  .addParam("amount", "How much USDT to deposit, in whole tokens")
  .setAction(async ({ amount }, { ethers }) => {
    const usdtAddr = sepolia.MockUSDT;
    const tokenAddr = sepolia.MMM;
    //const [signer] = await ethers.getSigners();
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const signer = new ethers.Wallet(process.env.PRIVATE_KEY || "0x", provider);
    

    const token = await ethers.getContractAt("Token1", tokenAddr, signer);
    const usdt = await ethers.getContractAt("IERC20", usdtAddr, signer);
    const amountWei = ethers.parseUnits(amount, 6); // USDT as a rules 6 decimals
    await usdt.approve(tokenAddr, amountWei);
    console.log("✅ approved");

    // Теперь депозит
    const tx = await token.deposit(amountWei, usdtAddr);
    console.log("📡 tx sent:", tx.hash);
    await tx.wait();
    console.log("✅ deposited");
  });

export default config;
