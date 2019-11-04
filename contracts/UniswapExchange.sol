pragma solidity ^0.5.0;
// Solidity Interface
// https://github.com/Uniswap/contracts-vyper/blob/master/contracts/uniswap_exchange.vy

contract UniswapExchange {

  // Trade ETH to ERC20
  function ethToTokenSwapInput(uint256 min_tokens, uint256 deadline) external payable returns (uint256  tokens_bought){
    // THIS IS JUST A DEMO TO TEST VARIOUS FUNCTIONS WITHOUT LIVE MIGRATE
    // assert deadline >= block.timestamp and (eth_sold > 0 and min_tokens > 0)
    require(deadline > 20, "Eth To Token Deadline Out");     // This is just to make test for a revert

    // assert tokens_bought >= min_tokens
    // assert self.token.transfer(recipient, tokens_bought)

    return min_tokens;
  }

  function tokenToEthSwapInput(uint256 tokens_sold, uint256 min_eth, uint256 deadline) external returns (uint256  eth_bought){
    // THIS IS JUST A DEMO TO TEST VARIOUS FUNCTIONS WITHOUT LIVE MIGRATE
    // assert deadline >= block.timestamp and (eth_sold > 0 and min_tokens > 0)
    require(deadline > 20, "Token To Eth Deadline Out");     // This is just to make test for a revert

    // assert tokens_bought >= min_tokens
    // assert self.token.transfer(recipient, tokens_bought)

    return min_eth;
  }

  function tokenToEthTransferOutput(uint256 eth_bought,
    uint256 max_tokens,
    uint256 deadline,
    address payable recipient) external returns (uint256  tokens_sold){
    // THIS IS JUST A DEMO TO TEST VARIOUS FUNCTIONS WITHOUT LIVE MIGRATE
    // assert deadline >= block.timestamp and (eth_sold > 0 and min_tokens > 0)
    require(deadline > 20, "Token To Eth Deadline Out");     // This is just to make test for a revert

    // assert tokens_bought >= min_tokens
    // assert self.token.transfer(recipient, tokens_bought)
    recipient.send(eth_bought);
    return max_tokens;
  }

  function topUp() public payable {

  }

}
