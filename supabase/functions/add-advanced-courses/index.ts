import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Define the 6 new courses
    const courses = [
      {
        title: "DeFi for Beginners",
        description: "Learn the fundamentals of decentralized finance, from wallets to yield farming.",
        category: "defi",
        difficulty_level: "beginner",
        total_modules: 10,
        is_active: true
      },
      {
        title: "Smart Contracts Basics",
        description: "Understand how smart contracts work, their use cases, and limitations.",
        category: "blockchain",
        difficulty_level: "beginner",
        total_modules: 10,
        is_active: true
      },
      {
        title: "AI Basics",
        description: "Discover the fundamentals of artificial intelligence and machine learning.",
        category: "technology",
        difficulty_level: "beginner",
        total_modules: 10,
        is_active: true
      },
      {
        title: "Prompt Engineering",
        description: "Master the art of writing effective prompts for AI systems.",
        category: "technology",
        difficulty_level: "beginner",
        total_modules: 10,
        is_active: true
      },
      {
        title: "Intro to Cybersecurity",
        description: "Learn essential security practices to protect your digital life.",
        category: "security",
        difficulty_level: "beginner",
        total_modules: 10,
        is_active: true
      },
      {
        title: "How to Stay Safe in Crypto",
        description: "Essential security practices for protecting your crypto assets.",
        category: "security",
        difficulty_level: "beginner",
        total_modules: 10,
        is_active: true
      }
    ];

    // Insert courses
    const { data: insertedCourses, error: coursesError } = await supabase
      .from('learning_courses')
      .insert(courses)
      .select();

    if (coursesError) {
      console.error('Error inserting courses:', coursesError);
      throw coursesError;
    }

    console.log('Inserted courses:', insertedCourses);

    // Get course IDs by title
    const { data: allCourses, error: fetchError } = await supabase
      .from('learning_courses')
      .select('id, title')
      .in('title', courses.map(c => c.title));

    if (fetchError) throw fetchError;

    const courseMap = new Map(allCourses?.map(c => [c.title, c.id]) || []);

    // Define all modules for each course
    const allModules = [
      // DeFi for Beginners modules
      ...createDefiModules(courseMap.get("DeFi for Beginners")!),
      // Smart Contracts Basics modules
      ...createSmartContractsModules(courseMap.get("Smart Contracts Basics")!),
      // AI Basics modules
      ...createAIBasicsModules(courseMap.get("AI Basics")!),
      // Prompt Engineering modules
      ...createPromptEngineeringModules(courseMap.get("Prompt Engineering")!),
      // Intro to Cybersecurity modules
      ...createCybersecurityModules(courseMap.get("Intro to Cybersecurity")!),
      // How to Stay Safe in Crypto modules
      ...createCryptoSafetyModules(courseMap.get("How to Stay Safe in Crypto")!)
    ];

    // Insert modules
    const { data: insertedModules, error: modulesError } = await supabase
      .from('learning_modules')
      .insert(allModules)
      .select();

    if (modulesError) {
      console.error('Error inserting modules:', modulesError);
      throw modulesError;
    }

    console.log('Inserted modules:', insertedModules?.length);

    return new Response(
      JSON.stringify({
        success: true,
        courses: insertedCourses?.length || 0,
        modules: insertedModules?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function createDefiModules(courseId: string) {
  return [
    {
      course_id: courseId,
      module_number: 1,
      title: "What is DeFi",
      description: "Learn the basics of decentralized finance",
      points_reward: 10,
      is_locked: false,
      content: {
        sections: [
          {
            title: "Understanding DeFi",
            content: "DeFi means decentralized finance. It lets anyone use financial tools without banks. Everything runs on smart contracts."
          }
        ],
        quiz: [
          {
            question: "DeFi stands for:",
            options: ["Decentralized Finance", "Digital Files", "Defined Finance"],
            correctAnswer: 0
          },
          {
            question: "DeFi removes the need for:",
            options: ["Banks", "Phones", "Internet"],
            correctAnswer: 0
          },
          {
            question: "DeFi is powered by:",
            options: ["Smart contracts", "USB drives", "Paper forms"],
            correctAnswer: 0
          }
        ]
      }
    },
    {
      course_id: courseId,
      module_number: 2,
      title: "Why DeFi Matters",
      description: "Discover the importance of decentralized finance",
      points_reward: 10,
      is_locked: true,
      content: {
        sections: [
          {
            title: "The Power of DeFi",
            content: "DeFi gives open access. Anyone can save, trade, borrow, or lend. No permission is needed. It's global and available 24/7."
          }
        ],
        quiz: [
          {
            question: "DeFi is open to:",
            options: ["Everyone", "Only banks", "No one"],
            correctAnswer: 0
          },
          {
            question: "DeFi works:",
            options: ["24/7", "Only on weekends", "At night only"],
            correctAnswer: 0
          },
          {
            question: "DeFi gives access to:",
            options: ["Savings and trading", "Borrowing and lending", "All of the above"],
            correctAnswer: 2
          }
        ]
      }
    },
    {
      course_id: courseId,
      module_number: 3,
      title: "DeFi Wallets",
      description: "Learn about wallets for DeFi",
      points_reward: 10,
      is_locked: true,
      content: {
        sections: [
          {
            title: "Your DeFi Wallet",
            content: "To use DeFi, you need a wallet. Examples include MetaMask, Coinbase Wallet, and Trust Wallet. You control your keys."
          }
        ],
        quiz: [
          {
            question: "A DeFi wallet lets you:",
            options: ["Use DeFi apps", "Control your assets", "Both A and B"],
            correctAnswer: 2
          },
          {
            question: "You must protect your:",
            options: ["Seed phrase", "Favorite movies", "Phone number"],
            correctAnswer: 0
          },
          {
            question: "MetaMask is a:",
            options: ["DeFi wallet", "Bank card", "VPN"],
            correctAnswer: 0
          }
        ]
      }
    },
    {
      course_id: courseId,
      module_number: 4,
      title: "DeFi Tokens",
      description: "Understand tokens in DeFi",
      points_reward: 10,
      is_locked: true,
      content: {
        sections: [
          {
            title: "Tokens in DeFi",
            content: "DeFi uses tokens like stablecoins and governance tokens. They help users trade, earn, and vote on updates."
          }
        ],
        quiz: [
          {
            question: "Stablecoins are:",
            options: ["Tokens tied to stable value", "Tokens that change every second", "Gold"],
            correctAnswer: 0
          },
          {
            question: "Governance tokens let you:",
            options: ["Vote on protocol changes", "Drive cars", "Buy food"],
            correctAnswer: 0
          },
          {
            question: "Tokens in DeFi are:",
            options: ["Digital", "Paper", "Physical"],
            correctAnswer: 0
          }
        ]
      }
    },
    {
      course_id: courseId,
      module_number: 5,
      title: "Lending in DeFi",
      description: "Learn how lending works in DeFi",
      points_reward: 10,
      is_locked: true,
      content: {
        sections: [
          {
            title: "DeFi Lending",
            content: "You can lend your tokens and earn interest. Smart contracts handle everything. No bank approval is needed."
          }
        ],
        quiz: [
          {
            question: "DeFi lending gives you:",
            options: ["Interest", "Nothing", "Loans"],
            correctAnswer: 0
          },
          {
            question: "Lending is controlled by:",
            options: ["Smart contracts", "Bank staff", "Teachers"],
            correctAnswer: 0
          },
          {
            question: "You need approval to lend?",
            options: ["No", "Yes", "Sometimes"],
            correctAnswer: 0
          }
        ]
      }
    },
    {
      course_id: courseId,
      module_number: 6,
      title: "Borrowing in DeFi",
      description: "Understand DeFi borrowing",
      points_reward: 10,
      is_locked: true,
      content: {
        sections: [
          {
            title: "How to Borrow",
            content: "Borrowing in DeFi is simple. You deposit collateral, borrow another asset, and repay later."
          }
        ],
        quiz: [
          {
            question: "To borrow, you need:",
            options: ["Collateral", "Signatures", "ID card"],
            correctAnswer: 0
          },
          {
            question: "You repay the loan:",
            options: ["With interest", "With food", "Never"],
            correctAnswer: 0
          },
          {
            question: "Borrowing is handled by:",
            options: ["Smart contracts", "Bank officers", "Police"],
            correctAnswer: 0
          }
        ]
      }
    },
    {
      course_id: courseId,
      module_number: 7,
      title: "Liquidity Pools",
      description: "Learn about liquidity pools",
      points_reward: 10,
      is_locked: true,
      content: {
        sections: [
          {
            title: "Understanding Pools",
            content: "Liquidity pools hold pairs of tokens. People deposit tokens into pools and earn fees when others trade."
          }
        ],
        quiz: [
          {
            question: "Liquidity pools contain:",
            options: ["Token pairs", "Water", "Air"],
            correctAnswer: 0
          },
          {
            question: "Depositors earn:",
            options: ["Trading fees", "Rent", "Bills"],
            correctAnswer: 0
          },
          {
            question: "Pools are used by:",
            options: ["Traders", "Everyone in DeFi", "Both A and B"],
            correctAnswer: 2
          }
        ]
      }
    },
    {
      course_id: courseId,
      module_number: 8,
      title: "Staking",
      description: "Learn about staking tokens",
      points_reward: 10,
      is_locked: true,
      content: {
        sections: [
          {
            title: "What is Staking",
            content: "Staking means locking tokens to support a network or protocol. In return, you earn rewards over time."
          }
        ],
        quiz: [
          {
            question: "Staking involves:",
            options: ["Locking tokens", "Burning tokens", "Printing tokens"],
            correctAnswer: 0
          },
          {
            question: "You earn:",
            options: ["Rewards", "Debts", "Bills"],
            correctAnswer: 0
          },
          {
            question: "Staking supports:",
            options: ["The network", "Your wallet only", "Nothing"],
            correctAnswer: 0
          }
        ]
      }
    },
    {
      course_id: courseId,
      module_number: 9,
      title: "Yield Farming",
      description: "Explore yield farming strategies",
      points_reward: 10,
      is_locked: true,
      content: {
        sections: [
          {
            title: "Yield Farming Explained",
            content: "Yield farming means using DeFi strategies to maximize rewards. It often combines lending, staking, or providing liquidity."
          }
        ],
        quiz: [
          {
            question: "Yield farming is about:",
            options: ["Earning more rewards", "Real farming", "Growing crops"],
            correctAnswer: 0
          },
          {
            question: "It may involve:",
            options: ["Liquidity pools", "Staking", "All of the above"],
            correctAnswer: 2
          },
          {
            question: "Yield farming can be:",
            options: ["High risk", "Zero risk", "Guaranteed profit"],
            correctAnswer: 0
          }
        ]
      }
    },
    {
      course_id: courseId,
      module_number: 10,
      title: "DeFi Risks",
      description: "Understand the risks in DeFi",
      points_reward: 10,
      is_locked: true,
      content: {
        sections: [
          {
            title: "Being Aware of Risks",
            content: "DeFi has risks like hacks, high fees, and token volatility. Always research before investing."
          }
        ],
        quiz: [
          {
            question: "DeFi risks include:",
            options: ["Hacks", "Volatility", "Both A and B"],
            correctAnswer: 2
          },
          {
            question: "You should always:",
            options: ["Research", "Close your eyes", "Guess"],
            correctAnswer: 0
          },
          {
            question: "DeFi is:",
            options: ["Powerful but risky", "Guaranteed profit", "A bank"],
            correctAnswer: 0
          }
        ]
      }
    }
  ];
}

function createSmartContractsModules(courseId: string) {
  return [
    {
      course_id: courseId,
      module_number: 1,
      title: "What Smart Contracts Are",
      description: "Learn the basics of smart contracts",
      points_reward: 10,
      is_locked: false,
      content: {
        sections: [
          {
            title: "Smart Contract Basics",
            content: "Smart contracts are programs that run on a blockchain. They follow rules automatically without anyone controlling them. Once deployed, they execute exactly as written."
          }
        ],
        quiz: [
          {
            question: "A smart contract is a:",
            options: ["Program on a blockchain", "Paper contract", "Message"],
            correctAnswer: 0
          },
          {
            question: "Smart contracts run:",
            options: ["Automatically", "Only on weekends", "Only with a bank"],
            correctAnswer: 0
          },
          {
            question: "Once deployed, smart contracts:",
            options: ["Follow the code", "Change randomly", "Need permission"],
            correctAnswer: 0
          }
        ]
      }
    },
    {
      course_id: courseId,
      module_number: 2,
      title: "Why Smart Contracts Matter",
      description: "Discover the importance of smart contracts",
      points_reward: 10,
      is_locked: true,
      content: {
        sections: [
          {
            title: "The Value of Smart Contracts",
            content: "Smart contracts remove the need for middlemen. They help automate payments, actions, and processes. This makes everything faster, cheaper, and more transparent."
          }
        ],
        quiz: [
          {
            question: "Smart contracts remove:",
            options: ["Middlemen", "Phones", "WiFi"],
            correctAnswer: 0
          },
          {
            question: "They make things:",
            options: ["Faster", "More expensive", "Confusing"],
            correctAnswer: 0
          },
          {
            question: "Smart contracts are:",
            options: ["Transparent", "Secret", "Hidden"],
            correctAnswer: 0
          }
        ]
      }
    },
    {
      course_id: courseId,
      module_number: 3,
      title: "How Smart Contracts Work",
      description: "Understand the mechanics",
      points_reward: 10,
      is_locked: true,
      content: {
        sections: [
          {
            title: "Contract Mechanics",
            content: "Developers write smart contracts using code. They set rules, conditions, and outcomes. When conditions are met, the contract runs automatically."
          }
        ],
        quiz: [
          {
            question: "Smart contracts are written with:",
            options: ["Code", "Chalk", "Pencils"],
            correctAnswer: 0
          },
          {
            question: "A contract runs when:",
            options: ["Conditions are met", "Someone shouts", "Internet goes off"],
            correctAnswer: 0
          },
          {
            question: "Smart contracts choose outcomes:",
            options: ["Based on rules", "Randomly", "Based on weather"],
            correctAnswer: 0
          }
        ]
      }
    },
    {
      course_id: courseId,
      module_number: 4,
      title: "Where Smart Contracts Run",
      description: "Learn about blockchain platforms",
      points_reward: 10,
      is_locked: true,
      content: {
        sections: [
          {
            title: "Blockchain Platforms",
            content: "Smart contracts run on blockchains like Ethereum, Base, Solana, and others. Each chain uses its own virtual machine and tools."
          }
        ],
        quiz: [
          {
            question: "Smart contracts run on:",
            options: ["Blockchains", "Notebooks", "TV"],
            correctAnswer: 0
          },
          {
            question: "Ethereum uses:",
            options: ["A virtual machine", "A battery", "A printer"],
            correctAnswer: 0
          },
          {
            question: "Different blockchains use:",
            options: ["Different tools", "The same code always", "No code"],
            correctAnswer: 0
          }
        ]
      }
    },
    {
      course_id: courseId,
      module_number: 5,
      title: "Gas Fees",
      description: "Understand transaction costs",
      points_reward: 10,
      is_locked: true,
      content: {
        sections: [
          {
            title: "Understanding Gas",
            content: "Smart contracts need gas to run. Gas fees pay miners or validators to process actions. The more complex the contract, the higher the gas needed."
          }
        ],
        quiz: [
          {
            question: "Gas fees pay:",
            options: ["Validators", "Drivers", "Tailors"],
            correctAnswer: 0
          },
          {
            question: "More complex contracts need:",
            options: ["More gas", "No gas", "Random gas"],
            correctAnswer: 0
          },
          {
            question: "Gas is used to:",
            options: ["Process transactions", "Cook food", "Charge phones"],
            correctAnswer: 0
          }
        ]
      }
    },
    {
      course_id: courseId,
      module_number: 6,
      title: "Smart Contract Use Cases",
      description: "Explore real-world applications",
      points_reward: 10,
      is_locked: true,
      content: {
        sections: [
          {
            title: "Real Applications",
            content: "Smart contracts power DeFi, NFTs, payments, marketplaces, games, and many apps. They handle things automatically and without trust issues."
          }
        ],
        quiz: [
          {
            question: "Smart contracts power:",
            options: ["DeFi", "NFTs", "Both"],
            correctAnswer: 2
          },
          {
            question: "They help apps run:",
            options: ["Automatically", "Only with banks", "By guessing"],
            correctAnswer: 0
          },
          {
            question: "Smart contracts reduce:",
            options: ["Trust issues", "Electricity", "Sound"],
            correctAnswer: 0
          }
        ]
      }
    },
    {
      course_id: courseId,
      module_number: 7,
      title: "Deploying Smart Contracts",
      description: "Learn about deployment",
      points_reward: 10,
      is_locked: true,
      content: {
        sections: [
          {
            title: "Contract Deployment",
            content: "Deployment puts your contract on the blockchain. Once deployed, the code can't be changed easily. Developers must test everything before deploying."
          }
        ],
        quiz: [
          {
            question: "Deployment means:",
            options: ["Putting code on chain", "Printing code", "Saving code on laptop"],
            correctAnswer: 0
          },
          {
            question: "After deployment, code is:",
            options: ["Hard to change", "Easy to delete", "Invisible"],
            correctAnswer: 0
          },
          {
            question: "Developers must:",
            options: ["Test before deploying", "Skip testing", "Guess"],
            correctAnswer: 0
          }
        ]
      }
    },
    {
      course_id: courseId,
      module_number: 8,
      title: "Limitations of Smart Contracts",
      description: "Understand the constraints",
      points_reward: 10,
      is_locked: true,
      content: {
        sections: [
          {
            title: "Contract Limitations",
            content: "Smart contracts can't access outside data directly. They can't be changed easily. They only do what the code says."
          }
        ],
        quiz: [
          {
            question: "Smart contracts can't read:",
            options: ["Outside data directly", "Their own code", "Tokens"],
            correctAnswer: 0
          },
          {
            question: "They can't be changed:",
            options: ["Easily", "Randomly", "Daily"],
            correctAnswer: 0
          },
          {
            question: "Smart contracts follow:",
            options: ["Their code exactly", "Human feelings", "Social media"],
            correctAnswer: 0
          }
        ]
      }
    },
    {
      course_id: courseId,
      module_number: 9,
      title: "Smart Contract Security",
      description: "Learn about security practices",
      points_reward: 10,
      is_locked: true,
      content: {
        sections: [
          {
            title: "Security Matters",
            content: "Security is important. Bugs can cause losses. Audits help check for issues. Users should be careful with new contracts."
          }
        ],
        quiz: [
          {
            question: "Bugs can cause:",
            options: ["Losses", "Gifts", "Savings"],
            correctAnswer: 0
          },
          {
            question: "Audits help find:",
            options: ["Issues", "Friends", "Colors"],
            correctAnswer: 0
          },
          {
            question: "Users should be:",
            options: ["Careful", "Careless", "Lazy"],
            correctAnswer: 0
          }
        ]
      }
    },
    {
      course_id: courseId,
      module_number: 10,
      title: "Smart Contracts in Daily Life",
      description: "See everyday applications",
      points_reward: 10,
      is_locked: true,
      content: {
        sections: [
          {
            title: "Everyday Use",
            content: "Smart contracts are used for loans, trading, memberships, ticketing, rewards, and more. They automate everyday digital actions."
          }
        ],
        quiz: [
          {
            question: "Smart contracts are used in:",
            options: ["Loans", "Rewards", "All of the above"],
            correctAnswer: 2
          },
          {
            question: "They automate:",
            options: ["Digital actions", "Cooking", "Driving"],
            correctAnswer: 0
          },
          {
            question: "Smart contracts help systems run:",
            options: ["Smoothly", "Loudly", "Slowly"],
            correctAnswer: 0
          }
        ]
      }
    }
  ];
}

function createAIBasicsModules(courseId: string) {
  return [
    {
      course_id: courseId,
      module_number: 1,
      title: "What AI Means",
      description: "Introduction to artificial intelligence",
      points_reward: 10,
      is_locked: false,
      content: {
        sections: [
          {
            title: "Understanding AI",
            content: "AI means machines that can learn, think, and make decisions. It helps computers understand patterns and solve problems."
          }
        ],
        quiz: [
          {
            question: "AI stands for:",
            options: ["Artificial Intelligence", "Active Internet", "Automatic Input"],
            correctAnswer: 0
          },
          {
            question: "AI helps computers:",
            options: ["Learn and think", "Sleep", "Play music"],
            correctAnswer: 0
          },
          {
            question: "AI is used to:",
            options: ["Solve problems", "Make food", "Charge phones"],
            correctAnswer: 0
          }
        ]
      }
    },
    {
      course_id: courseId,
      module_number: 2,
      title: "Why AI Matters",
      description: "The importance of AI",
      points_reward: 10,
      is_locked: true,
      content: {
        sections: [
          {
            title: "AI Impact",
            content: "AI helps us do tasks faster. It improves apps, saves time, and helps with predictions. It powers many tools we use daily."
          }
        ],
        quiz: [
          {
            question: "AI helps us:",
            options: ["Work faster", "Work slower", "Stop working"],
            correctAnswer: 0
          },
          {
            question: "AI improves:",
            options: ["Apps", "Shoes", "Paint"],
            correctAnswer: 0
          },
          {
            question: "AI is used:",
            options: ["Every day", "Only once a year", "Never"],
            correctAnswer: 0
          }
        ]
      }
    },
    {
      course_id: courseId,
      module_number: 3,
      title: "Types of AI",
      description: "Different kinds of AI",
      points_reward: 10,
      is_locked: true,
      content: {
        sections: [
          {
            title: "AI Categories",
            content: "There are simple AIs that follow rules, and advanced AIs that learn from data. Some AIs can understand language or recognize images."
          }
        ],
        quiz: [
          {
            question: "Simple AI follows:",
            options: ["Rules", "Weather", "Guessing"],
            correctAnswer: 0
          },
          {
            question: "Advanced AI learns from:",
            options: ["Data", "Music", "Colors"],
            correctAnswer: 0
          },
          {
            question: "AIs can understand:",
            options: ["Language", "Food", "Dreams"],
            correctAnswer: 0
          }
        ]
      }
    },
    {
      course_id: courseId,
      module_number: 4,
      title: "Machine Learning",
      description: "How machines learn",
      points_reward: 10,
      is_locked: true,
      content: {
        sections: [
          {
            title: "Learning Machines",
            content: "Machine learning teaches computers to learn patterns from data. The more examples they see, the better they get."
          }
        ],
        quiz: [
          {
            question: "Machine learning helps computers:",
            options: ["Learn patterns", "Build houses", "Cook"],
            correctAnswer: 0
          },
          {
            question: "More data makes AI:",
            options: ["Better", "Worse", "Sleepy"],
            correctAnswer: 0
          },
          {
            question: "Machine learning is part of:",
            options: ["AI", "Farming", "Sports"],
            correctAnswer: 0
          }
        ]
      }
    },
    {
      course_id: courseId,
      module_number: 5,
      title: "Everyday AI",
      description: "AI in daily life",
      points_reward: 10,
      is_locked: true,
      content: {
        sections: [
          {
            title: "AI Around You",
            content: "AI is in maps, autocorrect, music apps, cameras, and even social platforms. You use AI daily without noticing."
          }
        ],
        quiz: [
          {
            question: "AI is used in:",
            options: ["Maps", "Cameras", "Both"],
            correctAnswer: 2
          },
          {
            question: "We use AI:",
            options: ["Daily", "Only weekends", "Never"],
            correctAnswer: 0
          },
          {
            question: "Autocorrect is powered by:",
            options: ["AI", "Paper", "Wind"],
            correctAnswer: 0
          }
        ]
      }
    },
    {
      course_id: courseId,
      module_number: 6,
      title: "AI in Web3",
      description: "AI and blockchain",
      points_reward: 10,
      is_locked: true,
      content: {
        sections: [
          {
            title: "Web3 AI",
            content: "AI helps detect scams, improve predictions, power trading bots, and create smart automation. It makes Web3 safer and smarter."
          }
        ],
        quiz: [
          {
            question: "AI can detect:",
            options: ["Scams", "Water", "Sand"],
            correctAnswer: 0
          },
          {
            question: "AI helps Web3 become:",
            options: ["Safer", "Slower", "Darker"],
            correctAnswer: 0
          },
          {
            question: "Trading bots use:",
            options: ["AI", "Shoes", "Umbrellas"],
            correctAnswer: 0
          }
        ]
      }
    },
    {
      course_id: courseId,
      module_number: 7,
      title: "Training AI Models",
      description: "How AI learns",
      points_reward: 10,
      is_locked: true,
      content: {
        sections: [
          {
            title: "Model Training",
            content: "Training means feeding AI lots of data. The AI studies it, finds patterns, and learns how to answer or recognize things."
          }
        ],
        quiz: [
          {
            question: "Training means giving AI:",
            options: ["Data", "Toys", "Snacks"],
            correctAnswer: 0
          },
          {
            question: "AI learns by:",
            options: ["Finding patterns", "Sleeping", "Guessing randomly"],
            correctAnswer: 0
          },
          {
            question: "Training helps AI become:",
            options: ["Smarter", "Weaker", "Confused"],
            correctAnswer: 0
          }
        ]
      }
    },
    {
      course_id: courseId,
      module_number: 8,
      title: "Prompts",
      description: "Communicating with AI",
      points_reward: 10,
      is_locked: true,
      content: {
        sections: [
          {
            title: "Using Prompts",
            content: "Prompts are instructions given to AI. Clear prompts give better results. Adding context helps AI understand what you want."
          }
        ],
        quiz: [
          {
            question: "Prompts are:",
            options: ["Instructions", "Songs", "Comics"],
            correctAnswer: 0
          },
          {
            question: "Clear prompts give:",
            options: ["Better results", "Worse results", "No results"],
            correctAnswer: 0
          },
          {
            question: "Adding context helps AI:",
            options: ["Understand", "Ignore you", "Sleep"],
            correctAnswer: 0
          }
        ]
      }
    },
    {
      course_id: courseId,
      module_number: 9,
      title: "Limitations of AI",
      description: "AI boundaries",
      points_reward: 10,
      is_locked: true,
      content: {
        sections: [
          {
            title: "AI Limits",
            content: "AI is powerful but not perfect. It can be wrong. It needs good data. It doesn't understand emotions like humans do."
          }
        ],
        quiz: [
          {
            question: "AI can sometimes be:",
            options: ["Wrong", "Perfect", "Magic"],
            correctAnswer: 0
          },
          {
            question: "AI needs good:",
            options: ["Data", "Shoes", "Cameras"],
            correctAnswer: 0
          },
          {
            question: "AI doesn't understand:",
            options: ["Emotions", "Numbers", "Text"],
            correctAnswer: 0
          }
        ]
      }
    },
    {
      course_id: courseId,
      module_number: 10,
      title: "Future of AI",
      description: "What's next for AI",
      points_reward: 10,
      is_locked: true,
      content: {
        sections: [
          {
            title: "AI Tomorrow",
            content: "AI will improve medicine, education, jobs, and tools. It will help us work smarter, learn faster, and solve big problems."
          }
        ],
        quiz: [
          {
            question: "AI will improve:",
            options: ["Many industries", "Only cooking", "Nothing"],
            correctAnswer: 0
          },
          {
            question: "AI helps us:",
            options: ["Work smarter", "Work slower", "Stop learning"],
            correctAnswer: 0
          },
          {
            question: "The future of AI is:",
            options: ["Growing", "Ending", "Silent"],
            correctAnswer: 0
          }
        ]
      }
    }
  ];
}

function createPromptEngineeringModules(courseId: string) {
  return [
    {
      course_id: courseId,
      module_number: 1,
      title: "What Prompts Are",
      description: "Introduction to prompts",
      points_reward: 10,
      is_locked: false,
      content: {
        sections: [
          {
            title: "Understanding Prompts",
            content: "Prompts are instructions you give to an AI. They guide the AI on what to do, what to create, or what to answer. Clear prompts lead to better results."
          }
        ],
        quiz: [
          {
            question: "A prompt is:",
            options: ["An instruction", "A snack", "A song"],
            correctAnswer: 0
          },
          {
            question: "Prompts guide:",
            options: ["AI", "Shoes", "Weather"],
            correctAnswer: 0
          },
          {
            question: "Clear prompts give:",
            options: ["Better results", "Worse results", "No results"],
            correctAnswer: 0
          }
        ]
      }
    },
    {
      course_id: courseId,
      module_number: 2,
      title: "Why Prompts Matter",
      description: "Importance of good prompts",
      points_reward: 10,
      is_locked: true,
      content: {
        sections: [
          {
            title: "Prompt Importance",
            content: "Good prompts reduce mistakes. They help AI understand your goal. They make answers simple, accurate, and useful."
          }
        ],
        quiz: [
          {
            question: "Good prompts reduce:",
            options: ["Mistakes", "Rain", "Heat"],
            correctAnswer: 0
          },
          {
            question: "Prompts help AI understand your:",
            options: ["Goal", "Voice", "Hair"],
            correctAnswer: 0
          },
          {
            question: "Better prompts give:",
            options: ["Better answers", "No answers", "Random noise"],
            correctAnswer: 0
          }
        ]
      }
    },
    {
      course_id: courseId,
      module_number: 3,
      title: "Clear Instructions",
      description: "Writing clear prompts",
      points_reward: 10,
      is_locked: true,
      content: {
        sections: [
          {
            title: "Being Clear",
            content: "Start with simple, clear instructions. Tell the AI exactly what you want. Short sentences work best for beginners."
          }
        ],
        quiz: [
          {
            question: "Prompts should be:",
            options: ["Clear", "Confusing", "Hidden"],
            correctAnswer: 0
          },
          {
            question: "Simple instructions help AI:",
            options: ["Understand", "Ignore you", "Get lost"],
            correctAnswer: 0
          },
          {
            question: "Short sentences are good for:",
            options: ["Beginners", "Robots only", "No one"],
            correctAnswer: 0
          }
        ]
      }
    },
    {
      course_id: courseId,
      module_number: 4,
      title: "Adding Context",
      description: "Providing background info",
      points_reward: 10,
      is_locked: true,
      content: {
        sections: [
          {
            title: "Context Matters",
            content: "Context tells AI your purpose. It includes details like style, tone, format, or background. More context means more accurate answers."
          }
        ],
        quiz: [
          {
            question: "Context means:",
            options: ["Extra details", "Food", "Sound"],
            correctAnswer: 0
          },
          {
            question: "Context makes answers:",
            options: ["More accurate", "Random", "Hidden"],
            correctAnswer: 0
          },
          {
            question: "You can specify:",
            options: ["Tone", "Style", "Both"],
            correctAnswer: 2
          }
        ]
      }
    },
    {
      course_id: courseId,
      module_number: 5,
      title: "Role Prompts",
      description: "Assigning roles to AI",
      points_reward: 10,
      is_locked: true,
      content: {
        sections: [
          {
            title: "Using Roles",
            content: "You can tell AI to act like a teacher, designer, coach, or expert. This helps AI shape the kind of answer you want."
          }
        ],
        quiz: [
          {
            question: "Role prompts tell AI to:",
            options: ["Act like someone", "Eat food", "Sleep"],
            correctAnswer: 0
          },
          {
            question: "Setting a role improves:",
            options: ["Quality", "Noise", "Confusion"],
            correctAnswer: 0
          },
          {
            question: "An example of a role is:",
            options: ["Teacher", "Tree", "Door"],
            correctAnswer: 0
          }
        ]
      }
    },
    {
      course_id: courseId,
      module_number: 6,
      title: "Examples in Prompts",
      description: "Using examples effectively",
      points_reward: 10,
      is_locked: true,
      content: {
        sections: [
          {
            title: "Power of Examples",
            content: "Giving examples helps AI learn your style. Show what you want. Show what you don't want. Examples improve responses."
          }
        ],
        quiz: [
          {
            question: "Examples show AI:",
            options: ["Your style", "Your phone type", "Your age"],
            correctAnswer: 0
          },
          {
            question: "You can show:",
            options: ["What you want", "What you don't want", "Both"],
            correctAnswer: 2
          },
          {
            question: "Examples make responses:",
            options: ["Better", "Confusing", "Broken"],
            correctAnswer: 0
          }
        ]
      }
    },
    {
      course_id: courseId,
      module_number: 7,
      title: "Step-by-Step Prompts",
      description: "Breaking down requests",
      points_reward: 10,
      is_locked: true,
      content: {
        sections: [
          {
            title: "Step by Step",
            content: "Telling AI to answer step by step makes results clearer. It helps the AI break the solution into small parts."
          }
        ],
        quiz: [
          {
            question: "Step-by-step prompts create:",
            options: ["Clear answers", "Loud answers", "No answers"],
            correctAnswer: 0
          },
          {
            question: "They help AI break tasks into:",
            options: ["Steps", "Songs", "Colors"],
            correctAnswer: 0
          },
          {
            question: "Step prompts make learning:",
            options: ["Easier", "Harder", "Impossible"],
            correctAnswer: 0
          }
        ]
      }
    },
    {
      course_id: courseId,
      module_number: 8,
      title: "Short vs Long Prompts",
      description: "Finding the right length",
      points_reward: 10,
      is_locked: true,
      content: {
        sections: [
          {
            title: "Prompt Length",
            content: "Short prompts are simple. Long prompts give more detail. Both work, depending on your goal. Balance is important."
          }
        ],
        quiz: [
          {
            question: "Short prompts are:",
            options: ["Simple", "Heavy", "Confusing"],
            correctAnswer: 0
          },
          {
            question: "Long prompts give:",
            options: ["Detail", "Random words", "Noise"],
            correctAnswer: 0
          },
          {
            question: "The best choice is based on:",
            options: ["Your goal", "Guessing", "Weather"],
            correctAnswer: 0
          }
        ]
      }
    },
    {
      course_id: courseId,
      module_number: 9,
      title: "Testing Prompts",
      description: "Iterating for better results",
      points_reward: 10,
      is_locked: true,
      content: {
        sections: [
          {
            title: "Test and Improve",
            content: "Try different versions until you get the best answer. Small changes can make big improvements."
          }
        ],
        quiz: [
          {
            question: "Testing helps you:",
            options: ["Improve prompts", "Burn prompts", "Break AI"],
            correctAnswer: 0
          },
          {
            question: "Small changes can make:",
            options: ["Big improvements", "No difference", "Noise"],
            correctAnswer: 0
          },
          {
            question: "Testing should be:",
            options: ["Regular", "Avoided", "Random"],
            correctAnswer: 0
          }
        ]
      }
    },
    {
      course_id: courseId,
      module_number: 10,
      title: "Common Mistakes",
      description: "Avoiding prompt errors",
      points_reward: 10,
      is_locked: true,
      content: {
        sections: [
          {
            title: "Mistakes to Avoid",
            content: "Mistakes include unclear prompts, missing context, and asking too many things at once. Avoid mixing topics."
          }
        ],
        quiz: [
          {
            question: "A common mistake is:",
            options: ["Unclear instructions", "Clear prompts", "Simple requests"],
            correctAnswer: 0
          },
          {
            question: "Missing context leads to:",
            options: ["Bad answers", "Great answers", "Perfect answers"],
            correctAnswer: 0
          },
          {
            question: "You should avoid:",
            options: ["Mixing topics", "Clear goals", "Simple words"],
            correctAnswer: 0
          }
        ]
      }
    }
  ];
}

function createCybersecurityModules(courseId: string) {
  return [
    {
      course_id: courseId,
      module_number: 1,
      title: "What is Cybersecurity",
      description: "Introduction to cybersecurity",
      points_reward: 10,
      is_locked: false,
      content: {
        sections: [
          {
            title: "Cybersecurity Basics",
            content: "Cybersecurity means protecting computers, phones, and data from harm. It keeps your information safe online."
          }
        ],
        quiz: [
          {
            question: "Cybersecurity protects:",
            options: ["Devices and data", "Only phones", "Only paper files"],
            correctAnswer: 0
          },
          {
            question: "Why is cybersecurity important?",
            options: ["To keep information safe", "To slow the internet", "To lose files"],
            correctAnswer: 0
          },
          {
            question: "Cybersecurity works online and:",
            options: ["Offline", "Only at night", "Never"],
            correctAnswer: 0
          }
        ]
      }
    },
    {
      course_id: courseId,
      module_number: 2,
      title: "Strong Passwords",
      description: "Creating secure passwords",
      points_reward: 10,
      is_locked: true,
      content: {
        sections: [
          {
            title: "Password Security",
            content: "Use long, unique passwords. Mix letters, numbers, and symbols. Do not reuse the same password for many accounts."
          }
        ],
        quiz: [
          {
            question: "A strong password is:",
            options: ["Long and unique", "Your birthday", "The word password"],
            correctAnswer: 0
          },
          {
            question: "Should you reuse passwords?",
            options: ["No", "Yes", "Sometimes"],
            correctAnswer: 0
          },
          {
            question: "Use a password manager to:",
            options: ["Store passwords safely", "Share passwords", "Delete passwords"],
            correctAnswer: 0
          }
        ]
      }
    },
    {
      course_id: courseId,
      module_number: 3,
      title: "Two Factor Authentication",
      description: "Adding extra security",
      points_reward: 10,
      is_locked: true,
      content: {
        sections: [
          {
            title: "2FA Protection",
            content: "Two factor authentication adds a second step when you log in. It often uses a code or an app to confirm your identity."
          }
        ],
        quiz: [
          {
            question: "Two factor authentication means:",
            options: ["Two steps to log in", "Two passwords only", "No login needed"],
            correctAnswer: 0
          },
          {
            question: "Examples include codes from:",
            options: ["An authenticator app", "TV shows", "Weather apps"],
            correctAnswer: 0
          },
          {
            question: "Is two factor authentication recommended?",
            options: ["Yes", "No", "Maybe"],
            correctAnswer: 0
          }
        ]
      }
    },
    {
      course_id: courseId,
      module_number: 4,
      title: "Phishing Awareness",
      description: "Recognizing scam attempts",
      points_reward: 10,
      is_locked: true,
      content: {
        sections: [
          {
            title: "Spotting Phishing",
            content: "Phishing is when attackers send messages to trick you into sharing info. Always check who sent the message and avoid suspicious links."
          }
        ],
        quiz: [
          {
            question: "Phishing tries to steal your:",
            options: ["Login details", "Shoes", "Food"],
            correctAnswer: 0
          },
          {
            question: "Suspicious links may lead to:",
            options: ["Fake sites", "Real news only", "Games"],
            correctAnswer: 0
          },
          {
            question: "Before clicking, you should:",
            options: ["Verify the sender", "Click immediately", "Share with friends"],
            correctAnswer: 0
          }
        ]
      }
    },
    {
      course_id: courseId,
      module_number: 5,
      title: "Safe Browsing",
      description: "Staying safe online",
      points_reward: 10,
      is_locked: true,
      content: {
        sections: [
          {
            title: "Browsing Safely",
            content: "Keep your browser updated. Close tabs you do not trust. Look for secure sites before entering personal information."
          }
        ],
        quiz: [
          {
            question: "To browse safely, you should:",
            options: ["Update your browser", "Never update", "Use old versions"],
            correctAnswer: 0
          },
          {
            question: "Secure sites usually show:",
            options: ["HTTPS in the address bar", "Random colors", "Big banners"],
            correctAnswer: 0
          },
          {
            question: "Do not enter personal info on:",
            options: ["Untrusted sites", "Trusted banking sites", "Official sites"],
            correctAnswer: 0
          }
        ]
      }
    },
    {
      course_id: courseId,
      module_number: 6,
      title: "Software Updates",
      description: "Keeping systems current",
      points_reward: 10,
      is_locked: true,
      content: {
        sections: [
          {
            title: "Update Regularly",
            content: "Updates fix security problems. Install updates for your phone, apps, and computer when available."
          }
        ],
        quiz: [
          {
            question: "Software updates often:",
            options: ["Fix security issues", "Remove features only", "Slow everything down"],
            correctAnswer: 0
          },
          {
            question: "Should you delay important security updates?",
            options: ["No", "Yes", "Always"],
            correctAnswer: 0
          },
          {
            question: "Updates apply to:",
            options: ["Phones and computers", "Only TVs", "Only printers"],
            correctAnswer: 0
          }
        ]
      }
    },
    {
      course_id: courseId,
      module_number: 7,
      title: "Public WiFi Risks",
      description: "Network safety",
      points_reward: 10,
      is_locked: true,
      content: {
        sections: [
          {
            title: "WiFi Dangers",
            content: "Public WiFi can be unsafe. Avoid logging into important accounts on public networks or use a VPN for extra protection."
          }
        ],
        quiz: [
          {
            question: "Public WiFi can let attackers:",
            options: ["See your traffic", "Cook food", "Read minds"],
            correctAnswer: 0
          },
          {
            question: "A VPN helps by:",
            options: ["Encrypting your connection", "Making coffee", "Speeding up your phone battery"],
            correctAnswer: 0
          },
          {
            question: "On public WiFi, avoid:",
            options: ["Logging into sensitive accounts", "Watching videos only", "Reading news"],
            correctAnswer: 0
          }
        ]
      }
    },
    {
      course_id: courseId,
      module_number: 8,
      title: "Backups and Recovery",
      description: "Protecting your data",
      points_reward: 10,
      is_locked: true,
      content: {
        sections: [
          {
            title: "Backup Your Data",
            content: "Regular backups keep your files safe if something goes wrong. Store backups offline or in a secure cloud service."
          }
        ],
        quiz: [
          {
            question: "Backups help you recover from:",
            options: ["Data loss", "Hunger", "Weather"],
            correctAnswer: 0
          },
          {
            question: "Good backups are stored:",
            options: ["Offline or secure cloud", "On the same failing drive", "Public websites"],
            correctAnswer: 0
          },
          {
            question: "How often should you back up important files?",
            options: ["Regularly", "Never", "Once a decade"],
            correctAnswer: 0
          }
        ]
      }
    },
    {
      course_id: courseId,
      module_number: 9,
      title: "Mobile Security Basics",
      description: "Phone security",
      points_reward: 10,
      is_locked: true,
      content: {
        sections: [
          {
            title: "Secure Your Phone",
            content: "Keep your phone locked, install apps only from trusted stores, and review app permissions before granting access."
          }
        ],
        quiz: [
          {
            question: "Install apps from:",
            options: ["Official app stores", "Any website", "Random links"],
            correctAnswer: 0
          },
          {
            question: "Review app permissions to protect:",
            options: ["Your privacy", "The app's colors", "Wallpapers"],
            correctAnswer: 0
          },
          {
            question: "Locking your phone helps prevent:",
            options: ["Unauthorized access", "Faster charging", "Better photos"],
            correctAnswer: 0
          }
        ]
      }
    },
    {
      course_id: courseId,
      module_number: 10,
      title: "Reporting and Help",
      description: "What to do when compromised",
      points_reward: 10,
      is_locked: true,
      content: {
        sections: [
          {
            title: "Getting Help",
            content: "If you suspect a breach, report it to the service provider, change passwords, and run security scans. Seek help when unsure."
          }
        ],
        quiz: [
          {
            question: "If your account is hacked you should:",
            options: ["Report it and change passwords", "Do nothing", "Share it online"],
            correctAnswer: 0
          },
          {
            question: "Running a security scan may:",
            options: ["Find malware", "Break the internet", "Cook food"],
            correctAnswer: 0
          },
          {
            question: "Ask for help from:",
            options: ["Trusted support channels", "Random strangers", "Unknown links"],
            correctAnswer: 0
          }
        ]
      }
    }
  ];
}

function createCryptoSafetyModules(courseId: string) {
  return [
    {
      course_id: courseId,
      module_number: 1,
      title: "Basic Safety Mindset",
      description: "Think security first",
      points_reward: 10,
      is_locked: false,
      content: {
        sections: [
          {
            title: "Security First",
            content: "Think security first. Treat crypto like money. Be careful with links, messages, and approvals."
          }
        ],
        quiz: [
          {
            question: "Crypto should be treated like:",
            options: ["Money", "Toys", "Games"],
            correctAnswer: 0
          },
          {
            question: "Always be careful with:",
            options: ["Links and approvals", "Weather forecasts", "Photos only"],
            correctAnswer: 0
          },
          {
            question: "Security mindset means:",
            options: ["Pause and verify", "Click fast", "Share seed phrases"],
            correctAnswer: 0
          }
        ]
      }
    },
    {
      course_id: courseId,
      module_number: 2,
      title: "Choosing a Wallet",
      description: "Selecting the right wallet",
      points_reward: 10,
      is_locked: true,
      content: {
        sections: [
          {
            title: "Wallet Selection",
            content: "Pick a reputable wallet that fits your needs. For small daily use, a hot wallet is fine. For long-term storage, use a cold wallet."
          }
        ],
        quiz: [
          {
            question: "Hot wallets are good for:",
            options: ["Daily use", "Long-term storage only", "Burning"],
            correctAnswer: 0
          },
          {
            question: "Cold wallets are best for:",
            options: ["Long-term storage", "Watching videos", "Quick payments"],
            correctAnswer: 0
          },
          {
            question: "Choose wallets from:",
            options: ["Reputable providers", "Unknown sources", "Random links"],
            correctAnswer: 0
          }
        ]
      }
    },
    {
      course_id: courseId,
      module_number: 3,
      title: "Seed Phrase Practice",
      description: "Protecting your seed phrase",
      points_reward: 10,
      is_locked: true,
      content: {
        sections: [
          {
            title: "Seed Phrase Security",
            content: "Write your seed phrase on paper and store it safely. Never type it into websites or share it with anyone."
          }
        ],
        quiz: [
          {
            question: "Where should you store a seed phrase?",
            options: ["Offline on paper or metal", "In a public chat", "On social media"],
            correctAnswer: 0
          },
          {
            question: "Should you enter your seed phrase to claim an airdrop?",
            options: ["No", "Yes", "Sometimes"],
            correctAnswer: 0
          },
          {
            question: "Sharing your seed phrase lets others:",
            options: ["Access your funds", "Help you securely", "Nothing bad"],
            correctAnswer: 0
          }
        ]
      }
    },
    {
      course_id: courseId,
      module_number: 4,
      title: "Approvals and Permissions",
      description: "Managing token approvals",
      points_reward: 10,
      is_locked: true,
      content: {
        sections: [
          {
            title: "Token Approvals",
            content: "When a DApp asks permission to use your tokens, check what it can do. Revoke approvals you no longer need."
          }
        ],
        quiz: [
          {
            question: "Token approvals let contracts:",
            options: ["Move tokens if allowed", "Cook meals", "Change your phone wallpaper"],
            correctAnswer: 0
          },
          {
            question: "You should review approvals:",
            options: ["Regularly", "Never", "Only once"],
            correctAnswer: 0
          },
          {
            question: "Revoking unused approvals can:",
            options: ["Reduce risk", "Increase risk", "Do nothing"],
            correctAnswer: 0
          }
        ]
      }
    },
    {
      course_id: courseId,
      module_number: 5,
      title: "Beware of Scams and Impersonators",
      description: "Spotting fake accounts",
      points_reward: 10,
      is_locked: true,
      content: {
        sections: [
          {
            title: "Scam Awareness",
            content: "Always check usernames and handles. Impersonators copy profiles to trick you. Do not send funds to strangers."
          }
        ],
        quiz: [
          {
            question: "Impersonators try to:",
            options: ["Pretend to be trusted people", "Build real apps only", "Cook food"],
            correctAnswer: 0
          },
          {
            question: "Before sending funds, you should:",
            options: ["Verify identity", "Send immediately", "Ask random chats"],
            correctAnswer: 0
          },
          {
            question: "Trusted teams usually have:",
            options: ["Clear communication and links", "Hidden profiles", "No website"],
            correctAnswer: 0
          }
        ]
      }
    },
    {
      course_id: courseId,
      module_number: 6,
      title: "Double Check Addresses",
      description: "Verifying wallet addresses",
      points_reward: 10,
      is_locked: true,
      content: {
        sections: [
          {
            title: "Address Verification",
            content: "Copy and paste addresses carefully. Consider scanning QR codes from trusted sources. Small errors can lose funds forever."
          }
        ],
        quiz: [
          {
            question: "Before sending, you should:",
            options: ["Double check the address", "Guess the address", "Change it slightly"],
            correctAnswer: 0
          },
          {
            question: "QR codes should be scanned from:",
            options: ["Trusted sources", "Random flyers", "Strangers"],
            correctAnswer: 0
          },
          {
            question: "Are blockchain transactions reversible?",
            options: ["Generally no", "Always yes", "Sometimes"],
            correctAnswer: 0
          }
        ]
      }
    },
    {
      course_id: courseId,
      module_number: 7,
      title: "Use Trusted Marketplaces and Bridges",
      description: "Safe platforms",
      points_reward: 10,
      is_locked: true,
      content: {
        sections: [
          {
            title: "Trusted Platforms",
            content: "Use well-known marketplaces and bridges. Check community reviews and official links before using a service."
          }
        ],
        quiz: [
          {
            question: "Before using a marketplace, you should:",
            options: ["Check reputation and official links", "Randomly click buy", "Trust any site"],
            correctAnswer: 0
          },
          {
            question: "Bridges transfer assets across chains and can be:",
            options: ["Risky if not trusted", "Always safe", "Free of risk"],
            correctAnswer: 0
          },
          {
            question: "Community reviews help:",
            options: ["Assess trust", "Distract you", "Nothing"],
            correctAnswer: 0
          }
        ]
      }
    },
    {
      course_id: courseId,
      module_number: 8,
      title: "Keep Small Test Transactions",
      description: "Testing before sending",
      points_reward: 10,
      is_locked: true,
      content: {
        sections: [
          {
            title: "Test First",
            content: "When sending to a new address, send a small test amount first. Confirm the recipient can receive it before sending larger sums."
          }
        ],
        quiz: [
          {
            question: "A test transaction helps to:",
            options: ["Verify the address works", "Make you rich instantly", "Break the chain"],
            correctAnswer: 0
          },
          {
            question: "After a successful test, you can:",
            options: ["Send the full amount", "Send more test transactions forever", "Stop sending"],
            correctAnswer: 0
          },
          {
            question: "Test transactions reduce:",
            options: ["Risk of full loss", "Gas fees only", "Nothing"],
            correctAnswer: 0
          }
        ]
      }
    },
    {
      course_id: courseId,
      module_number: 9,
      title: "Stay Informed About Scams",
      description: "Keeping up with threats",
      points_reward: 10,
      is_locked: true,
      content: {
        sections: [
          {
            title: "Stay Updated",
            content: "Follow trusted channels for alerts and guides. Being aware of common scams helps you spot new tricks quickly."
          }
        ],
        quiz: [
          {
            question: "Following trusted sources helps you:",
            options: ["Spot new scams", "Increase risk", "Lose funds"],
            correctAnswer: 0
          },
          {
            question: "New scams appear:",
            options: ["Often", "Never", "Once a year"],
            correctAnswer: 0
          },
          {
            question: "Learning common scam patterns is:",
            options: ["Useful", "Useless", "Dangerous"],
            correctAnswer: 0
          }
        ]
      }
    },
    {
      course_id: courseId,
      module_number: 10,
      title: "Emergency Steps if Compromised",
      description: "What to do when hacked",
      points_reward: 10,
      is_locked: true,
      content: {
        sections: [
          {
            title: "Emergency Response",
            content: "If you suspect compromise, move remaining funds to a safe wallet, revoke approvals, contact support, and notify the community if needed."
          }
        ],
        quiz: [
          {
            question: "First step after compromise is to:",
            options: ["Move funds to a safe wallet if possible", "Post your seed phrase publicly", "Do nothing"],
            correctAnswer: 0
          },
          {
            question: "Revoking approvals can:",
            options: ["Limit further access", "Give attackers more power", "Do nothing"],
            correctAnswer: 0
          },
          {
            question: "Contacting official support helps:",
            options: ["Get guidance", "Share private keys", "Waste time"],
            correctAnswer: 0
          }
        ]
      }
    }
  ];
}
