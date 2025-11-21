// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title QuestModuleContract
 * @dev Records Quest Learning Hub module completions on-chain
 */
contract QuestModuleContract is Ownable, ReentrancyGuard {
    // Module completion tracking: user address => module ID => completion status
    mapping(address => mapping(bytes32 => bool)) public moduleCompletions;
    
    // User completion count
    mapping(address => uint256) public userCompletionCount;
    
    // Total completions across all users
    uint256 public totalCompletions;
    
    // Events
    event ModuleCompleted(
        address indexed user,
        bytes32 indexed moduleId,
        bytes32 indexed courseId,
        uint256 timestamp,
        uint256 accuracyPercentage
    );
    
    event ModuleReset(
        address indexed user,
        bytes32 indexed moduleId
    );
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Record a module completion
     * @param moduleId Unique identifier for the module
     * @param courseId Unique identifier for the course
     * @param accuracyPercentage Quiz accuracy (0-100)
     */
    function completeModule(
        bytes32 moduleId,
        bytes32 courseId,
        uint256 accuracyPercentage
    ) external nonReentrant {
        require(moduleId != bytes32(0), "Invalid module ID");
        require(courseId != bytes32(0), "Invalid course ID");
        require(accuracyPercentage <= 100, "Invalid accuracy percentage");
        require(!moduleCompletions[msg.sender][moduleId], "Module already completed");
        
        // Record completion
        moduleCompletions[msg.sender][moduleId] = true;
        userCompletionCount[msg.sender]++;
        totalCompletions++;
        
        emit ModuleCompleted(
            msg.sender,
            moduleId,
            courseId,
            block.timestamp,
            accuracyPercentage
        );
    }
    
    /**
     * @dev Check if a user has completed a module
     * @param user User address
     * @param moduleId Module identifier
     */
    function hasCompletedModule(address user, bytes32 moduleId) 
        external 
        view 
        returns (bool) 
    {
        return moduleCompletions[user][moduleId];
    }
    
    /**
     * @dev Get user's total completion count
     * @param user User address
     */
    function getUserCompletions(address user) 
        external 
        view 
        returns (uint256) 
    {
        return userCompletionCount[user];
    }
    
    /**
     * @dev Admin function to reset a module completion (for testing)
     * @param user User address
     * @param moduleId Module identifier
     */
    function resetModuleCompletion(address user, bytes32 moduleId) 
        external 
        onlyOwner 
    {
        require(moduleCompletions[user][moduleId], "Module not completed");
        
        moduleCompletions[user][moduleId] = false;
        userCompletionCount[user]--;
        totalCompletions--;
        
        emit ModuleReset(user, moduleId);
    }
}
