const Web3 = require("web3");
const fs = require('fs');
const LeaderToken = JSON.parse(fs.readFileSync("build/contracts/LeaderToken.json"));
const FollowerToken = JSON.parse(fs.readFileSync("build/contracts/FollowerToken.json"));
const UniSwapFactory = JSON.parse(fs.readFileSync("build/contracts/uniswap_factory.json"));
const UniSwapExchange = JSON.parse(fs.readFileSync("build/contracts/uniswap_exchange.json"));
const BigNumber = require('bignumber.js');
const Util = require("./src/utils/utils");
const SetUp = require("./setUp");
const {table} = require('table');
require('dotenv').config();

let data, output;

BigNumber.set({ DECIMAL_PLACES: 18});

SETUP = true;
// SETUP = false;

CHANGEPRICE = true;
CHANGEPRICE = false;

const TRADER_ACCOUNT = '0xD6d23522aD6bf85d2Ef804FA9187bDa2b8d3Ee65';      // take from ganache-cli if needed

let web3, id, LeaderTokenInstance, FollowerTokenInstance, UniSwapFactoryInstance, UniSwapExchangeInstance, leaderExchangeAddr, followerExchangeAddr;

async function run(){
  if(SETUP)
    await SetUp.setUp();

  if(CHANGEPRICE)
    await SetUp.ChangePrice();

  web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:8545'));
  id = await web3.eth.net.getId();

  LeaderTokenInstance = new web3.eth.Contract(LeaderToken.abi, LeaderToken.networks[id].address);
  FollowerTokenInstance = new web3.eth.Contract(FollowerToken.abi, FollowerToken.networks[id].address);
  UniSwapFactoryInstance = new web3.eth.Contract(UniSwapFactory.abi, UniSwapFactory.networks[id].address);
  UniSwapExchangeInstance = new web3.eth.Contract(UniSwapExchange.abi, UniSwapExchange.networks[id].address);

  leaderExchangeAddr = await UniSwapFactoryInstance.methods.getExchange(LeaderToken.networks[id].address).call();
  followerExchangeAddr = await UniSwapFactoryInstance.methods.getExchange(FollowerToken.networks[id].address).call();

  var followerBalanceWei = await FollowerTokenInstance.methods.balanceOf(TRADER_ACCOUNT).call();
  var leaderBalanceWei = await LeaderTokenInstance.methods.balanceOf(TRADER_ACCOUNT).call();
  console.log(web3.utils.fromWei(followerBalanceWei.toString(10), 'ether'));
  console.log(web3.utils.fromWei(leaderBalanceWei.toString(10), 'ether'));

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
    var leaderExTokenBalanceWei = await LeaderTokenInstance.methods.balanceOf(leaderExchangeAddr).call();
    var followerExEthBalanceWei = await web3.eth.getBalance(followerExchangeAddr);
    var followerExTokenBalanceWei = await FollowerTokenInstance.methods.balanceOf(followerExchangeAddr).call();

    var ethSpend = new BigNumber(0);
    var spendCheck = new BigNumber(1);
    var maxCheck = new BigNumber(10);
    var diviser = new BigNumber(10);
    var divisionCount = 0;
    var divisionMax = 7;    // Each division divides ethSpend by 10. So this would be 0.00001.

    while(true){

      var trade = [];
      ethSpend = ethSpend.plus(spendCheck);

      if(ethSpend.isGreaterThan(maxCheck)){
        console.log('Max Spend Checked.')
        break;
      }

      let ethSpendWei = web3.utils.toWei(ethSpend.toString(10), 'ether');                                    // Amount of Eth that will be spent on trade
      let ethSpendWeiBN = new BigNumber(ethSpendWei);

      var followerEffectivePrice = await Util.getEffectivePrices(web3, ethSpendWei, followerExEthBalanceWei, followerExTokenBalanceWei, false);

      trade.push(web3.utils.fromWei(followerEffectivePrice.ethSpendWei, 'ether'));
      trade.push(followerEffectivePrice.effectivePriceBN.toString(10));
      trade.push(web3.utils.fromWei(followerEffectivePrice.tokensToBuyWeiBN.toString(10), 'ether'));

      var tokensToSellWei = web3.utils.toWei(followerEffectivePrice.tokensToBuyWeiBN.toString(10), 'wei');
      var leaderEffectivePrice = await Util.getEffectivePrices(web3, tokensToSellWei, leaderExTokenBalanceWei, leaderExEthBalanceWei, false);

      trade.push(web3.utils.fromWei(leaderEffectivePrice.ethSpendWei, 'ether'));
      trade.push(followerEffectivePrice.effectivePriceBN.toString(10));
      trade.push(web3.utils.fromWei(leaderEffectivePrice.tokensToBuyWeiBN.toString(10), 'ether'));

      var profit = leaderEffectivePrice.tokensToBuyWeiBN.minus(ethSpendWeiBN);
      trade.push(web3.utils.fromWei(profit.toString(10), 'ether'));

      if(profit.isGreaterThan(maxProfit)){
        trade.push('New max profit');
        trades.push(trade);
        maxProfit = profit;
        maxProfitSpend = ethSpend;
        tokensToBuy = followerEffectivePrice.tokensToBuyWeiBN;
        ethToBuy = leaderEffectivePrice.tokensToBuyWeiBN;
        continue;
      }

      if(profit.isNegative()){
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
        break;
      }

      if(followerEffectivePrice.effectivePriceBN.gt(leaderEffectivePrice.effectivePriceBN)){
        trade.push("Profits");
        continue;
        // console.log('????')
        //console.log('Max Spend Found: ' + (ethSpend - spendCheck).toString());
        //console.log('Max Profit at: ' + maxProfitSpend + ' ' + web3.utils.fromWei(maxProfit.toString(10), 'ether'))
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
    var followerTokenBalanceStartWei = await FollowerTokenInstance.methods.balanceOf(TRADER_ACCOUNT).call();
    var leaderTokenBalanceStartWei = await LeaderTokenInstance.methods.balanceOf(TRADER_ACCOUNT).call();
    var ethBalanceStartWei = await web3.eth.getBalance(TRADER_ACCOUNT);
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

    var tb1 = await FollowerTokenInstance.methods.balanceOf(TRADER_ACCOUNT).call();
    var tb1BN = new BigNumber(tb1.toString(10));
    var tx = await followerContract.methods.ethToTokenSwapInput(minTokensWei, DEADLINE);
    await Util.sendTransactionWithValue(web3, tx, TRADER_ACCOUNT, process.env.PRIVATEKEYTRADE, followerExchangeAddr, ethSpendWei);    // Would be good to get return value here as its should be actual amount of tokens bought
    var tb2 = await FollowerTokenInstance.methods.balanceOf(TRADER_ACCOUNT).call();
    var tb2BN = new BigNumber(tb2.toString(10));
    var bought = tb2BN.minus(tb1BN);
    console.log('!!BOUGHT: ' + bought.toString(10));

    // Sell tokens for eth
    var tokensToSellWei = web3.utils.toWei(tokensToBuy.toString(10), 'wei');

    const leaderContract = new web3.eth.Contract(UniSwapExchange.abi, leaderExchangeAddr);
    tx = await leaderContract.methods.tokenToEthSwapInput(tokensToSellWei, ethSpendWei, DEADLINE);
    await Util.sendTransaction(web3, tx, TRADER_ACCOUNT, process.env.PRIVATEKEYTRADE, leaderExchangeAddr);

    var followerBalanceWei = await FollowerTokenInstance.methods.balanceOf(TRADER_ACCOUNT).call();
    var leaderBalanceWei = await LeaderTokenInstance.methods.balanceOf(TRADER_ACCOUNT).call();
    var ethBalanceFinish = await web3.eth.getBalance(TRADER_ACCOUNT);
    var realisedProfit = BigNumber(ethBalanceFinish).minus(BigNumber(ethBalanceStartWei));
    console.log('Profit: ' + web3.utils.fromWei(realisedProfit.toString(10), 'ether'));
    console.log('*****************************')
    /*
    console.log('Old Trade Balance Follower Token: ' + web3.utils.fromWei(followerTokenBalanceStartWei.toString(10), 'ether'));
    console.log('New Trade Balance Follower Token: ' + web3.utils.fromWei(followerBalanceWei.toString(10), 'ether'));
    console.log('Old Trade Balance Leader Token: ' + web3.utils.fromWei(leaderTokenBalanceStartWei.toString(10), 'ether'));
    console.log('New Trade Balance Leader Token: ' + web3.utils.fromWei(leaderBalanceWei.toString(10), 'ether'));
    console.log('Old Trade Eth: ' + web3.utils.fromWei(ethBalanceStartWei.toString(10), 'ether'));
    console.log('New Trade Eth: ' + web3.utils.fromWei(ethBalanceFinish.toString(10), 'ether'));
    */
    console.log('--------------------------------------------');

  }
}

async function PoolInfo(){
  var leaderExEthBalanceWei = await web3.eth.getBalance(leaderExchangeAddr);
  var leaderExTokenBalanceWei = await LeaderTokenInstance.methods.balanceOf(leaderExchangeAddr).call();
  var followerExEthBalanceWei = await web3.eth.getBalance(followerExchangeAddr);
  var followerExTokenBalanceWei = await FollowerTokenInstance.methods.balanceOf(followerExchangeAddr).call();

  var leaderSpotPrices = await Util.getSpotPrices(leaderExEthBalanceWei, leaderExTokenBalanceWei, false);
  var followerSpotPrices = await Util.getSpotPrices(followerExEthBalanceWei, followerExTokenBalanceWei, false);

  data = [
      ['Pool', 'Leader Token', 'Follower Token'],
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
