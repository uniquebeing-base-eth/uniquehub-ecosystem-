8// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title QuestLearningHub
 * @dev Contract for Quest Learning Hub module completions on Base network
 * Users pay 0.0000001 ETH per module completion for on-chain activity tracking
 */
contract QuestLearningHub is Ownable, ReentrancyGuard {
    // Module completion fee (0.0000001 ETH)
    uint256 public constant MODULE_COMPLETION_FEE = 0.0000001 ether;
    
    // Track module completions: user => courseId => moduleId => completed
    mapping(address => mapping(string => mapping(string => bool))) public moduleCompletions;
    
    // Track total modules completed per user
    mapping(address => uint256) public userModuleCount;
    
    // Track total modules completed per course
    mapping(string => uint256) public courseModuleCount;
    
    // Events
    event ModuleCompleted(
        address indexed user,
        string indexed courseId,
        string indexed moduleId,
        uint256 timestamp,
        uint256 feeAmount
    );
    
    event FundsWithdrawn(address indexed owner, uint256 amount);
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Complete a module by paying the fee
     * @param courseId The course identifier
     * @param moduleId The module identifier
     */
    function completeModule(
        string memory courseId,
        string memory moduleId
    ) external payable nonReentrant {
        require(msg.value == MODULE_COMPLETION_FEE, "Incorrect fee amount");
        require(!moduleCompletions[msg.sender][courseId][moduleId], "Module already completed");
        require(bytes(courseId).length > 0, "Invalid course ID");
        require(bytes(moduleId).length > 0, "Invalid module ID");
        
        // Mark module as completed
        moduleCompletions[msg.sender][courseId][moduleId] = true;
        
        // Increment counters
        userModuleCount[msg.sender]++;
        courseModuleCount[courseId]++;
        
        // Emit event for backend to track
        emit ModuleCompleted(
            msg.sender,
            courseId,
            moduleId,
            block.timestamp,
            msg.value
        );
    }
    
    /**
     * @dev Check if a user has completed a specific module
     * @param user The user address
     * @param courseId The course identifier
     * @param moduleId The module identifier
     */
    function hasCompletedModule(
        address user,
        string memory courseId,
        string memory moduleId
    ) external view returns (bool) {
        return moduleCompletions[user][courseId][moduleId];
    }
    
    /**
     * @dev Get total modules completed by a user
     * @param user The user address
     */
    function getUserModuleCount(address user) external view returns (uint256) {
        return userModuleCount[user];
    }
    
    /**
     * @dev Get total completions for a course
     * @param courseId The course identifier
     */
    function getCourseModuleCount(string memory courseId) external view returns (uint256) {
        return courseModuleCount[courseId];
    }
    
    /**
     * @dev Get contract balance
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev is able to Withdraw all funds from contract (owner only)
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


