const Web3 = require("web3");
const fs = require('fs');
const UniSwapFactory = JSON.parse(fs.readFileSync("./client/src/contracts/uniswap_factory.json"));
const UniSwapExchange = JSON.parse(fs.readFileSync("./client/src/contracts/uniswap_exchange.json"));
const ERC20Token =  JSON.parse(fs.readFileSync("./client/src/contracts/ERC20Token.json"));
const BigNumber = require('bignumber.js');
const Util = require("../client/src/utils/utils");
const {table} = require('table');
require('dotenv').config();

const TRADER_ACCOUNT_ADDR = '0xeE398666cA860DFb7390b5D73EE927e9Fb41a60A';
const UNISWAP_FACTORY_ADDR = '0xD3E51Ef092B2845f10401a0159B2B96e8B6c3D30';
const DAI_ADDR = '0xC4375B7De8af5a38a93548eb8453a498222C4fF2';              // https://developer.kyber.network/docs/KovanEnvGuide/

let data, output;

BigNumber.set({ DECIMAL_PLACES: 18});

const web3 = new Web3(new Web3.providers.HttpProvider(process.env.INFURAKOVAN));

const UniSwapFactoryInstance = new web3.eth.Contract(UniSwapFactory.abi, UNISWAP_FACTORY_ADDR);
const DaiTokenInstance = new web3.eth.Contract(ERC20Token.abi, DAI_ADDR);

let daiExchangeAddr;

async function getTradeBalances(){
  var daiBalanceWei = await DaiTokenInstance.methods.balanceOf(TRADER_ACCOUNT_ADDR).call();
  var ethBalance = await web3.eth.getBalance(TRADER_ACCOUNT_ADDR);

  console.log('Eth Balance: ' + web3.utils.fromWei(ethBalance.toString(10), 'ether'));
  console.log('Dai Balance: ' + web3.utils.fromWei(daiBalanceWei.toString(10), 'ether'));
}

async function run(){

  await getTradeBalances();

  daiExchangeAddr = await UniSwapFactoryInstance.methods.getExchange(DAI_ADDR).call();

  console.log(daiExchangeAddr);

  await PoolInfo();

  var ethSpend = new BigNumber(0.001);
  let ethSpendWei = web3.utils.toWei(ethSpend.toString(10), 'ether');                                    // Amount of Eth that will be spent on trade
  let ethSpendWeiBN = new BigNumber(ethSpendWei);
  var followerExEthBalanceWei = await web3.eth.getBalance(daiExchangeAddr);
  var followerExTokenBalanceWei = await DaiTokenInstance.methods.balanceOf(daiExchangeAddr).call();

  var followerEffectivePrice = await Util.getEffectivePrices(web3, ethSpendWei, followerExEthBalanceWei, followerExTokenBalanceWei, false);

  console.log('Eth Spend: ' + web3.utils.fromWei(followerEffectivePrice.ethSpendWei, 'ether'));
  console.log('Effective Price: ' + followerEffectivePrice.effectivePriceBN.toString(10));
  console.log('Amount of tokens: ' + web3.utils.fromWei(followerEffectivePrice.tokensToBuyWeiBN.toString(10), 'ether'));

  var tokensToBuyBN = followerEffectivePrice.tokensToBuyWeiBN;
  var block = await web3.eth.getBlock("latest");
  const DEADLINE = block.timestamp + 300;
  var slippageBN = new BigNumber('0.997');
  var minTokensWeiBN = tokensToBuyBN.multipliedBy(slippageBN).precision(18);
  var weiBN = new BigNumber(1e18);
  var minTokensEthBN = minTokensWeiBN.dividedBy(weiBN);
  var minTokensWei = web3.utils.toWei(minTokensEthBN.toString(10), 'ether');

  const exchangeContract = new web3.eth.Contract(UniSwapExchange.abi, daiExchangeAddr);

  var tb1 = await DaiTokenInstance.methods.balanceOf(TRADER_ACCOUNT_ADDR).call();
  var tb1BN = new BigNumber(tb1.toString(10));

  var tx = await exchangeContract.methods.ethToTokenSwapInput(minTokensWei, DEADLINE);

  await Util.sendTransactionWithValue(web3, tx, TRADER_ACCOUNT_ADDR, process.env.PRIVATEKEY, daiExchangeAddr, ethSpendWei);    // Would be good to get return value here as its should be actual amount of tokens bought

  var tb2 = await DaiTokenInstance.methods.balanceOf(TRADER_ACCOUNT_ADDR).call();
  var tb2BN = new BigNumber(tb2.toString(10));
  var bought = tb2BN.minus(tb1BN);
  console.log('!!BOUGHT: ' + bought.toString(10));

  await getTradeBalances();
  console.log('Goodbye');
  return
}

async function PoolInfo(){
  var leaderExEthBalanceWei = await web3.eth.getBalance(daiExchangeAddr);
  var leaderExTokenBalanceWei = await DaiTokenInstance.methods.balanceOf(daiExchangeAddr).call();

  var leaderSpotPrices = await Util.getSpotPrices(leaderExEthBalanceWei, leaderExTokenBalanceWei, false);

  data = [
      ['Pool', 'Leader Token'],
      ['Eth Pool', web3.utils.fromWei(leaderExEthBalanceWei, 'ether')],
      ['Token Pool', web3.utils.fromWei(leaderExTokenBalanceWei, 'ether')],
      ['Eth Spot Price', leaderSpotPrices.ethPrice.toString(10)],
      ['Token Spot Price', leaderSpotPrices.tokenPrice.toString(10)]
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
