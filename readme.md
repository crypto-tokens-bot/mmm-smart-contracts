### Compile contracts
```
npx hardhat compile
```
### Run tests:
```
npx hardhat tests
```

### After executing this command, you can see the following result:
![](/static/tests_result.png)

### For exploring your or other smart-contract you can use:
- Ethereum: https://etherscan.io/
- Ethereum sepolia: https://sepolia.etherscan.io/
- Arbitrum: https://arbiscan.io/
- Arbitrum sepolia: https://sepolia.arbiscan.io/
- Ronin: https://app.roninchain.com/

### Deploy smart contracts:
```
hardhat run scripts/deployToken1.ts --network {network_name}
```
also you can use ready script from package.json:
```
npm run deploy:Token1
```


### The contract is intended for tokenization of capital. Users can deposit USDT/USDC and receive MM tokens (an analog of the fund's shares) in return. These funds are then invested (staking, trading, hedging), and profits are distributed through a change in the exchange rate of the MMM token.

### CLI scripts: 
#### Using the CLI, you can call any function to read from a smart contract.
```
pip install web3 python-dotenv

# chmod +x token_cli.py 

# ./token_cli.py balance
# ./token_cli.py price
# ./token_cli.py usdt
# ./token_cli.py treasury
# ./token_cli.py totalStable
# ./token_cli.py totalBorrow
```
### 🔹 How is the MMM Price Calculated?
The price formula:
![](/static/formula.png)

Initially, the price is 1:1 (e.g., 1000 USDT / 1000 MMM).
If the contract earns 100 USDT, the price becomes 1.1 USDT per MMM


### 🔹 How Does Depositing Work?
Formula:
When depositing X USDT, the amount of MMM tokens received is:

![](/static/formula2.png)

 
If price = 1 USDT, then 1000 USDT → 1000 MMM.

If price = 1.1 USDT, then 1000 USDT → 909.09 MMM.

Contract Logic:
The user approves the contract to spend their USDT.
The contract transfers USDT to itself.
Calculates the amount of MMM to issue.
Updates totalStable and totalBorrowMMM.

Updates the depositor’s average entry price:
```solidity
uint256 currentPrice = (totalStable * 1e18) / totalBorrowMMM;
// weighted average: (oldBalance * oldAvg + newTokens * currentPrice) / (oldBalance + newTokens)

avgEntryPrice[msg.sender] = ((oldBal * oldAvg) + (mmmAmount * currentPrice)) / (oldBal + mmmAmount);
```

Mints the calculated amount of MMM tokens to the user.

Records the user’s “rewardDebt” against the current accProfitPerShare.

As a result, for each user we always keep track of their average entry price (in 1e18 format), so it’s possible later to compute their exact profit or perform any price‐based accounting on a per‐user basis.

### 🔹 How Does Withdrawing Work?
Formula:
When withdrawing X MMM, the user receives:

### ReceivedUSDT = X × Price

If price = 1.1 USDT, then 500 MMM → 550 USDT.

After withdrawal, totalStable and totalBorrowMMM decrease proportionally.

Contract Logic:
The user sends MMM to the contract.
The contract transfers USDT to the user at the current price.
Updates totalStable and totalBorrowMMM.

### 🔹 How is Profit Added?
Formula:
When Y USDT profit is added, the MMM price increases:

![](/static/formula3.png)

If the contract has 1000 USDT and 1000 MMM, after addProfit(100 USDT):

- Price becomes 1.1 USDT/MMM.

- But totalBorrowMMM remains unchanged.


Contract Logic:
The contract receives USDT.
Updates totalStable.
The MMM price increases automatically.


### 🔹 Example Workflow
1. Initial State
Contract is empty: 0 USDT / 0 MMM.

2. User Deposits 1000 USDT
totalStable = 1000
totalBorrowMMM = 1000
Price of 1 MMM = 1 USDT.

3. The Contract Earns 100 USDT
totalStable = 1100
totalBorrowMMM = 1000
Price of 1 MMM = 1.1 USDT.

4. User Withdraws 500 MMM
Receives 500 * 1.1 = 550 USDT.
totalStable = 550
totalBorrowMMM = 500
Price remains 1.1 USDT/MMM.
