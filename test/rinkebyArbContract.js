const truffleAssert = require('truffle-assertions');
const RinkebyArbContract = artifacts.require("./RinkebyArbContract.sol");
const UniswapExchange = artifacts.require("./UniswapExchange.sol");
const ERC20Token =  artifacts.require("./ERC20Token.sol");

contract("RinkebyArbContract", accounts => {
  // The RinkebyArbContract was an initial experimental contract to test various functions. Keeping for reference. See kyberUni for main.
  it("...should have 0 initial balance.", async () => {
    console.log(accounts[0])
    const UniSwapExchangeInstance = await UniswapExchange.deployed();

    await UniSwapExchangeInstance.topUp({ from: accounts[0], value: web3.utils.toWei('5', 'ether') });

    const RinkebyArbContractInstance = await RinkebyArbContract.deployed();

    // Set value of 89
    // await RinkebyArbContractInstance.set(89, { from: accounts[0] });

    // Get stored value
    //const contractBalance = await RinkebyArbContractInstance.getBalance.call();
    const contractBalance = await web3.eth.getBalance(RinkebyArbContract.address);
    assert.equal(contractBalance, 0, ">0 initial balance.");
    const exchangeBalance = await web3.eth.getBalance(UniswapExchange.address);
    assert.equal(exchangeBalance, web3.utils.toWei('5', 'ether'), "Exchange should have 5Eth balance.");

  });

  it("...should fail not enough Eth sent for trade.", async () => {
    const RinkebyArbContractInstance = await RinkebyArbContract.deployed();

    var min_buy_tokens = web3.utils.toWei('0.5', 'ether');
    var buy_deadline = 25;
    var buy_eth_value = web3.utils.toWei('2', 'ether');
    var value = web3.utils.toWei('1', 'ether');
    var sell_tokens = min_buy_tokens;
    var sell_deadline = buy_deadline;
    var min_sell_eth_value = web3.utils.toWei('1', 'ether');

    await truffleAssert.reverts(
      RinkebyArbContractInstance.trade(
        UniswapExchange.address,
        min_buy_tokens,
        buy_deadline,
        buy_eth_value,
        sell_tokens,
        sell_deadline,
        min_sell_eth_value,
        { from: accounts[0], value: min_buy_tokens }),
      "Not Enough Eth Sent"
    );
  });

  it("...should fail on 2nd trade, revert and return funds minus gas.", async () => {
    const RinkebyArbContractInstance = await RinkebyArbContract.deployed();

    var min_buy_tokens = web3.utils.toWei('1', 'ether');
    var buy_deadline = 25;
    var buy_eth_value = web3.utils.toWei('1', 'ether');
    var sell_tokens = min_buy_tokens;
    var sell_deadline = 19;
    var min_sell_eth_value = web3.utils.toWei('1.1', 'ether');

    let account_one_starting_balance = await web3.eth.getBalance(accounts[0]); // wei
    console.log('Starting Balance: ' + web3.utils.fromWei(account_one_starting_balance, 'ether'));
    account_one_starting_balance = new web3.utils.BN(account_one_starting_balance);

    await truffleAssert.reverts(
      RinkebyArbContractInstance.trade(
        UniswapExchange.address,
        min_buy_tokens,
        buy_deadline,
        buy_eth_value,
        sell_tokens,
        sell_deadline,
        min_sell_eth_value,
        { from: accounts[0], value: min_buy_tokens }),
      "Token To Eth Deadline Out"
    );

    let account_one_ending_balance = await web3.eth.getBalance(accounts[0]); // wei
    console.log('End Balance: ' + web3.utils.fromWei(account_one_ending_balance, 'ether'));
    account_one_ending_balance = new web3.utils.BN(account_one_ending_balance);

    // end > start - buy
    let check = account_one_ending_balance.gt(account_one_starting_balance.sub(new web3.utils.BN(min_buy_tokens)));
    assert.isTrue(check, "should only cost gas.");
  });

  it("...should execute trade.", async () => {
    const RinkebyArbContractInstance = await RinkebyArbContract.deployed();

    var min_buy_tokens = web3.utils.toWei('1', 'ether');
    var buy_deadline = 25;
    var buy_eth_value = web3.utils.toWei('1', 'ether');
    var max_sell_tokens = min_buy_tokens;
    var sell_deadline = 25;
    var sell_eth_value = web3.utils.toWei('1.1', 'ether');
    var sell_eth_bn = new web3.utils.BN(sell_eth_value);

    let account_one_starting_balance = await web3.eth.getBalance(accounts[0]); // wei
    console.log('Starting Balance: ' + web3.utils.fromWei(account_one_starting_balance, 'ether'));
    account_one_starting_balance = new web3.utils.BN(account_one_starting_balance);

    let txHash = await RinkebyArbContractInstance.trade(
        UniswapExchange.address,
        min_buy_tokens,
        buy_deadline,
        buy_eth_value,
        max_sell_tokens,
        sell_deadline,
        sell_eth_value,
        { from: accounts[0], value: buy_eth_value });

    const tx = await web3.eth.getTransaction(txHash.tx);

    var gasPrice = new web3.utils.BN(tx.gasPrice);                        // wei
    var gasUsed = new web3.utils.BN(txHash.receipt.gasUsed)                 // wei
    var gasCost = gasPrice.mul(gasUsed);
    console.log('Gas Cost: ' + web3.utils.fromWei(gasCost, 'ether'));

    var profit = sell_eth_bn.sub(new web3.utils.BN(buy_eth_value)).sub(gasCost);
    console.log('Profit: ' + web3.utils.fromWei(profit, 'ether'))

    let account_one_ending_balance = await web3.eth.getBalance(accounts[0]); // wei
    console.log('End Balance: ' + web3.utils.fromWei(account_one_ending_balance, 'ether'));
    account_one_ending_balance = new web3.utils.BN(account_one_ending_balance);
    assert.equal(account_one_starting_balance.add(profit).toString(), account_one_ending_balance.toString(), "should have same start/end balance.");

    truffleAssert.eventEmitted(txHash, 'ethToToken', (ev) => {
      console.log(ev)
      return true;
        //return ev.player === bettingAccount && !ev.betNumber.eq(ev.winningNumber);
    });

    truffleAssert.eventEmitted(txHash, 'tokenToEth', (ev) => {
      return true;
        //return ev.player === bettingAccount && !ev.betNumber.eq(ev.winningNumber);
    });
  });

  it("...should have owner as deployer.", async () => {
    const RinkebyArbContractInstance = await RinkebyArbContract.deployed();
    const contractOwner = await RinkebyArbContractInstance.owner.call();
    assert.equal(contractOwner, accounts[0], "Deployer should be owner.");
  });

  it("...should fail if non-owner calls approveToken.", async () => {
    const RinkebyArbContractInstance = await RinkebyArbContract.deployed();

    await truffleAssert.reverts(
      RinkebyArbContractInstance.approveToken(ERC20Token.address, UniswapExchange.address, 1234,
        { from: accounts[1]}),
      "Only Owner Can Approve"
    );
  });

  it("...should call approveToken.", async () => {
    const RinkebyArbContractInstance = await RinkebyArbContract.deployed();
    const tokenInstance = await ERC20Token.deployed();

    var allowance = await tokenInstance.allowance(RinkebyArbContract.address, UniswapExchange.address);
    console.log('Allowance: ' + allowance.toString());
    assert.equal('0', allowance.toString(), 'Should have no allowance initially');

    var totalSupply = await tokenInstance.totalSupply();
    console.log('Total supply: ' + totalSupply.toString());

    await RinkebyArbContractInstance.approveToken(ERC20Token.address, UniswapExchange.address, totalSupply,
        { from: accounts[0]});

    allowance = await tokenInstance.allowance(RinkebyArbContract.address, UniswapExchange.address);
    console.log('Allowance: ' + allowance.toString());
    assert.equal(totalSupply.toString(), allowance.toString(), 'Should be total supply of token');
  });

});
