const Web3 = require("web3");
const fs = require('fs');
const LendingPoolAddressesProvider = JSON.parse(fs.readFileSync("client/src/contracts/LendingPoolAddressesProvider.json"));
const LendingPool = JSON.parse(fs.readFileSync("client/src/contracts/LendingPool.json"));
const UniSwapFactory = JSON.parse(fs.readFileSync("./client/src/contracts/uniswap_factory.json"));
const ERC20Token =  JSON.parse(fs.readFileSync("./client/src/contracts/ERC20Token.json"));
const FlashLoanReceiverExample =  JSON.parse(fs.readFileSync("./client/src/contracts/FlashLoanReceiverExample.json"));
const {table} = require('table');
const Util = require("../client/src/utils/utils");
require('dotenv').config();

const TRADER_ACCOUNT_ADDR = '0xeE398666cA860DFb7390b5D73EE927e9Fb41a60A';
const UNISWAP_FACTORY_ADDR = '0xD3E51Ef092B2845f10401a0159B2B96e8B6c3D30';
const FLASH_ADDR = '0xb544f44905dBc94e096576898debAD22b6A2F3C1';

const web3 = new Web3(new Web3.providers.HttpProvider(process.env.INFURAKOVAN));

const UniSwapFactoryInstance = new web3.eth.Contract(UniSwapFactory.abi, UNISWAP_FACTORY_ADDR);
const FlashLoanReceiverExampleInstance = new web3.eth.Contract(FlashLoanReceiverExample.abi, FLASH_ADDR);

async function run(){

  /// Retrieve the LendingPool address
  const LendingPoolAddressesProviderInstance = new web3.eth.Contract(LendingPoolAddressesProvider.abi, '0x9C6C63aA0cD4557d7aE6D9306C06C093A2e35408');
  const lendingPool = await LendingPoolAddressesProviderInstance.methods.getLendingPool().call();

  const LendingPoolInstance = new web3.eth.Contract(LendingPool.abi, lendingPool);

  var receiverContract = '0xb544f44905dBc94e096576898debAD22b6A2F3C1';    // My contract that implements the IFLashLoanReceiver interface
  // var reserveAddr = '0x804C0B38593796bD44126102C8b5e827Cf389D80';     // Should be Eth reserve address??
  var reserveAddr = '0xFf795577d9AC8bD7D90Ee22b6C1703490b6512FD';
  var amountWei = web3.utils.toWei('0.001', 'ether');

  const reserveData = await LendingPoolInstance.methods.getReserveData(reserveAddr).call();
  console.log('Reserve Data: ');
  console.log(reserveData);           // This shows >9Eth available.

  console.log('FlashLoan');
  console.log('Creating tx');
  const tx =  LendingPoolInstance.methods.flashLoan(receiverContract, reserveAddr, amountWei);
  console.log('Sending tx');
  var rx = await Util.sendTransaction(web3, tx, TRADER_ACCOUNT_ADDR, process.env.PRIVATEKEY, lendingPool);
  console.log(rx)

  // Revert - 'Invalid liquidity available'
  // https://kovan.etherscan.io/tx/0x03f2084a9177cb1f36a1e034099ddc1ae2bcefde3b2c0ddb5c7f6b07a1df58a5
  console.log('Byeee')
}

async function runOld(){

  var amountWei = web3.utils.toWei('0.001', 'ether');
  var feeAmountWei = web3.utils.toWei('0.00001', 'ether');

  console.log('Creating tx');
  const tx =  FlashLoanReceiverExampleInstance.methods.executeOperation(reserveAddr, amountWei, feeAmountWei);
  console.log('Sending tx');
  var rx = await Util.sendTransaction(web3, tx, TRADER_ACCOUNT_ADDR, process.env.PRIVATEKEY, '0xb544f44905dBc94e096576898debAD22b6A2F3C1');
  console.log(rx)
  return;

  const LendingPoolAddressesProviderInstance = new web3.eth.Contract(LendingPoolAddressesProvider.abi, '0x9C6C63aA0cD4557d7aE6D9306C06C093A2e35408');

  const lendingPool = await LendingPoolAddressesProviderInstance.methods.getLendingPool().call();

  console.log(lendingPool)

  const LendingPoolInstance = new web3.eth.Contract(LendingPool.abi, lendingPool);

  const reserves = await LendingPoolInstance.methods.getReserves().call();

  console.log('Reserves:');
  console.log(reserves);

  // 0x804C0B38593796bD44126102C8b5e827Cf389D80 // Eth Reserve Address

  for(var i = 0;i < reserves.length;i++){
    console.log(reserves[i])
    daiExchangeAddr = await UniSwapFactoryInstance.methods.getExchange(reserves[i]).call();
    console.log(daiExchangeAddr)
    var TokenInstance = new web3.eth.Contract(ERC20Token.abi, reserves[i]);
    // console.log(daiExchangeAddr);
    await PoolInfo(daiExchangeAddr, TokenInstance);
  }

  console.log('Byeee');
}

async function runOld(){
  /*
  LendingPoolAddressesProvider provider = await LendingPoolAddressesProvider('0x9C6C63aA0cD4557d7aE6D9306C06C093A2e35408');
  LendingPool lendingPool = await LendingPool(provider.getLendingPool());

  var configData = lendingPool.getReserveConfigurationData();
  console.log('Config Data:')
  console.log(configData)

  var reserveData = lendingPool.getReserveData();
  console.log('Reserve Data:')
  console.log(reserveData)
  var reserves = lendingPool.getReserves();
  console.log('Reserves:')
  console.log(reserves)
  return;
  /// Input variables

  // the receiver is a contract that implements the IFLashLoanReceiver interface
  address receiver = //contract_address;
  address daiAddress = "0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359";
  uint256 amount = 1000 * 1e18;

  /// flashLoan method call
  lendingPool.flashLoan(receiver, daiAddress, amount);
  */
}

async function PoolInfo(ExchangeAddr, TokenInstance){
  var leaderExEthBalanceWei = await web3.eth.getBalance(ExchangeAddr);
  var leaderExTokenBalanceWei = await TokenInstance.methods.balanceOf(ExchangeAddr).call();

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

run();
