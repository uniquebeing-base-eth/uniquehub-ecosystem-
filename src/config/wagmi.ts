import { createConfig, http } from 'wagmi';
import { base } from 'wagmi/chains';
import { fallback } from 'viem';
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector';

export const wagmiConfig = createConfig({
  chains: [base],
  connectors: [farcasterMiniApp()],
  transports: {
    [base.id]: fallback([http('https://mainnet.base.org')]),
  },
  ssr: true,
});

// Course Contract ABI
export const COURSE_CONTRACT_ABI = [
  {
    inputs: [{ name: 'courseId', type: 'string' }, { name: 'priceUSDC', type: 'uint256' }],
    name: 'listCourse',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'courseId', type: 'string' }],
    name: 'enrollWithUSDC',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'courseId', type: 'string' }],
    name: 'enrollWithETH',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ name: 'courseId', type: 'string' }],
    name: 'enrollFreeCourse',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ name: 'priceUSDC', type: 'uint256' }],
    name: 'calculateETHAmount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'courseId', type: 'string' }, { name: 'user', type: 'address' }],
    name: 'isEnrolled',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// USDC Contract ABI (ERC20)
export const USDC_ABI = [
  {
    inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Marketplace Contract ABI
export const MARKETPLACE_CONTRACT_ABI = [
  {
    inputs: [
      { name: 'itemId', type: 'string' },
      { name: 'title', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'priceUSDC', type: 'uint256' }
    ],
    name: 'listItem',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'itemId', type: 'string' }],
    name: 'delistItem',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'itemId', type: 'string' }],
    name: 'getItem',
    outputs: [
      {
        components: [
          { name: 'seller', type: 'address' },
          { name: 'itemId', type: 'string' },
          { name: 'title', type: 'string' },
          { name: 'description', type: 'string' },
          { name: 'priceUSDC', type: 'uint256' },
          { name: 'isActive', type: 'bool' },
          { name: 'listedAt', type: 'uint256' }
        ],
        name: '',
        type: 'tuple'
      }
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Certificate NFT Contract ABI
export const CERTIFICATE_CONTRACT_ABI = [
  {
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'courseId', type: 'string' },
      { name: 'courseName', type: 'string' },
      { name: 'certificateId', type: 'string' },
      { name: 'tokenURI', type: 'string' }
    ],
    name: 'mintCertificate',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'getCertificate',
    outputs: [
      {
        components: [
          { name: 'recipient', type: 'address' },
          { name: 'courseId', type: 'string' },
          { name: 'courseName', type: 'string' },
          { name: 'issuedAt', type: 'uint256' },
          { name: 'certificateId', type: 'string' }
        ],
        name: '',
        type: 'tuple'
      }
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }, { name: 'courseId', type: 'string' }],
    name: 'hasCertificate',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Contract Addresses on Base Mainnet
export const COURSE_CONTRACT_ADDRESS = '0x237b0cdC89A75B329f1b650D844F20497698a48A' as const;
export const MARKETPLACE_CONTRACT_ADDRESS = '0x08A8A1E3E9E74005f764f449C62FCEdC5f3E9421' as const;
export const CERTIFICATE_CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000' as const; // UPDATE AFTER DEPLOYMENT
export const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const;
export const LISTING_FEE = 100000n; // 0.1 USDC (6 decimals)
export const FREE_COURSE_FEE = 100000000000n; // 0.0000001 ETH
export const MARKETPLACE_LISTING_FEE = 100000n; // 0.1 USDC (6 decimals)
export const CERTIFICATE_MINT_FEE = 100000000000n; // 0.0000001 ETH
