import { ethers, network } from "hardhat";
import * as dotenv from "dotenv";
import { Wallet, JsonRpcProvider, Signer } from "ethers";

dotenv.config();

async function fork_deploy() {
  if (!process.env.PRIVATE_KEY) {
    throw new Error("Missing .env variables!");
  }
  let deployer: Signer;

  [deployer] = await ethers.getSigners();
  console.log(
    `🐣 Fork deployment — using Hardhat signer:`,
    await deployer.getAddress()
  );

  // const provider = new JsonRpcProvider(process.env.SEPOLIA_RPC_URL);

  const MockUSDT = await ethers.getContractFactory("MockUSDT", deployer);
  const usdt = await MockUSDT.deploy();

  await usdt.deploymentTransaction()?.wait(0);
  console.log(`Mock USDT deployed at: ${await usdt.getAddress()}`);
}

async function deploy() {
  if (!process.env.PRIVATE_KEY || !process.env.SEPOLIA_RPC_URL) {
    throw new Error("Missing .env variables!");
  }

  const provider = new JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const wallet = new Wallet(process.env.PRIVATE_KEY, provider);

  const MockUSDT = await ethers.getContractFactory("MockUSDT", wallet);
  const usdt = await MockUSDT.deploy();

  // Wait for deployment confirmation
  await usdt.deploymentTransaction()?.wait(5); // Wait for 5 confirmations

  console.log(`Mock USDT deployed at: ${await usdt.getAddress()}`);
}

async function main() {
  if (network.name === "hardhat" || network.name === "localhost") {
    await fork_deploy();
  } else {
    await deploy();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
