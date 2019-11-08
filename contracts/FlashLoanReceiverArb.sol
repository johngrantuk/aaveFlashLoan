pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "./mocks/tokens/MintableERC20.sol";
import "./flashloan/base/FlashLoanReceiverBase.sol";
import "./configuration/LendingPoolAddressesProvider.sol";
import "./configuration/NetworkMetadataProvider.sol";

import "./UniswapExchange.sol";

contract FlashLoanReceiverArb is FlashLoanReceiverBase {

    using SafeMath for uint256;

    // Events
    event borrowMade(address _reserve, uint256 _amount , uint256 _value);
    event tradeMade(uint256 _amount);


    constructor(LendingPoolAddressesProvider _provider) FlashLoanReceiverBase(_provider)
        public {}

    function pullBalance() public{
      // This is terrible but just a quick hack for Hackathon!
      ERC20 token = ERC20(0xFf795577d9AC8bD7D90Ee22b6C1703490b6512FD);

      token.transfer(msg.sender, token.balanceOf(address(this)));
    }

    function executeOperation(
        address _reserve,
        uint256 _amount,
        uint256 _fee) external returns(uint256 returnedAmount) {

        //check the contract has the specified balance
        require(_amount <= getBalanceInternal(address(this), _reserve),
            "Invalid balance for the contract");

        //emit borrowMade(_reserve, _amount , address(this).balance);

        // NEED TO APPROVE Token
        ERC20 token = ERC20(0xFf795577d9AC8bD7D90Ee22b6C1703490b6512FD);

        emit borrowMade(_reserve, _amount , token.balanceOf(address(this)));

        // Approve exchange to take tokens for token -> Eth trade
        token.approve(0xB4ca10f43caF503b7Aa0a77757B99c78212D6b92, _amount);
        // Exchange for token -> eth
        UniswapExchange followerUniSwapExchange = UniswapExchange(0xB4ca10f43caF503b7Aa0a77757B99c78212D6b92);

        uint256 DEADLINE = block.timestamp + 300;
        // Swap token -> Eth
        uint256 eth_bought = followerUniSwapExchange.tokenToEthSwapInput(_amount, 0, DEADLINE);
        // Exchange for Eth -> token
        UniswapExchange leaderUniSwapExchange = UniswapExchange(0x274bBBBd9bf7Cab50fC8F62F5bb61d4FF297b362);
        // Swap Eth -> Token
        uint256 token_bought = leaderUniSwapExchange.ethToTokenSwapInput.value(eth_bought)(_amount, DEADLINE);

        emit tradeMade(token.balanceOf(address(this)));
        // Pays back
        transferFundsBackToPoolInternal(_reserve, _amount.add(_fee));
        return _amount.add(_fee);
    }
}
