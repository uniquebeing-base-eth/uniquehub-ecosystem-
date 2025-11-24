import { Helmet } from "react-helmet-async";

const Contact = () => {
  return (
    <>
      <Helmet>
        <title>Contact UniqueHub - Get in Touch</title>
        <meta name="description" content="Contact UniqueHub team. Have questions or feedback? Reach out via email, Twitter or Discord" />
        <meta property="og:title" content="Contact UniqueHub - Get in Touch" />
        <meta property="og:description" content="Contact UniqueHub team. Have questions or feedback? Reach out via email, Twitter or Discord" />
        <meta property="og:image" content="https://uniqueehub.vercel.app/opengraph-image.png" />
        <meta property="og:url" content="https://uniqueehub.vercel.app/contact" />
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:button:1" content="Contact Us" />
        <meta property="fc:frame:button:1:action" content="link" />
        <meta property="fc:frame:button:1:target" content="https://uniqueehub.vercel.app/contact" />
      </Helmet>
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
    </>
  );
};

export default Contact;
