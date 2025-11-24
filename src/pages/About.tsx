const About = () => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">About UniqueHub</h1>
        <p className="text-muted-foreground">Learn more about our platform</p>
      </div>
      
      <div className="bg-card rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">Our Mission</h2>
        <p className="text-muted-foreground">
          UniqueHub is a revolutionary Web3 learning and marketplace platform that combines education, 
          NFTs, and cryptocurrency to create a unique ecosystem for creators and learners.
        </p>
        
        <h2 className="text-xl font-semibold mt-6">What We Offer</h2>
        <ul className="list-disc list-inside text-muted-foreground space-y-2">
          <li>Interactive blockchain courses and tutorials</li>
          <li>NFT marketplace for unique digital assets</li>
          <li>Earn rewards through learning and participation</li>
          <li>Quest-based learning with competitive pools</li>
          <li>Certificate minting for course completion</li>
        </ul>
      </div>
    </div>
  );
};

export default About;
