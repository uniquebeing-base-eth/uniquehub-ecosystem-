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

    console.log('Starting course generation...');

    // Check existing courses
    const { data: existingCourses } = await supabaseClient
      .from('learning_courses')
      .select('title');
    
    const existingTitles = new Set(existingCourses?.map(c => c.title) || []);
    console.log('Found existing courses:', existingTitles.size);

    const courses = [
      // Web2 Courses
      {
        title: "HTML & CSS Fundamentals",
        category: "web2",
        difficulty_level: "beginner",
        description: "Build your first websites with HTML and CSS",
        total_modules: 10
      },
      {
        title: "JavaScript Essentials",
        category: "web2",
        difficulty_level: "beginner",
        description: "Learn modern JavaScript programming from scratch",
        total_modules: 10
      },
      {
        title: "React Development",
        category: "web2",
        difficulty_level: "intermediate",
        description: "Build dynamic web applications with React",
        total_modules: 10
      },
      {
        title: "API Design & Integration",
        category: "web2",
        difficulty_level: "intermediate",
        description: "Create and consume RESTful APIs",
        total_modules: 10
      },
      {
        title: "Database Management",
        category: "web2",
        difficulty_level: "intermediate",
        description: "Master SQL and database design principles",
        total_modules: 10
      },
      {
        title: "Cloud Computing Basics",
        category: "web2",
        difficulty_level: "intermediate",
        description: "Deploy applications on cloud platforms",
        total_modules: 10
      },
      {
        title: "Web Security",
        category: "web2",
        difficulty_level: "advanced",
        description: "Protect web applications from common vulnerabilities",
        total_modules: 10
      },
      {
        title: "Performance Optimization",
        category: "web2",
        difficulty_level: "advanced",
        description: "Make your web applications faster and more efficient",
        total_modules: 10
      },
      // Web3 Non-Tech Courses
      {
        title: "Blockchain Fundamentals",
        category: "web3-intro",
        difficulty_level: "beginner",
        description: "Understand how blockchain technology works",
        total_modules: 10
      },
      {
        title: "Cryptocurrency Basics",
        category: "web3-intro",
        difficulty_level: "beginner",
        description: "Learn about Bitcoin, Ethereum, and digital currencies",
        total_modules: 10
      },
      {
        title: "NFT Essentials",
        category: "web3-intro",
        difficulty_level: "beginner",
        description: "Understand NFTs and digital ownership",
        total_modules: 10
      },
      {
        title: "Crypto Wallets & Security",
        category: "web3-intro",
        difficulty_level: "beginner",
        description: "Safely store and manage your digital assets",
        total_modules: 10
      },
      {
        title: "DeFi Introduction",
        category: "web3-intro",
        difficulty_level: "intermediate",
        description: "Explore decentralized finance protocols",
        total_modules: 10
      },
      {
        title: "Token Economics",
        category: "web3-intro",
        difficulty_level: "intermediate",
        description: "Understand tokenomics and value creation",
        total_modules: 10
      },
      {
        title: "DAO Governance",
        category: "web3-intro",
        difficulty_level: "intermediate",
        description: "Participate in decentralized organizations",
        total_modules: 10
      },
      {
        title: "Web3 Investment Strategies",
        category: "web3-intro",
        difficulty_level: "intermediate",
        description: "Make informed decisions in crypto markets",
        total_modules: 10
      },
      // Philosophy Courses
      {
        title: "Introduction to Logic",
        category: "philosophy",
        difficulty_level: "beginner",
        description: "Learn critical thinking and logical reasoning",
        total_modules: 10
      },
      {
        title: "Ethics & Moral Philosophy",
        category: "philosophy",
        difficulty_level: "beginner",
        description: "Explore fundamental questions of right and wrong",
        total_modules: 10
      },
      {
        title: "Epistemology",
        category: "philosophy",
        difficulty_level: "intermediate",
        description: "Study the nature of knowledge and belief",
        total_modules: 10
      },
      {
        title: "Metaphysics",
        category: "philosophy",
        difficulty_level: "intermediate",
        description: "Examine the fundamental nature of reality",
        total_modules: 10
      },
      {
        title: "Political Philosophy",
        category: "philosophy",
        difficulty_level: "intermediate",
        description: "Understand theories of justice and governance",
        total_modules: 10
      },
      {
        title: "Philosophy of Mind",
        category: "philosophy",
        difficulty_level: "advanced",
        description: "Explore consciousness and mental phenomena",
        total_modules: 10
      },
      // Tech Courses
      {
        title: "Python Programming",
        category: "tech",
        difficulty_level: "beginner",
        description: "Start coding with Python from scratch",
        total_modules: 10
      },
      {
        title: "Data Structures",
        category: "tech",
        difficulty_level: "intermediate",
        description: "Master essential data structures for programming",
        total_modules: 10
      },
      {
        title: "Algorithms",
        category: "tech",
        difficulty_level: "intermediate",
        description: "Learn problem-solving with algorithms",
        total_modules: 10
      },
      {
        title: "Machine Learning Basics",
        category: "tech",
        difficulty_level: "intermediate",
        description: "Introduction to artificial intelligence and ML",
        total_modules: 10
      },
      {
        title: "Cybersecurity Fundamentals",
        category: "tech",
        difficulty_level: "intermediate",
        description: "Protect systems and networks from threats",
        total_modules: 10
      },
      {
        title: "DevOps Practices",
        category: "tech",
        difficulty_level: "advanced",
        description: "Streamline development and deployment workflows",
        total_modules: 10
      },
      {
        title: "System Design",
        category: "tech",
        difficulty_level: "advanced",
        description: "Design scalable and reliable systems",
        total_modules: 10
      },
      {
        title: "Smart Contract Development",
        category: "tech",
        difficulty_level: "advanced",
        description: "Build decentralized applications on blockchain",
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
                    options: getQuizOptions(course.category, i),
                    correct: getCorrectAnswer(course.category, i)
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
    "web2": [
      "Getting Started", "Core Concepts", "Building Blocks", "Advanced Techniques",
      "Best Practices", "Real-world Applications", "Debugging & Testing", "Optimization",
      "Security Considerations", "Project Completion"
    ],
    "web3-intro": [
      "Introduction", "Key Concepts", "Understanding the Technology", "Practical Use Cases",
      "Getting Started", "Advanced Features", "Risk Management", "Strategic Planning",
      "Community & Ecosystem", "Future Outlook"
    ],
    "philosophy": [
      "Historical Context", "Fundamental Questions", "Key Thinkers", "Core Arguments",
      "Critical Analysis", "Contemporary Debates", "Practical Applications", "Ethical Implications",
      "Cross-cultural Perspectives", "Synthesis & Reflection"
    ],
    "tech": [
      "Foundations", "Core Principles", "Implementation", "Advanced Concepts",
      "Best Practices", "Real Projects", "Testing & Debugging", "Performance",
      "Security & Scalability", "Industry Applications"
    ]
  };
  
  const categoryTitles = titles[category] || titles["tech"];
  return categoryTitles[moduleNumber - 1];
}

function getModuleDescription(category: string, moduleNumber: number): string {
  return `Master key concepts and skills. Complete this module to earn points.`;
}

function getModuleContent(category: string, moduleNumber: number): string {
  const contentMap: Record<string, Record<number, string>> = {
    "web2": {
      1: "Web development starts with understanding HTML and CSS. HTML provides structure while CSS handles styling. Together they form the foundation of every website.",
      2: "Learn about semantic HTML elements, CSS selectors, and the box model. These concepts help you create well-structured and maintainable web pages.",
      3: "Responsive design ensures your websites work on all devices. Use media queries, flexible grids, and responsive units to create adaptive layouts.",
      4: "JavaScript adds interactivity to websites. Variables, functions, and DOM manipulation are essential skills for dynamic web development.",
      5: "Modern JavaScript includes ES6+ features like arrow functions, destructuring, and promises. These make code more readable and efficient.",
      6: "Frameworks like React provide component-based architecture for building complex applications. Learn component lifecycle and state management.",
      7: "APIs enable communication between your frontend and backend. Understand HTTP methods, status codes, and data formats like JSON.",
      8: "Testing ensures code reliability. Unit tests, integration tests, and end-to-end tests help catch bugs before they reach production.",
      9: "Security is critical in web development. Learn about HTTPS, authentication, authorization, and common vulnerabilities like XSS and CSRF.",
      10: "Build a complete project applying all learned concepts. Deploy your application and follow best practices for production environments."
    },
    "web3-intro": {
      1: "Blockchain is a distributed database that maintains a continuously growing list of records called blocks. Each block contains transaction data and is cryptographically linked to the previous block.",
      2: "Cryptocurrency is digital money that uses cryptography for security. Bitcoin was the first cryptocurrency, followed by thousands of alternatives with different features and use cases.",
      3: "NFTs are unique digital tokens that represent ownership of specific items. Unlike cryptocurrencies, each NFT has distinct properties and cannot be exchanged one-to-one.",
      4: "Crypto wallets store your private keys and allow you to interact with blockchain networks. Hardware wallets offer the highest security for long-term storage.",
      5: "Decentralized finance removes intermediaries from financial transactions. You can lend, borrow, trade, and earn interest without traditional banks.",
      6: "Tokenomics combines token and economics, describing how cryptocurrencies are created, distributed, and used within an ecosystem. Supply, demand, and utility determine value.",
      7: "DAOs are organizations governed by smart contracts and community votes. Members hold tokens that grant voting rights on proposals and treasury decisions.",
      8: "Smart contracts are self-executing agreements with terms written in code. They automatically enforce rules and execute transactions without intermediaries.",
      9: "Web3 communities are global networks of developers, users, and enthusiasts. Active participation through forums, social media, and governance helps shape the ecosystem.",
      10: "The future of blockchain includes improved scalability, interoperability between chains, and mainstream adoption. Stay informed about emerging technologies and trends."
    },
    "philosophy": {
      1: "Philosophy is the study of fundamental questions about existence, knowledge, values, and reason. It has shaped human thought for thousands of years across all cultures.",
      2: "Logic is the foundation of rational thinking. Learn about valid arguments, fallacies, and how to construct sound reasoning in everyday life.",
      3: "Great philosophers like Socrates, Plato, and Aristotle established Western philosophical traditions. Their ideas continue to influence modern thought.",
      4: "Ethical theories provide frameworks for determining right and wrong. Consequentialism, deontology, and virtue ethics offer different perspectives on moral decision-making.",
      5: "Critical thinking involves analyzing arguments, identifying assumptions, and evaluating evidence. These skills are essential for navigating complex information.",
      6: "Modern philosophy addresses contemporary issues like artificial intelligence, environmental ethics, and social justice. Classical ideas remain relevant to current debates.",
      7: "Philosophy has practical applications in law, medicine, business, and technology. Ethical frameworks guide professional decision-making in complex situations.",
      8: "Every action has ethical implications. Consider consequences, duties, and virtues when making decisions that affect yourself and others.",
      9: "Different cultures have developed unique philosophical traditions. Eastern philosophy, African philosophy, and indigenous wisdom offer diverse perspectives on universal questions.",
      10: "Philosophical inquiry is an ongoing process. Integrate learned concepts to develop your own reasoned positions on important life questions."
    },
    "tech": {
      1: "Programming fundamentals include variables, data types, and control structures. These building blocks are essential regardless of which language you learn.",
      2: "Functions and methods organize code into reusable blocks. Understanding scope, parameters, and return values is crucial for writing clean code.",
      3: "Data structures like arrays, lists, and dictionaries store and organize information efficiently. Choosing the right structure impacts program performance.",
      4: "Algorithms are step-by-step procedures for solving problems. Search, sort, and traversal algorithms form the foundation of computer science.",
      5: "Object-oriented programming uses classes and objects to model real-world entities. Encapsulation, inheritance, and polymorphism are key principles.",
      6: "Working with databases requires understanding of queries, relationships, and data normalization. SQL is the standard language for relational databases.",
      7: "Testing and debugging are essential development skills. Write tests early, use debugging tools, and follow test-driven development practices.",
      8: "Performance optimization involves analyzing bottlenecks, reducing complexity, and using efficient algorithms. Profile code to identify areas for improvement.",
      9: "Security must be built into applications from the start. Input validation, encryption, and secure authentication protect against common attacks.",
      10: "Professional development requires version control, code review, documentation, and continuous learning. Build real projects to solidify your skills."
    }
  };
  
  const categoryContent = contentMap[category] || contentMap["tech"];
  return categoryContent[moduleNumber] || categoryContent[1];
}

function getQuizQuestion(category: string, moduleNumber: number): string {
  const questionsMap: Record<string, Record<number, { question: string; options: string[]; correct: number }>> = {
    "web2": {
      1: {
        question: "What does HTML stand for?",
        options: ["Hyper Text Markup Language", "High Tech Modern Language", "Home Tool Markup Language", "Hyperlinks and Text Markup Language"],
        correct: 0
      },
      2: {
        question: "Which CSS property controls text size?",
        options: ["text-size", "font-size", "text-style", "font-weight"],
        correct: 1
      },
      3: {
        question: "What is a media query used for?",
        options: ["Database queries", "Responsive design", "API requests", "Image optimization"],
        correct: 1
      },
      4: {
        question: "Which keyword declares a variable in JavaScript?",
        options: ["var, let, const", "int, float, string", "variable, value", "define, set"],
        correct: 0
      },
      5: {
        question: "What does the spread operator (...) do?",
        options: ["Multiplies numbers", "Expands arrays or objects", "Creates functions", "Defines classes"],
        correct: 1
      },
      6: {
        question: "What is the virtual DOM in React?",
        options: ["A database", "A lightweight copy of the real DOM", "A CSS framework", "A testing tool"],
        correct: 1
      },
      7: {
        question: "Which HTTP method is used to retrieve data?",
        options: ["POST", "PUT", "GET", "DELETE"],
        correct: 2
      },
      8: {
        question: "What is unit testing?",
        options: ["Testing individual code units", "Testing the entire application", "Testing user interfaces", "Testing databases"],
        correct: 0
      },
      9: {
        question: "What does HTTPS provide?",
        options: ["Faster loading", "Encrypted communication", "Better SEO only", "Automatic backups"],
        correct: 1
      },
      10: {
        question: "What is continuous deployment?",
        options: ["Manual code updates", "Automatic production releases", "Database backups", "Code reviews"],
        correct: 1
      }
    },
    "web3-intro": {
      1: {
        question: "What is a blockchain?",
        options: ["A type of database", "A distributed ledger", "A cryptocurrency", "A smart contract"],
        correct: 1
      },
      2: {
        question: "What was the first cryptocurrency?",
        options: ["Ethereum", "Bitcoin", "Litecoin", "Ripple"],
        correct: 1
      },
      3: {
        question: "What does NFT stand for?",
        options: ["New Financial Token", "Non-Fungible Token", "Network File Transfer", "Next Future Technology"],
        correct: 1
      },
      4: {
        question: "What is a private key?",
        options: ["Your wallet address", "A password for exchanges", "Secret code controlling your funds", "A public identifier"],
        correct: 2
      },
      5: {
        question: "What is DeFi?",
        options: ["Digital Finance", "Decentralized Finance", "Defined Finance", "Direct Finance"],
        correct: 1
      },
      6: {
        question: "What drives token value?",
        options: ["Only price", "Supply, demand, and utility", "Social media hype", "Government regulation"],
        correct: 1
      },
      7: {
        question: "What is a DAO?",
        options: ["Decentralized Autonomous Organization", "Digital Asset Operation", "Data Analysis Organization", "Distributed Application Object"],
        correct: 0
      },
      8: {
        question: "What are smart contracts?",
        options: ["Legal documents", "Self-executing code", "Trading strategies", "Wallet types"],
        correct: 1
      },
      9: {
        question: "How do you participate in Web3 governance?",
        options: ["Email voting", "Token-based voting", "Phone calls", "In-person meetings"],
        correct: 1
      },
      10: {
        question: "What is Layer 2 scaling?",
        options: ["Adding more servers", "Off-chain transaction processing", "Increasing block size", "Creating new blockchains"],
        correct: 1
      }
    },
    "philosophy": {
      1: {
        question: "What is philosophy primarily concerned with?",
        options: ["Scientific facts", "Fundamental questions", "Historical dates", "Mathematical proofs"],
        correct: 1
      },
      2: {
        question: "What is a logical fallacy?",
        options: ["A correct argument", "A flaw in reasoning", "A philosophical theory", "A type of debate"],
        correct: 1
      },
      3: {
        question: "Who was Socrates?",
        options: ["A Roman emperor", "An ancient Greek philosopher", "A mathematician", "A playwright"],
        correct: 1
      },
      4: {
        question: "What is consequentialism?",
        options: ["Ethics based on outcomes", "Ethics based on duties", "Ethics based on virtues", "Ethics based on religion"],
        correct: 0
      },
      5: {
        question: "What is critical thinking?",
        options: ["Being negative", "Analyzing arguments objectively", "Memorizing facts", "Following traditions"],
        correct: 1
      },
      6: {
        question: "What is applied ethics?",
        options: ["Ancient philosophy", "Ethics in real situations", "Theoretical debates", "Religious studies"],
        correct: 1
      },
      7: {
        question: "What should guide ethical decisions?",
        options: ["Only emotions", "Reason and principles", "Popular opinion", "Personal gain"],
        correct: 1
      },
      8: {
        question: "What is the trolley problem about?",
        options: ["Transportation", "Moral dilemmas", "Engineering", "History"],
        correct: 1
      },
      9: {
        question: "What is Eastern philosophy known for?",
        options: ["Pure logic", "Harmony and balance", "Individualism", "Materialism"],
        correct: 1
      },
      10: {
        question: "What is philosophical synthesis?",
        options: ["Rejecting all views", "Integrating different perspectives", "Creating confusion", "Avoiding questions"],
        correct: 1
      }
    },
    "tech": {
      1: {
        question: "What is a variable?",
        options: ["A constant value", "A container for data", "A function", "A loop"],
        correct: 1
      },
      2: {
        question: "What does a function return?",
        options: ["Nothing always", "A value or result", "Only numbers", "Only strings"],
        correct: 1
      },
      3: {
        question: "Which is a linear data structure?",
        options: ["Tree", "Graph", "Array", "Hash table"],
        correct: 2
      },
      4: {
        question: "What is time complexity?",
        options: ["Program runtime", "Algorithm efficiency measure", "Code length", "Memory usage"],
        correct: 1
      },
      5: {
        question: "What is encapsulation?",
        options: ["Hiding implementation details", "Creating loops", "Sorting data", "Testing code"],
        correct: 0
      },
      6: {
        question: "What is SQL?",
        options: ["A programming language", "A database query language", "A framework", "An operating system"],
        correct: 1
      },
      7: {
        question: "What is test-driven development?",
        options: ["Testing after coding", "Writing tests first", "No testing", "Manual testing only"],
        correct: 1
      },
      8: {
        question: "What is Big O notation?",
        options: ["A circle symbol", "Algorithm complexity notation", "A programming language", "A design pattern"],
        correct: 1
      },
      9: {
        question: "What is SQL injection?",
        options: ["A database feature", "A security vulnerability", "A query type", "A performance optimization"],
        correct: 1
      },
      10: {
        question: "What is version control?",
        options: ["Software pricing", "Tracking code changes", "Testing methodology", "Deployment strategy"],
        correct: 1
      }
    }
  };
  
  const categoryQuestions = questionsMap[category] || questionsMap["tech"];
  const questionData = categoryQuestions[moduleNumber] || categoryQuestions[1];
  return questionData.question;
}

function getQuizOptions(category: string, moduleNumber: number): string[] {
  const questionsMap: Record<string, Record<number, { question: string; options: string[]; correct: number }>> = {
    "web2": {
      1: { question: "", options: ["Hyper Text Markup Language", "High Tech Modern Language", "Home Tool Markup Language", "Hyperlinks and Text Markup Language"], correct: 0 },
      2: { question: "", options: ["text-size", "font-size", "text-style", "font-weight"], correct: 1 },
      3: { question: "", options: ["Database queries", "Responsive design", "API requests", "Image optimization"], correct: 1 },
      4: { question: "", options: ["var, let, const", "int, float, string", "variable, value", "define, set"], correct: 0 },
      5: { question: "", options: ["Multiplies numbers", "Expands arrays or objects", "Creates functions", "Defines classes"], correct: 1 },
      6: { question: "", options: ["A database", "A lightweight copy of the real DOM", "A CSS framework", "A testing tool"], correct: 1 },
      7: { question: "", options: ["POST", "PUT", "GET", "DELETE"], correct: 2 },
      8: { question: "", options: ["Testing individual code units", "Testing the entire application", "Testing user interfaces", "Testing databases"], correct: 0 },
      9: { question: "", options: ["Faster loading", "Encrypted communication", "Better SEO only", "Automatic backups"], correct: 1 },
      10: { question: "", options: ["Manual code updates", "Automatic production releases", "Database backups", "Code reviews"], correct: 1 }
    },
    "web3-intro": {
      1: { question: "", options: ["A type of database", "A distributed ledger", "A cryptocurrency", "A smart contract"], correct: 1 },
      2: { question: "", options: ["Ethereum", "Bitcoin", "Litecoin", "Ripple"], correct: 1 },
      3: { question: "", options: ["New Financial Token", "Non-Fungible Token", "Network File Transfer", "Next Future Technology"], correct: 1 },
      4: { question: "", options: ["Your wallet address", "A password for exchanges", "Secret code controlling your funds", "A public identifier"], correct: 2 },
      5: { question: "", options: ["Digital Finance", "Decentralized Finance", "Defined Finance", "Direct Finance"], correct: 1 },
      6: { question: "", options: ["Only price", "Supply, demand, and utility", "Social media hype", "Government regulation"], correct: 1 },
      7: { question: "", options: ["Decentralized Autonomous Organization", "Digital Asset Operation", "Data Analysis Organization", "Distributed Application Object"], correct: 0 },
      8: { question: "", options: ["Legal documents", "Self-executing code", "Trading strategies", "Wallet types"], correct: 1 },
      9: { question: "", options: ["Email voting", "Token-based voting", "Phone calls", "In-person meetings"], correct: 1 },
      10: { question: "", options: ["Adding more servers", "Off-chain transaction processing", "Increasing block size", "Creating new blockchains"], correct: 1 }
    },
    "philosophy": {
      1: { question: "", options: ["Scientific facts", "Fundamental questions", "Historical dates", "Mathematical proofs"], correct: 1 },
      2: { question: "", options: ["A correct argument", "A flaw in reasoning", "A philosophical theory", "A type of debate"], correct: 1 },
      3: { question: "", options: ["A Roman emperor", "An ancient Greek philosopher", "A mathematician", "A playwright"], correct: 1 },
      4: { question: "", options: ["Ethics based on outcomes", "Ethics based on duties", "Ethics based on virtues", "Ethics based on religion"], correct: 0 },
      5: { question: "", options: ["Being negative", "Analyzing arguments objectively", "Memorizing facts", "Following traditions"], correct: 1 },
      6: { question: "", options: ["Ancient philosophy", "Ethics in real situations", "Theoretical debates", "Religious studies"], correct: 1 },
      7: { question: "", options: ["Only emotions", "Reason and principles", "Popular opinion", "Personal gain"], correct: 1 },
      8: { question: "", options: ["Transportation", "Moral dilemmas", "Engineering", "History"], correct: 1 },
      9: { question: "", options: ["Pure logic", "Harmony and balance", "Individualism", "Materialism"], correct: 1 },
      10: { question: "", options: ["Rejecting all views", "Integrating different perspectives", "Creating confusion", "Avoiding questions"], correct: 1 }
    },
    "tech": {
      1: { question: "", options: ["A constant value", "A container for data", "A function", "A loop"], correct: 1 },
      2: { question: "", options: ["Nothing always", "A value or result", "Only numbers", "Only strings"], correct: 1 },
      3: { question: "", options: ["Tree", "Graph", "Array", "Hash table"], correct: 2 },
      4: { question: "", options: ["Program runtime", "Algorithm efficiency measure", "Code length", "Memory usage"], correct: 1 },
      5: { question: "", options: ["Hiding implementation details", "Creating loops", "Sorting data", "Testing code"], correct: 0 },
      6: { question: "", options: ["A programming language", "A database query language", "A framework", "An operating system"], correct: 1 },
      7: { question: "", options: ["Testing after coding", "Writing tests first", "No testing", "Manual testing only"], correct: 1 },
      8: { question: "", options: ["A circle symbol", "Algorithm complexity notation", "A programming language", "A design pattern"], correct: 1 },
      9: { question: "", options: ["A database feature", "A security vulnerability", "A query type", "A performance optimization"], correct: 1 },
      10: { question: "", options: ["Software pricing", "Tracking code changes", "Testing methodology", "Deployment strategy"], correct: 1 }
    }
  };
  
  const categoryQuestions = questionsMap[category] || questionsMap["tech"];
  const questionData = categoryQuestions[moduleNumber] || categoryQuestions[1];
  return questionData.options;
}

function getCorrectAnswer(category: string, moduleNumber: number): number {
  const questionsMap: Record<string, Record<number, { question: string; options: string[]; correct: number }>> = {
    "web2": {
      1: { question: "", options: [], correct: 0 },
      2: { question: "", options: [], correct: 1 },
      3: { question: "", options: [], correct: 1 },
      4: { question: "", options: [], correct: 0 },
      5: { question: "", options: [], correct: 1 },
      6: { question: "", options: [], correct: 1 },
      7: { question: "", options: [], correct: 2 },
      8: { question: "", options: [], correct: 0 },
      9: { question: "", options: [], correct: 1 },
      10: { question: "", options: [], correct: 1 }
    },
    "web3-intro": {
      1: { question: "", options: [], correct: 1 },
      2: { question: "", options: [], correct: 1 },
      3: { question: "", options: [], correct: 1 },
      4: { question: "", options: [], correct: 2 },
      5: { question: "", options: [], correct: 1 },
      6: { question: "", options: [], correct: 1 },
      7: { question: "", options: [], correct: 0 },
      8: { question: "", options: [], correct: 1 },
      9: { question: "", options: [], correct: 1 },
      10: { question: "", options: [], correct: 1 }
    },
    "philosophy": {
      1: { question: "", options: [], correct: 1 },
      2: { question: "", options: [], correct: 1 },
      3: { question: "", options: [], correct: 1 },
      4: { question: "", options: [], correct: 0 },
      5: { question: "", options: [], correct: 1 },
      6: { question: "", options: [], correct: 1 },
      7: { question: "", options: [], correct: 1 },
      8: { question: "", options: [], correct: 1 },
      9: { question: "", options: [], correct: 1 },
      10: { question: "", options: [], correct: 1 }
    },
    "tech": {
      1: { question: "", options: [], correct: 1 },
      2: { question: "", options: [], correct: 1 },
      3: { question: "", options: [], correct: 2 },
      4: { question: "", options: [], correct: 1 },
      5: { question: "", options: [], correct: 0 },
      6: { question: "", options: [], correct: 1 },
      7: { question: "", options: [], correct: 1 },
      8: { question: "", options: [], correct: 1 },
      9: { question: "", options: [], correct: 1 },
      10: { question: "", options: [], correct: 1 }
    }
  };
  
  const categoryQuestions = questionsMap[category] || questionsMap["tech"];
  const questionData = categoryQuestions[moduleNumber] || categoryQuestions[1];
  return questionData.correct;
}
