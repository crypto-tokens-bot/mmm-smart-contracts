### Compile contracts
```
npx hardhat compile
```


### The contract is intended for tokenization of capital. Users can deposit USDT/USDC and receive MM tokens (an analog of the fund's shares) in return. These funds are then invested (staking, trading, hedging), and profits are distributed through a change in the exchange rate of the MMM token.



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

### 🔹 How Does Withdrawing Work?
Formula:
When withdrawing X MMM, the user receives:

![](/static/formula3.png)


If price = 1.1 USDT, then 500 MMM → 550 USDT.

After withdrawal, totalStable and totalBorrowMMM decrease proportionally.

Contract Logic:
The user sends MMM to the contract.
The contract transfers USDT to the user at the current price.
Updates totalStable and totalBorrowMMM.