// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CertificateNFT
 * @dev Simple, transparent NFT certificate minting with fixed ETH price
 * Designed to avoid wallet scam warnings by keeping all logic minimal and clear
 */
contract CertificateNFT is ERC721URIStorage, Ownable, ReentrancyGuard {
    // Fixed mint price in ETH
    uint256 public constant MINT_PRICE = 0.000003 ether;
    
    // Token counter
    uint256 private _tokenIdCounter;
    
    // Track if user has minted
    mapping(address => bool) public hasMinted;
    
    // Map user to their token ID
    mapping(address => uint256) public userTokenId;
    
    // Events for transparency
    event PaymentReceived(address indexed sender, uint256 amount);
    event NFTMinted(address indexed minter, uint256 indexed tokenId, string uri);
    event FundsWithdrawn(address indexed owner, uint256 amount);
    
    constructor() ERC721("UniqueHub Certificate", "UHCERT") Ownable(msg.sender) {
        _tokenIdCounter = 1; // Start from 1
    }
    
    /**
     * @dev Mint a certificate nft and make sure it is seamless 
     * @param tokenURI The metadata URI for the certificate
     */
    function mintCertificate(string memory tokenURI) external payable nonReentrant {
        require(!hasMinted[msg.sender], "Already minted certificate");
        require(bytes(tokenURI).length > 0, "Token URI cannot be empty");
        require(msg.value >= MINT_PRICE, "Insufficient payment");
        
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
        emit NFTMinted(msg.sender, tokenId, tokenURI);
        
        // Refund excess payment
        if (msg.value > MINT_PRICE) {
            uint256 refund = msg.value - MINT_PRICE;
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
    
    /**
     * @dev Override to prevent transfers (soulbound)
     */
    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);
        
        // Allow minting (from == address(0))
        // Block all transfers (from != address(0) && to != address(0))
        if (from != address(0) && to != address(0)) {
            revert("Certificate NFTs are non-transferable");
        }
        
        return super._update(to, tokenId, auth);
    }
}
