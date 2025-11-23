import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const courses = [
      {
        title: "Web3 Fundamentals",
        category: "blockchain",
        difficulty_level: "beginner",
        description: "Master the basics of decentralized technology and blockchain",
        icon_url: "🌐",
        total_modules: 10
      },
      {
        title: "Smart Contract Basics",
        category: "development",
        difficulty_level: "beginner",
        description: "Learn to read and understand smart contracts",
        icon_url: "📝",
        total_modules: 8
      },
      {
        title: "NFT Essentials",
        category: "nft",
        difficulty_level: "beginner",
        description: "Understand NFTs and digital ownership",
        icon_url: "🎨",
        total_modules: 6
      },
      {
        title: "Crypto Wallets",
        category: "security",
        difficulty_level: "beginner",
        description: "Secure your digital assets effectively",
        icon_url: "🔐",
        total_modules: 5
      },
      {
        title: "DeFi Introduction",
        category: "finance",
        difficulty_level: "intermediate",
        description: "Explore decentralized finance protocols",
        icon_url: "💰",
        total_modules: 12
      },
      {
        title: "Token Economics",
        category: "economics",
        difficulty_level: "intermediate",
        description: "Understand tokenomics and value creation",
        icon_url: "💎",
        total_modules: 9
      },
      {
        title: "DAO Governance",
        category: "governance",
        difficulty_level: "intermediate",
        description: "Participate in decentralized organizations",
        icon_url: "🏛️",
        total_modules: 7
      },
      {
        title: "Layer 2 Solutions",
        category: "blockchain",
        difficulty_level: "intermediate",
        description: "Scale blockchain with L2 technology",
        icon_url: "⚡",
        total_modules: 8
      },
      {
        title: "Advanced Smart Contracts",
        category: "development",
        difficulty_level: "advanced",
        description: "Build complex blockchain applications",
        icon_url: "🛠️",
        total_modules: 15
      },
      {
        title: "Security Best Practices",
        category: "security",
        difficulty_level: "advanced",
        description: "Protect against common vulnerabilities",
        icon_url: "🛡️",
        total_modules: 10
      }
    ];

    // Insert courses
    const { data: insertedCourses, error: coursesError } = await supabaseClient
      .from('learning_courses')
      .insert(courses)
      .select();

    if (coursesError) throw coursesError;

    // Generate modules for each course
    for (const course of insertedCourses) {
      const modules = [];
      
      for (let i = 1; i <= course.total_modules; i++) {
        modules.push({
          course_id: course.id,
          module_number: i,
          title: `Module ${i}: ${getModuleTitle(course.category, i)}`,
          description: getModuleDescription(course.category, i),
          points_reward: 10,
          is_locked: i > 1,
          content: {
            type: "lesson",
            sections: [
              {
                type: "explanation",
                content: getModuleContent(course.category, i)
              },
              {
                type: "quiz",
                questions: [
                  {
                    question: getQuizQuestion(course.category, i),
                    options: ["Option A", "Option B", "Option C", "Option D"],
                    correct: 0
                  }
                ]
              }
            ]
          }
        });
      }

      const { error: modulesError } = await supabaseClient
        .from('learning_modules')
        .insert(modules);

      if (modulesError) throw modulesError;
    }

    // Create learning pools
    const pools = [
      {
        title: "Web3 Mastery Challenge",
        description: "Complete advanced modules and compete for rewards",
        required_streak: 7,
        reward_amount: 1000,
        number_of_winners: 10,
        status: "active",
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        title: "NFT Creator Sprint",
        description: "Learn NFT creation and earn exclusive prizes",
        required_streak: 5,
        reward_amount: 500,
        number_of_winners: 15,
        status: "active",
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        title: "DeFi Expert Path",
        description: "Master DeFi protocols and win rewards",
        required_streak: 10,
        reward_amount: 2000,
        number_of_winners: 5,
        status: "active",
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    const { error: poolsError } = await supabaseClient
      .from('learning_pools')
      .insert(pools);

    if (poolsError) throw poolsError;

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Learning courses and pools generated successfully",
        courses: insertedCourses.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function getModuleTitle(category: string, moduleNumber: number): string {
  const titles: Record<string, string[]> = {
    blockchain: ["Introduction", "Blocks & Chains", "Consensus", "Networks", "Transactions", "Mining", "Nodes", "Forks", "Scaling", "Future"],
    development: ["Setup", "Basics", "Functions", "Events", "Storage", "Testing", "Deployment", "Integration"],
    nft: ["What are NFTs", "Standards", "Minting", "Marketplaces", "Royalties", "Use Cases"],
    security: ["Wallet Setup", "Private Keys", "Backup", "Multi-sig", "Hardware Wallets"],
    finance: ["DeFi Intro", "Lending", "Borrowing", "Yield", "Liquidity", "Staking", "Swaps", "Bridges", "Risks", "Strategies", "Governance", "Future"],
    economics: ["Token Types", "Supply Models", "Distribution", "Incentives", "Governance", "Valuation", "Market Dynamics", "Sustainability", "Case Studies"],
    governance: ["DAO Basics", "Voting", "Proposals", "Treasury", "Participation", "Models", "Tools"],
  };
  
  const categoryTitles = titles[category] || titles.blockchain;
  return categoryTitles[(moduleNumber - 1) % categoryTitles.length];
}

function getModuleDescription(category: string, moduleNumber: number): string {
  return `Learn essential concepts in ${category}. Complete this module to earn points and build your streak.`;
}

function getModuleContent(category: string, moduleNumber: number): string {
  const content: Record<string, string> = {
    blockchain: "Blockchain is a distributed ledger technology that maintains a secure and decentralized record of transactions.",
    development: "Smart contracts are self-executing programs that run on the blockchain.",
    nft: "Non-fungible tokens represent unique digital or physical assets on the blockchain.",
    security: "Secure your crypto assets by understanding wallet security and best practices.",
    finance: "Decentralized finance enables financial services without traditional intermediaries.",
    economics: "Token economics drives value and incentives in blockchain ecosystems.",
    governance: "DAOs enable community-driven decision making through decentralized governance.",
  };
  
  return content[category] || content.blockchain;
}

function getQuizQuestion(category: string, moduleNumber: number): string {
  const questions: Record<string, string> = {
    blockchain: "What is the primary benefit of blockchain technology?",
    development: "What is a smart contract?",
    nft: "What makes an NFT unique?",
    security: "What is the most important thing to protect?",
    finance: "What does DeFi stand for?",
    economics: "What is tokenomics?",
    governance: "What is a DAO?",
  };
  
  return questions[category] || questions.blockchain;
}
