# UniqueHub Smart Contracts - Implementation Guide

## Overview

UniqueHub requires smart contracts deployed on Base L2 for handling:
1. **Upload fees** (0.2 USDC for courses/NFTs)
2. **Transaction fees** (gas goes to treasury, 1% to Base network)
3. **NFT transfers** (ERC-721 and ERC-1155)
4. **Course access** (free courses: $0.001 ETH gas only)
5. **Payment processing** (USDC payments to treasury)

## Current Status

✅ **Implemented:**
- Database structure for tracking transactions
- Edge functions for payment verification
- UP point system (onchain-ready)
- Leaderboard and streak tracking
- UI for purchasing courses and NFTs

⚠️ **Requires External Deployment:**
- Smart contracts (cannot be deployed from Lovable)
- Chainlink oracle integration for ETH/USD prices
- Wallet transaction signing

## Smart Contract Requirements

### 1. Payment Processor Contract

```solidity
// Key features needed:
// - Charge 0.2 USDC upload fee for courses and NFTs
// - Process free courses with $0.001 ETH gas fee only
// - Send all fees to treasury wallet (Base takes 1% automatically)
// - Track UP points for all transactions
// - Emit events for point tracking
```

**Required integrations:**
- Base USDC contract: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- OpenZeppelin ERC20: https://docs.openzeppelin.com/contracts/4.x/api/token/erc20

### 2. NFT Marketplace Contract

```solidity
// Key features needed:
// - List NFTs (ERC-721/ERC-1155) for sale
// - Verify ownership before listing
// - Handle atomic transfers (payment + NFT transfer)
// - Apply fees automatically
// - Support USDC and ETH payments
```

**Required integrations:**
- OpenZeppelin ERC-721: https://docs.openzeppelin.com/contracts/4.x/erc721
- OpenZeppelin ERC-1155: https://docs.openzeppelin.com/contracts/4.x/erc1155
- Base USDC contract address: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`

### 3. Course Access Contract

```solidity
// Key features needed:
// - Grant course access after payment
// - Verify course ownership
// - Emit access events
// - Support content unlocking
```

### 4. UP Token Contract (Future)

```solidity
// For future token airdrop:
// - ERC-20 token for UP points
// - Claimable based on onchain point records
// - Staking and governance features
```

## Configuration

Update these values in the `app_config` table once contracts are deployed:

```sql
UPDATE app_config SET config_value = 'YOUR_TREASURY_WALLET_ADDRESS' 
WHERE config_key = 'treasury_wallet_address';
```

## Integration Steps

1. **Deploy Contracts:**
   - Use Hardhat or Foundry
   - Deploy to Base L2 (chainId: 8453)
   - Verify on BaseScan

2. **Update Edge Functions:**
   - Add contract addresses to environment
   - Integrate with contract ABIs
   - Use viem/ethers for contract interactions

3. **Update Frontend:**
   - Add wallet connection (Neynar Wallet API)
   - Sign transactions for purchases
   - Listen for contract events
   - Update UI after confirmation

4. **Test Flow:**
   ```
   User initiates purchase
   → Frontend calls edge function to create transaction frame
   → User signs transaction via Farcaster wallet
   → Transaction sent to contract
   → Contract applies fees and transfers asset
   → Event emitted
   → Backend listens for event
   → Awards UP points
   → Updates leaderboard
   ```

## Resources

- **Farcaster Wallet Integration:** https://docs.neynar.com/wallets
- **Base Developer Docs:** https://docs.base.org/
- **OpenZeppelin Contracts:** https://docs.openzeppelin.com/contracts/4.x/
- **Seaport Protocol (Reference):** https://docs.opensea.io/v2.0/reference/seaport-overview
- **Reservoir API (Alternative for NFT operations):** https://docs.reservoir.tools/

## Security Considerations

- ✅ Use OpenZeppelin's audited contracts
- ✅ Implement reentrancy guards
- ✅ Set proper access controls (Ownable/AccessControl)
- ✅ Test thoroughly on Base Goerli testnet first
- ✅ Conduct security audit before mainnet deployment

## Treasury Wallet

The treasury wallet address should be:
- A multisig wallet (e.g., Safe/Gnosis)
- Controlled by project owners
- Clearly documented for transparency

## Next Steps

1. Set up development environment for smart contracts
2. Deploy and test contracts on Base Goerli testnet
3. Update edge functions with contract addresses
4. Test full flow end-to-end
5. Deploy to Base mainnet
6. Monitor and iterate based on usage

---

**Note:** The current implementation uses transaction frames and simulated confirmations. Full onchain integration requires the smart contracts described above to be deployed separately.