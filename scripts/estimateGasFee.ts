/// npx hardhat run --network sepolia scripts/estimateGasFee.ts
import "dotenv/config";
import { ethers } from "hardhat";
import { JsonRpcProvider, Wallet, formatEther, formatUnits  } from "ethers";

async function estimateDeployment(contractName: string) {
  if (!process.env.PRIVATE_KEY || !process.env.SEPOLIA_RPC_URL) {
    throw new Error("Missing .env variables!");
  }
  const provider = new JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const wallet   = new Wallet(process.env.PRIVATE_KEY, provider);

  const Token1 = await ethers.getContractFactory(contractName, wallet);
  
  const deploymentData = Token1.interface.encodeDeploy([
    process.env.USDT_ADDRESS,
    process.env.TREASURY_ADDRESS
  ]);

  const bytecode = Token1.bytecode;
  const fullDeploymentData = bytecode + deploymentData.slice(2);

  const feeData = await provider.getFeeData();

  const estimatedGasLimit = await provider.estimateGas({
    from: await wallet.getAddress(),
    data: fullDeploymentData
  });

  let gasCost;
  if (feeData.maxFeePerGas) {
    gasCost = estimatedGasLimit * feeData.maxFeePerGas;
    console.log(`Max price for gas: ${formatUnits(feeData.maxFeePerGas, 'gwei')} Gwei`);
  } else if (feeData.gasPrice) {
    gasCost = estimatedGasLimit * feeData.gasPrice;
    console.log(`Gas price: ${formatUnits(feeData.gasPrice, 'gwei')} Gwei`);
  } else {
    throw new Error("Gas price data could not be obtained");
  }

  console.log("\n--- Gas assessment results ---");
  console.log(`Assessment of the gas limit: ${estimatedGasLimit.toString()} unit`);
  
  console.log("\n--- Price for deploy ---");
  console.log(`Wei: ${gasCost.toString()} Wei`);
  console.log(`Gwei: ${formatUnits(gasCost, 'gwei')} Gwei`);
  console.log(`ETH: ${formatEther(gasCost)} ETH`);
  
}

estimateDeployment("Token1").catch(console.error);
