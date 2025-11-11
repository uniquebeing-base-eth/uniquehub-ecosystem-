// Smart Contract Addresses on Base Mainnet
export const CONTRACTS = {
  COURSE_CONTRACT: '0x237b0cdC89A75B329f1b650D844F20497698a48A',
  // Add marketplace contract address when deployed
  MARKETPLACE_CONTRACT: '',
} as const;

// Contract ABIs
export const COURSE_CONTRACT_ABI = [
  // View functions
  'function getCourse(string courseId) view returns (address seller, string courseId, uint256 priceUSDC, bool isActive, uint256 listedAt)',
  'function isEnrolled(string courseId, address user) view returns (bool)',
  'function getLatestETHPrice() view returns (int256)',
  'function calculateETHAmount(uint256 priceUSDC) view returns (uint256)',
  
  // Write functions
  'function listCourse(string courseId, uint256 priceUSDC)',
  'function enrollWithUSDC(string courseId)',
  'function enrollWithETH(string courseId) payable',
  'function enrollFreeCourse(string courseId) payable',
  'function deactivateCourse(string courseId)',
  
  // Events
  'event CourseListed(string indexed courseId, address indexed seller, uint256 priceUSDC, uint256 timestamp)',
  'event CourseEnrolled(string indexed courseId, address indexed student, uint256 amountPaid, string paymentMethod, uint256 timestamp)',
  'event FreeCourseEnrolled(string indexed courseId, address indexed student, uint256 timestamp)',
] as const;

export const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
export const USDC_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
] as const;
