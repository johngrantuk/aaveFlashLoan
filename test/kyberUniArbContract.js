const truffleAssert = require('truffle-assertions');
const KyberUniArbContract = artifacts.require("./KyberUniArbContract.sol");
const UniswapExchange = artifacts.require("./UniswapExchange.sol");
const ERC20Token =  artifacts.require("./ERC20Token.sol");

contract("KyberUniArbContract", accounts => {

  let KyberUniArbContractInstance;

  beforeEach('setup contract for each test', async function () {
    KyberUniArbContractInstance = await KyberUniArbContract.deployed();
  });

  it("...should have 0 initial balance.", async () => {
    const contractBalance = await web3.eth.getBalance(KyberUniArbContract.address);
    assert.equal(contractBalance, 0, "0 initial balance.");
  });

  it("...should fail not enough Eth sent for trade.", async () => {

    var kyberExchangeAddress = "0xF77eC7Ed5f5B9a5aee4cfa6FFCaC6A4C315BaC76";
    var tokenAddress = '0x732fBA98dca813C3A630b53a8bFc1d6e87B1db65';
    var kyberMinConversionRate = web3.utils.toWei('1', 'ether');
    var uniSwapExchangeAddress = UniswapExchange.address;
    var ethToSell = web3.utils.toWei('1', 'ether');
    var maxTokensSell = web3.utils.toWei('1', 'ether');
    var sellDeadline = 11111;
    var ethToBuy = web3.utils.toWei('2', 'ether');
    var valueEthSent = web3.utils.toWei('0.5', 'ether');

    await truffleAssert.reverts(
      KyberUniArbContractInstance.trade(
        kyberExchangeAddress,
        tokenAddress,
        kyberMinConversionRate,
        uniSwapExchangeAddress,
        ethToSell,
        maxTokensSell,
        sellDeadline,
        ethToBuy,
        { from: accounts[0], value: valueEthSent }),
      "Not Enough Eth Sent"
    );
  });

  it("...should fail on 2nd trade, revert and return funds minus gas.", async () => {
    // Testing atomic trading works. i.e. if first trade is succesfull but 2nd fails make sure no Eth is lost.
    var kyberExchangeAddress = "0xF77eC7Ed5f5B9a5aee4cfa6FFCaC6A4C315BaC76";
    var tokenAddress = '0x732fBA98dca813C3A630b53a8bFc1d6e87B1db65';
    var kyberMinConversionRate = web3.utils.toWei('1', 'ether');
    var uniSwapExchangeAddress = UniswapExchange.address;
    var ethToSell = web3.utils.toWei('1', 'ether');
    var maxTokensSell = web3.utils.toWei('1', 'ether');
    var sellDeadline = 'THIS SHOULD FAIL';
    var ethToBuy = web3.utils.toWei('2', 'ether');
    var valueEthSent = web3.utils.toWei('0.5', 'ether');

    let account_one_starting_balance = await web3.eth.getBalance(accounts[0]); // wei
    console.log('Starting Balance: ' + web3.utils.fromWei(account_one_starting_balance, 'ether'));
    account_one_starting_balance = new web3.utils.BN(account_one_starting_balance);

    // Should intentionally fail because of maxTokensSell. This is after Kyber trade.
    await truffleAssert.fails(
      KyberUniArbContractInstance.trade(
        kyberExchangeAddress,
        tokenAddress,
        kyberMinConversionRate,
        uniSwapExchangeAddress,
        ethToSell,
        maxTokensSell,
        sellDeadline,
        ethToBuy,
        { from: accounts[0], value: valueEthSent })
    );

    let account_one_ending_balance = await web3.eth.getBalance(accounts[0]); // wei
    console.log('End Balance: ' + web3.utils.fromWei(account_one_ending_balance, 'ether'));
    account_one_ending_balance = new web3.utils.BN(account_one_ending_balance);

    // end > start - buy
    let check = account_one_ending_balance.gt(account_one_starting_balance.sub(new web3.utils.BN(ethToSell)));
    assert.isTrue(check, "should only cost gas.");
  });

/*
  THIS NEEDS KYBER CONTRACT DEPLOYED ON TEST - See testScriptsKyber.js for full tests on Rinkeby
  it("...should execute trade.", async () => {
    var kyberExchangeAddress = "0xF77eC7Ed5f5B9a5aee4cfa6FFCaC6A4C315BaC76";
    var tokenAddress = '0x732fBA98dca813C3A630b53a8bFc1d6e87B1db65';
    var kyberMinConversionRate = web3.utils.toWei('1', 'ether');
    var uniSwapExchangeAddress = UniswapExchange.address;
    var ethToSell = web3.utils.toWei('1', 'ether');
    var maxTokensSell = web3.utils.toWei('1', 'ether');
    var sellDeadline = 11111;
    var ethToBuy = web3.utils.toWei('1.1', 'ether');
    var valueEthSent = web3.utils.toWei('1', 'ether');

    let account_one_starting_balance = await web3.eth.getBalance(accounts[0]); // wei
    console.log('Starting Balance: ' + web3.utils.fromWei(account_one_starting_balance, 'ether'));
    account_one_starting_balance = new web3.utils.BN(account_one_starting_balance);

    let txHash = await KyberUniArbContractInstance.trade(
      kyberExchangeAddress,
      tokenAddress,
      kyberMinConversionRate,
      uniSwapExchangeAddress,
      ethToSell,
      maxTokensSell,
      sellDeadline,
      ethToBuy,
      { from: accounts[0], value: valueEthSent });

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
*/
  it("...should have owner as deployer.", async () => {
    const contractOwner = await KyberUniArbContractInstance.owner.call();
    assert.equal(contractOwner, accounts[0], "Deployer should be owner.");
  });

  it("...should fail if non-owner calls approveToken.", async () => {

    await truffleAssert.reverts(
      KyberUniArbContractInstance.approveToken(ERC20Token.address, UniswapExchange.address, 1234,
        { from: accounts[1]}),
      "Only Owner Can Approve"
    );
  });

  it("...should call approveToken.", async () => {
    const tokenInstance = await ERC20Token.deployed();

    var allowance = await tokenInstance.allowance(KyberUniArbContract.address, UniswapExchange.address);
    console.log('Allowance: ' + allowance.toString());
    assert.equal('0', allowance.toString(), 'Should have no allowance initially');

    var totalSupply = await tokenInstance.totalSupply();
    console.log('Total supply: ' + totalSupply.toString());

    await KyberUniArbContractInstance.approveToken(ERC20Token.address, UniswapExchange.address, totalSupply,
        { from: accounts[0]});

    allowance = await tokenInstance.allowance(KyberUniArbContract.address, UniswapExchange.address);
    console.log('Allowance: ' + allowance.toString());
    assert.equal(totalSupply.toString(), allowance.toString(), 'Should be total supply of token');
  });

});
