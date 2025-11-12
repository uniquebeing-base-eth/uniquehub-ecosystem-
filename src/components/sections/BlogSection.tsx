import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, CheckCircle2 } from "lucide-react";
import cubeLogo from "@/assets/uniquehub-cube.png";
import blogWeb3Image from "@/assets/blog-web3.jpg";
import blogEducationImage from "@/assets/blog-education-web3.jpg";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BlogArticle {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  date: string;
  category: string;
  readTime: string;
}

const articles: BlogArticle[] = [
  {
    id: "web3-terms-definitions",
    title: "Web3 Terms & Definitions: Your Complete Glossary",
    excerpt: "Navigate the Web3 ecosystem with confidence. Learn the essential terms and definitions that power blockchain, DeFi, NFTs, and decentralized applications.",
    content: `Understanding Web3 terminology is essential for anyone looking to participate in the decentralized internet. This comprehensive glossary covers the most important terms you'll encounter in the Web3 ecosystem.

**Blockchain & Core Concepts**

Blockchain: A distributed, immutable ledger that records transactions across many computers. Each "block" contains transaction data and is linked to the previous block, forming a "chain" that cannot be altered retroactively.

Smart Contract: Self-executing contracts with terms directly written into code. They automatically execute when predetermined conditions are met, eliminating the need for intermediaries.

Decentralization: The distribution of power, control, and data away from a central authority to a distributed network. This reduces single points of failure and censorship.

Gas Fees: Transaction fees paid to process operations on blockchain networks. These fees compensate validators/miners for the computational energy required to process and validate transactions.

**Tokens & Assets**

Cryptocurrency: Digital or virtual currency secured by cryptography, making it nearly impossible to counterfeit. Examples include Bitcoin (BTC), Ethereum (ETH), and USDC.

NFT (Non-Fungible Token): Unique digital assets that represent ownership of specific items or content. Unlike cryptocurrencies, each NFT is distinct and cannot be exchanged on a one-to-one basis.

Token: A digital asset created on a blockchain. Tokens can represent anything from currency to access rights, governance power, or ownership of physical/digital items.

Stablecoin: Cryptocurrencies designed to maintain a stable value by being pegged to reserve assets like the US Dollar. USDC and USDT are popular examples.

**DeFi (Decentralized Finance)**

DeFi: Financial services built on blockchain technology, operating without traditional intermediaries like banks. Users can lend, borrow, trade, and earn interest on crypto assets.

Liquidity Pool: Collections of cryptocurrencies locked in smart contracts, used to facilitate decentralized trading and lending. Users who contribute to pools earn rewards.

Yield Farming: The practice of staking or lending crypto assets to generate returns, typically in the form of additional cryptocurrency.

**Wallets & Security**

Wallet: Software or hardware that stores your private keys and allows you to send, receive, and manage cryptocurrency. Examples include MetaMask, Coinbase Wallet, and hardware wallets like Ledger.

Private Key: A secret cryptographic code that proves ownership of your crypto assets. Never share your private key – whoever has it controls your assets.

Public Address: Your wallet's public identifier, like an account number. You can safely share this to receive payments.

Seed Phrase: A series of 12-24 words that serves as a backup to recover your wallet. Store it securely offline and never share it with anyone.

**Ecosystem Terms**

DAO (Decentralized Autonomous Organization): An organization governed by smart contracts and community voting rather than centralized leadership. Members typically hold governance tokens that grant voting rights.

dApp (Decentralized Application): Applications that run on blockchain networks rather than centralized servers. They're open-source, transparent, and operate autonomously.

Layer 1: The base blockchain protocol (like Ethereum or Bitcoin). Layer 2 refers to scaling solutions built on top of Layer 1 networks.

Bridge: Technology that enables the transfer of assets and information between different blockchain networks.

**Web3 Culture**

WAGMI: "We're All Gonna Make It" - A popular encouraging phrase in the crypto community expressing optimism about Web3's future.

GM: "Good Morning" - A friendly greeting commonly used in Web3 communities regardless of time zone.

Diamond Hands: Holding onto assets despite volatility or downturns, showing strong conviction in long-term value.

Understanding these terms empowers you to navigate Web3 platforms like UniqueHub confidently. As the ecosystem evolves, new terms emerge, but these fundamentals remain essential for anyone entering the space.`,
    image: blogWeb3Image,
    date: "November 12, 2025",
    category: "Education",
    readTime: "7 min read"
  },
  {
    id: "about-uniquehub-platform",
    title: "About UniqueHub: Building the Future of Learn-to-Earn",
    excerpt: "Discover how UniqueHub is revolutionizing education and earning on the blockchain. Learn about our mission, features, and the ecosystem that connects tutors, learners, and creators worldwide.",
    content: `UniqueHub is more than just a platform – it's a movement to make learning and earning accessible to everyone, anywhere in the world. Built on the Base blockchain and integrated with Farcaster, we're creating an ecosystem where knowledge sharing directly translates to financial opportunity.

**Our Vision**

We believe that education should be borderless, rewarding, and accessible to all. Traditional education systems often create barriers through high costs, geographic limitations, and lack of immediate economic opportunity. UniqueHub breaks down these barriers by combining blockchain technology with innovative learning mechanisms.

Our vision is to onboard millions of tutors, creators, and learners onto Web3, making blockchain technology practical and beneficial for everyday activities. We're not just teaching about Web3 – we're showing people how to use it to improve their lives.

**The UniqueHub Ecosystem**

UniqueHub operates as a super app with multiple interconnected features:

**For Tutors & Educators**: Share your knowledge and expertise by creating courses on any topic – from Web3 and blockchain to traditional skills, life hacks, and creative talents. Earn directly from course sales with 98% of revenue going to you (only 2% platform fee). List courses for free or charge in USDC, giving you complete control over monetization.

**For Learners**: Access a diverse library of courses taught by real people with real expertise. Earn rewards for completing courses and get verifiable NFT certificates upon completion. These certificates live on the blockchain, providing permanent proof of your achievements that you can share anywhere.

**For Creators**: List and sell digital products, NFTs, and creative works in our marketplace. Connect with a global audience of Web3 enthusiasts and collectors. Every transaction is on-chain, transparent, and secure.

**For Everyone**: Complete daily tasks to earn UP points that can be exchanged for $UNIQ tokens. Participate in our leaderboard system to compete for top rankings. Track all your earnings, achievements, and progress in one place.

**Why Base & Farcaster?**

We chose to build on Base blockchain because it offers fast, low-cost transactions that make microtransactions and learning rewards practical. Base's integration with Coinbase also provides easier onboarding for users new to Web3.

Our Farcaster integration brings social features directly into the learning experience. Share your achievements, discover new courses through your network, and build your reputation in the Web3 community. The combination creates a seamless experience where social, educational, and financial activities flow together naturally.

**Meet the Founder**

UniqueHub was founded by @uniquebeing404 (uniquebeing.base.eth), a passionate advocate for Web3 education and accessibility. With a vision to bridge traditional education with blockchain innovation, uniquebeing built UniqueHub to demonstrate how Web3 can create real-world value for everyday people.

**Our Commitment**

We're committed to maintaining a platform that prioritizes:

- **Transparency**: All transactions and smart contracts are open and verifiable on-chain
- **Security**: Your assets and data are protected by blockchain technology and best practices
- **Accessibility**: Low fees and user-friendly interfaces ensure everyone can participate
- **Quality**: Curated courses and verified tutors maintain educational standards
- **Community**: Your feedback shapes our development and feature priorities

**Join the Movement**

Whether you're a tutor ready to share knowledge, a learner seeking to grow, or a creator looking for an audience, UniqueHub welcomes you. We're building the future of education and earning together – one course, one NFT, one achievement at a time.

Start your journey today. Learn, earn, and grow with UniqueHub on Base.`,
    image: blogEducationImage,
    date: "November 12, 2025",
    category: "Platform",
    readTime: "6 min read"
  },
  {
    id: "uniquehub-features-updates",
    title: "UniqueHub Features & Updates: Courses, Earn, and NFT Certificates",
    excerpt: "Explore the latest features powering UniqueHub: comprehensive course platform, earning opportunities, and blockchain-verified NFT certificates. See what's new and what's coming next.",
    content: `UniqueHub continues to evolve with powerful features designed to maximize your learning and earning potential. Here's an in-depth look at our core features and latest updates.

**Course Platform: Learn & Teach Anything**

Our course platform empowers anyone to become a tutor while providing learners with diverse educational content.

**For Tutors:**
- Create unlimited courses on any topic – Web3, technology, creative skills, life hacks, and more
- Upload video content with thumbnail customization
- Set your own pricing in USDC or offer free courses
- Earn 98% of all course sales (only 2% platform fee)
- Track your earnings in real-time through your tutor dashboard
- List courses on-chain for transparent, verifiable transactions

**For Learners:**
- Browse courses by category, price, or popularity
- Preview courses before enrolling
- Stream high-quality video content (download disabled for creator protection)
- Track your progress through each course
- Engage with course content and other learners
- Complete courses to earn NFT certificates

**Recent Course Updates:**
- Added course ratings system with star ratings and user count display
- Implemented accurate enrollment counting for course popularity metrics
- Fixed video progress tracking at 25%, 50%, 75%, and 98%+ completion milestones
- Improved course navigation and user interface
- Enhanced thumbnail display and course preview functionality

**Earning System: Get Rewarded for Participation**

UniqueHub rewards active participation through our comprehensive earning system.

**Daily Tasks:**
- Complete simple actions like check-ins, reading blog articles, and engaging with content
- Earn UP points for each completed task
- Exchange UP points for $UNIQ tokens
- Track your progress on the leaderboard

**Leaderboard Competition:**
- Compete with other users for top rankings
- View total points earned and money earned by top users
- See earnings broken down by ETH and USDC
- Clickable usernames link to user profiles
- Farcaster profile pictures display for social connection

**Creator Earnings:**
- Tutors earn from course sales automatically
- Creators earn from marketplace sales
- All earnings visible in wallet section separated by asset type (ETH/USDC)
- Transparent on-chain transaction history

**Recent Earning Updates:**
- Added comprehensive leaderboard with points and money earned
- Implemented creator earnings dashboard
- Enhanced wallet display with combined balance view
- Improved task completion verification
- Added share-to-earn features for viral growth

**NFT Certificates: Proof of Achievement**

Our newest feature brings blockchain-verified credentials to course completion.

**Certificate Features:**
- Automatically generated upon course completion (98%+ video watched)
- Beautiful, branded certificate design featuring:
  - Your Farcaster username and profile picture
  - Course title and completion date
  - UniqueHub blue cube logo and branding
  - Unique certificate ID
- Minted as non-transferable NFTs on Base blockchain
- Extremely low minting cost: 0.0000001 ETH (~$0.0003)
- Downloadable as images for sharing
- Viewable on Basescan for blockchain verification
- Share certificates directly to Farcaster with one click

**Certificate Process:**
1. Complete a course (watch 98%+ of video content)
2. Click "Generate Certificate" in course viewer
3. AI generates your personalized certificate image
4. Mint the certificate as an NFT for minimal gas
5. Download, share, or view on blockchain explorers

**Certificate Gallery:**
Access all your minted certificates through the new Certificates section in the menu. View your complete achievement history, download certificates, verify on-chain, and share your accomplishments.

**Recent Certificate Updates:**
- Deployed CertificateNFT smart contract on Base (0x3b224A9254ebdB475CDbC12693a1F33Db9E12105)
- Created certificate generation edge function with AI-powered image creation
- Built certificate claim component with status tracking
- Added certificates gallery section in menu
- Implemented share functionality for certificate achievements
- Added certificate preview before minting

**What's Coming Next**

We're constantly improving UniqueHub based on community feedback. Upcoming features include:

- Enhanced marketplace with advanced filtering
- Direct messaging between tutors and learners
- Course bundles and subscription options
- Mobile app for iOS and Android
- Additional earning opportunities through gamification
- Expanded certificate customization options
- Course completion badges and achievements
- Community governance through DAOs

**Technical Foundation**

All UniqueHub features are built on solid technical foundations:
- Smart contracts on Base blockchain for transparency and security
- Farcaster integration for social features and identity
- Supabase backend for scalable data management
- Wagmi for reliable wallet connections
- AI-powered features through Lovable AI Gateway

**Join Our Growing Community**

With thousands of courses, millions in potential earnings, and a thriving community of learners and creators, UniqueHub is becoming the premier destination for Web3 education and earning.

Start exploring today – create a course, complete a task, or earn your first NFT certificate. The future of learning and earning is here on UniqueHub.`,
    image: blogWeb3Image,
    date: "November 12, 2025",
    category: "Updates",
    readTime: "8 min read"
  },
  {
    id: "what-is-web3",
    title: "Understanding Web3: The Future of the Internet",
    excerpt: "Web3 represents a paradigm shift in how we interact with the internet, moving from centralized platforms to decentralized systems powered by blockchain technology.",
    content: `Web3, also known as Web 3.0, represents the third generation of internet services, emphasizing decentralization, blockchain technologies, and token-based economics. Unlike Web 2.0, where data and content are centralized in the hands of a few major corporations, Web3 envisions a future where users have ownership and control over their data, digital assets, and online identities.

At its core, Web3 is built on blockchain technology, which enables peer-to-peer transactions without intermediaries. This fundamental shift has profound implications for how we conduct business, share information, and interact online. Smart contracts, which are self-executing agreements with terms directly written into code, automate processes and eliminate the need for traditional intermediaries in many transactions.

The key characteristics of Web3 include decentralization, where no single entity controls the network; transparency, as all transactions are recorded on public blockchains; and user sovereignty, giving individuals control over their data and digital assets. This creates new opportunities for creators, developers, and users to participate in the digital economy on more equitable terms.

Web3 technologies enable various applications including decentralized finance (DeFi), which provides financial services without traditional banks; non-fungible tokens (NFTs), which represent unique digital ownership; and decentralized autonomous organizations (DAOs), which enable community-driven governance. These innovations are reshaping industries from finance and art to gaming and education.

The transition to Web3 is not without challenges. Scalability issues, high transaction costs on some networks, and complex user experiences remain barriers to widespread adoption. Additionally, regulatory uncertainty and the need for better security practices are ongoing concerns. However, continuous technological improvements and growing community support suggest that Web3 will play an increasingly important role in shaping the future of the internet.

References:
- Gavin Wood, "Why We Need Web 3.0," Ethereum Foundation, 2014
- Chris Dixon, "Why Web3 Matters," Future, 2021
- World Economic Forum, "Decentralized Finance: On Blockchain- and Smart Contract-Based Financial Markets," 2021`,
    image: blogWeb3Image,
    date: "November 9, 2025",
    category: "Education",
    readTime: "5 min read"
  },
  {
    id: "education-in-web3",
    title: "The Importance of Education in Web3: Building the Future Together",
    excerpt: "Education is the cornerstone of Web3 adoption. As we transition to a decentralized internet, understanding blockchain technology and its applications becomes essential for everyone.",
    content: `As Web3 technologies continue to evolve and reshape the digital landscape, education has become more critical than ever. The complexity of blockchain systems, smart contracts, and decentralized applications requires a well-informed community that understands both the opportunities and risks associated with these technologies. Education serves as the bridge between Web3's potential and its practical implementation.

The traditional education system has been slow to incorporate Web3 concepts into curricula, creating a significant knowledge gap. This gap is particularly concerning given the rapid pace of innovation in the space. Self-directed learning and community-driven education platforms have emerged to fill this void, offering accessible resources for individuals seeking to understand and participate in the Web3 ecosystem. These platforms democratize access to knowledge, allowing anyone with an internet connection to learn about blockchain technology, cryptocurrency, and decentralized applications.

UniqueHub exemplifies this educational approach by creating a platform where knowledge sharing meets blockchain technology. By enabling tutors to teach Web3 concepts while learners earn rewards for their progress, we create a sustainable ecosystem that incentivizes both teaching and learning. This learn-to-earn model aligns individual incentives with collective benefit, fostering a more educated and capable Web3 community.

The importance of Web3 education extends beyond technical knowledge. Understanding the philosophical and economic principles underlying decentralization helps individuals make informed decisions about their participation in Web3 networks. This includes recognizing the implications of digital ownership, understanding the risks and benefits of decentralized finance, and appreciating the potential for blockchain technology to create more equitable systems.

Looking ahead, Web3 education must evolve to meet diverse learning needs. This includes developing accessible educational materials for beginners, creating advanced technical resources for developers, and providing business-focused content for entrepreneurs and organizations. By prioritizing education, we ensure that Web3 technologies are developed and deployed responsibly, benefiting society as a whole rather than a select few.

References:
- MIT Technology Review, "Why Web3 Education Matters Now," 2023
- ConsenSys, "The State of Blockchain Education," 2024
- Harvard Business Review, "Preparing Your Organization for Web3," 2024`,
    image: blogEducationImage,
    date: "November 9, 2025",
    category: "Community",
    readTime: "6 min read"
  }
];

export const BlogSection = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleArticleRead = async (articleId: string) => {
    if (!user) return;

    // Map article IDs to task IDs
    const taskIdMap: { [key: string]: string } = {
      'web3-terms-definitions': 'read-blog-web3-terms',
      'about-uniquehub-platform': 'read-blog-about-uniquehub',
      'uniquehub-features-updates': 'read-blog-features-updates',
      'what-is-web3': 'read-blog-web3',
      'education-in-web3': 'read-blog-education',
    };

    const taskId = taskIdMap[articleId];
    if (!taskId) return;

    try {
      // Check if task already completed
      const { data: existing } = await supabase
        .from('task_completions')
        .select('id')
        .eq('user_id', user.id)
        .eq('task_id', taskId)
        .maybeSingle();

      if (existing) return; // Already completed

      // Mark as completed automatically
      const { error } = await supabase.functions.invoke('complete-task', {
        body: { taskId },
      });

      if (!error) {
        toast({
          title: "Task completed!",
          description: "You earned points for reading this article",
        });
      }
    } catch (error) {
      console.error('Error completing blog task:', error);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-foreground">UniqueHub Blog</h1>
        <p className="text-sm text-muted-foreground">
          Insights, updates, and education from the UniqueHub community
        </p>
      </div>

      <div className="space-y-4">
        {articles.map((article) => (
          <Card key={article.id} className="overflow-hidden hover:border-primary/50 transition-colors">
            <img 
              src={article.image} 
              alt={article.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {article.category}
                </Badge>
                <span className="text-xs text-muted-foreground">{article.readTime}</span>
              </div>
              
              <h2 className="text-lg font-bold text-foreground leading-tight">
                {article.title}
              </h2>
              
              <p className="text-sm text-muted-foreground leading-relaxed">
                {article.excerpt}
              </p>

              <div className="flex items-center gap-4 pt-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <img src={cubeLogo} alt="UniqueHub" className="w-4 h-4" />
                  <span className="font-medium">@uniquehub</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{article.date}</span>
                </div>
              </div>

              <details 
                className="pt-2"
                onToggle={(e) => {
                  const isOpen = (e.target as HTMLDetailsElement).open;
                  if (isOpen) {
                    handleArticleRead(article.id);
                  }
                }}
              >
                <summary className="text-sm font-semibold text-primary cursor-pointer hover:underline">
                  Read full article
                </summary>
                <div className="mt-4 space-y-4 text-sm text-foreground leading-relaxed whitespace-pre-line">
                  {article.content}
                </div>
              </details>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};