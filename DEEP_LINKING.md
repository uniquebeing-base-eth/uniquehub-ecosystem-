# Farcaster Mini App Deep Linking System

## Overview
UniqueHub now supports deep-linking across all shareable content. When users share content to Farcaster, recipients are directed to the specific content within the app.

## Supported Deep Links

### Courses
- **URL Pattern**: `https://uniqueehub.vercel.app?course={courseId}`
- **Share Locations**: 
  - Trending course cards
  - Course listings
  - Profile section (created courses)
- **Behavior**: Opens course details with purchase/enrollment options

### NFTs
- **URL Pattern**: `https://uniqueehub.vercel.app?nft={nftId}`
- **Share Locations**: 
  - Latest NFT cards
  - NFT marketplace listings
- **Behavior**: Opens NFT detail view in marketplace

### Marketplace Items
- **URL Pattern**: `https://uniqueehub.vercel.app?marketplace={itemId}`
- **Share Locations**: 
  - Marketplace item listings
- **Behavior**: Opens marketplace item detail view

### Certificates
- **URL Pattern**: `https://uniqueehub.vercel.app?certificate={certificateId}`
- **Share Locations**: 
  - Certificate gallery
  - Certificate claim success
- **Behavior**: Displays certificate in user's gallery

### Earn Section
- **URL Pattern**: `https://uniqueehub.vercel.app`
- **Share Locations**: 
  - After completing tasks
- **Behavior**: Opens main app (no specific deep link needed)

## Technical Implementation

### 1. Dynamic Frame Generation
All shares use the `farcaster-frame` edge function to generate dynamic meta tags:
- `title`: Content-specific title
- `description`: Content-specific description
- `image`: Content thumbnail/image
- `url`: Deep link URL with query parameters

### 2. Deep Link Handler (`DeepLinkHandler.tsx`)
- Monitors URL query parameters
- Stores deep link info in sessionStorage
- Clears URL params for clean app state

### 3. Section Handlers
Each section checks for deep link parameters on mount:
- **CoursesSection**: Opens course detail modal
- **MarketplaceSection**: Opens item detail modal
- **CertificatesSection**: Highlights specific certificate

## Usage in ShareToFarcaster Component

```tsx
<ShareToFarcaster
  text="Share text with @mentions"
  frameTitle="Content Title"
  frameDescription="Content description with details"
  frameImage="https://image-url.png"
  frameUrl="https://uniqueehub.vercel.app?param=value"
  buttonText="Share" // optional
  variant="ghost" // optional
  size="icon" // optional
/>
```

## Benefits
- **Better User Experience**: Recipients land directly on shared content
- **Increased Engagement**: Reduces friction to view/purchase
- **Professional Sharing**: Rich previews with proper meta tags
- **Viral Growth**: Easy content discovery through shares
