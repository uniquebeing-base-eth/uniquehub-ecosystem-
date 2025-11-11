// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title MarketplaceContract
 * @notice Handles marketplace item listings (purchases are off-platform)
 * @dev Only manages listings, not transactions
 */
contract MarketplaceContract is Ownable, ReentrancyGuard {
    // Base USDC token address on Base mainnet
    IERC20 public constant USDC = IERC20(0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913);
    
    // Listing fee constant
    uint256 public constant LISTING_FEE = 100000; // 0.1 USDC (6 decimals)
    
    constructor() Ownable(msg.sender) {
        // msg.sender is automatically set as the owner
    }
    
    struct MarketItem {
        address seller;
        string itemId; // Off-chain item ID reference
        string title;
        string description;
        uint256 priceUSDC; // Suggested price in USDC (for display only)
        bool isActive;
        uint256 listedAt;
    }
    
    // Mapping from item ID to MarketItem details
    mapping(string => MarketItem) public items;
    
    // Array to track all listed item IDs
    string[] public itemIds;
    
    // Events
    event ItemListed(
        string indexed itemId,
        address indexed seller,
        string title,
        uint256 priceUSDC,
        uint256 timestamp
    );
    event ItemDelisted(string indexed itemId, address indexed seller, uint256 timestamp);
    event FundsWithdrawn(address indexed owner, uint256 amount, uint256 timestamp);
    
    /**
     * @notice List a new marketplace item
     * @param itemId Unique item identifier
     * @param title Item title
     * @param description Item description
     * @param priceUSDC Suggested price in USDC (for display only)
     */
    function listItem(
        string memory itemId,
        string memory title,
        string memory description,
        uint256 priceUSDC
    ) external nonReentrant {
        require(bytes(itemId).length > 0, "Invalid item ID");
        require(bytes(title).length > 0, "Title required");
        require(!items[itemId].isActive, "Item already listed");
        require(priceUSDC > 0, "Price must be greater than 0");
        
        // Charge listing fee
        require(
            USDC.transferFrom(msg.sender, address(this), LISTING_FEE),
            "Listing fee payment failed"
        );
        
        items[itemId] = MarketItem({
            seller: msg.sender,
            itemId: itemId,
            title: title,
            description: description,
            priceUSDC: priceUSDC,
            isActive: true,
            listedAt: block.timestamp
        });
        
        itemIds.push(itemId);
        
        emit ItemListed(itemId, msg.sender, title, priceUSDC, block.timestamp);
    }
    
    /**
     * @notice Delist an item (seller only)
     * @param itemId Item identifier
     */
    function delistItem(string memory itemId) external {
        MarketItem storage item = items[itemId];
        require(item.seller == msg.sender, "Only seller can delist");
        require(item.isActive, "Item already delisted");
        
        item.isActive = false;
        
        emit ItemDelisted(itemId, msg.sender, block.timestamp);
    }
    
    /**
     * @notice Get item details
     * @param itemId Item identifier
     * @return MarketItem details
     */
    function getItem(string memory itemId) external view returns (MarketItem memory) {
        return items[itemId];
    }
    
    /**
     * @notice Get total number of items listed
     * @return Total item count
     */
    function getTotalItems() external view returns (uint256) {
        return itemIds.length;
    }
    
    /**
     * @notice Get all active items
     * @return Array of active item IDs
     */
    function getActiveItems() external view returns (string[] memory) {
        uint256 activeCount = 0;
        
        // Count active items
        for (uint256 i = 0; i < itemIds.length; i++) {
            if (items[itemIds[i]].isActive) {
                activeCount++;
            }
        }
        
        // Create array of active item IDs
        string[] memory activeItems = new string[](activeCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 0; i < itemIds.length; i++) {
            if (items[itemIds[i]].isActive) {
                activeItems[currentIndex] = itemIds[i];
                currentIndex++;
            }
        }
        
        return activeItems;
    }
    
    /**
     * @notice Owner withdraws collected USDC
     */
    function withdrawFunds() external onlyOwner nonReentrant {
        uint256 balance = USDC.balanceOf(address(this));
        require(balance > 0, "No funds to withdraw");
        
        require(USDC.transfer(owner(), balance), "Withdrawal failed");
        
        emit FundsWithdrawn(owner(), balance, block.timestamp);
    }
}
