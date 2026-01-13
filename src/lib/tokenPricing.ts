
// Token pricing and economics constants

// UniqueHub Platform Token
export const UNIQUEHUB_TOKEN = {
  id: 'uniquehub-token',
  symbol: '$UNIQ',
  name: 'UniqueHub Token',
  totalSupply: 100_000_000, // 100M
  initialMarketCap: 20_000_000, // 20M
  initialPrice: 0.20, // $0.20 per token (20M / 100M)
};

// Creator Coin defaults
export const CREATOR_COIN_DEFAULTS = {
  totalSupply: 10_000_000, // 10M
  initialMarketCap: 40_000, // 40K
  initialPrice: 0.004, // $0.004 per token (40K / 10M)
  creatorAllocation: 0.10, // 10% = 1M tokens
  vestedAllocation: 0.30, // 30% vested over 24 months
  airdropReserve: 0.05, // 5% for airdrops
};

// Course Coin defaults
export const COURSE_COIN_DEFAULTS = {
  totalSupply: 1_000_000, // 1M per course
  initialMarketCap: 10_000, // 10K
  initialPrice: 0.01, // $0.01 per token
};

// Fee structure
export const FEE_STRUCTURE = {
  creatorEthFee: 0.02, // 2% to creator in ETH
  platformFee: 0.005, // 0.5% to platform
  marketplaceFee: 0.05, // 5% marketplace fee
};

// Calculate new price after purchase (bonding curve simulation)
export const calculateNewPrice = (
  currentPrice: number,
  currentSupply: number,
  purchaseAmount: number,
  curveStrength: number = 0.0001
): number => {
  // Simple linear bonding curve: price increases with supply
  const supplyRatio = purchaseAmount / currentSupply;
  const priceIncrease = currentPrice * supplyRatio * curveStrength * 1000;
  return currentPrice + priceIncrease;
};

// Calculate market cap
export const calculateMarketCap = (price: number, circulatingSupply: number): number => {
  return price * circulatingSupply;
};

// Calculate tokens received for a given USD amount
export const calculateTokensForAmount = (
  usdAmount: number,
  currentPrice: number
): number => {
  return usdAmount / currentPrice;
};

// Generate random 24h change for display
export const generate24hChange = (seed?: string): number => {
  // Use seed for consistent changes per token
  const base = seed ? seed.charCodeAt(0) % 10 : Math.random() * 10;
  return (base - 3) + (Math.random() * 4 - 2);
};

// Format large numbers
export const formatNumber = (num: number): string => {
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(2) + 'B';
  }
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(2) + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(2) + 'K';
  }
  return num.toFixed(2);
};

// Format price based on magnitude
export const formatPrice = (price: number): string => {
  if (price >= 1) {
    return '$' + price.toFixed(2);
  }
  if (price >= 0.001) {
    return '$' + price.toFixed(4);
  }
  return '$' + price.toFixed(6);
};
