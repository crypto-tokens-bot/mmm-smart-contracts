import { ethers } from "hardhat";
import * as dotenv from 'dotenv';

import {sepolia, arbitrum_sepolia } from "../addresses/token_list.json";

async function main() {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY || "0x", provider);

    const mockUSDTAddress = sepolia.MockUSDT || "0x";
    const mmmTokenAddress = sepolia.MMM || "0x";

    const mockUSDT = await ethers.getContractAt("MockUSDT", mockUSDTAddress, wallet);
    const mmmToken = await ethers.getContractAt("Token1", mmmTokenAddress, wallet);

    const amount = ethers.parseUnits("1000", 18);

    console.log("Approving MMM contract to spend USDT...");
    const approveTx = await mockUSDT.approve(mmmTokenAddress, amount);
    await approveTx.wait();
    console.log("✅ Approved!");

    console.log("Depositing USDT into MMM contract...");
    const depositTx = await mmmToken.deposit(amount, mockUSDTAddress);
    await depositTx.wait();
    console.log("✅ Deposit successful! You now have MMM tokens.");
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
