import { ethers } from "hardhat";
import { expect } from "chai";
import { Signer } from "ethers";
import {
  Token1,
  Token1__factory,
  ERC20Mock,
  ERC20Mock__factory,
} from "../typechain-types";

describe("CapitalMMM Smart Contract", function () {
  let contract: Token1;
  let usdtMock: ERC20Mock;
  let owner: Signer, user1: Signer, user2: Signer;

  const toWei = (n: string) => ethers.parseUnits(n, 18);

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const ERC20MockFactory = (await ethers.getContractFactory(
      "ERC20Mock"
    )) as ERC20Mock__factory;
    usdtMock = await ERC20MockFactory.deploy("Mock USDT", "mUSDT");
    await usdtMock.waitForDeployment();
    console.log("USDT Mock Address:", await usdtMock.getAddress());

    const Token1Factory = (await ethers.getContractFactory(
      "Token1"
    )) as Token1__factory;
    contract = await Token1Factory.deploy(
      await usdtMock.getAddress(),
      await owner.getAddress()
    );
    await contract.waitForDeployment();
    console.log("Token1 Contract Address:", await contract.getAddress());

    await usdtMock.mint(
      await user1.getAddress(),
      ethers.parseUnits("5000", 18)
    );
    await usdtMock.mint(
      await user2.getAddress(),
      ethers.parseUnits("5000", 18)
    );
  });

  it("A 1000 USDT deposit must correctly accrue MMM (first deposit 1:1)", async function () {
    const depositAmount = ethers.parseUnits("1000", 18);

    await usdtMock
      .connect(user1)
      .approve(await contract.getAddress(), depositAmount);
    await contract
      .connect(user1)
      .deposit(depositAmount, await usdtMock.getAddress());

    expect(await contract.balanceOf(await user1.getAddress())).to.equal(
      depositAmount
    );
    expect(await contract.totalStable()).to.equal(depositAmount);
    expect(await contract.totalBorrowMMM()).to.equal(depositAmount);
  });
  it("getPrice() must be return correct amount", async function () {
    const depositAmount = ethers.parseUnits("1000", 18);

    await usdtMock
      .connect(user1)
      .approve(await contract.getAddress(), depositAmount);
    await contract
      .connect(user1)
      .deposit(depositAmount, await usdtMock.getAddress());

    const price = await contract.getPrice();
    expect(price).to.equal(ethers.parseUnits("1", 18));
  });
  it("`addProfit()` correctly updates the MMM price", async function () {
    const depositAmount = ethers.parseUnits("1000", 18);
    const profitAmount = ethers.parseUnits("100", 18);

    // 1User deposits 1000 USDT → gets 1000 MMM
    await usdtMock
      .connect(user1)
      .approve(await contract.getAddress(), depositAmount);
    await contract
      .connect(user1)
      .deposit(depositAmount, await usdtMock.getAddress());

    await usdtMock.mint(await owner.getAddress(), profitAmount);
    await usdtMock
      .connect(owner)
      .approve(await contract.getAddress(), profitAmount);

    await contract.connect(owner).addProfit(profitAmount);

    const newPrice = await contract.getPrice();
    console.log("New price after profit:", ethers.formatUnits(newPrice, 18));

    // Expected price: (1000 + 100) / 1000 = 1.1
    expect(newPrice).to.equal(ethers.parseUnits("1.1", 18));
  });
  it("User can withdraw MMM and receive correct amount of USDT", async function () {
    const depositAmount = ethers.parseUnits("1000", 18);
    const withdrawAmount = ethers.parseUnits("500", 18);

    await usdtMock
      .connect(user1)
      .approve(await contract.getAddress(), depositAmount);
    await contract
      .connect(user1)
      .deposit(depositAmount, await usdtMock.getAddress());

    await contract.connect(user1).withdraw(withdrawAmount);

    const userBalance = await usdtMock.balanceOf(await user1.getAddress());
    expect(userBalance).to.equal(ethers.parseUnits("4500", 18)); // 5000 - 1000 + 500

    const totalBorrowMMM = await contract.totalBorrowMMM();
    expect(totalBorrowMMM).to.equal(depositAmount - withdrawAmount);
  });
  it("Cannot deposit 0 USDT", async function () {
    await expect(
      contract.connect(user1).deposit(0, await usdtMock.getAddress())
    ).to.be.revertedWith("amount must be more then 0");
  });
  it("`addProfit()` should revert if no approve() was made", async function () {
    const profitAmount = ethers.parseUnits("100", 18);

    await usdtMock.mint(await owner.getAddress(), profitAmount);

    await expect(contract.connect(owner).addProfit(profitAmount)).to.be
      .reverted;
  });
  it("should succeed after addProfit and update totalStable & accProfitPerShare", async function () {
    const depositAmount = toWei("1000");
    const correctionAmount = toWei("200");
    const ONE_18 = toWei("1");

    // after beforeEach we already have a deposit of 1000
    // we make addProfit(correctionAmount)
    await usdtMock.mint(await owner.getAddress(), correctionAmount);
    await contract
      .connect(user1)
      .deposit(toWei("100"), await usdtMock.getAddress());

    await usdtMock
      .connect(owner)
      .approve(await contract.getAddress(), correctionAmount);
    await contract.connect(owner).addProfit(correctionAmount);

    // storing old values as bigint
    const beforeStable = await contract.totalStable(); // bigint
    const beforeAcc = await contract.accProfitPerShare(); // bigint

    // now correctStable
    await contract.connect(owner).correctStable(correctionAmount);

    // 1) totalStable should become beforeStable - correction Amount
    const afterStable = await contract.totalStable();
    expect(afterStable).to.equal(beforeStable - correctionAmount);

    // 2) accProfitPerShare должно стать beforeAcc - (correctionAmount*1e18 / totalBorrowMMM)
    const totalBorrow = await contract.totalBorrowMMM(); // bigint
    const expectedDelta = (correctionAmount * ONE_18) / totalBorrow;
    const afterAcc = await contract.accProfitPerShare();
    expect(afterAcc).to.equal(beforeAcc - expectedDelta);
  });
  it("`correctStable()` should revert if trying to reduce more than totalStable", async function () {
    const depositAmount = ethers.parseUnits("1000", 18);
    const excessiveCorrection = ethers.parseUnits("1100", 18); // More than totalStable

    await usdtMock
      .connect(user1)
      .approve(await contract.getAddress(), depositAmount);
    await contract
      .connect(user1)
      .deposit(depositAmount, await usdtMock.getAddress());

    await expect(
      contract.connect(owner).correctStable(excessiveCorrection)
    ).to.be.revertedWith("Cannot reduce below 0");
  });
  it("`correctStable()` should only be callable by the owner", async function () {
    const correctionAmount = ethers.parseUnits("100", 18);

    await expect(contract.connect(user1).correctStable(correctionAmount)).to.be
      .reverted;
  });
  it("pendingProfitOf = 0 immediately after the deposit", async function () {
    await usdtMock
      .connect(user1)
      .approve(await contract.getAddress(), toWei("100"));
    await contract
      .connect(user1)
      .deposit(toWei("100"), await usdtMock.getAddress());
    expect(await contract.pendingProfitOf(await user1.getAddress())).to.equal(
      0
    );
  });
});
