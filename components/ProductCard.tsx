import React from 'react';
import type { Product } from '../types';
import { useAppContext } from '../contexts/AppContext';
import { HeartIcon } from './IconComponents';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { 
    setCurrentView, 
    isEffectivelyNSFW, 
    currentUser, 
    wishlist, 
    addToWishlist, 
    removeFromWishlist 
  } = useAppContext();

  const isNSFW = isEffectivelyNSFW(product);
  const isInWishlist = wishlist.includes(product.id);

  const now = new Date();
  const expiresAt = new Date(product.expiresAt);
  const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 3600 * 24));
  const isExpiringSoon = product.status === 'available' && daysLeft > 0 && daysLeft <= 7;

  const handleViewDetails = () => {
    setCurrentView({ name: 'productDetail', productId: product.id });
  };
  
  const handleWishlistToggle = (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent card click
      if (!currentUser) {
          alert('Please log in to use the wishlist feature.');
          return;
      }
      if (isInWishlist) {
          removeFromWishlist(product.id);
      } else {
          addToWishlist(product.id);
      }
  };

  const getButtonText = () => {
    if (product.status === 'sold') return 'Sold';
    if (product.status === 'expired') return 'Expired';
    return 'View Details';
  };

  return (
    <div className="group relative bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300">
       {currentUser && (
        <button
            onClick={handleWishlistToggle}
            aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            className="absolute top-2 right-2 z-20 p-2 rounded-full bg-white/70 text-gray-700 hover:text-red-500 hover:bg-white transition-all"
        >
            <HeartIcon className="w-6 h-6" filled={isInWishlist} />
        </button>
       )}
       {isExpiringSoon && (
        <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full z-20">
          Expiring Soon
        </div>
       )}
       {isNSFW && (
        <div className={`absolute left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full z-20 ${isExpiringSoon ? 'top-9' : 'top-2'}`}>
          NSFW
        </div>
      )}
       {product.status === 'sold' && (
        <div className="absolute inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-10">
          <span className="text-white text-xl font-bold bg-black bg-opacity-60 px-4 py-2 rounded">SOLD</span>
        </div>
      )}
      {product.status === 'expired' && (
        <div className="absolute inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-10">
          <span className="text-white text-xl font-bold bg-black bg-opacity-60 px-4 py-2 rounded">EXPIRED</span>
        </div>
      )}
      <div className="w-full h-64 bg-gray-200" onClick={handleViewDetails} role="button" tabIndex={0}>
        <img
          src={product.imageUrl}
          alt={product.title}
          className="w-full h-full object-cover object-center"
        />
      </div>
      <div className="p-4">
        <h3 className="text-sm font-medium text-gray-500">{product.sellerName}</h3>
        <h4 className="text-base font-semibold text-gray-800 mt-1 truncate group-hover:text-indigo-600 transition-colors">
          {product.title}
        </h4>
        <div className="flex justify-between items-center mt-3">
          <p className="text-lg font-bold text-gray-900">${product.price.toFixed(2)}</p>
          <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{product.condition}</span>
        </div>
        <button 
            onClick={handleViewDetails}
            className="mt-4 w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 opacity-0 group-hover:opacity-100 transition-all duration-300 disabled:bg-gray-400"
            disabled={product.status === 'sold' || product.status === 'expired'}
        >
          {getButtonText()}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;