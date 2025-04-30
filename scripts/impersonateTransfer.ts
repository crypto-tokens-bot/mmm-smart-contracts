import { ethers, network } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

import { sepolia } from "../addresses/token_list.json";

async function main() {
  const FUNDER = process.env.FORK_FUNDER!;               // ваш живой адрес с mUSDT
  const MOCK_USDT = process.env.MOCK_USDT_ADDRESS!;     // адрес mock-USDT в форке
  const AMOUNT = process.env.TRANSFER_AMOUNT || "1000"; // сколько mUSDT отдать (в целых единицах)

  // 2) Берём первый аккаунт из списка Hardhat Signers как получатель
  const [recipient] = await ethers.getSigners();
  console.log("→ Recipient:", recipient.address);

  // 3) Начинаем имперсонацию «живого» адреса
  await network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [FUNDER],
  });

  // 4) Заливаем этому «живому» адресу немного эфира на газ
  await network.provider.send("hardhat_setBalance", [
    FUNDER,
    "0x1000000000000000000", // 1 ETH в hex
  ]);

  // 5) Получаем signer для импersonated-аккаунта и ERC20-контракт
  const impSigner = await ethers.getSigner(FUNDER);
  const usdt = await ethers.getContractAt(
    ["function transfer(address,uint256) returns (bool)"],
    MOCK_USDT,
    impSigner
  );

  // 6) Делаем трансфер
  const amountWei = ethers.parseUnits(AMOUNT, 6); // если 6 децималей
  console.log(`→ Transferring ${AMOUNT} mUSDT (${amountWei.toString()}) → ${recipient.address}`);
  const tx = await usdt.transfer(recipient.address, amountWei);
  await tx.wait();
  console.log("✅ Transfer completed:", tx.hash);

  // 7) Останавливаем имперсонацию
  await network.provider.request({
    method: "hardhat_stopImpersonateAccount",
    params: [FUNDER],
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
