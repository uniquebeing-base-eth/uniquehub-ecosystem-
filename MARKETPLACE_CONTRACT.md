# UniqueHub Marketplace Contract

## MarketplaceContract.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title MarketplaceContract
 * @notice Handles item listings only - purchases are done off-platform
 * @dev Users pay 0.1 USDC to list items
 */
contract MarketplaceContract is Ownable, ReentrancyGuard {
    // Base USDC token address on Base mainnet
    IERC20 public constant USDC = IERC20(0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913);
    
    // Listing fee constant
    uint256 public constant LISTING_FEE = 100000; // 0.1 USDC (6 decimals)
    
    struct Listing {
        address seller;
        string itemId; // Off-chain item ID reference
        string title;
        string description;
        uint256 priceUSDC; // Suggested price (informational only)
        bool isActive;
        uint256 listedAt;
    }
    
    // Mapping from item ID to Listing details
    mapping(string => Listing) public listings;
    
    // Array to track all listing IDs
    string[] public listingIds;
    
    // Mapping to get listings by seller
    mapping(address => string[]) public sellerListings;
    
    // Events
    event ItemListed(
        string indexed itemId, 
        address indexed seller, 
        string title, 
        uint256 priceUSDC,
        uint256 timestamp
    );
    event ItemDelisted(string indexed itemId, address indexed seller, uint256 timestamp);
    event FundsWithdrawn(address indexed owner, uint256 amount);
    
    /**
     * @notice List a new marketplace item (requires 0.1 USDC fee)
     * @param itemId Unique item identifier
     * @param title Item title
     * @param description Item description
     * @param priceUSDC Suggested price in USDC (informational only)
     */
    function listItem(
        string memory itemId,
        string memory title,
        string memory description,
        uint256 priceUSDC
    ) external nonReentrant {
        require(bytes(itemId).length > 0, "Invalid item ID");
        require(bytes(title).length > 0, "Title required");
        require(!listings[itemId].isActive, "Item already listed");
        require(priceUSDC > 0, "Price must be greater than 0");
        
        // Charge listing fee
        require(
            USDC.transferFrom(msg.sender, address(this), LISTING_FEE),
            "Listing fee payment failed"
        );
        
        // Create listing
        listings[itemId] = Listing({
            seller: msg.sender,
            itemId: itemId,
            title: title,
            description: description,
            priceUSDC: priceUSDC,
            isActive: true,
            listedAt: block.timestamp
        });
        
        // Track listing
        listingIds.push(itemId);
        sellerListings[msg.sender].push(itemId);
        
        emit ItemListed(itemId, msg.sender, title, priceUSDC, block.timestamp);
    }
    
    /**
     * @notice Delist an item (seller only)
     * @param itemId Item identifier
     */
    function delistItem(string memory itemId) external nonReentrant {
        Listing storage listing = listings[itemId];
        require(listing.isActive, "Item not active");
        require(listing.seller == msg.sender, "Only seller can delist");
        
        listing.isActive = false;
        
        emit ItemDelisted(itemId, msg.sender, block.timestamp);
    }
    
    /**
     * @notice Update item details (seller only)
     * @param itemId Item identifier
     * @param title New title
     * @param description New description
     * @param priceUSDC New suggested price
     */
    function updateListing(
        string memory itemId,
        string memory title,
        string memory description,
        uint256 priceUSDC
    ) external {
        Listing storage listing = listings[itemId];
        require(listing.isActive, "Item not active");
        require(listing.seller == msg.sender, "Only seller can update");
        require(bytes(title).length > 0, "Title required");
        require(priceUSDC > 0, "Price must be greater than 0");
        
        listing.title = title;
        listing.description = description;
        listing.priceUSDC = priceUSDC;
    }
    
    /**
     * @notice Get listing details
     * @param itemId Item identifier
     */
    function getListing(string memory itemId) external view returns (Listing memory) {
        return listings[itemId];
    }
    
    /**
     * @notice Get all active listings count
     */
    function getActiveListingsCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < listingIds.length; i++) {
            if (listings[listingIds[i]].isActive) {
                count++;
            }
        }
        return count;
    }
    
    /**
     * @notice Get seller's listings
     * @param seller Seller address
     */
    function getSellerListings(address seller) external view returns (string[] memory) {
        return sellerListings[seller];
    }
    
    /**
     * @notice Get total listings count
     */
    function getTotalListingsCount() external view returns (uint256) {
        return listingIds.length;
    }
    
    /**
     * @notice Owner withdraws collected USDC
     */
    function withdrawFunds() external onlyOwner nonReentrant {
        uint256 balance = USDC.balanceOf(address(this));
        require(balance > 0, "No funds to withdraw");
        
        require(USDC.transfer(owner(), balance), "Withdrawal failed");
        
        emit FundsWithdrawn(owner(), balance);
    }
    
    /**
     * @notice Get contract USDC balance
     */
    function getContractBalance() external view returns (uint256) {
        return USDC.balanceOf(address(this));
    }
}
```

## Deployment Instructions

### Prerequisites
```bash
npm install --save-dev hardhat @openzeppelin/contracts
```

### Deployment Script (deploy-marketplace-contract.js)
```javascript
const hre = require("hardhat");

async function main() {
  console.log("Deploying MarketplaceContract...");
  
  const MarketplaceContract = await hre.ethers.getContractFactory("MarketplaceContract");
  const marketplaceContract = await MarketplaceContract.deploy();
  
  await marketplaceContract.deployed();
  
  console.log("MarketplaceContract deployed to:", marketplaceContract.address);
  console.log("\nVerify with:");
  console.log(`npx hardhat verify --network base ${marketplaceContract.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### Hardhat Config
```javascript
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    base: {
      url: "https://mainnet.base.org",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 8453
    }
  },
  etherscan: {
    apiKey: {
      base: process.env.BASESCAN_API_KEY
    }
  }
};
```

## Contract Addresses (Update After Deployment)

- **Base Mainnet**: `[DEPLOY_AND_UPDATE_HERE]`
- **USDC Token**: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`

## Usage Examples

### List an Item
```javascript
// Approve USDC for listing fee
await usdc.approve(marketplaceContract.address, "100000"); // 0.1 USDC

// List item
await marketplaceContract.listItem(
  "item-123",
  "Limited Edition NFT",
  "Rare collectible from 2024 collection",
  "50000000" // 50 USDC suggested price
);
```

### Update a Listing
```javascript
await marketplaceContract.updateListing(
  "item-123",
  "Limited Edition NFT - UPDATED",
  "Updated description with more details",
  "45000000" // 45 USDC new price
);
```

### Delist an Item
```javascript
await marketplaceContract.delistItem("item-123");
```

### View Listing
```javascript
const listing = await marketplaceContract.getListing("item-123");
console.log(listing);
```

### Get Seller's Listings
```javascript
const sellerListings = await marketplaceContract.getSellerListings(sellerAddress);
console.log(sellerListings);
```

### Owner Withdraws Funds
```javascript
await marketplaceContract.withdrawFunds();
```

## Important Notes

1. **Listings Only**: This contract ONLY handles item listings. All purchases and payments are handled off-platform between buyers and sellers.

2. **Listing Fee**: Every listing requires 0.1 USDC paid to the contract.

3. **Price is Informational**: The `priceUSDC` field is just a suggested price for reference. Actual prices are negotiated privately.

4. **Off-Chain Data**: Store detailed item information (images, metadata, etc.) off-chain and reference them by `itemId`.

5. **Withdrawal**: Only the contract owner can withdraw accumulated listing fees.

## Integration with Backend

After deployment, update your Supabase edge functions and database:

1. Store contract address in `app_config` table
2. Listen for `ItemListed` events to sync with database
3. Update item status when `ItemDelisted` events are emitted
4. Track total revenue from `FundsWithdrawn` events
