# TripleTokenRewardsClaim Contract Deployment Guide

This contract manages daily reward claims for BETR, NOICE, and DEGEN tokens on Base chain.

## Contract Details

**Contract Name:** `TripleTokenRewardsClaim.sol`
**Network:** Base Mainnet
**Token Standards:** ERC20

## Constructor Parameters

When deploying, you'll need to provide:

```solidity
constructor(
    address _betrToken,           // BETR token contract address
    uint256 _betrRewardRate,      // 1000 (per 1000 points)
    address _noiceToken,          // NOICE token contract address
    uint256 _noiceRewardRate,     // 50 (per 1000 points)
    address _degenToken,          // DEGEN token contract address
    uint256 _degenRewardRate,     // 1 (per 1000 points)
    address _backendSigner        // Backend wallet that signs claim requests
)
```

## Deployment Steps

### 1. Get Token Addresses on Base

Find the deployed ERC20 contract addresses for:
- **BETR Token:** `0x[BETR_ADDRESS]`
- **NOICE Token:** `0x[NOICE_ADDRESS]`
- **DEGEN Token:** `0x532f27101965dd16442E59d40670FaF5eBB142E4` (Known DEGEN address on Base)

### 2. Set Reward Rates

The reward rates are already defined:
- **BETR:** 1000 tokens per 1000 points = `1000000000000000000000` (1000 * 10^18 if 18 decimals)
- **NOICE:** 50 tokens per 1000 points = `50000000000000000000` (50 * 10^18 if 18 decimals)
- **DEGEN:** 1 token per 1000 points = `1000000000000000000` (1 * 10^18 if 18 decimals)

**Note:** Adjust based on actual token decimals!

### 3. Backend Signer

Use the same backend signer address from your existing rewards contracts.

### 4. Deploy Command (Example using Hardhat)

```bash
npx hardhat run scripts/deploy-triple-token-rewards.js --network base
```

### 5. Example Deployment Script

```javascript
const hre = require("hardhat");

async function main() {
  const TripleTokenRewardsClaim = await hre.ethers.getContractFactory("TripleTokenRewardsClaim");
  
  const contract = await TripleTokenRewardsClaim.deploy(
    "0x[BETR_ADDRESS]",           // BETR token address
    "1000000000000000000000",     // 1000 BETR per 1000 points
    "0x[NOICE_ADDRESS]",          // NOICE token address
    "50000000000000000000",       // 50 NOICE per 1000 points
    "0x532f27101965dd16442E59d40670FaF5eBB142E4", // DEGEN token address
    "1000000000000000000",        // 1 DEGEN per 1000 points
    "0x[BACKEND_SIGNER_ADDRESS]"  // Your backend signer
  );

  await contract.deployed();

  console.log("TripleTokenRewardsClaim deployed to:", contract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

## Post-Deployment

### 1. Fund the Contract

Transfer tokens to the contract:
```javascript
// Example for BETR
await betrToken.transfer(contractAddress, ethers.utils.parseEther("1000000"));

// Example for NOICE
await noiceToken.transfer(contractAddress, ethers.utils.parseEther("50000"));

// Example for DEGEN
await degenToken.transfer(contractAddress, ethers.utils.parseEther("10000"));
```

### 2. Update Frontend

Add the deployed contract address to `src/config/wagmi.ts`:

```typescript
export const TRIPLE_TOKEN_REWARDS_ADDRESS = "0x[DEPLOYED_CONTRACT_ADDRESS]";
```

### 3. Verify on BaseScan

```bash
npx hardhat verify --network base [CONTRACT_ADDRESS] \
  [BETR_ADDRESS] 1000000000000000000000 \
  [NOICE_ADDRESS] 50000000000000000000 \
  0x532f27101965dd16442E59d40670FaF5eBB142E4 1000000000000000000 \
  [BACKEND_SIGNER_ADDRESS]
```

## Admin Functions

### Update Token Configuration
```solidity
setTokenConfig(
    string memory tokenSymbol,    // "BETR", "NOICE", or "DEGEN"
    address tokenAddress,         // Token contract address
    uint256 rewardRate,          // Reward per 1000 points
    bool isActive                // Enable/disable token
)
```

### Update Backend Signer
```solidity
setBackendSigner(address _newSigner)
```

### Withdraw Tokens
```solidity
withdrawTokens(
    string memory tokenSymbol,   // Token to withdraw
    address to,                  // Recipient address
    uint256 amount              // Amount to withdraw
)
```

### Check Balances
```solidity
getContractBalance(string memory tokenSymbol) // Returns token balance
```

## User Functions

### Claim Rewards
```solidity
claimReward(
    string memory tokenSymbol,   // "BETR", "NOICE", or "DEGEN"
    uint256 userPoints,         // User's total points
    bytes memory signature      // Backend signature
)
```

### Check Eligibility
```solidity
canClaimToday(address user, string memory tokenSymbol) // Returns bool
```

### Calculate Rewards
```solidity
calculateReward(string memory tokenSymbol, uint256 userPoints) // Returns amount
```

### Time Until Next Claim
```solidity
getTimeUntilNextClaim(address user, string memory tokenSymbol) // Returns seconds
```

## Security Notes

1. **Backend Signature:** Each claim requires a valid signature from the backend signer
2. **Daily Limit:** Users can only claim once per 24 hours per token
3. **Minimum Points:** Users need at least 1000 points to claim
4. **Reentrancy Protection:** Contract uses ReentrancyGuard
5. **Owner Controls:** Only owner can update configurations and withdraw tokens

## Integration with Backend

The backend needs to generate signatures for claims:

```javascript
const ethers = require('ethers');

async function generateClaimSignature(userAddress, tokenSymbol, userPoints, privateKey) {
  const wallet = new ethers.Wallet(privateKey);
  
  const messageHash = ethers.utils.solidityKeccak256(
    ['address', 'string', 'uint256'],
    [userAddress, tokenSymbol, userPoints]
  );
  
  const signature = await wallet.signMessage(ethers.utils.arrayify(messageHash));
  return signature;
}
```

## Testing Checklist

- [ ] Deploy contract with correct parameters
- [ ] Fund contract with all three tokens
- [ ] Test BETR claims
- [ ] Test NOICE claims
- [ ] Test DEGEN claims
- [ ] Verify 24-hour cooldown works
- [ ] Test admin functions (owner only)
- [ ] Verify signature validation
- [ ] Check balance views
- [ ] Verify on block explorer
