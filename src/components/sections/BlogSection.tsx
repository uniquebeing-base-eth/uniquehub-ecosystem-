import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User } from "lucide-react";
import cubeLogo from "@/assets/uniquehub-cube.png";
import blogWeb3Image from "@/assets/blog-web3.jpg";
import blogEducationImage from "@/assets/blog-education-web3.jpg";

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
  }
];

export const BlogSection = () => {
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

              <details className="pt-2">
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
