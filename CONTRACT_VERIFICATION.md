# Contract Verification Guide

## Why Are Users Seeing "Fraudulent Token" Warnings?

When users mint NFTs or certificates, some wallets (Base Wallet, Farcaster) show security warnings like:
- "Fraudulent token detected"
- "High risk transaction"
- "A malicious token is transferred in the transaction"

**This is a FALSE POSITIVE.** Your contracts are legitimate and use the official Base mainnet USDC.

## Root Causes

### 1. Unverified Contracts
The most common reason for these warnings is that your smart contracts are **not verified on BaseScan**.

Wallet security scanners automatically flag unverified contracts as potentially malicious because they cannot inspect the source code.

### 2. New Contract Reputation
Even legitimate contracts may be flagged initially until they:
- Get verified on BaseScan
- Build transaction history
- Gain trust scores from security services

## Contract Addresses (Base Mainnet)

All contracts are deployed on **Base Mainnet** and use the **official USDC token**:

```
USDC Token: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 (Official Base USDC)
UniqueHub Avatar NFT: 0xA4a6AEC95Ffee4F0d2551dC12B63F3ebf45097c7
Certificate NFT: 0x3b224A9254ebdB475CDbC12693a1F33Db9E12105
Course Contract: 0x237b0cdC89A75B329f1b650D844F20497698a48A
Marketplace Contract: 0x08A8A1E3E9E74005f764f449C62FCEdC5f3E9421
```

## Solution: Verify Your Contracts

### Step 1: Prepare Your Source Code

For each contract, you need:
1. The Solidity source code (`.sol` file)
2. The exact compiler version used
3. Constructor arguments used during deployment
4. All imported dependencies (OpenZeppelin, etc.)

### Step 2: Verify on BaseScan

1. **Go to BaseScan** (https://basescan.org)

2. **Navigate to your contract:**
   - Search for your contract address
   - Click on the "Contract" tab
   - Click "Verify and Publish"

3. **Enter verification details:**
   - **Compiler Type:** Select "Solidity (Single file)" or "Solidity (Standard-Json-Input)"
   - **Compiler Version:** Match the version in your contract (e.g., `v0.8.20+commit.a1b79de6`)
   - **Open Source License Type:** Select "MIT License"

4. **Enter the Solidity Contract Code:**
   - If using "Single file", flatten your contract (combine all imports into one file)
   - If using "Standard-Json-Input", upload your entire project structure

5. **Constructor Arguments (if any):**
   - For `UniqueNFTMint`: Encode the USDC address and treasury address
   - For `CertificateNFT`: No constructor arguments needed (only msg.sender)
   - For `CourseContract`: Encode USDC address and fee parameters
   - For `MarketplaceContract`: Encode USDC address and fee parameters

6. **Optimization:** Select "Yes" if you enabled optimization during deployment (check your deployment settings)

### Step 3: Verify All Contracts

Repeat the process for all contracts:
- ✅ UniqueNFTMint (`0xA4a6AEC95Ffee4F0d2551dC12B63F3ebf45097c7`)
- ✅ CertificateNFT (`0x3b224A9254ebdB475CDbC12693a1F33Db9E12105`)
- ✅ CourseContract (`0x237b0cdC89A75B329f1b650D844F20497698a48A`)
- ✅ MarketplaceContract (`0x08A8A1E3E9E74005f764f449C62FCEdC5f3E9421`)

## Using Hardhat for Verification (Recommended)

If you deployed using Hardhat, you can verify programmatically:

```bash
# Install Hardhat Etherscan plugin
npm install --save-dev @nomicfoundation/hardhat-verify

# Add to hardhat.config.js
require("@nomicfoundation/hardhat-verify");

module.exports = {
  networks: {
    base: {
      url: "https://mainnet.base.org",
      accounts: [process.env.PRIVATE_KEY]
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

# Verify contracts
npx hardhat verify --network base 0xA4a6AEC95Ffee4F0d2551dC12B63F3ebf45097c7 "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" "0xYourTreasuryAddress"
npx hardhat verify --network base 0x3b224A9254ebdB475CDbC12693a1F33Db9E12105
npx hardhat verify --network base 0x237b0cdC89A75B329f1b650D844F20497698a48A "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
npx hardhat verify --network base 0x08A8A1E3E9E74005f764f449C62FCEdC5f3E9421 "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
```

## Expected Results After Verification

Once verified:
- ✅ Source code visible on BaseScan
- ✅ Contract marked with green checkmark ✓
- ✅ Security scanners stop flagging transactions
- ✅ Users can read contract functions on BaseScan
- ✅ Increased trust and transparency

## Temporary Workaround

Until contracts are verified, inform users:
1. **The warning is expected for new contracts**
2. **Transactions are safe** - contracts use official USDC
3. **Users can verify contract addresses** on BaseScan
4. **Users can proceed with "Continue anyway"** or "Allow and continue"

## Additional Security Measures

1. **Get contracts audited** - Hire a security firm (CertiK, OpenZeppelin, etc.)
2. **Add contract documentation** - Include inline comments and NatSpec
3. **Build reputation gradually** - More transactions = more trust
4. **Apply for token/contract whitelists** - Contact wallet providers

## Resources

- BaseScan Contract Verification: https://docs.basescan.org/verifying-contracts
- Hardhat Verification Plugin: https://hardhat.org/hardhat-runner/plugins/nomicfoundation-hardhat-verify
- OpenZeppelin Contract Security: https://docs.openzeppelin.com/contracts/5.x/
- Base Network Documentation: https://docs.base.org/

## Still Getting Warnings After Verification?

If warnings persist after verification:
1. Wait 24-48 hours for security scanners to update
2. Contact wallet provider support to whitelist your contracts
3. Build transaction volume to improve trust scores
4. Consider getting a security audit badge
