# Multi-Chain Rewards Claim Deployment Guide

This guide covers deploying the rewards claim contracts across all supported chains.

## Overview

The rewards system allows users to claim daily token rewards based on their UniqueHub points. Users need at least 1,000 points to claim, and can claim once per 24 hours on each chain.

## Supported Chains

- **Celo** - Native CELO token rewards
- **Monad** - Native MONAD token rewards  
- **Arbitrum** - Native ARB token rewards
- **BNB Chain** - Native BNB token rewards
- **Solana** - Native SOL rewards via SPL tokens

## EVM Chains (Celo, Monad, Arbitrum, BNB)

All EVM chains use the same `MultiChainRewardsClaim.sol` contract.

### Contract: `MultiChainRewardsClaim.sol`

Located at: `contracts/MultiChainRewardsClaim.sol`

### Constructor Parameters

```solidity
constructor(
    address _rewardToken,           // ERC20 token address for rewards
    uint256 _rewardRatePerThousandPoints,  // Reward amount per 1000 points
    address _backendSigner          // Backend wallet for signature verification
)
```

### Deployment Steps (EVM)

1. **Prepare Constructor Parameters**

   For each chain, you'll need:
   - Reward token address (native token wrapper)
   - Reward rate (in smallest unit, e.g., wei)
   - Backend signer address (your server wallet)

2. **Deploy Contract**

   Using Hardhat:
   ```bash
   npx hardhat run scripts/deploy-rewards-claim.js --network [celo|monad|arbitrum|bnb]
   ```

   Using Remix:
   - Compile `MultiChainRewardsClaim.sol`
   - Select the appropriate network in MetaMask
   - Deploy with constructor parameters

3. **Fund Contract**

   Transfer reward tokens to the deployed contract address:
   ```javascript
   // Example: Fund with 10,000 tokens
   await rewardToken.transfer(contractAddress, ethers.parseEther("10000"));
   ```

4. **Verify Contract** (Optional but recommended)
   ```bash
   npx hardhat verify --network [network] [contract_address] [constructor_args]
   ```

### Chain-Specific Configurations

#### Celo
- **Network**: Celo Mainnet
- **RPC**: https://forno.celo.org
- **Chain ID**: 42220
- **Reward Token**: CELO (wrapped)
- **Suggested Rate**: 1 CELO per 1000 points = `1000000000000000000` (1e18 wei)

#### Monad
- **Network**: Monad Mainnet
- **RPC**: TBD (check Monad docs)
- **Chain ID**: TBD
- **Reward Token**: MONAD (wrapped)
- **Suggested Rate**: 1 MONAD per 1000 points

#### Arbitrum
- **Network**: Arbitrum One
- **RPC**: https://arb1.arbitrum.io/rpc
- **Chain ID**: 42161
- **Reward Token**: ARB
- **Token Address**: `0x912CE59144191C1204E64559FE8253a0e49E6548`
- **Suggested Rate**: 0.5 ARB per 1000 points = `500000000000000000` (0.5e18 wei)

#### BNB Chain
- **Network**: BNB Smart Chain
- **RPC**: https://bsc-dataseed.binance.org
- **Chain ID**: 56
- **Reward Token**: BNB (wrapped)
- **Token Address**: `0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c` (WBNB)
- **Suggested Rate**: 0.01 BNB per 1000 points = `10000000000000000` (0.01e18 wei)

## Solana Deployment

### Contract: `multichain_rewards_claim` (Anchor Program)

Located at: `contracts/solana/multichain_rewards_claim/`

### Prerequisites

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest
```

### Build & Deploy

1. **Navigate to Solana program directory**
   ```bash
   cd contracts/solana/multichain_rewards_claim
   ```

2. **Build the program**
   ```bash
   anchor build
   ```

3. **Deploy to devnet (testing)**
   ```bash
   anchor deploy --provider.cluster devnet
   ```

4. **Deploy to mainnet**
   ```bash
   anchor deploy --provider.cluster mainnet
   ```

5. **Initialize the program**
   ```typescript
   import * as anchor from "@coral-xyz/anchor";
   
   const program = anchor.workspace.MultichainRewardsClaim;
   const rewardTokenMint = new PublicKey("YOUR_SPL_TOKEN_MINT");
   const backendSigner = new PublicKey("YOUR_BACKEND_SIGNER");
   
   await program.methods
     .initialize(
       new anchor.BN(1_000_000_000), // 1 token per 1000 points (adjust decimals)
       backendSigner
     )
     .accounts({
       config: configPDA,
       authority: wallet.publicKey,
       rewardTokenMint: rewardTokenMint,
       systemProgram: SystemProgram.programId,
     })
     .rpc();
   ```

### Solana Configuration

- **Network**: Solana Mainnet Beta
- **RPC**: https://api.mainnet-beta.solana.com
- **Reward Token**: SOL or custom SPL token
- **Suggested Rate**: 0.1 SOL per 1000 points = `100000000` (0.1 * 1e9 lamports)

## Backend Integration

After deploying contracts, update your backend with:

1. **Contract Addresses**
   ```json
   {
     "celo": "0x...",
     "monad": "0x...",
     "arbitrum": "0x...",
     "bnb": "0x...",
     "solana": "PROGRAM_ID..."
   }
   ```

2. **Create Signature Service**

   The backend must sign claim requests:
   
   ```typescript
   // EVM chains (Celo, Monad, Arbitrum, BNB)
   const messageHash = ethers.solidityPackedKeccak256(
     ["address", "uint256"],
     [userAddress, userPoints]
   );
   const signature = await backendWallet.signMessage(ethers.getBytes(messageHash));
   ```

   ```typescript
   // Solana
   const message = Buffer.concat([
     userPubkey.toBuffer(),
     new anchor.BN(userPoints).toArrayLike(Buffer, "le", 8),
   ]);
   const signature = await backendKeypair.sign(message);
   ```

3. **Create Edge Function for Claims**

   Create `supabase/functions/claim-multichain-reward/index.ts`:
   - Verify user authentication
   - Check user points from database
   - Verify 24hr cooldown per chain
   - Generate signature
   - Return signature + claim data

## Security Checklist

- [ ] Backend signer private key stored securely (use Secrets Manager)
- [ ] Only authorized backend can generate signatures
- [ ] Contract funded with sufficient tokens
- [ ] Reward rates configured appropriately
- [ ] Test claims on testnet before mainnet
- [ ] Implement rate limiting on backend
- [ ] Monitor contract balances
- [ ] Set up alerts for low balances

## Admin Functions

### Update Reward Rate
```solidity
// EVM
await contract.setRewardRate(newRate);
```

```rust
// Solana
await program.methods.updateRewardRate(new BN(newRate)).rpc();
```

### Withdraw Tokens
```solidity
// EVM
await contract.withdrawTokens(recipientAddress, amount);
```

```rust
// Solana
await program.methods.withdrawTokens(new BN(amount)).rpc();
```

### Update Backend Signer
```solidity
// EVM
await contract.setBackendSigner(newSignerAddress);
```

```rust
// Solana
await program.methods.updateBackendSigner(newSigner).rpc();
```

## Monitoring

Track these metrics for each chain:
- Total claims per day
- Average claim amount
- Contract token balance
- Failed claim attempts
- Gas costs
- User distribution across chains

## Support

For issues or questions:
- EVM contracts: Review `contracts/MultiChainRewardsClaim.sol`
- Solana program: Review `contracts/solana/multichain_rewards_claim/src/lib.rs`
- Deployment guide: This file
