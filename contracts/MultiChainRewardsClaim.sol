// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MultiChainRewardsClaim
 * @notice Contract for claiming daily token rewards based on user points
 * @dev Deploy this contract on each chain (Celo, Monad, Arbitrum, BNB) with the respective token
 *      For Solana, you'll need to create a similar program using Anchor/Rust
 */
contract MultiChainRewardsClaim is Ownable, ReentrancyGuard {
    IERC20 public rewardToken;
    
    // Reward rate: tokens per 1000 points (in wei/smallest unit)
    uint256 public rewardRatePerThousandPoints;
    
    // Mapping to track last claim timestamp per user
    mapping(address => uint256) public lastClaimTimestamp;
    
    // Mapping to track total claimed by user
    mapping(address => uint256) public totalClaimed;
    
    // Backend signer address that verifies eligibility
    address public backendSigner;
    
    // Events
    event RewardClaimed(address indexed user, uint256 amount, uint256 timestamp);
    event RewardRateUpdated(uint256 newRate);
    event BackendSignerUpdated(address newSigner);
    event TokensWithdrawn(address indexed to, uint256 amount);
    
    constructor(
        address _rewardToken,
        uint256 _rewardRatePerThousandPoints,
        address _backendSigner
    ) Ownable(msg.sender) {
        rewardToken = IERC20(_rewardToken);
        rewardRatePerThousandPoints = _rewardRatePerThousandPoints;
        backendSigner = _backendSigner;
    }
    
    /**
     * @notice Claim daily rewards based on user points
     * @param userPoints Total points the user has
     * @param signature Backend signature verifying eligibility
     */
    function claimReward(
        uint256 userPoints,
        bytes memory signature
    ) external nonReentrant {
        require(canClaimToday(msg.sender), "Already claimed today");
        require(userPoints >= 1000, "Need at least 1000 points");
        
        // Verify signature from backend
        bytes32 messageHash = getMessageHash(msg.sender, userPoints);
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(messageHash);
        require(recoverSigner(ethSignedMessageHash, signature) == backendSigner, "Invalid signature");
        
        // Calculate reward amount
        uint256 rewardAmount = calculateReward(userPoints);
        require(rewardAmount > 0, "No rewards available");
        require(rewardToken.balanceOf(address(this)) >= rewardAmount, "Insufficient contract balance");
        
        // Update claim timestamp
        lastClaimTimestamp[msg.sender] = block.timestamp;
        totalClaimed[msg.sender] += rewardAmount;
        
        // Transfer tokens
        require(rewardToken.transfer(msg.sender, rewardAmount), "Transfer failed");
        
        emit RewardClaimed(msg.sender, rewardAmount, block.timestamp);
    }
    
    /**
     * @notice Check if user can claim today
     */
    function canClaimToday(address user) public view returns (bool) {
        uint256 lastClaim = lastClaimTimestamp[user];
        if (lastClaim == 0) return true;
        
        // Check if 24 hours have passed
        return block.timestamp >= lastClaim + 1 days;
    }
    
    /**
     * @notice Calculate reward based on points
     */
    function calculateReward(uint256 userPoints) public view returns (uint256) {
        uint256 thousandPointsMultiplier = userPoints / 1000;
        return thousandPointsMultiplier * rewardRatePerThousandPoints;
    }
    
    /**
     * @notice Get time until next claim is available
     */
    function getTimeUntilNextClaim(address user) public view returns (uint256) {
        uint256 lastClaim = lastClaimTimestamp[user];
        if (lastClaim == 0) return 0;
        
        uint256 nextClaimTime = lastClaim + 1 days;
        if (block.timestamp >= nextClaimTime) return 0;
        
        return nextClaimTime - block.timestamp;
    }
    
    // ============ Message Signing Functions ============
    
    function getMessageHash(
        address user,
        uint256 userPoints
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(user, userPoints));
    }
    
    function getEthSignedMessageHash(bytes32 messageHash) public pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
    }
    
    function recoverSigner(
        bytes32 ethSignedMessageHash,
        bytes memory signature
    ) public pure returns (address) {
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(signature);
        return ecrecover(ethSignedMessageHash, v, r, s);
    }
    
    function splitSignature(bytes memory sig)
        public
        pure
        returns (bytes32 r, bytes32 s, uint8 v)
    {
        require(sig.length == 65, "Invalid signature length");
        
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
    }
    
    // ============ Admin Functions ============
    
    /**
     * @notice Update reward rate (only owner)
     */
    function setRewardRate(uint256 _newRate) external onlyOwner {
        rewardRatePerThousandPoints = _newRate;
        emit RewardRateUpdated(_newRate);
    }
    
    /**
     * @notice Update backend signer address (only owner)
     */
    function setBackendSigner(address _newSigner) external onlyOwner {
        require(_newSigner != address(0), "Invalid address");
        backendSigner = _newSigner;
        emit BackendSignerUpdated(_newSigner);
    }
    
    /**
     * @notice Withdraw tokens from contract (only owner)
     */
    function withdrawTokens(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid address");
        require(rewardToken.transfer(to, amount), "Transfer failed");
        emit TokensWithdrawn(to, amount);
    }
    
    /**
     * @notice Get contract token balance
     */
    function getContractBalance() external view returns (uint256) {
        return rewardToken.balanceOf(address(this));
    }
}
