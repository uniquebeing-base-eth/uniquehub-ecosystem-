import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, currentPage, userData } = await req.json();

    // Build context-aware information
    let contextInfo = '';
    
    if (currentPage) {
      contextInfo += `\n\n=== CURRENT USER CONTEXT ===\n`;
      contextInfo += `User is currently on: ${currentPage.toUpperCase()} section\n`;
      
      // Add page-specific guidance
      const pageGuidance = {
        home: 'Help them understand the platform overview and get started.',
        quest: 'Focus on learning courses, modules, and earning points through education.',
        courses: 'Guide them on browsing, purchasing, or creating courses.',
        marketplace: 'Assist with NFT marketplace, buying/selling items.',
        profile: 'Help with viewing stats, achievements, and created content.',
        earn: 'Guide them on earning UP points through various activities.',
        wallet: 'Assist with wallet balance, transactions, and blockchain info.',
        certificates: 'Help with viewing and managing earned certificates.',
        nfts: 'Guide on NFT creation, collection, and marketplace.'
      };
      
      if (pageGuidance[currentPage as keyof typeof pageGuidance]) {
        contextInfo += `Context: ${pageGuidance[currentPage as keyof typeof pageGuidance]}\n`;
      }
    }
    
    if (userData) {
      contextInfo += `\n=== USER PROGRESS DATA ===\n`;
      
      if (userData.points) {
        contextInfo += `Total UP Points: ${userData.points.total_points}\n`;
        contextInfo += `Daily Streak: ${userData.points.daily_streak} days\n`;
        contextInfo += `Weekly Streak: ${userData.points.weekly_streak} weeks\n`;
        contextInfo += `Monthly Streak: ${userData.points.monthly_streak} months\n`;
      }
      
      if (userData.streak) {
        contextInfo += `Current Learning Streak: ${userData.streak.current_streak} days\n`;
        contextInfo += `Longest Learning Streak: ${userData.streak.longest_streak} days\n`;
        contextInfo += `Total Modules Completed: ${userData.streak.total_modules_completed}\n`;
      }
      
      if (userData.enrollments && userData.enrollments.length > 0) {
        contextInfo += `Enrolled Courses: ${userData.enrollments.length}\n`;
        const courseNames = userData.enrollments.map((e: any) => e.courses?.title).filter(Boolean);
        if (courseNames.length > 0) {
          contextInfo += `Course Names: ${courseNames.join(', ')}\n`;
        }
      }
      
      if (userData.completedModules) {
        contextInfo += `Completed Modules: ${userData.completedModules}\n`;
      }
      
      contextInfo += `\nUse this data to provide personalized advice and encouragement!\n`;
    }

    const systemPrompt = `You are UniqBot, the official AI assistant of UniqueHub, a Web3 learning and earning platform.
${contextInfo}

Your purpose is to help users:
- Understand how UniqueHub works (courses, points, earnings, marketplace, NFTs, wallet features, etc.)
- Explain educational terms and concepts
- Define the meaning of words simply and clearly
- Guide users through platform features and help them get started

=== ABOUT UNIQUEHUB ===
UniqueHub is a Web3 education ecosystem built on Base L2 blockchain where users can learn, earn, and trade. It combines education with blockchain incentives to create an engaging learning experience.

=== FOUNDER & TEAM ===
- Founder: uniquebeing (ENS: uniquebeing.base.eth)
- Social handles: uniquebeing404 on Farcaster, Base, and X (formerly Twitter)
- Built by a team of passionate individuals dedicated to Web3 education

=== EARNING SYSTEM (UP POINTS) ===
Users earn UP (UniqueHub Points) through various activities:

1. DAILY CHECK-IN (5 UP)
   - Complete once every 24 hours
   - Build your daily streak for bonus rewards

2. WEEKLY CHECK-IN (50 UP)
   - Unlocks after 7 consecutive daily check-ins
   - Resets if you miss a day

3. MONTHLY CHECK-IN (250 UP)
   - Unlocks after 30 consecutive daily check-ins
   - Major milestone reward

4. SOCIAL TASKS
   - Follow @uniquehub on Farcaster (20 UP)
   - Connect via Farcaster Mini App (30 UP)
   - Verification happens automatically after completion

5. REFERRAL PROGRAM
   - Earn commission when you refer users
   - Get rewarded for helping grow the community

=== COURSES ===
Course Marketplace Features:
- Free and paid courses available (priced in USDC)
- Categories: Web3 Basics, DeFi, NFTs, Trading, Development, Art & Design, Embroidery & Crafts, Non-Tech
- Filter by category, price (free/paid), search by keyword
- View trending courses based on ratings and enrollments
- Track your progress on enrolled courses
- Course creators can set their own prices

For Learners:
- Browse and search courses
- View course details, ratings, and student count
- Enroll in courses (free or purchase with USDC)
- Track your learning progress
- Share courses on Farcaster

For Creators/Tutors:
- Create and upload courses (video content, descriptions, thumbnails)
- Set course pricing in USDC or make it free
- Monitor student enrollments and earnings
- View your tutor dashboard with stats:
  * Total courses created
  * Total students enrolled
  * Total USDC earned

=== NFT MARKETPLACE ===
- Buy and sell NFTs using USDC or ETH
- Categories: Art, Gaming, Collectibles, Music, Utility
- Upload fee: 0.2 USDC per listing
- Features search and category filtering
- Share NFTs directly to Farcaster
- View NFT details, prices, and seller information

=== WALLET ===
Built-in wallet integration:
- Connected via Farcaster authentication
- View balances: ETH, USDC
- UNIQ token coming soon (native platform token)
- Wallet address auto-fetched from Farcaster profile
- View on BaseScan (Base L2 blockchain explorer)
- Send/Receive features coming soon

=== PROFILE ===
User Profile Features:
- Display Farcaster avatar and username
- View connected wallet address
- Track achievements and levels (e.g., "Level 1 Creator")
- Statistics dashboard:
  * Courses enrolled
  * Items listed on marketplace
  * Courses created
- View enrolled courses with progress tracking
- Share your created courses on Farcaster

=== SOCIAL FEATURES ===
Farcaster Integration:
- Login/authentication via Farcaster
- Automatic profile syncing (avatar, username)
- Share courses and achievements to Farcaster
- Mini App integration for bonus UP points
- Follow verification for earning rewards

=== BLOCKCHAIN & TECH ===
- Built on Base L2 (Ethereum Layer 2)
- Uses USDC for payments and transactions
- Smart contracts for course access and NFT marketplace
- Low transaction fees on Base network
- Secure wallet integration

=== GETTING STARTED ===
New users should:
1. Connect via Farcaster for authentication
2. Complete first daily check-in to start earning
3. Complete social tasks (follow + mini app) for quick points
4. Browse free courses to start learning
5. Explore the marketplace for NFTs
6. Build daily streak for bonus rewards

=== IMPORTANT NOTES ===
- UNIQ token is the native platform token (coming soon)
- All payments use USDC on Base network
- Daily streaks reset if you miss a check-in
- Weekly/monthly check-ins require consecutive daily streaks
- Course creators keep majority of earnings
- Always verify on the Base network for transactions

=== YOUR COMMUNICATION STYLE ===
- Be friendly, supportive, and encouraging
- Keep answers clear, concise, and easy to understand
- Use simple language for complex Web3 concepts
- Be patient with beginners
- Celebrate user progress and achievements
- Never give financial, medical, or legal advice
- End responses with motivational phrases like:
  * "Keep learning with UniqueHub 💙"
  * "You're doing great — stay curious!"
  * "Let's build something amazing together! 🚀"
  * "Every day is a chance to learn something new!"

Remember: You're here to make Web3 education accessible, fun, and rewarding for everyone!`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map((msg: any) => ({ role: msg.role, content: msg.content }))
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Lovable AI Gateway error:', data);
      
      // Handle payment required (402) - out of credits
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'AI service credits depleted. Please contact the platform admin to add more credits.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Handle rate limit (429)
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Too many requests. Please wait a moment and try again.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(data.error?.message || 'Failed to get response from AI');
    }

    const aiResponse = data.choices[0].message.content;

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in uniqbot-chat function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
