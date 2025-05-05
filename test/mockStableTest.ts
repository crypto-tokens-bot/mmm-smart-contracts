import { expect } from "chai";
import { ethers } from "hardhat";
import type { MockUSDT } from "../typechain-types";

describe("MockUSDT", function () {
  let usdt: MockUSDT;
  let deployer: string;
  let user: string;

  before(async function () {
    [deployer, user] = (await ethers.getSigners()).map((s) => s.address);
    const Factory = await ethers.getContractFactory("MockUSDT");
    usdt = (await Factory.deploy()) as MockUSDT;
    await usdt.waitForDeployment();
  });

  it("constructor: the deployment has 1 000 000 USDT", async function () {
    const balance = await usdt.balanceOf(deployer);
    expect(balance).to.equal(ethers.parseUnits("1000000", await usdt.decimals()));
  });

  it("mint: You can add tokens to any address.", async function () {
    const amount = ethers.parseUnits("1234.5", await usdt.decimals());
    await usdt.mint(user, amount);
    expect(await usdt.balanceOf(user)).to.equal(amount);
  });
});