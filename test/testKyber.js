// Useful Kyber info:
// https://developer.kyber.network/docs/Integrations-Web3Guide/
// https://medium.com/quiknode/building-with-kyber-network-be596863772d
const fs = require('fs');
let Web3 = require("web3");
const BigNumber = require('bignumber.js');
let KyberUniArbContract = JSON.parse(fs.readFileSync("client/src/contracts/KyberUniArbContract.json"));
let ERC20Token = JSON.parse(fs.readFileSync("client/src/contracts/ERC20Token.json"));
const Util = require("../client/src/utils/utils");
const abis = JSON.parse(fs.readFileSync("./ABIs.json"));                                                  // Various Uniswap/Kyber ABI details.

require('dotenv').config();

const TRADER_ACCOUNT_ADDR = '0xeE398666cA860DFb7390b5D73EE927e9Fb41a60A';;
// Token Details - Assuming initial trade token is Eth
const SRC_TOKEN = "ETH";
const SRC_TOKEN_ADDRESS = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
const SRC_DECIMALS = 18;
const DST_DECIMALS = 12;

BigNumber.set({ DECIMAL_PLACES: 18});

const web3 = new Web3(new Web3.providers.HttpProvider(process.env.INFURAKOVAN));

const DST_TOKEN = "DAI";
const DST_TOKEN_ADDRESS = '0xC4375B7De8af5a38a93548eb8453a498222C4fF2'                    // DAI
const KYBER_NETWORK_PROXY_ADDRESS = "0x692f391bCc85cefCe8C237C01e1f636BbD70EA4D";         // Kovan

// Starting Qty of Eth to trade
var TRADE_QTY_ETH = 0.001;
const TRADE_QTY_WEI = web3.utils.toWei(TRADE_QTY_ETH.toString(), 'ether');

// Get the KyberNetworkContract instances
const KYBER_NETWORK_PROXY_CONTRACT = new web3.eth.Contract(abis.KYBER_NETWORK_PROXY_ABI, KYBER_NETWORK_PROXY_ADDRESS);

const DaiTokenInstance = new web3.eth.Contract(ERC20Token.abi, DST_TOKEN_ADDRESS);

const privateKey = Buffer.from(process.env.PRIVATEKEY, 'hex',);

async function getTradeBalances(){
  var daiBalanceWei = await DaiTokenInstance.methods.balanceOf(TRADER_ACCOUNT_ADDR).call();
  var ethBalance = await web3.eth.getBalance(TRADER_ACCOUNT_ADDR);

  console.log('Eth Balance: ' + web3.utils.fromWei(ethBalance.toString(10), 'ether'));
  console.log('Dai Balance: ' + web3.utils.fromWei(daiBalanceWei.toString(10), 'ether'));
}

async function run(){

  await getTradeBalances();

  var kyberRate = await KYBER_NETWORK_PROXY_CONTRACT.methods.getExpectedRate(SRC_TOKEN_ADDRESS, DST_TOKEN_ADDRESS, TRADE_QTY_WEI).call();
  var kyberRateEther = web3.utils.fromWei(kyberRate.expectedRate, 'ether');
  console.log('Kyber (Eth -> ' + DST_TOKEN + '): ' + kyberRateEther);

  var tokenTradeQtyEth = TRADE_QTY_ETH * parseFloat(kyberRateEther);
  var tokenTradeQtyWei = web3.utils.toWei(tokenTradeQtyEth.toString(), 'ether');
  var tokenTradeQtyWeiBn = web3.utils.toBN(tokenTradeQtyWei);

  console.log('\nTrading - Kyber: ' + TRADE_QTY_ETH.toString() + 'Eth swapped for: ' + tokenTradeQtyEth + 'DAI');

  // srcTokenAddr, srcAmount, destTokenAddr, maxDestAmount, minConversionRate, walletId
  var tx = await KYBER_NETWORK_PROXY_CONTRACT.methods.trade(SRC_TOKEN_ADDRESS, TRADE_QTY_WEI, DST_TOKEN_ADDRESS, TRADER_ACCOUNT_ADDR, tokenTradeQtyWei, kyberRate.expectedRate, '0x0000000000000000000000000000000000000000');

  await Util.sendTransactionWithValue(web3, tx, TRADER_ACCOUNT_ADDR, process.env.PRIVATEKEY, KYBER_NETWORK_PROXY_ADDRESS, TRADE_QTY_WEI);    // Would be good to get return value here as its should be actual amount of tokens bought

  await getTradeBalances();
}
run();
//checkCompleteTrade()
