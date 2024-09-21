// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract InspectorAI {
    struct Review {
        address reviewer;
        uint8 rating;
        string comment;
    }

    mapping(address => mapping(address => bool)) private hasReviewed;
    mapping(address => Review[]) private contractReviews;

    event ReviewAdded(address indexed contractAddress, address indexed reviewer, uint8 rating, string comment);

    modifier notReviewed(address _contractAddress) {
        require(!hasReviewed[msg.sender][_contractAddress], "You have already reviewed this contract");
        _;
    }

    modifier validRating(uint8 _rating) {
        require(_rating >= 1 && _rating <= 5, "Rating must be between 1 and 5");
        _;
    }

    function addReview(address _contractAddress, uint8 _rating, string memory _comment) external notReviewed(_contractAddress) validRating(_rating) {
        hasReviewed[msg.sender][_contractAddress] = true;
        contractReviews[_contractAddress].push(Review(msg.sender, _rating, _comment));
        
        emit ReviewAdded(_contractAddress, msg.sender, _rating, _comment);
    }

    function getReviews(address _contractAddress) external view returns (Review[] memory) {
        return contractReviews[_contractAddress];
    }
}