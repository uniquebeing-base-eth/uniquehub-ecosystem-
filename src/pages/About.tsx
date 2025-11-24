const About = () => {
  return (
    <div className="space-y-4 pb-24 animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground">About UniqueHub</h1>
      <div className="p-5 bg-card rounded-2xl border border-border space-y-4">
        <div className="space-y-3">
          <p className="text-foreground leading-relaxed text-sm">
            UniqueHub is a super app for learning, earning, and trading, built to empower people to share knowledge and grow financially. All powered by the Base blockchain.
          </p>
          <p className="text-foreground leading-relaxed text-sm">
            On UniqueHub, anyone can teach or learn any skill from Web3 and tech to Web2 skills, life hacks, and creative talents. It's a global hub for tutors, learners, creators, and gamers to connect, grow, and earn together.
          </p>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-base font-bold text-foreground">Our Ecosystem</h3>
          <div className="space-y-2 text-sm">
            <p className="text-foreground">🎓 <span className="font-semibold">Tutors:</span> share skills and earn on-chain.</p>
            <p className="text-foreground">💰 <span className="font-semibold">Learners:</span> take courses and get rewarded for progress.</p>
            <p className="text-foreground">🛍️ <span className="font-semibold">Creators:</span> list and sell digital products or NFTs.</p>
            <p className="text-foreground">🎮 <span className="font-semibold">Players:</span> enjoy games like Unique Runner to earn points and redeem $UNIQ tokens.</p>
          </div>
        </div>
        
        <div className="pt-3 border-t border-border">
          <h3 className="text-base font-bold text-foreground mb-2">Our Mission</h3>
          <p className="text-foreground text-sm leading-relaxed">
            To make learning and earning borderless, rewarding, and accessible for everyone. Onboarding tutors, creators, and learners across the world onto Base.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;
