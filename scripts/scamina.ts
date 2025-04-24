import "dotenv/config";
import { ethers } from "ethers";

// const RPC_URL = process.env.RPC_URL!;
const RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";
//const CONTRACT_ADDR = process.env.CONTRACT_ADDRESS!;
const CONTRACT_ADDR = "0xc9Cf4D74BF240B26ae1b613f85696eE8DA0aD549";
const USER_ADDRESS = "0xf92769A0dFee5B4807daC7De454a0AE009886Fb0"; 

if (!RPC_URL || !CONTRACT_ADDR || !USER_ADDRESS) {
    console.error("❌ It is necessary to set in .env: RPC_URL, CONTRACT_ADDRESS, USER_ADDRESS");
    process.exit(1);
}

const provider = new ethers.JsonRpcProvider(RPC_URL);

const ABI = [
    "function balanceOf(address account) view returns (uint256)",
    "function getPrice() view returns (uint256)",
    "function usdt() view returns (address)",
    "function treasury() view returns (address)",
    "function totalStable() view returns (uint256)",
    "function totalBorrowMMM() view returns (uint256)",
];

const contract = new ethers.Contract(CONTRACT_ADDR, ABI, provider);

async function getBalance(user: string) {
    const raw = await contract.balanceOf(user) as bigint;
    console.log(`Balance(${user}) =`, ethers.formatUnits(raw, 18), "MMM");
}

async function getPrice() {
    const raw = await contract.getPrice() as bigint;
    console.log("getPrice() =", ethers.formatUnits(raw, 18), "USDT/MMM");
}

async function getUsdt() {
    const addr: string = await contract.usdt();
    console.log("usdt() =", addr);
}

async function getTreasury() {
    const addr: string = await contract.treasury();
    console.log("treasury() =", addr);
}

async function getTotalStable() {
    const raw = await contract.totalStable() as bigint;
    console.log("totalStable() =", ethers.formatUnits(raw, 18), "USDT");
}

async function getTotalBorrow() {
    const raw = await contract.totalBorrowMMM() as bigint;
    console.log("totalBorrowMMM() =", ethers.formatUnits(raw, 18), "MMM");
}

getBalance("0xf92769A0dFee5B4807daC7De454a0AE009886Fb0").catch(e => { console.error(e); process.exit(1); });
getPrice().catch(e => { console.error(e); process.exit(1); });
getUsdt().catch(e => { console.error(e); process.exit(1); });
getTreasury().catch(e => { console.error(e); process.exit(1); });
getTotalBorrow().catch(e => { console.error(e); process.exit(1); });
getTotalStable().catch(e => { console.error(e); process.exit(1); });