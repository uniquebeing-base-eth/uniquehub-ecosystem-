# Earn Points Claim Smart Contract

## Overview
Smart contract for claiming earned points in the Earn section on Base network. Users pay 0.0000001 ETH to claim points after completing and verifying tasks.

## Contract Details

**File**: `contracts/EarnPointsClaim.sol`

**Key Features**:
- Claim fee: 0.0000001 ETH (100 Gwei)
- Tracks point claims per user and task
- Prevents double-claiming same task
- Emits events for backend integration
- All funds remain in contract until owner withdrawal
- Built with OpenZeppelin security standards

## Workflow

1. **User completes task** → Backend verifies completion
2. **Button shows "Claim X points"** → User clicks to claim
3. **Pay 0.0000001 ETH** → Transaction confirms on-chain
4. **Backend listens for event** → Awards points in database
5. **Points added to user account** → Task marked as claimed

## Deployment Instructions

### Prerequisites
```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npm install @openzeppelin/contracts
```

### 1. Create Hardhat Config

Create `hardhat.config.js` (same as Quest contract):
```javascript
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

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
    },
    baseSepolia: {
      url: "https://sepolia.base.org",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 84532
    }
  },
  etherscan: {
    apiKey: {
      base: process.env.BASESCAN_API_KEY,
      baseSepolia: process.env.BASESCAN_API_KEY
    },
    customChains: [
      {
        network: "base",
        chainId: 8453,
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://basescan.org"
        }
      },
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org"
        }
      }
    ]
  }
};
```

### 2. Create Deployment Script

Create `scripts/deploy-earn-points.js`:
```javascript
const hre = require("hardhat");

async function main() {
  console.log("Deploying EarnPointsClaim contract...");

  const EarnPointsClaim = await hre.ethers.getContractFactory("EarnPointsClaim");
  const earnPoints = await EarnPointsClaim.deploy();

  await earnPoints.waitForDeployment();
  const address = await earnPoints.getAddress();

  console.log("EarnPointsClaim deployed to:", address);
  console.log("Claim fee:", "0.0000001 ETH");
  
  // Wait for block confirmations
  console.log("Waiting for block confirmations...");
  await earnPoints.deploymentTransaction().wait(5);
  
  console.log("Verifying contract on BaseScan...");
  try {
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: [],
    });
    console.log("Contract verified!");
  } catch (error) {
    console.log("Verification error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### 3. Deploy to Base Testnet (Recommended First)

```bash
npx hardhat compile
npx hardhat run scripts/deploy-earn-points.js --network baseSepolia
```

### 4. Deploy to Base Mainnet

```bash
npx hardhat run scripts/deploy-earn-points.js --network base
```

## Contract Functions

### User Functions

**`claimPoints(string taskId, uint256 pointsAmount)`**
- Pay 0.0000001 ETH to claim points for a completed task
- Emits `PointsClaimed` event
- Can only claim each task once
- Parameters:
  - `taskId`: Unique identifier for the task (e.g., "daily_checkin", "follow_farcaster")
  - `pointsAmount`: Number of points to claim (e.g., 1000, 500)

**`hasClaimed(address user, string taskId)`**
- Check if a user has claimed a specific task
- Returns: bool

**`getUserClaimCount(address user)`**
- Get total tasks claimed by user
- Returns: uint256

**`getTaskClaimCount(string taskId)`**
- Get total claims for a specific task
- Returns: uint256

**`getTotalPointsClaimed(address user)`**
- Get total points claimed by user across all tasks
- Returns: uint256

**`getContractBalance()`**
- View total ETH in contract
- Returns: uint256

### Owner Functions

**`withdrawFunds()`**
- Withdraw all ETH from contract
- Only contract owner can call

## Events

**`PointsClaimed`**
```solidity
event PointsClaimed(
    address indexed user,
    string indexed taskId,
    uint256 pointsAmount,
    uint256 timestamp,
    uint256 feeAmount
);
```

## Integration Steps

After deployment:

1. **Update Config**: Add contract address to `src/config/wagmi.ts`
2. **Add ABI**: Export the contract ABI
3. **Update Earn Components**: Integrate in Earn section components
4. **Backend Listener**: Create edge function to listen for `PointsClaimed` events
5. **Award Points**: Update database after event confirmation

## Example Task IDs

```javascript
// Task IDs should match your backend task identifiers
const taskIds = {
  DAILY_CHECKIN: "daily_checkin",
  FOLLOW_FARCASTER: "follow_farcaster",
  SHARE_CAST: "share_cast",
  COMPLETE_PROFILE: "complete_profile",
  INVITE_FRIEND: "invite_friend",
};
```

## Frontend Integration Example

```typescript
// When user clicks "Claim 1000 points" button
const { write } = useContractWrite({
  address: EARN_CONTRACT_ADDRESS,
  abi: EARN_CONTRACT_ABI,
  functionName: 'claimPoints',
  args: ['daily_checkin', 1000],
  value: parseEther('0.0000001'),
});

// Button text: "Claim {pointsAmount} points"
<Button onClick={() => write()}>
  Claim {task.points} points
</Button>
```

## Security Features

- ✅ ReentrancyGuard protection
- ✅ Owner-only withdrawal
- ✅ Duplicate claim prevention
- ✅ Input validation
- ✅ OpenZeppelin contracts

## Gas Estimates

- Claim points: ~60,000-80,000 gas
- At 0.0000001 ETH fee + gas: ~0.0001 ETH total per claim
- Very affordable for on-chain activity tracking

## Database Schema Update

Add transaction tracking to existing tables:
```sql
ALTER TABLE task_completions 
ADD COLUMN transaction_hash TEXT,
ADD COLUMN claimed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN claim_amount INTEGER;
```

## Testing

Create `test/EarnPointsClaim.test.js` for comprehensive testing before mainnet deployment.
