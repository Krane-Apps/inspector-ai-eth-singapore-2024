// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract InspectorAI {
    struct Review {
        address reviewer;
        bool isThumbsUp;
        string comment;
    }

    mapping(address => mapping(address => bool)) private hasReviewed;
    mapping(address => Review[]) private contractReviews;

    event ReviewAdded(address indexed contractAddress, address indexed reviewer, bool isThumbsUp, string comment);

    modifier notReviewed(address _contractAddress) {
        require(!hasReviewed[msg.sender][_contractAddress], "You have already reviewed this contract");
        _;
    }

    function thumbsUp(address _contractAddress) external notReviewed(_contractAddress) {
        _addReview(_contractAddress, true, "");
    }

    function thumbsDown(address _contractAddress) external notReviewed(_contractAddress) {
        _addReview(_contractAddress, false, "");
    }

    function addReview(address _contractAddress, bool _isThumbsUp, string memory _comment) external notReviewed(_contractAddress) {
        require(bytes(_comment).length > 0, "Comment cannot be empty");
        _addReview(_contractAddress, _isThumbsUp, _comment);
    }

    function _addReview(address _contractAddress, bool _isThumbsUp, string memory _comment) private {
        hasReviewed[msg.sender][_contractAddress] = true;
        contractReviews[_contractAddress].push(Review(msg.sender, _isThumbsUp, _comment));
        emit ReviewAdded(_contractAddress, msg.sender, _isThumbsUp, _comment);
    }

    function getReviews(address _contractAddress) external view returns (Review[] memory) {
        return contractReviews[_contractAddress];
    }
}