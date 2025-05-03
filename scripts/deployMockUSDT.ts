import { ethers, network } from "hardhat";
import * as dotenv from "dotenv";
import { Wallet, JsonRpcProvider, Signer } from "ethers";

async function main() {
  let deployer: Signer;

//   if (!process.env.PRIVATE_KEY || !process.env.SEPOLIA_RPC_URL) {
//     throw new Error("Missing .env variables!");
//   }
  if (network.name === "hardhat" || network.name === "localhost") {
    [deployer] = await ethers.getSigners();
    console.log(
      `🐣 Fork deployment — using Hardhat signer:`,
      await deployer.getAddress()
    );
  } else {
    const url = process.env.SEPOLIA_RPC_URL;
    const key = process.env.PRIVATE_KEY;
    if (!url || !key) {
      throw new Error(
        "To deploy on a real network, set SEPOLIA_RPC_URL and PRIVATE_KEY in .env"
      );
    }
    const provider = new JsonRpcProvider(url);
    deployer = new Wallet(key, provider);
    console.log(
      `🚀 Real-net deployment — using Ethers wallet:`,
      await (deployer as Wallet).getAddress()
    );
  }
  // const provider = new JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  //const wallet = new Wallet(process.env.PRIVATE_KEY, provider);

  const MockUSDT = await ethers.getContractFactory("MockUSDT", deployer);
  const usdt = await MockUSDT.deploy();

  // Wait for deployment confirmation
  if (network.name === "hardhat" || network.name === "localhost") {
    //await token1.deploymentTransaction()?.wait();
    await usdt.deploymentTransaction()?.wait(0); // Wait for 5 confirmations
} else {
    await usdt.deploymentTransaction()?.wait(5); // Wait for 5 confirmations
}

  console.log(`Mock USDT deployed at: ${await usdt.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
