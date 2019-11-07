const path = require("path");
var HDWalletProvider = require('truffle-hdwallet-provider');
require('dotenv').config();

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  contracts_build_directory: path.join(__dirname, "client/src/contracts"),
  networks: {
    develop: {
      port: 8545
    },
    rinkeby: {
      provider: function() {
        return new HDWalletProvider(process.env.PRIVATEKEY, process.env.INFURARINKEBY);
      },
      network_id: 4,
      gasPrice: 20000000000, // 20 GWEI
      gas: 3716887 // gas limit, set any number you want
    },
    kovan: {
      provider: function() {
        return new HDWalletProvider(process.env.PRIVATEKEY, process.env.INFURAKOVAN);
      },
      network_id: 42,
      gasPrice: 20000000000, // 20 GWEI
      gas: 3716887 // gas limit, set any number you want
    }
  }
};
