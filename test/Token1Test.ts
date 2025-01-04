import { ethers } from "hardhat";
import { expect } from "chai";
import { Signer } from "ethers";
import { Token1, Token1__factory, ERC20Mock, ERC20Mock__factory } from "../typechain-types";

describe("CapitalMMM Smart Contract", function () {
  let contract: Token1;
  let usdtMock: ERC20Mock;
  let owner: Signer, user1: Signer, user2: Signer;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const ERC20MockFactory = await ethers.getContractFactory("ERC20Mock") as ERC20Mock__factory;
    usdtMock = await ERC20MockFactory.deploy("Mock USDT", "mUSDT");
    await usdtMock.waitForDeployment();
    console.log("USDT Mock Address:", await usdtMock.getAddress());

    const Token1Factory = await ethers.getContractFactory("Token1") as Token1__factory;
    contract = await Token1Factory.deploy(await usdtMock.getAddress(), await owner.getAddress());
    await contract.waitForDeployment();
    console.log("Token1 Contract Address:", await contract.getAddress());

    await usdtMock.mint(await user1.getAddress(), ethers.parseUnits("5000", 18));
    await usdtMock.mint(await user2.getAddress(), ethers.parseUnits("5000", 18));
  });

  it("A 1000 USDT deposit must correctly accrue MMM (first deposit 1:1)", async function () {
    const depositAmount = ethers.parseUnits("1000", 18);

    await usdtMock.connect(user1).approve(await contract.getAddress(), depositAmount);
    await contract.connect(user1).deposit(depositAmount, await usdtMock.getAddress());

    expect(await contract.balanceOf(await user1.getAddress())).to.equal(depositAmount);
    expect(await contract.totalStable()).to.equal(depositAmount);
    expect(await contract.totalBorrowMMM()).to.equal(depositAmount);
  });
  it("getPrice() must be return correct amount", async function() {
    const depositAmount = ethers.parseUnits("1000", 18);

    await usdtMock.connect(user1).approve(await contract.getAddress(), depositAmount);
    await contract.connect(user1).deposit(depositAmount, await usdtMock.getAddress());

    const price = await contract.getPrice();
    expect(price).to.equal(ethers.parseUnits("1", 18));
  })
  it("get Price() correctly accounts for profits", async function () {
    const depositAmount = ethers.parseUnits("1000", 18);
    const profitAmount = ethers.parseUnits("100", 18);

    await usdtMock.connect(user1).approve(await contract.getAddress(), depositAmount);
    await contract.connect(user1).deposit(depositAmount, await usdtMock.getAddress());

    await usdtMock.mint(await contract.getAddress(), profitAmount);

    await contract.connect(owner).addProfit(profitAmount);

    const newPrice = await contract.getPrice();
    expect(newPrice).to.equal(ethers.parseUnits("1.1", 18)); // (1000 + 100) / 1000 = 1.1
  });
});
