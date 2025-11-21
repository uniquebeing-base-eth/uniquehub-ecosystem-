// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title UniqueAvatarNFT
 * @dev Unique avatar NFTs with dynamic pricing (5% increase every 10 mints)
 * Designed to avoid wallet scam warnings by keeping all logic minimal and clear
 */
contract UniqueAvatarNFT is ERC721URIStorage, Ownable, ReentrancyGuard {
    // Base price in ETH
    uint256 public constant BASE_PRICE = 0.0002 ether;
    
    // Price increase percentage (5%)
    uint256 public constant PRICE_INCREASE_PERCENTAGE = 5;
    
    // Mints per tier before price increase
    uint256 public constant MINTS_PER_TIER = 10;
    
    // Token counter
    uint256 private _tokenIdCounter;
    
    // Track if user has minted
    mapping(address => bool) public hasMinted;
    
    // Map user to their token ID
    mapping(address => uint256) public userTokenId;
    
    // Events for transparency
    event PaymentReceived(address indexed sender, uint256 amount);
    event NFTMinted(address indexed minter, uint256 indexed tokenId, string uri, uint256 price);
    event FundsWithdrawn(address indexed owner, uint256 amount);
    
    constructor() ERC721("UniqueHub Avatar", "UHAVATAR") Ownable(msg.sender) {
        _tokenIdCounter = 1; // Start from 1
    }
    
    /**
     * @dev Calculate current mint price based on total mints
     */
    function getCurrentPrice() public view returns (uint256) {
        uint256 totalMints = _tokenIdCounter - 1;
        uint256 tier = totalMints / MINTS_PER_TIER;
        
        // Price = BASE_PRICE * (1.05 ^ tier)
        uint256 price = BASE_PRICE;
        for (uint256 i = 0; i < tier; i++) {
            price = (price * (100 + PRICE_INCREASE_PERCENTAGE)) / 100;
        }
        
        return price;
    }
    
    /**
     * @dev Mint a unique avatar NFT
     * @param tokenURI The metadata URI for the avatar
     */
    function mintAvatar(string memory tokenURI) external payable nonReentrant {
        require(!hasMinted[msg.sender], "Already minted avatar");
        require(bytes(tokenURI).length > 0, "Token URI cannot be empty");
        
        uint256 currentPrice = getCurrentPrice();
        require(msg.value >= currentPrice, "Insufficient payment");
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        // Mint the NFT
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);
        
        // Record minting
        hasMinted[msg.sender] = true;
        userTokenId[msg.sender] = tokenId;
        
        // Emit events for transparency
        emit PaymentReceived(msg.sender, msg.value);
        emit NFTMinted(msg.sender, tokenId, tokenURI, currentPrice);
        
        // Refund excess payment
        if (msg.value > currentPrice) {
            uint256 refund = msg.value - currentPrice;
            (bool success, ) = msg.sender.call{value: refund}("");
            require(success, "Refund failed");
        }
    }
    
    /**
     * @dev Check if user has minted
     */
    function hasUserMinted(address user) external view returns (bool) {
        return hasMinted[user];
    }
    
    /**
     * @dev Get user's token ID
     */
    function getUserTokenId(address user) external view returns (uint256) {
        require(hasMinted[user], "User has not minted");
        return userTokenId[user];
    }
    
    /**
     * @dev Get total minted count
     */
    function totalMinted() external view returns (uint256) {
        return _tokenIdCounter - 1;
    }
    
    /**
     * @dev Get contract balance
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev Owner withdraws accumulated ETH
     * Only callable by contract owner
     */
    function withdraw() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = owner().call{value: balance}("");
        require(success, "Withdrawal failed");
        
        emit FundsWithdrawn(owner(), balance);
    }
}
