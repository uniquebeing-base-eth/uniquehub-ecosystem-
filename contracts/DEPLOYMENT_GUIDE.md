# MultiChain Rewards Claim Contract Deployment Guide

## Overview
Deploy the `MultiChainRewardsClaim.sol` contract on each chain with the respective token addresses.

## Reward Rates (in smallest token units)

### Celo (18 decimals)
- Rate: 0.02 CELO per 1000 points
- Constructor param: `20000000000000000` (0.02 * 10^18)

### Monad (18 decimals - assumed)
- Rate: 0.1 MON per 1000 points
- Constructor param: `100000000000000000` (0.1 * 10^18)

### Arbitrum (18 decimals)
- Rate: 0.02 ARB per 1000 points
- Constructor param: `20000000000000000` (0.02 * 10^18)

### BNB Chain (18 decimals)
- Rate: 0.00001 BNB per 1000 points
- Constructor param: `10000000000000` (0.00001 * 10^18)

### Solana (9 decimals)
- Rate: 0.0001 SOL per 1000 points
- Constructor param: `100000` (0.0001 * 10^9)
- **Note**: For Solana, you'll need to create a Solana program using Anchor/Rust instead of this Solidity contract

## Deployment Steps

### 1. Prepare Constructor Parameters
For each chain, you need:
- `_rewardToken`: Token contract address (native token wrapper for native currencies)
- `_rewardRatePerThousandPoints`: From the rates above
- `_backendSigner`: Your backend wallet address that will sign claim approvals

### 2. Deploy Contract
Using Hardhat, Foundry, or your preferred tool:

```bash
# Example with Hardhat
npx hardhat run scripts/deploy.js --network celo
npx hardhat run scripts/deploy.js --network arbitrum
npx hardhat run scripts/deploy.js --network bnb
```

### 3. Fund Contracts
After deployment, send tokens to each contract:
- Transfer reward tokens to the contract address
- Ensure sufficient balance for expected claims

### 4. Verify Contracts
Verify on block explorers:
- Celo: https://celoscan.io/
- Arbitrum: https://arbiscan.io/
- BNB: https://bscscan.com/
- Monad: (Explorer TBD)

## Token Addresses Needed

### Native Token Wrappers
You'll need the wrapped token addresses for native currencies:

- **Celo**: CELO is the native gas token, use its address directly
- **Arbitrum**: wETH or ARB token address
- **BNB Chain**: WBNB address: `0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c`
- **Monad**: (Address TBD - check Monad docs)
- **Solana**: SOL is native, handle in Solana program

## Backend Integration

After deployment, update your backend with:
1. Contract addresses for each chain
2. Backend signer private key (keep secure!)
3. Chain RPC endpoints

## Security Checklist

- [ ] Backend signer private key is secured
- [ ] Contract ownership is transferred to secure multisig (recommended)
- [ ] Test claims on testnet before mainnet
- [ ] Fund contracts with appropriate amounts
- [ ] Set up monitoring for contract balances
- [ ] Verify all contracts on block explorers

## Testing Claims

Before going live:
1. Deploy to testnets first
2. Test claim functionality with test tokens
3. Verify daily claim limits work
4. Test signature verification
5. Check time-based restrictions

## Monitoring

Monitor these metrics:
- Contract token balances
- Total claims per day
- Failed transactions
- Gas costs
- User claim patterns
