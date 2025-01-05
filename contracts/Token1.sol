// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Token1 is ERC20, Ownable {
    IERC20 public usdt;

    uint256 public totalStable;
    uint256 public totalBorrowMMM;

    address public treasury;

    event Deposited(
        address indexed user,
        uint256 amountMMM,
        uint256 amountUSDT
    );
    event Withdrawn(
        address indexed user,
        uint256 amountMMM,
        uint256 amountUSDT
    );
    event ProfitAdded(uint256 amountUSDT);

    constructor(
        address _usdt,
        address _treasury
    ) ERC20("Token1", "MMM") Ownable(msg.sender) {
        require(_usdt != address(0), "Invalid stablecoin address");
        require(_treasury != address(0), "Invalid treasury address");

        usdt = IERC20(_usdt);
        treasury = _treasury;
    }

    function deposit(uint256 amount, address stablecoin) external {
        require(amount > 0, "amount must be more then 0");
        require(stablecoin == address(usdt), "Unsupported stablecoin");

        IERC20 stable = IERC20(stablecoin);
        require(
            stable.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );

        uint256 mmmAmount;
        if (totalBorrowMMM == 0) {
            mmmAmount = amount;
        } else {
            mmmAmount = (amount * totalBorrowMMM) / totalStable;
        }
        totalStable += amount;
        totalBorrowMMM += mmmAmount;

        _mint(msg.sender, mmmAmount);
        emit Deposited(msg.sender, mmmAmount, amount);
    }

    function withdraw(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= amount, "Not enough MMM");

        uint256 usdtAmount = (amount * totalStable) / totalBorrowMMM;

        totalStable -= usdtAmount;
        totalBorrowMMM -= amount;

        _burn(msg.sender, amount);
        require(usdt.transfer(msg.sender, usdtAmount), "Transfer failed");

        emit Withdrawn(msg.sender, amount, usdtAmount);
    }

    function addProfit(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(usdt.balanceOf(msg.sender) >= amount, "Not enough USDT");

        usdt.transferFrom(msg.sender, address(this), amount);
        totalStable += amount;

        emit ProfitAdded(amount);
    }

    function correctStable(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        require(totalStable >= amount, "Cannot reduce below 0");

        totalStable -= amount;
    }

    function getPrice() external view returns (uint256) {
        return (totalStable * 10 ** 18) / totalBorrowMMM;
    }
}
