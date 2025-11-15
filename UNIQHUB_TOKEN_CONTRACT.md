# UNIQHUB Token Contract

## Overview
This is the ERC-20 token contract for the UniqueHub platform, deployed on Base network.

## Token Details
- **Token Name**: UNIQHUB Token
- **Token Symbol**: UNIQ
- **Decimals**: 18
- **Max Supply**: 100,000,000 UNIQ (100 million)
- **Network**: Base (Mainnet)

## Contract Features
- Standard ERC-20 implementation using OpenZeppelin
- Fixed supply of 100M tokens minted at deployment
- No additional minting capability (supply is capped)
- Ownable for potential future governance
- Fully compatible with DEXs and wallets

## Deployment Instructions

### Prerequisites
```bash
npm install --save-dev hardhat @openzeppelin/contracts
npm install --save-dev @nomicfoundation/hardhat-toolbox
```

### Deployment Script
Create `scripts/deploy-uniqhub-token.js`:

```javascript
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("Deploying UNIQHUB Token with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy the token
  const UNIQHUBToken = await hre.ethers.getContractFactory("UNIQHUBToken");
  const token = await UNIQHUBToken.deploy(deployer.address);
  
  await token.deployed();
  
  console.log("UNIQHUB Token deployed to:", token.address);
  console.log("Total Supply:", await token.totalSupply());
  console.log("Max Supply:", await token.MAX_SUPPLY());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### Deploy to Base Mainnet
```bash
npx hardhat run scripts/deploy-uniqhub-token.js --network base
```

### Verify on BaseScan
```bash
npx hardhat verify --network base <DEPLOYED_CONTRACT_ADDRESS> <DEPLOYER_ADDRESS>
```

## Hardhat Configuration

Add to your `hardhat.config.js`:

```javascript
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.20",
  networks: {
    base: {
      url: "https://mainnet.base.org",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 8453
    },
    baseSepolia: {
      url: "https://sepolia.base.org",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 84532
    }
  },
  etherscan: {
    apiKey: {
      base: process.env.BASESCAN_API_KEY
    },
    customChains: [
      {
        network: "base",
        chainId: 8453,
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://basescan.org"
        }
      }
    ]
  }
};
```

## Usage in Frontend

After deployment, add the contract address to `src/config/wagmi.ts`:

```typescript
export const UNIQHUB_TOKEN_ADDRESS = "0x..." as const; // Add deployed address

export const UNIQHUB_TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)"
] as const;
```

## Token Distribution Recommendations

Since all 100M tokens are minted to the deployer, consider this distribution strategy:

1. **Team & Founders**: 20% (20M UNIQ) - Vested over 2-4 years
2. **Community Rewards**: 30% (30M UNIQ) - Platform incentives, staking
3. **Liquidity Pool**: 20% (20M UNIQ) - DEX liquidity on Base
4. **Treasury**: 15% (15M UNIQ) - Development & operations
5. **Ecosystem Growth**: 10% (10M UNIQ) - Partnerships & grants
6. **Initial Sale/Airdrop**: 5% (5M UNIQ) - Early adopters

## Security Considerations

- ✅ Uses audited OpenZeppelin contracts
- ✅ Fixed supply (no minting function)
- ✅ Standard ERC-20 implementation
- ✅ No complex logic that could introduce vulnerabilities
- ⚠️ Always test on testnet (Base Sepolia) before mainnet deployment
- ⚠️ Keep deployer private key secure
- ⚠️ Consider using a multisig wallet for ownership

## Next Steps

1. Deploy to Base Sepolia testnet first for testing
2. Verify contract on BaseScan
3. Test token transfers and approvals
4. Deploy to Base Mainnet
5. Add liquidity to DEX (e.g., Uniswap V3 on Base)
6. Update frontend with contract address
7. Distribute tokens according to your tokenomics plan
