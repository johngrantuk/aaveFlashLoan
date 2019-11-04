pragma solidity ^0.5.0;

import "./UniswapExchange.sol";
import "./ERC20Token.sol";
import "./KyberNetworkProxy.sol";

contract KyberUniArbContract {
  // Variable to hold owner of contract. Set on deploy.
  address public owner;

  // Events
  event ethToToken(address trader, uint256 tokens, uint256 token_bought);
  event tokenToEth(address trader, uint256 ethToBuy, uint256 maxTokensSell, uint256 tokens_sold);

  /**
   * @dev Contract constructor. Set owner of contract as deployer.
   */
  constructor() public {
    owner = msg.sender;
  }

  /**
   * @dev Approves UniSwap exchange to transfer tokens from contract.
   * @param tokenAddress Address of the token to approve
   * @param exchangeAddress UniSwap Exchange address
   * @param amount Token amount to approve
   */
  function approveToken(address tokenAddress, address exchangeAddress, uint amount) public {
    require(msg.sender == owner, "Only Owner Can Approve");
    ERC20Token token = ERC20Token(tokenAddress);
    token.approve(exchangeAddress, amount);
  }

  /**
   * @dev Executes trade.
   * @param kyberExchangeAddress Kyber network address
   * @param tokenAddress Address of the token that is being traded
   * @param kyberMinConversionRate Min conversion rate for Kyber
   * @param uniSwapExchangeAddress UniSwap exchange address
   * @param ethToSell Amount of Eth that is being traded via Kyber. Should be sent as value too.
   * @param maxTokensSell Maximum ERC20 tokens sold in Uniswap trade.
   * @param sellDeadline Uniswap transaction deadline.
   * @param ethToBuy Amount of Eth bought in Uniswap trade.
   */
  function trade(
    address kyberExchangeAddress,
    address tokenAddress,
    uint256 kyberMinConversionRate,
    address uniSwapExchangeAddress,
    uint256 ethToSell,
    uint256 maxTokensSell,
    uint256 sellDeadline,
    uint256 ethToBuy
  ) public
    payable
  {
    require(msg.value >= ethToSell, "Not Enough Eth Sent");
    // check approval

    KyberNetworkProxy kyberExchange = KyberNetworkProxy(kyberExchangeAddress);
    ERC20Token token = ERC20Token(tokenAddress);

    // Swaps Eth for Token via Kyber Exchange
    uint256 token_bought = kyberExchange.swapEtherToToken.value(ethToSell)(token, kyberMinConversionRate);
    emit ethToToken(msg.sender, ethToSell, token_bought);

    // Swaps token to Eth and transfers Eth to msg sender address
    UniswapExchange uniSwapExchange = UniswapExchange(uniSwapExchangeAddress);
    uint256 tokens_sold = uniSwapExchange.tokenToEthTransferOutput(ethToBuy, maxTokensSell, sellDeadline, msg.sender);
    emit tokenToEth(msg.sender, ethToBuy, maxTokensSell, tokens_sold);
  }
}
