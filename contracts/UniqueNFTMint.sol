// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title UniqueNFTMint
 * @dev NFT contract for minting unique avatar NFTs with USDC payment
 * Each user can only mint one NFT
 */
contract UniqueNFTMint is ERC721, ERC721URIStorage, Ownable {
    // USDC token interface
    IERC20 public usdcToken;
    
    // Mint price in USDC (0.2 USDC with 6 decimals)
    uint256 public constant MINT_PRICE = 200000; // 0.2 USDC (USDC has 6 decimals)
    
    // Token counter
    uint256 private _tokenIdCounter;
    
    // Treasury address for collecting payments
    address public treasury;
    
    // Mapping to track if a user has already minted
    mapping(address => bool) public hasMinted;
    
    // Mapping from user address to their token ID
    mapping(address => uint256) public userTokenId;
    
    // Events
    event NFTMinted(address indexed minter, uint256 indexed tokenId, string tokenURI);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event USDCAddressUpdated(address indexed oldUSDC, address indexed newUSDC);
    
    /**
     * @dev Constructor
     * @param _usdcAddress Address of the USDC token contract on Base
     * @param _treasury Address to receive USDC payments
     */
    constructor(
        address _usdcAddress,
        address _treasury
    ) ERC721("UniqueHub Avatar", "UHAVATAR") Ownable(msg.sender) {
        require(_usdcAddress != address(0), "Invalid USDC address");
        require(_treasury != address(0), "Invalid treasury address");
        
        usdcToken = IERC20(_usdcAddress);
        treasury = _treasury;
        _tokenIdCounter = 1; // Start token IDs from 1
    }
    
    /**
     * @dev Mint a unique NFT avatar
     * @param tokenURI The metadata URI for the NFT
     * Requirements:
     * - User must not have minted before
     * - User must have approved this contract to spend 0.2 USDC
     * - User must have at least 0.2 USDC balance
     */
    function mintAvatar(string memory tokenURI) external {
        require(!hasMinted[msg.sender], "Already minted your unique avatar");
        require(bytes(tokenURI).length > 0, "Token URI cannot be empty");
        
        // Check USDC balance
        require(
            usdcToken.balanceOf(msg.sender) >= MINT_PRICE,
            "Insufficient USDC balance"
        );
        
        // Check USDC allowance
        require(
            usdcToken.allowance(msg.sender, address(this)) >= MINT_PRICE,
            "Insufficient USDC allowance"
        );
        
        // Transfer USDC from minter to treasury
        require(
            usdcToken.transferFrom(msg.sender, treasury, MINT_PRICE),
            "USDC transfer failed"
        );
        
        // Mint the NFT
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);
        
        // Mark user as having minted
        hasMinted[msg.sender] = true;
        userTokenId[msg.sender] = tokenId;
        
        emit NFTMinted(msg.sender, tokenId, tokenURI);
    }
    
    /**
     * @dev Check if a user has minted their avatar
     * @param user Address to check
     * @return bool True if user has minted
     */
    function hasUserMinted(address user) external view returns (bool) {
        return hasMinted[user];
    }
    
    /**
     * @dev Get the token ID owned by a user
     * @param user Address to check
     * @return uint256 Token ID (0 if not minted)
     */
    function getUserTokenId(address user) external view returns (uint256) {
        return userTokenId[user];
    }
    
    /**
     * @dev Get total number of minted avatars
     * @return uint256 Total minted count
     */
    function totalMinted() external view returns (uint256) {
        return _tokenIdCounter - 1;
    }
    
    /**
     * @dev Update treasury address (only owner)
     * @param newTreasury New treasury address
     */
    function updateTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Invalid treasury address");
        address oldTreasury = treasury;
        treasury = newTreasury;
        emit TreasuryUpdated(oldTreasury, newTreasury);
    }
    
    /**
     * @dev Update USDC token address (only owner)
     * @param newUSDC New USDC token address
     */
    function updateUSDCAddress(address newUSDC) external onlyOwner {
        require(newUSDC != address(0), "Invalid USDC address");
        address oldUSDC = address(usdcToken);
        usdcToken = IERC20(newUSDC);
        emit USDCAddressUpdated(oldUSDC, newUSDC);
    }
    
    /**
     * @dev Override required by Solidity for multiple inheritance
     */
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    
    /**
     * @dev Override required by Solidity for multiple inheritance
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
