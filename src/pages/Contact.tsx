const Contact = () => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Contact Us</h1>
        <p className="text-muted-foreground">Get in touch with our team</p>
      </div>
      
      <div className="bg-card rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">Reach Out</h2>
        <p className="text-muted-foreground">
          Have questions or feedback? We'd love to hear from you!
        </p>
        
        <div className="space-y-3 mt-6">
          <div className="flex items-center gap-3">
            <span className="font-medium">Email:</span>
            <a href="mailto:hello@uniquehub.xyz" className="text-primary hover:underline">
              hello@uniquehub.xyz
            </a>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="font-medium">Twitter:</span>
            <a href="https://twitter.com/uniquehub" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              @uniquehub
            </a>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="font-medium">Discord:</span>
            <a href="https://discord.gg/uniquehub" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Join our community
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
