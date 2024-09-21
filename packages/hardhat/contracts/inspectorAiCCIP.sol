// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {OwnerIsCreator} from "@chainlink/contracts-ccip/src/v0.8/shared/access/OwnerIsCreator.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {CCIPReceiver} from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import {IERC20} from "@chainlink/contracts-ccip/src/v0.8/vendor/openzeppelin-solidity/v4.8.3/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@chainlink/contracts-ccip/src/v0.8/vendor/openzeppelin-solidity/v4.8.3/contracts/token/ERC20/utils/SafeERC20.sol";

contract InspectorAI is CCIPReceiver, OwnerIsCreator {
    using SafeERC20 for IERC20;

    struct Review {
        address reviewer;
        uint8 rating;
        string comment;
    }

    mapping(address => mapping(address => bool)) private hasReviewed;
    mapping(address => Review[]) private contractReviews;

    // Chainlink CCIP related variables
    IERC20 private s_linkToken;
    mapping(uint64 => bool) public allowlistedSourceChains;
    mapping(address => bool) public allowlistedSenders;

    event ReviewAdded(address indexed contractAddress, address indexed reviewer, uint8 rating, string comment);
    event MessageSent(bytes32 indexed messageId, uint64 indexed destinationChainSelector, address receiver, bytes data);
    event MessageReceived(bytes32 indexed messageId, uint64 indexed sourceChainSelector, address sender, bytes data);

    error NotEnoughBalance(uint256 currentBalance, uint256 calculatedFees);
    error NothingToWithdraw();
    error FailedToWithdrawEth(address owner, address target, uint256 value);
    error SourceChainNotAllowlisted(uint64 sourceChainSelector);
    error SenderNotAllowlisted(address sender);
    error InvalidRating();
    error AlreadyReviewed();

    constructor(address _router, address _link) CCIPReceiver(_router) {
        s_linkToken = IERC20(_link);
    }

    modifier validRating(uint8 _rating) {
        if (_rating < 1 || _rating > 5) revert InvalidRating();
        _;
    }

    modifier notReviewed(address _contractAddress) {
        if (hasReviewed[msg.sender][_contractAddress]) revert AlreadyReviewed();
        _;
    }

    function addReview(address _contractAddress, uint8 _rating, string memory _comment) 
        external 
        notReviewed(_contractAddress) 
        validRating(_rating) 
    {
        hasReviewed[msg.sender][_contractAddress] = true;
        contractReviews[_contractAddress].push(Review(msg.sender, _rating, _comment));
        emit ReviewAdded(_contractAddress, msg.sender, _rating, _comment);
    }

    function getReviews(address _contractAddress) external view returns (Review[] memory) {
        return contractReviews[_contractAddress];
    }

    // CCIP functions

    function sendReviewCrossChain(
        uint64 _destinationChainSelector,
        address _receiver,
        address _contractAddress,
        uint8 _rating,
        string calldata _comment
    ) external onlyOwner returns (bytes32 messageId) {
        Client.EVM2AnyMessage memory evm2AnyMessage = _buildCCIPMessage(
            _receiver,
            abi.encode(_contractAddress, msg.sender, _rating, _comment),
            address(s_linkToken)
        );

        IRouterClient router = IRouterClient(this.getRouter());

        uint256 fees = router.getFee(_destinationChainSelector, evm2AnyMessage);

        if (fees > s_linkToken.balanceOf(address(this)))
            revert NotEnoughBalance(s_linkToken.balanceOf(address(this)), fees);

        s_linkToken.approve(address(router), fees);

        messageId = router.ccipSend(_destinationChainSelector, evm2AnyMessage);

        emit MessageSent(messageId, _destinationChainSelector, _receiver, evm2AnyMessage.data);

        return messageId;
    }

    function _ccipReceive(Client.Any2EVMMessage memory any2EvmMessage) internal override {
        if (!allowlistedSourceChains[any2EvmMessage.sourceChainSelector])
            revert SourceChainNotAllowlisted(any2EvmMessage.sourceChainSelector);
        
        if (!allowlistedSenders[abi.decode(any2EvmMessage.sender, (address))])
            revert SenderNotAllowlisted(abi.decode(any2EvmMessage.sender, (address)));

        (address contractAddress, address reviewer, uint8 rating, string memory comment) = abi.decode(
            any2EvmMessage.data,
            (address, address, uint8, string)
        );

        if (!hasReviewed[reviewer][contractAddress]) {
            hasReviewed[reviewer][contractAddress] = true;
            contractReviews[contractAddress].push(Review(reviewer, rating, comment));
            emit ReviewAdded(contractAddress, reviewer, rating, comment);
        }

        emit MessageReceived(
            any2EvmMessage.messageId,
            any2EvmMessage.sourceChainSelector,
            abi.decode(any2EvmMessage.sender, (address)),
            any2EvmMessage.data
        );
    }

    function _buildCCIPMessage(
        address _receiver,
        bytes memory _data,
        address _feeTokenAddress
    ) private pure returns (Client.EVM2AnyMessage memory) {
        return Client.EVM2AnyMessage({
            receiver: abi.encode(_receiver),
            data: _data,
            tokenAmounts: new Client.EVMTokenAmount[](0),
            extraArgs: Client._argsToBytes(
                Client.EVMExtraArgsV1({gasLimit: 200_000})
            ),
            feeToken: _feeTokenAddress
        });
    }

    // Admin functions

    function allowlistSourceChain(uint64 _sourceChainSelector, bool allowed) external onlyOwner {
        allowlistedSourceChains[_sourceChainSelector] = allowed;
    }

    function allowlistSender(address _sender, bool allowed) external onlyOwner {
        allowlistedSenders[_sender] = allowed;
    }

    // Withdrawal functions

    receive() external payable {}

    function withdrawLink(address _beneficiary) public onlyOwner {
        uint256 amount = s_linkToken.balanceOf(address(this));
        if (amount == 0) revert NothingToWithdraw();
        s_linkToken.safeTransfer(_beneficiary, amount);
    }

    function withdraw(address _beneficiary) public onlyOwner {
        uint256 amount = address(this).balance;
        if (amount == 0) revert NothingToWithdraw();
        (bool sent, ) = _beneficiary.call{value: amount}("");
        if (!sent) revert FailedToWithdrawEth(msg.sender, _beneficiary, amount);
    }
}
