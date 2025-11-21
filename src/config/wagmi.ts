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
    inputs: [{ name: 'tokenURI', type: 'string' }],
    name: 'mintCertificate',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'hasUserMinted',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getUserTokenId',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalMinted',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'MINT_PRICE',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Unique NFT Mint Contract ABI
export const UNIQUE_NFT_ABI = [
  {
    inputs: [{ name: '_tokenURI', type: 'string' }],
    name: 'mintAvatar',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'hasUserMinted',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getUserTokenId',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalMinted',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getCurrentPrice',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Contract Addresses on Base Mainnet
export const COURSE_CONTRACT_ADDRESS = '0x237b0cdC89A75B329f1b650D844F20497698a48A' as const;
export const MARKETPLACE_CONTRACT_ADDRESS = '0x08A8A1E3E9E74005f764f449C62FCEdC5f3E9421' as const;
export const CERTIFICATE_CONTRACT_ADDRESS = '0x14c3899962C0E8C89e4903c9d1035a54190b18fF' as const;
export const UNIQUE_NFT_ADDRESS = '0x8610701D16e6e75d751bf362bef981F2D273b129' as const;
export const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const;
export const LISTING_FEE = 100000n; // 0.1 USDC (6 decimals)
export const FREE_COURSE_FEE = 100000000000n; // 0.0000001 ETH
export const MARKETPLACE_LISTING_FEE = 100000n; // 0.1 USDC (6 decimals)
export const CERTIFICATE_MINT_FEE = 3000000000000n; // 0.000003 ETH
export const NFT_MINT_PRICE = 200000n; // 0.2 USDC (6 decimals)
