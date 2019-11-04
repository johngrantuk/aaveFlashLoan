var RinkebyArbContract = artifacts.require("./RinkebyArbContract.sol");
var KyberUniArbContract = artifacts.require("./KyberUniArbContract.sol");
var ERC20Token = artifacts.require("./ERC20Token.sol");
var UniswapExchange = artifacts.require("./UniswapExchange.sol");

module.exports = function(deployer) {
  deployer.deploy(RinkebyArbContract);
  deployer.deploy(KyberUniArbContract);
  deployer.deploy(ERC20Token);
  deployer.deploy(UniswapExchange);
};
