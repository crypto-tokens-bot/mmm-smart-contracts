import { ethers, network } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

import { sepolia } from "../addresses/token_list.json";

async function main() {
  const FUNDER = process.env.FORK_FUNDER!;
  const MOCK_USDT = process.env.MOCK_USDT_ADDRESS!;
  const AMOUNT = process.env.TRANSFER_AMOUNT || "1000";

  const [recipient] = await ethers.getSigners();
  console.log("→ Recipient:", recipient.address);

  await network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [FUNDER],
  });

  await network.provider.send("hardhat_setBalance", [
    FUNDER,
    "0x1000000000000000000", // 1 ETH in hex
  ]);

  const impSigner = await ethers.getSigner(FUNDER);
  const usdt = await ethers.getContractAt(
    ["function transfer(address,uint256) returns (bool)"],
    MOCK_USDT,
    impSigner
  );

  const amountWei = ethers.parseUnits(AMOUNT, 6);
  console.log(`→ Transferring ${AMOUNT} mUSDT (${amountWei.toString()}) → ${recipient.address}`);
  const tx = await usdt.transfer(recipient.address, amountWei);
  await tx.wait();
  console.log("✅ Transfer completed:", tx.hash);

  await network.provider.request({
    method: "hardhat_stopImpersonateAccount",
    params: [FUNDER],
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
