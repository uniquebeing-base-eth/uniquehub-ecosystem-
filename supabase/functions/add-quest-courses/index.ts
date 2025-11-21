import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Insert Web3 Basics Course
    const { data: web3Course, error: web3CourseError } = await supabase
      .from('learning_courses')
      .upsert({
        id: '550e8400-e29b-41d4-a716-446655440001',
        title: 'Web3 Basics',
        description: 'Learn the fundamentals of Web3, blockchain, and decentralized technologies',
        category: 'web3',
        difficulty_level: 'beginner',
        total_modules: 10,
        is_active: true
      })
      .select()
      .single()

    if (web3CourseError) throw web3CourseError

    // Insert Crypto Basics Course
    const { data: cryptoCourse, error: cryptoCourseError } = await supabase
      .from('learning_courses')
      .upsert({
        id: '550e8400-e29b-41d4-a716-446655440002',
        title: 'Crypto Basics',
        description: 'Master the basics of cryptocurrency, Bitcoin, Ethereum, and digital wallets',
        category: 'crypto',
        difficulty_level: 'beginner',
        total_modules: 10,
        is_active: true
      })
      .select()
      .single()

    if (cryptoCourseError) throw cryptoCourseError

    // Web3 Basics Modules
    const web3Modules = [
      {
        course_id: '550e8400-e29b-41d4-a716-446655440001',
        module_number: 1,
        title: 'What is Web3',
        description: 'Learn about the decentralized internet',
        content: {
          lesson: "Web3 is the next version of the internet. It's decentralized, meaning no single company controls it. Users own their data and assets.",
          quiz: [
            { question: "Web3 is about:", options: ["One company controlling the internet", "Decentralized internet", "Only using Bitcoin"], correct: 1 },
            { question: "Who owns the data in Web3?", options: ["Users", "Big companies", "Hackers"], correct: 0 },
            { question: "Is Web3 decentralized?", options: ["Yes", "No"], correct: 0 }
          ]
        },
        points_reward: 10,
        is_locked: false
      },
      {
        course_id: '550e8400-e29b-41d4-a716-446655440001',
        module_number: 2,
        title: 'Blockchain',
        description: 'Understand how blockchain technology works',
        content: {
          lesson: "A blockchain is a chain of blocks that store information. Once added, data can't be easily changed. It's transparent and secure.",
          quiz: [
            { question: "Blockchain is a:", options: ["Type of internet", "Chain of blocks", "Mobile app"], correct: 1 },
            { question: "Blocks store:", options: ["Information", "Candy", "Music"], correct: 0 },
            { question: "Can blockchain data be changed easily?", options: ["Yes", "No"], correct: 1 }
          ]
        },
        points_reward: 10,
        is_locked: true
      },
      {
        course_id: '550e8400-e29b-41d4-a716-446655440001',
        module_number: 3,
        title: 'Wallets',
        description: 'Learn about crypto wallets and security',
        content: {
          lesson: "Crypto wallets store digital assets like tokens and NFTs. Hot wallets are online; cold wallets are offline. Always keep your seed phrase safe.",
          quiz: [
            { question: "A crypto wallet stores:", options: ["Cash", "Digital assets", "Documents"], correct: 1 },
            { question: "A seed phrase must be:", options: ["Shared with friends", "Kept secret", "Posted online"], correct: 1 },
            { question: "Hot wallet vs cold wallet:", options: ["Hot = online, Cold = offline", "Hot = offline, Cold = online", "Both are the same"], correct: 0 }
          ]
        },
        points_reward: 10,
        is_locked: true
      },
      {
        course_id: '550e8400-e29b-41d4-a716-446655440001',
        module_number: 4,
        title: 'Tokens',
        description: 'Understand fungible and non-fungible tokens',
        content: {
          lesson: "Tokens are digital assets on a blockchain. Fungible tokens are identical; non-fungible tokens (NFTs) are unique.",
          quiz: [
            { question: "What is a token?", options: ["Digital asset", "Gift card", "Bank note"], correct: 0 },
            { question: "Fungible means:", options: ["Unique", "Interchangeable", "Broken"], correct: 1 },
            { question: "Non-fungible means:", options: ["Unique", "Same as others", "Physical"], correct: 0 }
          ]
        },
        points_reward: 10,
        is_locked: true
      },
      {
        course_id: '550e8400-e29b-41d4-a716-446655440001',
        module_number: 5,
        title: 'How Web3 Works',
        description: 'Discover the mechanics of Web3',
        content: {
          lesson: "Web3 is decentralized and trustless. Smart contracts automate rules, and users interact without intermediaries. Gas fees pay for transactions.",
          quiz: [
            { question: "Who controls Web3?", options: ["Users and protocols", "A single company", "Governments"], correct: 0 },
            { question: "Why is it trustless?", options: ["You don't need to trust anyone", "You trust banks", "You trust hackers"], correct: 0 },
            { question: "What is a gas fee?", options: ["Fee for cooking", "Fee for blockchain transactions", "Fee for internet"], correct: 1 }
          ]
        },
        points_reward: 10,
        is_locked: true
      },
      {
        course_id: '550e8400-e29b-41d4-a716-446655440001',
        module_number: 6,
        title: 'Smart Contracts',
        description: 'Learn about self-executing contracts',
        content: {
          lesson: "Smart contracts are programs on blockchain. They run automatically when conditions are met. No one can change them after deployment.",
          quiz: [
            { question: "Smart contracts run:", options: ["Manually by users", "Automatically", "Only once a month"], correct: 1 },
            { question: "Can they be changed after deployment?", options: ["Yes", "No", "Sometimes"], correct: 1 },
            { question: "Smart contracts are stored on:", options: ["Blockchain", "Your computer", "A server"], correct: 0 }
          ]
        },
        points_reward: 10,
        is_locked: true
      },
      {
        course_id: '550e8400-e29b-41d4-a716-446655440001',
        module_number: 7,
        title: 'DApps',
        description: 'Explore decentralized applications',
        content: {
          lesson: "Decentralized apps (DApps) use blockchain. They run without a central server. Users interact directly with the network.",
          quiz: [
            { question: "DApp stands for:", options: ["Decentralized app", "Digital app", "Data app"], correct: 0 },
            { question: "Who controls a DApp?", options: ["No one central", "One company", "Government"], correct: 0 },
            { question: "DApps use:", options: ["Blockchain", "Only the internet", "USB drives"], correct: 0 }
          ]
        },
        points_reward: 10,
        is_locked: true
      },
      {
        course_id: '550e8400-e29b-41d4-a716-446655440001',
        module_number: 8,
        title: 'Governance in Web3',
        description: 'Understand community governance',
        content: {
          lesson: "Some Web3 projects let users vote on decisions. Governance tokens give voting rights. Community decides updates and rules.",
          quiz: [
            { question: "Governance tokens allow:", options: ["Voting in project decisions", "Buying snacks", "Mining crypto"], correct: 0 },
            { question: "Who decides updates?", options: ["Community", "CEO only", "Government"], correct: 0 },
            { question: "Governance is:", options: ["Centralized", "Decentralized", "Random"], correct: 1 }
          ]
        },
        points_reward: 10,
        is_locked: true
      },
      {
        course_id: '550e8400-e29b-41d4-a716-446655440001',
        module_number: 9,
        title: 'Web3 Security',
        description: 'Stay safe in Web3',
        content: {
          lesson: "Web3 is secure but requires caution. Protect your wallet and seed phrase. Avoid scams and phishing links.",
          quiz: [
            { question: "What should you protect?", options: ["Wallet and seed phrase", "Social media password only", "Public profile"], correct: 0 },
            { question: "Phishing links are:", options: ["Safe", "Scams", "Games"], correct: 1 },
            { question: "Can Web3 transactions be reversed?", options: ["Yes", "No", "Sometimes"], correct: 1 }
          ]
        },
        points_reward: 10,
        is_locked: true
      },
      {
        course_id: '550e8400-e29b-41d4-a716-446655440001',
        module_number: 10,
        title: 'Web3 in Real Life',
        description: 'See Web3 applications in action',
        content: {
          lesson: "Web3 is used for finance, gaming, social media, and art. NFTs, DeFi, and DApps are real examples.",
          quiz: [
            { question: "Web3 can be used for:", options: ["Finance", "Gaming", "Social media", "All of the above"], correct: 3 },
            { question: "NFTs are:", options: ["Unique digital assets", "Regular money", "Emails"], correct: 0 },
            { question: "DeFi means:", options: ["Decentralized finance", "Digital files", "Data federation"], correct: 0 }
          ]
        },
        points_reward: 10,
        is_locked: true
      }
    ]

    // Crypto Basics Modules
    const cryptoModules = [
      {
        course_id: '550e8400-e29b-41d4-a716-446655440002',
        module_number: 1,
        title: 'What is Cryptocurrency',
        description: 'Introduction to digital money',
        content: {
          lesson: "Cryptocurrency is digital money. It exists only online and uses blockchain for security.",
          quiz: [
            { question: "Cryptocurrency is:", options: ["Physical money", "Digital money", "Paper notes"], correct: 1 },
            { question: "Where does cryptocurrency exist?", options: ["Bank only", "Online", "Wallets only"], correct: 1 },
            { question: "What technology keeps crypto secure?", options: ["Blockchain", "WiFi", "Cloud storage"], correct: 0 }
          ]
        },
        points_reward: 10,
        is_locked: false
      },
      {
        course_id: '550e8400-e29b-41d4-a716-446655440002',
        module_number: 2,
        title: 'Bitcoin',
        description: 'The first cryptocurrency',
        content: {
          lesson: "Bitcoin is the first cryptocurrency. It's decentralized and limited in supply. People use it to store value or send money.",
          quiz: [
            { question: "Bitcoin was the:", options: ["First cryptocurrency", "Last cryptocurrency", "Only cryptocurrency"], correct: 0 },
            { question: "Bitcoin supply is:", options: ["Unlimited", "Limited", "Random"], correct: 1 },
            { question: "Bitcoin can be used to:", options: ["Store value", "Send money", "Both A and B"], correct: 2 }
          ]
        },
        points_reward: 10,
        is_locked: true
      },
      {
        course_id: '550e8400-e29b-41d4-a716-446655440002',
        module_number: 3,
        title: 'Ethereum',
        description: 'Smart contract platform',
        content: {
          lesson: "Ethereum is a cryptocurrency and a platform for smart contracts. It allows DApps and NFTs.",
          quiz: [
            { question: "Ethereum is:", options: ["Only a token", "Token + platform", "Bank"], correct: 1 },
            { question: "Ethereum runs:", options: ["Websites", "Smart contracts", "Phones"], correct: 1 },
            { question: "Ethereum allows:", options: ["NFTs", "DApps", "Both A and B"], correct: 2 }
          ]
        },
        points_reward: 10,
        is_locked: true
      },
      {
        course_id: '550e8400-e29b-41d4-a716-446655440002',
        module_number: 4,
        title: 'Altcoins',
        description: 'Alternative cryptocurrencies',
        content: {
          lesson: "Altcoins are all cryptocurrencies besides Bitcoin. Examples: Litecoin, Cardano, Solana.",
          quiz: [
            { question: "Altcoins mean:", options: ["Bitcoin only", "All other cryptocurrencies", "Money in banks"], correct: 1 },
            { question: "Examples of altcoins:", options: ["Solana", "Cardano", "Both A and B"], correct: 2 },
            { question: "Altcoins are:", options: ["All identical", "Different cryptocurrencies", "Cash"], correct: 1 }
          ]
        },
        points_reward: 10,
        is_locked: true
      },
      {
        course_id: '550e8400-e29b-41d4-a716-446655440002',
        module_number: 5,
        title: 'Stablecoins',
        description: 'Price-stable cryptocurrencies',
        content: {
          lesson: "Stablecoins are cryptocurrencies pegged to real money like USD. They are less volatile and used for trading.",
          quiz: [
            { question: "Stablecoins are pegged to:", options: ["Gold only", "Real money (USD, EUR)", "Nothing"], correct: 1 },
            { question: "Stablecoins are:", options: ["Very volatile", "Less volatile", "Not digital"], correct: 1 },
            { question: "Why use stablecoins?", options: ["Trading", "Savings", "Both A and B"], correct: 2 }
          ]
        },
        points_reward: 10,
        is_locked: true
      },
      {
        course_id: '550e8400-e29b-41d4-a716-446655440002',
        module_number: 6,
        title: 'Wallets for Crypto',
        description: 'Storing your digital assets',
        content: {
          lesson: "Crypto wallets store coins. Hot wallets are online, cold wallets offline. Keep your private keys safe.",
          quiz: [
            { question: "Crypto wallets store:", options: ["Coins", "Cash", "Documents"], correct: 0 },
            { question: "Hot wallet = ?", options: ["Online", "Offline", "Paper"], correct: 0 },
            { question: "Cold wallet = ?", options: ["Online", "Offline", "Cloud"], correct: 1 }
          ]
        },
        points_reward: 10,
        is_locked: true
      },
      {
        course_id: '550e8400-e29b-41d4-a716-446655440002',
        module_number: 7,
        title: 'Sending and Receiving Crypto',
        description: 'Transfer digital assets',
        content: {
          lesson: "You can send crypto to anyone using their wallet address. Always double-check the address before sending.",
          quiz: [
            { question: "To send crypto, you need:", options: ["Email", "Wallet address", "Phone number"], correct: 1 },
            { question: "Before sending crypto, check:", options: ["Nothing", "Wallet address", "Your balance only"], correct: 1 },
            { question: "Crypto transactions are:", options: ["Instant", "Verified on blockchain", "Both A and B"], correct: 2 }
          ]
        },
        points_reward: 10,
        is_locked: true
      },
      {
        course_id: '550e8400-e29b-41d4-a716-446655440002',
        module_number: 8,
        title: 'Exchanges',
        description: 'Buy and sell cryptocurrencies',
        content: {
          lesson: "Crypto exchanges let you buy, sell, and trade cryptocurrencies. Examples: Binance, Coinbase.",
          quiz: [
            { question: "Exchanges are for:", options: ["Buying crypto", "Selling crypto", "Both A and B"], correct: 2 },
            { question: "Examples of exchanges:", options: ["Binance", "Coinbase", "Both A and B"], correct: 2 },
            { question: "Exchanges can be:", options: ["Centralized", "Decentralized", "Both A and B"], correct: 2 }
          ]
        },
        points_reward: 10,
        is_locked: true
      },
      {
        course_id: '550e8400-e29b-41d4-a716-446655440002',
        module_number: 9,
        title: 'Risks in Crypto',
        description: 'Stay aware of dangers',
        content: {
          lesson: "Crypto can be volatile. Prices go up and down. Avoid scams and don't invest more than you can afford to lose.",
          quiz: [
            { question: "Crypto prices:", options: ["Always stable", "Can change quickly", "Never move"], correct: 1 },
            { question: "What should you avoid?", options: ["Scams", "Phishing links", "Both A and B"], correct: 2 },
            { question: "Invest only:", options: ["What you can afford to lose", "Everything you have", "Randomly"], correct: 0 }
          ]
        },
        points_reward: 10,
        is_locked: true
      },
      {
        course_id: '550e8400-e29b-41d4-a716-446655440002',
        module_number: 10,
        title: 'Real-World Crypto Uses',
        description: 'Cryptocurrency in daily life',
        content: {
          lesson: "People use crypto for payments, investing, NFTs, and DeFi. Some companies accept crypto for goods and services.",
          quiz: [
            { question: "Crypto can be used for:", options: ["Payments", "NFTs", "DeFi", "All of the above"], correct: 3 },
            { question: "Some companies:", options: ["Accept crypto", "Ignore crypto", "Ban crypto"], correct: 0 },
            { question: "DeFi stands for:", options: ["Decentralized finance", "Digital files", "Data federation"], correct: 0 }
          ]
        },
        points_reward: 10,
        is_locked: true
      }
    ]

    // Insert all modules
    const allModules = [...web3Modules, ...cryptoModules]
    const { data: modulesData, error: modulesError } = await supabase
      .from('learning_modules')
      .upsert(allModules)
      .select()

    if (modulesError) throw modulesError

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Successfully added 2 courses with 20 modules total',
        courses: [web3Course, cryptoCourse],
        modules: modulesData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})