const Web3 = require("web3");
const fs = require('fs');
const ERC20Token =  JSON.parse(fs.readFileSync("./client/src/contracts/ERC20Token.json"));
const UniSwapFactory = JSON.parse(fs.readFileSync("./client/src/contracts/uniswap_factory_custom.json"));
const UniSwapExchange = JSON.parse(fs.readFileSync("./client/src/contracts/uniswap_exchange_custom.json"));
const BigNumber = require('bignumber.js');
const Util = require("./client/src/utils/utils");
const {table} = require('table');
require('dotenv').config();

BigNumber.set({ DECIMAL_PLACES: 18});

const SOURCE_ACCOUNT = '0xeE398666cA860DFb7390b5D73EE927e9Fb41a60A';
const DAI_ADDRESS = '0xFf795577d9AC8bD7D90Ee22b6C1703490b6512FD';

const web3 = new Web3(new Web3.providers.HttpProvider(process.env.INFURAKOVAN));

let DaiTokenInstance;


exports.setUp = async function(){
  // Used to initially deploy to UniSwap Exchanges and add some initial Pool liquidity.
  var id = await web3.eth.net.getId();

  // Load contract instances
  DaiTokenInstance = new web3.eth.Contract(ERC20Token.abi, DAI_ADDRESS);
  const UniSwapFactoryInstance = new web3.eth.Contract(UniSwapFactory.abi, UniSwapFactory.networks[id].address);
  const UniSwapExchangeInstance = new web3.eth.Contract(UniSwapExchange.abi, UniSwapExchange.networks[id].address);
  //console.log(UniSwapExchange.networks[id].address)
  /*
  // initializeFactory
  console.log('Initialising Factory...');
  var tx = await UniSwapFactoryInstance.methods.initializeFactory(UniSwapExchange.networks[id].address);
  await Util.sendTransaction(web3, tx, SOURCE_ACCOUNT, process.env.PRIVATEKEY, UniSwapFactory.networks[id].address);

  console.log('Creating 1st DAI Exchange...');
  tx = await UniSwapFactoryInstance.methods.createExchange(DAI_ADDRESS);
  await Util.sendTransaction(web3, tx, SOURCE_ACCOUNT, process.env.PRIVATEKEY, UniSwapFactory.networks[id].address);

  console.log('Creating 2nd DAI Exchange...');
  tx = await UniSwapFactoryInstance.methods.createExchange(DAI_ADDRESS);
  await Util.sendTransaction(web3, tx, SOURCE_ACCOUNT, process.env.PRIVATEKEY, UniSwapFactory.networks[id].address);

  */
  const leaderExchangeAddr = await UniSwapFactoryInstance.methods.getExchange(0).call();                              // Custom UniSwap uses IDs for exchanges to allow two of same token
  const followerExchangeAddr = await UniSwapFactoryInstance.methods.getExchange(1).call();
  /*
  console.log('Approving...')
  var approveQtyWei = web3.utils.toWei('100', 'ether');
  tx = await DaiTokenInstance.methods.approve(leaderExchangeAddr, approveQtyWei);
  await Util.sendTransaction(web3, tx, SOURCE_ACCOUNT, process.env.PRIVATEKEY, DAI_ADDRESS);
  tx = await DaiTokenInstance.methods.approve(followerExchangeAddr, approveQtyWei);
  await Util.sendTransaction(web3, tx, SOURCE_ACCOUNT, process.env.PRIVATEKEY, DAI_ADDRESS);


  const leaderExContract = new web3.eth.Contract(UniSwapExchange.abi, leaderExchangeAddr);
  const followerExContract = new web3.eth.Contract(UniSwapExchange.abi, followerExchangeAddr);

  const MIN_LIQUIDITY = 0;
  const ETH_ADDED = web3.utils.toWei('0.01', 'ether');
  const TOKEN_ADDED = web3.utils.toWei('5', 'ether');
  let block = await web3.eth.getBlock("latest");
  const DEADLINE = block.timestamp + 300;
  console.log('Adding liquidity..')
  tx = await leaderExContract.methods.addLiquidity(MIN_LIQUIDITY, TOKEN_ADDED, DEADLINE);
  await Util.sendTransactionWithValue(web3, tx, SOURCE_ACCOUNT, process.env.PRIVATEKEY, leaderExchangeAddr, ETH_ADDED);

  tx = await followerExContract.methods.addLiquidity(MIN_LIQUIDITY, TOKEN_ADDED, DEADLINE);
  await Util.sendTransactionWithValue(web3, tx, SOURCE_ACCOUNT, process.env.PRIVATEKEY, followerExchangeAddr, ETH_ADDED);
  */
  await PoolInfo(leaderExchangeAddr);
  await PoolInfo(followerExchangeAddr);
}

async function displayPrice(web3){
  var id = await web3.eth.net.getId();
  const UniSwapFactoryInstance = new web3.eth.Contract(UniSwapFactory.abi, UniSwapFactory.networks[id].address);
  const DaiTokenInstance = new web3.eth.Contract(LeaderToken.abi, LeaderToken.networks[id].address);
  const FollowerTokenInstance = new web3.eth.Contract(FollowerToken.abi, FollowerToken.networks[id].address);
  const leaderExchangeAddr = await UniSwapFactoryInstance.methods.getExchange(LeaderToken.networks[id].address).call();
  const followerExchangeAddr = await UniSwapFactoryInstance.methods.getExchange(FollowerToken.networks[id].address).call();

  var leaderExEthBalanceWei = await web3.eth.getBalance(leaderExchangeAddr);
  var leaderExTokenBalanceWei = await DaiTokenInstance.methods.balanceOf(leaderExchangeAddr).call();
  var followerExEthBalanceWei = await web3.eth.getBalance(followerExchangeAddr);
  var followerExTokenBalanceWei = await FollowerTokenInstance.methods.balanceOf(followerExchangeAddr).call();

  console.log('Leader Pool:');
  console.log(web3.utils.fromWei(leaderExEthBalanceWei, 'ether') + 'Eth');
  console.log(web3.utils.fromWei(leaderExTokenBalanceWei, 'ether') + 'Token');
  var leaderSpotPrices = await Util.getSpotPrices(leaderExEthBalanceWei, leaderExTokenBalanceWei, true);
  console.log('Follower Pool:');
  console.log(web3.utils.fromWei(followerExEthBalanceWei, 'ether') + 'Eth');
  console.log(web3.utils.fromWei(followerExTokenBalanceWei, 'ether') + 'Token');
  var followerSpotPrices = await Util.getSpotPrices(followerExEthBalanceWei, followerExTokenBalanceWei, true);
}

async function raiseTokenPrice(web3, SourceAccount, PrivateKey, ethSpendWei, leaderExchangeAddr){

  var id = await web3.eth.net.getId();

  const DaiTokenInstance = new web3.eth.Contract(LeaderToken.abi, LeaderToken.networks[id].address);

  var exchangeEthBalance = await web3.eth.getBalance(leaderExchangeAddr);
  var exchangeTokenBalance = await DaiTokenInstance.methods.balanceOf(leaderExchangeAddr).call();
  var exchangeEthBalanceBN = new BigNumber(exchangeEthBalance);
  var exchangeTokenBalanceBN = new BigNumber(exchangeTokenBalance);

  var prices = await Util.getEffectivePrices(web3, ethSpendWei, exchangeEthBalance, exchangeTokenBalance, true);
  var block = await web3.eth.getBlock("latest");
  const DEADLINE = block.timestamp + 300;
  var slippage = new BigNumber('0.997');
  var minTokens = prices.tokensToBuyWeiBN.multipliedBy(slippage).precision(18);

  const leaderContract = new web3.eth.Contract(UniSwapExchange.abi, leaderExchangeAddr);

  var tx = await leaderContract.methods.ethToTokenSwapInput(minTokens.toString(10), DEADLINE);
  await Util.sendTransactionWithValue(web3, tx, SourceAccount, PrivateKey, leaderExchangeAddr, ethSpendWei);
}

exports.ChangePrice = async function(){
  var web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:8545'));
  displayPrice(web3);
  console.log('\nChanging Price...')
  var id = await web3.eth.net.getId();
  const UniSwapFactoryInstance = new web3.eth.Contract(UniSwapFactory.abi, UniSwapFactory.networks[id].address);
  const leaderExchangeAddr = await UniSwapFactoryInstance.methods.getExchange(LeaderToken.networks[id].address).call();
  const ethSpendWei = web3.utils.toWei('0.2', 'ether');
  await raiseTokenPrice(web3, SOURCE_ACCOUNT, process.env.PRIVATEKEY, ethSpendWei, leaderExchangeAddr);
  console.log('\n')
  displayPrice(web3);
}

async function PoolInfo(Address){
  var leaderExEthBalanceWei = await web3.eth.getBalance(Address);
  var leaderExTokenBalanceWei = await DaiTokenInstance.methods.balanceOf(Address).call();

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

// this.ChangePrice();
this.setUp();
// test();
