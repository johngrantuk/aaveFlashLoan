// const RinkebyArbContract = require("client/src/contracts/RinkebyArbContract.json");
const fs = require('fs');
const Tx = require('ethereumjs-tx').Transaction;
let RinkebyArbContract = JSON.parse(fs.readFileSync("client/src/contracts/RinkebyArbContract.json"));
let TokenContract = JSON.parse(fs.readFileSync("client/src/contracts/GLDToken.json"));
let Web3 = require("web3");
const BigNumber = require('bignumber.js');
const UniSwap = require('@uniswap/sdk');
require('dotenv').config();

var abi = '[{"name":"NewExchange","inputs":[{"type":"address","name":"token","indexed":true},{"type":"address","name":"exchange","indexed":true}],"anonymous":false,"type":"event"},{"name":"initializeFactory","outputs":[],"inputs":[{"type":"address","name":"template"}],"constant":false,"payable":false,"type":"function","gas":35725},{"name":"createExchange","outputs":[{"type":"address","name":"out"}],"inputs":[{"type":"address","name":"token"}],"constant":false,"payable":false,"type":"function","gas":187911},{"name":"getExchange","outputs":[{"type":"address","name":"out"}],"inputs":[{"type":"address","name":"token"}],"constant":true,"payable":false,"type":"function","gas":715},{"name":"getToken","outputs":[{"type":"address","name":"out"}],"inputs":[{"type":"address","name":"exchange"}],"constant":true,"payable":false,"type":"function","gas":745},{"name":"getTokenWithId","outputs":[{"type":"address","name":"out"}],"inputs":[{"type":"uint256","name":"token_id"}],"constant":true,"payable":false,"type":"function","gas":736},{"name":"exchangeTemplate","outputs":[{"type":"address","name":"out"}],"inputs":[],"constant":true,"payable":false,"type":"function","gas":633},{"name":"tokenCount","outputs":[{"type":"uint256","name":"out"}],"inputs":[],"constant":true,"payable":false,"type":"function","gas":663}]'

var exchangeAbi = '[{"name": "TokenPurchase", "inputs": [{"type": "address", "name": "buyer", "indexed": true}, {"type": "uint256", "name": "eth_sold", "indexed": true}, {"type": "uint256", "name": "tokens_bought", "indexed": true}], "anonymous": false, "type": "event"}, {"name": "EthPurchase", "inputs": [{"type": "address", "name": "buyer", "indexed": true}, {"type": "uint256", "name": "tokens_sold", "indexed": true}, {"type": "uint256", "name": "eth_bought", "indexed": true}], "anonymous": false, "type": "event"}, {"name": "AddLiquidity", "inputs": [{"type": "address", "name": "provider", "indexed": true}, {"type": "uint256", "name": "eth_amount", "indexed": true}, {"type": "uint256", "name": "token_amount", "indexed": true}], "anonymous": false, "type": "event"}, {"name": "RemoveLiquidity", "inputs": [{"type": "address", "name": "provider", "indexed": true}, {"type": "uint256", "name": "eth_amount", "indexed": true}, {"type": "uint256", "name": "token_amount", "indexed": true}], "anonymous": false, "type": "event"}, {"name": "Transfer", "inputs": [{"type": "address", "name": "_from", "indexed": true}, {"type": "address", "name": "_to", "indexed": true}, {"type": "uint256", "name": "_value", "indexed": false}], "anonymous": false, "type": "event"}, {"name": "Approval", "inputs": [{"type": "address", "name": "_owner", "indexed": true}, {"type": "address", "name": "_spender", "indexed": true}, {"type": "uint256", "name": "_value", "indexed": false}], "anonymous": false, "type": "event"}, {"name": "setup", "outputs": [], "inputs": [{"type": "address", "name": "token_addr"}], "constant": false, "payable": false, "type": "function", "gas": 175875}, {"name": "addLiquidity", "outputs": [{"type": "uint256", "name": "out"}], "inputs": [{"type": "uint256", "name": "min_liquidity"}, {"type": "uint256", "name": "max_tokens"}, {"type": "uint256", "name": "deadline"}], "constant": false, "payable": true, "type": "function", "gas": 82605}, {"name": "removeLiquidity", "outputs": [{"type": "uint256", "name": "out"}, {"type": "uint256", "name": "out"}], "inputs": [{"type": "uint256", "name": "amount"}, {"type": "uint256", "name": "min_eth"}, {"type": "uint256", "name": "min_tokens"}, {"type": "uint256", "name": "deadline"}], "constant": false, "payable": false, "type": "function", "gas": 116814}, {"name": "__default__", "outputs": [], "inputs": [], "constant": false, "payable": true, "type": "function"}, {"name": "ethToTokenSwapInput", "outputs": [{"type": "uint256", "name": "out"}], "inputs": [{"type": "uint256", "name": "min_tokens"}, {"type": "uint256", "name": "deadline"}], "constant": false, "payable": true, "type": "function", "gas": 12757}, {"name": "ethToTokenTransferInput", "outputs": [{"type": "uint256", "name": "out"}], "inputs": [{"type": "uint256", "name": "min_tokens"}, {"type": "uint256", "name": "deadline"}, {"type": "address", "name": "recipient"}], "constant": false, "payable": true, "type": "function", "gas": 12965}, {"name": "ethToTokenSwapOutput", "outputs": [{"type": "uint256", "name": "out"}], "inputs": [{"type": "uint256", "name": "tokens_bought"}, {"type": "uint256", "name": "deadline"}], "constant": false, "payable": true, "type": "function", "gas": 50463}, {"name": "ethToTokenTransferOutput", "outputs": [{"type": "uint256", "name": "out"}], "inputs": [{"type": "uint256", "name": "tokens_bought"}, {"type": "uint256", "name": "deadline"}, {"type": "address", "name": "recipient"}], "constant": false, "payable": true, "type": "function", "gas": 50671}, {"name": "tokenToEthSwapInput", "outputs": [{"type": "uint256", "name": "out"}], "inputs": [{"type": "uint256", "name": "tokens_sold"}, {"type": "uint256", "name": "min_eth"}, {"type": "uint256", "name": "deadline"}], "constant": false, "payable": false, "type": "function", "gas": 47503}, {"name": "tokenToEthTransferInput", "outputs": [{"type": "uint256", "name": "out"}], "inputs": [{"type": "uint256", "name": "tokens_sold"}, {"type": "uint256", "name": "min_eth"}, {"type": "uint256", "name": "deadline"}, {"type": "address", "name": "recipient"}], "constant": false, "payable": false, "type": "function", "gas": 47712}, {"name": "tokenToEthSwapOutput", "outputs": [{"type": "uint256", "name": "out"}], "inputs": [{"type": "uint256", "name": "eth_bought"}, {"type": "uint256", "name": "max_tokens"}, {"type": "uint256", "name": "deadline"}], "constant": false, "payable": false, "type": "function", "gas": 50175}, {"name": "tokenToEthTransferOutput", "outputs": [{"type": "uint256", "name": "out"}], "inputs": [{"type": "uint256", "name": "eth_bought"}, {"type": "uint256", "name": "max_tokens"}, {"type": "uint256", "name": "deadline"}, {"type": "address", "name": "recipient"}], "constant": false, "payable": false, "type": "function", "gas": 50384}, {"name": "tokenToTokenSwapInput", "outputs": [{"type": "uint256", "name": "out"}], "inputs": [{"type": "uint256", "name": "tokens_sold"}, {"type": "uint256", "name": "min_tokens_bought"}, {"type": "uint256", "name": "min_eth_bought"}, {"type": "uint256", "name": "deadline"}, {"type": "address", "name": "token_addr"}], "constant": false, "payable": false, "type": "function", "gas": 51007}, {"name": "tokenToTokenTransferInput", "outputs": [{"type": "uint256", "name": "out"}], "inputs": [{"type": "uint256", "name": "tokens_sold"}, {"type": "uint256", "name": "min_tokens_bought"}, {"type": "uint256", "name": "min_eth_bought"}, {"type": "uint256", "name": "deadline"}, {"type": "address", "name": "recipient"}, {"type": "address", "name": "token_addr"}], "constant": false, "payable": false, "type": "function", "gas": 51098}, {"name": "tokenToTokenSwapOutput", "outputs": [{"type": "uint256", "name": "out"}], "inputs": [{"type": "uint256", "name": "tokens_bought"}, {"type": "uint256", "name": "max_tokens_sold"}, {"type": "uint256", "name": "max_eth_sold"}, {"type": "uint256", "name": "deadline"}, {"type": "address", "name": "token_addr"}], "constant": false, "payable": false, "type": "function", "gas": 54928}, {"name": "tokenToTokenTransferOutput", "outputs": [{"type": "uint256", "name": "out"}], "inputs": [{"type": "uint256", "name": "tokens_bought"}, {"type": "uint256", "name": "max_tokens_sold"}, {"type": "uint256", "name": "max_eth_sold"}, {"type": "uint256", "name": "deadline"}, {"type": "address", "name": "recipient"}, {"type": "address", "name": "token_addr"}], "constant": false, "payable": false, "type": "function", "gas": 55019}, {"name": "tokenToExchangeSwapInput", "outputs": [{"type": "uint256", "name": "out"}], "inputs": [{"type": "uint256", "name": "tokens_sold"}, {"type": "uint256", "name": "min_tokens_bought"}, {"type": "uint256", "name": "min_eth_bought"}, {"type": "uint256", "name": "deadline"}, {"type": "address", "name": "exchange_addr"}], "constant": false, "payable": false, "type": "function", "gas": 49342}, {"name": "tokenToExchangeTransferInput", "outputs": [{"type": "uint256", "name": "out"}], "inputs": [{"type": "uint256", "name": "tokens_sold"}, {"type": "uint256", "name": "min_tokens_bought"}, {"type": "uint256", "name": "min_eth_bought"}, {"type": "uint256", "name": "deadline"}, {"type": "address", "name": "recipient"}, {"type": "address", "name": "exchange_addr"}], "constant": false, "payable": false, "type": "function", "gas": 49532}, {"name": "tokenToExchangeSwapOutput", "outputs": [{"type": "uint256", "name": "out"}], "inputs": [{"type": "uint256", "name": "tokens_bought"}, {"type": "uint256", "name": "max_tokens_sold"}, {"type": "uint256", "name": "max_eth_sold"}, {"type": "uint256", "name": "deadline"}, {"type": "address", "name": "exchange_addr"}], "constant": false, "payable": false, "type": "function", "gas": 53233}, {"name": "tokenToExchangeTransferOutput", "outputs": [{"type": "uint256", "name": "out"}], "inputs": [{"type": "uint256", "name": "tokens_bought"}, {"type": "uint256", "name": "max_tokens_sold"}, {"type": "uint256", "name": "max_eth_sold"}, {"type": "uint256", "name": "deadline"}, {"type": "address", "name": "recipient"}, {"type": "address", "name": "exchange_addr"}], "constant": false, "payable": false, "type": "function", "gas": 53423}, {"name": "getEthToTokenInputPrice", "outputs": [{"type": "uint256", "name": "out"}], "inputs": [{"type": "uint256", "name": "eth_sold"}], "constant": true, "payable": false, "type": "function", "gas": 5542}, {"name": "getEthToTokenOutputPrice", "outputs": [{"type": "uint256", "name": "out"}], "inputs": [{"type": "uint256", "name": "tokens_bought"}], "constant": true, "payable": false, "type": "function", "gas": 6872}, {"name": "getTokenToEthInputPrice", "outputs": [{"type": "uint256", "name": "out"}], "inputs": [{"type": "uint256", "name": "tokens_sold"}], "constant": true, "payable": false, "type": "function", "gas": 5637}, {"name": "getTokenToEthOutputPrice", "outputs": [{"type": "uint256", "name": "out"}], "inputs": [{"type": "uint256", "name": "eth_bought"}], "constant": true, "payable": false, "type": "function", "gas": 6897}, {"name": "tokenAddress", "outputs": [{"type": "address", "name": "out"}], "inputs": [], "constant": true, "payable": false, "type": "function", "gas": 1413}, {"name": "factoryAddress", "outputs": [{"type": "address", "name": "out"}], "inputs": [], "constant": true, "payable": false, "type": "function", "gas": 1443}, {"name": "balanceOf", "outputs": [{"type": "uint256", "name": "out"}], "inputs": [{"type": "address", "name": "_owner"}], "constant": true, "payable": false, "type": "function", "gas": 1645}, {"name": "transfer", "outputs": [{"type": "bool", "name": "out"}], "inputs": [{"type": "address", "name": "_to"}, {"type": "uint256", "name": "_value"}], "constant": false, "payable": false, "type": "function", "gas": 75034}, {"name": "transferFrom", "outputs": [{"type": "bool", "name": "out"}], "inputs": [{"type": "address", "name": "_from"}, {"type": "address", "name": "_to"}, {"type": "uint256", "name": "_value"}], "constant": false, "payable": false, "type": "function", "gas": 110907}, {"name": "approve", "outputs": [{"type": "bool", "name": "out"}], "inputs": [{"type": "address", "name": "_spender"}, {"type": "uint256", "name": "_value"}], "constant": false, "payable": false, "type": "function", "gas": 38769}, {"name": "allowance", "outputs": [{"type": "uint256", "name": "out"}], "inputs": [{"type": "address", "name": "_owner"}, {"type": "address", "name": "_spender"}], "constant": true, "payable": false, "type": "function", "gas": 1925}, {"name": "name", "outputs": [{"type": "bytes32", "name": "out"}], "inputs": [], "constant": true, "payable": false, "type": "function", "gas": 1623}, {"name": "symbol", "outputs": [{"type": "bytes32", "name": "out"}], "inputs": [], "constant": true, "payable": false, "type": "function", "gas": 1653}, {"name": "decimals", "outputs": [{"type": "uint256", "name": "out"}], "inputs": [], "constant": true, "payable": false, "type": "function", "gas": 1683}, {"name": "totalSupply", "outputs": [{"type": "uint256", "name": "out"}], "inputs": [], "constant": true, "payable": false, "type": "function", "gas": 1713}]'


let web3 = new Web3(new Web3.providers.HttpProvider(process.env.INFURARINKEBY));

const chainIdOrProvider = 4;//1 // could be e.g. window.ethereum instead

let tokens = [];

const wait_time = 800

async function run() {
    console.log(" STARTING BOT ")
    tokens.unshift('DAI')
    console.log(JSON.stringify(tokens))
    await sleep(wait_time);

    var blockNo = 0;
    while(true){
      await trackData();
    }
}

async function trackData() {
    // console.log('----')
  	for (var i = 0, len = tokens.length; i < len; i++) {
      // console.log('--> ' + tokens[i])
      await checkToken(tokens[i])
  		await sleep(wait_time)
    }
    // console.log('----')
}

var ethReserve = new BigNumber(123.4567);
var rate = new BigNumber(123.4567);

async function checkToken(Token){
  // console.log(Token + ' Maybes aye, maybes naw...');
  const tokenReserves = await UniSwap.getTokenReserves(Token, chainIdOrProvider);

  //console.log(tokenReserves);
  const marketDetails = UniSwap.getMarketDetails(undefined, tokenReserves) // ETH<>ERC20

  var t = new BigNumber(1000000000000000000)
  // console.log(marketDetails)
  //console.log(marketDetails.outputReserves.ethReserve.token)

  if(marketDetails.outputReserves.ethReserve.amount.dividedBy(t).isEqualTo(ethReserve) && marketDetails.marketRate.rate.isEqualTo(rate)){
    return;
  }else{
    ethReserve = marketDetails.outputReserves.ethReserve.amount.dividedBy(t);
    rate = marketDetails.marketRate.rate;
    console.log('New !!!!!!!')
    var currentBlockNo = await web3.eth.getBlockNumber();
    console.log(currentBlockNo);
    console.log(marketDetails.outputReserves.ethReserve.amount.dividedBy(t).toString())
    console.log(marketDetails.marketRate.rate.toString())
    //console.log(marketDetails.marketRate.rateInverted.toString())
  }

  //console.log(marketDetails.outputReserves.ethReserve.amount.dividedBy(t).toString())
  //console.log(marketDetails.marketRate.rate.toString())
  //console.log(marketDetails.marketRate.rateInverted.toString())
}

sleep = (x) => {
	return new Promise(resolve => {
		setTimeout(() => { resolve(true) }, x )
	})
}

var account = '0xeE398666cA860DFb7390b5D73EE927e9Fb41a60A';

async function checkEthToToken(){
  var factoryAddress = '0xf5D915570BC477f9B8D6C0E980aA81757A3AaC36'; // rinkeby
  var oceanToken = '0xCC4d8eCFa6a5c1a84853EC5c0c08Cc54Cb177a6A';
  var arbContractAddress = '0x8B4Ea90f1357c7Aa975708252F6Afd480595056b';
  var accountBalance = await web3.eth.getBalance(account);
  console.log(accountBalance.toString());

  console.log(RinkebyArbContract.contractName)
  const arbContract = new web3.eth.Contract(RinkebyArbContract.abi, arbContractAddress);

  var contractBalance = await web3.eth.getBalance(arbContractAddress);
  console.log(contractBalance);

  const uniswap = new web3.eth.Contract(JSON.parse(abi), factoryAddress);

  let exchange = await uniswap.methods.getExchange(oceanToken).call();
  console.log("the exchange address for ERC20 token is:" + exchange);

  let exchangeContract = new web3.eth.Contract(JSON.parse(exchangeAbi), exchange);

  await checkToken(oceanToken);

  var ethToSwap = web3.utils.toWei('0.01', 'ether');

  const tokenReserves = await UniSwap.getTokenReserves(oceanToken, chainIdOrProvider);
  const tradeDetails = await UniSwap.tradeExactEthForTokensWithData(tokenReserves, ethToSwap);
  const executionDetails = await UniSwap.getExecutionDetails(tradeDetails);

  console.log(executionDetails);
  /*
  The maximum slippage to allow, in basis points. Defaults to 200 (2%).
  { exchangeAddress: '0x416F1Ac032D1eEE743b18296aB958743B1E61E81',
  methodName: 'ethToTokenSwapInput',
  methodId: '0xf39b5b9b',
  value: BigNumber { s: 1, e: 16, c: [ 100 ] },
  methodArguments: [ BigNumber { s: 1, e: 17, c: [Array] }, 1570306770 ] }
  SAME AS ABOVE:
  const tradeDetails2 = await UniSwap.tradeExactEthForTokens(oceanToken, ethToSwap, 4);
  const executionDetails2 = await UniSwap.getExecutionDetails(tradeDetails);
  console.log('!!!!!!!')
  console.log(executionDetails2);
  */

  var min_buy_tokens = web3.utils.toWei(executionDetails.methodArguments[0].toString(), 'wei');
  var value = web3.utils.toWei(executionDetails.value.toString(), 'wei');

  //console.log(executionDetails.methodArguments[0].toString())
  console.log(min_buy_tokens)
  console.log(value)

  const tx = arbContract.methods.tradeEthToToken(executionDetails.exchangeAddress, min_buy_tokens, executionDetails.methodArguments[1], value);
  //const tx = exchangeContract.methods.ethToTokenSwapInput(min_buy_tokens, executionDetails.methodArguments[1]);
  const encodedABI = tx.encodeABI();

  var txCount = await web3.eth.getTransactionCount(account);
  console.log('Tx Count: ' + txCount);
  console.log(encodedABI)

  // construct the transaction data
  const txData = {
    nonce: web3.utils.toHex(txCount),
    gasLimit: web3.utils.toHex(6000000),
    gasPrice: web3.utils.toHex(10000000000), // 10 Gwei
    //to: executionDetails.exchangeAddress,
    to: arbContractAddress,
    from: account,
    data: encodedABI,
    value: web3.utils.toHex(value)
  }

  const privateKey = Buffer.from(
    process.env.PRIVATEKEY,
    'hex',
  )

  const transaction = new Tx(txData, {'chain':'rinkeby'});
  transaction.sign(privateKey);
  console.log('Signed...')
  const serializedTx = transaction.serialize().toString('hex');
  console.log('Sending...')
  var receipt = await web3.eth.sendSignedTransaction('0x' + serializedTx);
  console.log('\nReceipt:')
  console.log(receipt);
  /*
  console.log('signing...')
  var txSigned = await web3.eth.accounts.signTransaction(txData, process.env.PRIVATEKEY);
  console.log('\ntxSigned:')
  // console.log(txSigned)

  var receipt = await web3.eth.sendSignedTransaction(txSigned.rawTransaction);
  console.log('\nReceipt:')
  console.log(receipt);
  */

  accountBalance = await web3.eth.getBalance(account);
  console.log(accountBalance.toString());

  contractBalance = await web3.eth.getBalance(arbContractAddress);
  console.log(contractBalance.toString());

  await checkToken(oceanToken);

}

async function checkTokenToEth(){
  var factoryAddress = '0xf5D915570BC477f9B8D6C0E980aA81757A3AaC36'; // rinkeby
  var oceanToken = '0xCC4d8eCFa6a5c1a84853EC5c0c08Cc54Cb177a6A';
  var arbContractAddress = '0x8B4Ea90f1357c7Aa975708252F6Afd480595056b';
  var accountBalance = await web3.eth.getBalance(account);
  console.log('Account Balance: ' + accountBalance.toString());

  const arbContract = new web3.eth.Contract(RinkebyArbContract.abi, arbContractAddress);
  var contractBalance = await web3.eth.getBalance(arbContractAddress);
  console.log('Arb Contract Balance: ' + contractBalance);

  const uniswap = new web3.eth.Contract(JSON.parse(abi), factoryAddress);

  let exchange = await uniswap.methods.getExchange(oceanToken).call();
  console.log("the exchange address for ERC20 token is:" + exchange);

  const tokenContract = new web3.eth.Contract(TokenContract.abi, oceanToken);
  var allowance = await tokenContract.methods.allowance(arbContractAddress, exchange).call();
  console.log('Allowance: ' + allowance.toString());

  var totalSupply = await tokenContract.methods.totalSupply().call();
  console.log('Total supply: ' + totalSupply.toString());

  var tx = await arbContract.methods.approveToken(oceanToken, exchange, totalSupply);
  var encodedABI = tx.encodeABI();

  var txCount = await web3.eth.getTransactionCount(account);
  console.log('Tx Count: ' + txCount);
  // console.log(encodedABI)

  // construct the transaction data
  var txData = {
    nonce: web3.utils.toHex(txCount),
    gasLimit: web3.utils.toHex(6000000),
    gasPrice: web3.utils.toHex(10000000000), // 10 Gwei
    to: arbContractAddress,
    from: account,
    data: encodedABI
  }

  const privateKey = Buffer.from(
    process.env.PRIVATEKEY,
    'hex',
  )
  var transaction = new Tx(txData, {'chain':'rinkeby'});
  transaction.sign(privateKey);
  console.log('Signed...')

  var serializedTx = transaction.serialize().toString('hex');
  console.log('Sending...')
  var receipt = await web3.eth.sendSignedTransaction('0x' + serializedTx);
  console.log('\nReceipt:')
  console.log(receipt);

  allowance = await tokenContract.methods.allowance(arbContractAddress, exchange).call();
  console.log('Allowance: ' + allowance.toString());

  let exchangeContract = new web3.eth.Contract(JSON.parse(exchangeAbi), exchange);

  await checkToken(oceanToken);

  var tokensToSwap = web3.utils.toWei('0.335615845101250071', 'ether');

  const tokenReserves = await UniSwap.getTokenReserves(oceanToken, chainIdOrProvider);
  // const tradeDetails = await UniSwap.tradeExactEthForTokensWithData(tokenReserves, ethToSwap);
  const tradeDetails = await UniSwap.tradeExactTokensForEthWithData(tokenReserves, tokensToSwap);
  const executionDetails = await UniSwap.getExecutionDetails(tradeDetails);

  console.log(executionDetails);

  var max_sell_tokens = web3.utils.toWei(executionDetails.methodArguments[0].toString(), 'wei');
  var eth = web3.utils.toWei(executionDetails.methodArguments[1].toString(), 'wei');
  var value = web3.utils.toWei(executionDetails.value.toString(), 'wei');

  //console.log(executionDetails.methodArguments[0].toString())
  console.log('0: ' + max_sell_tokens)
  console.log('1: ' + eth)
  console.log('value: ' + value)

  tx = arbContract.methods.tradeTokenToEth(executionDetails.exchangeAddress, max_sell_tokens, executionDetails.methodArguments[2], eth);
  encodedABI = tx.encodeABI();

  var txCount = await web3.eth.getTransactionCount(account);
  console.log('Tx Count: ' + txCount);
  // console.log(encodedABI)

  // construct the transaction data
  txData = {
    nonce: web3.utils.toHex(txCount),
    gasLimit: web3.utils.toHex(6000000),
    gasPrice: web3.utils.toHex(10000000000), // 10 Gwei
    //to: executionDetails.exchangeAddress,
    to: arbContractAddress,
    from: account,
    data: encodedABI,
    value: web3.utils.toHex(value)
  }

  transaction = new Tx(txData, {'chain':'rinkeby'});
  transaction.sign(privateKey);
  console.log('Signed...')

  serializedTx = transaction.serialize().toString('hex');
  console.log('Sending...')
  receipt = await web3.eth.sendSignedTransaction('0x' + serializedTx);
  console.log('\nReceipt:')
  console.log(receipt);

  accountBalance = await web3.eth.getBalance(account);
  console.log(accountBalance.toString());

  contractBalance = await web3.eth.getBalance(arbContractAddress);
  console.log(contractBalance.toString());

  await checkToken(oceanToken);
}
// run();
checkTokenToEth()
// checkEthToToken();
// 18557155622000000000
// 18565872998254917095
