# UniqueHub Course Contract

## CourseContract.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

/**
 * @title CourseContract
 * @notice Handles course listings and enrollments with USDC and ETH payments
 * @dev Uses Chainlink price feed for ETH/USD conversion
 */
contract CourseContract is Ownable, ReentrancyGuard {
    // Base USDC token address on Base mainnet
    IERC20 public constant USDC = IERC20(0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913);
    
    // Chainlink ETH/USD price feed on Base mainnet
    AggregatorV3Interface public immutable priceFeed;
    
    // Fee constants
    uint256 public constant LISTING_FEE = 100000; // 0.1 USDC (6 decimals)
    uint256 public constant FREE_COURSE_FEE = 100000000000; // 0.0000001 ETH
    uint256 public constant PLATFORM_FEE_PERCENT = 2; // 2% platform fee
    
    struct Course {
        address seller;
        uint256 priceUSDC; // Price in USDC (6 decimals), 0 for free courses
        bool isActive;
        string courseId; // Off-chain course ID reference
    }
    
    // Mapping from course ID to Course details
    mapping(string => Course) public courses;
    
    // Mapping to track enrollments
    mapping(string => mapping(address => bool)) public enrollments;
    
    // Events
    event CourseListed(string indexed courseId, address indexed seller, uint256 priceUSDC, bool isFree);
    event CourseEnrolled(string indexed courseId, address indexed buyer, uint256 amountPaid, bool paidWithETH);
    event FundsWithdrawn(address indexed owner, uint256 usdcAmount, uint256 ethAmount);
    
    /**
     * @notice Initialize contract with Chainlink price feed
     * @param _priceFeed Chainlink ETH/USD price feed address on Base
     * @param initialOwner Address that will own the contract
     */
    constructor(address _priceFeed, address initialOwner) Ownable(initialOwner) {
        priceFeed = AggregatorV3Interface(_priceFeed);
    }
    
    /**
     * @notice List a new course (paid courses require 0.1 USDC fee)
     * @param courseId Unique course identifier
     * @param priceUSDC Course price in USDC (0 for free courses)
     */
    function listCourse(string memory courseId, uint256 priceUSDC) external nonReentrant {
        require(bytes(courseId).length > 0, "Invalid course ID");
        require(!courses[courseId].isActive, "Course already listed");
        
        bool isFree = priceUSDC == 0;
        
        // Charge listing fee only for paid courses
        if (!isFree) {
            require(USDC.transferFrom(msg.sender, address(this), LISTING_FEE), "Listing fee payment failed");
        }
        
        courses[courseId] = Course({
            seller: msg.sender,
            priceUSDC: priceUSDC,
            isActive: true,
            courseId: courseId
        });
        
        emit CourseListed(courseId, msg.sender, priceUSDC, isFree);
    }
    
    /**
     * @notice Enroll in a paid course with USDC
     * @param courseId Course identifier
     */
    function enrollWithUSDC(string memory courseId) external nonReentrant {
        Course storage course = courses[courseId];
        require(course.isActive, "Course not active");
        require(course.priceUSDC > 0, "Use enrollFreeCourse for free courses");
        require(!enrollments[courseId][msg.sender], "Already enrolled");
        
        uint256 platformFee = (course.priceUSDC * PLATFORM_FEE_PERCENT) / 100;
        uint256 sellerAmount = course.priceUSDC - platformFee;
        
        // Transfer USDC from buyer
        require(USDC.transferFrom(msg.sender, address(this), platformFee), "Platform fee transfer failed");
        require(USDC.transferFrom(msg.sender, course.seller, sellerAmount), "Seller payment failed");
        
        enrollments[courseId][msg.sender] = true;
        
        emit CourseEnrolled(courseId, msg.sender, course.priceUSDC, false);
    }
    
    /**
     * @notice Enroll in a paid course with ETH
     * @param courseId Course identifier
     */
    function enrollWithETH(string memory courseId) external payable nonReentrant {
        Course storage course = courses[courseId];
        require(course.isActive, "Course not active");
        require(course.priceUSDC > 0, "Use enrollFreeCourse for free courses");
        require(!enrollments[courseId][msg.sender], "Already enrolled");
        
        // Get current ETH/USD price
        uint256 ethPriceUSD = getLatestETHPrice();
        
        // Calculate required ETH amount (USDC has 6 decimals, ETH has 18)
        uint256 requiredETH = (course.priceUSDC * 1e18 * 1e8) / ethPriceUSD / 1e6;
        
        require(msg.value >= requiredETH, "Insufficient ETH sent");
        
        // Calculate fees
        uint256 platformFee = (msg.value * PLATFORM_FEE_PERCENT) / 100;
        uint256 sellerAmount = msg.value - platformFee;
        
        // Send ETH to seller (platform fee stays in contract)
        (bool success, ) = course.seller.call{value: sellerAmount}("");
        require(success, "Seller payment failed");
        
        // Refund excess ETH
        if (msg.value > requiredETH) {
            (bool refundSuccess, ) = msg.sender.call{value: msg.value - requiredETH}("");
            require(refundSuccess, "Refund failed");
        }
        
        enrollments[courseId][msg.sender] = true;
        
        emit CourseEnrolled(courseId, msg.sender, msg.value, true);
    }
    
    /**
     * @notice Enroll in a free course (requires 0.0000001 ETH fee)
     * @param courseId Course identifier
     */
    function enrollFreeCourse(string memory courseId) external payable nonReentrant {
        Course storage course = courses[courseId];
        require(course.isActive, "Course not active");
        require(course.priceUSDC == 0, "Use enrollWithUSDC or enrollWithETH for paid courses");
        require(!enrollments[courseId][msg.sender], "Already enrolled");
        require(msg.value >= FREE_COURSE_FEE, "Insufficient fee");
        
        enrollments[courseId][msg.sender] = true;
        
        // Refund excess ETH
        if (msg.value > FREE_COURSE_FEE) {
            (bool refundSuccess, ) = msg.sender.call{value: msg.value - FREE_COURSE_FEE}("");
            require(refundSuccess, "Refund failed");
        }
        
        emit CourseEnrolled(courseId, msg.sender, FREE_COURSE_FEE, true);
    }
    
    /**
     * @notice Get latest ETH/USD price from Chainlink
     * @return ETH price in USD (8 decimals)
     */
    function getLatestETHPrice() public view returns (uint256) {
        (, int256 price, , , ) = priceFeed.latestRoundData();
        require(price > 0, "Invalid price feed");
        return uint256(price);
    }
    
    /**
     * @notice Calculate required ETH for a course price
     * @param priceUSDC Course price in USDC
     * @return Required ETH amount
     */
    function calculateETHAmount(uint256 priceUSDC) public view returns (uint256) {
        uint256 ethPriceUSD = getLatestETHPrice();
        return (priceUSDC * 1e18 * 1e8) / ethPriceUSD / 1e6;
    }
    
    /**
     * @notice Check if user is enrolled in a course
     * @param courseId Course identifier
     * @param user User address
     */
    function isEnrolled(string memory courseId, address user) external view returns (bool) {
        return enrollments[courseId][user];
    }
    
    /**
     * @notice Owner withdraws collected USDC and ETH
     */
    function withdrawFunds() external onlyOwner nonReentrant {
        uint256 usdcBalance = USDC.balanceOf(address(this));
        uint256 ethBalance = address(this).balance;
        
        if (usdcBalance > 0) {
            require(USDC.transfer(owner(), usdcBalance), "USDC withdrawal failed");
        }
        
        if (ethBalance > 0) {
            (bool success, ) = owner().call{value: ethBalance}("");
            require(success, "ETH withdrawal failed");
        }
        
        emit FundsWithdrawn(owner(), usdcBalance, ethBalance);
    }
    
    /**
     * @notice Deactivate a course (seller only)
     * @param courseId Course identifier
     */
    function deactivateCourse(string memory courseId) external {
        Course storage course = courses[courseId];
        require(course.seller == msg.sender, "Only seller can deactivate");
        require(course.isActive, "Course already inactive");
        
        course.isActive = false;
    }
    
    // Fallback to receive ETH
    receive() external payable {}
}
```

## Deployment Instructions

### Prerequisites
```bash
npm install --save-dev hardhat @openzeppelin/contracts @chainlink/contracts
```

### Deployment Script (deploy-course-contract.js)
```javascript
const hre = require("hardhat");

async function main() {
  // Chainlink ETH/USD price feed on Base mainnet
  const PRICE_FEED_ADDRESS = "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70";
  
  // Get deployer address
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  console.log("Deploying CourseContract...");
  
  const CourseContract = await hre.ethers.getContractFactory("CourseContract");
  const courseContract = await CourseContract.deploy(PRICE_FEED_ADDRESS, deployer.address);
  
  await courseContract.deployed();
  
  console.log("CourseContract deployed to:", courseContract.address);
  console.log("Owner:", deployer.address);
  console.log("Price Feed:", PRICE_FEED_ADDRESS);
  console.log("\nVerify with:");
  console.log(`npx hardhat verify --network base ${courseContract.address} ${PRICE_FEED_ADDRESS} ${deployer.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### Hardhat Config
```javascript
require("@nomicfoundation/hardhat-toolbox");

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
    }
  },
  etherscan: {
    apiKey: {
      base: process.env.BASESCAN_API_KEY
    }
  }
};
```

## Contract Addresses

### Base Mainnet
- **CourseContract**: `[DEPLOY_AND_UPDATE_HERE]`
- **USDC Token**: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- **ETH/USD Price Feed**: `0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70`

## Deployment on Remix IDE

### ⚠️ IMPORTANT: Constructor Parameters

The contract requires **TWO parameters** in this exact order:

1. **Price Feed Address**: `0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70`
2. **Your Wallet Address**: Use the checksummed version of your address

### Get Checksummed Address
Your address must use correct capitalization. Get it from:
- https://etherscan.io/address-checksum
- Or copy directly from your wallet (MetaMask shows checksummed addresses)

### Deployment Example
If your wallet is `0x0f58a320f46899f60342f995d683ab1fcc696ceb`, the checksummed version is:
`0x0F58A320F46899f60342F995d683Ab1FCC696CeB` (note the capital letters)

**Constructor parameters to enter in Remix:**
```
0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70,0x0F58A320F46899f60342F995d683Ab1FCC696CeB
```

### Deployment Steps:
1. Connect MetaMask to **Base Mainnet** (Chain ID: 8453)
2. Ensure you have **at least 0.01 ETH** for gas
3. In Remix "Deploy & Run Transactions" tab:
   - Environment: "Injected Provider - MetaMask"
   - Select "CourseContract" from dropdown
   - Paste both parameters in the deploy field (separated by comma)
4. Click **Deploy** and confirm in MetaMask

## Usage Examples

### List a Paid Course
```javascript
// Approve USDC for listing fee
await usdc.approve(courseContract.address, "100000"); // 0.1 USDC
await courseContract.listCourse("course-123", "10000000"); // 10 USDC
```

### List a Free Course
```javascript
// No fee required
await courseContract.listCourse("free-course-456", "0");
```

### Enroll with USDC
```javascript
await usdc.approve(courseContract.address, "10000000"); // 10 USDC
await courseContract.enrollWithUSDC("course-123");
```

### Enroll with ETH
```javascript
const requiredETH = await courseContract.calculateETHAmount("10000000");
await courseContract.enrollWithETH("course-123", { value: requiredETH });
```

### Enroll in Free Course
```javascript
await courseContract.enrollFreeCourse("free-course-456", { 
  value: "100000000000" // 0.0000001 ETH
});
```
