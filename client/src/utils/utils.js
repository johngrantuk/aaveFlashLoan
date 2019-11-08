const BigNumber = require('bignumber.js');
const fs = require('fs');

BigNumber.set({ DECIMAL_PLACES: 18});

exports.getSpotPrices = async function (ethBalanceWei, exchangeTokenBalanceWei, display) {

  let ethBalanceBN = new BigNumber(ethBalanceWei);
  let exchangeTokenBalanceBN = new BigNumber(exchangeTokenBalanceWei);

  let ethPrice = exchangeTokenBalanceBN.dividedBy(ethBalanceBN);
  let tokenPrice = ethBalanceBN.dividedBy(exchangeTokenBalanceBN);

  if(display){
    console.log('Eth Spot Price: ' + ethPrice.toString(10));
    console.log('Token Spot Price: ' + tokenPrice.toString(10));
  }

  return {ethPrice: ethPrice, tokenPrice: tokenPrice}

};

exports.getEffectivePrices = async function (web3, ethSpendWei, exchangeEthBalance, exchangeTokenBalance, display) {

  let ethSpendWeiBN = new BigNumber(ethSpendWei);
  let fee = new BigNumber('0.997');                                                   // UniSwap takes 0.3% fee
  let exchangeEthBalanceBN = new BigNumber(exchangeEthBalance);
  let exchangeTokenBalanceBN = new BigNumber(exchangeTokenBalance);
  let weiBN = new BigNumber(web3.utils.toWei('1', 'ether'));

  let ethSpendWeiBNWithFee = ethSpendWeiBN.multipliedBy(fee).precision(18);

  var numerator = ethSpendWeiBNWithFee.multipliedBy(exchangeTokenBalanceBN).dividedBy(weiBN);  // For calculating price - see UniSwap exchange contract
  var denominator = exchangeEthBalanceBN.plus(ethSpendWeiBNWithFee);

  var tokensToBuyBN = numerator.dividedBy(denominator).precision(18);
  var tokensToBuyWei = web3.utils.toWei(tokensToBuyBN.toString(10), 'ether');
  var tokensToBuyWeiBN = new BigNumber(tokensToBuyWei);

  var effectivePriceBN = ethSpendWeiBN.dividedBy((tokensToBuyBN.multipliedBy(weiBN))).precision(18);

  if(display){
    console.log('Spend: ' + web3.utils.fromWei(ethSpendWei.toString(10), 'ether'));
    console.log('Tokens To Buy: ' + web3.utils.fromWei(tokensToBuyWei.toString(10), 'ether'));
    console.log(tokensToBuyWei.toString(10))
    console.log('Effective Price: ' + effectivePriceBN.toString(10));
  }

  return {ethSpendWei: ethSpendWei, tokensToBuyWeiBN: tokensToBuyWeiBN, effectivePriceBN: effectivePriceBN}
};

exports.sendTransaction = async function (web3, tx, Account, PrivateKey, ToAddress){
  var encodedABI = tx.encodeABI();
  var txCount = await web3.eth.getTransactionCount(Account);
  console.log('Tx Count 1: ' + txCount);

  var txData = {
    nonce: web3.utils.toHex(txCount),
    gasLimit: web3.utils.toHex(6000000),
    gasPrice: web3.utils.toHex(10000000000),    // Should look at optimising this.
    to: ToAddress,
    from: Account,
    data: encodedABI
  }

  var signedTx = await web3.eth.accounts.signTransaction(txData, '0x' + PrivateKey);

  console.log('Signed...');

  await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

  console.log('Transaction done.');
}

exports.sendTransactionWithValue = async function (web3, tx, Account, PrivateKey, ToAddress, Value){
  var encodedABI = tx.encodeABI();
  var txCount = await web3.eth.getTransactionCount(Account);
  console.log('Tx Count: ' + txCount);

  var txData = {
    nonce: web3.utils.toHex(txCount),
    gasLimit: web3.utils.toHex(6000000),
    gasPrice: web3.utils.toHex(10000000000),    // Should look at optimising this.
    to: ToAddress,
    from: Account,
    data: encodedABI,
    value: Value
  }

  var signedTx = await web3.eth.accounts.signTransaction(txData, '0x' + PrivateKey);

  console.log('Signed...');

  await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

  console.log('Transaction done.');
}
