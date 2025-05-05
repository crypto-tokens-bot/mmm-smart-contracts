// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Token1 is ERC20, Ownable {
    IERC20 public usdt;

    uint256 public totalStable;
    uint256 public totalBorrowMMM;
    /// @dev Accumulated profit per MMM unit multiplied by 1e18
    uint256 public accProfitPerShare;
    /// @dev the user's “debt” based on the already recorded profit
    mapping(address => uint256) public rewardDebt;
    /// @dev How much profit can the user take now
    mapping(address => uint256) public pendingProfit;
    mapping(address => uint256) public avgEntryPrice; // in format 1e18

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
    event ProfitClaimed(address indexed user, uint256 amountUSDT);
    event LossAdded(uint256 amountUSDT);

    constructor(
        address _usdt,
        address _treasury
    ) ERC20("Token1", "MMM") Ownable(msg.sender) {
        require(_usdt != address(0), "Invalid stablecoin address");
        require(_treasury != address(0), "Invalid treasury address");

        usdt = IERC20(_usdt);
        treasury = _treasury;
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function deposit(uint256 amount, address stablecoin) external {
        require(amount > 0, "amount must be more then 0");
        require(stablecoin == address(usdt), "Unsupported stablecoin");

        _harvest(msg.sender);

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

        {
            uint256 prevBal = balanceOf(msg.sender);
            uint256 newBal = prevBal + mmmAmount;
            // The current price is 1 MMM in USDT, including the newly added funds
            uint256 currentPrice = (totalStable * 1e18) / totalBorrowMMM;

            if (prevBal == 0) {
                // if there was no position before, the average price is just the current one.
                avgEntryPrice[msg.sender] = currentPrice;
            } else {
                // weighted average of the old and new parts
                avgEntryPrice[msg.sender] =
                    (prevBal *
                        avgEntryPrice[msg.sender] +
                        mmmAmount *
                        currentPrice) /
                    newBal;
            }
        }
        _mint(msg.sender, mmmAmount);
        rewardDebt[msg.sender] =
            (balanceOf(msg.sender) * accProfitPerShare) /
            1e18;

        emit Deposited(msg.sender, mmmAmount, amount);
    }

    function withdraw(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= amount, "Not enough MMM");

        _harvest(msg.sender);

        uint256 usdtAmount = (amount * totalStable) / totalBorrowMMM;

        totalStable -= usdtAmount;
        totalBorrowMMM -= amount;

        _burn(msg.sender, amount);
        require(usdt.transfer(msg.sender, usdtAmount), "Transfer failed");

        rewardDebt[msg.sender] =
            (balanceOf(msg.sender) * accProfitPerShare) /
            1e18;

        emit Withdrawn(msg.sender, amount, usdtAmount);
    }

    function claimProfit() external {
        uint256 pay = pendingProfit[msg.sender];
        require(pay > 0, "No profit");
        pendingProfit[msg.sender] = 0;
        totalStable -= pay;
        usdt.transfer(msg.sender, pay);
        emit ProfitClaimed(msg.sender, pay);
    }

    function addProfit(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(usdt.balanceOf(msg.sender) >= amount, "Not enough USDT");

        usdt.transferFrom(msg.sender, address(this), amount);
        totalStable += amount;

        accProfitPerShare += (amount * 1e18) / totalBorrowMMM;
        emit ProfitAdded(amount);
    }

    /// @dev internal: we update the pendingProfit and rewardDebt for the user
    function _harvest(address user) internal {
        uint256 balance = balanceOf(user);
        uint256 owed = (balance * accProfitPerShare) / 1e18 - rewardDebt[user];
        if (owed > 0) {
            pendingProfit[user] += owed;
        }
    }

    function correctStable(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        require(totalStable >= amount, "Cannot reduce below 0");
        require(totalBorrowMMM > 0, "No MMM minted");

        totalStable -= amount;
        accProfitPerShare -= (amount * 1e18) / totalBorrowMMM;

        emit LossAdded(amount);
    }

    function getPrice() external view returns (uint256) {
        require(totalBorrowMMM > 0, "No MMM minted");
        return (totalStable * 10 ** 18) / totalBorrowMMM;
    }

    function pendingProfitOf(address user) public view returns (uint256) {
        uint256 _acc = accProfitPerShare;
        uint256 bal = balanceOf(user);
        uint256 accumulated = (bal * _acc) / 1e18; // the amount of profit on the current acc
        uint256 debt = rewardDebt[user]; // the part that has already been accounted for

        uint256 newOwed = 0;
        if (accumulated > debt) {
            newOwed = accumulated - debt; // only a positive difference
        }

        return pendingProfit[user] + newOwed;
    }

    function getAvgEntryPrice(address user) external view returns (uint256) {
        return avgEntryPrice[user];
    }
}
