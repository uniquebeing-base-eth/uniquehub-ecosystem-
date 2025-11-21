// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title EarnPointsClaim
 * @dev Contract for claiming earned points in the Earn section on Base network
 * Users pay 0.0000001 ETH to claim points after task verification
 */
contract EarnPointsClaim is Ownable, ReentrancyGuard {
    // Claim fee (0.0000001 ETH)
    uint256 public constant CLAIM_FEE = 0.0000001 ether;
    
    // Track task claims: user => taskId => claimed
    mapping(address => mapping(string => bool)) public taskClaims;
    
    // Track total claims per user
    mapping(address => uint256) public userClaimCount;
    
    // Track total claims per task
    mapping(string => uint256) public taskClaimCount;
    
    // Track points claimed per user
    mapping(address => uint256) public totalPointsClaimed;
    
    // Events
    event PointsClaimed(
        address indexed user,
        string indexed taskId,
        uint256 pointsAmount,
        uint256 timestamp,
        uint256 feeAmount
    );
    
    event FundsWithdrawn(address indexed owner, uint256 amount);
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Claim points for a completed task by paying the fee
     * @param taskId The task identifier
     * @param pointsAmount The amount of points being claimed
     */
    function claimPoints(
        string memory taskId,
        uint256 pointsAmount
    ) external payable nonReentrant {
        require(msg.value == CLAIM_FEE, "Incorrect fee amount");
        require(!taskClaims[msg.sender][taskId], "Points already claimed for this task");
        require(bytes(taskId).length > 0, "Invalid task ID");
        require(pointsAmount > 0, "Points amount must be greater than 0");
        
        // Mark task as claimed
        taskClaims[msg.sender][taskId] = true;
        
        // Increment counters
        userClaimCount[msg.sender]++;
        taskClaimCount[taskId]++;
        totalPointsClaimed[msg.sender] += pointsAmount;
        
        // Emit event for backend to track and award points
        emit PointsClaimed(
            msg.sender,
            taskId,
            pointsAmount,
            block.timestamp,
            msg.value
        );
    }
    
    /**
     * @dev Check if a user has claimed points for a specific task
     * @param user The user address
     * @param taskId The task identifier
     */
    function hasClaimed(
        address user,
        string memory taskId
    ) external view returns (bool) {
        return taskClaims[user][taskId];
    }
    
    /**
     * @dev Get total tasks claimed by a user
     * @param user The user address
     */
    function getUserClaimCount(address user) external view returns (uint256) {
        return userClaimCount[user];
    }
    
    /**
     * @dev Get total claims for a specific task
     * @param taskId The task identifier
     */
    function getTaskClaimCount(string memory taskId) external view returns (uint256) {
        return taskClaimCount[taskId];
    }
    
    /**
     * @dev Get total points claimed by a user
     * @param user The user address
     */
    function getTotalPointsClaimed(address user) external view returns (uint256) {
        return totalPointsClaimed[user];
    }
    
    /**
     * @dev Get contract balance
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev Withdraw all funds from contract (owner only)
     */
    function withdrawFunds() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
        
        emit FundsWithdrawn(owner(), balance);
    }
    
    /**
     * @dev Receive function to accept ETH
     */
    receive() external payable {}
}
