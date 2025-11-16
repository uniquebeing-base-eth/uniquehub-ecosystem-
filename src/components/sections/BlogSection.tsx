import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import cubeLogo from "@/assets/uniquehub-cube.png";
import blogWeb3Image from "@/assets/blog-web3.jpg";
import blogEducationImage from "@/assets/blog-education-web3.jpg";
import uniqbotAvatar from "@/assets/uniqbot-avatar.png";
import blogBlueEnergyNFTs from "@/assets/blog-blue-energy-nfts.jpg";
import blogCreativityCampaign from "@/assets/blog-creativity-campaign.jpg";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ShareToFarcaster } from "@/components/ShareToFarcaster";

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
  },
  {
    id: "web3-terms-definitions",
    title: "Web3 Terms & Definitions: Your Essential Glossary",
    excerpt: "Understanding the language of Web3 is essential for navigating this new digital frontier. This comprehensive guide breaks down the key terms and concepts you need to know.",
    content: `Blockchain: A distributed ledger technology that records transactions across multiple computers in a way that makes it nearly impossible to alter retroactively. Think of it as a digital ledger that everyone can see but no one can erase.

Cryptocurrency: Digital or virtual currency secured by cryptography, operating independently of central banks. Bitcoin and Ethereum are the most well-known examples.

Smart Contract: Self-executing contracts with terms directly written into code. They automatically execute when predetermined conditions are met, eliminating the need for intermediaries.

NFT (Non-Fungible Token): A unique digital asset that represents ownership of a specific item or piece of content on the blockchain. Unlike cryptocurrencies, each NFT is distinct and cannot be exchanged on a one-to-one basis.

Wallet: A digital tool that allows you to store, send, and receive cryptocurrencies and other digital assets. Wallets can be software-based (hot wallets) or hardware-based (cold wallets).

DeFi (Decentralized Finance): Financial services built on blockchain technology that operate without traditional intermediaries like banks. DeFi applications include lending platforms, decentralized exchanges, and yield farming protocols.

DAO (Decentralized Autonomous Organization): An organization governed by smart contracts and community voting rather than centralized leadership. Members hold tokens that give them voting rights on organizational decisions.

Gas Fees: Transaction fees paid to process and validate transactions on a blockchain network. These fees compensate miners or validators for their computational work.

Minting: The process of creating a new NFT or cryptocurrency token on the blockchain. Once minted, the asset is permanently recorded on the blockchain.

Staking: The process of locking up cryptocurrency holdings to support network operations and security, typically earning rewards in return.

dApp (Decentralized Application): Applications that run on a blockchain network rather than being controlled by a single entity. They operate autonomously through smart contracts.

Layer 2: Scaling solutions built on top of main blockchain networks (Layer 1) to improve transaction speed and reduce costs while maintaining security.

HODL: Originally a misspelling of "hold," it has become a term meaning to hold onto cryptocurrency investments for the long term despite market volatility.

Understanding these fundamental terms is the first step toward confidently navigating the Web3 ecosystem. As you explore UniqueHub and other Web3 platforms, you'll encounter these concepts regularly, making this foundational knowledge essential for your journey.`,
    image: blogWeb3Image,
    date: "November 12, 2025",
    category: "Education",
    readTime: "4 min read"
  },
  {
    id: "about-uniquehub",
    title: "UniqueHub: Redefining Learning, Earning, and Building in Web3",
    excerpt: "In a rapidly evolving digital world, UniqueHub is shaping the future of how people learn, earn, and grow in Web3. It's more than a platform — it's a connected ecosystem.",
    content: `In a rapidly evolving digital world, UniqueHub is shaping the future of how people learn, earn, and grow in Web3. It's more than a platform — it's a connected ecosystem built to empower creators, learners, and entrepreneurs through blockchain technology.

What Is UniqueHub?

UniqueHub is a decentralized platform that blends education, commerce, and community. It allows users to learn skills, earn rewards, and build income streams, all within a single blockchain-powered environment.

The platform is built on three major pillars:

1. Learn
Access courses on Web3, blockchain, design, business, and more. Each completed course rewards users with UNIQ Points, turning learning into a rewarding experience.

2. Earn
Through the Earning Section, users can promote listed products and earn commissions. This creates a micro-economy where everyone can grow together while contributing to the ecosystem's expansion.

3. Market
The UniqueHub Marketplace enables users to list and sell physical products, NFTs, or digital collections, with payments supported in USDC or ETH — both on the Base blockchain. It's an easy and secure way for anyone to participate in the Web3 economy.

Why UniqueHub Stands Out

UniqueHub doesn't stop at learning. It transforms user engagement into real value through reward-based participation:

Complete courses and tasks to earn UNIQ Points.
Convert those points into $UNIQ tokens during the Token Generation Event (TGE).
Use or trade tokens within the ecosystem.

This model makes learning not just educational but financially empowering, aligning motivation with opportunity.

Community and Vision

UniqueHub's mission is to onboard one million tutors, students, educators, craftsmen, scientists, and creators into Web3. It's a global effort to connect people who have skills to share with those eager to learn — powered by blockchain transparency and trust.

UNIQ Token — The Heart of the Ecosystem

The $UNIQ token fuels the entire UniqueHub experience. It serves as a utility and reward token for learners, tutors, and marketplace participants. By earning or holding UNIQ, users unlock deeper engagement, exclusive benefits, and governance participation.

The Future of Web3 Education

UniqueHub is building more than a platform — it's building a movement where learning meets opportunity, creativity meets technology, and every contribution is rewarded.

As the world embraces decentralized systems, UniqueHub is positioning itself as a gateway for individuals to learn, earn, and thrive in the Web3 space.`,
    image: blogEducationImage,
    date: "November 12, 2025",
    category: "Community",
    readTime: "5 min read"
  },
  {
    id: "uniquehub-features-updates",
    title: "UniqueHub Features: Where Learning, Technology, and Rewards Meet",
    excerpt: "UniqueHub continues to evolve as a powerful Web3 ecosystem built to make learning, earning, and building easier for everyone.",
    content: `UniqueHub continues to evolve as a powerful Web3 ecosystem built to make learning, earning, and building easier for everyone. Designed for both new and experienced Web3 users, it brings together blockchain innovation, user empowerment, and seamless interaction — all in one ecosystem.

Here's a look at the core features that make UniqueHub stand out:

1. Learn and Earn with UNIQ Points

At the heart of UniqueHub is a learn-to-earn model. Users can take Web3-focused courses — from blockchain development to digital creativity — and earn UNIQ Points for every completed lesson or course.

These points are more than just progress markers; they represent real value within the ecosystem and can later be converted into $UNIQ tokens during the Token Generation Event (TGE).

Learning on UniqueHub isn't just about gaining knowledge — it's about being rewarded for growing.

2. Mintable Certificate NFTs

One of the latest additions to UniqueHub is the Mint Certificate NFT feature.

When users complete a course, they can now generate a personalized certificate and mint it directly to their wallet as an NFT. This certificate acts as verifiable on-chain proof of achievement, showcasing the user's progress and credibility across the Web3 world.

It's education meeting digital ownership — a perfect blend of learning and blockchain innovation.

3. UniqBot — Your Personal AI Guide

To make navigation effortless, UniqueHub introduces UniqBot, an intelligent AI assistant that lives inside the platform.

UniqBot is available across all pages, ready to answer user questions, explain features, or guide them through any section of the app. Users can simply tap the UniqBot icon, ask questions, and get instant help — creating an interactive and human-like experience within the platform.

Whether you're new to Web3 or a regular user, UniqBot ensures you're never lost on your journey.

4. Marketplace for Products and Digital Collections

The UniqueHub Marketplace is where creativity meets opportunity. Users can list and sell physical products, digital art, NFTs, or other digital assets, and receive payments in USDC or ETH on the Base network.

It's a secure and decentralized marketplace designed for creators, builders, and entrepreneurs to connect and trade freely in Web3.

5. Earning Section — Grow by Helping Others

UniqueHub also features an Earning Section, where users can earn commissions by helping others promote and sell listed products. It's a community-driven model that rewards collaboration and contribution, allowing anyone to generate income while supporting the ecosystem's growth.

6. Gamified Progress and Community Growth

From XP-style progression to randomized notifications and missions, UniqueHub adds a fun twist to learning and engagement. Each interaction — whether it's completing a course, promoting an item, or chatting with UniqBot — contributes to your overall growth within the ecosystem.

The Future of UniqueHub

With features like mintable NFTs, AI integration, and on-chain rewards, UniqueHub isn't just keeping up with Web3 — it's leading it. Every update brings users closer to a fully decentralized, interactive, and rewarding experience where learning directly leads to opportunity.

UniqueHub is not just an app. It's an ecosystem — where learning is rewarded, achievements are owned, and every user becomes part of the future.`,
    image: blogEducationImage,
    date: "November 12, 2025",
    category: "Updates",
    readTime: "5 min read"
  },
  {
    id: "meet-uniqbot",
    title: "Meet UniqBot — Your AI Education Assistant on UniqueHub",
    excerpt: "In the evolving world of Web3 education, guidance is key. That's why UniqueHub introduces UniqBot, your always-available AI education assistant.",
    content: `In the evolving world of Web3 education, guidance is key. That's why UniqueHub introduces UniqBot, your always-available AI education assistant designed to make learning and exploring the ecosystem easier, smarter, and more interactive.

UniqBot isn't just another chatbot — it's a personal guide, mentor, and helper all in one.

What Is UniqBot?

UniqBot is the built-in AI assistant that lives across the entire UniqueHub platform. It's designed to assist users in real-time, helping them understand how UniqueHub works, where to find things, and how to make the most of every feature — from learning courses to minting certificates.

UniqBot brings a human touch to digital learning by making the platform intuitive, conversational, and personalized.

How Users Can Access UniqBot

UniqBot is available on every page of the UniqueHub app. You'll find it as a small movable avatar or icon on your screen. Users can:

1. Tap or click on the UniqBot icon to open the chat interface.
2. Ask any question — about courses, earning, the marketplace, tokens, or account setup.
3. Receive instant responses and guidance, powered by AI trained to understand UniqueHub's features and user flow.

The chat window pops up neatly from the bottom of the screen, allowing users to ask questions without interrupting their learning or browsing experience.

What UniqBot Can Do

UniqBot is built to make your journey through UniqueHub effortless. Here's what it can help you with:

Platform Navigation: Guides you on how to find courses, join the earning section, access your dashboard, or visit the marketplace.

Learning Support: Helps you understand how to enroll in a course, complete modules, and earn UNIQ Points.

Token & Points Info: Explains how UNIQ Points work, how they can be converted into $UNIQ tokens, and what role they play in the ecosystem.

Mint Certificate Guidance: Walks you through how to generate and mint your course certificate as an NFT to your wallet once you complete a course.

Marketplace Assistance: Offers quick guidance on how to list products, sell digital collections, and receive payments in USDC or ETH on the Base network.

General Help & FAQs: Answers general questions, explains new features, and provides tips for getting the best experience on UniqueHub.

Smart Conversations: Learns from user interactions to offer more personalized assistance over time, helping both new and returning users feel at home.

Why UniqBot Matters

UniqBot represents the future of interactive learning — where users don't just click through menus but actually converse with their platform.

It removes confusion, saves time, and makes onboarding effortless, especially for users who are new to Web3. With UniqBot, education on blockchain becomes more human, accessible, and enjoyable.

A Step Toward Smarter Education

By integrating UniqBot, UniqueHub is redefining how users experience education in a decentralized world. It's not just about learning blockchain — it's about living it through seamless technology that listens, guides, and evolves with you.

UniqBot is your personal AI guide to mastering Web3 — one question, one course, and one achievement at a time.`,
    image: uniqbotAvatar,
    date: "November 12, 2025",
    category: "Features",
    readTime: "4 min read"
  },
  {
    id: "blue-energy-nfts",
    title: "Introducing UniqueHub Blue Energy NFTs: Your Identity, Your Power",
    excerpt: "At UniqueHub, we are building more than a platform. We are creating a connected family of creators, learners, and innovators. Every member of this family deserves an identity that reflects who they are.",
    content: `At UniqueHub, we are building more than a platform. We are creating a connected family of creators, learners, and innovators. Every member of this family deserves an identity that reflects who they are.

This is why we introduced the UniqueHub Blue Energy NFTs, a personal avatar that represents your presence across the entire UniqueHub ecosystem.

What Are Blue Energy NFTs?

Blue Energy NFTs are custom avatars powered by the signature UniqueHub blue aura. Each NFT represents:

● Your personal identity on UniqueHub
● Your membership within the UniqueHub family
● Your creativity, energy, and contribution
● Your unique presence that distinguishes you from everyone else

Every user is allowed to mint only one NFT, making it a permanent, recognizable identity that stays with you throughout your journey on the platform.

These avatars function as:

■ Your visual signature
■ Your identity badge
■ Your onchain passport within UniqueHub

Why This Matters

● A stronger sense of belonging in the community
● A clear personal brand across your activities, courses, and interactions
● A verifiable onchain identity that represents you everywhere
● Eligibility for future features, gated experiences, and community rewards

Your avatar is your stamp of uniqueness and powered by blue energy and defined by your individuality.

Mint yours and step fully into what makes you truly unique.`,
    image: blogBlueEnergyNFTs,
    date: "November 14, 2025",
    category: "NFTs",
    readTime: "3 min read"
  },
  {
    id: "creativity-campaign",
    title: "The UniqueHub Creativity Campaign: Show How Unique You Are",
    excerpt: "At UniqueHub, we believe everyone has something valuable to share — a skill, a talent, an idea, or a passion. To encourage this, we are launching a Creativity Campaign designed to highlight and reward the unique abilities within our community.",
    content: `At UniqueHub, we believe everyone has something valuable to share — a skill, a talent, an idea, or a passion.

To encourage this, we are launching a Creativity Campaign designed to highlight and reward the unique abilities within our community.

Purpose of the Campaign

This initiative gives every user the opportunity to express themselves and turn their creativity into a course or project onchain.

It is a stage for originality, authenticity, and skill.

How to Participate

● Create something that is truly unique.
It could be a talent, a skill, a creative work, or even a short mini-course about something you're good at.

● Upload your creation on UniqueHub as a course.
This showcases your ability and allows others to learn from you.

● Tag the official channel /uniquehub so your entry is recognized.

Prizes

■ The top 10 most unique entries will receive rewards in USDC.
Selection will be based on creativity, originality, execution, and uniqueness.

Why You Should Participate

● A chance to showcase your individuality
● An opportunity to share knowledge or talent with a global audience
● The ability to build your onchain creative identity
● A platform to unlock recognition within the UniqueHub community

This campaign is an invitation to step forward and demonstrate what makes you different.

Your uniqueness is your strength — and this is your moment to display it.`,
    image: blogCreativityCampaign,
    date: "November 15, 2025",
    category: "Campaign",
    readTime: "3 min read"
  }
];

export const BlogSection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sharedArticles, setSharedArticles] = useState<string[]>([]);

  const handleArticleRead = async (articleId: string) => {
    if (!user) return;

    // Map article IDs to task IDs
    const taskIdMap: { [key: string]: string } = {
      'what-is-web3': 'read-blog-web3',
      'education-in-web3': 'read-blog-education',
      'web3-terms-definitions': 'read-blog-web3-terms',
      'about-uniquehub': 'read-blog-about-uniquehub',
      'uniquehub-features-updates': 'read-blog-features-updates',
      'meet-uniqbot': 'read-blog-uniqbot',
      'blue-energy-nfts': 'read-blog-blue-energy-nfts',
      'creativity-campaign': 'read-blog-creativity-campaign',
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

  const handleShareSuccess = async (articleId: string) => {
    if (!user || sharedArticles.includes(articleId)) return;

    const shareTaskId = `share-blog-${articleId}`;
    
    try {
      // Check if already shared
      const { data: existing } = await supabase
        .from('task_completions')
        .select('id')
        .eq('user_id', user.id)
        .eq('task_id', shareTaskId)
        .maybeSingle();

      if (existing) return;

      // Award points for sharing
      const { error } = await supabase.functions.invoke('complete-task', {
        body: { taskId: shareTaskId },
      });

      if (!error) {
        setSharedArticles([...sharedArticles, articleId]);
        toast({
          title: "Points earned!",
          description: "You earned 50 UP for sharing this article",
        });
      }
    } catch (error) {
      console.error('Error awarding share points:', error);
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
        {[...articles].reverse().map((article) => (
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

              <div className="flex items-center justify-between pt-2">
                <details 
                  className="flex-1"
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
                
                <div onClick={(e) => e.stopPropagation()}>
                  <ShareToFarcaster
                    text={`Just read "${article.title}" on @uniquehub 🔥\n\n${article.excerpt}\n\nCheck it out on UniqueHub! 🚀`}
                    embeds={['https://uniquehub.lovable.app']}
                    variant="ghost"
                    size="icon"
                    buttonText="Share"
                  />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};