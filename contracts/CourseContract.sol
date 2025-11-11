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
    event CourseDeactivated(string indexed courseId, address indexed seller);
    event FundsWithdrawn(address indexed owner, uint256 usdcAmount, uint256 ethAmount);
    
    /**
     * @notice Initialize contract with Chainlink price feed
     * @param _priceFeed Chainlink ETH/USD price feed address on Base
     */
    constructor(address _priceFeed) Ownable(msg.sender) {
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
        require(priceUSDC >= 0, "Price cannot be negative");
        
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
        
        // Calculate fees
        uint256 platformFee = (course.priceUSDC * PLATFORM_FEE_PERCENT) / 100;
        uint256 sellerAmount = course.priceUSDC - platformFee;
        
        // Single transfer from buyer to contract
        require(USDC.transferFrom(msg.sender, address(this), course.priceUSDC), "Payment failed");
        
        // Transfer seller amount from contract to seller
        require(USDC.transfer(course.seller, sellerAmount), "Seller payment failed");
        
        // Platform fee stays in contract
        
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
        uint256 platformFee = (requiredETH * PLATFORM_FEE_PERCENT) / 100;
        uint256 sellerAmount = requiredETH - platformFee;
        
        // Send ETH to seller (platform fee stays in contract)
        payable(course.seller).transfer(sellerAmount);
        
        // Refund excess ETH if any
        if (msg.value > requiredETH) {
            payable(msg.sender).transfer(msg.value - requiredETH);
        }
        
        enrollments[courseId][msg.sender] = true;
        
        emit CourseEnrolled(courseId, msg.sender, requiredETH, true);
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
        
        // Refund excess ETH if any
        if (msg.value > FREE_COURSE_FEE) {
            payable(msg.sender).transfer(msg.value - FREE_COURSE_FEE);
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
     * @notice Get course details
     * @param courseId Course identifier
     * @return Course details
     */
    function getCourse(string memory courseId) external view returns (Course memory) {
        return courses[courseId];
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
            payable(owner()).transfer(ethBalance);
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
        
        emit CourseDeactivated(courseId, msg.sender);
    }
    
    // Fallback to receive ETH
    receive() external payable {}
}
