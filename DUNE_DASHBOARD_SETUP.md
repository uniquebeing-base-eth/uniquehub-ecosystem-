# UniqueHub Dune Dashboard Setup Guide

## Overview
This guide will help you create a comprehensive Dune Analytics dashboard for tracking UniqueHub's on-chain metrics on Base L2.

## Prerequisites
1. Create a free account at [dune.com](https://dune.com)
2. Have your deployed contract addresses ready
3. Ensure contracts are verified on BaseScan

## Required Contract Addresses
You'll need these contract addresses (replace with your actual deployed addresses):

```
COURSE_CONTRACT_ADDRESS = "0x..."
MARKETPLACE_CONTRACT_ADDRESS = "0x..."
CERTIFICATE_CONTRACT_ADDRESS = "0x..."
UNIQUE_NFT_ADDRESS = "0x..."
UNIQHUB_TOKEN_ADDRESS = "0x..."
USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
```

## Dashboard Sections

### 1. Overview Metrics (KPIs)

#### Total Users
```sql
-- Query: Total Unique Users
SELECT COUNT(DISTINCT "from") as total_users
FROM base.transactions
WHERE (
    "to" = LOWER('{{COURSE_CONTRACT_ADDRESS}}')
    OR "to" = LOWER('{{MARKETPLACE_CONTRACT_ADDRESS}}')
    OR "to" = LOWER('{{UNIQUE_NFT_ADDRESS}}')
)
AND block_time >= DATE('2024-01-01');
```

#### Total Creators
```sql
-- Query: Total Creators (Users who uploaded courses)
SELECT COUNT(DISTINCT evt_tx_from) as total_creators
FROM base.logs
WHERE contract_address = LOWER('{{COURSE_CONTRACT_ADDRESS}}')
AND topic0 = '0x...' -- CourseUploaded event signature
AND block_time >= DATE('2024-01-01');
```

#### Total Courses
```sql
-- Query: Total Courses Created
SELECT COUNT(*) as total_courses
FROM base.logs
WHERE contract_address = LOWER('{{COURSE_CONTRACT_ADDRESS}}')
AND topic0 = '0x...' -- CourseUploaded event signature
AND block_time >= DATE('2024-01-01');
```

#### Total Transactions
```sql
-- Query: Total Transactions
SELECT COUNT(*) as total_transactions
FROM base.transactions
WHERE (
    "to" = LOWER('{{COURSE_CONTRACT_ADDRESS}}')
    OR "to" = LOWER('{{MARKETPLACE_CONTRACT_ADDRESS}}')
)
AND block_time >= DATE('2024-01-01');
```

#### Total Revenue Generated
```sql
-- Query: Total Platform Revenue (USDC)
WITH course_payments AS (
    SELECT 
        bytea2numeric_v3(data) / 1e6 as amount_usdc
    FROM base.logs
    WHERE contract_address = LOWER('{{COURSE_CONTRACT_ADDRESS}}')
    AND topic0 = '0x...' -- CoursePurchased event
),
marketplace_sales AS (
    SELECT 
        bytea2numeric_v3(data) / 1e6 as amount_usdc
    FROM base.logs
    WHERE contract_address = LOWER('{{MARKETPLACE_CONTRACT_ADDRESS}}')
    AND topic0 = '0x...' -- ItemPurchased event
)
SELECT 
    SUM(amount_usdc) as total_revenue_usdc
FROM (
    SELECT amount_usdc FROM course_payments
    UNION ALL
    SELECT amount_usdc FROM marketplace_sales
);
```

#### Total Creator Earnings
```sql
-- Query: Total Creator Earnings (95% of revenue)
WITH total_revenue AS (
    SELECT 
        bytea2numeric_v3(data) / 1e6 as amount_usdc
    FROM base.logs
    WHERE contract_address = LOWER('{{COURSE_CONTRACT_ADDRESS}}')
    AND topic0 = '0x...' -- CoursePurchased event
)
SELECT 
    SUM(amount_usdc) * 0.95 as creator_earnings_usdc
FROM total_revenue;
```

---

### 2. Creator Earnings Analytics

#### Top Earners
```sql
-- Query: Top 10 Creators by Earnings
SELECT 
    '0x' || encode(substring(topic2 from 13 for 20), 'hex') as creator_address,
    SUM(bytea2numeric_v3(data) / 1e6) * 0.95 as total_earnings_usdc,
    COUNT(*) as total_sales
FROM base.logs
WHERE contract_address = LOWER('{{COURSE_CONTRACT_ADDRESS}}')
AND topic0 = '0x...' -- CoursePurchased event
AND block_time >= DATE('2024-01-01')
GROUP BY creator_address
ORDER BY total_earnings_usdc DESC
LIMIT 10;
```

#### Earnings Over Time
```sql
-- Query: Creator Earnings Per Day
SELECT 
    DATE_TRUNC('day', block_time) as date,
    SUM(bytea2numeric_v3(data) / 1e6) * 0.95 as daily_earnings_usdc,
    COUNT(*) as daily_sales
FROM base.logs
WHERE contract_address = LOWER('{{COURSE_CONTRACT_ADDRESS}}')
AND topic0 = '0x...' -- CoursePurchased event
AND block_time >= DATE('2024-01-01')
GROUP BY date
ORDER BY date;
```

#### Earnings Distribution
```sql
-- Query: Earnings Distribution (Histogram)
WITH creator_earnings AS (
    SELECT 
        '0x' || encode(substring(topic2 from 13 for 20), 'hex') as creator,
        SUM(bytea2numeric_v3(data) / 1e6) * 0.95 as earnings
    FROM base.logs
    WHERE contract_address = LOWER('{{COURSE_CONTRACT_ADDRESS}}')
    AND topic0 = '0x...' -- CoursePurchased event
    GROUP BY creator
)
SELECT 
    CASE 
        WHEN earnings < 10 THEN '0-10 USDC'
        WHEN earnings < 50 THEN '10-50 USDC'
        WHEN earnings < 100 THEN '50-100 USDC'
        WHEN earnings < 500 THEN '100-500 USDC'
        ELSE '500+ USDC'
    END as earnings_range,
    COUNT(*) as creator_count
FROM creator_earnings
GROUP BY earnings_range
ORDER BY MIN(earnings);
```

---

### 3. User Analytics

#### Daily Active Users (DAU)
```sql
-- Query: Daily Active Users
SELECT 
    DATE_TRUNC('day', block_time) as date,
    COUNT(DISTINCT "from") as daily_active_users
FROM base.transactions
WHERE (
    "to" = LOWER('{{COURSE_CONTRACT_ADDRESS}}')
    OR "to" = LOWER('{{MARKETPLACE_CONTRACT_ADDRESS}}')
    OR "to" = LOWER('{{UNIQUE_NFT_ADDRESS}}')
)
AND block_time >= CURRENT_DATE - INTERVAL '90' DAY
GROUP BY date
ORDER BY date;
```

#### New Users Per Day
```sql
-- Query: New Users Per Day
WITH first_tx AS (
    SELECT 
        "from" as user_address,
        MIN(DATE_TRUNC('day', block_time)) as first_tx_date
    FROM base.transactions
    WHERE (
        "to" = LOWER('{{COURSE_CONTRACT_ADDRESS}}')
        OR "to" = LOWER('{{MARKETPLACE_CONTRACT_ADDRESS}}')
        OR "to" = LOWER('{{UNIQUE_NFT_ADDRESS}}')
    )
    GROUP BY user_address
)
SELECT 
    first_tx_date as date,
    COUNT(*) as new_users
FROM first_tx
WHERE first_tx_date >= DATE('2024-01-01')
GROUP BY first_tx_date
ORDER BY first_tx_date;
```

#### Growth Curve (Cumulative Users)
```sql
-- Query: Cumulative Unique Users
WITH first_tx AS (
    SELECT 
        "from" as user_address,
        MIN(DATE_TRUNC('day', block_time)) as first_tx_date
    FROM base.transactions
    WHERE (
        "to" = LOWER('{{COURSE_CONTRACT_ADDRESS}}')
        OR "to" = LOWER('{{MARKETPLACE_CONTRACT_ADDRESS}}')
        OR "to" = LOWER('{{UNIQUE_NFT_ADDRESS}}')
    )
    GROUP BY user_address
),
daily_new AS (
    SELECT 
        first_tx_date as date,
        COUNT(*) as new_users
    FROM first_tx
    WHERE first_tx_date >= DATE('2024-01-01')
    GROUP BY first_tx_date
)
SELECT 
    date,
    SUM(new_users) OVER (ORDER BY date) as cumulative_users
FROM daily_new
ORDER BY date;
```

---

### 4. Transaction Analytics

#### Purchases Per Day
```sql
-- Query: Daily Purchase Volume
SELECT 
    DATE_TRUNC('day', block_time) as date,
    COUNT(*) as total_purchases,
    COUNT(CASE WHEN contract_address = LOWER('{{COURSE_CONTRACT_ADDRESS}}') THEN 1 END) as course_purchases,
    COUNT(CASE WHEN contract_address = LOWER('{{MARKETPLACE_CONTRACT_ADDRESS}}') THEN 1 END) as marketplace_purchases
FROM base.logs
WHERE (
    contract_address = LOWER('{{COURSE_CONTRACT_ADDRESS}}')
    OR contract_address = LOWER('{{MARKETPLACE_CONTRACT_ADDRESS}}')
)
AND (
    topic0 = '0x...' -- CoursePurchased
    OR topic0 = '0x...' -- ItemPurchased
)
AND block_time >= CURRENT_DATE - INTERVAL '90' DAY
GROUP BY date
ORDER BY date;
```

#### Payment Types Distribution
```sql
-- Query: Payment Types (USDC vs ETH)
SELECT 
    CASE 
        WHEN contract_address = LOWER('{{USDC_ADDRESS}}') THEN 'USDC'
        ELSE 'ETH'
    END as payment_type,
    COUNT(*) as transaction_count,
    SUM(bytea2numeric_v3(data) / POWER(10, 6)) as total_volume
FROM base.logs
WHERE (
    contract_address = LOWER('{{COURSE_CONTRACT_ADDRESS}}')
    OR contract_address = LOWER('{{MARKETPLACE_CONTRACT_ADDRESS}}')
)
AND block_time >= DATE('2024-01-01')
GROUP BY payment_type;
```

#### Revenue Over Time
```sql
-- Query: Daily Revenue
SELECT 
    DATE_TRUNC('day', block_time) as date,
    SUM(bytea2numeric_v3(data) / 1e6) as daily_revenue_usdc,
    COUNT(*) as transaction_count
FROM base.logs
WHERE (
    contract_address = LOWER('{{COURSE_CONTRACT_ADDRESS}}')
    OR contract_address = LOWER('{{MARKETPLACE_CONTRACT_ADDRESS}}')
)
AND (
    topic0 = '0x...' -- Purchase events
)
AND block_time >= CURRENT_DATE - INTERVAL '90' DAY
GROUP BY date
ORDER BY date;
```

#### Detailed Transaction Table
```sql
-- Query: Recent Transactions
SELECT 
    block_time as timestamp,
    tx_hash,
    '0x' || encode(substring(topic1 from 13 for 20), 'hex') as buyer,
    '0x' || encode(substring(topic2 from 13 for 20), 'hex') as seller,
    bytea2numeric_v3(data) / 1e6 as amount_usdc,
    CASE 
        WHEN contract_address = LOWER('{{COURSE_CONTRACT_ADDRESS}}') THEN 'Course'
        WHEN contract_address = LOWER('{{MARKETPLACE_CONTRACT_ADDRESS}}') THEN 'NFT'
        ELSE 'Other'
    END as transaction_type
FROM base.logs
WHERE (
    contract_address = LOWER('{{COURSE_CONTRACT_ADDRESS}}')
    OR contract_address = LOWER('{{MARKETPLACE_CONTRACT_ADDRESS}}')
)
AND block_time >= CURRENT_DATE - INTERVAL '30' DAY
ORDER BY block_time DESC
LIMIT 100;
```

---

### 5. Course Performance

#### Most Purchased Courses
```sql
-- Query: Top 10 Courses by Sales
SELECT 
    '0x' || encode(substring(topic1 from 13 for 20), 'hex') as course_id,
    COUNT(*) as total_purchases,
    SUM(bytea2numeric_v3(data) / 1e6) as total_revenue_usdc,
    '0x' || encode(substring(topic2 from 13 for 20), 'hex') as creator_address
FROM base.logs
WHERE contract_address = LOWER('{{COURSE_CONTRACT_ADDRESS}}')
AND topic0 = '0x...' -- CoursePurchased event
AND block_time >= DATE('2024-01-01')
GROUP BY course_id, creator_address
ORDER BY total_purchases DESC
LIMIT 10;
```

#### Revenue Per Course
```sql
-- Query: Course Revenue Distribution
SELECT 
    '0x' || encode(substring(topic1 from 13 for 20), 'hex') as course_id,
    SUM(bytea2numeric_v3(data) / 1e6) as revenue_usdc,
    COUNT(*) as purchase_count,
    SUM(bytea2numeric_v3(data) / 1e6) / NULLIF(COUNT(*), 0) as avg_price_usdc
FROM base.logs
WHERE contract_address = LOWER('{{COURSE_CONTRACT_ADDRESS}}')
AND topic0 = '0x...' -- CoursePurchased event
GROUP BY course_id
ORDER BY revenue_usdc DESC;
```

#### Course Uploads Over Time
```sql
-- Query: Course Uploads Per Week
SELECT 
    DATE_TRUNC('week', block_time) as week,
    COUNT(*) as courses_uploaded
FROM base.logs
WHERE contract_address = LOWER('{{COURSE_CONTRACT_ADDRESS}}')
AND topic0 = '0x...' -- CourseUploaded event
AND block_time >= DATE('2024-01-01')
GROUP BY week
ORDER BY week;
```

---

## Event Signatures Reference

You'll need to get the actual event signatures from your deployed contracts. Here's how:

### Getting Event Signatures

1. Go to BaseScan for your contract
2. Navigate to "Events" tab
3. Copy the topic0 hash for each event

**Common Events to Look For:**
- `CoursePurchased` - When a course is bought
- `CourseUploaded` - When a course is created
- `ItemPurchased` - When an NFT is bought
- `ItemListed` - When an NFT is listed
- `CertificateMinted` - When a certificate is issued
- `Transfer` - For token transfers

Example:
```
CoursePurchased(address indexed buyer, uint256 indexed courseId, address indexed seller, uint256 amount)
// topic0 = keccak256("CoursePurchased(address,uint256,address,uint256)")
```

---

## Dashboard Setup Steps

### Step 1: Create New Dashboard
1. Log into [dune.com](https://dune.com)
2. Click "New Dashboard"
3. Name it "UniqueHub Analytics"

### Step 2: Add Contract Addresses
1. Go to Dashboard Settings → Parameters
2. Add parameters for each contract address:
   - `COURSE_CONTRACT_ADDRESS`
   - `MARKETPLACE_CONTRACT_ADDRESS`
   - `CERTIFICATE_CONTRACT_ADDRESS`
   - `UNIQUE_NFT_ADDRESS`
   - `UNIQHUB_TOKEN_ADDRESS`

### Step 3: Create Queries
1. Click "New Query" for each SQL query above
2. Name queries descriptively (e.g., "Total Users", "Daily Revenue")
3. Save each query

### Step 4: Add Visualizations
1. **Counter** - For KPIs (total users, revenue, etc.)
2. **Bar Chart** - For top earners, course performance
3. **Line Chart** - For time series (DAU, revenue over time)
4. **Pie Chart** - For payment types distribution
5. **Table** - For detailed transaction logs

### Step 5: Style the Dashboard

**UniqueHub Blue Theme:**
```css
Primary Color: #0EA5E9 (sky-500)
Secondary Color: #3B82F6 (blue-500)
Accent Color: #8B5CF6 (violet-500)
Background: #0F172A (slate-900)
```

**Apply Theme:**
1. Dashboard Settings → Theme
2. Set custom colors:
   - Primary: `#0EA5E9`
   - Background: `#0F172A`
   - Text: `#F8FAFC`
3. Use gradient overlays for hero sections

### Step 6: Organize Layout
Create sections in this order:
1. **Overview** (4 columns) - KPIs
2. **Creator Analytics** (2 columns) - Top earners, earnings chart
3. **User Growth** (2 columns) - DAU, cumulative users
4. **Transaction Metrics** (2 columns) - Volume, revenue
5. **Course Performance** (full width) - Table and charts

---

## Advanced Tips

### Refresh Rates
- Set queries to auto-refresh every 30 minutes
- Enable real-time mode for critical metrics

### Alerts
- Set up alerts for:
  - Daily revenue drops > 20%
  - Zero transactions for > 24 hours
  - New creator milestones

### Embedding
- Make dashboard public
- Get embed code from Settings → Sharing
- Add iframe to your app's admin panel

### Optimization
- Use materialized views for frequently accessed data
- Index by contract_address and block_time
- Limit date ranges to improve performance

---

## Testing Your Dashboard

1. **Verify contract addresses** are correct
2. **Test each query** individually
3. **Check data accuracy** against BaseScan
4. **Compare totals** with your Supabase database
5. **Monitor query performance** (aim for < 5s)

---

## Maintenance

**Weekly:**
- Check for missing data
- Verify event signatures still match
- Review query performance

**Monthly:**
- Add new metrics as platform grows
- Update visualizations based on usage
- Archive old transaction tables

---

## Support Resources

- [Dune Docs](https://docs.dune.com/)
- [Dune Discord](https://discord.gg/dunecom)
- [Base Chain Docs](https://docs.base.org/)
- [BaseScan](https://basescan.org/)

---

## Next Steps

1. ✅ Gather all contract addresses
2. ✅ Get event signatures from BaseScan
3. ✅ Create Dune account
4. ✅ Set up dashboard with parameters
5. ✅ Add queries one section at a time
6. ✅ Test and verify data accuracy
7. ✅ Apply UniqueHub theme
8. ✅ Share dashboard publicly
9. ✅ (Optional) Embed in app

---

**Note:** Remember to replace all placeholder addresses (`0x...`) and event signatures with your actual contract data. The event signatures (`topic0`) are crucial for filtering the correct events from the blockchain logs.
