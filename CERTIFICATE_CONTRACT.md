# Certificate NFT Contract Documentation

## Overview
The CertificateNFT contract is an ERC-721 NFT contract for issuing non-transferable course completion certificates on UniqueHub.

## Contract Address
**Base Mainnet**: (Deploy and update this)

## Key Features
- ✅ Mints unique NFT certificates for course completion
- ✅ 0.0000001 ETH mint fee per certificate
- ✅ Non-transferable (soulbound) certificates
- ✅ Prevents duplicate certificates per user per course
- ✅ Stores certificate metadata on-chain
- ✅ Verifiable certificate authenticity

## Contract Functions

### User Functions

#### `mintCertificate(recipient, courseId, courseName, certificateId, tokenURI)`
Mints a new certificate NFT.
- **Fee**: 0.0000001 ETH
- **Parameters**:
  - `recipient`: Address receiving the certificate
  - `courseId`: Unique course identifier (UUID)
  - `courseName`: Name of the completed course
  - `certificateId`: Unique certificate identifier from backend
  - `tokenURI`: IPFS or storage URL for certificate image/metadata
- **Returns**: Token ID of minted certificate
- **Reverts**: If fee insufficient, certificate already exists for this user+course

#### `getCertificate(tokenId)`
Returns certificate data for a token ID.
- **Returns**: CertificateData struct with recipient, courseId, courseName, issuedAt, certificateId

#### `hasCertificate(user, courseId)`
Checks if a user has a certificate for a specific course.
- **Returns**: boolean

#### `getUserCertificateId(user, courseId)`
Gets the token ID of a user's certificate for a course.
- **Returns**: Token ID (0 if none)

#### `verifyCertificate(tokenId, expectedOwner, expectedCourseId)`
Verifies certificate authenticity.
- **Returns**: boolean

### Admin Functions

#### `withdraw()`
Owner can withdraw accumulated mint fees.

## Certificate Structure
```solidity
struct CertificateData {
    address recipient;      // Certificate holder
    string courseId;        // Course UUID
    string courseName;      // Course title
    uint256 issuedAt;       // Timestamp
    string certificateId;   // Unique cert ID
}
```

## Non-Transferable Behavior
Certificates are **soulbound** (non-transferable) after minting. The `_update` function prevents transfers between non-zero addresses. This ensures certificates remain proof of the original recipient's achievement.

To make certificates transferable, remove the `_update` override function.

## Deployment Instructions

### Prerequisites
- Node.js and npm/yarn
- Hardhat or Foundry
- Base Mainnet RPC URL
- Deployer wallet with ETH on Base

### Using Hardhat

1. Install dependencies:
```bash
npm install --save-dev hardhat @openzeppelin/contracts
npm install --save-dev @nomicfoundation/hardhat-toolbox
```

2. Create `hardhat.config.js`:
```javascript
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.20",
  networks: {
    base: {
      url: "https://mainnet.base.org",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 8453
    }
  }
};
```

3. Create deployment script `scripts/deployCertificate.js`:
```javascript
const hre = require("hardhat");

async function main() {
  console.log("Deploying CertificateNFT to Base Mainnet...");
  
  const CertificateNFT = await hre.ethers.getContractFactory("CertificateNFT");
  const certificate = await CertificateNFT.deploy();
  
  await certificate.waitForDeployment();
  const address = await certificate.getAddress();
  
  console.log("CertificateNFT deployed to:", address);
  console.log("Owner:", await certificate.owner());
  console.log("Mint fee:", await certificate.MINT_FEE(), "wei (0.0000001 ETH)");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

4. Deploy:
```bash
npx hardhat run scripts/deployCertificate.js --network base
```

5. Verify on Basescan:
```bash
npx hardhat verify --network base DEPLOYED_CONTRACT_ADDRESS
```

## Integration with UniqueHub

### Backend (Edge Function)
The backend generates certificate images and calls the contract to mint:
```typescript
// Generate certificate image with Lovable AI
// Upload to Supabase storage
// Call contract's mintCertificate function
```

### Frontend (React + wagmi)
```typescript
import { useWriteContract } from 'wagmi';

const { writeContract } = useWriteContract();

const claimCertificate = async () => {
  await writeContract({
    address: CERTIFICATE_CONTRACT_ADDRESS,
    abi: CERTIFICATE_ABI,
    functionName: 'mintCertificate',
    args: [userAddress, courseId, courseName, certificateId, tokenURI],
    value: parseEther('0.0000001')
  });
};
```

## Events
- `CertificateMinted`: Emitted when a certificate is minted
- `FundsWithdrawn`: Emitted when owner withdraws fees

## Security Features
- ✅ ReentrancyGuard on mint and withdraw
- ✅ Ownable for admin functions
- ✅ Duplicate prevention via mapping
- ✅ Input validation on all parameters
- ✅ Non-transferable tokens prevent fraud

## Metadata Standard (ERC-721)
Each certificate's `tokenURI` should point to JSON metadata:
```json
{
  "name": "UniqueHub Course Completion Certificate",
  "description": "Certificate of completion for [Course Name]",
  "image": "ipfs://... or https://...",
  "attributes": [
    {"trait_type": "Course", "value": "Course Name"},
    {"trait_type": "Recipient", "value": "0x..."},
    {"trait_type": "Issued Date", "value": "2025-01-11"},
    {"trait_type": "Certificate ID", "value": "uuid"}
  ]
}
```

## Gas Estimates
- Mint: ~150,000 gas (+ 0.0000001 ETH fee)
- Check certificate: <50,000 gas (view function)
- Withdraw: ~30,000 gas

## Support
For issues or questions, contact UniqueHub support or check the smart contract code.
