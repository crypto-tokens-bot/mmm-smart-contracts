import { ethers, run, network } from "hardhat";
import * as dotenv from "dotenv";
import { JsonRpcProvider, Signer, Wallet } from "ethers";

dotenv.config();

async function main() {
  let deployer: Signer;
  if (!process.env.USDT_ADDRESS || !process.env.TREASURY_ADDRESS) {
    throw new Error("USDT_ADDRESS or TREASURY_ADDRESS not set in .env");
  }

  console.log("🚀 Deploying Token1 contract...");

  if (network.name === "hardhat" || network.name === "localhost") {
    // — local node / fork: we take the first account from hardhat
    [deployer] = await ethers.getSigners();
    console.log("🔧 Using hardhat signer:", await deployer.getAddress());
  } else {
    // — real network: we create a provider and a wallet from a gatekeeper
    const url = process.env.SEPOLIA_RPC_URL;
    const key = process.env.PRIVATE_KEY;
    if (!url || !key) {
      throw new Error(
        "For real networks, set SEPOLIA_RPC_URL and PRIVATE_KEY in .env"
      );
    }
    const provider = new JsonRpcProvider(url);
    deployer = new Wallet(key, provider);
    console.log("🌐 Using remote wallet:", await deployer.getAddress());
  }

  // Deploy Token1
  const Token1 = await ethers.getContractFactory("Token1");
  const token1 = await Token1.deploy(
    process.env.USDT_ADDRESS,
    process.env.TREASURY_ADDRESS
  );

  console.log("⏳ Waiting for confirmations...");
  if (network.name === "hardhat" || network.name === "localhost") {
    await token1.deploymentTransaction()?.wait();
  } else {
    await token1.deploymentTransaction()?.wait(5);
  }

  const contractAddress = await token1.getAddress();
  console.log("Token1 deployed at:", contractAddress);
  if (network.name != "hardhat" && network.name != "localhost") {
    console.log("🔍 Verifying contract on Etherscan...");

    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: [
        process.env.USDT_ADDRESS,
        process.env.TREASURY_ADDRESS,
      ],
    });

    console.log("✅ Contract verified on Etherscan!");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
