// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title TripleTokenRewardsClaim
 * @notice Contract for claiming daily rewards in BETR, NOICE, and DEGEN tokens on Base chain
 * @dev Allows users to claim rewards in three different tokens based on their points
 */
contract TripleTokenRewardsClaim is Ownable, ReentrancyGuard {
    
    struct TokenConfig {
        IERC20 tokenAddress;
        uint256 rewardRatePerThousandPoints;
        bool isActive;
    }
    
    // Token configurations for BETR, NOICE, and DEGEN
    mapping(string => TokenConfig) public tokenConfigs;
    
    // Mapping to track last claim timestamp per user per token
    mapping(address => mapping(string => uint256)) public lastClaimTimestamp;
    
    // Mapping to track total claimed by user per token
    mapping(address => mapping(string => uint256)) public totalClaimed;
    
    // Backend signer address that verifies eligibility
    address public backendSigner;
    
    // Events
    event RewardClaimed(address indexed user, string tokenSymbol, uint256 amount, uint256 timestamp);
    event TokenConfigUpdated(string tokenSymbol, address tokenAddress, uint256 rewardRate, bool isActive);
    event BackendSignerUpdated(address newSigner);
    event TokensWithdrawn(string tokenSymbol, address indexed to, uint256 amount);
    
    constructor(
        address _betrToken,
        uint256 _betrRewardRate,
        address _noiceToken,
        uint256 _noiceRewardRate,
        address _degenToken,
        uint256 _degenRewardRate,
        address _backendSigner
    ) Ownable(msg.sender) {
        require(_betrToken != address(0), "Invalid BETR address");
        require(_noiceToken != address(0), "Invalid NOICE address");
        require(_degenToken != address(0), "Invalid DEGEN address");
        require(_backendSigner != address(0), "Invalid signer address");
        
        // Initialize BETR token
        tokenConfigs["BETR"] = TokenConfig({
            tokenAddress: IERC20(_betrToken),
            rewardRatePerThousandPoints: _betrRewardRate,
            isActive: true
        });
        
        // Initialize NOICE token
        tokenConfigs["NOICE"] = TokenConfig({
            tokenAddress: IERC20(_noiceToken),
            rewardRatePerThousandPoints: _noiceRewardRate,
            isActive: true
        });
        
        // Initialize DEGEN token
        tokenConfigs["DEGEN"] = TokenConfig({
            tokenAddress: IERC20(_degenToken),
            rewardRatePerThousandPoints: _degenRewardRate,
            isActive: true
        });
        
        backendSigner = _backendSigner;
    }
    
    /**
     * @notice Update or add a token configuration
     */
    function setTokenConfig(
        string memory tokenSymbol,
        address tokenAddress,
        uint256 rewardRate,
        bool isActive
    ) external onlyOwner {
        require(tokenAddress != address(0), "Invalid token address");
        
        tokenConfigs[tokenSymbol] = TokenConfig({
            tokenAddress: IERC20(tokenAddress),
            rewardRatePerThousandPoints: rewardRate,
            isActive: isActive
        });
        
        emit TokenConfigUpdated(tokenSymbol, tokenAddress, rewardRate, isActive);
    }
    
    /**
     * @notice Claim daily rewards for a specific token only
     * @param tokenSymbol Token to claim (BETR, NOICE, or DEGEN)
     * @param userPoints Total points the user has
     * @param signature Backend signature verifying eligibility
     */
    function claimReward(
        string memory tokenSymbol,
        uint256 userPoints,
        bytes memory signature
    ) external nonReentrant {
        TokenConfig memory config = tokenConfigs[tokenSymbol];
        require(config.isActive, "Token not active");
        require(canClaimToday(msg.sender, tokenSymbol), "Already claimed today");
        require(userPoints >= 1000, "Need at least 1000 points");
        
        // Verify signature from backend
        bytes32 messageHash = getMessageHash(msg.sender, tokenSymbol, userPoints);
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(messageHash);
        require(recoverSigner(ethSignedMessageHash, signature) == backendSigner, "Invalid signature");
        
        // Calculate reward amount
        uint256 rewardAmount = calculateReward(tokenSymbol, userPoints);
        require(rewardAmount > 0, "No rewards available");
        require(config.tokenAddress.balanceOf(address(this)) >= rewardAmount, "Insufficient contract balance");
        
        // Update claim timestamp
        lastClaimTimestamp[msg.sender][tokenSymbol] = block.timestamp;
        totalClaimed[msg.sender][tokenSymbol] += rewardAmount;
        
        // Transfer tokens
        require(config.tokenAddress.transfer(msg.sender, rewardAmount), "Transfer failed");
        
        emit RewardClaimed(msg.sender, tokenSymbol, rewardAmount, block.timestamp);
    }
    
    /**
     * @notice Check if user can claim today for a specific token
     */
    function canClaimToday(address user, string memory tokenSymbol) public view returns (bool) {
        uint256 lastClaim = lastClaimTimestamp[user][tokenSymbol];
        if (lastClaim == 0) return true;
        
        // Check if 24 hours have passed
        return block.timestamp >= lastClaim + 1 days;
    }
    
    /**
     * @notice Calculate reward based on points for a specific token
     */
    function calculateReward(string memory tokenSymbol, uint256 userPoints) public view returns (uint256) {
        TokenConfig memory config = tokenConfigs[tokenSymbol];
        uint256 thousandPointsMultiplier = userPoints / 1000;
        return thousandPointsMultiplier * config.rewardRatePerThousandPoints;
    }
    
    /**
     * @notice Get time until next claim is available for a specific token
     */
    function getTimeUntilNextClaim(address user, string memory tokenSymbol) public view returns (uint256) {
        uint256 lastClaim = lastClaimTimestamp[user][tokenSymbol];
        if (lastClaim == 0) return 0;
        
        uint256 nextClaimTime = lastClaim + 1 days;
        if (block.timestamp >= nextClaimTime) return 0;
        
        return nextClaimTime - block.timestamp;
    }
    
    // ============ Message Signing Functions ============
    
    function getMessageHash(
        address user,
        string memory tokenSymbol,
        uint256 userPoints
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(user, tokenSymbol, userPoints));
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
    function withdrawTokens(string memory tokenSymbol, address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid address");
        TokenConfig memory config = tokenConfigs[tokenSymbol];
        require(address(config.tokenAddress) != address(0), "Token not configured");
        require(config.tokenAddress.transfer(to, amount), "Transfer failed");
        emit TokensWithdrawn(tokenSymbol, to, amount);
    }
    
    /**
     * @notice Get contract token balance for a specific token
     */
    function getContractBalance(string memory tokenSymbol) external view returns (uint256) {
        TokenConfig memory config = tokenConfigs[tokenSymbol];
        require(address(config.tokenAddress) != address(0), "Token not configured");
        return config.tokenAddress.balanceOf(address(this));
    }
}
