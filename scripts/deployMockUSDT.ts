import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import { Wallet, JsonRpcProvider } from "ethers";

async function main() {
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

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
