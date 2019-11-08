//
const Web3 = require("web3");
const fs = require('fs');
const LendingPoolAddressesProvider = JSON.parse(fs.readFileSync("client/src/contracts/LendingPoolAddressesProvider.json"));
const LendingPool = JSON.parse(fs.readFileSync("client/src/contracts/LendingPool.json"));
const ERC20Token =  JSON.parse(fs.readFileSync("./client/src/contracts/ERC20Token.json"));
const Util = require("../client/src/utils/utils");
require('dotenv').config();

const TRADER_ACCOUNT_ADDR = '0xeE398666cA860DFb7390b5D73EE927e9Fb41a60A';
const FLASH_ADDR = '0xb544f44905dBc94e096576898debAD22b6A2F3C1';

const web3 = new Web3(new Web3.providers.HttpProvider(process.env.INFURAKOVAN));

async function testBasicExample(){
  // This runs a FlashLoan with the receiving contract being the example FlashLoanReceiver contract slightly altered to emit an event when loan received.

  /// Retrieve the LendingPool address
  const LendingPoolAddressesProviderInstance = new web3.eth.Contract(LendingPoolAddressesProvider.abi, '0x9C6C63aA0cD4557d7aE6D9306C06C093A2e35408');
  const lendingPool = await LendingPoolAddressesProviderInstance.methods.getLendingPool().call();

  const LendingPoolInstance = new web3.eth.Contract(LendingPool.abi, lendingPool);

  var receiverContract = '0xb544f44905dBc94e096576898debAD22b6A2F3C1';    // My contract that implements the IFLashLoanReceiver interface, this one is just the example with an event to show when it works
  // var reserveAddr = '0x804C0B38593796bD44126102C8b5e827Cf389D80';     // Should be Eth reserve address - THIS IS NOT WORKING AS AAVE CONFIRMED ISSUE WITH ETH. Revert - 'Invalid liquidity available', https://kovan.etherscan.io/tx/0x03f2084a9177cb1f36a1e034099ddc1ae2bcefde3b2c0ddb5c7f6b07a1df58a5
  var reserveAddr = '0xFf795577d9AC8bD7D90Ee22b6C1703490b6512FD';         // This is the DAI address and it is confirmed as working
  var loanAmountWei = web3.utils.toWei('0.001', 'ether');

  const reserveData = await LendingPoolInstance.methods.getReserveData(reserveAddr).call();
  console.log('Reserve Data: ');
  console.log(reserveData);                                             // This shows >9Eth available.

  console.log('FlashLoan');
  console.log('Creating tx');
  const tx =  LendingPoolInstance.methods.flashLoan(receiverContract, reserveAddr, loanAmountWei);
  console.log('Sending tx');
  var rx = await Util.sendTransaction(web3, tx, TRADER_ACCOUNT_ADDR, process.env.PRIVATEKEY, lendingPool);
  console.log(rx)

  console.log('Byeee')
}

async function testArbContract(){
  // This runs a FlashLoan with the receving contract being a basic Arb between two UniSwap contracts.

  /// Retrieve the LendingPool address
  const LendingPoolAddressesProviderInstance = new web3.eth.Contract(LendingPoolAddressesProvider.abi, '0x9C6C63aA0cD4557d7aE6D9306C06C093A2e35408');
  const lendingPool = await LendingPoolAddressesProviderInstance.methods.getLendingPool().call();

  const LendingPoolInstance = new web3.eth.Contract(LendingPool.abi, lendingPool);

  var receiverContract = '0x1ED5840AB41D578584232C13314de1d73B2F5CC3';    // Kovan deployed of FlashLoanReceiverArb.sol
  // var reserveAddr = '0x804C0B38593796bD44126102C8b5e827Cf389D80';     // Should be Eth reserve address - THIS IS NOT WORKING AS AAVE CONFIRMED ISSUE WITH ETH. Revert - 'Invalid liquidity available', https://kovan.etherscan.io/tx/0x03f2084a9177cb1f36a1e034099ddc1ae2bcefde3b2c0ddb5c7f6b07a1df58a5
  var reserveAddr = '0xFf795577d9AC8bD7D90Ee22b6C1703490b6512FD';         // This is the DAI address and it is confirmed as working
  var loanAmountWei = web3.utils.toWei('0.001', 'ether');

  const reserveData = await LendingPoolInstance.methods.getReserveData(reserveAddr).call();
  console.log('Reserve Data: ');
  console.log(reserveData);

  console.log('FlashLoan');
  console.log('Creating tx');
  const tx =  LendingPoolInstance.methods.flashLoan(receiverContract, reserveAddr, loanAmountWei);
  console.log('Sending tx');
  var rx = await Util.sendTransaction(web3, tx, TRADER_ACCOUNT_ADDR, process.env.PRIVATEKEY, lendingPool);
  console.log(rx)

  console.log('Byeee')
}


testBasicExample();
// testArbContract();
