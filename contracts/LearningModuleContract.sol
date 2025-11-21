// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title LearningModuleContract
 * @dev Contract for completing learning modules with a small ETH fee
 */
contract LearningModuleContract is Ownable, ReentrancyGuard {
    uint256 public constant MODULE_COMPLETION_FEE = 0.0000001 ether; // 100 gwei
    
    struct ModuleCompletion {
        address user;
        string courseId;
        string moduleId;
        uint256 timestamp;
        uint256 feePaid;
    }
    
    // Mapping: user => courseId => moduleId => completion data
    mapping(address => mapping(string => mapping(string => ModuleCompletion))) public completions;
    
    // Track total completions per user
    mapping(address => uint256) public userCompletionCount;
    
    // Total ETH collected
    uint256 public totalCollected;
    
    event ModuleCompleted(
        address indexed user,
        string courseId,
        string moduleId,
        uint256 timestamp,
        uint256 feePaid
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
        require(bytes(courseId).length > 0, "Course ID required");
        require(bytes(moduleId).length > 0, "Module ID required");
        
        // Check if already completed
        require(
            completions[msg.sender][courseId][moduleId].timestamp == 0,
            "Module already completed"
        );
        
        // Record completion
        completions[msg.sender][courseId][moduleId] = ModuleCompletion({
            user: msg.sender,
            courseId: courseId,
            moduleId: moduleId,
            timestamp: block.timestamp,
            feePaid: msg.value
        });
        
        userCompletionCount[msg.sender]++;
        totalCollected += msg.value;
        
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
     */
    function hasCompletedModule(
        address user,
        string memory courseId,
        string memory moduleId
    ) external view returns (bool) {
        return completions[user][courseId][moduleId].timestamp > 0;
    }
    
    /**
     * @dev Get module completion details
     */
    function getModuleCompletion(
        address user,
        string memory courseId,
        string memory moduleId
    ) external view returns (ModuleCompletion memory) {
        return completions[user][courseId][moduleId];
    }
    
    /**
     * @dev Get contract balance
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev Owner can withdraw accumulated fees
     */
    function withdraw(uint256 amount) external onlyOwner {
        require(amount <= address(this).balance, "Insufficient balance");
        
        (bool success, ) = owner().call{value: amount}("");
        require(success, "Withdrawal failed");
        
        emit FundsWithdrawn(owner(), amount);
    }
    
    /**
     * @dev Withdraw all accumulated fees
     */
    function withdrawAll() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        
        (bool success, ) = owner().call{value: balance}("");
        require(success, "Withdrawal failed");
        
        emit FundsWithdrawn(owner(), balance);
    }
}
