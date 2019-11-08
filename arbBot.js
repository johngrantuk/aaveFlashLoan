// Main  main Arb bot that is checking for an Arb opportunity between the two UniSwap pools. If an opportunity is found FlashLoanArb function calls the FlashLoan.
// Also a Web3 only method that executes trades directly.
const Web3 = require("web3");
const fs = require('fs');
const ERC20Token =  JSON.parse(fs.readFileSync("./client/src/contracts/ERC20Token.json"));
const UniSwapFactory = JSON.parse(fs.readFileSync("./client/src/contracts/uniswap_factory_custom.json"));
const UniSwapExchange = JSON.parse(fs.readFileSync("./client/src/contracts/uniswap_exchange_custom.json"));
const LendingPoolAddressesProvider = JSON.parse(fs.readFileSync("client/src/contracts/LendingPoolAddressesProvider.json"));
const LendingPool = JSON.parse(fs.readFileSync("client/src/contracts/LendingPool.json"));
const BigNumber = require('bignumber.js');
const Util = require("./client/src/utils/utils");
const {table} = require('table');
require('dotenv').config();

let data, output;

TRADELIVE = false;                                                        // Change this to true to execute trades

BigNumber.set({ DECIMAL_PLACES: 18});

const TRADER_ACCOUNT = '0xeE398666cA860DFb7390b5D73EE927e9Fb41a60A';
const DAI_ADDRESS = '0xFf795577d9AC8bD7D90Ee22b6C1703490b6512FD';

let id, DaiTokenInstance, UniSwapFactoryInstance, UniSwapExchangeInstance, leaderExchangeAddr, followerExchangeAddr;

const web3 = new Web3(new Web3.providers.HttpProvider(process.env.INFURAKOVAN));

async function run(){
  // Main function that will run and check for Arb op
  var id = await web3.eth.net.getId();

  DaiTokenInstance = new web3.eth.Contract(ERC20Token.abi, DAI_ADDRESS);
  UniSwapFactoryInstance = new web3.eth.Contract(UniSwapFactory.abi, UniSwapFactory.networks[id].address);
  UniSwapExchangeInstance = new web3.eth.Contract(UniSwapExchange.abi, UniSwapExchange.networks[id].address);

  leaderExchangeAddr = await UniSwapFactoryInstance.methods.getExchange(0).call();                                      // Using custom UniSwap contracts
  followerExchangeAddr = await UniSwapFactoryInstance.methods.getExchange(1).call();

  console.log(leaderExchangeAddr);
  console.log(followerExchangeAddr);

  var followerBalanceWei = await DaiTokenInstance.methods.balanceOf(TRADER_ACCOUNT).call();

  console.log('Your DAI Balance: ' + web3.utils.fromWei(followerBalanceWei.toString(10), 'ether'));

  while(true){
    console.log('\nChecking For Arb Op...');
    var ethBalance = await web3.eth.getBalance(TRADER_ACCOUNT);
    console.log('Balance Eth: ' + web3.utils.fromWei(ethBalance.toString(10), 'ether'));
    await PoolInfo();

    var titles = ['Eth Sell', 'Eff Price', 'Token Buy Qty', 'Tokens To Sell', 'Eff Price', 'Ether Buy Qty', 'Profit', 'Result']
    var trades = [];

    var maxProfit = new BigNumber(0);
    var maxProfitSpend = 0;
    var tokensToBuy = 0;
    var ethToBuy = 0;

    var leaderExEthBalanceWei = await web3.eth.getBalance(leaderExchangeAddr);
    var leaderExTokenBalanceWei = await DaiTokenInstance.methods.balanceOf(leaderExchangeAddr).call();
    var followerExEthBalanceWei = await web3.eth.getBalance(followerExchangeAddr);
    var followerExTokenBalanceWei = await DaiTokenInstance.methods.balanceOf(followerExchangeAddr).call();

    var ethSpend = new BigNumber(0);
    var spendCheck = new BigNumber(1);
    var maxCheck = new BigNumber(10);
    var diviser = new BigNumber(10);
    var divisionCount = 0;
    var divisionMax = 10;    // Each division divides ethSpend by 10. So this would be 0.00001.

    while(true){

      var trade = [];
      ethSpend = ethSpend.plus(spendCheck);

      if(ethSpend.isGreaterThan(maxCheck)){
        console.log('Max Spend Checked.')
        break;
      }

      let ethSpendWei = web3.utils.toWei(ethSpend.toString(10), 'ether');                                    // Amount of Eth that will be spent on trade

      //profit = await CalculateProfit(ethSpendWei, followerExTokenBalanceWei, followerExEthBalanceWei, leaderExEthBalanceWei, leaderExTokenBalanceWei, trade)
      profit = await CalculateProfit(ethSpendWei, leaderExEthBalanceWei, leaderExTokenBalanceWei, followerExTokenBalanceWei, followerExEthBalanceWei, trade)    // Checks if it's possible to make a profit

      if(profit.profit.isGreaterThan(maxProfit)){
        trade.push('New max profit');
        trades.push(trade);
        maxProfit = profit.profit;
        maxProfitSpend = ethSpend;
        tokensToBuy = profit.firstEffectivePrice.tokensToBuyWeiBN;
        ethToBuy = profit.secondEffectivePrice.tokensToBuyWeiBN;
        continue;
      }

      if(profit.profit.isNegative()){
        if(divisionCount < divisionMax){
          trade.push('No Profit');
          trades.push(trade);
          divisionCount++;
          spendCheck = spendCheck.dividedBy(diviser);
          maxCheck = maxCheck.dividedBy(diviser);
          ethSpend = BigNumber(0);
          continue;
        }
        trade.push("No Profit\nCan't Arb");
        trades.push(trade);
        continue;
      }

      if(profit.firstEffectivePrice.effectivePriceBN.gt(profit.secondEffectivePrice.effectivePriceBN)){
        trade.push("Profits");
        continue;
        // console.log('????')
        //console.log('Max Spend Found: ' + (ethSpend - spendCheck).toString());
        //console.log('Max Profit at: ' + maxProfitSpend + ' ' + web3.utils.fromWei(maxprofit.profit.toString(10), 'ether'))
        //return;
      }
      trade.push("Profit");
      trades.push(trade);
    }

    trades.unshift(titles);
    // console.log(trades)
    output = table(trades);
    console.log(output);

    if(maxProfitSpend == 0){
      console.log('No Arb Op.');
      console.log('--------------------------------------------');
      await sleep(6000);
      continue;
    }

    console.log('\n******** Arb Op ***********');
    // Web3Arb(maxProfit, maxProfitSpend, tokensToBuy);                         // This executes UniSwap swaps using web3.
    await FlashLoanArb(maxProfit, maxProfitSpend)                               // This executes via FlashLoan contract.

    console.log('*****************************')
    console.log('--------------------------------------------');

  }
}

async function FlashLoanArb(maxProfit, maxProfitSpend){
  // Uses an Aave flash loan to execute trades. See ./contracts/FlashLoanReceiverArb.sol and also README for more details.
  console.log(maxProfit.toString(10))
  console.log('Max Profit at: ' + maxProfitSpend + ' ' + web3.utils.fromWei(maxProfit.toString(10), 'ether'));

  /// Retrieve the LendingPool address
  const LendingPoolAddressesProviderInstance = new web3.eth.Contract(LendingPoolAddressesProvider.abi, '0x9C6C63aA0cD4557d7aE6D9306C06C093A2e35408');
  const lendingPool = await LendingPoolAddressesProviderInstance.methods.getLendingPool().call();

  const LendingPoolInstance = new web3.eth.Contract(LendingPool.abi, lendingPool);

  var receiverContract = '0x1ED5840AB41D578584232C13314de1d73B2F5CC3';    // Kovan deployed of FlashLoanReceiverArb.sol
  var reserveAddr = '0xFf795577d9AC8bD7D90Ee22b6C1703490b6512FD';         // This is the DAI address and it is confirmed as working
  var loanAmountWei = web3.utils.toWei(maxProfitSpend.toString(), 'ether');

  const reserveData = await LendingPoolInstance.methods.getReserveData(reserveAddr).call();
  console.log('Reserve Data: ');
  console.log(reserveData);                                             // This shows amount in provider.

  console.log('FlashLoan Arb');
  console.log('Creating tx');
  const tx =  LendingPoolInstance.methods.flashLoan(receiverContract, reserveAddr, loanAmountWei);
  console.log('Sending tx');
  if(TRADELIVE){
    var rx = await Util.sendTransaction(web3, tx, TRADER_ACCOUNT_ADDR, process.env.PRIVATEKEY, lendingPool);
    console.log(rx)
  }else{
    await sleep(6000);
  }
}

async function Web3Arb(maxProfit, maxProfitSpend, tokensToBuy){
  // Uses Web3 to interact with UniSwap directly.
  var followerTokenBalanceStartWei = await DaiTokenInstance.methods.balanceOf(TRADER_ACCOUNT).call();
  var leaderTokenBalanceStartWei = await DaiTokenInstance.methods.balanceOf(TRADER_ACCOUNT).call();
  var ethBalanceStartWei = await web3.eth.getBalance(TRADER_ACCOUNT);
  console.log(maxProfit.toString(10))
  console.log('Max Profit at: ' + maxProfitSpend + ' ' + web3.utils.fromWei(maxProfit.toString(10), 'ether'));

  let ethSpendWei = web3.utils.toWei(maxProfitSpend.toString(), 'ether');

  var block = await web3.eth.getBlock("latest");
  const DEADLINE = block.timestamp + 300;
  var slippage = new BigNumber('0.997');
  // var minTokensWeiBNCheck = prices.tokensToBuyWeiBN.multipliedBy(slippage).precision(18);

  var minTokensWeiBN = tokensToBuy.multipliedBy(slippage).precision(18);
  var wei = new BigNumber(1e18);
  var minTokensEthBN = minTokensWeiBN.dividedBy(wei);
  var minTokensWei = web3.utils.toWei(minTokensEthBN.toString(10), 'ether');
  // console.log(minTokensEthBN.toString(10))
  // console.log(tokensToBuy.toString(10))
  // console.log(minTokensWei.toString(10))
  const followerContract = new web3.eth.Contract(UniSwapExchange.abi, followerExchangeAddr);

  var traderFollowerBalanceStart = await DaiTokenInstance.methods.balanceOf(TRADER_ACCOUNT).call();
  var traderFollowerBalanceStartBN = new BigNumber(traderFollowerBalanceStart.toString(10));

  var tx = await followerContract.methods.ethToTokenSwapInput(minTokensWei, DEADLINE);
  if(TRADELIVE)
    await Util.sendTransactionWithValue(web3, tx, TRADER_ACCOUNT, process.env.PRIVATEKEY, followerExchangeAddr, ethSpendWei);    // Would be good to get return value here as its should be actual amount of tokens bought

  var traderFollowerBalanceEnd = await DaiTokenInstance.methods.balanceOf(TRADER_ACCOUNT).call();
  var traderFollowerBalanceEndBN = new BigNumber(traderFollowerBalanceEnd.toString(10));
  var bought = traderFollowerBalanceEndBN.minus(traderFollowerBalanceStartBN);
  console.log('!!BOUGHT: ' + bought.toString(10));

  // Sell tokens for eth
  var tokensToSellWei = web3.utils.toWei(tokensToBuy.toString(10), 'wei');

  const leaderContract = new web3.eth.Contract(UniSwapExchange.abi, leaderExchangeAddr);
  tx = await leaderContract.methods.tokenToEthSwapInput(tokensToSellWei, ethSpendWei, DEADLINE);
  if(TRADELIVE)
    await Util.sendTransaction(web3, tx, TRADER_ACCOUNT, process.env.PRIVATEKEY, leaderExchangeAddr);

  var followerBalanceWei = await DaiTokenInstance.methods.balanceOf(TRADER_ACCOUNT).call();
  var leaderBalanceWei = await DaiTokenInstance.methods.balanceOf(TRADER_ACCOUNT).call();
  var ethBalanceFinish = await web3.eth.getBalance(TRADER_ACCOUNT);
  var realisedProfit = BigNumber(ethBalanceFinish).minus(BigNumber(ethBalanceStartWei));
  console.log('Profit: ' + web3.utils.fromWei(realisedProfit.toString(10), 'ether'));
}

async function CalculateProfit(ethSpendWei, followerExTokenBalanceWei, followerExEthBalanceWei, leaderExEthBalanceWei, leaderExTokenBalanceWei, trade){
  // Calculates profit for Arb opportunity.
  let ethSpendWeiBN = new BigNumber(ethSpendWei);
  // var followerEffectivePrice = await Util.getEffectivePrices(web3, ethSpendWei, followerExEthBalanceWei, followerExTokenBalanceWei, false);
  var followerEffectivePrice = await Util.getEffectivePrices(web3, ethSpendWei, followerExTokenBalanceWei, followerExEthBalanceWei, false);

  trade.push(web3.utils.fromWei(followerEffectivePrice.ethSpendWei, 'ether'));
  trade.push(followerEffectivePrice.effectivePriceBN.toString(10));
  trade.push(web3.utils.fromWei(followerEffectivePrice.tokensToBuyWeiBN.toString(10), 'ether'));

  var tokensToSellWei = web3.utils.toWei(followerEffectivePrice.tokensToBuyWeiBN.toString(10), 'wei');
  // var leaderEffectivePrice = await Util.getEffectivePrices(web3, tokensToSellWei, leaderExTokenBalanceWei, leaderExEthBalanceWei, false);
  var leaderEffectivePrice = await Util.getEffectivePrices(web3, tokensToSellWei, leaderExEthBalanceWei, leaderExTokenBalanceWei, false);

  trade.push(web3.utils.fromWei(leaderEffectivePrice.ethSpendWei, 'ether'));
  trade.push(leaderEffectivePrice.effectivePriceBN.toString(10));
  trade.push(web3.utils.fromWei(leaderEffectivePrice.tokensToBuyWeiBN.toString(10), 'ether'));

  var profit = leaderEffectivePrice.tokensToBuyWeiBN.minus(ethSpendWeiBN);
  trade.push(web3.utils.fromWei(profit.toString(10), 'ether'));

  return { profit: profit, firstEffectivePrice: followerEffectivePrice, secondEffectivePrice: leaderEffectivePrice};
}

async function PoolInfo(){
  // Displays UniSwap pool information.
  var leaderExEthBalanceWei = await web3.eth.getBalance(leaderExchangeAddr);
  var leaderExTokenBalanceWei = await DaiTokenInstance.methods.balanceOf(leaderExchangeAddr).call();
  var followerExEthBalanceWei = await web3.eth.getBalance(followerExchangeAddr);
  var followerExTokenBalanceWei = await DaiTokenInstance.methods.balanceOf(followerExchangeAddr).call();

  var leaderSpotPrices = await Util.getSpotPrices(leaderExEthBalanceWei, leaderExTokenBalanceWei, false);
  var followerSpotPrices = await Util.getSpotPrices(followerExEthBalanceWei, followerExTokenBalanceWei, false);

  data = [
      ['', 'Leader Exchange', 'Follower Exchange'],
      ['Eth Pool', web3.utils.fromWei(leaderExEthBalanceWei, 'ether'), web3.utils.fromWei(followerExEthBalanceWei, 'ether')],
      ['Token Pool', web3.utils.fromWei(leaderExTokenBalanceWei, 'ether'), web3.utils.fromWei(followerExTokenBalanceWei, 'ether')],
      ['Eth Spot Price', leaderSpotPrices.ethPrice.toString(10), followerSpotPrices.ethPrice.toString(10)],
      ['Token Spot Price', leaderSpotPrices.tokenPrice.toString(10), followerSpotPrices.tokenPrice.toString(10)]
  ];

  output = table(data);
  console.log(output);
  return;
}

sleep = (x) => {
	return new Promise(resolve => {
		setTimeout(() => { resolve(true) }, x )
	})
}

run();
