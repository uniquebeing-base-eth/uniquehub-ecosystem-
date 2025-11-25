// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title BaseMultiTokenRewardsClaim
 * @notice Contract for claiming daily rewards for EGGS and JESSE tokens on Base chain
 * @dev Deploy with all token addresses and reward rates - no extra setup needed!
 * 
 * DEPLOYMENT EXAMPLE (Remix):
 * Constructor args: 
 *   _eggsToken: 0x... (EGGS token contract address)
 *   _eggsRewardRate: 100000000000000000 (0.1 EGGS per 1000 points - 18 decimals)
 *   _jesseToken: 0x... (JESSE token contract address)  
 *   _jesseRewardRate: 500000000000000000 (0.5 JESSE per 1000 points - 18 decimals)
 *   _backendSigner: 0x... (your wallet address that will sign claims)
 * 
 * After deployment, just fund the contract with EGGS and JESSE tokens!
 */
contract BaseMultiTokenRewardsClaim is Ownable, ReentrancyGuard {
    
    struct TokenConfig {
        IERC20 token;
        uint256 rewardRatePerThousandPoints; // Tokens per 1000 points (in wei/smallest unit)
        bool active;
    }
    
    // Token ID => TokenConfig
    mapping(string => TokenConfig) public tokenConfigs;
    
    // User => Token ID => Last claim timestamp
    mapping(address => mapping(string => uint256)) public lastClaimTimestamp;
    
    // User => Token ID => Total claimed
    mapping(address => mapping(string => uint256)) public totalClaimed;
    
    // Backend signer address that verifies eligibility
    address public backendSigner;
    
    // Events
    event RewardClaimed(
        address indexed user,
        string tokenId,
        uint256 amount,
        uint256 timestamp
    );
    event TokenConfigUpdated(
        string tokenId,
        address tokenAddress,
        uint256 rewardRate,
        bool active
    );
    event BackendSignerUpdated(address newSigner);
    event TokensWithdrawn(string tokenId, address indexed to, uint256 amount);
    
    /**
     * @notice Deploy with EGGS and JESSE tokens pre-configured
     * @param _eggsToken EGGS token contract address
     * @param _eggsRewardRate EGGS tokens per 1000 points (in wei, e.g., 100000000000000000 = 0.1 tokens)
     * @param _jesseToken JESSE token contract address
     * @param _jesseRewardRate JESSE tokens per 1000 points (in wei, e.g., 500000000000000000 = 0.5 tokens)
     * @param _backendSigner Address that will sign claim authorizations (your wallet)
     */
    constructor(
        address _eggsToken,
        uint256 _eggsRewardRate,
        address _jesseToken,
        uint256 _jesseRewardRate,
        address _backendSigner
    ) Ownable(msg.sender) {
        require(_eggsToken != address(0), "Invalid EGGS token address");
        require(_jesseToken != address(0), "Invalid JESSE token address");
        require(_backendSigner != address(0), "Invalid signer address");
        
        // Configure EGGS token
        tokenConfigs["EGGS"] = TokenConfig({
            token: IERC20(_eggsToken),
            rewardRatePerThousandPoints: _eggsRewardRate,
            active: true
        });
        emit TokenConfigUpdated("EGGS", _eggsToken, _eggsRewardRate, true);
        
        // Configure JESSE token
        tokenConfigs["JESSE"] = TokenConfig({
            token: IERC20(_jesseToken),
            rewardRatePerThousandPoints: _jesseRewardRate,
            active: true
        });
        emit TokenConfigUpdated("JESSE", _jesseToken, _jesseRewardRate, true);
        
        backendSigner = _backendSigner;
    }
    
    /**
     * @notice Add or update a token configuration (for future tokens)
     */
    function setTokenConfig(
        string memory tokenId,
        address tokenAddress,
        uint256 rewardRatePerThousandPoints,
        bool active
    ) external onlyOwner {
        require(tokenAddress != address(0), "Invalid token address");
        
        tokenConfigs[tokenId] = TokenConfig({
            token: IERC20(tokenAddress),
            rewardRatePerThousandPoints: rewardRatePerThousandPoints,
            active: active
        });
        
        emit TokenConfigUpdated(tokenId, tokenAddress, rewardRatePerThousandPoints, active);
    }
    
    /**
     * @notice Claim daily rewards for a specific token
     * @param tokenId Token identifier ("EGGS" or "JESSE")
     * @param userPoints Total points the user has
     * @param signature Backend signature verifying eligibility
     */
    function claimReward(
        string memory tokenId,
        uint256 userPoints,
        bytes memory signature
    ) external nonReentrant {
        TokenConfig memory config = tokenConfigs[tokenId];
        require(config.active, "Token not active");
        require(canClaimToday(msg.sender, tokenId), "Already claimed today");
        require(userPoints >= 1000, "Need at least 1000 points");
        
        // Verify signature from backend
        bytes32 messageHash = getMessageHash(msg.sender, tokenId, userPoints);
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(messageHash);
        require(
            recoverSigner(ethSignedMessageHash, signature) == backendSigner,
            "Invalid signature"
        );
        
        // Calculate reward amount
        uint256 rewardAmount = calculateReward(userPoints, config.rewardRatePerThousandPoints);
        require(rewardAmount > 0, "No rewards available");
        require(
            config.token.balanceOf(address(this)) >= rewardAmount,
            "Insufficient contract balance"
        );
        
        // Update claim timestamp
        lastClaimTimestamp[msg.sender][tokenId] = block.timestamp;
        totalClaimed[msg.sender][tokenId] += rewardAmount;
        
        // Transfer tokens
        require(config.token.transfer(msg.sender, rewardAmount), "Transfer failed");
        
        emit RewardClaimed(msg.sender, tokenId, rewardAmount, block.timestamp);
    }
    
    /**
     * @notice Check if user can claim today for a specific token
     */
    function canClaimToday(address user, string memory tokenId) public view returns (bool) {
        uint256 lastClaim = lastClaimTimestamp[user][tokenId];
        if (lastClaim == 0) return true;
        
        // Check if 24 hours have passed
        return block.timestamp >= lastClaim + 1 days;
    }
    
    /**
     * @notice Calculate reward based on points and rate
     */
    function calculateReward(
        uint256 userPoints,
        uint256 rewardRate
    ) public pure returns (uint256) {
        uint256 thousandPointsMultiplier = userPoints / 1000;
        return thousandPointsMultiplier * rewardRate;
    }
    
    /**
     * @notice Get time until next claim is available for a token
     */
    function getTimeUntilNextClaim(
        address user,
        string memory tokenId
    ) public view returns (uint256) {
        uint256 lastClaim = lastClaimTimestamp[user][tokenId];
        if (lastClaim == 0) return 0;
        
        uint256 nextClaimTime = lastClaim + 1 days;
        if (block.timestamp >= nextClaimTime) return 0;
        
        return nextClaimTime - block.timestamp;
    }
    
    // ============ Message Signing Functions ============
    
    function getMessageHash(
        address user,
        string memory tokenId,
        uint256 userPoints
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(user, tokenId, userPoints));
    }
    
    function getEthSignedMessageHash(bytes32 messageHash) public pure returns (bytes32) {
        return keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
        );
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
    function withdrawTokens(
        string memory tokenId,
        address to,
        uint256 amount
    ) external onlyOwner {
        require(to != address(0), "Invalid address");
        TokenConfig memory config = tokenConfigs[tokenId];
        require(address(config.token) != address(0), "Token not configured");
        require(config.token.transfer(to, amount), "Transfer failed");
        emit TokensWithdrawn(tokenId, to, amount);
    }
    
    /**
     * @notice Get contract token balance
     */
    function getContractBalance(string memory tokenId) external view returns (uint256) {
        TokenConfig memory config = tokenConfigs[tokenId];
        require(address(config.token) != address(0), "Token not configured");
        return config.token.balanceOf(address(this));
    }
}
