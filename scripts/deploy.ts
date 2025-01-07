import { ethers, run, network} from 'hardhat';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
    if (!process.env.USDT_ADDRESS || !process.env.TREASURY_ADDRESS) {
        throw new Error("USDT_ADDRESS or TREASURY_ADDRESS not set in .env");
    }

    console.log("🚀 Deploying Token1 contract...");

    const [deployer] = await ethers.getSigners();
    console.log("📌 Deployer Address:", await deployer.getAddress());

    // Deploy Token1
    const Token1 = await ethers.getContractFactory("Token1");
    const token1 = await Token1.deploy(process.env.USDT_ADDRESS, process.env.TREASURY_ADDRESS);

    console.log("⏳ Waiting for 5 confirmations...");
    await token1.deploymentTransaction()?.wait(5);

    const contractAddress = await token1.getAddress();
    console.log("Token1 deployed at:", contractAddress);
    if (network.name !== "hardhat") {
        console.log("🔍 Verifying contract on Etherscan...");

        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: [process.env.USDT_ADDRESS, process.env.TREASURY_ADDRESS],
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