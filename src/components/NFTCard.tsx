

interface NFTCardProps {
  title: string;
  price: string;
  currency: string;
  image?: string;
  gradient?: string;
  icon?: React.ReactNode;
}


export const NFTCard = ({ title, price, currency, image, gradient, icon }: NFTCardProps) => {
  return (
    <div className="bg-gradient-card rounded-xl p-6 shadow-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-glow cursor-pointer group">
      <div className="mb-4 flex justify-center">
        {icon ? (
          <div className="flex justify-center">{icon}</div>
        ) : image ? (
          <img src={image} alt={title} className="w-16 h-16 rounded-lg object-cover" />
        ) : (
          <div className={`w-16 h-16 rounded-lg ${gradient || 'bg-gradient-primary'} flex items-center justify-center`}>
            <div className="w-10 h-10 bg-foreground/20 rounded-lg"></div>
          </div>
        )}
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2 text-center">{title}</h3>
      <div className="text-success font-bold text-lg text-center">
        {price} {currency}
      </div>
    </div>
  );
};
