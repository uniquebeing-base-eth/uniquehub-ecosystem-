# Quest Learning Hub Smart Contract

## Overview
Smart contract for Quest Learning Hub module completions on Base network. Users pay 0.0000001 ETH per module completion for on-chain activity tracking.

## Contract Details

**File**: `contracts/QuestLearningHub.sol`

**Key Features**:
- Module completion fee: 0.0000001 ETH (100 Gwei)
- Tracks module completions per user and course
- Emits events for backend integration
- All funds remain in contract until owner withdrawal
- Built with OpenZeppelin security standards

## Deployment Instructions

### Prerequisites
```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npm install @openzeppelin/contracts
```

### 1. Create Hardhat Config

Create `hardhat.config.js`:
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

Create `scripts/deploy-quest-learning.js`:
```javascript
const hre = require("hardhat");

async function main() {
  console.log("Deploying QuestLearningHub contract...");

  const QuestLearningHub = await hre.ethers.getContractFactory("QuestLearningHub");
  const questLearning = await QuestLearningHub.deploy();

  await questLearning.waitForDeployment();
  const address = await questLearning.getAddress();

  console.log("QuestLearningHub deployed to:", address);
  console.log("Module completion fee:", "0.0000001 ETH");
  
  // Wait for block confirmations
  console.log("Waiting for block confirmations...");
  await questLearning.deploymentTransaction().wait(5);
  
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
npx hardhat run scripts/deploy-quest-learning.js --network baseSepolia
```

### 4. Deploy to Base Mainnet

```bash
npx hardhat run scripts/deploy-quest-learning.js --network base
```

## Contract Functions

### User Functions

**`completeModule(string courseId, string moduleId)`**
- Pay 0.0000001 ETH to complete a module
- Emits `ModuleCompleted` event
- Can only complete each module once

**`hasCompletedModule(address user, string courseId, string moduleId)`**
- Check if a user completed a specific module
- Returns: bool

**`getUserModuleCount(address user)`**
- Get total modules completed by user
- Returns: uint256

**`getCourseModuleCount(string courseId)`**
- Get total completions for a course
- Returns: uint256

**`getContractBalance()`**
- View total ETH in contract
- Returns: uint256

### Owner Functions

**`withdrawFunds()`**
- Withdraw all ETH from contract
- Only contract owner can call

## Events

**`ModuleCompleted`**
```solidity
event ModuleCompleted(
    address indexed user,
    string indexed courseId,
    string indexed moduleId,
    uint256 timestamp,
    uint256 feeAmount
);
```

## Integration Steps

After deployment:

1. **Update Config**: Add contract address to `src/config/wagmi.ts`
2. **Add ABI**: Export the contract ABI
3. **Update Component**: Integrate in `CourseModuleViewer.tsx`
4. **Backend Listener**: Create edge function to listen for `ModuleCompleted` events
5. **Award Points**: Update `module_completions` table and award points after event confirmation

## Security Features

- ✅ ReentrancyGuard protection
- ✅ Owner-only withdrawal
- ✅ Duplicate completion prevention
- ✅ Input validation
- ✅ OpenZeppelin contracts

## Gas Estimates

- Module completion: ~50,000-70,000 gas
- At 0.0000001 ETH fee + gas: ~0.0001 ETH total per transaction
- Very affordable for on-chain activity tracking

## Testing

Create `test/QuestLearningHub.test.js` for comprehensive testing before mainnet deployment.
