import { ethers } from "hardhat";
import * as dotenv from "dotenv";

import {sepolia, arbitrum_sepolia } from "../addresses/token_list.json";

dotenv.config();

async function main() {
    if (!process.env.RPC_URL || !process.env.PRIVATE_KEY) {
        throw new Error("RPC_URL or PRIVATE_KEY is missing in .env");
    }

    const mmmTokenAddress = sepolia.MMM;
    const withdrawAmount = ethers.parseUnits("500", 18);

    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

    // Get the MMM Token contract
    const mmmToken = await ethers.getContractAt("Token1", mmmTokenAddress, wallet);

    console.log(`Withdrawing ${ethers.formatUnits(withdrawAmount, 18)} MMM tokens...`);

    const tx = await mmmToken.withdraw(withdrawAmount);
    console.log("Transaction sent:", tx.hash);

    await tx.wait();
    console.log(`Successfully withdrew ${ethers.formatUnits(withdrawAmount, 18)} MMM tokens!`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
