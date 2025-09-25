interface NFTCardProps {
  title: string;
  price: string;
  currency: string;
  image?: string;
  gradient?: string;
}

export const NFTCard = ({ title, price, currency, image, gradient }: NFTCardProps) => {
  return (
    <div className="bg-gradient-card rounded-xl p-6 shadow-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-glow cursor-pointer group">
      <div className="mb-4">
        {image ? (
          <img src={image} alt={title} className="w-20 h-20 rounded-lg object-cover mx-auto" />
        ) : (
          <div className={`w-20 h-20 rounded-lg mx-auto ${gradient || 'bg-gradient-primary'} flex items-center justify-center`}>
            <div className="w-12 h-12 bg-foreground/20 rounded-lg"></div>
          </div>
        )}
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <div className="text-primary font-bold text-lg">
        {price} {currency}
      </div>
    </div>
  );
};