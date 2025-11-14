# UniqueHub Avatar NFT Minting Contract

## Overview
This smart contract allows users to mint their unique avatar NFTs for 0.2 USDC. Each user can only mint one NFT, ensuring exclusivity.

## Contract Details

### Key Features
- **Price**: 0.2 USDC per mint
- **Limit**: One NFT per wallet address
- **Payment Token**: USDC (Base network)
- **Standard**: ERC-721 (NFT)

### Main Functions

#### `mintAvatar(string memory tokenURI)`
Allows a user to mint their unique avatar NFT.

**Requirements:**
- User must not have previously minted
- User must have at least 0.2 USDC balance
- User must have approved the contract to spend 0.2 USDC
- Token URI must not be empty

**Process:**
1. Validates user hasn't minted before
2. Checks USDC balance and allowance
3. Transfers 0.2 USDC from user to treasury
4. Mints NFT with provided metadata URI
5. Records minting status and token ID

#### `hasUserMinted(address user)`
Returns whether a user has already minted their avatar.

#### `getUserTokenId(address user)`
Returns the token ID owned by a specific user (0 if not minted).

#### `totalMinted()`
Returns the total number of avatars minted.

### Admin Functions (Owner Only)

#### `updateTreasury(address newTreasury)`
Updates the treasury address that receives USDC payments.

#### `updateUSDCAddress(address newUSDC)`
Updates the USDC token contract address.

## Deployment Instructions

### Prerequisites
1. USDC token address on Base network: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
2. Treasury wallet address for receiving payments
3. Solidity compiler version: ^0.8.20
4. OpenZeppelin contracts: ^5.0.0

### Deployment Steps

1. **Install Dependencies**
```bash
npm install @openzeppelin/contracts
```

2. **Compile Contract**
```bash
npx hardhat compile
```

3. **Deploy Contract**

Example deployment script:
```javascript
const { ethers } = require("hardhat");

async function main() {
  const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // Base mainnet USDC
  const TREASURY_ADDRESS = "YOUR_TREASURY_ADDRESS";

  const UniqueNFTMint = await ethers.getContractFactory("UniqueNFTMint");
  const contract = await UniqueNFTMint.deploy(USDC_ADDRESS, TREASURY_ADDRESS);

  await contract.waitForDeployment();
  
  console.log("UniqueNFTMint deployed to:", await contract.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

4. **Verify Contract**
```bash
npx hardhat verify --network base <CONTRACT_ADDRESS> <USDC_ADDRESS> <TREASURY_ADDRESS>
```

## User Flow

### Minting Process
1. User generates their unique avatar on the frontend
2. Image and metadata are uploaded to IPFS/storage
3. User approves contract to spend 0.2 USDC:
   ```javascript
   await usdcContract.approve(nftContractAddress, 200000); // 0.2 USDC (6 decimals)
   ```
4. User calls `mintAvatar` with the metadata URI:
   ```javascript
   await nftContract.mintAvatar(tokenURI);
   ```
5. NFT is minted and 0.2 USDC is transferred to treasury

### Frontend Integration Example

```javascript
import { ethers } from 'ethers';

// USDC Contract ABI (approve function)
const USDC_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)"
];

// NFT Contract ABI
const NFT_ABI = [
  "function mintAvatar(string tokenURI) external",
  "function hasUserMinted(address user) view returns (bool)",
  "function MINT_PRICE() view returns (uint256)"
];

async function mintNFT(provider, userAddress, tokenURI) {
  const signer = provider.getSigner();
  
  const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
  const NFT_CONTRACT_ADDRESS = "YOUR_DEPLOYED_CONTRACT_ADDRESS";
  const MINT_PRICE = 200000; // 0.2 USDC
  
  // 1. Check if user already minted
  const nftContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, signer);
  const hasMinted = await nftContract.hasUserMinted(userAddress);
  
  if (hasMinted) {
    throw new Error("You have already minted your unique avatar");
  }
  
  // 2. Approve USDC spending
  const usdcContract = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);
  const approveTx = await usdcContract.approve(NFT_CONTRACT_ADDRESS, MINT_PRICE);
  await approveTx.wait();
  
  // 3. Mint NFT
  const mintTx = await nftContract.mintAvatar(tokenURI);
  const receipt = await mintTx.wait();
  
  return receipt;
}
```

## Security Considerations

1. **One Mint Per User**: The contract enforces one mint per address using `hasMinted` mapping
2. **Payment Safety**: Uses OpenZeppelin's IERC20 interface for safe token transfers
3. **Reentrancy Protection**: Uses checks-effects-interactions pattern
4. **Access Control**: Owner-only functions for updating critical parameters
5. **Input Validation**: All inputs are validated before processing

## Base Network Information

- **Network**: Base Mainnet
- **Chain ID**: 8453
- **USDC Address**: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
- **RPC URL**: https://mainnet.base.org
- **Block Explorer**: https://basescan.org

## Contract Events

```solidity
event NFTMinted(address indexed minter, uint256 indexed tokenId, string tokenURI);
event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
event USDCAddressUpdated(address indexed oldUSDC, address indexed newUSDC);
```

## Testing

Before deploying to mainnet, thoroughly test on Base Sepolia testnet:
- **Base Sepolia Chain ID**: 84532
- **Base Sepolia RPC**: https://sepolia.base.org
- **Base Sepolia USDC**: Use a testnet USDC contract or deploy your own

## Support

For issues or questions:
- Review the contract code in `contracts/UniqueNFTMint.sol`
- Check Base network documentation: https://docs.base.org
- OpenZeppelin documentation: https://docs.openzeppelin.com
