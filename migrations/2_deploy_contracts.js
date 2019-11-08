var RinkebyArbContract = artifacts.require("./RinkebyArbContract.sol");
var KyberUniArbContract = artifacts.require("./KyberUniArbContract.sol");
var ERC20Token = artifacts.require("./ERC20Token.sol");
var UniswapExchange = artifacts.require("./UniswapExchange.sol");
var uniswap_factory_custom = artifacts.require("./uniswap_factory_custom.sol");
var uniswap_exchange_custom = artifacts.require("./uniswap_exchange_custom.sol");
var FlashLoanReceiverExample = artifacts.require("./FlashLoanReceiverExample.sol");
var FlashLoanReceiverArb = artifacts.require("./FlashLoanReceiverArb.sol");

module.exports = function(deployer) {
  /*
  deployer.deploy(RinkebyArbContract);
  deployer.deploy(KyberUniArbContract);
  deployer.deploy(ERC20Token);
  deployer.deploy(UniswapExchange);
  */
  //deployer.deploy(FlashLoanReceiverExample, '0x9C6C63aA0cD4557d7aE6D9306C06C093A2e35408');
  // deployer.deploy(FlashLoanReceiverExample, '0x9C6C63aA0cD4557d7aE6D9306C06C093A2e35408');
  // deployer.deploy(FlashLoanReceiverExample, '0x9C6C63aA0cD4557d7aE6D9306C06C093A2e35408');
  // deployer.deploy(uniswap_factory_custom);
  // deployer.deploy(uniswap_exchange_custom);
  deployer.deploy(FlashLoanReceiverArb, '0x9C6C63aA0cD4557d7aE6D9306C06C093A2e35408');
};
