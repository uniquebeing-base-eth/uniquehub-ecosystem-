# Multi-Chain Rewards Deployment Guide

## Overview

UniqueHub supports token rewards on multiple blockchains. Users earn points through platform activities and can claim tokens on different chains daily.

## Contract Architecture

### Base Chain (EGGS & JESSE Tokens)
- **Contract**: `BaseMultiTokenRewardsClaim.sol`
- **Tokens**: 
  - EGGS: 0.1 tokens per 1000 points
  - JESSE: 0.5 tokens per 1000 points
- **Features**: Multi-token support with independent daily claims per token

### Other Chains (Single Token Per Chain)
- **Contract**: `MultiChainRewardsClaim.sol`
- **Chains**:
  - **Celo**: CELO token (0.02 per 1000 points)
  - **Monad**: MON token (0.1 per 1000 points)
  - **Arbitrum**: ARB token (0.02 per 1000 points)
  - **BNB Chain**: BNB token (0.00001 per 1000 points)

## Deployment Instructions

### 1. Deploy on Base Chain

```solidity
// Deploy BaseMultiTokenRewardsClaim
const contract = await BaseMultiTokenRewardsClaim.deploy(backendSignerAddress);

// Configure EGGS token
await contract.setTokenConfig(
  "EGGS",
  eggsTokenAddress,
  "100000000000000000", // 0.1 EGGS in wei (18 decimals)
  true
);

// Configure JESSE token
await contract.setTokenConfig(
  "JESSE",
  jesseTokenAddress,
  "500000000000000000", // 0.5 JESSE in wei (18 decimals)
  true
);

// Fund contract with tokens
await eggsToken.transfer(contract.address, eggsAmount);
await jesseToken.transfer(contract.address, jesseAmount);
```

### 2. Deploy on Celo

```solidity
const contract = await MultiChainRewardsClaim.deploy(
  celoTokenAddress,
  "20000000000000000", // 0.02 CELO in wei (18 decimals)
  backendSignerAddress
);

// Fund contract
await celoToken.transfer(contract.address, celoAmount);
```

### 3. Deploy on Monad

```solidity
const contract = await MultiChainRewardsClaim.deploy(
  monTokenAddress,
  "100000000000000000", // 0.1 MON in wei (18 decimals)
  backendSignerAddress
);

// Fund contract
await monToken.transfer(contract.address, monAmount);
```

### 4. Deploy on Arbitrum

```solidity
const contract = await MultiChainRewardsClaim.deploy(
  arbTokenAddress,
  "20000000000000000", // 0.02 ARB in wei (18 decimals)
  backendSignerAddress
);

// Fund contract
await arbToken.transfer(contract.address, arbAmount);
```

### 5. Deploy on BNB Chain

```solidity
const contract = await MultiChainRewardsClaim.deploy(
  bnbTokenAddress,
  "10000000000", // 0.00001 BNB in wei (18 decimals)
  backendSignerAddress
);

// Fund contract
await bnbToken.transfer(contract.address, bnbAmount);
```

## Backend Integration

### Signature Generation

The backend must sign claim requests to verify user eligibility:

```javascript
import { ethers } from 'ethers';

async function generateClaimSignature(
  userAddress: string,
  tokenId: string, // For Base: "EGGS" or "JESSE", for others: not used
  userPoints: number,
  privateKey: string
) {
  const wallet = new ethers.Wallet(privateKey);
  
  // For Base chain (multi-token)
  const messageHash = ethers.solidityPackedKeccak256(
    ['address', 'string', 'uint256'],
    [userAddress, tokenId, userPoints]
  );
  
  // For other chains (single token)
  // const messageHash = ethers.solidityPackedKeccak256(
  //   ['address', 'uint256'],
  //   [userAddress, userPoints]
  // );
  
  const signature = await wallet.signMessage(ethers.getBytes(messageHash));
  return signature;
}
```

### Claim Verification

Before allowing a claim:
1. Check user has enough points (minimum 1000)
2. Check user hasn't claimed in the last 24 hours
3. Generate signature
4. Return signature to frontend

### Database Tracking

Track claims in the `multichain_claims` table:

```sql
-- Record successful claim
INSERT INTO multichain_claims (
  user_id,
  chain_id,
  amount,
  transaction_hash
) VALUES (
  $1, -- user_id
  $2, -- 'eggs', 'jesse', 'celo', 'monad', 'arbitrum', 'bnb'
  $3, -- amount claimed
  $4  -- transaction hash from blockchain
);
```

## Frontend Integration

### Claiming Rewards (Base Chain - EGGS/JESSE)

```typescript
import { ethers } from 'ethers';

async function claimBaseReward(
  contractAddress: string,
  tokenId: 'EGGS' | 'JESSE',
  userPoints: number,
  signature: string
) {
  const contract = new ethers.Contract(
    contractAddress,
    BaseMultiTokenRewardsClaimABI,
    signer
  );
  
  const tx = await contract.claimReward(tokenId, userPoints, signature);
  await tx.wait();
  
  return tx.hash;
}
```

### Claiming Rewards (Other Chains)

```typescript
async function claimReward(
  contractAddress: string,
  userPoints: number,
  signature: string
) {
  const contract = new ethers.Contract(
    contractAddress,
    MultiChainRewardsClaimABI,
    signer
  );
  
  const tx = await contract.claimReward(userPoints, signature);
  await tx.wait();
  
  return tx.hash;
}
```

## Token Addresses (Example - Update with Actual Addresses)

After deployment, update these addresses in your configuration:

```typescript
export const REWARD_CONTRACTS = {
  base: {
    address: '0x...', // BaseMultiTokenRewardsClaim
    tokens: {
      EGGS: '0x...', // EGGS token address
      JESSE: '0x...', // JESSE token address
    }
  },
  celo: {
    address: '0x...', // MultiChainRewardsClaim on Celo
    token: '0x...' // CELO token address
  },
  monad: {
    address: '0x...', // MultiChainRewardsClaim on Monad
    token: '0x...' // MON token address
  },
  arbitrum: {
    address: '0x...', // MultiChainRewardsClaim on Arbitrum
    token: '0x...' // ARB token address
  },
  bnb: {
    address: '0x...', // MultiChainRewardsClaim on BNB
    token: '0x...' // BNB token address
  }
};
```

## Security Considerations

1. **Backend Signer**: Keep the private key secure, never expose it
2. **Contract Funding**: Regularly monitor contract balances
3. **Rate Limiting**: Implement backend rate limiting for signature requests
4. **User Verification**: Always verify user points from database before signing
5. **Transaction Monitoring**: Monitor all claim transactions for anomalies

## Testing Checklist

- [ ] Deploy contracts on testnets first
- [ ] Test signature generation and verification
- [ ] Test 24-hour claim cooldown
- [ ] Test with different point amounts
- [ ] Test multi-token claims on Base
- [ ] Test withdrawal functions
- [ ] Verify contract balances
- [ ] Test edge cases (0 points, exactly 1000 points)
- [ ] Load test signature generation
- [ ] Monitor gas costs

## Maintenance

### Updating Reward Rates

```solidity
// For single-token contracts
await contract.setRewardRate(newRate);

// For Base multi-token contract
await contract.setTokenConfig(
  tokenId,
  tokenAddress,
  newRate,
  true
);
```

### Withdrawing Funds

```solidity
// Emergency withdrawal
await contract.withdrawTokens(recipientAddress, amount);
```

### Updating Backend Signer

```solidity
await contract.setBackendSigner(newSignerAddress);
```
