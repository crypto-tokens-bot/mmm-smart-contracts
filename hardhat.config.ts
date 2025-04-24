import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";


import dotenv from "dotenv";

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "";
const PRIVATE_KEYS = process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [];
const ETHERSCAN_API_KEY=process.env.ETHERSCAN_API_KEY || "";

if (!PRIVATE_KEYS[0]) {
  throw new Error("PRIVATE_KEY is missing in .env file!");
}

dotenv.config();
const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    hardhat: {},
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: PRIVATE_KEYS,
    }
  },
  etherscan: {
    apiKey:{
      sepolia: ETHERSCAN_API_KEY
    },
  },
};

export default config;