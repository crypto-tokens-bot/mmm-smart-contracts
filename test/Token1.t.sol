// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../contracts/Token1.sol";
import "../contracts/MockUSDT.sol";

contract Token1Test is Test {
    Token1 token;
    MockUSDT usdt;

    address owner = address(this);
    address user = address(0x123);
    address treasury = address(0x456);

    function setUp() public {
        usdt = new MockUSDT();
        token = new Token1(address(usdt), treasury);

        // Mint USDT for testing
        usdt.mint(user, 1000 * 1e18);
        usdt.mint(owner, 1000 * 1e18);

        // Approve Token1 contract to spend USDT
        vm.prank(user);
        usdt.approve(address(token), 1000 * 1e18);
    }

    function testDeposit() public {
        uint256 depositAmount = 100 * 1e18;
        
        vm.prank(user);
        token.deposit(depositAmount, address(usdt));

        assertEq(token.balanceOf(user), depositAmount);
        assertEq(usdt.balanceOf(address(token)), depositAmount);
        assertEq(token.totalStable(), depositAmount);
        assertEq(token.totalBorrowMMM(), depositAmount);
    }

    function testWithdraw() public {
        uint256 depositAmount = 100 * 1e18;
        vm.prank(user);
        token.deposit(depositAmount, address(usdt));

        vm.prank(user);
        token.withdraw(depositAmount);

        assertEq(token.balanceOf(user), 0);
        assertEq(usdt.balanceOf(user), 1000 * 1e18);
        assertEq(token.totalStable(), 0);
        assertEq(token.totalBorrowMMM(), 0);
    }

    function testAddProfit() public {
        uint256 profitAmount = 50 * 1e18;

        vm.prank(owner);
        usdt.approve(address(token), profitAmount);
        vm.prank(owner);
        token.addProfit(profitAmount);

        assertEq(token.totalStable(), profitAmount);
    }

    function testOnlyOwnerCanCorrectStable() public {
        uint256 correctionAmount = 10 * 1e18;
        vm.prank(owner);
        token.correctStable(correctionAmount);

        assertEq(token.totalStable(), 0);

        vm.expectRevert("Ownable: caller is not the owner");
        vm.prank(user);
        token.correctStable(correctionAmount);
    }

    function testCannotDepositZero() public {
        vm.expectRevert("amount must be more then 0");
        vm.prank(user);
        token.deposit(0, address(usdt));
    }

    function testCannotWithdrawZero() public {
        vm.expectRevert("Amount must be greater than 0");
        vm.prank(user);
        token.withdraw(0);
    }

    function testCannotWithdrawMoreThanBalance() public {
        vm.expectRevert("Not enough MMM");
        vm.prank(user);
        token.withdraw(1000 * 1e18);
    }
}
