import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fallback AI providers in order of priority
async function callAI(systemPrompt: string, chatMessages: any[]): Promise<string> {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...chatMessages.map((msg: any) => ({ role: msg.role, content: msg.content }))
  ];

  // 1. Try Lovable AI Gateway first
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
  if (lovableApiKey) {
    try {
      const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages,
          temperature: 0.7,
          max_tokens: 500,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.choices[0].message.content;
      }
      console.log('Lovable gateway failed:', res.status);
    } catch (e) {
      console.log('Lovable gateway error:', e);
    }
  }

  // 2. Try OpenAI
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  if (openaiKey) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          temperature: 0.7,
          max_tokens: 500,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.choices[0].message.content;
      }
      console.log('OpenAI failed:', res.status);
    } catch (e) {
      console.log('OpenAI error:', e);
    }
  }

  // 3. Try Groq (free tier)
  const groqKey = Deno.env.get('GROQ_API_KEY');
  if (groqKey) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages,
          temperature: 0.7,
          max_tokens: 500,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.choices[0].message.content;
      }
      console.log('Groq failed:', res.status);
    } catch (e) {
      console.log('Groq error:', e);
    }
  }

  // 4. Try Together AI (free tier)
  const togetherKey = Deno.env.get('TOGETHER_API_KEY');
  if (togetherKey) {
    try {
      const res = await fetch('https://api.together.xyz/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${togetherKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
          messages,
          temperature: 0.7,
          max_tokens: 500,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.choices[0].message.content;
      }
      console.log('Together AI failed:', res.status);
    } catch (e) {
      console.log('Together AI error:', e);
    }
  }

  // 5. Hardcoded fallback response
  return "I'm sorry, I'm currently experiencing technical difficulties. Please try again in a moment! In the meantime, feel free to explore UniqueHub's courses, earning system, and marketplace. Keep learning! 💙";
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, currentPage, userData } = await req.json();

    let contextInfo = '';
    
    if (currentPage) {
      contextInfo += `\n\n=== CURRENT USER CONTEXT ===\n`;
      contextInfo += `User is currently on: ${currentPage.toUpperCase()} section\n`;
      
      const pageGuidance: Record<string, string> = {
        home: 'Help them understand the platform overview and get started.',
        quest: 'Focus on learning courses, modules, and earning points through education.',
        courses: 'Guide them on browsing, purchasing, or creating courses.',
        marketplace: 'Assist with NFT marketplace, buying/selling items.',
        profile: 'Help with viewing stats, achievements, and created content.',
        earn: 'Guide them on earning UP points through various activities.',
        wallet: 'Assist with wallet balance, transactions, and blockchain info.',
        certificates: 'Help with viewing and managing earned certificates.',
        nfts: 'Guide on NFT collection and marketplace.'
      };
      
      if (pageGuidance[currentPage]) {
        contextInfo += `Context: ${pageGuidance[currentPage]}\n`;
      }
    }
    
    if (userData) {
      contextInfo += `\n=== USER PROGRESS DATA ===\n`;
      if (userData.points) {
        contextInfo += `Total UP Points: ${userData.points.total_points || 0}\n`;
        contextInfo += `Daily Streak: ${userData.points.daily_streak || 0} days\n`;
        contextInfo += `Weekly Streak: ${userData.points.weekly_streak || 0} weeks\n`;
        contextInfo += `Monthly Streak: ${userData.points.monthly_streak || 0} months\n`;
      }
      if (userData.streak) {
        contextInfo += `Current Learning Streak: ${userData.streak.current_streak || 0} days\n`;
        contextInfo += `Longest Learning Streak: ${userData.streak.longest_streak || 0} days\n`;
        contextInfo += `Total Modules Completed: ${userData.streak.total_modules_completed || 0}\n`;
      }
      if (userData.enrollments?.length > 0) {
        contextInfo += `Enrolled Courses: ${userData.enrollments.length}\n`;
        const courseNames = userData.enrollments.map((e: any) => e.courses?.title).filter(Boolean);
        if (courseNames.length > 0) contextInfo += `Course Names: ${courseNames.join(', ')}\n`;
      } else {
        contextInfo += `Enrolled Courses: 0\n`;
      }
      if (userData.completedModules !== undefined) {
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
UniqueHub is a Web3 education ecosystem built on Base L2 blockchain where users can learn, earn, and trade. Website: uniquehub.xyz

=== FOUNDER & TEAM ===
- Founder: uniquebeing (ENS: uniquebeing.base.eth)
- Social handles: uniquebeing404 on Farcaster, Base, and X (formerly Twitter)

=== EARNING SYSTEM (UP POINTS) ===
1. DAILY CHECK-IN (5 UP) - Complete once every 24 hours
2. WEEKLY CHECK-IN (50 UP) - After 7 consecutive daily check-ins
3. MONTHLY CHECK-IN (250 UP) - After 30 consecutive daily check-ins
4. SOCIAL TASKS - Follow @uniquehub on Farcaster (20 UP), Connect via Mini App (30 UP)

=== COURSES ===
- Free and paid courses (priced in USDC)
- Categories: Web3 Basics, DeFi, NFTs, Trading, Development, Art & Design, Embroidery & Crafts, Non-Tech
- Course creators can set their own prices
- Track progress, earn certificates as NFTs

=== NFT MARKETPLACE ===
- Buy and sell NFTs using USDC or ETH
- Categories: Art, Gaming, Collectibles, Music, Utility

=== WALLET ===
- Connected via Farcaster authentication
- View balances: ETH, USDC on Base L2

=== SOCIAL FEATURES ===
- Share to Farcaster and X/Twitter
- Profile stats sharing
- Course completion certificates shareable on social media

=== YOUR COMMUNICATION STYLE ===
- Be friendly, supportive, and encouraging
- Keep answers clear, concise, and easy to understand
- Use simple language for complex Web3 concepts
- Never give financial, medical, or legal advice
- End responses with motivational phrases

Remember: You're here to make Web3 education accessible, fun, and rewarding for everyone!`;

    const aiResponse = await callAI(systemPrompt, messages);

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
