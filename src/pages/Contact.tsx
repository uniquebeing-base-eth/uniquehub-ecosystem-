const Contact = () => {
  return (
    <div className="space-y-4 pb-24 animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground">Contact Us</h1>
      <div className="p-5 bg-card rounded-2xl border border-border space-y-4">
        <p className="text-foreground leading-relaxed text-sm">
          We'd love to hear from you! Whether you're a tutor, learner, or Web3 builder looking to collaborate, reach out to us:
        </p>
        <div className="space-y-3 pt-2">
          <div className="flex items-start gap-3">
            <span className="text-lg">📩</span>
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-semibold text-foreground">support@uniquehub.xyz</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">🌐</span>
            <div>
              <p className="text-xs text-muted-foreground">Website</p>
              <p className="text-sm font-semibold text-foreground">uniquehub.xyz</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">💬</span>
            <div>
              <p className="text-xs text-muted-foreground">Farcaster</p>
              <p className="text-sm font-semibold text-foreground">@_uniquehub and @uniquebeing404</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
