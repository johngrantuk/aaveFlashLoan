## Intro

A bot that does arbitrage between Uniswap and other exchanges. The idea is to do all the intelligence (decision of when to trade and what trade) off chain with some simple information about the state of prices, etc called from on chain via Infura. A proxy contract atomizes two transactions in one (so that they either both execute or none do).


Decided to develop using Truffle as it's easy to write, test and deploy contracts, etc.

## Kyber/UniSwap Implementation

As Balancer contract interfaces aren't ready yet decided to interface to [Kyber Network](https://developer.kyber.network/docs/Start/), an on-chain liquidity protocol. This demonstrates swapping between two protocols using the Arb proxy contract. The contract and bot is written in a way that make it easy to swap out the Kyber function for Balancer.

Main contract is found in /contracts/KyberUniArbContract.sol.
* By default the address that deploys the contract is the owner.
* UniSwap requires approval to trade tokens on behalf of owner. approveToken function is called for this. Only the contract owner can approve tokens. (Has to be an ERC20 token!)
* trade function executes a trade. At the moment this does Eth->ERC20 via Kyber then ERC20->Eth via UniSwap which also sends the Eth to the msg.sender.
* Should be easy to drop in Balancer functions.

## Testing

Two approaches to testing.

Javascript unit tests, see 'test/kyberUniArbContract.js' folder. These cover:
* Confirm fail if not enough Eth sent for trade
* Confirm atomic trade
* Only owner can approve tokens

Testing full function on-chain with Rinkeby using Kyber/UniSwap functions. See testScriptsKyber.js for example of full trade, possible to run on Rinkeby or Mainet (when Contract is deployed). See 'Kyber Swaps' below for Rinkeby transaction and script output.

testScriptsUniswap and RinkebyArbContract were initial tests that still have some potentially useful examples for future.

## To Do

UniSwap rate issue - waiting for feedback on Discord (can explain further).

Slippage - Not a trader (yet :)) not sure best way to handle this.

Add some events/log processing to Bot. Quite a bit that can be added here but holding off until contract, etc is finalised. Also decide if need more permanent logs?

Meta-transaction type method for contract?
  Easier use? Bot script would have more control and flexibility.
  Arb contract just functions as relayer.
  Would still need some kind of approval so no-one takes advantage of contract? Or make it so caller still spends gas, etc.

## Gas Costs

### KyberUni Contract Deploy

Rinkeby: 0xbaA1f8d938c064322C0D9c2DC68f0e516AE35678, 0.02210208 ETH Total for deploy via Truffle.

### Trade Transaction Fee

0.00246379 Ether, Gas Used: 246,379, Gas Price: 10 Gwei

## Rinkeby Kyber/UniSwap Trade:

[Tx Hash](https://rinkeby.etherscan.io/tx/0x96dc25cab4d63643ca6498deebfca0a06c431f26874250049f3167cbc50a7458)

$ node testScriptsKyber.js
RINKEBY
Bot Account Balance: 18.423841957836522602
Arb Contract Balance: 0
The Uniswap exchange address for OMG token is:0x160190Ff19176ab27E0c59C8282bdB8078f1AE59
Approving token...
Total supply: 21000000
Tx Count: 82
Signed...
Sending...
Sent...
Allowance: 21000000000000000000000000
Token Approved.
Uniswap Eth Reserve: 0.460680160083065078
Uniswap Token Reserve: 0.526373310586151677

Uniswap (OMG -> Eth): 0.875196653816028574 (1.142600346607593195)
Kyber (Eth -> OMG): 61.0794391069944

Trading - Kyber: 0.001Eth swapped for: 0.0610794391069944OMG
Trading - Uniswap: Sell: 0.0610794391069944 for Eth: 0.046814277882848405
Tx Count: 83
Signed...
Sending...
Sent...
Bot Account Balance: 18.466553715719371007
